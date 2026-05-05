"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { useTheme } from "./theme-provider";

export function ConnectionsSettings() {
  const supabase = createClient();
  const supabaseConfigured = supabase !== null;

  const {
    githubProject,
    connectGithubProject,
    disconnectGithubProject,
    autoCommit,
    setAutoCommit,
  } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  // Form state for the project connection
  const [tokenDraft, setTokenDraft] = useState(githubProject?.token ?? "");
  const [repoDraft, setRepoDraft] = useState(githubProject?.repo ?? "");
  const [branchDraft, setBranchDraft] = useState(
    githubProject?.branch ?? "main",
  );
  const [revealToken, setRevealToken] = useState(false);
  const [verifyState, setVerifyState] = useState<
    | { kind: "idle" }
    | { kind: "checking" }
    | { kind: "ok"; defaultBranch: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    setTokenDraft(githubProject?.token ?? "");
    setRepoDraft(githubProject?.repo ?? "");
    setBranchDraft(githubProject?.branch ?? "main");
  }, [githubProject]);

  useEffect(() => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setLoaded(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!cancelled) setUser(session?.user ?? null);
      },
    );
    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signInWithGitHub() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setBusy(false);
    }
  }

  const repoLooksValid = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repoDraft);
  const tokenLooksValid = tokenDraft.trim().length > 10;
  const canConnect = tokenLooksValid && repoLooksValid && branchDraft.trim();

  async function handleConnect() {
    if (!canConnect) return;
    setVerifyState({ kind: "checking" });
    try {
      const res = await fetch(`https://api.github.com/repos/${repoDraft}`, {
        headers: {
          Authorization: `Bearer ${tokenDraft}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (res.status === 401) {
        setVerifyState({
          kind: "error",
          message: "Token invalide ou expiré.",
        });
        return;
      }
      if (res.status === 404) {
        setVerifyState({
          kind: "error",
          message: "Repo introuvable ou token sans accès au repo.",
        });
        return;
      }
      if (!res.ok) {
        setVerifyState({
          kind: "error",
          message: `GitHub a répondu ${res.status}.`,
        });
        return;
      }
      const data = (await res.json()) as { default_branch: string };
      const finalBranch = branchDraft.trim() || data.default_branch || "main";
      connectGithubProject({
        token: tokenDraft.trim(),
        repo: repoDraft.trim(),
        branch: finalBranch,
      });
      setVerifyState({ kind: "ok", defaultBranch: data.default_branch });
    } catch (error) {
      setVerifyState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Erreur réseau inconnue.",
      });
    }
  }

  function handleDisconnect() {
    disconnectGithubProject();
    setTokenDraft("");
    setRepoDraft("");
    setBranchDraft("main");
    setVerifyState({ kind: "idle" });
  }

  return (
    <div className="space-y-4">
      <ConnectionRow
        icon="🟩"
        title="Supabase"
        statusLabel={supabaseConfigured ? "Configurée" : "Non configurée"}
        statusColor={supabaseConfigured ? "ok" : "muted"}
      >
        {supabaseConfigured ? (
          <p className="text-xs text-[var(--fg-50)]">
            Le serveur utilise <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        ) : (
          <p className="text-xs text-[var(--fg-50)]">
            Définissez <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel
            (Project&nbsp;Settings → Environment Variables) pour activer
            la connexion.
          </p>
        )}
      </ConnectionRow>

      <ConnectionRow
        icon="🐙"
        title="GitHub — Authentification"
        statusLabel={
          !loaded
            ? "Chargement…"
            : !supabaseConfigured
              ? "Indisponible"
              : user
                ? "Connecté"
                : "Déconnecté"
        }
        statusColor={user ? "ok" : "muted"}
      >
        {!supabaseConfigured ? (
          <p className="text-xs text-[var(--fg-50)]">
            La connexion GitHub OAuth passe par Supabase Auth — configurez
            Supabase d'abord.
          </p>
        ) : !loaded ? (
          <p className="text-xs text-[var(--fg-50)]">Vérification…</p>
        ) : user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--fg)]">
                {(user.user_metadata?.user_name as string | undefined) ??
                  user.email ??
                  "Connecté"}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-[var(--fg-50)]">
                  {user.email}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={busy}
              className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg-70)] transition hover:text-[var(--fg)] disabled:opacity-50"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGitHub}
            disabled={busy}
            className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)] transition hover:opacity-90 disabled:opacity-50"
          >
            <GitHubIcon />
            Se connecter avec GitHub
          </button>
        )}
      </ConnectionRow>

      <ConnectionRow
        icon="📦"
        title="Projet GitHub (auto-commit)"
        statusLabel={
          githubProject
            ? `Connecté à ${githubProject.repo}`
            : "Non connecté"
        }
        statusColor={githubProject ? "ok" : "muted"}
      >
        {githubProject ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-[var(--fg)]">
                <span className="font-mono">{githubProject.repo}</span>{" "}
                <span className="text-[var(--fg-50)]">
                  · branche <span className="font-mono">{githubProject.branch}</span>
                </span>
              </p>
              <p className="text-xs text-[var(--fg-50)]">
                Codex pousse automatiquement les fichiers générés vers ce projet
                quand l'auto-commit est activé.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-[var(--soft-surface)] px-3 py-2">
              <span className="text-sm text-[var(--fg-80)]">
                Auto-commit après chaque réponse
              </span>
              <Switch
                checked={autoCommit}
                onChange={() => setAutoCommit(!autoCommit)}
              />
            </label>

            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg-70)] transition hover:text-[var(--fg)]"
            >
              Déconnecter le projet
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--fg-50)]">
              Ajoutez un <strong>Personal Access Token</strong> avec le scope{" "}
              <code>repo</code> et le repo cible{" "}
              (<a
                href="https://github.com/settings/tokens/new?scopes=repo&description=Codex"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--accent)] underline-offset-2 hover:text-[var(--fg)]"
              >
                créer un token
              </a>
              ) pour activer le push automatique.
            </p>

            <div className="space-y-2">
              <Field label="Personal Access Token (ghp_…)">
                <div className="flex items-center gap-2">
                  <input
                    type={revealToken ? "text" : "password"}
                    value={tokenDraft}
                    onChange={(e) => setTokenDraft(e.target.value)}
                    placeholder="ghp_..."
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 rounded-xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-40)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setRevealToken((r) => !r)}
                    className="rounded-full p-1.5 text-[var(--fg-60)] transition hover:bg-[var(--user-bubble)] hover:text-[var(--fg)]"
                    aria-label={revealToken ? "Masquer" : "Afficher"}
                    title={revealToken ? "Masquer" : "Afficher"}
                  >
                    {revealToken ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </Field>
              <Field label="Repo (owner/repo)">
                <input
                  type="text"
                  value={repoDraft}
                  onChange={(e) => setRepoDraft(e.target.value)}
                  placeholder="alexmarceauprevost812-source/codex"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-40)] focus:border-[var(--accent)] focus:outline-none"
                />
              </Field>
              <Field label="Branche">
                <input
                  type="text"
                  value={branchDraft}
                  onChange={(e) => setBranchDraft(e.target.value)}
                  placeholder="main"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-40)] focus:border-[var(--accent)] focus:outline-none"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-2">
              {verifyState.kind === "error" ? (
                <p className="text-xs text-red-400">{verifyState.message}</p>
              ) : verifyState.kind === "checking" ? (
                <p className="text-xs text-[var(--fg-50)]">
                  Vérification du token…
                </p>
              ) : (
                <p className="text-xs text-[var(--fg-50)]">
                  Le token est stocké localement, jamais sur le serveur.
                </p>
              )}
              <button
                type="button"
                onClick={handleConnect}
                disabled={!canConnect || verifyState.kind === "checking"}
                className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {verifyState.kind === "checking"
                  ? "Vérification…"
                  : "Connecter le projet"}
              </button>
            </div>
          </div>
        )}
      </ConnectionRow>
    </div>
  );
}

function ConnectionRow({
  icon,
  title,
  statusLabel,
  statusColor,
  children,
}: {
  icon: string;
  title: string;
  statusLabel: string;
  statusColor: "ok" | "muted";
  children: React.ReactNode;
}) {
  const statusClasses =
    statusColor === "ok"
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-[var(--soft-surface)] text-[var(--fg-50)]";
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--fg)]">
          <span aria-hidden="true">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--fg-60)]">{label}</label>
      {children}
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full transition ${
        checked ? "bg-[var(--accent)]" : "bg-[var(--user-bubble)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.45 18.45 0 0 1-3.17 4.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
