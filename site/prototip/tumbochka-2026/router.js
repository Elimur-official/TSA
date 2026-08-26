/* router.js — хеш-роутер «Тумбочки» с памятью скролла по вкладкам.
 * Публичный интерфейс (interfaces.md):
 *   TMB.router.go(hash)        — перейти («#/katalog», «#/tovar/42»)
 *   TMB.router.on(route, fn)   — зарегистрировать экран: fn(el, params)
 *   TMB.router.back()          — назад (или на главную, если некуда)
 *   TMB.router.start()         — первый рендер (зовёт оболочка после регистраций)
 *   TMB.router.current()       — база текущего маршрута («#/tovar»)
 * Маршруты: #/  #/katalog  #/tovar/{id}  #/korzina  #/oformlenie
 *           #/profil  #/kviz  #/anonimnost
 * Экран с параметром регистрируется базой: on('#/tovar', fn) → params = {id}.
 */
(function (root) {
  'use strict';
  var routes = {}; // база → renderFn
  var scrollMem = {}; // база → scrollY
  var lastBase = null;
  var started = false;

  function parse(hash) {
    if (!hash || hash === '#' || hash === '#/') return { base: '#/', params: {} };
    var path = hash.replace(/^#\/?/, '');
    var seg = path.split('/');
    var base = '#/' + seg[0];
    var params = {};
    if (seg.length > 1 && seg[1] !== '') params.id = decodeURIComponent(seg[1]);
    return { base: base, params: params };
  }

  function dispatch() {
    var el = root.document && root.document.getElementById('screen');
    if (!el) return;
    var r = parse(root.location.hash);
    var fn = routes[r.base] || routes['#/'];
    if (lastBase !== null) scrollMem[lastBase] = root.scrollY || 0;
    el.innerHTML = '';
    if (fn) fn(el, r.params);
    var api = root.TMB.router;
    if (api.onchange) { try { api.onchange(r.base, r.params); } catch (e) {} }
    var y = r.base === '#/tovar' ? 0 : scrollMem[r.base] || 0;
    root.requestAnimationFrame(function () { root.scrollTo(0, y); });
    lastBase = r.base;
  }

  var router = {
    go: function (hash) {
      if (root.location.hash === hash) dispatch();
      else root.location.hash = hash;
    },
    on: function (route, fn) { routes[route] = fn; },
    back: function () {
      if (root.history.length > 1) root.history.back();
      else router.go('#/');
    },
    start: function () {
      if (started) return;
      started = true;
      root.addEventListener('hashchange', dispatch);
      dispatch();
    },
    current: function () { return parse(root.location.hash).base; },
    /* onchange(base, params) — хук оболочки: подсветка активной вкладки */
    onchange: null,
  };

  var TMB = (root.TMB = root.TMB || {});
  TMB.router = router;
})(typeof window !== 'undefined' ? window : globalThis);
