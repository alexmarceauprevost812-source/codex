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

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "codex-app",
  };
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
      return jsonError(
        `Contenu manquant pour ${f.path}.`,
        400,
      );
    }
  }

  const headers = ghHeaders(token);
  const apiBase = `https://api.github.com/repos/${repo}`;

  // 1. Resolve the latest commit SHA on the branch.
  const refRes = await fetch(
    `${apiBase}/git/refs/heads/${encodeURIComponent(branch)}`,
    { headers },
  );
  if (refRes.status === 404) {
    return jsonError(
      `Branche '${branch}' introuvable sur ${repo}.`,
      404,
    );
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

  // 2. Create a blob for each file (utf-8 encoded).
  const blobs = await Promise.all(
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
  ).catch((error: unknown) => {
    return error instanceof Error ? error : new Error(String(error));
  });

  if (blobs instanceof Error) {
    return jsonError(blobs.message, 500);
  }

  // 3. Build a new tree on top of the existing one.
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

  // 4. Create the commit.
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

  // 5. Fast-forward the branch ref.
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

  return new Response(
    JSON.stringify({
      ok: true,
      sha: commit.sha,
      url: commit.html_url,
      files: files.length,
      branch,
      repo,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
