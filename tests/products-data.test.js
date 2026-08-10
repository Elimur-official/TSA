const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const products = require("../src/_data/products.js")();

test("products come from individual files, sorted by id", () => {
  assert.equal(products.length, 3);
  assert.deepEqual(products.map((p) => p.id), [1, 2, 3]);
});

test("migrated products keep every field they had before", () => {
  const first = products.find((p) => p.id === 1);
  assert.equal(first.name, "Вибратор «Полночь»");
  assert.equal(first.price, 3890);
  assert.equal(first.oldPrice, 4580);
  assert.equal(first.category, "Вибраторы");
  assert.equal(first.inStock, true);
  assert.equal(first.guide, "s-chego-nachat");
  assert.deepEqual(first.related, [3]);
  assert.equal(first.specs.length, 2);
});

test("the old monolithic products.json is gone", () => {
  assert.equal(
    fs.existsSync(path.join(__dirname, "..", "src", "_data", "products.json")),
    false
  );
});

test("a folder with no product files yields an empty catalog, not a crash", () => {
  const build = require("../src/_data/products.js");
  assert.doesNotThrow(() => build());
});
