"use client";

import { useEffect } from "react";

import { ApiKeySettings } from "./api-key-settings";
import { BgModePicker } from "./bg-controls";
import { ConnectionsSettings } from "./connections-settings";
import { ThemePicker } from "./theme-picker";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fermer les paramètres"
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--modal-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-6 py-4">
          <h2 id="settings-title" className="text-lg font-medium">
            Paramètres
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--accent)] transition hover:bg-[var(--soft-surface)] hover:opacity-90"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-8 overflow-y-auto p-6">
          <Section title="🔑  Clé API Anthropic">
            <ApiKeySettings />
          </Section>

          <Section title="🔌  Connexions">
            <ConnectionsSettings />
          </Section>

          <Section title="Apparence">
            <Row label="Thème">
              <BgModePicker />
            </Row>
            <Row label="Couleur d'accent">
              <ThemePicker />
            </Row>
          </Section>

          <Section title="Personnalisation">
            <Row label="Nom affiché">
              <input
                type="text"
                placeholder="Votre nom"
                className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-4 py-2.5 text-sm placeholder:text-[var(--fg-40)] focus:border-[var(--accent)] focus:outline-none"
              />
            </Row>
            <Row label="Instructions personnalisées">
              <textarea
                placeholder="Comment Codex devrait-il vous répondre ?"
                rows={3}
                className="w-full resize-none rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-4 py-2.5 text-sm placeholder:text-[var(--fg-40)] focus:border-[var(--accent)] focus:outline-none"
              />
            </Row>
          </Section>

          <Section title="Reconnaissance vocale">
            <Row label="Langue de la dictée">
              <select
                defaultValue="fr-FR"
                className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="fr-FR">Français (France)</option>
                <option value="fr-CA">Français (Canada)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Español</option>
              </select>
            </Row>
          </Section>

          <Section title="Données">
            <Row label="Historique de la conversation">
              <button
                type="button"
                className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-4 py-2 text-sm transition hover:bg-[var(--user-bubble)]"
              >
                Effacer la conversation
              </button>
            </Row>
          </Section>

          <Section title="À propos">
            <p className="text-sm text-[var(--fg-60)]">Codex • v0.1.0</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--fg-40)]">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-[var(--fg-80)]">{label}</label>
      {children}
    </div>
  );
}

function CloseIcon() {
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
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
