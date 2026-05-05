"use client";

import { useTypewriter } from "@/lib/chat/typewriter";

import type { Message } from "./chat-interface";
import { MarkdownContent } from "./markdown-content";

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isStreaming = !!message.streaming;
  const showCursor = isStreaming && !message.error;

  // Smooth letter-by-letter reveal for assistant messages while streaming.
  // User messages and final assistant content render immediately.
  const displayed = useTypewriter(
    message.content,
    isUser || !isStreaming,
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-2 rounded-3xl px-5 py-3 text-sm text-[var(--fg)] shadow-sm backdrop-blur-md ${
          isUser
            ? "bg-[var(--user-bubble)] leading-relaxed"
            : "border border-[var(--border-soft)] bg-[var(--assist-bubble)]"
        }`}
      >
        {message.attachments && message.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {message.attachments.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-2.5 py-1 text-xs text-[var(--fg-80)]"
              >
                <FileIcon />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <span className="text-[var(--fg-40)]">
                  {formatSize(file.size)}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        {displayed ? (
          isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{displayed}</p>
          ) : (
            <div className="relative">
              <MarkdownContent text={displayed} />
              {showCursor ? <Cursor /> : null}
            </div>
          )
        ) : showCursor ? (
          <p className="text-[var(--fg-60)]">
            Codex réfléchit
            <Cursor />
          </p>
        ) : null}

        {message.error ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {message.error}
          </p>
        ) : null}

        {message.commit ? <CommitBanner commit={message.commit} /> : null}
      </div>
    </div>
  );
}

function CommitBanner({
  commit,
}: {
  commit: { status: "pending" | "ok" | "error"; message?: string; url?: string; files?: number };
}) {
  if (commit.status === "pending") {
    return (
      <p className="rounded-xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-2 text-xs text-[var(--fg-70)]">
        Push vers GitHub en cours…
      </p>
    );
  }
  if (commit.status === "error") {
    return (
      <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">
        Push échoué : {commit.message ?? "erreur inconnue"}
      </p>
    );
  }
  return (
    <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
      ✓ {commit.files ?? 0} fichier{(commit.files ?? 0) > 1 ? "s" : ""} poussé(s).{" "}
      {commit.url ? (
        <a
          href={commit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Voir le commit
        </a>
      ) : null}
    </p>
  );
}

function Cursor() {
  return (
    <span
      className="ml-0.5 inline-block h-3.5 w-[2px] -translate-y-[1px] animate-pulse bg-[var(--fg)] align-middle"
      aria-hidden="true"
    />
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
