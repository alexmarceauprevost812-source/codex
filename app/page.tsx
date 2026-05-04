import { AuthButton } from "@/components/auth-button";
import { ChatInterface } from "@/components/chat-interface";
import { VideoStage } from "@/components/video-stage";
import { createServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <VideoStage src="/videos/background.mp4">
        <header className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Codex</h1>
          <AuthButton user={user} />
        </header>
        <ChatInterface />
      </VideoStage>
    </main>
  );
}
