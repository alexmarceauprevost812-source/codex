export type ParsedFile = {
  path: string;
  content: string;
  language: string;
};

const FENCE_RE = /^```([A-Za-z0-9_+-]*)\s+file:([^\s`]+)\s*$/m;

/**
 * Extracts code blocks tagged with `file:<path>` from a markdown body.
 *
 * Format expected (per the Codex system prompt):
 *
 *     ```ts file:app/page.tsx
 *     // ...code...
 *     ```
 *
 * Returns one entry per file. If the same path appears multiple times,
 * the last occurrence wins (the model is expected to provide the final
 * version of each file).
 */
export function parseFileBlocks(text: string): ParsedFile[] {
  const out: ParsedFile[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(FENCE_RE);
    if (!match) {
      i++;
      continue;
    }
    const language = match[1] ?? "";
    const rawPath = match[2].trim();
    if (!isSafePath(rawPath)) {
      i++;
      continue;
    }
    const buffer: string[] = [];
    i++;
    while (i < lines.length && !/^```/.test(lines[i])) {
      buffer.push(lines[i]);
      i++;
    }
    // Skip the closing fence
    if (i < lines.length) i++;
    out.push({
      path: rawPath,
      content: buffer.join("\n") + (buffer.length > 0 ? "\n" : ""),
      language,
    });
  }
  // Dedupe by path: keep the last one
  const seen = new Map<string, ParsedFile>();
  for (const file of out) seen.set(file.path, file);
  return Array.from(seen.values());
}

function isSafePath(path: string): boolean {
  if (!path) return false;
  if (path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  if (path.includes("\\")) return false;
  if (path.length > 512) return false;
  return /^[A-Za-z0-9_./-]+$/.test(path);
}
