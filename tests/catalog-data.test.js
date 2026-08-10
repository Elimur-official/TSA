const test = require("node:test");
const assert = require("node:assert/strict");
const products = require("../src/_data/products.js")();

test("oldPrice, when present, is greater than price", () => {
  for (const p of products) {
    if (p.oldPrice === undefined) continue;
    assert.ok(p.oldPrice > p.price, `${p.name}: oldPrice must exceed price when present`);
  }
});

test("every product has non-empty name, category, image, and a numeric price ≥ 0", () => {
  for (const p of products) {
    assert.ok(typeof p.name === "string" && p.name.trim().length > 0, `${p.name}: name must be non-empty`);
    assert.ok(typeof p.category === "string" && p.category.trim().length > 0, `${p.name}: category must be non-empty`);
    assert.ok(typeof p.image === "string" && p.image.trim().length > 0, `${p.name}: image must be non-empty`);
    assert.ok(typeof p.price === "number" && p.price >= 0, `${p.name}: price must be a numeric value ≥ 0`);
  }
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

test("related ids reference existing products", () => {
  const ids = new Set(products.map((p) => p.id));
  for (const p of products) {
    for (const rid of p.related || []) {
      assert.ok(ids.has(rid), `${p.name}: related id ${rid} must exist`);
      assert.notEqual(rid, p.id, `${p.name}: must not relate to itself`);
    }
  }
  assert.ok(products.some((p) => p.related && p.related.length), "demo data must exercise related");
});

test("every demo product points to a guide article", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  for (const p of products) {
    if (!p.guide) continue;
    const md = path.join(__dirname, "..", "src", "content", "articles", `${p.guide}.md`);
    assert.ok(fs.existsSync(md), `${p.name}: guide article ${p.guide}.md must exist`);
  }
  assert.ok(products.some((p) => p.guide), "demo data must exercise guide");
});
