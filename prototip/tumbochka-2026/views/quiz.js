/* views/quiz.js — экран «#/kviz»: 5 вопросов → подборка 3–6 товаров.
 * Чистая логика подбора выставлена как TMB.kviz (тестируется в Node без DOM):
 *   TMB.kviz.combine(quiz, answers) → f {cat, tags[], noiseMax, priceMax, priceMin}
 *   TMB.kviz.podbor(items, f)       → 3–6 товаров каталога
 * Черновик прохождения — TMB.store.profile, ключ kviz {step, answers, done}:
 * прерванный квиз продолжается с того же вопроса. Тон зоны — дерзко-легко.
 * Регистрация экрана — только в браузере (guard на window.document). */
(function (root) {
  'use strict';
  var TMB = (root.TMB = root.TMB || {});

  /* ── чистая логика ── */

  /* Слить фильтры выбранных ответов: cat — последний заданный, tags — без
   * дублей, noiseMax/priceMax — строже (минимум), priceMin — строже (максимум).
   * answers[i] — индекс ответа на вопрос i; нет ответа — вопрос пропускается. */
  function combine(quiz, answers) {
    var f = { cat: null, tags: [], noiseMax: null, priceMax: null, priceMin: null };
    for (var i = 0; i < quiz.length; i++) {
      var a = quiz[i].a[answers[i]];
      if (!a || !a.f) continue;
      var af = a.f;
      if (af.cat) f.cat = af.cat;
      if (af.tags) {
        for (var j = 0; j < af.tags.length; j++) {
          if (f.tags.indexOf(af.tags[j]) < 0) f.tags.push(af.tags[j]);
        }
      }
      if (af.noiseMax != null) {
        f.noiseMax = f.noiseMax == null ? af.noiseMax : Math.min(f.noiseMax, af.noiseMax);
      }
      if (af.priceMax != null) {
        f.priceMax = f.priceMax == null ? af.priceMax : Math.min(f.priceMax, af.priceMax);
      }
      if (af.priceMin != null) {
        f.priceMin = f.priceMin == null ? af.priceMin : Math.max(f.priceMin, af.priceMin);
      }
    }
    return f;
  }

  /* Подборка по слитому фильтру: noiseMax/priceMax/priceMin — жёсткие
   * (тишина и потолок бюджета не нарушаются никогда), cat и tags — очки
   * релевантности. Если жёсткие фильтры дали меньше 3 товаров, отпускается
   * только нижняя граница цены. Возвращает 3–6 товаров (меньше — только
   * если каталог не может дать 3 без нарушения тишины/бюджета). */
  function podbor(items, f) {
    function hard(list, useMin) {
      return list.filter(function (it) {
        return (f.noiseMax == null || it.noise <= f.noiseMax) &&
          (f.priceMax == null || it.n <= f.priceMax) &&
          (!useMin || f.priceMin == null || it.n >= f.priceMin);
      });
    }
    var pool = hard(items, true);
    if (pool.length < 3) pool = hard(items, false);
    var scored = pool.map(function (it) {
      var score = 0;
      if (f.cat && it.cat === f.cat) score += 2;
      for (var i = 0; i < f.tags.length; i++) {
        if (it.tags && it.tags.indexOf(f.tags[i]) >= 0) score += 1;
      }
      return { it: it, score: score };
    });
    scored.sort(function (a, b) {
      return b.score - a.score || b.it.orders - a.it.orders || a.it.id - b.it.id;
    });
    var relevant = scored.filter(function (x) { return x.score > 0; });
    var picked = relevant.length >= 3 ? relevant : scored;
    return picked.slice(0, 6).map(function (x) { return x.it; });
  }

  var TG_URL = 'https://t.me/elimurbot';

  TMB.kviz = { combine: combine, podbor: podbor };

  /* ── экран (только браузер) ── */
  if (!root.document || !TMB.router) return;

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

  /* черновик в store: {step, answers[], done} */
  function getDraft() {
    var d = TMB.store.profile.get().kviz;
    if (d && Array.isArray(d.answers)) return d;
    return { step: 0, answers: [], done: false };
  }
  function setDraft(d) { TMB.store.profile.set({ kviz: d }); }

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

  /* Внутри Telegram с reply-кнопки подборка уходит боту одним sendData;
   * иначе — прежний путь копирования (история 16, R13i). */
  function canSend() {
    return !!(TMB.tg && TMB.tg.canSendData());
  }

  /* абсолютный адрес магазина — из него бот собирает ссылки на карточки */
  function baseUrl() {
    return root.location.origin + root.location.pathname;
  }

  /* текст подборки для буфера и Telegram-бота: у каждого товара — своя
   * абсолютная ссылка на карточку, получатель открывает её сразу */
  function pickText(items) {
    var base = baseUrl();
    var lines = ['Моя подборка из Тумбочки 🖤', ''];
    items.forEach(function (it, i) {
      lines.push((i + 1) + '. ' + it.t + ' — ' + TMB.ui.price(it.n).replace(/\u00A0/g, ' '));
      lines.push(base + '#/tovar/' + it.id);
    });
    return lines.join('\n');
  }

  function render(el0) {
    var screen = el('div', 'quiz-screen');
    el0.appendChild(screen);
    var d = getDraft();
    if (d.done) paintResult(screen, d);
    else paintStep(screen, d);
  }

  /* ── шаг квиза ── */
  function paintStep(screen, d) {
    screen.innerHTML = '';
    var quiz = TMB.data.quiz;
    var q = quiz[d.step];

    var head = el('div', 'quiz-head');
    head.appendChild(el('div', 'quiz-kicker', 'Подберём под тебя'));
    var dots = el('div', 'quiz-dots');
    quiz.forEach(function (_, i) {
      dots.appendChild(el('span', 'quiz-dot' +
        (i < d.step ? ' past' : i === d.step ? ' now' : '')));
    });
    head.appendChild(dots);
    screen.appendChild(head);

    var card = el('div', 'quiz-card');
    card.appendChild(el('div', 'quiz-count', (d.step + 1) + ' из ' + quiz.length));
    card.appendChild(el('h1', 'quiz-q', esc(q.q)));

    var opts = el('div', 'quiz-opts');
    q.a.forEach(function (a, i) {
      var b = el('button', 'quiz-opt' + (d.answers[d.step] === i ? ' on' : ''), esc(a.t));
      b.addEventListener('click', function () {
        d.answers[d.step] = i;
        if (d.step + 1 < quiz.length) {
          d.step += 1;
          setDraft(d);
          paintStep(screen, d);
        } else {
          finish(screen, d);
        }
      });
      opts.appendChild(b);
    });
    card.appendChild(opts);
    screen.appendChild(card);

    var nav = el('div', 'quiz-nav');
    var backB = el('button', 'quiz-back' + (d.step === 0 ? ' off' : ''), '← Назад');
    backB.addEventListener('click', function () {
      if (d.step === 0) return;
      d.step -= 1;
      setDraft(d);
      paintStep(screen, d);
    });
    nav.appendChild(backB);
    var canFwd = d.answers[d.step] != null;
    var fwdB = el('button', 'quiz-fwd' + (canFwd ? '' : ' off'),
      d.step + 1 < quiz.length ? 'Дальше →' : 'К подборке');
    fwdB.addEventListener('click', function () {
      if (!canFwd) { TMB.ui.toast('Сначала выбери вариант'); return; }
      if (d.step + 1 < quiz.length) {
        d.step += 1;
        setDraft(d);
        paintStep(screen, d);
      } else {
        finish(screen, d);
      }
    });
    nav.appendChild(fwdB);
    screen.appendChild(nav);
  }

  function finish(screen, d) {
    d.done = true;
    setDraft(d);
    TMB.store.mark('quiz'); /* достижение «Знает, чего хочет» */
    paintResult(screen, d);
  }

  /* ── результат ── */
  function paintResult(screen, d) {
    screen.innerHTML = '';
    var f = combine(TMB.data.quiz, d.answers);
    var items = podbor(TMB.data.items, f);

    var head = el('div', 'quiz-result-head');
    head.appendChild(el('h1', 'quiz-result-title', 'Твоя подборка готова'));
    head.appendChild(el('p', 'quiz-result-sub',
      items.length + ' ' + plural(items.length, 'товар', 'товара', 'товаров') +
      ' по твоим ответам. Без случайных попаданий.'));
    screen.appendChild(head);

    if (!items.length) {
      /* каталог не дал ничего под жёсткие фильтры — честно и дружелюбно */
      var none = el('div', 'quiz-none',
        '<p>Под такие ответы каталог пока пуст. Попробуй чуть шире — квиз короткий.</p>');
      var again0 = el('button', 'quiz-again', 'Пройти заново');
      again0.addEventListener('click', function () { restart(screen); });
      none.appendChild(again0);
      screen.appendChild(none);
      return;
    }

    var grid = el('div', 'quiz-grid');
    items.forEach(function (it) { grid.appendChild(TMB.ui.productCard(it)); });
    screen.appendChild(grid);

    var actions = el('div', 'quiz-actions');

    var allBtn = el('button', 'quiz-all', 'Все в корзину');
    allBtn.addEventListener('click', function () {
      items.forEach(function (it) { TMB.store.cart.add(it.id); });
      TMB.ui.toast('Вся подборка в корзине 🖤');
    });
    actions.appendChild(allBtn);

    var sending = false;
    var tgBtn = el('button', 'quiz-tg',
      canSend() ? 'Отправить подборку себе в Telegram' : 'Скопировать и открыть чат');
    tgBtn.addEventListener('click', function () {
      if (sending) return; /* второй тап не шлёт вторую подборку */
      if (canSend()) {
        sending = true;
        tgBtn.disabled = true;
        var payload = TMB.tgLogic.kvizPayload(
          items.map(function (it) { return { id: it.id, t: it.t, n: it.n }; }),
          baseUrl()
        );
        if (TMB.tg.send(payload)) return; /* Telegram закрывает приложение */
        sending = false;                  /* не ушло — прежний путь */
        tgBtn.disabled = false;
      }
      copyText(pickText(items), function (ok) {
        TMB.ui.toast(ok ? 'Скопировали — вставь в чат боту' : 'Не скопировалось, но бот уже открыт');
      });
      root.open(TG_URL, '_blank');
    });
    actions.appendChild(tgBtn);

    var again = el('button', 'quiz-again', 'Пройти заново');
    again.addEventListener('click', function () { restart(screen); });
    actions.appendChild(again);

    screen.appendChild(actions);
  }

  function restart(screen) {
    var d = { step: 0, answers: [], done: false };
    setDraft(d);
    paintStep(screen, d);
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  TMB.router.on('#/kviz', render);
})(typeof window !== 'undefined' ? window : globalThis);
