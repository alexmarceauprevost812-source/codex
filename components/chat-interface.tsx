"use client";

import { useCallback, useRef, useState } from "react";

import { parseFileBlocks } from "@/lib/chat/parse-files";
import {
  filesToAttachments,
  streamChat,
  type ClientAttachment,
  type ClientMessage,
  type CommitState,
} from "@/lib/chat/client";

import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { ChatMetaBar } from "./chat-meta-bar";
import { useTheme, type GithubProject } from "./theme-provider";

export type Attachment = ClientAttachment;
export type Message = ClientMessage;

export function ChatInterface({
  branch,
  added,
  removed,
}: {
  branch: string | null;
  added: number;
  removed: number;
}) {
  const { model, apiKey, githubProject, autoCommit } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const updateMessage = useCallback(
    (id: string, patch: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  const handleSend = useCallback(
    async (content: string, files: File[]) => {
      if (isStreaming) return;

      let attachments: ClientAttachment[];
      try {
        attachments = await filesToAttachments(files);
      } catch (error) {
        const text =
          error instanceof Error ? error.message : "Erreur de fichier";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            error: text,
          },
        ]);
        return;
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      const assistantId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
        model,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let finalContent = "";
      try {
        const history: Message[] = [...messages, userMessage];
        for await (const event of streamChat(history, model, {
          mode: "codex",
          apiKey,
          signal: controller.signal,
        })) {
          if (event.type === "text") {
            finalContent += event.text;
            updateMessage(assistantId, { content: finalContent });
          } else if (event.type === "error") {
            updateMessage(assistantId, {
              error: event.error,
              streaming: false,
            });
          }
        }
      } catch (error) {
        if (
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          const text =
            error instanceof Error ? error.message : "Erreur de streaming";
          updateMessage(assistantId, { error: text, streaming: false });
        }
      } finally {
        updateMessage(assistantId, { streaming: false });
        setIsStreaming(false);
        abortRef.current = null;

        if (autoCommit && githubProject) {
          await runAutoCommit(
            assistantId,
            finalContent,
            content,
            githubProject,
            updateMessage,
          );
        }
      }
    },
    [apiKey, autoCommit, githubProject, isStreaming, messages, model, updateMessage],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-44 pt-6">
      <div className="flex-1 space-y-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-6 pl-4 sm:pl-20">
        <div className="mx-auto max-w-3xl">
          <ChatMetaBar branch={branch} added={added} removed={removed} />
          <ChatInput
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  );
}

async function runAutoCommit(
  messageId: string,
  assistantContent: string,
  userPrompt: string,
  project: GithubProject,
  update: (id: string, patch: Partial<Message>) => void,
) {
  const files = parseFileBlocks(assistantContent);
  if (files.length === 0) return;

  const pending: CommitState = { status: "pending" };
  update(messageId, { commit: pending });

  const commitMessage = userPrompt.trim()
    ? `Codex: ${userPrompt.trim().slice(0, 64)}`
    : `Codex: update ${files.map((f) => f.path).join(", ").slice(0, 100)}`;

  try {
    const res = await fetch("/api/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: project.token,
        repo: project.repo,
        branch: project.branch,
        message: commitMessage,
        files: files.map((f) => ({ path: f.path, content: f.content })),
      }),
    });
    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) errMsg = data.error;
      } catch {
        // ignore
      }
      update(messageId, {
        commit: { status: "error", message: errMsg },
      });
      return;
    }
    const data = (await res.json()) as {
      ok: boolean;
      url: string;
      files: number;
    };
    update(messageId, {
      commit: {
        status: "ok",
        url: data.url,
        files: data.files,
      },
    });
  } catch (error) {
    update(messageId, {
      commit: {
        status: "error",
        message:
          error instanceof Error ? error.message : "Erreur réseau inconnue.",
      },
    });
  }
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-medium tracking-tight">
        Bienvenue dans Codex
      </h2>
      <p className="mt-2 text-sm text-[var(--fg-60)]">
        Posez une question, joignez des fichiers, ou dictez à la voix.
      </p>
    </div>
  );
}
