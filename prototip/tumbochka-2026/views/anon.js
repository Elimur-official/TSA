/* views/anon.js — экран «#/anonimnost». Зона тона — строго тихо:
 * никаких шуток, короткие спокойные фразы. Что увидит курьер (фото коробки
 * и передачи), как выглядит строка в выписке (мокап с нейтральным названием),
 * кто узнает о покупке. Регистрация в роутере — самовызовом. */
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

  function render(el0) {
    var screen = el('div', 'anon-screen');

    /* ── шапка с назад ── */
    var head = el('div', 'anon-head');
    var back = el('button', 'anon-back', '‹');
    back.setAttribute('aria-label', 'Назад');
    back.addEventListener('click', function () { TMB.router.back(); });
    head.appendChild(back);
    head.appendChild(el('h1', 'anon-title', 'Анонимность'));
    screen.appendChild(head);

    screen.appendChild(el('p', 'anon-lead',
      'Коротко о том, что видно снаружи, когда вы заказываете у нас. Без мелкого шрифта.'));

    /* ── что увидит курьер ── */
    var s1 = el('section', 'anon-section');
    s1.appendChild(el('h2', 'anon-h2', 'Что увидит курьер'));
    var photos = el('div', 'anon-photos');
    photos.appendChild(figure('../img/box.jpg', 'Обычная коробка без надписей',
      'Плотная коробка. Ни названия магазина, ни картинок, ни намёков.'));
    photos.appendChild(figure('../img/courier.jpg', 'Передача заказа курьером',
      'Курьер передаёт обычную коробку — на ней нет надписей о содержимом.'));
    s1.appendChild(photos);
    screen.appendChild(s1);

    /* ── что в выписке ── */
    var s2 = el('section', 'anon-section');
    s2.appendChild(el('h2', 'anon-h2', 'Что в выписке по карте'));
    var bank = el('div', 'anon-bank');
    bank.appendChild(el('div', 'anon-bank-label', 'Примерно так выглядит строка списания'));
    bank.appendChild(el('div', 'anon-bank-row',
      '<span class="anon-bank-name">TMB MARKET <i class="anon-bank-mark">пример</i></span>' +
      '<span class="anon-bank-sum">−2 890 ₽</span>'));
    bank.appendChild(el('div', 'anon-bank-sub', 'Покупка · интернет-магазин'));
    s2.appendChild(bank);
    s2.appendChild(el('p', 'anon-note',
      'Название в выписке — нейтральное, без намёка на содержимое. ' +
      'Точное название согласуем при подтверждении заказа.'));
    screen.appendChild(s2);

    /* ── кто узнает ── */
    var s3 = el('section', 'anon-section');
    s3.appendChild(el('h2', 'anon-h2', 'Кто узнает о покупке'));
    s3.appendChild(el('p', 'anon-none', 'Никто.'));
    var list = el('ul', 'anon-list');
    [
      ['Курьер', 'видит коробку и адрес. Не видит, что внутри.'],
      ['Банк', 'видит нейтральное название магазина и сумму.'],
      ['Соседи', 'видят обычную посылку.'],
      ['Мы', 'не звоним. Пишем в мессенджер, только по заказу.'],
    ].forEach(function (row) {
      list.appendChild(el('li', 'anon-li', '<b>' + row[0] + '</b> — ' + row[1]));
    });
    s3.appendChild(list);
    s3.appendChild(el('p', 'anon-note',
      'Корзина, избранное и профиль хранятся в вашем браузере и не отправляются на сервер.'));
    screen.appendChild(s3);

    el0.appendChild(screen);
  }

  function figure(src, alt, caption) {
    var f = el('figure', 'anon-figure');
    var img = doc.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    img.width = 400; img.height = 300;
    f.appendChild(img);
    var cap = el('figcaption', 'anon-cap', caption);
    f.appendChild(cap);
    return f;
  }

  TMB.router.on('#/anonimnost', render);
})(window);
