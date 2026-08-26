const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const SITE_URL = require("../src/_data/site.json").baseUrl;
const ESC = SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function read(...parts) {
  return fs.readFileSync(path.join(__dirname, "..", "_site", ...parts), "utf8");
}

test("root page instantly redirects to the Tumbochka shop via meta refresh, JS and a visible link", () => {
  const html = read("index.html");
  assert.match(
    html,
    /<meta http-equiv="refresh" content="0; ?url=\/prototip\/tumbochka-2026\/">/,
    "must carry an instant meta refresh for no-JS visitors"
  );
  assert.match(
    html,
    /location\.replace\(["']\/prototip\/tumbochka-2026\/["']\)/,
    "must also redirect via JS for browsers that skip meta refresh"
  );
  assert.match(
    html,
    /<a href="\/prototip\/tumbochka-2026\/">/,
    "must carry a visible link as a fallback when JS is disabled"
  );
  // relative path only — no domain baked in
  assert.doesNotMatch(html, /https?:\/\/[^"]*\/prototip\/tumbochka-2026\//);
});

test("root redirect page is marked noindex and stays out of the sitemap", () => {
  const html = read("index.html");
  assert.match(html, /<meta name="robots" content="noindex">/);

  const sitemap = read("sitemap.xml");
  assert.doesNotMatch(
    sitemap,
    new RegExp(`<loc>${ESC}/</loc>`),
    "the redirect page must not appear in the sitemap as its own URL"
  );
  assert.match(
    sitemap,
    new RegExp(`<loc>${ESC}/elimur/</loc>`),
    "/elimur/ must still be listed in the sitemap"
  );
});

test("the previous elimur homepage still lives at /elimur/", () => {
  const html = read("elimur", "index.html");
  assert.match(html, /Удовольствие без лишних слов/, "old hero copy must still render at /elimur/");
  assert.match(html, /product-grid/);
});

test("internal home links on the old site point to /elimur/, not the redirect loop", () => {
  const elimurHome = read("elimur", "index.html");
  assert.match(elimurHome, /<a href="\/elimur\/" class="logo">elimur<\/a>/);
  assert.match(elimurHome, /<a href="\/elimur\/">Каталог<\/a>/);

  const productPage = read("product", "1", "index.html");
  assert.match(productPage, /<a href="\/elimur\/" class="back-link">← Каталог<\/a>/);
});
