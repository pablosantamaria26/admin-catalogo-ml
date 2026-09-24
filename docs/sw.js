// Service Worker del panel admin. Cachea SOLO el shell estático (este
// archivo, el HTML, manifest, icons) — nunca las llamadas a Supabase ni los
// scripts de CDN (xlsx/pdf.js), que siempre tienen que resolverse en vivo.
//
// IMPORTANTE: el navegador solo nota que hay una versión nueva cuando este
// archivo (sw.js) cambia byte a byte. Bumpear CACHE en cada deploy que
// toque algo de docs/ — si no, los cambios no llegan a los que ya tienen
// la PWA instalada, ni con hard-reload (ver memoria: gotcha ya visto antes
// en TiempoLibre-App).
const CACHE = "admin-catalogo-ml-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; // Supabase/CDN: red directa, sin tocar
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
