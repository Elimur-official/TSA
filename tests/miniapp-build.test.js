const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "_site", "index.html"),
  "utf8"
);

test("home page loads the Telegram WebApp SDK", () => {
  assert.match(html, /telegram\.org\/js\/telegram-web-app\.js/);
});

test("home page loads miniapp.js after the Telegram SDK", () => {
  const telegramIndex = html.indexOf("telegram-web-app.js");
  const miniappIndex = html.indexOf("/js/miniapp.js");
  assert.ok(telegramIndex > -1 && miniappIndex > -1);
  assert.ok(telegramIndex < miniappIndex);
});
