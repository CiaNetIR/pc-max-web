/* PC MAX Web — static-flavor service worker (Task 23).
 *
 * GitHub Pages serves every asset with Cache-Control: max-age=600, so each
 * repeat visit re-downloads ~900 KB that never changed. This worker adds
 * the missing client-side cache layer with immutable-asset semantics:
 *
 *   /_next/static/** (and /chunks|/media fallbacks) → cache-first
 *       content-hashed filenames — permanently valid, zero revalidation
 *   /games/**, /brand/**, /fonts/** → stale-while-revalidate
 *       stable URLs that CAN change between releases: serve cached,
 *       refresh in the background for the next visit
 *   documents (navigations — / and the /fa route) → network-first
 *       fresh HTML discovers new asset hashes on every deploy; the cached
 *       copy is the offline fallback after the first successful visit
 *   /releases/** (the 2.2 MB installer) → never cached, network only
 *
 * Registered ONLY in the GitHub Pages static export (see
 * src/components/pcmax/sw-register.tsx — the SSR/dev flavor never mounts
 * it). Bump VERSION whenever public/ assets change so old caches drop. */
const VERSION = "v2.2.1";
const CACHE = `pcmax-${VERSION}`;
const BASE = "/pc-max-web";
/* Content-hashed build output. Next's default layout is /_next/static/;
 * the /chunks|/media alternatives cover assetPrefix variations. */
const IMMUTABLE = new RegExp(`^${BASE}/(_next/static/|chunks/|media/)`);
/* Stable-URL public assets — refreshable, never served stale forever. */
const SWR = new RegExp(`^${BASE}/(games|brand|fonts)/`);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  if (cached) {
    /* Background refresh — the fetch's response is ONLY used for the
     * cache write, so there is no body-consumption race here. */
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
      })
      .catch(() => null);
    return cached;
  }
  /* Cold miss — clone BEFORE the response is handed to respondWith
   * (cloning after the consumer starts reading throws "body already
   * used" and the cache write dies silently). */
  const response = await fetch(request);
  if (response && response.ok) {
    const clone = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, clone));
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  /* The installer artifact must always hit the network (2.2 MB, versioned
   * by filename — the HTTP cache + server range support handle it). */
  if (url.pathname.startsWith(`${BASE}/releases/`)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (IMMUTABLE.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (SWR.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  /* Everything else (favicon, manifest, icons, llms.txt …) — fresh when
   * online, cached when not. */
  event.respondWith(networkFirst(request));
});
