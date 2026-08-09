const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "src", "css", "styles.css"), "utf8");

test("reduced motion is respected globally", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("hover effects are gated behind hover-capable media", () => {
  assert.match(css, /@media \(hover: hover\)/);
});

test("keyboard focus is visible", () => {
  assert.match(css, /:focus-visible/);
});

test("prices use tabular figures", () => {
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
});

test("the golden thread signature exists", () => {
  assert.match(css, /\.product-detail__info h3::after/);
});
