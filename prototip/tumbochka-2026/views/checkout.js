/* views/checkout.js — экран «#/oformlenie»: оформление заказа шагами
 * (аккордеон), отправка заказа менеджеру в Telegram. Зона тона — «тихо».
 *
 * Чистая логика заказа выставлена как TMB.checkout (грузится и в Node без DOM):
 *   TMB.checkout.validContact(v) → true|false — телефон 10–11 цифр или @ник
 *   TMB.checkout.orderText(o)    → строка заказа для буфера/Telegram
 * Черновик полей — TMB.store.profile, ключ checkout; галочка ПДн —
 * TMB.store.consent('pdn'). Регистрация в роутере — самовызовом. */
(function (root) {
  'use strict';
  var TMB = (root.TMB = root.TMB || {});

  /* ── чистые функции: без DOM, без store ── */

  var TG_URL = 'https://t.me/elimurbot';

  /* Контакт: телефон (10–11 цифр, разделители не мешают) или ник @…
   * (ники Telegram — от 5 знаков) */
  function validContact(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return false;
    if (s.charAt(0) === '@') return /^@[A-Za-z0-9_]{5,32}$/.test(s);
    var digits = s.replace(/[\s()+\-.]/g, '');
    return /^\d{10,11}$/.test(digits);
  }

  /* Цена как в интерфейсе: '2 890 ₽' с неразрывными пробелами.
   * Формат один — TMB.ui.price; копия ниже — только Node-фолбэк для
   * orderText (ui.js в Node не грузится: ему нужен DOM). */
  function fmt(n) {
    if (TMB.ui && TMB.ui.price) return TMB.ui.price(n);
    var s = String(Math.round(n));
    var out = '';
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 === 0) out += ' ';
      out += s[i];
    }
    return out + ' ₽';
  }

  /* Текст заказа для буфера и Telegram.
   * o = { num, items:[{t,qty,n}], name, contact,
   *       delivery:{way,place}, pay, comment? } */
  function orderText(o) {
    var lines = ['Заказ ' + o.num + ' — Тумбочка', ''];
    var total = 0;
    for (var i = 0; i < o.items.length; i++) {
      var it = o.items[i];
      total += it.n * it.qty;
      lines.push(i + 1 + '. ' + it.t + ' — ' + it.qty + ' шт · ' + fmt(it.n * it.qty));
    }
    lines.push('', 'Итого: ' + fmt(total), '');
    lines.push('Покупатель: ' + o.name + ', ' + o.contact);
    lines.push('Доставка: ' + o.delivery.way + ' — ' + o.delivery.place);
    lines.push('Оплата: ' + o.pay);
    if (o.comment && String(o.comment).trim()) {
      lines.push('Комментарий: ' + String(o.comment).trim());
    }
    /* запасной путь (история 15): ссылка на бота — последней строкой */
    lines.push('', TG_URL);
    return lines.join('\n');
  }

  TMB.checkout = { validContact: validContact, orderText: orderText };

  /* ── дальше только браузер: экран «#/oformlenie», зона тона — «тихо» ── */
  if (!root.document || !TMB.router) return;
  var doc = root.document;
  var PAYS = ['СБП', 'Карта', 'При получении'];
  var WAYS = ['ПВЗ СДЭК', 'ПВЗ Почта России', 'Курьер'];

  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* выбранные строки корзины: cart.list() минус profile.cartOff (пишет корзина) */
  function selectedRows() {
    var byId = {};
    TMB.data.items.forEach(function (it) { byId[it.id] = it; });
    var off = TMB.store.profile.get().cartOff || [];
    return TMB.store.cart.list()
      .filter(function (r) { return off.indexOf(r.id) < 0 && byId[r.id]; })
      .map(function (r) { return { id: r.id, qty: r.qty, item: byId[r.id] }; });
  }

  /* черновик полей: TMB.store.profile, ключ checkout — переживает перезагрузку */
  function getDraft() { return TMB.store.profile.get().checkout || {}; }
  function saveDraft(patch) {
    var d = Object.assign({}, getDraft(), patch);
    TMB.store.profile.set({ checkout: d });
    return d;
  }

  /* строка доставки из черновика: {way, place} для текста заказа */
  function deliveryOf(d) {
    if (d.way === 'Курьер') {
      return { way: 'Курьер', place: [d.city, d.street].filter(Boolean).join(', ') };
    }
    return { way: d.way || '', place: d.pvz || '' };
  }

  /* проверки шагов; ошибка — словами по-русски, null — шаг в порядке */
  function checkStep(n, d) {
    if (n === 1) {
      if (!String(d.name || '').trim()) return 'Напишите, как к вам обращаться';
      if (!validContact(d.contact)) return 'Телефон — 10–11 цифр, или ник в Telegram: @имя';
      if (!TMB.store.consent.get('pdn')) return 'Нужна галочка согласия — без неё не можем принять заказ';
      return null;
    }
    if (n === 2) {
      if (WAYS.indexOf(d.way) < 0) return 'Выберите способ доставки';
      if (d.way === 'Курьер') {
        if (!String(d.city || '').trim() || !String(d.street || '').trim()) {
          return 'Укажите город и адрес — куда привезти';
        }
      } else if (!String(d.pvz || '').trim()) {
        return 'Укажите город и пункт выдачи';
      }
      return null;
    }
    if (n === 3) return PAYS.indexOf(d.pay) < 0 ? 'Выберите способ оплаты' : null;
    return null;
  }

  /* копирование: clipboard → скрытая textarea; cb(true|false) */
  function copyText(text, cb) {
    function fallback() {
      try {
        var ta = doc.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        var ok = doc.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e) { return false; }
    }
    try {
      if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
        root.navigator.clipboard.writeText(text).then(
          function () { if (cb) cb(true); },
          function () { if (cb) cb(fallback()); }
        );
        return;
      }
    } catch (e) { /* нет clipboard API — падаем в textarea */ }
    if (cb) cb(fallback());
  }

  function field(labelText, input) {
    var f = el('label', 'checkout-field');
    f.appendChild(el('span', 'checkout-label', labelText));
    f.appendChild(input);
    return f;
  }
  function textInput(cls, placeholder, value, onInput) {
    var i = doc.createElement('input');
    i.type = 'text';
    i.className = 'checkout-input ' + cls;
    i.placeholder = placeholder;
    i.value = value || '';
    i.addEventListener('input', function () { onInput(i.value); });
    return i;
  }

  function render(el0) {
    var rows = selectedRows();

    /* нечего оформлять — тихо вернуть в корзину */
    if (!rows.length) {
      var stub = el('div', 'checkout-guard');
      stub.innerHTML =
        '<div class="checkout-guard-emoji">🧺</div>' +
        '<h1>Пока нечего оформлять</h1>' +
        '<p>Отметьте товары в корзине — и возвращайтесь.</p>';
      var b = el('button', 'checkout-guard-btn', 'В корзину');
      b.addEventListener('click', function () { TMB.router.go('#/korzina'); });
      stub.appendChild(b);
      el0.appendChild(stub);
      return;
    }

    var total = rows.reduce(function (s, r) { return s + r.item.n * r.qty; }, 0);
    /* прерванное оформление: открываем первый незаполненный шаг */
    var openStep = 1;
    while (openStep < 4 && checkStep(openStep, getDraft()) === null) openStep++;
    var sending = false;
    var screen = el('div', 'checkout-screen');
    el0.appendChild(screen);

    /* сводка заполненного шага под заголовком аккордеона */
    function stepSummary(n, d) {
      if (checkStep(n, d) !== null) return '';
      if (n === 1) return esc(d.name) + ' · ' + esc(d.contact);
      if (n === 2) {
        var dl = deliveryOf(d);
        return esc(dl.way + ' — ' + dl.place);
      }
      if (n === 3) return esc(d.pay);
      return '';
    }

    function paint() {
      screen.innerHTML = '';
      var d = getDraft();
      screen.appendChild(el('h1', 'checkout-title', 'Оформление заказа'));

      var titles = ['Контакт', 'Доставка', 'Оплата', 'Ваш заказ'];
      for (var n = 1; n <= 4; n++) {
        (function (n) {
          /* шаг открывается, если все предыдущие в порядке */
          var reachable = true;
          for (var k = 1; k < n; k++) if (checkStep(k, d) !== null) reachable = false;
          var sec = el('section',
            'checkout-step' +
            (n === openStep ? ' open' : '') +
            (checkStep(n, d) === null && n < 4 ? ' done' : '') +
            (reachable ? '' : ' locked'));

          var head = el('header', 'checkout-step-head');
          head.appendChild(el('span', 'checkout-step-num', String(n)));
          var ht = el('div', 'checkout-step-titles');
          ht.appendChild(el('h2', '', titles[n - 1]));
          var sum = stepSummary(n, d);
          if (sum && n !== openStep) ht.appendChild(el('p', 'checkout-step-sum', sum));
          head.appendChild(ht);
          head.addEventListener('click', function () {
            if (!reachable || n === openStep) return;
            openStep = n;
            paint();
          });
          sec.appendChild(head);

          if (n === openStep && reachable) {
            var body = el('div', 'checkout-step-body');
            fillStep(n, body, d);
            sec.appendChild(body);
          }
          screen.appendChild(sec);
        })(n);
      }
    }

    function nextButton(body, n) {
      var err = el('p', 'checkout-error');
      var btn = el('button', 'checkout-next', n === 3 ? 'К итогу' : 'Дальше');
      btn.addEventListener('click', function () {
        var msg = checkStep(n, getDraft());
        if (msg) { err.textContent = msg; err.classList.add('show'); return; }
        openStep = n + 1;
        paint();
      });
      body.appendChild(err);
      body.appendChild(btn);
    }

    function fillStep(n, body, d) {
      if (n === 1) {
        body.appendChild(field('Имя',
          textInput('', 'Как к вам обращаться', d.name, function (v) { saveDraft({ name: v }); })));
        body.appendChild(field('Телефон или ник в Telegram',
          textInput('', '+7… или @ник', d.contact, function (v) { saveDraft({ contact: v }); })));
        var agree = el('label', 'checkout-agree');
        var cb = doc.createElement('input');
        cb.type = 'checkbox';
        cb.checked = TMB.store.consent.get('pdn') === true;
        agree.appendChild(cb);
        agree.appendChild(el('span', 'checkout-cb'));
        agree.appendChild(el('span', 'checkout-agree-text',
          'Согласна на обработку персональных данных — ' +
          '<a href="politika.html" target="_blank" rel="noopener">политика</a>'));
        cb.addEventListener('change', function () {
          TMB.store.consent.set('pdn', cb.checked);
        });
        body.appendChild(agree);
        nextButton(body, 1);
        return;
      }

      if (n === 2) {
        var wayWrap = el('div', 'checkout-ways');
        WAYS.forEach(function (w) {
          var wb = el('button',
            'checkout-way' + (d.way === w ? ' on' : ''), esc(w));
          wb.addEventListener('click', function () {
            saveDraft({ way: w });
            paint();
          });
          wayWrap.appendChild(wb);
        });
        body.appendChild(wayWrap);
        if (d.way === 'Курьер') {
          body.appendChild(field('Город',
            textInput('', 'Например: Тверь', d.city, function (v) { saveDraft({ city: v }); })));
          body.appendChild(field('Улица, дом, квартира',
            textInput('', 'Например: ул. Садовая, 5, кв. 12', d.street,
              function (v) { saveDraft({ street: v }); })));
        } else if (WAYS.indexOf(d.way) >= 0) {
          body.appendChild(field('Город и пункт выдачи',
            textInput('', 'Например: Казань, ул. Баумана, 12', d.pvz,
              function (v) { saveDraft({ pvz: v }); })));
        }
        var comm = doc.createElement('textarea');
        comm.className = 'checkout-input checkout-comment';
        comm.placeholder = 'Не обязательно';
        comm.value = d.comment || '';
        comm.rows = 2;
        comm.addEventListener('input', function () { saveDraft({ comment: comm.value }); });
        body.appendChild(field('Комментарий к заказу', comm));
        /* история 28: тихая ссылка на страницу «Анонимность» */
        body.appendChild(el('p', 'checkout-quiet',
          'Что увидит курьер и как выглядит списание — ' +
          '<a href="#/anonimnost">Анонимность</a>'));
        nextButton(body, 2);
        return;
      }

      if (n === 3) {
        var payWrap = el('div', 'checkout-pays');
        var icons = { 'СБП': '⚡', 'Карта': '💳', 'При получении': '📦' };
        PAYS.forEach(function (p) {
          var pb = el('button', 'checkout-pay' + (d.pay === p ? ' on' : ''),
            '<span class="checkout-pay-ico">' + icons[p] + '</span>' + esc(p));
          pb.addEventListener('click', function () {
            saveDraft({ pay: p });
            paint();
          });
          payWrap.appendChild(pb);
        });
        body.appendChild(payWrap);
        body.appendChild(el('p', 'checkout-quiet',
          'Спишем только после подтверждения заказа менеджером. ' +
          'Реквизиты не вводятся на сайте.'));
        nextButton(body, 3);
        return;
      }

      /* шаг 4 — итог */
      var listEl = el('div', 'checkout-items');
      rows.forEach(function (r) {
        listEl.appendChild(el('div', 'checkout-item',
          '<span>' + esc(r.item.t) + ' × ' + r.qty + '</span>' +
          '<b>' + TMB.ui.price(r.item.n * r.qty) + '</b>'));
      });
      body.appendChild(listEl);
      body.appendChild(el('div', 'checkout-total',
        '<span>Итого</span><b>' + TMB.ui.price(total) + '</b>'));
      body.appendChild(el('p', 'checkout-quiet',
        'Заказ уйдёт менеджеру в Telegram. Он подтвердит состав, доставку и оплату в чате.'));
      var send = el('button', 'checkout-send', 'Отправить заказ');
      send.addEventListener('click', function () {
        if (sending) return; /* двойной тап не создаёт второй заказ */
        var msg = checkStep(1, getDraft()) || checkStep(2, getDraft()) || checkStep(3, getDraft());
        if (msg) { TMB.ui.toast(msg); return; }
        sending = true;
        send.disabled = true;
        submit();
      });
      body.appendChild(send);
    }

    function submit() {
      var d = getDraft();
      var delivery = deliveryOf(d);
      var saved = TMB.store.orders.add({
        items: rows.map(function (r) { return { id: r.id, t: r.item.t, qty: r.qty, n: r.item.n }; }),
        total: total,
        name: String(d.name).trim(),
        contact: String(d.contact).trim(),
        delivery: delivery,
        pay: d.pay,
        comment: d.comment || '',
      });
      var text = orderText({
        num: saved.num,
        items: saved.items,
        name: saved.name,
        contact: saved.contact,
        delivery: delivery,
        pay: saved.pay,
        comment: saved.comment,
      });
      /* заказанное уходит из корзины; галочки-исключения чистим от этих id */
      rows.forEach(function (r) { TMB.store.cart.remove(r.id); });
      var ids = rows.map(function (r) { return r.id; });
      var off = (TMB.store.profile.get().cartOff || []).filter(function (id) {
        return ids.indexOf(id) < 0;
      });
      TMB.store.profile.set({ cartOff: off });

      copyText(text, function (ok) {
        if (!ok) TMB.ui.toast('Не скопировалось — нажмите «Скопировать ещё раз»');
      });
      root.open(TG_URL, '_blank');
      paintDone(saved.num, text);
    }

    /* ── экран «Заказ собран» ── */
    function paintDone(num, text) {
      screen.innerHTML = '';
      var done = el('div', 'checkout-done');
      done.innerHTML =
        '<div class="checkout-done-emoji">📨</div>' +
        '<h1>Заказ собран</h1>' +
        '<div class="checkout-done-num">' + esc(num) + '</div>' +
        '<p>Текст заказа уже скопирован. Откройте Telegram и вставьте сообщение ' +
        'в чат — менеджер подтвердит заказ в Telegram.</p>';
      var tg = el('button', 'checkout-tg', 'Открыть Telegram');
      tg.addEventListener('click', function () { root.open(TG_URL, '_blank'); });
      done.appendChild(tg);
      var again = el('button', 'checkout-copy', 'Скопировать ещё раз');
      again.addEventListener('click', function () {
        copyText(text, function (ok) {
          TMB.ui.toast(ok ? 'Скопировано' : 'Не вышло. Попробуйте ещё раз');
        });
      });
      done.appendChild(again);
      var prof = el('button', 'checkout-profile-link', 'Заказ сохранён в профиле');
      prof.addEventListener('click', function () { TMB.router.go('#/profil'); });
      done.appendChild(prof);
      screen.appendChild(done);
    }

    paint();
  }

  TMB.router.on('#/oformlenie', render);
})(typeof window !== 'undefined' ? window : globalThis);
