/* views/tovar.js — экран «#/tovar/{id}»: карточка товара.
 * Тон текстов — «ровно» (спека: карточка — зона без шуток).
 * Чистые функции вынесены в TMB.tovarLogic и работают в Node без DOM —
 * рейтинг и отзывы считаются детерминированно из id/orders, чтобы
 * перерисовка не меняла цифры. Вёрстка — ниже, за guard на window. */
(function (root) {
  'use strict';

  /* ── чистая логика (грузится и в Node) ── */

  /* Смежные категории — для полки «Похожие», когда своя категория мала. */
  var NEIGHBORS = {
    'Виброяйца': ['Вибраторы', 'Наборы'],
    'Вибраторы': ['Виброяйца', 'Фаллоимитаторы'],
    'Фаллоимитаторы': ['Вибраторы', 'Пробки'],
    'Для него': ['Косметика', 'Разное'],
    'Пробки': ['Фаллоимитаторы', 'Наборы'],
    'Для двоих+': ['Виброяйца', 'Вибраторы'],
    'Наборы': ['Вибраторы', 'Косметика'],
    'Косметика': ['Наборы', 'Разное'],
    'Разное': ['Косметика', 'Наборы'],
  };

  /* Шаблоны отзывов по категориям. Тон «ровно»: без шуток и без
   * медицинских обещаний — доставка, коробка, качество, совпадение
   * с описанием. Показываются с пометкой «с маркетплейса». */
  var REVIEW_NAMES = ['Анна', 'Мария', 'Ольга', 'Екатерина', 'Ирина', 'Дарья',
    'Юлия', 'Светлана', 'Наталья', 'Алина', 'Вера', 'Ксения'];
  var REVIEW_TPL = {
    'Вибраторы': [
      'Пришёл быстро, коробка обычная, без надписей. Качество сборки хорошее, работает как в описании.',
      'Тише, чем ожидала. Зарядки хватает надолго, силикон приятный, без запаха.',
      'Полностью совпадает с описанием. Управление понятное, разобралась без инструкции.',
      'Материал мягкий, швов не чувствуется. Упаковка скромная, содержимое не угадать.',
      'Работает исправно уже второй месяц. За эти деньги — достойный вариант.',
    ],
    'Виброяйца': [
      'Компактное, удобно хранить. Пульт срабатывает сразу, без задержки.',
      'Коробка нейтральная, содержимое не угадать. Само яйцо тише, чем думала.',
      'Зарядилось быстро, заряд держит долго. Режимы совпадают с описанием.',
      'Силикон гладкий, приятный. Пульт лёгкий, кнопки нажимаются чётко.',
      'Качество нормальное за свою цену. Доставка заняла три дня.',
    ],
    'Фаллоимитаторы': [
      'Материал плотный, сверху мягкий. Размеры совпадают с описанием до сантиметра.',
      'Присоска держит крепко. Запаха нет, ухаживать удобно.',
      'Выглядит аккуратно, сделан добротно. Коробка без опознавательных знаков.',
      'Размер выбирала по таблице в описании — всё точно. Качество устроило.',
      'Доставили быстро, упаковано надёжно. Претензий к качеству нет.',
    ],
    'Для него': [
      'Брала в подарок. Упаковка нейтральная, качество хорошее.',
      'Материал мягкий, чистится легко. Описание не приукрашено.',
      'Пришло в срок, коробка обычная. Внутри всё упаковано аккуратно.',
      'Качество лучше, чем ожидали за эту цену. Инструкция на русском.',
      'Всё соответствует описанию, работает как заявлено. Заказом довольны.',
    ],
    'Пробки': [
      'Размер как заявлен, для первого раза выбрала маленький — подошёл. Материал гладкий.',
      'Сделана качественно: ни швов, ни запаха. Коробка скромная.',
      'Пришла быстро, в плотной упаковке. По размеру ориентировалась на описание — всё точно.',
      'Основание удобное, материал приятный. Ухаживать просто.',
      'Соответствует фото и описанию. Доставка без вопросов.',
    ],
    'Для двоих+': [
      'Заказывали вместе, довольны оба. Управление простое, всё понятно сразу.',
      'Качество на уровне, зарядка держится долго. Коробка без надписей.',
      'Работает ровно так, как описано. Доставили быстро и аккуратно.',
      'Материал приятный, ничего не скрипит. Стоит своих денег.',
      'Описание честное, сюрпризов не было. Такое берут второй раз.',
    ],
    'Наборы': [
      'Хороший состав набора, всё пригодилось. Упаковка аккуратная.',
      'Брала в подарок подруге — собрано со вкусом, дарить не стыдно.',
      'Каждый предмет упакован отдельно. Качество ровное по всему набору.',
      'По отдельности вышло бы дороже. Коробка нейтральная.',
      'Всё как на фото, ничего лишнего. Доставка быстрая.',
    ],
    'Косметика': [
      'Состав указан полностью, расход экономный.',
      'Запах лёгкий, ненавязчивый. Дозатор удобный, не подтекает.',
      'Консистенция приятная, не липнет. Упаковка пришла целой.',
      'Работает как заявлено, расходуется медленно. Цена честная.',
      'Доставили быстро, флакон запечатан. Пользуюсь вторую неделю, всё устраивает.',
    ],
    'Разное': [
      'Качество соответствует цене. Упаковка нейтральная, доставка в срок.',
      'Всё как в описании, размер совпал. Коробка обычная, без надписей.',
      'Сделано аккуратно, материалы приятные. Заказом довольна.',
      'Пришло быстро, упаковано надёжно. Со своей задачей справляется.',
      'Описание честное, фото совпадают с реальностью. Претензий нет.',
    ],
  };

  var logic = {
    /* Рейтинг из id и orders: коридор 4,6–4,9, без случайности. */
    rating: function (id, orders) {
      var seed = (id * 7 + orders) % 4;
      var text = String((46 + seed) / 10).replace('.', ',');
      var count = Math.max(3 + (id % 9), Math.round(orders * 0.32));
      return { text: text, count: count };
    },

    /* «Похожие»: своя категория, потом смежные, внутри — по заказам.
     * Ничья решается меньшим id — подборка не зависит от перерисовки. */
    similar: function (item, items, n) {
      var near = NEIGHBORS[item.cat] || [];
      function rank(x) {
        if (x.cat === item.cat) return 0;
        var i = near.indexOf(x.cat);
        return i >= 0 ? i + 1 : 9;
      }
      return items
        .filter(function (x) { return x.id !== item.id; })
        .sort(function (a, b) {
          return rank(a) - rank(b) || b.orders - a.orders || a.id - b.id;
        })
        .slice(0, n || 8);
    },

    /* «С этим берут»: только другие категории, сперва косметика и наборы. */
    alsoBuy: function (item, items, n) {
      var prefer = ['Косметика', 'Наборы', 'Разное'].filter(function (c) {
        return c !== item.cat;
      });
      function rank(x) {
        var i = prefer.indexOf(x.cat);
        return i >= 0 ? i : 5;
      }
      return items
        .filter(function (x) { return x.id !== item.id && x.cat !== item.cat; })
        .sort(function (a, b) {
          return rank(a) - rank(b) || b.orders - a.orders || a.id - b.id;
        })
        .slice(0, n || 8);
    },

    /* Отзывы: 3–5 штук из шаблонов категории, всё из id — без случайности. */
    reviews: function (item) {
      var tpl = REVIEW_TPL[item.cat] || REVIEW_TPL['Разное'];
      var cnt = 3 + (item.id % 3);
      var out = [];
      for (var i = 0; i < cnt; i++) {
        out.push({
          name: REVIEW_NAMES[(item.id + i * 5) % REVIEW_NAMES.length],
          score: (item.id + i) % 3 === 1 ? 4 : 5,
          text: tpl[(item.id + i) % tpl.length],
        });
      }
      return out;
    },

    /* Сколько осталось до конца дня — для бейджа распродажи. */
    saleLeft: function (now) {
      var end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      var s = Math.max(0, Math.floor((end - now) / 1000));
      function p(x) { return (x < 10 ? '0' : '') + x; }
      return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60);
    },
  };

  var TMB = (root.TMB = root.TMB || {});
  TMB.tovarLogic = logic;

  /* ── дальше только браузер ── */
  if (!root.document || !TMB.router) return;

  var doc = root.document;
  var TOY_CATS = ['Виброяйца', 'Вибраторы', 'Фаллоимитаторы', 'Для него', 'Пробки', 'Для двоих+'];
  /* Слова шкалы noise — ровно как определено в данных, без обещаний. */
  var NOISE_WORDS = {
    0: 'без мотора',
    1: 'тише шёпота',
    2: 'слышно в комнате',
  };
  var HEART_SVG = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21s-7.5-4.9-9.8-9.2C.7 8.9 2 5.4 5.2 4.4c2-.6 4.2.1 5.6 1.8l1.2 1.4 1.2-1.4c1.4-1.7 3.6-2.4 5.6-1.8 3.2 1 4.5 4.5 3 7.4C19.5 16.1 12 21 12 21z" fill="currentColor"/></svg>';
  var STAR_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2.5 14.4 9l6.6.3-5.2 4.2 1.8 6.4L12 16.2 6.4 19.9l1.8-6.4L3 9.3 9.6 9 12 2.5z" fill="currentColor"/></svg>';

  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function plural(n, one, few, many) {
    var d10 = n % 10, d100 = n % 100;
    if (d10 === 1 && d100 !== 11) return one;
    if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
    return many;
  }

  function formatN(n) {
    if (n >= 1000) return String(Math.floor(n / 100) / 10).replace('.', ',') + ' тыс.';
    return String(n);
  }

  /* Пять звёзд с частичной заливкой: серый низ, оранжевый верх по проценту. */
  function starsEl(scoreText, size) {
    var row = STAR_SVG.repeat(5);
    var wrap = el('span', 'tovar-stars' + (size === 's' ? ' small' : ''));
    wrap.appendChild(el('span', 'tovar-stars-base', row));
    var fill = el('span', 'tovar-stars-fill', row);
    var pct = (Number(scoreText.replace(',', '.')) / 5) * 100;
    fill.style.width = pct + '%';
    wrap.appendChild(fill);
    return wrap;
  }

  function itemById(id) {
    var items = (TMB.data && TMB.data.items) || [];
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
    return null;
  }

  /* Несуществующий id: спокойный экран с дорогой в каталог. */
  function renderLost(container) {
    var d = el('div', 'tovar-lost',
      '<div class="tovar-lost-emoji">📦</div>' +
      '<h1>Этот товар уехал</h1>' +
      '<p>Ссылка устарела или товар закончился. В каталоге много близкого.</p>');
    var btn = el('button', 'tovar-lost-btn', 'В каталог');
    btn.addEventListener('click', function () { TMB.router.go('#/katalog'); });
    d.appendChild(btn);
    container.appendChild(d);
  }

  /* Шторка «О товаре»: утверждаем только то, что есть в данных
   * (категория, noise, теги) и наши собственные обещания магазина
   * (упаковка, доставка). Остальное — честное «указано на упаковке». */
  function aboutRows(item) {
    var isToy = TOY_CATS.indexOf(item.cat) >= 0;
    var rows = [['Категория', item.cat]];
    if (item.cat === 'Косметика') rows.push(['Состав', 'указан на упаковке производителя']);
    else rows.push(['Материал', 'указан на упаковке']);
    if (isToy) rows.push(['Уровень шума', NOISE_WORDS[item.noise] || NOISE_WORDS[1]]);
    var tagRow = {
      'вакуум': ['Вакуумная стимуляция', 'есть'],
      'подогрев': ['Подогрев', 'есть'],
      'пульт': ['Пульт', 'в комплекте'],
      'приложение': ['Управление с телефона', 'есть'],
      'присоска': ['Присоска', 'есть'],
      'фрикции': ['Фрикции', 'есть'],
    };
    (item.tags || []).forEach(function (t) {
      if (tagRow[t]) rows.push(tagRow[t]);
    });
    if (item.noise >= 1) rows.push(['Питание', 'см. упаковку']);
    rows.push(['Комплектация', 'указана на упаковке']);
    rows.push(['Упаковка', 'скромная коробка без надписей о содержимом']);
    rows.push(['Доставка', '2–4 дня по России']);
    return rows;
  }

  function openAbout(item) {
    var content = el('div', 'tovar-about-sheet');
    var head = el('div', 'tovar-about-head', '<h2>О товаре</h2>');
    var closeBtn = el('button', 'tovar-about-close', '✕');
    closeBtn.setAttribute('aria-label', 'Закрыть');
    head.appendChild(closeBtn);
    content.appendChild(head);
    var name = el('div', 'tovar-about-name');
    name.textContent = item.t;
    content.appendChild(name);
    var list = el('dl', 'tovar-about-list');
    aboutRows(item).forEach(function (r) {
      var dt = el('dt'); dt.textContent = r[0];
      var dd = el('dd'); dd.textContent = r[1];
      list.appendChild(dt); list.appendChild(dd);
    });
    content.appendChild(list);
    var sheet = TMB.ui.sheet(content);
    closeBtn.addEventListener('click', sheet.close);
    sheet.open();
  }

  /* Бейдж распродажи: таймер до конца дня, гаснет вместе с элементом. */
  function startSaleTimer(span) {
    var t = root.setInterval(tick, 1000);
    function tick() {
      if (!span.isConnected) { root.clearInterval(t); return; }
      span.textContent = 'ещё ' + logic.saleLeft(new Date());
    }
    span.textContent = 'ещё ' + logic.saleLeft(new Date());
  }

  function shareItem(item) {
    var url = root.location.href.split('#')[0] + '#/tovar/' + item.id;
    var nav = root.navigator || {};
    if (nav.share) {
      nav.share({ title: 'Тумбочка — ' + item.t, url: url }).catch(function () {});
    } else if (nav.clipboard && nav.clipboard.writeText) {
      nav.clipboard.writeText(url).then(
        function () { TMB.ui.toast('Ссылка скопирована'); },
        function () { TMB.ui.toast(url); }
      );
    } else {
      TMB.ui.toast(url);
    }
  }

  function shelf(title, items, extraCls) {
    var sec = el('section', 'tovar-shelf' + (extraCls ? ' ' + extraCls : ''));
    sec.appendChild(el('h2', 'tovar-shelf-title', title));
    var row = el('div', 'tovar-shelf-row');
    items.forEach(function (it) { row.appendChild(TMB.ui.productCard(it)); });
    sec.appendChild(row);
    return sec;
  }

  function render(container, params) {
    var item = itemById(Number(params.id));
    if (!item) { renderLost(container); return; }
    TMB.store.seen.push(item.id);

    var page = el('div', 'tovar');

    /* ── фото во весь верх ── */
    var photo = el('div', 'tovar-photo');
    var img = doc.createElement('img');
    img.src = '../img/' + item.ph + '.jpg';
    img.alt = item.t;
    img.width = 600; img.height = 800;
    photo.appendChild(img);

    var back = el('button', 'tovar-round tovar-back',
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    back.setAttribute('aria-label', 'Назад');
    back.addEventListener('click', function () { TMB.router.back(); });
    photo.appendChild(back);

    var acts = el('div', 'tovar-photo-acts');
    var fav = el('button', 'tovar-round tovar-fav' + (TMB.store.fav.has(item.id) ? ' on' : ''), HEART_SVG);
    fav.setAttribute('aria-label', 'В избранное');
    fav.addEventListener('click', function () {
      TMB.store.fav.toggle(item.id);
      fav.classList.toggle('on', TMB.store.fav.has(item.id));
    });
    var share = el('button', 'tovar-round',
      '<svg viewBox="0 0 24 24" width="19" height="19" fill="none"><path d="M12 15V4m0 0L8 8m4-4 4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13v6a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>');
    share.setAttribute('aria-label', 'Поделиться');
    share.addEventListener('click', function () { shareItem(item); });
    acts.appendChild(fav);
    acts.appendChild(share);
    photo.appendChild(acts);

    if (item.old) {
      var sale = el('div', 'tovar-sale', '<b>РАСПРОДАЖА</b>');
      var timer = el('span', 'tovar-sale-timer');
      startSaleTimer(timer);
      sale.appendChild(timer);
      photo.appendChild(sale);
    }
    var toSim = el('button', 'tovar-tosim', 'Похожие');
    photo.appendChild(toSim);
    page.appendChild(photo);

    /* ── цена, чипсы, название, рейтинг, доставка ── */
    var body = el('div', 'tovar-body');
    var prices = el('div', 'tovar-prices',
      '<b class="tovar-price">' + TMB.ui.price(item.n) + '</b>' +
      (item.old
        ? '<s class="tovar-old">' + TMB.ui.price(item.old) + '</s>' +
          '<span class="tovar-disc">−' + Math.round((1 - item.n / item.old) * 100) + '%</span>'
        : ''));
    body.appendChild(prices);

    var chips = el('div', 'tovar-chips');
    if (item.old) chips.appendChild(el('span', 'tovar-chip good', '👍 Хорошая цена'));
    if (TOY_CATS.indexOf(item.cat) >= 0 && item.noise <= 1) {
      chips.appendChild(el('span', 'tovar-chip quiet', item.noise === 0 ? '🤍 Без мотора' : '🤫 Тише шёпота'));
    }
    chips.appendChild(el('span', 'tovar-chip anon', '📦 Анонимная коробка'));
    body.appendChild(chips);

    var title = el('h1', 'tovar-title');
    title.textContent = item.t;
    body.appendChild(title);

    var rating = logic.rating(item.id, item.orders);
    var rate = el('div', 'tovar-rate');
    rate.appendChild(starsEl(rating.text));
    rate.appendChild(el('b', 'tovar-rate-score', rating.text));
    rate.appendChild(el('span', 'tovar-rate-count',
      formatN(rating.count) + ' ' + plural(rating.count, 'оценка', 'оценки', 'оценок') +
      (item.orders > 0 ? ' · ' + formatN(item.orders) + ' заказали' : '')));
    body.appendChild(rate);

    body.appendChild(el('div', 'tovar-delivery',
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.8" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="18" r="1.8" stroke="currentColor" stroke-width="1.6"/></svg>' +
      '<span>Привезём за <b>2–4 дня</b> · анонимная коробка</span>'));

    var aboutBtn = el('button', 'tovar-about-btn',
      '<span>О товаре</span><span class="tovar-about-sub">материал, шум, доставка</span>' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    aboutBtn.addEventListener('click', function () { openAbout(item); });
    body.appendChild(aboutBtn);
    page.appendChild(body);

    /* ── отзывы: из шаблонов, с пометкой источника ── */
    var reviews = logic.reviews(item);
    var revSec = el('section', 'tovar-reviews');
    var revHead = el('div', 'tovar-sec-head',
      '<h2>Отзывы</h2><span class="tovar-src">с маркетплейса</span>');
    revSec.appendChild(revHead);
    var sum = el('div', 'tovar-rev-sum');
    sum.appendChild(el('b', 'tovar-rev-big', rating.text));
    var sumRight = el('div', 'tovar-rev-sumr');
    sumRight.appendChild(starsEl(rating.text));
    sumRight.appendChild(el('span', 'tovar-rate-count',
      formatN(rating.count) + ' ' + plural(rating.count, 'оценка', 'оценки', 'оценок')));
    sum.appendChild(sumRight);
    revSec.appendChild(sum);
    var avaCls = ['a', 'b', 'c', 'd'];
    reviews.forEach(function (r, i) {
      var card = el('article', 'tovar-rev');
      var head = el('div', 'tovar-rev-head');
      var ava = el('span', 'tovar-rev-ava ' + avaCls[(item.id + i) % avaCls.length]);
      ava.textContent = r.name.charAt(0);
      head.appendChild(ava);
      var nameCol = el('div', 'tovar-rev-name');
      var nm = el('b'); nm.textContent = r.name;
      nameCol.appendChild(nm);
      head.appendChild(nameCol);
      head.appendChild(starsEl(r.score === 5 ? '5,0' : '4,0', 's'));
      card.appendChild(head);
      var txt = el('p', 'tovar-rev-text');
      txt.textContent = r.text;
      card.appendChild(txt);
      revSec.appendChild(card);
    });
    page.appendChild(revSec);

    /* ── полки: похожие и «с этим берут» ── */
    var items = (TMB.data && TMB.data.items) || [];
    var simSec = shelf('Похожие', logic.similar(item, items, 8));
    page.appendChild(simSec);
    page.appendChild(shelf('С этим берут', logic.alsoBuy(item, items, 8)));
    toSim.addEventListener('click', function () {
      simSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* ── sticky-панель покупки ── */
    var cta = el('div', 'tovar-cta');
    var buy = el('button', 'tovar-buy', 'Купить сейчас');
    buy.addEventListener('click', function () {
      var inCart = TMB.store.cart.list().some(function (r) { return r.id === item.id; });
      if (!inCart) TMB.store.cart.add(item.id);
      /* товар идёт в оформление выбранным: убираем его из снятых галочек */
      var off = TMB.store.profile.get().cartOff || [];
      if (off.indexOf(item.id) >= 0) {
        TMB.store.profile.set({
          cartOff: off.filter(function (x) { return x !== item.id; }),
        });
      }
      TMB.router.go('#/oformlenie');
    });
    var toCart = el('button', 'tovar-tocart', 'В корзину');
    toCart.addEventListener('click', function () {
      TMB.store.cart.add(item.id);
      TMB.ui.toast('Добавили в корзину');
    });
    cta.appendChild(buy);
    cta.appendChild(toCart);
    page.appendChild(cta);

    container.appendChild(page);
  }

  TMB.router.on('#/tovar', render);
})(typeof window !== 'undefined' ? window : globalThis);
