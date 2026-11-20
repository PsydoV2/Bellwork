/*
 * Offline service worker for the installable app (scope: /app).
 * - /app page: network-first, falls back to the cached copy when offline.
 * - /_next/static/*: cache-first (file names are content-hashed, so they never change).
 * - App icons / manifest: stale-while-revalidate.
 * Bump VERSION to force a clean cache after breaking changes.
 */
const VERSION = "v1";
const PAGES = `kbc-pages-${VERSION}`;
const STATIC = `kbc-static-${VERSION}`;
const APP_URL = "/app";

/** Collects the hashed /_next/static assets an HTML document references. */
function assetsIn(html) {
  const urls = new Set();
  for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) urls.add(m[0]);
  return [...urls];
}

/** Caches the /app document and every static asset it needs; drops assets of older builds. */
async function refreshApp(response) {
  const html = await response.clone().text();
  const pages = await caches.open(PAGES);
  await pages.put(APP_URL, response.clone());

  const wanted = assetsIn(html);
  const statics = await caches.open(STATIC);
  const missing = [];
  for (const url of wanted) if (!(await statics.match(url))) missing.push(url);
  if (missing.length === 0) return; // same build as before, nothing to do

  await Promise.all(
    missing.map(async (url) => {
      try {
        const res = await fetch(url);
        if (res.ok) await statics.put(url, res);
      } catch {
        /* offline – picked up on the next successful load */
      }
    }),
  );
  // a new build was deployed: drop assets the new document no longer references
  // (lazily loaded chunks of the new build get cached again on first use)
  const keep = new Set(wanted.map((u) => new URL(u, self.location.origin).href));
  for (const req of await statics.keys()) {
    if (!keep.has(req.url)) await statics.delete(req);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch(APP_URL, { cache: "no-cache" });
      if (res.ok) await refreshApp(res);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("kbc-") && key !== PAGES && key !== STATIC) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // the app document itself
  if (request.mode === "navigate" && (url.pathname === APP_URL || url.pathname === `${APP_URL}/`)) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) event.waitUntil(refreshApp(res.clone()));
          return res;
        } catch {
          const cached = await caches.match(APP_URL, { cacheName: PAGES });
          return cached ?? Response.error();
        }
      })(),
    );
    return;
  }

  // hashed build assets (JS, CSS, fonts)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC);
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  // icons, manifest
  if (url.pathname.startsWith(`${APP_URL}/`) && /\.(png|webmanifest)$|apple-icon/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached ?? Response.error());
        return cached ?? network;
      })(),
    );
  }
});
