const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "_site", "index.html"),
  "utf8"
);
const indexHtml = html;

test("catalog page lists every fixture product", () => {
  assert.match(html, /Вибратор «Полночь»/);
  assert.match(html, /Массажёр «Шёлк»/);
  assert.match(html, /Смазка «Гладь»/);
});

test("catalog page shows the WB migration banner", () => {
  assert.match(html, /Уже покупали на Wildberries/);
});

test("catalog page links each product card to its detail page", () => {
  assert.match(html, /href="\/product\/1\/"/);
});

test("catalog tile shows struck old price", () => {
  assert.match(html, /<s class="price-old">4580 ₽<\/s>/);
});

test("hero carries the social proof line", () => {
  assert.match(indexHtml, /100 000\+ покупателей на Wildberries/);
});

test("product grid appears before trust strip and promo", () => {
  const grid = indexHtml.indexOf("product-grid");
  const trust = indexHtml.indexOf("trust-strip");
  const promo = indexHtml.indexOf("wb-promo");
  assert.ok(grid > 0 && trust > 0 && promo > 0);
  assert.ok(grid < trust, "grid before trust strip");
  assert.ok(grid < promo, "grid before promo");
});
