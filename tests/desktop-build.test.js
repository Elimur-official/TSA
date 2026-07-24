const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(
  path.join(__dirname, "..", "src", "css", "styles.css"),
  "utf8"
);

test("styles.css defines a desktop breakpoint at 1280px", () => {
  assert.match(css, /@media \(min-width: 1280px\)/);
});

test("desktop breakpoint widens the product grid to 4 columns", () => {
  const desktopBlock = css.split("@media (min-width: 1280px)")[1];
  assert.match(desktopBlock, /\.product-grid\s*{\s*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
});
