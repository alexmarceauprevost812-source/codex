"use client";

import { useEffect, useState } from "react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

/**
 * Registers the service worker and surfaces a small banner whenever a
 * new version is waiting to take over. The user clicks "Mettre à jour"
 * to skipWaiting + reload; otherwise the next reload picks it up.
 *
 * Skipped in dev (HMR + SW cache do not mix well) and on browsers
 * without Service Worker support.
 */
export function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;
    let intervalId: number | undefined;

    function trackInstalling(installing: ServiceWorker | null) {
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller &&
          !cancelled
        ) {
          setWaiting(installing);
        }
      });
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (cancelled) return;

        // If a worker is already waiting (e.g. user reopened the tab
        // mid-update), surface the prompt right away.
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaiting(registration.waiting);
        }

        // Watch for new workers being installed.
        trackInstalling(registration.installing);
        registration.addEventListener("updatefound", () => {
          trackInstalling(registration.installing);
        });

        // Periodically poll for new versions while the tab is open.
        const tick = () => {
          registration.update().catch(() => {});
        };
        intervalId = window.setInterval(tick, UPDATE_CHECK_INTERVAL_MS);
        // Also check whenever the tab regains focus.
        const onVisible = () => {
          if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch(() => {
        // Registration errors are non-fatal — the app still works
        // online without offline cache or installability.
      });

    // Reload once the new worker takes control.
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-32 z-50 flex justify-center px-4"
    >
      <div className="flex max-w-sm items-center gap-3 rounded-full border border-[var(--border-soft)] bg-[var(--modal-surface)] px-4 py-2 shadow-2xl backdrop-blur">
        <span className="text-sm text-[var(--fg)]">
          Une mise à jour de Codex est disponible.
        </span>
        <button
          type="button"
          onClick={() => waiting.postMessage("SKIP_WAITING")}
          className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)] shadow transition hover:opacity-90"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}
