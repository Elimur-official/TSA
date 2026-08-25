/* ui.js — общие компоненты «Тумбочки».
 * Публичный интерфейс (interfaces.md):
 *   TMB.ui.price(n)        → '2 890 ₽' (неразрывный пробел между группами)
 *   TMB.ui.productCard(it) → HTMLElement карточки товара (сетка/полка)
 *   TMB.ui.sheet(el)       → {open, close} — нижняя шторка с подложкой
 *   TMB.ui.toast(msg)      — всплывашка над навигацией, сама гаснет
 */
(function (root) {
  'use strict';
  var doc = root.document;

  function price(n) {
    var s = String(Math.round(n));
    var out = '';
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 === 0) out += '\u00A0'; // неразрывный между тысячами
      out += s[i];
    }
    return out + '\u00A0₽'; // неразрывный и перед ₽ — цена не переносится
  }

  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function productCard(item) {
    var card = el('article', 'pcard');
    card.setAttribute('data-id', item.id);

    var phWrap = el('div', 'pcard-ph');
    var img = doc.createElement('img');
    img.src = '../img/' + item.ph + '.jpg';
    img.alt = item.t;
    img.loading = 'lazy';
    img.width = 300; img.height = 400;
    phWrap.appendChild(img);
    if (item.badge) {
      phWrap.appendChild(el('span', 'pcard-badge' + (item.badge === 'Хит' ? ' hit' : ''), item.badge));
    }
    var fav = el('button', 'pcard-fav' + (root.TMB.store.fav.has(item.id) ? ' on' : ''),
      '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21s-7.5-4.9-9.8-9.2C.7 8.9 2 5.4 5.2 4.4c2-.6 4.2.1 5.6 1.8l1.2 1.4 1.2-1.4c1.4-1.7 3.6-2.4 5.6-1.8 3.2 1 4.5 4.5 3 7.4C19.5 16.1 12 21 12 21z" fill="currentColor"/></svg>');
    fav.setAttribute('aria-label', 'В избранное');
    fav.addEventListener('click', function (ev) {
      ev.stopPropagation();
      root.TMB.store.fav.toggle(item.id);
      fav.classList.toggle('on', root.TMB.store.fav.has(item.id));
    });
    phWrap.appendChild(fav);
    card.appendChild(phWrap);

    var body = el('div', 'pcard-body');
    var priceRow = el('div', 'pcard-prices',
      '<b class="pcard-price">' + price(item.n) + '</b>' +
      (item.old ? '<s class="pcard-old">' + price(item.old) + '</s>' : ''));
    body.appendChild(priceRow);
    body.appendChild(el('div', 'pcard-title', item.t));
    if (item.orders > 0) {
      body.appendChild(el('div', 'pcard-orders', formatOrders(item.orders) + ' заказали'));
    }
    var btn = el('button', 'pcard-add', 'В корзину');
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      root.TMB.store.cart.add(item.id);
      toast('В корзине 🖤');
    });
    body.appendChild(btn);
    card.appendChild(body);

    card.addEventListener('click', function () {
      root.TMB.router.go('#/tovar/' + item.id);
    });
    return card;
  }

  function formatOrders(n) {
    if (n >= 1000) {
      var k = Math.floor(n / 100) / 10;
      return String(k).replace('.', ',') + ' тыс.';
    }
    return String(n);
  }

  function sheet(contentEl) {
    var wrap = el('div', 'tmb-sheet-wrap');
    var backdrop = el('div', 'tmb-sheet-backdrop');
    var panel = el('div', 'tmb-sheet');
    panel.appendChild(el('div', 'tmb-sheet-grip'));
    panel.appendChild(contentEl);
    wrap.appendChild(backdrop);
    wrap.appendChild(panel);
    function open() {
      doc.body.appendChild(wrap);
      doc.body.classList.add('no-scroll');
      root.requestAnimationFrame(function () { wrap.classList.add('open'); });
    }
    function close() {
      wrap.classList.remove('open');
      doc.body.classList.remove('no-scroll');
      setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 260);
    }
    backdrop.addEventListener('click', close);
    return { open: open, close: close };
  }

  var toastTimer = null;
  function toast(msg) {
    var t = doc.getElementById('tmb-toast');
    if (!t) {
      t = el('div', '', '');
      t.id = 'tmb-toast';
      doc.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  var TMB = (root.TMB = root.TMB || {});
  TMB.ui = { price: price, productCard: productCard, sheet: sheet, toast: toast };
})(typeof window !== 'undefined' ? window : globalThis);
