import type Anthropic from "@anthropic-ai/sdk";
import JSZip from "jszip";

export type IncomingAttachment = {
  name: string;
  type: string;
  data: string;
};

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "yml",
  "yaml",
  "toml",
  "ini",
  "env",
  "html",
  "htm",
  "xml",
  "css",
  "scss",
  "sass",
  "less",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "kts",
  "scala",
  "swift",
  "c",
  "h",
  "cpp",
  "hpp",
  "cc",
  "hh",
  "cs",
  "fs",
  "ml",
  "lua",
  "php",
  "pl",
  "pm",
  "r",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "psm1",
  "sql",
  "dockerfile",
  "tf",
  "hcl",
  "vue",
  "svelte",
  "astro",
  "log",
  "diff",
  "patch",
  "lock",
  "gradle",
  "kts",
  "config",
  "conf",
]);

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const IMAGE_EXTENSIONS: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

const MAX_INLINE_TEXT_BYTES = 200_000;
const MAX_ZIP_FILES = 100;

function extension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function isImage(att: IncomingAttachment): boolean {
  if (IMAGE_MIME.has(att.type)) return true;
  return extension(att.name) in IMAGE_EXTENSIONS;
}

function imageMime(att: IncomingAttachment): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (att.type === "image/jpeg" || att.type === "image/png" ||
      att.type === "image/gif" || att.type === "image/webp") {
    return att.type;
  }
  return IMAGE_EXTENSIONS[extension(att.name)] ?? "image/png";
}

function isPdf(att: IncomingAttachment): boolean {
  return att.type === "application/pdf" || extension(att.name) === "pdf";
}

function isZip(att: IncomingAttachment): boolean {
  return (
    att.type === "application/zip" ||
    att.type === "application/x-zip-compressed" ||
    extension(att.name) === "zip"
  );
}

function isTextish(name: string): boolean {
  return TEXT_EXTENSIONS.has(extension(name));
}

function fenceLang(name: string): string {
  const ext = extension(name);
  if (!ext) return "";
  // Map a few that differ from extension
  if (ext === "py") return "python";
  if (ext === "rb") return "ruby";
  if (ext === "rs") return "rust";
  if (ext === "kt" || ext === "kts") return "kotlin";
  if (ext === "yml") return "yaml";
  if (ext === "md" || ext === "markdown") return "markdown";
  return ext;
}

function truncate(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: text.slice(0, max), truncated: true };
}

export async function buildContentBlocks(
  text: string,
  attachments: IncomingAttachment[],
): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const att of attachments) {
    blocks.push(...(await processAttachment(att)));
  }

  if (text.trim().length > 0) {
    blocks.push({ type: "text", text });
  }

  if (blocks.length === 0) {
    blocks.push({ type: "text", text: "" });
  }

  return blocks;
}

async function processAttachment(
  att: IncomingAttachment,
): Promise<Anthropic.ContentBlockParam[]> {
  if (isImage(att)) {
    return [
      {
        type: "image",
        source: { type: "base64", media_type: imageMime(att), data: att.data },
      },
    ];
  }

  if (isPdf(att)) {
    return [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: att.data,
        },
        title: att.name,
        citations: { enabled: true },
      },
    ];
  }

  if (isZip(att)) {
    return await processZip(att);
  }

  if (isTextish(att.name)) {
    const decoded = Buffer.from(att.data, "base64").toString("utf8");
    const { text, truncated } = truncate(decoded, MAX_INLINE_TEXT_BYTES);
    const lang = fenceLang(att.name);
    return [
      {
        type: "text",
        text: `Fichier joint: \`${att.name}\`${truncated ? " (tronqué)" : ""}\n\n\`\`\`${lang}\n${text}\n\`\`\``,
      },
    ];
  }

  return [
    {
      type: "text",
      text: `[Fichier binaire non supporté inline: ${att.name} (${att.type || "type inconnu"})]`,
    },
  ];
}

async function processZip(
  att: IncomingAttachment,
): Promise<Anthropic.ContentBlockParam[]> {
  let archive: JSZip;
  try {
    archive = await JSZip.loadAsync(Buffer.from(att.data, "base64"));
  } catch (error) {
    return [
      {
        type: "text",
        text: `[Échec de l'extraction de ${att.name}: ${
          error instanceof Error ? error.message : String(error)
        }]`,
      },
    ];
  }

  const blocks: Anthropic.ContentBlockParam[] = [];
  const entries = Object.values(archive.files).filter((f) => !f.dir);
  const limited = entries.slice(0, MAX_ZIP_FILES);
  const skipped = entries.length - limited.length;

  blocks.push({
    type: "text",
    text: `Archive \`${att.name}\` — ${entries.length} fichier(s)${
      skipped > 0 ? ` (${skipped} non affichés)` : ""
    }:`,
  });

  for (const entry of limited) {
    if (isTextish(entry.name)) {
      const raw = await entry.async("string");
      const { text, truncated } = truncate(raw, MAX_INLINE_TEXT_BYTES);
      const lang = fenceLang(entry.name);
      blocks.push({
        type: "text",
        text: `\n📄 \`${entry.name}\`${truncated ? " (tronqué)" : ""}\n\`\`\`${lang}\n${text}\n\`\`\``,
      });
    } else if (extension(entry.name) in IMAGE_EXTENSIONS) {
      const data = await entry.async("base64");
      const ext = extension(entry.name);
      const mime = IMAGE_EXTENSIONS[ext] ?? "image/png";
      blocks.push({
        type: "text",
        text: `\n🖼️ \`${entry.name}\``,
      });
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: mime, data },
      });
    } else {
      blocks.push({
        type: "text",
        text: `\n📦 \`${entry.name}\` — binaire non affiché`,
      });
    }
  }

  return blocks;
}
