"use client";

import { useCallback, useRef, useState } from "react";

import {
  filesToAttachments,
  streamChat,
  type ClientAttachment,
  type ClientMessage,
} from "@/lib/chat/client";

import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { ChatMetaBar } from "./chat-meta-bar";
import { useTheme } from "./theme-provider";

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
  const { model } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

      try {
        const history: Message[] = [...messages, userMessage];
        for await (const event of streamChat(history, model, controller.signal)) {
          if (event.type === "text") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.text }
                  : m,
              ),
            );
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, error: event.error, streaming: false }
                  : m,
              ),
            );
          }
        }
      } catch (error) {
        const text =
          error instanceof Error ? error.message : "Erreur de streaming";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, error: text, streaming: false } : m,
          ),
        );
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        );
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages, model],
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
