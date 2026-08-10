const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const feed = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "_site", "products.json"), "utf8")
);

test("feed lists every product, sorted by id", () => {
  assert.deepEqual(feed.map((p) => p.id), [1, 2, 3]);
});

test("every image is an absolute URL the bot can hand to Telegram", () => {
  for (const product of feed) {
    assert.match(product.image, /^https:\/\//, product.name);
  }
});

test("feed carries the fields the bot card needs", () => {
  const first = feed[0];
  assert.equal(first.name, "Вибратор «Полночь»");
  assert.equal(first.description, "Тихий мотор и мягкий силикон, 5 уровней мощности.");
  assert.equal(first.price, 3890);
  assert.equal(first.category, "Вибраторы");
  assert.equal(first.inStock, true);
});
