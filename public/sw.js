/* Summer OS caches public static assets only. Authenticated data is never cached. */
const CACHE_PREFIX = "summer-os-static-";
const CACHE_VERSION = "v1";
const STATIC_CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const PUBLIC_ASSET_PATHS = new Set([
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/favicon.ico",
]);

const isAllowedStaticAsset = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    PUBLIC_ASSET_PATHS.has(url.pathname));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        const response = await fetch(OFFLINE_URL, { cache: "reload", credentials: "omit" });
        if (response.ok) await cache.put(OFFLINE_URL, response);
      } catch {
        // Installation remains usable; a later online visit can populate the fallback.
      }
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        return (
          fallback ??
          new Response("Summer OS is offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
          })
        );
      }),
    );
    return;
  }

  if (!isAllowedStaticAsset(url)) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      try {
        const response = await fetch(request, { credentials: "omit" });
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (
          cached ??
          new Response("Static asset unavailable while offline.", {
            status: 504,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
