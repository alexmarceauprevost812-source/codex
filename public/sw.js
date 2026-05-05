/* Codex service worker — installable PWA + automatic updates.
 *
 * Bump CACHE_VERSION on every release: it invalidates the runtime
 * cache and triggers the "update available" flow on connected clients.
 */
const CACHE_VERSION = "codex-v8";
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // Cache the shell. Failures are non-fatal — the SW still installs.
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })),
        ),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Cross-origin and API/server-action requests: bypass entirely.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/auth/")) return;
  if (url.pathname.startsWith("/_next/data/")) return;

  const acceptsHtml = (request.headers.get("accept") || "").includes(
    "text/html",
  );
  const isNavigation = request.mode === "navigate" || acceptsHtml;

  // Network-first for navigation: always try to fetch the latest HTML
  // so updates land on the next visit. Fall back to cache when offline.
  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const root = await caches.match("/");
          if (root) return root;
          return new Response(
            "<h1>Codex est hors ligne</h1><p>Reconnectez-vous pour continuer.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
    return;
  }

  // Stale-while-revalidate for everything else (assets, /_next/static).
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        })
        .catch(() => null);
      return cached ?? (await fetchPromise) ?? Response.error();
    })(),
  );
});

// Lets the client trigger an immediate activation of a waiting worker
// when the user accepts an update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
