"use client";

import { useState, type FormEvent } from "react";

export function ChatInput({
  onSend,
}: {
  onSend: (content: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = value.trim();
    if (!content) return;
    onSend(content);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-2 shadow-2xl backdrop-blur-xl"
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Envoyer un message à Codex..."
        className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Envoyer
      </button>
    </form>
  );
}
