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

test("sticky order bar stays within the centered column on wide viewports", () => {
  const stickyRule = css.match(/\.sticky-order\s*\{[^}]*position:\s*fixed[^}]*\}/)[0];
  assert.match(stickyRule, /max-width:\s*480px/);
  assert.match(stickyRule, /margin-inline:\s*auto/);
});

test("hidden sticky bar is removed from keyboard focus order", () => {
  const stickyRule = css.match(/\.sticky-order\s*\{[^}]*position:\s*fixed[^}]*\}/)[0];
  assert.match(stickyRule, /visibility:\s*hidden/);
  const visibleRule = css.match(/\.sticky-order--visible\s*\{[^}]*\}/)[0];
  assert.match(visibleRule, /visibility:\s*visible/);
});

test("sticky-bar padding compensation is scoped to non-desktop widths", () => {
  assert.match(css, /@media \(max-width: 1279px\)/);
  const marker = css.indexOf("@media (max-width: 1279px)");
  const nearby = css.slice(marker, marker + 200);
  assert.match(nearby, /padding-bottom:\s*72px/);
});
