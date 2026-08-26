/* tg.js — связь «Тумбочки» с Telegram. Два слоя в одном файле (спецификация,
 * решения 2 и 3):
 *
 *   TMB.tgLogic — чистые правила, БЕЗ DOM и без SDK (шов для тестов в Node):
 *     isInside(wa)              → bool   — запущено ли внутри Telegram
 *     canSendData(wa)           → bool   — можно ли sendData (только reply-кнопка)
 *     profileFrom(user)         → {name, contact}
 *     fillProfile(store, user)  → {name, contact} — что реально дозаполнили
 *     orderPayload(o)           → string — заказ боту (JSON, ≤ 4096 байт)
 *     kvizPayload(items, base)  → string — подборка квиза боту
 *
 *   TMB.tg — единственное место, знающее про window.Telegram.WebApp:
 *     inside() → bool, canSendData() → bool, user() → {name,username}|null,
 *     send(obj) → bool, back.show(fn)/back.hide(), init({headerColor,bgColor})
 *
 * Экраны спрашивают адаптер, не SDK. Вне Telegram адаптер молчит: ни один
 * метод Telegram-API не вызывается, ошибок в консоли нет.
 */
(function (root) {
  'use strict';
  var TMB = (root.TMB = root.TMB || {});

  /* ─────────── чистые правила (работают в Node без DOM) ─────────── */

  /* Внутри Telegram, если SDK отдал непустую initData или пользователя в ней.
     У SDK, подключённого в обычном браузере, initData пустая. */
  function isInside(wa) {
    if (!wa) return false;
    var u = wa.initDataUnsafe || {};
    return !!((wa.initData && String(wa.initData).length > 0) || u.user);
  }

  /* sendData работает только при запуске с reply-кнопки клавиатуры.
     Признак один: у запуска из меню/inline/по ссылке есть query_id
     (документация Telegram, 26.08.2026 — решение 4 спецификации). */
  function canSendData(wa) {
    if (!isInside(wa)) return false;
    var u = wa.initDataUnsafe || {};
    return !u.query_id;
  }

  /* Из Telegram берём ровно имя и ник. id не читаем, не храним, не шлём.
     Понимает обе формы: сырого пользователя SDK ({first_name, username})
     и то, что отдаёт адаптер TMB.tg.user() ({name, username}). */
  function profileFrom(user) {
    if (!user) return { name: '', contact: '' };
    var name = String(user.first_name || user.name || '').trim();
    var uname = String(user.username || '').trim();
    return { name: name, contact: uname ? '@' + uname : '' };
  }

  /* Дозаполняет пустые поля магазина данными из Telegram. Непустое не трогает
     (история 6 R10i: «уже введённое не перезаписывается»). Возвращает то, что
     реально записали. store — TMB.store или его двойник, DOM не нужен. */
  function fillProfile(store, user) {
    var got = profileFrom(user);
    var filled = { name: '', contact: '' };
    if (!store) return filled;
    var p = store.profile.get() || {};
    var patch = null;
    var draft = p.checkout || {};
    var next = null;
    function draftCopy() {
      if (next) return next;
      next = {};
      for (var k in draft) if (Object.prototype.hasOwnProperty.call(draft, k)) next[k] = draft[k];
      return next;
    }
    /* Имя из Telegram кладём в оба места сразу: в профиль и в пустое поле
       «Имя» черновика оформления — шаг 1 читает именно черновик. */
    if (got.name && !String(p.name || '').trim()) {
      patch = { name: got.name };
      filled.name = got.name;
      if (!String(draft.name || '').trim()) draftCopy().name = got.name;
    }
    if (got.contact && !String(draft.contact || '').trim()) {
      draftCopy().contact = got.contact;
      filled.contact = got.contact;
    }
    if (next) {
      patch = patch || {};
      patch.checkout = next;
    }
    if (patch) store.profile.set(patch);
    return filled;
  }


  /* ─────────── payload для бота (общий контракт с ботом) ───────────
     Формат и лимиты — interfaces.md, «Формат payload». Меняется только
     вместе с bot/webapp.py: бот проверяет ровно эти же границы. */

  var LIM = {
    items: 30, t: 80, comment: 300, name: 60, contact: 60,
    place: 200, way: 60, pay: 60, num: 20, base: 300, bytes: 4096,
  };

  /* обрезка строки по знакам; хвост лишнего суррогата не оставляем */
  function cut(v, n) {
    var s = String(v == null ? '' : v).trim();
    if (s.length <= n) return s;
    s = s.slice(0, n);
    var last = s.charCodeAt(s.length - 1);
    if (last >= 0xd800 && last <= 0xdbff) s = s.slice(0, -1);
    return s;
  }

  function whole(v) {
    var n = Math.round(Number(v));
    return isFinite(n) ? n : 0;
  }

  /* длина строки в байтах UTF-8 — по ней Telegram меряет лимит 4096 */
  function utf8Len(s) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(s).length;
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }

  function orderJson(src, tCap, comment, count) {
    var list = src.items || [];
    var items = [];
    for (var i = 0; i < count && i < list.length; i++) {
      var it = list[i] || {};
      items.push({ id: whole(it.id), t: cut(it.t, tCap), qty: whole(it.qty) || 1, n: whole(it.n) });
    }
    var d = src.delivery || {};
    return JSON.stringify({
      type: 'order',
      v: 1,
      num: cut(src.num, LIM.num),
      items: items,
      total: whole(src.total),
      name: cut(src.name, LIM.name),
      contact: cut(src.contact, LIM.contact),
      delivery: { way: cut(d.way, LIM.way), place: cut(d.place, LIM.place) },
      pay: cut(src.pay, LIM.pay),
      comment: comment ? cut(src.comment, LIM.comment) : '',
    });
  }

  /* Лимит Telegram — 4096 байт на sendData. Если заказ в него не влез,
     ужимаемся по очереди и всегда одинаково: сначала названия позиций,
     потом комментарий, в последнюю очередь хвост позиций. Номер, сумма,
     контакт и доставка не жертвуются никогда — без них заказ бесполезен. */
  var T_CAPS = [80, 60, 40, 25, 15];

  function orderPayload(o) {
    var src = o || {};
    var count = Math.min((src.items || []).length, LIM.items);
    var stroka;
    var i;
    for (i = 0; i < T_CAPS.length; i++) {
      stroka = orderJson(src, T_CAPS[i], true, count);
      if (utf8Len(stroka) <= LIM.bytes) return stroka;
    }
    for (i = 0; i < T_CAPS.length; i++) {
      stroka = orderJson(src, T_CAPS[i], false, count);
      if (utf8Len(stroka) <= LIM.bytes) return stroka;
    }
    var last = T_CAPS[T_CAPS.length - 1];
    while (count > 1) {
      count -= 1;
      stroka = orderJson(src, last, false, count);
      if (utf8Len(stroka) <= LIM.bytes) return stroka;
    }
    return stroka;
  }

  function kvizJson(list, base, tCap, count) {
    var items = [];
    for (var i = 0; i < count && i < list.length; i++) {
      var it = list[i] || {};
      items.push({ id: whole(it.id), t: cut(it.t, tCap), n: whole(it.n) });
    }
    return JSON.stringify({
      type: 'kviz',
      v: 1,
      base: cut(base, LIM.base),
      items: items,
    });
  }

  /* base — абсолютный адрес магазина: бот собирает из него ссылки на карточки */
  function kvizPayload(items, base) {
    var list = items || [];
    var count = Math.min(list.length, LIM.items);
    var stroka;
    for (var i = 0; i < T_CAPS.length; i++) {
      stroka = kvizJson(list, base, T_CAPS[i], count);
      if (utf8Len(stroka) <= LIM.bytes) return stroka;
    }
    var last = T_CAPS[T_CAPS.length - 1];
    while (count > 1) {
      count -= 1;
      stroka = kvizJson(list, base, last, count);
      if (utf8Len(stroka) <= LIM.bytes) return stroka;
    }
    return stroka;
  }

  TMB.tgLogic = {
    isInside: isInside,
    canSendData: canSendData,
    profileFrom: profileFrom,
    fillProfile: fillProfile,
    orderPayload: orderPayload,
    kvizPayload: kvizPayload,
  };

  /* ─────────── адаптер SDK (только в браузере) ─────────── */

  if (!root.document) return;

  function wa() {
    var t = root.Telegram;
    return (t && t.WebApp) || null;
  }
  /* Тихий вызов метода SDK: старая версия клиента — просто не сработает */
  function call(name) {
    var w = wa();
    if (!w || typeof w[name] !== 'function') return false;
    try {
      w[name].apply(w, Array.prototype.slice.call(arguments, 1));
      return true;
    } catch (e) { return false; }
  }
  function atLeast(v) {
    var w = wa();
    if (!w || typeof w.isVersionAtLeast !== 'function') return false;
    try { return !!w.isVersionAtLeast(v); } catch (e) { return false; }
  }

  var backHandler = null;

  var tg = {
    inside: function () { return isInside(wa()); },
    canSendData: function () { return canSendData(wa()); },

    /* {name, username} из профиля Telegram, либо null. id сюда не попадает. */
    user: function () {
      var w = wa();
      if (!isInside(w)) return null;
      var u = (w.initDataUnsafe || {}).user;
      if (!u) return null;
      return {
        name: String(u.first_name || '').trim(),
        username: String(u.username || '').trim(),
      };
    },

    /* Отправить объект боту. false — если снаружи или запуск не с reply-кнопки.
       После удачной отправки Telegram закрывает приложение. */
    send: function (obj) {
      var w = wa();
      if (!canSendData(w)) return false;
      var payload;
      try { payload = typeof obj === 'string' ? obj : JSON.stringify(obj); }
      catch (e) { return false; }
      if (!call('sendData', payload)) return false;
      call('close');
      return true;
    },

    back: {
      show: function (fn) {
        var w = wa();
        if (!isInside(w) || !w.BackButton) return false;
        if (backHandler) { try { w.BackButton.offClick(backHandler); } catch (e) {} }
        backHandler = typeof fn === 'function' ? fn : null;
        try {
          if (backHandler) w.BackButton.onClick(backHandler);
          w.BackButton.show();
        } catch (e) { return false; }
        return true;
      },
      hide: function () {
        var w = wa();
        if (!isInside(w) || !w.BackButton) return false;
        try {
          if (backHandler) { w.BackButton.offClick(backHandler); backHandler = null; }
          w.BackButton.hide();
        } catch (e) { return false; }
        return true;
      },
    },

    /* Разворачиваем на всю высоту, глушим свайп вниз, красим шапку и фон
       Telegram в цвета магазина. Вне Telegram — ничего не вызываем. */
    init: function (opts) {
      var w = wa();
      if (!isInside(w)) return false;
      call('ready');
      call('expand');
      /* disableVerticalSwipes — с Bot API 7.7 */
      if (atLeast('7.7')) call('disableVerticalSwipes');
      /* setHeaderColor/setBackgroundColor — с Bot API 6.1, но произвольный
         цвет строкой #RRGGBB шапка принимает только с 6.9; раньше — ключевые
         слова. Магазин всегда светлый, поэтому фолбэк — 'bg_color'. */
      if (atLeast('6.1')) {
        var o = opts || {};
        if (o.headerColor) call('setHeaderColor', atLeast('6.9') ? o.headerColor : 'bg_color');
        if (o.bgColor) call('setBackgroundColor', o.bgColor);
      }
      return true;
    },
  };

  TMB.tg = tg;
})(typeof window !== 'undefined' ? window : globalThis);
