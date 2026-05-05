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
  { id: "black", label: "Sombre" },
  { id: "white", label: "Clair" },
] as const;

export type BgMode = (typeof BG_MODES)[number]["id"];

export const DEFAULT_BG_MODE: BgMode = "black";

export const STORAGE_KEY_ACCENT = "codex-accent";
export const STORAGE_KEY_BG_MODE = "codex-bg-mode";
export const STORAGE_KEY_BG_OPACITY = "codex-bg-opacity";
export const STORAGE_KEY_API_KEY = "codex-anthropic-api-key";
export const STORAGE_KEY_GITHUB_TOKEN = "codex-github-token";
export const STORAGE_KEY_GITHUB_REPO = "codex-github-repo";
export const STORAGE_KEY_GITHUB_BRANCH = "codex-github-branch";
export const STORAGE_KEY_AUTO_COMMIT = "codex-auto-commit";

// Kept for backwards-compatibility with any older imports.
export const STORAGE_KEY = STORAGE_KEY_ACCENT;
