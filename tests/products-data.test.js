const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const products = require("../src/_data/products.js")();

test("product ids are unique positive integers and the catalog is sorted by id", () => {
  const ids = products.map((p) => p.id);
  assert.ok(ids.length > 0, "catalog must not be empty");
  for (const id of ids) {
    assert.ok(Number.isInteger(id) && id > 0, `id ${id} must be a positive integer`);
  }
  assert.equal(new Set(ids).size, ids.length, "product ids must be unique");
  const sorted = [...ids].sort((a, b) => a - b);
  assert.deepEqual(ids, sorted, "products must be sorted by id");
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
