"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type SpeechResultAlternative = { transcript: string };
type SpeechResult = ArrayLike<SpeechResultAlternative> & {
  isFinal: boolean;
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechResult>;
};
type SpeechRecognitionInstance = {
  start(): void;
  stop(): void;
  abort(): void;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function ChatInput({
  onSend,
  isStreaming = false,
  onStop,
}: {
  onSend: (content: string, files: File[]) => void;
  isStreaming?: boolean;
  onStop?: () => void;
}) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isStreaming) return;
    const trimmed = value.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files);
    setValue("");
    setFiles([]);
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const list = event.target.files;
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleMic() {
    if (typeof window === "undefined") return;
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      window.alert(
        "La reconnaissance vocale n'est pas disponible dans ce navigateur.",
      );
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
      }
      setValue(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  return (
    <div className="space-y-2">
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-1">
          {files.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1 text-xs text-[var(--fg-80)]"
            >
              <FileIcon />
              <span className="max-w-[160px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-[var(--fg-50)] transition hover:text-[var(--fg)]"
                aria-label={`Retirer ${file.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--input-surface)] px-2 py-1.5 shadow-2xl backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full p-2 text-[var(--accent)] transition hover:bg-[var(--soft-surface)] hover:opacity-90"
          aria-label="Ajouter un fichier"
          title="Ajouter un fichier (incluant .zip)"
        >
          <PlusIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*,.zip,application/zip,application/x-zip-compressed"
          onChange={onFileChange}
          className="hidden"
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            isListening ? "À l'écoute..." : "Envoyer un message à Codex..."
          }
          className="flex-1 bg-transparent px-2 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-45)] focus:outline-none"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={toggleMic}
          className={`rounded-full p-2 transition ${
            isListening
              ? "animate-pulse bg-red-500 text-white"
              : "text-[var(--accent)] hover:bg-[var(--soft-surface)] hover:opacity-90"
          }`}
          aria-label={
            isListening ? "Arrêter la dictée" : "Dicter un message"
          }
          title={isListening ? "Arrêter" : "Dicter à la voix"}
        >
          <MicIcon />
        </button>
        {isStreaming && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-red-600"
            aria-label="Arrêter la génération"
          >
            Arrêter
          </button>
        ) : (
          <button
            type="submit"
            disabled={(!value.trim() && files.length === 0) || isStreaming}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-text)] shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Envoyer
          </button>
        )}
      </form>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
