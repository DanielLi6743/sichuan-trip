// Aggressive network-only — zero caching, always fresh
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  // Nuke all caches
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  // Network only, bypass HTTP cache entirely
  e.respondWith(fetch(e.request, {cache: 'no-store'}));
});
