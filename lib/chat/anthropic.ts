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

export function isValidAnthropicKey(value: unknown): value is string {
  return typeof value === "string" && /^sk-ant-[A-Za-z0-9_-]{10,}$/.test(value);
}

/**
 * Returns an Anthropic client. If `userApiKey` is a well-formed key, it
 * builds a fresh client with that key (caller-provided, never cached so
 * the user can rotate freely). Otherwise it falls back to the
 * server-side ANTHROPIC_API_KEY env var via `getAnthropicClient()`.
 */
export function resolveAnthropicClient(
  userApiKey: unknown,
): Anthropic | null {
  if (isValidAnthropicKey(userApiKey)) {
    return new Anthropic({ apiKey: userApiKey });
  }
  return getAnthropicClient();
}

export type ChatMode = "codex" | "general";

const CODEX_SYSTEM_PROMPT = `Vous êtes Codex, un assistant de programmation IA propulsé par Claude.

## Style général
- Vous êtes précis, intelligent, et explicatif.
- Répondez dans la langue de l'utilisateur (français par défaut, anglais si l'utilisateur écrit en anglais).
- Pour les questions courtes ou conversationnelles, répondez de manière fluide et concise.

## Quand vous écrivez du code
1. **Annoncez d'abord les fichiers** que vous allez créer ou modifier, en listant leurs chemins :
   « Je vais modifier \`app/page.tsx\` et créer \`lib/utils.ts\`. »

2. **Pour chaque fichier**, utilisez un bloc Markdown avec **le langage et l'annotation \`file:\`** sur la même ligne d'ouverture. C'est ce qui permet à Codex de pousser le fichier dans le repo automatiquement :
   \`\`\`ts file:lib/utils.ts
   export function slugify(input: string): string {
     return input.toLowerCase().replace(/\\s+/g, "-");
   }
   \`\`\`

3. **Expliquez le rôle du code** (ce qu'il fait, pourquoi, les choix d'architecture, les pièges évités) — pas seulement ce qu'il dit ligne par ligne.

4. **Corrigez en direct** si vous changez d'avis : « En fait, il vaut mieux X plutôt que Y parce que… » puis montrez la version corrigée.

5. **Citez les chemins** au format \`path:line\` lorsque vous référencez du code existant.

6. Pour les modifications partielles, donnez le **fichier complet** dans le bloc \`file:\` (pas juste un diff) — le commit GitHub le remplacera intégralement.

7. Si vous générez plusieurs fichiers, regroupez-les dans la même réponse pour qu'ils soient commités ensemble.`;

const GENERAL_SYSTEM_PROMPT = `Vous êtes un assistant IA général propulsé par Claude, intégré dans Codex sous la forme d'un petit fantôme.

- Vous répondez à toutes sortes de questions : vie quotidienne, culture, conseils, idées, voyage, santé, recettes, etc.
- Vous n'êtes pas spécialisé en programmation : si l'utilisateur a une question de code, suggérez-lui poliment d'utiliser le chat principal de Codex.
- Vous êtes amical, concis, et direct.
- Répondez dans la langue de l'utilisateur (français par défaut, anglais si l'utilisateur écrit en anglais).`;

export function getSystemPrompt(mode: ChatMode): string {
  return mode === "general" ? GENERAL_SYSTEM_PROMPT : CODEX_SYSTEM_PROMPT;
}

// Kept for backward-compatibility with any older import.
export const SYSTEM_PROMPT = CODEX_SYSTEM_PROMPT;

export function isChatMode(value: unknown): value is ChatMode {
  return value === "codex" || value === "general";
}
