import type { ClientMessage } from "./client";

const STORAGE_KEY = "codex-conversations";
const ACTIVE_KEY = "codex-active-conversation";
const MAX_CONVERSATIONS = 100;

export type Conversation = {
  id: string;
  title: string;
  messages: ClientMessage[];
  createdAt: number;
  updatedAt: number;
};

export const NEW_CONVERSATION_TITLE = "Nouvelle conversation";

/** Generate a short title from the first user message, or fall back. */
export function generateTitle(messages: ClientMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first?.content.trim();
  if (!text) return NEW_CONVERSATION_TITLE;
  return text.length > 60 ? text.slice(0, 57).trim() + "…" : text;
}

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isConversation)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = list.slice(0, MAX_CONVERSATIONS).map(stripForStorage);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // QuotaExceeded or storage disabled — degrade silently.
  }
}

export function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id === null) window.localStorage.removeItem(ACTIVE_KEY);
    else window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignore
  }
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    Array.isArray(v.messages) &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number"
  );
}

/**
 * Drop heavy attachment payloads (base64 file blobs) before persisting
 * — they can each be MB-sized and quickly blow past the 5–10 MB
 * localStorage quota. The metadata (name/size/type) is kept so the
 * UI can still show a chip; data is empty after reload.
 */
function stripForStorage(c: Conversation): Conversation {
  return {
    ...c,
    messages: c.messages.map((m) => {
      if (!m.attachments || m.attachments.length === 0) return m;
      return {
        ...m,
        attachments: m.attachments.map((a) => ({
          name: a.name,
          type: a.type,
          size: a.size,
          data: "",
        })),
      };
    }),
  };
}
