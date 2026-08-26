/* views/katalog.js — экран «#/katalog»: плитки категорий и выдача
 * с поиском, фильтрами, сортировкой. Регистрация в роутере — самовызовом.
 *
 * Чистая логика (поиск/фильтры/сортировка) вынесена в TMB.katalogLogic и
 * работает в Node без DOM — её проверяют юниты tests/katalog-logika.test.mjs.
 * Вьюха регистрируется только в браузере (guard на root.document).
 *
 * Контракт поиска: оболочка по Enter шлёт в #/katalog; каталог сам читает
 * #search.value при рендере и слушает input, фильтруя вживую на этом экране.
 */
(function (root) {
  'use strict';
  var TMB = (root.TMB = root.TMB || {});

  /* ══════════ чистая логика ══════════ */

  function norm(q) {
    return String(q == null ? '' : q).trim().toLowerCase();
  }

  /* товар ищется по названию, категории и тегам */
  function matches(it, q) {
    if (it.t.toLowerCase().indexOf(q) >= 0) return true;
    if (it.cat.toLowerCase().indexOf(q) >= 0) return true;
    for (var i = 0; i < it.tags.length; i++) {
      if (it.tags[i].toLowerCase().indexOf(q) >= 0) return true;
    }
    return false;
  }

  /* забытая раскладка: «db,h» набрано на ЙЦУКЕН-клавишах = «вибр» */
  var LAYOUT = {
    q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ',
    p: 'з', '[': 'х', ']': 'ъ', a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п',
    h: 'р', j: 'о', k: 'л', l: 'д', ';': 'ж', "'": 'э', z: 'я', x: 'ч',
    c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь', ',': 'б', '.': 'ю', '`': 'ё',
  };
  function convertLayout(q) {
    var out = '';
    for (var i = 0; i < q.length; i++) {
      var ch = q[i];
      out += Object.prototype.hasOwnProperty.call(LAYOUT, ch) ? LAYOUT[ch] : ch;
    }
    return out;
  }

  function searchItems(items, q) {
    q = norm(q);
    if (!q) return items.slice();
    var out = items.filter(function (it) { return matches(it, q); });
    if (out.length === 0) {
      var alt = convertLayout(q);
      if (alt !== q) {
        out = items.filter(function (it) { return matches(it, alt); });
      }
    }
    return out;
  }

  /* свойства-фильтры: теговые — по tags, тихие/без мотора — по noise
   * (interfaces.md: noise 0 — без мотора, 1 — тише шёпота) */
  var PROP_TAG = { vakuum: 'вакуум', podogrev: 'подогрев', pult: 'пульт', frikcii: 'фрикции' };
  function hasProp(it, key) {
    if (key === 'tihie') return it.noise <= 1;
    if (key === 'bezmotora') return it.noise === 0;
    return it.tags.indexOf(PROP_TAG[key]) >= 0;
  }

  /* f: { cat, min, max, props: {vakuum,podogrev,pult,frikcii,tihie,bezmotora} } */
  function filterItems(items, f) {
    f = f || {};
    var props = f.props || {};
    return items.filter(function (it) {
      if (f.cat && it.cat !== f.cat) return false;
      if (f.min != null && f.min !== '' && it.n < Number(f.min)) return false;
      if (f.max != null && f.max !== '' && it.n > Number(f.max)) return false;
      for (var key in props) {
        if (props[key] && !hasProp(it, key)) return false;
      }
      return true;
    });
  }

  /* mode: 'pop' — популярные (по заказам), 'cheap' — дешевле, 'exp' — дороже */
  function sortItems(items, mode) {
    var out = items.slice();
    if (mode === 'cheap') out.sort(function (a, b) { return a.n - b.n; });
    else if (mode === 'exp') out.sort(function (a, b) { return b.n - a.n; });
    else out.sort(function (a, b) { return b.orders - a.orders; });
    return out;
  }

  /* s: { q, cat, min, max, props, sort } — поиск → фильтр → сортировка */
  function applyAll(items, s) {
    s = s || {};
    return sortItems(filterItems(searchItems(items, s.q), s), s.sort || 'pop');
  }

  var logic = {
    searchItems: searchItems,
    convertLayout: convertLayout,
    filterItems: filterItems,
    sortItems: sortItems,
    applyAll: applyAll,
  };
  TMB.katalogLogic = logic;

  /* ══════════ вьюха (только браузер) ══════════ */
  if (!root.document || !TMB.router) return;

  var doc = root.document;
  var PAGE = 20;

  /* Состояние выдачи живёт между рендерами; категория приходит из маршрута:
   * #/katalog — плитки, #/katalog/{cat} — выдача категории, #/katalog/vse — все. */
  var state = { cat: null, q: '', min: '', max: '', props: {}, sort: 'pop' };
  var screenEl = null;
  var listingForced = false;

  var PROPS_UI = [
    ['vakuum', 'Вакуум'], ['podogrev', 'Подогрев'], ['pult', 'С пультом'],
    ['frikcii', 'Фрикции'], ['tihie', 'Тише шёпота'], ['bezmotora', 'Без мотора'],
  ];
  var PASTEL = ['pink', 'sun', 'cobalt', 'green', 'orange'];

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
  function plural(n, forms) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return forms[0];
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return forms[1];
    return forms[2];
  }
  function tovarov(n) { return n + ' ' + plural(n, ['товар', 'товара', 'товаров']); }
  function searchInput() { return doc.getElementById('search'); }

  function activeCount(s) {
    var n = 0;
    if (s.cat) n += 1;
    if (s.min !== '' && s.min != null) n += 1;
    if (s.max !== '' && s.max != null) n += 1;
    for (var k in s.props) if (s.props[k]) n += 1;
    return n;
  }

  function render(container, params) {
    screenEl = container;
    listingForced = !!(params && params.id);
    if (listingForced) {
      state.cat = params.id === 'vse' ? null : params.id;
      /* плитка/чипс — новое намерение: старый поисковый запрос очищается */
      var inp = searchInput();
      if (inp) inp.value = '';
      state.q = '';
    } else {
      state.cat = null;
      var inp2 = searchInput();
      state.q = inp2 ? inp2.value.trim() : '';
    }
    renderScreen();
  }

  function renderScreen() {
    if (!screenEl) return;
    screenEl.innerHTML = '';
    if (!listingForced && !state.q) renderTiles(screenEl);
    else renderListing(screenEl);
  }

  /* ── плитки категорий ── */
  function renderTiles(m) {
    var wrap = el('div', 'katalog');
    wrap.appendChild(el('header', 'katalog-tiles-head',
      '<h1>Каталог</h1><p>Полки разложены — выбирай, что поедет в тумбочку.</p>'));
    var grid = el('div', 'katalog-tiles');
    TMB.data.cats.forEach(function (c, i) {
      var t = el('button', 'katalog-tile katalog-tile--' + PASTEL[i % PASTEL.length]);
      t.innerHTML =
        '<span class="katalog-tile-emoji">' + c.emoji + '</span>' +
        '<b class="katalog-tile-name">' + esc(c.name) + '</b>' +
        '<span class="katalog-tile-count">' + tovarov(c.count) + '</span>';
      t.addEventListener('click', function () {
        TMB.router.go('#/katalog/' + encodeURIComponent(c.id));
      });
      grid.appendChild(t);
    });
    wrap.appendChild(grid);
    m.appendChild(wrap);
  }

  /* ── выдача: заголовок, сортировка, фильтры, сетка порциями ── */
  function renderListing(m) {
    var wrap = el('div', 'katalog');
    var list = logic.applyAll(TMB.data.items, state);

    var title = state.cat || (state.q ? 'Поиск' : 'Все товары');
    var head = el('header', 'katalog-head',
      '<h1>' + esc(title) + '</h1>' +
      '<p class="katalog-count">' +
      (list.length ? 'Нашлось ' + tovarov(list.length) : 'Пока пусто') + '</p>');
    wrap.appendChild(head);

    var controls = el('div', 'katalog-controls');
    var sortBox = el('div', 'katalog-sort');
    [['pop', 'Популярные'], ['cheap', 'Дешевле'], ['exp', 'Дороже']].forEach(function (p) {
      var b = el('button', 'katalog-sort-btn' + (state.sort === p[0] ? ' on' : ''), p[1]);
      b.addEventListener('click', function () {
        if (state.sort === p[0]) return;
        state.sort = p[0];
        renderScreen();
      });
      sortBox.appendChild(b);
    });
    controls.appendChild(sortBox);

    var n = activeCount(state);
    var fbtn = el('button', 'katalog-fbtn',
      'Фильтры' + (n ? '<span class="katalog-fbtn-n">' + n + '</span>' : ''));
    fbtn.addEventListener('click', openFilterSheet);
    controls.appendChild(fbtn);
    wrap.appendChild(controls);

    if (!list.length) {
      var empty = el('div', 'katalog-empty',
        '<div class="katalog-empty-emoji">🔍</div>' +
        '<h2>Ничего не нашлось</h2>' +
        '<p>Даже у нас такого нет — а у нас есть многое. Сбрось фильтры и посмотри ещё раз.</p>');
      var reset = el('button', 'katalog-reset', 'Сбросить всё');
      reset.addEventListener('click', resetAll);
      empty.appendChild(reset);
      wrap.appendChild(empty);
    } else {
      fillGrid(wrap, list);
    }
    m.appendChild(wrap);
  }

  function resetAll() {
    var inp = searchInput();
    if (inp) inp.value = '';
    state.cat = null;
    state.q = '';
    state.min = '';
    state.max = '';
    state.props = {};
    renderScreen();
  }

  function fillGrid(wrap, list) {
    var grid = el('div', 'katalog-grid');
    var shown = 0;
    function more() {
      list.slice(shown, shown + PAGE).forEach(function (it) {
        grid.appendChild(TMB.ui.productCard(it));
      });
      shown = Math.min(shown + PAGE, list.length);
    }
    more();
    wrap.appendChild(grid);
    if (shown < list.length) {
      var sent = el('div', 'katalog-more');
      wrap.appendChild(sent);
      if ('IntersectionObserver' in root) {
        var io = new root.IntersectionObserver(function (en) {
          /* экран сменился, sentinel вне DOM — наблюдатель гасим, не копим */
          if (!sent.isConnected) { io.disconnect(); return; }
          if (!en[0].isIntersecting) return;
          more();
          if (shown >= list.length) { io.disconnect(); sent.remove(); }
        }, { rootMargin: '600px' });
        io.observe(sent);
      } else {
        while (shown < list.length) more();
        sent.remove();
      }
    }
  }

  /* ── шторка фильтров: черновик применяется кнопкой «Показать N» ── */
  function openFilterSheet() {
    var draft = {
      cat: state.cat, min: state.min, max: state.max,
      props: Object.assign({}, state.props),
    };
    var box = el('div', 'katalog-sheet');
    box.appendChild(el('h2', 'katalog-sheet-title', 'Фильтры'));

    box.appendChild(el('h3', 'katalog-sheet-h', 'Категория'));
    var catRow = el('div', 'katalog-chips');
    var catChips = [];
    function catChip(label, val) {
      var c = el('button', 'katalog-chip', esc(label));
      c.addEventListener('click', function () {
        draft.cat = (draft.cat === val) ? null : val;
        refresh();
      });
      catChips.push({ elx: c, val: val });
      catRow.appendChild(c);
    }
    catChip('Любая', null);
    TMB.data.cats.forEach(function (c) { catChip(c.name, c.id); });
    box.appendChild(catRow);

    box.appendChild(el('h3', 'katalog-sheet-h', 'Цена, ₽'));
    var priceRow = el('div', 'katalog-price');
    var minI = doc.createElement('input');
    minI.type = 'number'; minI.min = '0'; minI.placeholder = 'от';
    minI.value = draft.min;
    var maxI = doc.createElement('input');
    maxI.type = 'number'; maxI.min = '0'; maxI.placeholder = 'до';
    maxI.value = draft.max;
    minI.addEventListener('input', function () { draft.min = minI.value; refresh(); });
    maxI.addEventListener('input', function () { draft.max = maxI.value; refresh(); });
    priceRow.appendChild(minI);
    priceRow.appendChild(el('span', 'katalog-price-dash', '—'));
    priceRow.appendChild(maxI);
    box.appendChild(priceRow);

    box.appendChild(el('h3', 'katalog-sheet-h', 'Свойства'));
    var propRow = el('div', 'katalog-chips');
    var propChips = [];
    PROPS_UI.forEach(function (p) {
      var c = el('button', 'katalog-chip', p[1]);
      c.addEventListener('click', function () {
        draft.props[p[0]] = !draft.props[p[0]];
        refresh();
      });
      propChips.push({ elx: c, key: p[0] });
      propRow.appendChild(c);
    });
    box.appendChild(propRow);

    var actions = el('div', 'katalog-sheet-actions');
    var resetB = el('button', 'katalog-sheet-reset', 'Сбросить');
    var showB = el('button', 'katalog-sheet-show');
    actions.appendChild(resetB);
    actions.appendChild(showB);
    box.appendChild(actions);

    function refresh() {
      catChips.forEach(function (c) { c.elx.classList.toggle('on', draft.cat === c.val && c.val !== null); });
      catChips[0].elx.classList.toggle('on', !draft.cat);
      propChips.forEach(function (c) { c.elx.classList.toggle('on', !!draft.props[c.key]); });
      var found = logic.applyAll(TMB.data.items, {
        q: state.q, cat: draft.cat, min: draft.min, max: draft.max, props: draft.props,
      });
      showB.textContent = found.length ? 'Показать ' + tovarov(found.length) : 'Ничего не нашлось';
      showB.disabled = !found.length;
    }
    refresh();

    var sh = TMB.ui.sheet(box);
    resetB.addEventListener('click', function () {
      draft.cat = null; draft.min = ''; draft.max = ''; draft.props = {};
      minI.value = ''; maxI.value = '';
      refresh();
    });
    showB.addEventListener('click', function () {
      state.cat = draft.cat;
      state.min = draft.min;
      state.max = draft.max;
      state.props = draft.props;
      sh.close();
      renderScreen();
    });
    sh.open();
  }

  /* ── живой поиск: оболочка шлёт Enter → #/katalog, дальше слушаем сами ── */
  var debounceT = null;
  doc.addEventListener('input', function (ev) {
    var t = ev.target;
    if (!t || t.id !== 'search') return;
    if (TMB.router.current() !== '#/katalog') return;
    if (debounceT) root.clearTimeout(debounceT);
    debounceT = root.setTimeout(function () {
      state.q = t.value.trim();
      renderScreen();
    }, 150);
  });

  TMB.router.on('#/katalog', render);
})(typeof window !== 'undefined' ? window : globalThis);
