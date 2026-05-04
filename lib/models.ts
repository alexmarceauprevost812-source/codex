export const MODELS = [
  {
    id: "claude-opus-4-7",
    label: "Opus 4.7",
    short: "Opus",
    description: "Le plus capable — meilleur pour le code et l'agentique",
    tier: "opus",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    short: "Sonnet",
    description: "Équilibre vitesse / intelligence",
    tier: "sonnet",
  },
  {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5",
    short: "Haiku",
    description: "Le plus rapide et économique",
    tier: "haiku",
  },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "claude-opus-4-7";

export const STORAGE_KEY_MODEL = "codex-model";

export function isModelId(value: unknown): value is ModelId {
  return (
    typeof value === "string" &&
    MODELS.some((m) => m.id === value)
  );
}
