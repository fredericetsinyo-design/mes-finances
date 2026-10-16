/* Mes Finances — service worker : l'appli s'ouvre même sans internet. */
const CACHE = "mes-finances-v5";
const SHELL = ["./", "./index.html", "./supabase.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Le serveur (connexion et données) n'est jamais mis en cache.
  if (url.hostname.endsWith("supabase.co")) return;
  const isPage = req.mode === "navigate";
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(isPage ? "./index.html" : req, {ignoreSearch: isPage});
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(isPage ? "./index.html" : req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
