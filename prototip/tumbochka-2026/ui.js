/* ui.js — общие компоненты «Тумбочки».
 * Публичный интерфейс (interfaces.md):
 *   TMB.ui.price(n)        → '2 890 ₽' (неразрывный пробел между группами)
 *   TMB.ui.productCard(it) → HTMLElement карточки товара (сетка/полка)
 *   TMB.ui.sheet(el)       → {open, close} — нижняя шторка с подложкой
 *   TMB.ui.toast(msg)      — всплывашка над навигацией, сама гаснет
 *   TMB.ui.dostavkaDate(from?) → '28 августа' — дата доставки: from (или
 *                            сегодня) + 3 дня, по-русски, без года. Чистая,
 *                            работает в Node без DOM (юниты таска 08).
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

  /* месяцы в родительном падеже — для даты доставки («28 августа») */
  var MES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function dostavkaDate(from) {
    var d = new Date(from ? from.getTime() : Date.now());
    d.setDate(d.getDate() + 3); // привезём через три дня — обещание витрины
    return d.getDate() + ' ' + MES[d.getMonth()];
  }

  function productCard(item) {
    var card = el('article', 'pcard');
    card.setAttribute('data-id', item.id);

    var phWrap = el('div', 'pcard-ph');
    /* Галерея фото (G14): свайп по ракурсам внутри карточки, как на маркетплейсах.
       Строится всегда, но листается только в вертикальных сетках — родитель
       display:grid даёт классу pcard-swipe включить скролл и точки (в
       горизонтальных полках карточка остаётся статичной, первое фото). */
    var gallery = item.gallery && item.gallery.length > 1 ? item.gallery.slice(0, 4) : null;
    if (gallery) {
      var gal = el('div', 'pcard-gal');
      gallery.forEach(function (name, i) {
        var slide = doc.createElement('img');
        /* первое фото — сразу; остальные ждут первого свайпа (data-src) */
        if (i === 0) slide.src = '../img/' + name + '.jpg';
        else slide.setAttribute('data-src', '../img/' + name + '.jpg');
        slide.alt = i === 0 ? item.t : item.t + ', фото ' + (i + 1);
        slide.loading = 'lazy';
        slide.width = 300; slide.height = 400;
        gal.appendChild(slide);
      });
      phWrap.appendChild(gal);

      var hydrated = false;
      function hydrate() { /* догрузить скрытые ракурсы один раз */
        if (hydrated) return;
        hydrated = true;
        var lazy = gal.querySelectorAll('img[data-src]');
        for (var k = 0; k < lazy.length; k++) {
          lazy[k].src = lazy[k].getAttribute('data-src');
          lazy[k].removeAttribute('data-src');
        }
      }

      var dots = el('div', 'pcard-dots');
      var dotEls = gallery.map(function (_, i) {
        var d = el('button', 'pcard-dot' + (i === 0 ? ' on' : ''));
        d.setAttribute('aria-label', 'Фото ' + (i + 1) + ' из ' + gallery.length);
        d.addEventListener('click', function (ev) {
          ev.stopPropagation(); /* точка листает, а не открывает товар */
          hydrate();
          gal.scrollTo({ left: i * gal.clientWidth, behavior: 'smooth' });
        });
        dots.appendChild(d);
        return d;
      });
      phWrap.appendChild(dots);

      /* Включение свайпа не привязано к кадру вставки: IntersectionObserver
         срабатывает, когда карточка реально в DOM и подъезжает к вьюпорту —
         в том числе у вставленных позже (фрагмент, пагинация ленты). Первый
         жест по фото — страховка, если наблюдателя нет или он не успел. */
      var swipeDecided = false;
      var io = null;
      function decideSwipe() {
        if (swipeDecided || !card.isConnected || !card.parentElement) return;
        swipeDecided = true;
        if (io) { io.disconnect(); io = null; }
        if (root.getComputedStyle(card.parentElement).display === 'grid') {
          card.classList.add('pcard-swipe');
        }
      }
      if (typeof root.IntersectionObserver === 'function') {
        io = new root.IntersectionObserver(function () { decideSwipe(); }, { rootMargin: '200px' });
        io.observe(card);
      } else if (root.requestAnimationFrame) {
        root.requestAnimationFrame(decideSwipe);
      }

      function wake() { decideSwipe(); hydrate(); }
      gal.addEventListener('touchstart', wake, { passive: true });
      gal.addEventListener('pointerdown', wake, { passive: true });
      var ticking = false;
      gal.addEventListener('scroll', function () {
        hydrate();
        if (ticking) return;
        ticking = true;
        root.requestAnimationFrame(function () {
          ticking = false;
          var idx = Math.round(gal.scrollLeft / Math.max(gal.clientWidth, 1));
          for (var k = 0; k < dotEls.length; k++) dotEls[k].classList.toggle('on', k === idx);
        });
      }, { passive: true });

      if (root.requestAnimationFrame) {
        root.requestAnimationFrame(function () {
          var p = card.parentElement;
          if (p && root.getComputedStyle(p).display === 'grid') card.classList.add('pcard-swipe');
        });
      }
    } else {
      var img = doc.createElement('img');
      img.src = '../img/' + item.ph + '.jpg';
      img.alt = item.t;
      img.loading = 'lazy';
      img.width = 300; img.height = 400;
      phWrap.appendChild(img);
    }
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
    /* кнопка-плашка как на маркетплейсах: корзинка + дата доставки (G12) */
    var data = dostavkaDate();
    var btn = el('button', 'pcard-add',
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M4 6h2l2.2 10.2a1.5 1.5 0 0 0 1.47 1.2h7.9a1.5 1.5 0 0 0 1.46-1.16L20.8 9H7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10.5" cy="20.5" r="1.4" fill="currentColor"/><circle cx="17.5" cy="20.5" r="1.4" fill="currentColor"/></svg>' +
      '<span>' + data + '</span>');
    btn.setAttribute('aria-label', 'В корзину, доставка ' + data);
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
  TMB.ui = { price: price, productCard: productCard, sheet: sheet, toast: toast, dostavkaDate: dostavkaDate };
})(typeof window !== 'undefined' ? window : globalThis);
