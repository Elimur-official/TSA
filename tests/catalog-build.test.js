const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "_site", "index.html"),
  "utf8"
);

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
