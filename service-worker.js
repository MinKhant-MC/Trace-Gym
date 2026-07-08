var CACHE_NAME = 'trace-gym-v1';
var STATIC_FILES = [
  './',
  './index.html',
  './register.html',
  './member.html',
  './admin.html',
  './style.css',
  './config.js',
  './i18n.js',
  './api.js',
  './auth.js',
  './common.js',
  './register.js',
  './member.js',
  './admin.js',
  './pwa.js',
  './vendor/qrcode.min.js',
  './vendor/zxing-browser.min.js',
  './assets/trace-gym-logo.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE_NAME ? null : caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (url.origin !== location.origin || event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        return response;
      });
    })
  );
});
