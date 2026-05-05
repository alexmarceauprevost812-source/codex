"use client";

import { useState } from "react";

import { useConversations } from "./conversations-provider";
import { SettingsPanel } from "./settings-panel";

export function Sidebar() {
  const [showSettings, setShowSettings] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    conversations,
    activeId,
    newConversation,
    selectConversation,
    deleteConversation,
  } = useConversations();

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger toggle — only visible when sidebar is hidden */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--rail-surface)] text-[var(--accent)] shadow backdrop-blur-xl transition hover:opacity-90 sm:hidden"
        aria-label="Ouvrir le menu"
      >
        <MenuIcon />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={closeMobile}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm sm:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border-soft)] bg-[var(--rail-surface)] backdrop-blur-xl transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        {/* Header: new conversation */}
        <div className="flex items-center gap-2 border-b border-[var(--border-soft)] p-3">
          <button
            type="button"
            onClick={() => {
              newConversation();
              closeMobile();
            }}
            className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:opacity-90"
          >
            <NewChatIcon />
            <span>Nouvelle conversation</span>
          </button>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-full p-1.5 text-[var(--fg-60)] transition hover:bg-[var(--soft-surface)] hover:text-[var(--fg)] sm:hidden"
            aria-label="Fermer le menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Conversation list */}
        <nav
          className="flex-1 space-y-0.5 overflow-y-auto p-2"
          aria-label="Liste des conversations"
        >
          {conversations.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--fg-50)]">
              Aucune conversation pour le moment.
            </p>
          ) : (
            conversations.map((c) => (
              <ConversationRow
                key={c.id}
                title={c.title}
                active={c.id === activeId}
                onSelect={() => {
                  selectConversation(c.id);
                  closeMobile();
                }}
                onDelete={() => {
                  if (
                    confirm(`Supprimer la conversation « ${c.title} » ?`)
                  ) {
                    deleteConversation(c.id);
                  }
                }}
              />
            ))
          )}
        </nav>

        {/* Footer: settings */}
        <div className="border-t border-[var(--border-soft)] p-3">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--soft-surface)] hover:opacity-90"
          >
            <SettingsIcon />
            <span>Paramètres</span>
          </button>
        </div>
      </aside>

      {showSettings ? (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      ) : null}
    </>
  );
}

function ConversationRow({
  title,
  active,
  onSelect,
  onDelete,
}: {
  title: string;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-[var(--user-bubble)] text-[var(--fg)]"
          : "text-[var(--fg-80)] hover:bg-[var(--soft-surface)] hover:text-[var(--fg)]"
      }`}
    >
      <span className="flex-1 truncate">{title}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="rounded p-1 text-[var(--fg-50)] opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
        aria-label="Supprimer la conversation"
        title="Supprimer"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

function NewChatIcon() {
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SettingsIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
