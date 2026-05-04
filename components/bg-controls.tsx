"use client";

import { BG_MODES } from "@/lib/themes";

import { useTheme } from "./theme-provider";

export function BgModePicker() {
  const { bgMode, setBgMode } = useTheme();
  return (
    <div className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] p-1">
      {BG_MODES.map((mode) => {
        const selected = bgMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setBgMode(mode.id)}
            aria-pressed={selected}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              selected
                ? "bg-[var(--accent)] text-[var(--accent-text)] shadow"
                : "text-[var(--fg-70)] hover:text-[var(--fg)]"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

export function BgOpacitySlider() {
  const { bgOpacity, setBgOpacity, bgMode } = useTheme();
  const disabled = bgMode !== "video";
  const percent = Math.round(bgOpacity * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--fg-70)]">
        <span>Visibilité de la vidéo</span>
        <span className="font-mono tabular-nums text-[var(--fg)]">
          {percent}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        disabled={disabled}
        onChange={(event) =>
          setBgOpacity(Number.parseInt(event.target.value, 10) / 100)
        }
        className="w-full accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Visibilité de la vidéo"
      />
      {disabled ? (
        <p className="text-xs text-[var(--fg-50)]">
          Sélectionnez « Vidéo animée » pour ajuster la visibilité.
        </p>
      ) : null}
    </div>
  );
}
