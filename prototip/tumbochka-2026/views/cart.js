/* views/cart.js — экран «#/korzina»: строки с чекбоксами, степпер, «Все»,
 * сумма выбранного, sticky-полоса «К оформлению». Зона тона — «дерзко»
 * (шутка только в пустой корзине). Регистрация в роутере — самовызовом.
 *
 * Невыбранные строки живут в TMB.store.profile, ключ cartOff (массив id) —
 * галочки переживают перезагрузку; оформление читает тот же ключ. */
(function (root) {
  'use strict';
  var TMB = root.TMB;
  var doc = root.document;

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

  /* строки корзины, склеенные с товарами каталога */
  function rows() {
    var byId = {};
    TMB.data.items.forEach(function (it) { byId[it.id] = it; });
    return TMB.store.cart.list()
      .map(function (r) { return { id: r.id, qty: r.qty, item: byId[r.id] }; })
      .filter(function (r) { return !!r.item; });
  }
  function offList() { return TMB.store.profile.get().cartOff || []; }
  function setOff(list) { TMB.store.profile.set({ cartOff: list }); }
  function isOn(id) { return offList().indexOf(id) < 0; }
  function toggle(id) {
    var off = offList().slice();
    var i = off.indexOf(id);
    if (i >= 0) off.splice(i, 1);
    else off.push(id);
    setOff(off);
  }

  function render(el0) {
    var screen = el('div', 'cart-screen');
    el0.appendChild(screen);
    paint(screen);
  }

  function paint(screen) {
    screen.innerHTML = '';
    var list = rows();

    /* ── пустая корзина: дружелюбно, зона «дерзко» ── */
    if (!list.length) {
      var empty = el('div', 'cart-empty');
      empty.innerHTML =
        '<div class="cart-empty-emoji">🕯️</div>' +
        '<h1>Тут пока тихо.<br>Подозрительно тихо</h1>' +
        '<p>Тумбочка сама себя не наполнит. Загляни в каталог — там весело.</p>';
      var goBtn = el('button', 'cart-empty-btn', 'За покупками');
      goBtn.addEventListener('click', function () { TMB.router.go('#/katalog'); });
      empty.appendChild(goBtn);
      screen.appendChild(empty);
      return;
    }

    var selected = list.filter(function (r) { return isOn(r.id); });
    var sum = selected.reduce(function (s, r) { return s + r.item.n * r.qty; }, 0);
    var sumOld = selected.reduce(function (s, r) {
      return s + (r.item.old || r.item.n) * r.qty;
    }, 0);
    var pcs = selected.reduce(function (s, r) { return s + r.qty; }, 0);

    /* ── шапка: заголовок + «Все» ── */
    var head = el('div', 'cart-head');
    head.appendChild(el('h1', 'cart-title',
      'Корзина <span class="cart-count">' + list.length + '</span>'));
    var allLabel = el('label', 'cart-all');
    var allCb = doc.createElement('input');
    allCb.type = 'checkbox';
    allCb.checked = offList().length === 0;
    allLabel.appendChild(allCb);
    allLabel.appendChild(el('span', 'cart-cb'));
    allLabel.appendChild(el('b', '', 'Все'));
    allCb.addEventListener('change', function () {
      setOff(allCb.checked ? [] : list.map(function (r) { return r.id; }));
      paint(screen);
    });
    head.appendChild(allLabel);
    screen.appendChild(head);

    /* ── строки товаров ── */
    var wrap = el('div', 'cart-list');
    list.forEach(function (r) {
      var row = el('article', 'cart-row');

      var check = el('label', 'cart-check');
      var cb = doc.createElement('input');
      cb.type = 'checkbox';
      cb.checked = isOn(r.id);
      check.appendChild(cb);
      check.appendChild(el('span', 'cart-cb'));
      cb.addEventListener('change', function () { toggle(r.id); paint(screen); });
      row.appendChild(check);

      var ph = el('div', 'cart-ph');
      var img = doc.createElement('img');
      img.src = '../img/' + r.item.ph + '.jpg';
      img.alt = r.item.t;
      img.loading = 'lazy';
      img.width = 72; img.height = 96;
      ph.appendChild(img);
      ph.addEventListener('click', function () { TMB.router.go('#/tovar/' + r.id); });
      row.appendChild(ph);

      var info = el('div', 'cart-info');
      info.appendChild(el('div', 'cart-prices',
        '<b>' + TMB.ui.price(r.item.n * r.qty) + '</b>' +
        (r.item.old ? '<s>' + TMB.ui.price(r.item.old * r.qty) + '</s>' : '')));
      var title = el('div', 'cart-name', esc(r.item.t));
      title.addEventListener('click', function () { TMB.router.go('#/tovar/' + r.id); });
      info.appendChild(title);

      var foot = el('div', 'cart-row-foot');
      var step = el('div', 'cart-stepper');
      var minus = el('button', 'cart-step-btn' + (r.qty <= 1 ? ' off' : ''), '−');
      minus.setAttribute('aria-label', 'Меньше');
      minus.addEventListener('click', function () {
        if (r.qty > 1) { TMB.store.cart.setQty(r.id, r.qty - 1); paint(screen); }
      });
      var plus = el('button', 'cart-step-btn', '+');
      plus.setAttribute('aria-label', 'Больше');
      plus.addEventListener('click', function () {
        if (r.qty < 99) { TMB.store.cart.setQty(r.id, r.qty + 1); paint(screen); }
      });
      step.appendChild(minus);
      step.appendChild(el('span', 'cart-qty', r.qty));
      step.appendChild(plus);
      foot.appendChild(step);

      var del = el('button', 'cart-del', 'Удалить');
      del.addEventListener('click', function () {
        TMB.store.cart.remove(r.id);
        setOff(offList().filter(function (id) { return id !== r.id; }));
        TMB.ui.toast('Убрали из корзины');
        paint(screen);
      });
      foot.appendChild(del);
      info.appendChild(foot);
      row.appendChild(info);
      wrap.appendChild(row);
    });
    screen.appendChild(wrap);

    /* ── сводка по выбранному ── */
    var sumCard = el('div', 'cart-summary');
    sumCard.appendChild(el('div', 'cart-sum-row',
      '<span>Товары, ' + pcs + ' шт</span><span>' + TMB.ui.price(sumOld) + '</span>'));
    if (sumOld > sum) {
      sumCard.appendChild(el('div', 'cart-sum-row sale',
        '<span>Скидка Тумбочки</span><span>−' + TMB.ui.price(sumOld - sum) + '</span>'));
    }
    sumCard.appendChild(el('div', 'cart-sum-row total',
      '<span>Итого</span><b>' + TMB.ui.price(sum) + '</b>'));
    screen.appendChild(sumCard);

    /* ── sticky-полоса «К оформлению» ── */
    var cta = el('button', 'cart-cta' + (selected.length ? '' : ' off'));
    cta.innerHTML = selected.length
      ? '<span>К оформлению</span><b>' + TMB.ui.price(sum) + '</b>'
      : '<span>Выбери товары</span>';
    cta.addEventListener('click', function () {
      if (!selected.length) { TMB.ui.toast('Отметь хотя бы один товар'); return; }
      TMB.router.go('#/oformlenie');
    });
    screen.appendChild(cta);
  }

  TMB.router.on('#/korzina', render);
})(window);
