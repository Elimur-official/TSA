/* views/home.js — экран «#/»: мозаика-презентация (первый экран: большой
 * баннер «Кто мы» + два поменьше в ряд, без свайпа и точек — таск 12),
 * чипсы категорий, полки по намерению с мем-подписями, баннер-карусель
 * «Глаза разбежались» (после полок) и бесконечная лента порциями по 20.
 * Карточки — только через TMB.ui.productCard. Регистрация — самовызовом.
 * Тексты экрана — зона «дерзко»: смеёмся над ситуацией, никогда над
 * телом, неопытностью или одиночеством (правило спеки от 18.08). */
(function (root) {
  'use strict';
  var TMB = (root.TMB = root.TMB || {});
  if (!root.document || !TMB.router) return;

  var doc = root.document;
  var PAGE = 20;
  var feedShown = PAGE; // память глубины ленты: вернулась — лента той же высоты

  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  var itemById = null;
  function item(id) {
    if (!itemById) {
      itemById = {};
      TMB.data.items.forEach(function (it) { itemById[it.id] = it; });
    }
    return itemById[id];
  }

  /* стикеры полок (зона «дерзко», мем-подписи приходят из data.shelves.sub) */
  var STICKER = {
    'pervyj-raz': '🌸', solo: '💅', 'dlya-dvoih': '🔥', tihie: '🤫', probki: '💎',
  };

  var SLIDES = [
    {
      cls: 'home-slide--pink', emoji: '🛍️',
      title: 'Глаза разбежались?',
      text: 'Это норма. Тут сто соблазнов и одна корзина.',
      btn: 'В каталог',
      go: function () { TMB.router.go('#/katalog/vse'); },
    },
    {
      cls: 'home-slide--sun', emoji: '💛',
      title: 'Подборка недели',
      text: 'Полки выше собраны за тебя. Листай и складывай.',
      btn: 'К полкам',
      go: function () {
        var s = doc.querySelector('.home-shelves');
        if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
    {
      cls: 'home-slide--cobalt', emoji: '📦',
      title: 'Скромная коробка',
      text: 'Без надписей снаружи. Что внутри — знаешь только ты.',
      btn: 'Про анонимность',
      go: function () { TMB.router.go('#/anonimnost'); },
    },
  ];

  function banner() {
    var sec = el('section', 'home-banner-wrap');
    var row = el('div', 'home-banner');
    SLIDES.forEach(function (s) {
      var slide = el('article', 'home-slide ' + s.cls);
      slide.innerHTML =
        '<span class="home-slide-emoji">' + s.emoji + '</span>' +
        '<h2>' + s.title + '</h2><p>' + s.text + '</p>';
      var b = el('button', 'home-slide-btn', s.btn);
      b.addEventListener('click', s.go);
      slide.appendChild(b);
      row.appendChild(slide);
    });
    sec.appendChild(row);

    var dots = el('div', 'home-dots');
    SLIDES.forEach(function (_, i) {
      var d = el('button', 'home-dot' + (i === 0 ? ' on' : ''));
      d.setAttribute('aria-label', 'Слайд ' + (i + 1));
      d.addEventListener('click', function () {
        row.scrollTo({ left: i * row.clientWidth, behavior: 'smooth' });
      });
      dots.appendChild(d);
    });
    row.addEventListener('scroll', function () {
      var i = Math.round(row.scrollLeft / Math.max(1, row.clientWidth));
      for (var j = 0; j < dots.children.length; j++) {
        dots.children[j].classList.toggle('on', j === i);
      }
    }, { passive: true });
    sec.appendChild(dots);
    return sec;
  }

  /* ── мозаика-презентация «Тумбочки» (G09/G16): нас ещё не знают — знакомимся.
   * Разметка владельца (таск 12): большой баннер «Кто мы» во всю ширину,
   * под ним два поменьше в ряд; свайпа и точек нет, тап по всей плитке.
   * Обложка — зона «дерзко», плитки про страхи — тихо и по-взрослому. */
  var PROMO = [
    {
      cls: 'home-promo-slide--cover', emoji: '🗝️', tag: 'Кто мы',
      title: 'Тумбочка — магазин, где не стыдно',
      text: 'Выбирай спокойно: без осуждения и лишних глаз. Всё для взрослых — и всё по-честному.',
      go: function () {
        var s = doc.querySelector('.home-shelves');
        if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
    {
      emoji: '📦', tag: 'Анонимность',
      title: 'Коробка без надписей',
      /* формулировка сверена с экраном анонимности — он авторитет */
      text: 'На этикетке — имя получателя и адрес, о содержимом ни слова.',
      btn: 'Как это устроено', href: '#/anonimnost',
    },
    {
      emoji: '🛡️', tag: 'Безопасность',
      title: 'Реквизиты на сайте не вводятся',
      text: 'Заказ уходит в Telegram, данные остаются в твоём телефоне.',
      btn: 'Политика данных', href: './politika.html',
    },
  ];

  function promo() {
    var sec = el('section', 'home-promo');
    var grid = el('div', 'home-promo-grid');
    PROMO.forEach(function (s) {
      var tile;
      if (s.href) {
        /* вся плитка — ссылка: хеш уводит роутером, politika — страницей */
        tile = el('a', 'home-promo-slide' + (s.cls ? ' ' + s.cls : ''));
        tile.href = s.href;
      } else {
        tile = el('article', 'home-promo-slide' + (s.cls ? ' ' + s.cls : ''));
        tile.tabIndex = 0;
        tile.setAttribute('role', 'button');
        tile.addEventListener('click', s.go);
        tile.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); s.go(); }
        });
      }
      tile.innerHTML =
        '<span class="home-promo-tag">' + s.tag + '</span>' +
        '<span class="home-promo-emoji">' + s.emoji + '</span>' +
        '<h2>' + s.title + '</h2><p>' + s.text + '</p>' +
        (s.btn ? '<span class="home-promo-btn">' + s.btn + '</span>' : '');
      grid.appendChild(tile);
    });
    sec.appendChild(grid);
    return sec;
  }

  function chips() {
    var row = el('div', 'home-chips');
    function chip(emoji, name, go) {
      var c = el('button', 'home-chip', '<span>' + emoji + '</span>' + name);
      c.addEventListener('click', go);
      row.appendChild(c);
    }
    chip('✨', 'Все', function () { TMB.router.go('#/katalog/vse'); });
    TMB.data.cats.forEach(function (c) {
      chip(c.emoji, c.name, function () {
        TMB.router.go('#/katalog/' + encodeURIComponent(c.id));
      });
    });
    return row;
  }

  function shelves() {
    var sec = el('section', 'home-shelves');
    TMB.data.shelves.forEach(function (sh) {
      var s = el('div', 'home-shelf');
      var head = el('div', 'home-shelf-head',
        '<span class="home-shelf-sticker">' + (STICKER[sh.id] || '✨') + '</span>' +
        '<div class="home-shelf-titles"><h2>' + sh.name + '</h2>' +
        '<p>' + sh.sub + '</p></div>');
      var row = el('div', 'home-shelf-row');
      sh.ids.forEach(function (id) {
        var it = item(id);
        if (it) row.appendChild(TMB.ui.productCard(it));
      });
      s.appendChild(head);
      s.appendChild(row);
      sec.appendChild(s);
    });
    return sec;
  }

  function feed() {
    var sec = el('section', 'home-feed');
    sec.appendChild(el('div', 'home-feed-head',
      '<h2>Залипательная лента</h2><p>Всё, что есть, подряд — листай, пока не ёкнет.</p>'));
    var list = TMB.data.items.slice().sort(function (a, b) { return b.orders - a.orders; });
    var grid = el('div', 'home-grid');
    var shown = 0;
    function more(n) {
      list.slice(shown, shown + n).forEach(function (it) {
        grid.appendChild(TMB.ui.productCard(it));
      });
      shown = Math.min(shown + n, list.length);
    }
    more(feedShown);
    sec.appendChild(grid);

    if (shown < list.length) {
      var sent = el('div', 'home-more');
      sec.appendChild(sent);
      if ('IntersectionObserver' in root) {
        var io = new root.IntersectionObserver(function (en) {
          /* экран сменился, sentinel вне DOM — наблюдатель гасим, не копим */
          if (!sent.isConnected) { io.disconnect(); return; }
          if (!en[0].isIntersecting) return;
          more(PAGE);
          feedShown = shown;
          if (shown >= list.length) { io.disconnect(); sent.remove(); }
        }, { rootMargin: '600px' });
        io.observe(sent);
      } else {
        more(list.length);
        sent.remove();
      }
    }
    return sec;
  }

  TMB.router.on('#/', function (container) {
    /* порядок блоков — таск 09: сперва знакомство (крупная презентация),
     * потом товары, развлекательный баннер — после полок, перед лентой */
    var wrap = el('div', 'home');
    wrap.appendChild(promo());
    wrap.appendChild(chips());
    wrap.appendChild(el('div', 'home-wave'));
    wrap.appendChild(shelves());
    wrap.appendChild(el('div', 'home-wave home-wave--sun'));
    wrap.appendChild(banner());
    wrap.appendChild(feed());
    container.appendChild(wrap);
  });
})(typeof window !== 'undefined' ? window : globalThis);
