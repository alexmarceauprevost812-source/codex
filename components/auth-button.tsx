"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function AuthButton({
  user,
  enabled,
}: {
  user: User | null;
  enabled: boolean;
}) {
  const router = useRouter();

  async function signInWithGitHub() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
  }

  if (!enabled) {
    return (
      <span
        className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-xs text-[var(--fg-60)]"
        title="Configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY"
      >
        Auth non configurée
      </span>
    );
  }

  if (user) {
    const label =
      (user.user_metadata?.user_name as string | undefined) ??
      user.email ??
      "Connecté";
    return (
      <div className="flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 backdrop-blur">
        <span className="text-sm text-[var(--fg-80)]">{label}</span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full bg-[var(--user-bubble)] px-3 py-1 text-xs font-medium text-[var(--fg)] transition hover:opacity-80"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={signInWithGitHub}
      className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-text)] shadow-lg transition hover:opacity-90"
    >
      <GitHubIcon />
      Se connecter avec GitHub
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
