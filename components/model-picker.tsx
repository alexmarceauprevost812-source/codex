"use client";

import { useEffect, useRef, useState } from "react";

import { MODELS } from "@/lib/models";

import { useTheme } from "./theme-provider";

export function ModelPicker() {
  const { model, setModel } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = MODELS.find((m) => m.id === model) ?? MODELS[0];

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-sm font-medium text-[var(--fg)] transition hover:bg-[var(--user-bubble)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--accent)" }}
          aria-hidden="true"
        />
        <span>{current.label}</span>
        <ChevronIcon className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1.5 w-72 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--modal-surface)] shadow-2xl"
        >
          {MODELS.map((m) => {
            const selected = m.id === model;
            return (
              <button
                key={m.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setModel(m.id);
                  setOpen(false);
                }}
                className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition ${
                  selected
                    ? "bg-[var(--user-bubble)]"
                    : "hover:bg-[var(--soft-surface)]"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium text-[var(--fg)]">
                    {m.label}
                  </span>
                  {selected ? (
                    <CheckIcon className="text-[var(--accent)]" />
                  ) : null}
                </div>
                <span className="text-xs text-[var(--fg-60)]">
                  {m.description}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
