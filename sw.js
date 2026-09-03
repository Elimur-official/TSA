/* Тумбочка — service worker: офлайн-оболочка.
   ВАЖНО: приложение раздаётся из корня домена, поэтому область видимости
   этого worker'а — весь сайт. Трогаем строго свои файлы: остальные страницы
   (помощь, гайды, анонимность, админка) должны ходить в сеть как обычно,
   иначе их правки застрянут в кеше до следующей смены VERSION.
   Оболочка (HTML, CSS, JS, свои шрифты) — cache-first.
   Данные (data.js) и фото /img/ — network-first с фолбэком в кеш.
   Обновление: поднять VERSION — на activate старые кеши tmb-* удаляются. */
'use strict';

var VERSION = 'v13';
var SHELL_CACHE = 'tmb-shell-' + VERSION;
var MEDIA_CACHE = 'tmb-media-' + VERSION;

var SHELL = [
  './',
  './index.html',
  './styles.css',
  './store.js',
  './router.js',
  './ui.js',
  './tg.js',
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
  './css/shrifty.css',
  './shrifty/unbounded-500-latin.woff2',
  './shrifty/unbounded-500-cyrillic.woff2',
  './shrifty/unbounded-600-latin.woff2',
  './shrifty/unbounded-600-cyrillic.woff2',
  './shrifty/unbounded-700-latin.woff2',
  './shrifty/unbounded-700-cyrillic.woff2',
  './shrifty/manrope-400-latin.woff2',
  './shrifty/manrope-400-cyrillic.woff2',
  './shrifty/manrope-600-latin.woff2',
  './shrifty/manrope-600-cyrillic.woff2',
  './shrifty/manrope-700-latin.woff2',
  './shrifty/manrope-700-cyrillic.woff2',
  './shrifty/manrope-800-latin.woff2',
  './shrifty/manrope-800-cyrillic.woff2',
  './manifest.webmanifest',
  './politika.html',
  './oferta.html',
  './ikonki/ikonka-192.svg',
  './ikonki/ikonka-512.svg',
  './ikonki/ikonka-maskable-192.svg',
  './ikonki/ikonka-maskable-512.svg'
];

/* Папка приложения: '/' в бою, '/prototip/tumbochka-2026/' на старом адресе. */
var BAZA = new URL('./', self.location).pathname;

/* Точный список своих файлов + свои подпапки. Всё, чего тут нет, — чужое. */
var SVOI = SHELL.map(function (p) { return new URL(p, self.location).pathname; });
var SVOI_PAPKI = ['views/', 'css/', 'shrifty/', 'ikonki/'].map(function (p) {
  return BAZA + p;
});

function nash(put) {
  if (SVOI.indexOf(put) !== -1) return true;
  if (put === BAZA + 'data.js') return true;
  for (var i = 0; i < SVOI_PAPKI.length; i++) {
    if (put.indexOf(SVOI_PAPKI[i]) === 0) return true;
  }
  return false;
}

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
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
  if (url.origin !== self.location.origin) return;

  /* данные каталога: сеть сперва, офлайн — из кеша */
  if (/\/data\.js$/.test(url.pathname) && nash(url.pathname)) {
    e.respondWith(networkFirst(req));
    return;
  }

  /* фото каталога лежат в /img/ */
  if (url.pathname.indexOf('/img/') === 0) {
    e.respondWith(networkFirst(req));
    return;
  }

  /* навигация: только вход в само приложение. Остальные страницы сайта
     отдаём браузеру — их кешировать нельзя. */
  if (req.mode === 'navigate') {
    if (url.pathname === BAZA || url.pathname === BAZA + 'index.html') {
      e.respondWith(
        caches.match(req, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          return fetch(req).catch(function () {
            return caches.match(BAZA + 'index.html');
          });
        })
      );
    }
    return;
  }

  /* своя статика — cache-first; чужая уходит в сеть нетронутой */
  if (nash(url.pathname)) {
    e.respondWith(cacheFirst(req, SHELL_CACHE));
  }
});
