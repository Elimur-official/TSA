const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readProductPage(id) {
  return fs.readFileSync(
    path.join(__dirname, "..", "_site", "product", String(id), "index.html"),
    "utf8"
  );
}

test("generates one page per fixture product", () => {
  assert.doesNotThrow(() => readProductPage(1));
  assert.doesNotThrow(() => readProductPage(2));
  assert.doesNotThrow(() => readProductPage(3));
});

test("product page shows name, price and deep link with correct id", () => {
  const html = readProductPage(1);
  assert.match(html, /Вибратор «Полночь»/);
  assert.match(html, /3890 ₽/);
  assert.match(html, /https:\/\/t\.me\/elimurbot\?start=product_1/);
});

test("product page CTA carries the product id for analytics", () => {
  const html = readProductPage(2);
  assert.match(html, /data-analytics="order-click"/);
  assert.match(html, /data-product-id="2"/);
});
