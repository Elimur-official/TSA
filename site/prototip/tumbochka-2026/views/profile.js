/* views/profile.js — экран «#/profil»: привет + имя (правится на месте),
 * карточки «Бонусы» (5% от суммы заказов) и «Мои заказы» (шторкой),
 * достижения с прогрессом от TMB.store.progress(), избранное сеткой,
 * «Вы смотрели» лентой, строка «Анонимность». Тон зоны — дерзко-легко.
 * Аватар — эмодзи-заглушка. Регистрация в роутере — самовызовом. */
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
  function itemById(id) {
    var list = TMB.data.items;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* бонусы: 5% от суммы всех заказов, целыми баллами вниз */
  function bonusPoints() {
    var sum = TMB.store.orders.list().reduce(function (s, o) {
      return s + (o.total || 0);
    }, 0);
    return Math.floor(sum * 0.05);
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return d.getDate() + ' ' + months[d.getMonth()];
  }

  function render(el0) {
    var screen = el('div', 'profile-screen');
    el0.appendChild(screen);
    paint(screen);
  }

  function paint(screen) {
    screen.innerHTML = '';

    /* ── привет + имя ── */
    var head = el('div', 'profile-head');
    head.appendChild(el('div', 'profile-ava', '🛍️'));
    var nameWrap = el('div', 'profile-namewrap');
    var name = TMB.store.profile.get().name || '';
    var hello = el('h1', 'profile-hello',
      name ? 'Привет, ' + esc(name) + '!' : 'Привет!');
    nameWrap.appendChild(hello);
    var editB = el('button', 'profile-edit', name ? 'Изменить имя' : 'Как тебя зовут?');
    editB.addEventListener('click', function () {
      var input = doc.createElement('input');
      input.type = 'text';
      input.className = 'profile-name-input';
      input.maxLength = 30;
      input.placeholder = 'Имя — останется в этом браузере';
      input.value = name;
      nameWrap.innerHTML = '';
      nameWrap.appendChild(input);
      input.focus();
      var saved = false;
      function save() {
        if (saved) return;
        saved = true;
        TMB.store.profile.set({ name: input.value.trim() });
        paint(screen);
      }
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') save();
      });
      input.addEventListener('blur', save);
    });
    nameWrap.appendChild(editB);
    head.appendChild(nameWrap);
    screen.appendChild(head);

    /* ── карточки: бонусы + заказы ── */
    var cards = el('div', 'profile-cards');

    var orders = TMB.store.orders.list();
    var points = bonusPoints();
    var bonus = el('div', 'profile-card bonus');
    bonus.appendChild(el('div', 'profile-card-label', 'Бонусы'));
    bonus.appendChild(el('div', 'profile-card-big', '💛 ' + points));
    bonus.appendChild(el('div', 'profile-card-sub', orders.length
      ? '5% от суммы заказов. Спишутся при заказе — скоро'
      : 'Это 5% от каждого заказа. Первый заказ — первые баллы'));
    cards.appendChild(bonus);

    var oCard = el('div', 'profile-card orders');
    oCard.appendChild(el('div', 'profile-card-label', 'Мои заказы'));
    oCard.appendChild(el('div', 'profile-card-big', '📦 ' + orders.length));
    oCard.appendChild(el('div', 'profile-card-sub', orders.length
      ? 'Нажми — покажем список'
      : 'Пока пусто. Тумбочка ждёт'));
    if (orders.length) {
      oCard.classList.add('tap');
      oCard.addEventListener('click', function () { openOrders(orders); });
    }
    cards.appendChild(oCard);
    screen.appendChild(cards);

    /* ── достижения ── */
    var p = TMB.store.progress();
    screen.appendChild(el('h2', 'profile-h2', 'Достижения'));
    var ach = el('div', 'profile-ach');
    TMB.data.achievements.forEach(function (a) {
      var val = Math.min(p[a.metric] || 0, a.goal);
      var done = val >= a.goal;
      var card = el('div', 'profile-ach-card' + (done ? ' done' : ''));
      card.appendChild(el('div', 'profile-ach-emoji', a.emoji));
      card.appendChild(el('div', 'profile-ach-name', esc(a.name)));
      card.appendChild(el('div', 'profile-ach-desc', esc(a.desc)));
      var bar = el('div', 'profile-ach-bar');
      var fill = el('span', 'profile-ach-fill');
      fill.style.width = Math.round((val / a.goal) * 100) + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
      card.appendChild(el('div', 'profile-ach-count',
        done ? 'Есть! ✨' : val + ' из ' + a.goal));
      ach.appendChild(card);
    });
    screen.appendChild(ach);

    /* ── избранное ── */
    var favIds = TMB.store.fav.list();
    var favItems = favIds.map(itemById).filter(Boolean);
    screen.appendChild(el('h2', 'profile-h2',
      'Избранное' + (favItems.length ? ' <span class="profile-count">' + favItems.length + '</span>' : '')));
    if (favItems.length) {
      var grid = el('div', 'profile-fav-grid');
      favItems.forEach(function (it) { grid.appendChild(TMB.ui.productCard(it)); });
      screen.appendChild(grid);
    } else {
      screen.appendChild(emptyBlock('🖤',
        'Сердечки пока никому не достались. Жми на них в каталоге — соберётся своя полка.',
        'В каталог', '#/katalog'));
    }

    /* ── вы смотрели ── */
    var seenItems = TMB.store.seen.list().map(itemById).filter(Boolean);
    screen.appendChild(el('h2', 'profile-h2', 'Вы смотрели'));
    if (seenItems.length) {
      var row = el('div', 'profile-seen');
      seenItems.slice(0, 12).forEach(function (it) {
        row.appendChild(TMB.ui.productCard(it));
      });
      screen.appendChild(row);
    } else {
      screen.appendChild(emptyBlock('👀',
        'Здесь появится то, что ты смотрела. Никто, кроме тебя, этого не увидит.',
        'Посмотреть каталог', '#/katalog'));
    }

    /* ── анонимность (зона: тихо) ── */
    var anon = el('button', 'profile-anon');
    anon.innerHTML =
      '<span class="profile-anon-emoji">🤫</span>' +
      '<span class="profile-anon-text"><b>Анонимность</b>' +
      '<small>Что увидит курьер и что будет в выписке</small></span>' +
      '<span class="profile-anon-arrow">›</span>';
    anon.addEventListener('click', function () { TMB.router.go('#/anonimnost'); });
    screen.appendChild(anon);

    /* ── документы (зона: тихо) ── */
    var docs = el('div', 'profile-docs');
    docs.appendChild(el('div', 'profile-docs-title', 'Документы'));
    docs.appendChild(el('div', 'profile-docs-links',
      '<a href="./politika.html">Политика обработки персональных данных</a>' +
      '<a href="./oferta.html">Публичная оферта</a>'));
    docs.appendChild(el('div', 'profile-docs-req',
      'ИП Бойков · ОГРНИП 324330000025894 · ИНН 332713750222'));
    screen.appendChild(docs);
  }

  function emptyBlock(emoji, text, btnText, route) {
    var b = el('div', 'profile-empty');
    b.appendChild(el('div', 'profile-empty-emoji', emoji));
    b.appendChild(el('p', '', text));
    var btn = el('button', 'profile-empty-btn', btnText);
    btn.addEventListener('click', function () { TMB.router.go(route); });
    b.appendChild(btn);
    return b;
  }

  /* ── шторка «Мои заказы» ── */
  function openOrders(orders) {
    var content = el('div', 'profile-orders');
    content.appendChild(el('h2', 'profile-orders-title', 'Мои заказы'));
    orders.forEach(function (o) {
      var row = el('div', 'profile-order');
      row.appendChild(el('div', 'profile-order-top',
        '<b>' + esc(o.num) + '</b><span>' + fmtDate(o.ts) + '</span>'));
      var pcs = (o.items || []).reduce(function (s, r) { return s + (r.qty || 0); }, 0);
      row.appendChild(el('div', 'profile-order-mid',
        pcs + ' шт · ' + TMB.ui.price(o.total || 0)));
      row.appendChild(el('div', 'profile-order-status', 'ждёт подтверждения'));
      content.appendChild(row);
    });
    content.appendChild(el('p', 'profile-orders-note',
      'Менеджер подтверждает заказ в Telegram. Статусы обновятся там же.'));
    TMB.ui.sheet(content).open();
  }

  TMB.router.on('#/profil', render);
})(window);
