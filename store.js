/* store.js — всё состояние «Тумбочки» в localStorage (префикс tmb_).
 * Работает и в браузере, и в Node без DOM: хранилище передаётся снаружи
 * или подменяется на память, если localStorage нет или он бросает
 * (приватный режим). Публичный интерфейс — по interfaces.md:
 *   TMB.createStore(storage?, data?) → store
 *   TMB.store — готовый экземпляр на настоящем localStorage.
 */
(function (root) {
  'use strict';

  /* Безопасная обёртка хранилища: любая ошибка -> тихий переход на память. */
  function safeStorage(raw) {
    var mem = {};
    return {
      get: function (k) {
        try {
          if (raw) {
            var v = raw.getItem(k);
            if (v !== null && v !== undefined) return v;
          }
        } catch (e) { /* приватный режим — живём на памяти */ }
        return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
      },
      set: function (k, v) {
        mem[k] = v;
        try { if (raw) raw.setItem(k, v); } catch (e) { /* память уже хранит */ }
      },
    };
  }

  function createStore(storage, data) {
    var st = safeStorage(storage);
    var subs = [];

    function read(key, fallback) {
      var rawVal = st.get('tmb_' + key);
      if (rawVal === null) return fallback;
      try { return JSON.parse(rawVal); } catch (e) { return fallback; }
    }
    function write(key, val, type) {
      st.set('tmb_' + key, JSON.stringify(val));
      for (var i = 0; i < subs.length; i++) {
        try { subs[i]({ type: type || key }); } catch (e) { /* подписчик сам виноват */ }
      }
    }
    function catalog() {
      if (data && data.items) return data.items;
      var TMB = root.TMB || {};
      return (TMB.data && TMB.data.items) || [];
    }
    function itemById(id) {
      var list = catalog();
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    }

    var store = {
      cart: {
        /* строки корзины: [{id, qty}] — add того же id растит qty */
        add: function (id) {
          var rows = read('cart', []);
          var row = null;
          for (var i = 0; i < rows.length; i++) if (rows[i].id === id) row = rows[i];
          if (row) row.qty += 1;
          else rows.push({ id: id, qty: 1 });
          write('cart', rows, 'cart');
          var stats = read('stats', {});
          stats.cartAdds = (stats.cartAdds || 0) + 1;
          write('stats', stats, 'stats');
        },
        remove: function (id) {
          write('cart', read('cart', []).filter(function (r) { return r.id !== id; }), 'cart');
        },
        setQty: function (id, n) {
          var rows = read('cart', []);
          for (var i = 0; i < rows.length; i++) if (rows[i].id === id) rows[i].qty = n;
          write('cart', rows.filter(function (r) { return r.qty > 0; }), 'cart');
        },
        list: function () { return read('cart', []); },
        count: function () {
          return read('cart', []).reduce(function (s, r) { return s + r.qty; }, 0);
        },
        total: function () {
          return read('cart', []).reduce(function (s, r) {
            var it = itemById(r.id);
            return s + (it ? it.n * r.qty : 0);
          }, 0);
        },
        clear: function () { write('cart', [], 'cart'); },
      },

      fav: {
        toggle: function (id) {
          var list = read('fav', []);
          var i = list.indexOf(id);
          if (i >= 0) list.splice(i, 1);
          else list.push(id);
          write('fav', list, 'fav');
        },
        has: function (id) { return read('fav', []).indexOf(id) >= 0; },
        list: function () { return read('fav', []); },
      },

      seen: {
        /* «вы смотрели»: без дублей, свежее — первым, максимум 30 */
        push: function (id) {
          var list = read('seen', []).filter(function (x) { return x !== id; });
          list.unshift(id);
          write('seen', list.slice(0, 30), 'seen');
        },
        list: function () { return read('seen', []); },
      },

      orders: {
        /* add(o) присваивает номер и дату, возвращает сохранённый заказ */
        add: function (o) {
          var list = read('orders', []);
          var order = Object.assign({}, o, {
            num: 'T-' + (1001 + list.length),
            ts: Date.now(),
          });
          list.unshift(order);
          write('orders', list, 'orders');
          return order;
        },
        list: function () { return read('orders', []); },
      },

      profile: {
        get: function () { return read('profile', {}); },
        set: function (p) { write('profile', Object.assign(read('profile', {}), p), 'profile'); },
      },

      consent: {
        get: function (k) { return read('consent', {})[k]; },
        set: function (k, v) {
          var c = read('consent', {});
          c[k] = v;
          write('consent', c, 'consent');
        },
      },

      /* счётчики для достижений: metric из data.achievements */
      progress: function () {
        var stats = read('stats', {});
        var favs = read('fav', []);
        var favQuiet = favs.filter(function (id) {
          var it = itemById(id);
          return it && it.noise <= 1;
        }).length;
        return {
          seen: read('seen', []).length,
          fav: favs.length,
          favQuiet: favQuiet,
          cartAdds: stats.cartAdds || 0,
          quiz: stats.quiz || 0,
          orders: read('orders', []).length,
        };
      },
      /* отметить событие вне store (пока одно: пройден квиз) */
      mark: function (key) {
        var stats = read('stats', {});
        stats[key] = (stats[key] || 0) + 1;
        write('stats', stats, 'stats');
      },

      subscribe: function (fn) {
        subs.push(fn);
        return function () {
          var i = subs.indexOf(fn);
          if (i >= 0) subs.splice(i, 1);
        };
      },
    };
    return store;
  }

  var TMB = (root.TMB = root.TMB || {});
  TMB.createStore = createStore;
  var ls = null;
  try { ls = root.localStorage || null; } catch (e) { ls = null; }
  TMB.store = createStore(ls);
})(typeof window !== 'undefined' ? window : globalThis);
