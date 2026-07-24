const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "_site", "index.html"),
  "utf8"
);

test("home page includes the Yandex.Metrika snippet", () => {
  assert.match(html, /mc\.yandex\.ru\/metrika\/tag\.js/);
});

test("home page loads analytics.js", () => {
  assert.match(html, /\/js\/analytics\.js/);
});
