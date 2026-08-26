const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(
  path.join(__dirname, "..", "src", "css", "styles.css"),
  "utf8"
);

const productHtml = fs.readFileSync(
  path.join(__dirname, "..", "site", "product", "1", "index.html"),
  "utf8"
);

test("styles.css defines a desktop breakpoint at 1280px", () => {
  assert.match(css, /@media \(min-width: 1280px\)/);
});

test("desktop breakpoint widens the product grid to 4 columns", () => {
  const desktopBlock = css.split("@media (min-width: 1280px)")[1];
  assert.match(desktopBlock, /\.product-grid\s*{\s*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
});

test(".article-list is actually a grid container, so its desktop column rule applies", () => {
  assert.match(css, /\.article-list\s*{\s*display:\s*grid/);
});

test("product info is wrapped so the desktop grid has exactly two cells", () => {
  assert.match(productHtml, /<div class="product-detail__info">/);
  const photoIdx = productHtml.indexOf("product-detail__photo");
  const infoIdx = productHtml.indexOf("product-detail__info");
  assert.ok(photoIdx < infoIdx, "photo comes first, info wrapper second");
});

test("reviews section spans both desktop columns", () => {
  const desktopBlock = css.split("@media (min-width: 1280px)")[1];
  assert.match(desktopBlock, /\.product-detail__reviews\s*{\s*grid-column:\s*1\s*\/\s*-1/);
});
