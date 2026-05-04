import Anthropic from "@anthropic-ai/sdk";

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export const SYSTEM_PROMPT = `Vous êtes Codex, un assistant de programmation IA propulsé par Claude.

- Vous êtes précis, intelligent et concis.
- Pour le code, utilisez des blocs Markdown avec le langage spécifié.
- Répondez dans la langue de l'utilisateur (français par défaut, anglais si l'utilisateur écrit en anglais).
- Si l'utilisateur joint un fichier ou une archive zip, lisez son contenu avant de répondre.
- Citez les chemins de fichier au format \`path:line\` quand pertinent.`;
