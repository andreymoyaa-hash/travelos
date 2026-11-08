/* Nioli Lite phase 1: cache public static assets only.
 * Never cache authenticated HTML, Supabase responses, itinerary JSON or receipts.
 */
const CACHE = "nioli-lite-static-v1";
const LIMIT = 90;
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("nioli-lite-static-") && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode === "navigate" || request.credentials !== "same-origin") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/_next/static/") && !url.pathname.startsWith("/brand/")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone()).catch(() => {});
      const keys = await cache.keys();
      if (keys.length > LIMIT) await cache.delete(keys[0]);
    }
    return response;
  })());
});
