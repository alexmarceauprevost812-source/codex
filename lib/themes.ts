export const ACCENT_COLORS = [
  { id: "orange", label: "Orange", value: "#f97316", textOn: "#000000" },
  { id: "blue", label: "Bleu", value: "#3b82f6", textOn: "#ffffff" },
  { id: "yellow", label: "Jaune", value: "#eab308", textOn: "#000000" },
  { id: "pink", label: "Rose", value: "#ec4899", textOn: "#ffffff" },
  { id: "purple", label: "Violet", value: "#8b5cf6", textOn: "#ffffff" },
  { id: "red", label: "Rouge", value: "#ef4444", textOn: "#ffffff" },
  { id: "green", label: "Vert", value: "#22c55e", textOn: "#000000" },
  { id: "gray", label: "Gris", value: "#6b7280", textOn: "#ffffff" },
  { id: "white", label: "Blanc", value: "#ffffff", textOn: "#000000" },
] as const;

export type AccentId = (typeof ACCENT_COLORS)[number]["id"];

export const DEFAULT_ACCENT: AccentId = "orange";

export const BG_MODES = [
  { id: "video", label: "Vidéo animée" },
  { id: "black", label: "Noir" },
  { id: "white", label: "Blanc" },
] as const;

export type BgMode = (typeof BG_MODES)[number]["id"];

export const DEFAULT_BG_MODE: BgMode = "video";
export const DEFAULT_BG_OPACITY = 0.4;

export const STORAGE_KEY_ACCENT = "codex-accent";
export const STORAGE_KEY_BG_MODE = "codex-bg-mode";
export const STORAGE_KEY_BG_OPACITY = "codex-bg-opacity";

// Kept for backwards-compatibility with any older imports.
export const STORAGE_KEY = STORAGE_KEY_ACCENT;
