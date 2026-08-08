const test = require("node:test");
const assert = require("node:assert/strict");
const products = require("../src/_data/products.json");

test("every demo product has oldPrice ≈ price/0.85 rounded to 10", () => {
  for (const p of products) {
    assert.ok(p.oldPrice > p.price, `${p.name}: oldPrice must exceed price`);
    const expected = Math.round(p.price / 0.85 / 10) * 10;
    assert.equal(p.oldPrice, expected, p.name);
  }
});

test("every demo product is in stock", () => {
  for (const p of products) assert.equal(p.inStock, true);
});

test("specs, when present, are key/value pairs", () => {
  assert.ok(products.some((p) => p.specs), "at least one product must carry specs");
  for (const p of products) {
    if (!p.specs) continue;
    for (const s of p.specs) {
      assert.equal(typeof s.key, "string");
      assert.equal(typeof s.value, "string");
    }
  }
});

test("demo products must not carry invented ratings", () => {
  for (const p of products) {
    assert.equal(p.rating, undefined);
    assert.equal(p.reviewsCount, undefined);
  }
});
