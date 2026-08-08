const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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

test("stylesheet actually hides [hidden] product cards (UA display:flex would otherwise win)", () => {
  const css = fs.readFileSync(
    path.join(__dirname, "..", "src", "css", "styles.css"),
    "utf8"
  );
  assert.match(css, /\.product-card\[hidden\]\s*{\s*display:\s*none;?\s*}/);
});
