/* Тумбочка — service worker: офлайн-оболочка.
   Оболочка (HTML, CSS, JS, шрифтовый CSS) — cache-first.
   Данные (data.js) и фото ../img/ — network-first с фолбэком в кеш.
   Обновление: поднять VERSION — на activate старые кеши tmb-* удаляются. */
'use strict';

var VERSION = 'v5';
var SHELL_CACHE = 'tmb-shell-' + VERSION;
var MEDIA_CACHE = 'tmb-media-' + VERSION;

var SHELL = [
  './',
  './index.html',
  './styles.css',
  './store.js',
  './router.js',
  './ui.js',
  './views/home.js',
  './views/katalog.js',
  './views/tovar.js',
  './views/cart.js',
  './views/checkout.js',
  './views/profile.js',
  './views/quiz.js',
  './views/anon.js',
  './css/home.css',
  './css/katalog.css',
  './css/tovar.css',
  './css/cart.css',
  './css/checkout.css',
  './css/profile.css',
  './css/quiz.css',
  './css/anon.css',
  './manifest.webmanifest',
  './politika.html',
  './oferta.html',
  './ikonki/ikonka-192.svg',
  './ikonki/ikonka-512.svg',
  './ikonki/ikonka-maskable-192.svg',
  './ikonki/ikonka-maskable-512.svg'
];

var FONT_CSS = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Manrope:wght@400;600;700;800&display=swap';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      /* шрифтовый CSS кешируем отдельно и без права валить установку:
         ответ может быть opaque (no-cors) — это допустимо */
      cache.add(new Request(FONT_CSS, { mode: 'no-cors' })).catch(function () {});
      return cache.addAll(SHELL);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf('tmb-') === 0 && k !== SHELL_CACHE && k !== MEDIA_CACHE) {
          return caches.delete(k);
        }
        return Promise.resolve(false);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function putCopy(cacheName, req, res) {
  var copy = res.clone();
  caches.open(cacheName).then(function (c) { c.put(req, copy); });
}

/* фото: сеть сперва (свежие картинки), при отказе — что лежит в кеше */
function networkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && (res.ok || res.type === 'opaque')) putCopy(MEDIA_CACHE, req, res);
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      if (hit) return hit;
      return new Response('', { status: 504, statusText: 'offline' });
    });
  });
}

/* оболочка и шрифты: кеш сперва, промах — сеть с дозаписью в кеш */
function cacheFirst(req, cacheName) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) putCopy(cacheName, req, res);
      return res;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;

  /* данные каталога: сеть сперва, офлайн — из кеша (спека: network-first для данных) */
  if (sameOrigin && /\/data\.js$/.test(url.pathname)) {
    e.respondWith(networkFirst(req));
    return;
  }

  /* фото каталога: app/img/ лежит рядом с папкой приложения (../img/) */
  if (sameOrigin && url.pathname.indexOf('/img/') !== -1) {
    e.respondWith(networkFirst(req));
    return;
  }

  /* Google Fonts: css и woff2, opaque допустим */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  /* навигация: оболочка из кеша, офлайн открывает приложение, а не ошибку */
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return fetch(req).catch(function () {
          return caches.match('./index.html');
        });
      })
    );
    return;
  }

  /* остальная своя статика — cache-first */
  if (sameOrigin) {
    e.respondWith(cacheFirst(req, SHELL_CACHE));
  }
});
