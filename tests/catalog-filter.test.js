const test = require("node:test");
const assert = require("node:assert/strict");
const { filterProducts } = require("../src/js/catalog-filter.js");

const products = [
  { id: 1, category: "Вибраторы" },
  { id: 2, category: "Смазки" },
  { id: 3, category: "Вибраторы" },
];

test("all returns every product", () => {
  assert.equal(filterProducts(products, "all").length, 3);
});

test("filters by category", () => {
  const result = filterProducts(products, "Смазки");
  assert.deepEqual(result.map((p) => p.id), [2]);
});

test("unknown category returns empty list", () => {
  assert.deepEqual(filterProducts(products, "Нет такой"), []);
});
