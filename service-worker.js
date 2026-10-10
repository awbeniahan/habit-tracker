// Bump this version string on EVERY release so devices pick up the update.
var CACHE_NAME = 'habit-tracker-v8';
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './icons.js',
  './app.js',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // cache: 'reload' skips the browser's own HTTP cache, so a new release
      // can never be saved from a stale copy (GitHub Pages caches files ~10 min).
      return cache.addAll(ASSETS.map(function(url) {
        return new Request(url, { cache: 'reload' });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Cache-first: serve from cache when offline, fall back to network, and
// keep the cache fresh whenever a network request succeeds.
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return; // the cache can only store GET requests
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var networkFetch = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function() { return cached; });
      return cached || networkFetch;
    })
  );
});
