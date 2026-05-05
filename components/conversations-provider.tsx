"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ClientMessage } from "@/lib/chat/client";
import {
  generateTitle,
  loadActiveId,
  loadConversations,
  saveActiveId,
  saveConversations,
  type Conversation,
  NEW_CONVERSATION_TITLE,
} from "@/lib/chat/conversations";

type ConversationsContextValue = {
  conversations: Conversation[];
  activeId: string | null;
  active: Conversation | null;
  newConversation: () => string;
  selectConversation: (id: string) => void;
  updateMessages: (id: string, messages: ClientMessage[]) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  loaded: boolean;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(
  null,
);

const PERSIST_DEBOUNCE_MS = 300;

export function ConversationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage on first mount.
  useEffect(() => {
    const list = loadConversations();
    setConversations(list);
    const stored = loadActiveId();
    if (stored && list.some((c) => c.id === stored)) {
      setActiveId(stored);
    } else if (list.length > 0) {
      setActiveId(list[0].id);
    }
    setLoaded(true);
  }, []);

  // Debounced persistence. The UI updates immediately from React state;
  // localStorage writes are coalesced to avoid hammering the main thread
  // during streaming token updates.
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const persistTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      saveConversations(conversationsRef.current);
    }, PERSIST_DEBOUNCE_MS);
    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [conversations, loaded]);

  useEffect(() => {
    if (!loaded) return;
    saveActiveId(activeId);
  }, [activeId, loaded]);

  const newConversation = useCallback(() => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const conv: Conversation = {
      id,
      title: NEW_CONVERSATION_TITLE,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    return id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const updateMessages = useCallback(
    (id: string, messages: ClientMessage[]) => {
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== id) return c;
          const title =
            c.title === NEW_CONVERSATION_TITLE
              ? generateTitle(messages)
              : c.title;
          return { ...c, messages, title, updatedAt: Date.now() };
        });
        // Keep the list sorted by recency so the active row stays at top.
        next.sort((a, b) => b.updatedAt - a.updatedAt);
        return next;
      });
    },
    [],
  );

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: title.trim() || c.title } : c,
      ),
    );
  }, []);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const value = useMemo<ConversationsContextValue>(
    () => ({
      conversations,
      activeId,
      active,
      newConversation,
      selectConversation,
      updateMessages,
      deleteConversation,
      renameConversation,
      loaded,
    }),
    [
      conversations,
      activeId,
      active,
      newConversation,
      selectConversation,
      updateMessages,
      deleteConversation,
      renameConversation,
      loaded,
    ],
  );

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error(
      "useConversations must be used within a ConversationsProvider",
    );
  }
  return ctx;
}
