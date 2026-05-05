"use client";

import { useState } from "react";

import { SettingsPanel } from "./settings-panel";

export function Sidebar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col items-center justify-between border-r border-[var(--border-soft)] bg-[var(--rail-surface)] py-4 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            className="rounded-full p-2 text-[var(--accent)] transition hover:bg-[var(--soft-surface)] hover:opacity-90"
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
          >
            <NewChatIcon />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="rounded-full p-2 text-[var(--accent)] transition hover:bg-[var(--soft-surface)] hover:opacity-90"
            aria-label="Paramètres"
            title="Paramètres"
          >
            <SettingsIcon />
          </button>
        </div>
      </aside>
      {showSettings ? (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      ) : null}
    </>
  );
}

function NewChatIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function SettingsIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
