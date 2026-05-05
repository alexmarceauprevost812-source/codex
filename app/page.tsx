import type { User } from "@supabase/supabase-js";

import { AuthButton } from "@/components/auth-button";
import { ChatInterface } from "@/components/chat-interface";
import { GhostChat } from "@/components/ghost-chat";
import { ModelPicker } from "@/components/model-picker";
import { Sidebar } from "@/components/sidebar";
import { isAnthropicConfigured } from "@/lib/chat/anthropic";
import { getGitInfo } from "@/lib/git-info";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    // Network errors, invalid Supabase config, etc. — render as logged out.
    return null;
  }
}

export default async function Home() {
  const authEnabled = isSupabaseConfigured();
  const aiEnabled = isAnthropicConfigured();
  const [user, gitInfo] = await Promise.all([getCurrentUser(), getGitInfo()]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-h-dvh flex-col sm:ml-64">
        <header className="flex items-center justify-between gap-4 px-6 py-4 pl-16 sm:pl-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Codex</h1>
            {!aiEnabled ? (
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--fg-60)]">
                IA non configurée
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <GhostChat />
            <ModelPicker />
            <AuthButton user={user} enabled={authEnabled} />
          </div>
        </header>
        <ChatInterface
          branch={gitInfo.branch}
          added={gitInfo.added}
          removed={gitInfo.removed}
        />
      </div>
    </main>
  );
}
