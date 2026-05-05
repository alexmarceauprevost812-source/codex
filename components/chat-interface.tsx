"use client";

import { useCallback, useRef, useState } from "react";

import { parseFileBlocks } from "@/lib/chat/parse-files";
import {
  filesToAttachments,
  streamChat,
  type ClientAttachment,
  type ClientMessage,
} from "@/lib/chat/client";

import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { ChatMetaBar } from "./chat-meta-bar";
import { useConversations } from "./conversations-provider";
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
  const {
    active,
    activeId,
    newConversation,
    updateMessages,
  } = useConversations();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const messages = active?.messages ?? [];

  // Most recent message snapshot for safe in-flight updates regardless
  // of React's render cadence.
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const handleSend = useCallback(
    async (content: string, files: File[]) => {
      if (isStreaming) return;

      // Make sure we have a conversation to write into.
      let conversationId = activeId;
      if (!conversationId) {
        conversationId = newConversation();
      }

      let attachments: ClientAttachment[];
      try {
        attachments = await filesToAttachments(files);
      } catch (error) {
        const text =
          error instanceof Error ? error.message : "Erreur de fichier";
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          error: text,
        };
        updateMessages(conversationId, [
          ...messagesRef.current,
          errorMessage,
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

      let working: Message[] = [
        ...messagesRef.current,
        userMessage,
        assistantMessage,
      ];
      updateMessages(conversationId, working);
      setIsStreaming(true);

      const patch = (id: string, updater: (m: Message) => Message) => {
        working = working.map((m) => (m.id === id ? updater(m) : m));
        updateMessages(conversationId!, working);
      };

      const controller = new AbortController();
      abortRef.current = controller;

      let finalContent = "";
      try {
        for await (const event of streamChat(working.slice(0, -1), model, {
          mode: "codex",
          apiKey,
          signal: controller.signal,
        })) {
          if (event.type === "text") {
            finalContent += event.text;
            patch(assistantId, (m) => ({ ...m, content: finalContent }));
          } else if (event.type === "error") {
            patch(assistantId, (m) => ({
              ...m,
              error: event.error,
              streaming: false,
            }));
          }
        }
      } catch (error) {
        if (
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          const text =
            error instanceof Error ? error.message : "Erreur de streaming";
          patch(assistantId, (m) => ({ ...m, error: text, streaming: false }));
        }
      } finally {
        patch(assistantId, (m) => ({ ...m, streaming: false }));
        setIsStreaming(false);
        abortRef.current = null;

        if (autoCommit && githubProject) {
          await runAutoCommit(
            conversationId!,
            assistantId,
            finalContent,
            content,
            githubProject,
            (cid, mid, commit) => {
              working = working.map((m) =>
                m.id === mid ? { ...m, commit } : m,
              );
              updateMessages(cid, working);
            },
          );
        }
      }
    },
    [
      apiKey,
      activeId,
      autoCommit,
      githubProject,
      isStreaming,
      model,
      newConversation,
      updateMessages,
    ],
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
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-6 pl-4 sm:pl-72">
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
  conversationId: string,
  messageId: string,
  assistantContent: string,
  userPrompt: string,
  project: GithubProject,
  patchCommit: (
    conversationId: string,
    messageId: string,
    commit: NonNullable<Message["commit"]>,
  ) => void,
) {
  const files = parseFileBlocks(assistantContent);
  if (files.length === 0) {
    patchCommit(conversationId, messageId, {
      status: "skipped",
      message:
        "Aucun bloc avec annotation `file:chemin` détecté dans la réponse — rien à pousser.",
    });
    return;
  }

  const paths = files.map((f) => f.path);
  patchCommit(conversationId, messageId, {
    status: "pending",
    files: files.length,
    paths,
  });

  const commitMessage = userPrompt.trim()
    ? `Codex: ${userPrompt.trim().slice(0, 64)}`
    : `Codex: update ${paths.join(", ").slice(0, 100)}`;

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
      patchCommit(conversationId, messageId, {
        status: "error",
        message: errMsg,
        paths,
      });
      return;
    }
    const data = (await res.json()) as {
      ok: boolean;
      url: string;
      files: number;
    };
    patchCommit(conversationId, messageId, {
      status: "ok",
      url: data.url,
      files: data.files,
      paths,
    });
  } catch (error) {
    patchCommit(conversationId, messageId, {
      status: "error",
      message:
        error instanceof Error ? error.message : "Erreur réseau inconnue.",
      paths,
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
