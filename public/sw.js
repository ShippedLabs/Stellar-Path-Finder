/**
 * Minimal service worker for Stellar Path Finder.
 *
 * - Precaches the app shell on install (resilient: one failed URL does not
 *   abort the whole install).
 * - Cleans up old cache versions on activate.
 * - Navigation requests use network-first with a cached "/" fallback so the
 *   shell loads offline without ever pinning users to a stale deploy.
 * - Other GET requests use cache-first with a network fallback.
 *
 * Bump CACHE on any change to the precache list to invalidate old caches.
 */

// Bump this string on every sw.js change to invalidate old caches.
const CACHE = "spf-v1";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Add each URL independently so a single 404 cannot reject install.
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => undefined))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;

  if (request.mode === "navigate") {
    // Network-first for page navigations, fall back to the cached shell offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
