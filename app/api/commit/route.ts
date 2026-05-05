import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommitFile = { path: string; content: string };

type RequestBody = {
  token?: string;
  repo?: string; // "owner/repo"
  branch?: string;
  message?: string;
  files?: CommitFile[];
};

const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_PATH_RE = /^[A-Za-z0-9_./-]+$/;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonOk(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "codex-app",
  };
}

function toBase64Utf8(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64");
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonError("Corps JSON invalide.", 400);
  }

  const token = (body.token ?? "").trim();
  const repo = (body.repo ?? "").trim();
  const branch = (body.branch ?? "main").trim();
  const message = (body.message ?? "Codex auto-commit").trim();
  const files = Array.isArray(body.files) ? body.files : [];

  if (!token || token.length < 10) {
    return jsonError("Token GitHub manquant.", 400);
  }
  if (!REPO_RE.test(repo)) {
    return jsonError("Repo invalide. Attendu : owner/repo.", 400);
  }
  if (!branch) {
    return jsonError("Branche invalide.", 400);
  }
  if (files.length === 0) {
    return jsonError("Aucun fichier à pousser.", 400);
  }
  for (const f of files) {
    if (
      typeof f.path !== "string" ||
      !SAFE_PATH_RE.test(f.path) ||
      f.path.includes("..") ||
      f.path.startsWith("/")
    ) {
      return jsonError(`Chemin de fichier invalide : ${String(f.path)}.`, 400);
    }
    if (typeof f.content !== "string") {
      return jsonError(`Contenu manquant pour ${f.path}.`, 400);
    }
  }

  const headers = ghHeaders(token);
  const apiBase = `https://api.github.com/repos/${repo}`;

  // Resolve the latest commit on the branch.
  const refRes = await fetch(
    `${apiBase}/git/refs/heads/${encodeURIComponent(branch)}`,
    { headers },
  );

  // 409 from this endpoint means the repo is empty (no commits at all).
  // The Git Data API cannot operate without a base commit, so we fall
  // back to the Contents API which is allowed to create the very first
  // commit on the default branch.
  if (refRes.status === 409) {
    return await commitViaContentsApi({
      apiBase,
      headers,
      branch,
      message,
      files,
      repo,
    });
  }

  if (refRes.status === 404) {
    // Branch missing on a non-empty repo. Contents API can create it
    // from the default branch's tip if the user picked a fresh name.
    return await commitViaContentsApi({
      apiBase,
      headers,
      branch,
      message,
      files,
      repo,
    });
  }

  if (!refRes.ok) {
    return jsonError(
      `GitHub a refusé de lire la branche (${refRes.status}).`,
      refRes.status,
    );
  }

  const ref = (await refRes.json()) as { object: { sha: string } };
  const baseCommitSha = ref.object.sha;

  const baseCommitRes = await fetch(
    `${apiBase}/git/commits/${baseCommitSha}`,
    { headers },
  );
  if (!baseCommitRes.ok) {
    return jsonError(
      `Lecture du commit de base échouée (${baseCommitRes.status}).`,
      baseCommitRes.status,
    );
  }
  const baseCommit = (await baseCommitRes.json()) as {
    tree: { sha: string };
  };

  // Create one blob per file (utf-8 encoded).
  let blobs: Array<{ path: string; sha: string }>;
  try {
    blobs = await Promise.all(
      files.map(async (f) => {
        const res = await fetch(`${apiBase}/git/blobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content: f.content, encoding: "utf-8" }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Création du blob pour ${f.path} échouée (${res.status}): ${text}`,
          );
        }
        const data = (await res.json()) as { sha: string };
        return { path: f.path, sha: data.sha };
      }),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : String(error),
      500,
    );
  }

  // Build a tree on top of the existing one.
  const treeRes = await fetch(`${apiBase}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });
  if (!treeRes.ok) {
    const text = await treeRes.text();
    return jsonError(
      `Création de l'arbre échouée (${treeRes.status}): ${text}`,
      treeRes.status,
    );
  }
  const tree = (await treeRes.json()) as { sha: string };

  // Create the commit.
  const commitRes = await fetch(`${apiBase}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [baseCommitSha],
    }),
  });
  if (!commitRes.ok) {
    const text = await commitRes.text();
    return jsonError(
      `Création du commit échouée (${commitRes.status}): ${text}`,
      commitRes.status,
    );
  }
  const commit = (await commitRes.json()) as {
    sha: string;
    html_url: string;
  };

  // Fast-forward the branch ref.
  const updateRes = await fetch(
    `${apiBase}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: commit.sha, force: false }),
    },
  );
  if (!updateRes.ok) {
    const text = await updateRes.text();
    return jsonError(
      `Mise à jour de la branche échouée (${updateRes.status}): ${text}`,
      updateRes.status,
    );
  }

  return jsonOk({
    ok: true,
    sha: commit.sha,
    url: commit.html_url,
    files: files.length,
    branch,
    repo,
  });
}

/**
 * Fallback when the Git Data API can't operate (empty repo, missing
 * branch). Uses the Contents API one file at a time. Each call is its
 * own commit — not atomic, but it's the only path GitHub exposes that
 * can bootstrap an empty repo.
 */
async function commitViaContentsApi(args: {
  apiBase: string;
  headers: Record<string, string>;
  branch: string;
  message: string;
  files: CommitFile[];
  repo: string;
}) {
  const { apiBase, headers, branch, message, files, repo } = args;

  let lastCommit: { sha: string; html_url: string } | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = encodeURIComponent(file.path).replace(/%2F/g, "/");

    // Check if the file already exists on this branch — needed for
    // the `sha` parameter on update.
    let existingSha: string | undefined;
    const getRes = await fetch(
      `${apiBase}/contents/${path}?ref=${encodeURIComponent(branch)}`,
      { headers },
    );
    if (getRes.ok) {
      const existing = (await getRes.json()) as { sha?: string };
      existingSha = existing.sha;
    }
    // 404, 409 (empty repo), or other non-OK statuses: treat as new file.

    const fileMessage =
      files.length === 1
        ? message
        : `${message} (${i + 1}/${files.length}: ${file.path})`;

    const putBody: Record<string, unknown> = {
      message: fileMessage,
      content: toBase64Utf8(file.content),
      branch,
    };
    if (existingSha) putBody.sha = existingSha;

    const putRes = await fetch(`${apiBase}/contents/${path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(putBody),
    });
    if (!putRes.ok) {
      const text = await putRes.text();
      const hint =
        putRes.status === 422 && i === 0
          ? " — Le repo est vide ; GitHub n'autorise la création que sur la branche par défaut. Réessayez avec branche = main."
          : "";
      return jsonError(
        `Écriture de ${file.path} échouée (${putRes.status}): ${text}${hint}`,
        putRes.status,
      );
    }
    const data = (await putRes.json()) as {
      commit: { sha: string; html_url: string };
    };
    lastCommit = data.commit;
  }

  if (!lastCommit) {
    return jsonError("Aucun fichier n'a été poussé.", 500);
  }

  return jsonOk({
    ok: true,
    sha: lastCommit.sha,
    url: lastCommit.html_url,
    files: files.length,
    branch,
    repo,
  });
}
