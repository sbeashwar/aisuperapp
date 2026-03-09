// MySuperApp Service Worker – network-first with offline fallback
const CACHE_NAME = "mysuperapp-v3";
const OFFLINE_URL = "/offline";

// Pre-cache the offline page and app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",
        "/stocks",
        "/settings",
        "/manifest.json",
        "/icons/icon-192.svg",
        "/icons/icon-512.svg",
      ])
    )
  );
  self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy: try network, fall back to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests and API calls (we always want fresh data for those)
  if (request.method !== "GET") return;

  // For API routes, always go to network (no caching stock data)
  if (request.url.includes("/api/")) return;

  // For everything (pages, _next/ bundles, assets): network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
