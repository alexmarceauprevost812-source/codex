"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { streamChat, type ClientMessage } from "@/lib/chat/client";
import { useTypewriter } from "@/lib/chat/typewriter";

import { useTheme } from "./theme-provider";

const GHOST_MODEL = "claude-haiku-4-5"; // fast + cheap for casual chat

export function GhostChat() {
  const { apiKey } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (streaming) return;
      const text = input.trim();
      if (!text) return;
      setInput("");

      const userMessage: ClientMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const assistantId = crypto.randomUUID();
      const assistantMessage: ClientMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const history: ClientMessage[] = [...messages, userMessage];
        for await (const ev of streamChat(history, GHOST_MODEL, {
          mode: "general",
          apiKey,
          signal: controller.signal,
        })) {
          if (ev.type === "text") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + ev.text }
                  : m,
              ),
            );
          } else if (ev.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, error: ev.error, streaming: false }
                  : m,
              ),
            );
          }
        }
      } catch (err) {
        if (
          !(err instanceof DOMException && err.name === "AbortError")
        ) {
          const text = err instanceof Error ? err.message : String(err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, error: text, streaming: false }
                : m,
            ),
          );
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        );
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [apiKey, input, messages, streaming],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--fg)] transition hover:scale-110"
        aria-label={open ? "Fermer l'assistant général" : "Ouvrir l'assistant général"}
        title="Assistant général"
        aria-expanded={open}
      >
        <span
          className="absolute inset-0 rounded-full opacity-0 blur-md transition group-hover:opacity-60"
          style={{ background: "var(--accent)" }}
          aria-hidden="true"
        />
        <span className="codex-ghost-float relative">
          <GhostIcon active={open} />
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="ghost-chat-title"
          className="fixed bottom-6 right-6 z-40 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--modal-surface)] shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--fg)]">
                <GhostIcon active small />
              </span>
              <div className="leading-tight">
                <h3
                  id="ghost-chat-title"
                  className="text-sm font-semibold text-[var(--fg)]"
                >
                  Assistant général
                </h3>
                <p className="text-[10px] text-[var(--fg-50)]">
                  Haiku 4.5 — questions du quotidien
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-[var(--fg-60)] transition hover:bg-[var(--soft-surface)] hover:text-[var(--fg)]"
              aria-label="Fermer"
            >
              <CloseIcon />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm"
          >
            {messages.length === 0 ? (
              <GhostEmpty />
            ) : (
              messages.map((m) => <GhostBubble key={m.id} message={m} />)
            )}
          </div>

          <form
            onSubmit={send}
            className="flex items-center gap-2 border-t border-[var(--border-soft)] bg-[var(--input-surface)] px-3 py-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Demandez n'importe quoi..."
              className="flex-1 rounded-full bg-transparent px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-45)] focus:outline-none"
              autoComplete="off"
              disabled={streaming}
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Envoyer
              </button>
            )}
          </form>
        </div>
      ) : null}
    </>
  );
}

function GhostBubble({ message }: { message: ClientMessage }) {
  const isUser = message.role === "user";
  const isStreaming = !!message.streaming;
  const showCursor = isStreaming && !message.error;
  const displayed = useTypewriter(
    message.content,
    isUser || !isStreaming,
  );
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-1 rounded-2xl px-3 py-2 leading-relaxed text-[var(--fg)] ${
          isUser
            ? "bg-[var(--user-bubble)]"
            : "border border-[var(--border-soft)] bg-[var(--assist-bubble)]"
        }`}
      >
        {displayed ? (
          <p className="whitespace-pre-wrap">
            {displayed}
            {showCursor ? <Cursor /> : null}
          </p>
        ) : showCursor ? (
          <p className="text-[var(--fg-60)]">
            <Cursor />
          </p>
        ) : null}
        {message.error ? (
          <p className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400">
            {message.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Cursor() {
  return (
    <span
      className="ml-0.5 inline-block h-3 w-[2px] -translate-y-[1px] animate-pulse bg-[var(--fg)] align-middle"
      aria-hidden="true"
    />
  );
}

function GhostEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <span className="text-[var(--fg)] opacity-90">
        <GhostIcon active large />
      </span>
      <p className="text-sm font-medium text-[var(--fg)]">Bouh !</p>
      <p className="max-w-[240px] text-xs text-[var(--fg-60)]">
        Posez n'importe quelle question — recettes, voyages, idées,
        définitions. Pour le code, utilisez le chat principal de Codex.
      </p>
    </div>
  );
}

function GhostIcon({
  active = false,
  small = false,
  large = false,
}: {
  active?: boolean;
  small?: boolean;
  large?: boolean;
}) {
  const size = large ? "h-12 w-12" : small ? "h-4 w-4" : "h-5 w-5";
  return (
    <svg
      viewBox="0 0 24 24"
      className={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C7.589 2 4 5.589 4 10v10.232c0 .59.66.937 1.146.602L7 19.563l1.854 1.27a1 1 0 0 0 1.292 0L12 19.563l1.854 1.27a1 1 0 0 0 1.292 0L17 19.563l1.854 1.27c.486.336 1.146-.011 1.146-.601V10c0-4.411-3.589-8-8-8Z" />
      <circle cx="9" cy="10.5" r="1.4" fill="#0a0a0a" />
      <circle cx="15" cy="10.5" r="1.4" fill="#0a0a0a" />
      {active ? (
        <ellipse cx="12" cy="13.4" rx="1.1" ry="0.7" fill="#0a0a0a" />
      ) : null}
    </svg>
  );
}

function CloseIcon() {
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
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
