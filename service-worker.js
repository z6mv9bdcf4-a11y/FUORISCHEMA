/* ==========================================================================
   FUORISCHEMA — CONSERVATIVE SERVICE WORKER
   Garantisce la compatibilità PWA / GitHub Pages senza caching aggressivo delle pagine.
   ========================================================================== */

const CACHE_NAME = 'fuorischema-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategia Network-Only con Fallback minimo
// Garantisce che il browser scarichi sempre le versioni aggiornate dopo un deploy.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});