import type { ModelId } from "@/lib/models";

export type ChatRole = "user" | "assistant";

export type ClientAttachment = {
  name: string;
  type: string;
  data: string; // base64-encoded
  size: number;
};

export type CommitState = {
  status: "pending" | "ok" | "error";
  message?: string;
  url?: string;
  files?: number;
};

export type ClientMessage = {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: ClientAttachment[];
  streaming?: boolean;
  error?: string;
  model?: ModelId;
  commit?: CommitState;
};

export type ChatStreamEvent =
  | { type: "start"; model: ModelId }
  | { type: "text"; text: string }
  | { type: "stop"; reason: string }
  | {
      type: "done";
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_read_input_tokens: number;
        cache_creation_input_tokens: number;
      };
    }
  | { type: "error"; error: string; status?: number };

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB per request

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lecture du fichier échouée"));
        return;
      }
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Erreur lecture"));
    reader.readAsDataURL(file);
  });
}

export async function filesToAttachments(
  files: File[],
): Promise<ClientAttachment[]> {
  let total = 0;
  const out: ClientAttachment[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(
        `Le fichier « ${file.name} » dépasse la limite de ${MAX_FILE_BYTES / 1024 / 1024} Mo.`,
      );
    }
    total += file.size;
    if (total > MAX_TOTAL_BYTES) {
      throw new Error(
        `Le total des fichiers dépasse la limite de ${MAX_TOTAL_BYTES / 1024 / 1024} Mo.`,
      );
    }
    const data = await fileToBase64(file);
    out.push({
      name: file.name,
      type: file.type || "application/octet-stream",
      data,
      size: file.size,
    });
  }
  return out;
}

export type StreamChatOptions = {
  mode?: "codex" | "general";
  apiKey?: string | null;
  signal?: AbortSignal;
};

export async function* streamChat(
  messages: ClientMessage[],
  model: ModelId,
  options: StreamChatOptions = {},
): AsyncGenerator<ChatStreamEvent> {
  const payload = {
    model,
    mode: options.mode ?? "codex",
    apiKey: options.apiKey ?? undefined,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments?.map((a) => ({
        name: a.name,
        type: a.type,
        data: a.data,
      })),
    })),
  };

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      if (text) message = text;
    }
    yield { type: "error", error: message, status: response.status };
    return;
  }

  if (!response.body) {
    yield { type: "error", error: "Réponse sans corps." };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of rawEvent.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          if (data === "[DONE]") return;
          try {
            yield JSON.parse(data) as ChatStreamEvent;
          } catch {
            // ignore malformed
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
