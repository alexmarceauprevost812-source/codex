import { AuthButton } from "@/components/auth-button";
import { ChatInterface } from "@/components/chat-interface";
import { ModelPicker } from "@/components/model-picker";
import { Sidebar } from "@/components/sidebar";
import { VideoStage } from "@/components/video-stage";
import { isAnthropicConfigured } from "@/lib/chat/anthropic";
import { getGitInfo } from "@/lib/git-info";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const authEnabled = isSupabaseConfigured();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  const gitInfo = await getGitInfo();
  const aiEnabled = isAnthropicConfigured();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <VideoStage src="/videos/background.mp4">
        <Sidebar />
        <div className="ml-16 flex min-h-screen flex-col">
          <header className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">Codex</h1>
              {!aiEnabled ? (
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--fg-60)]">
                  IA non configurée
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
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
      </VideoStage>
    </main>
  );
}
