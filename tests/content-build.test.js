const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

test("CMS config is valid YAML with expected collections", () => {
  const raw = fs.readFileSync(
    path.join(__dirname, "..", "admin", "config.yml"),
    "utf8"
  );
  const config = yaml.load(raw);
  const names = config.collections.map((c) => c.name);
  assert.deepEqual(names.sort(), ["about", "articles", "faq", "reviews"]);
});

test("about page renders real legal details", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "_site", "about", "index.html"),
    "utf8"
  );
  assert.match(html, /324330000025894/);
  assert.match(html, /332713750222/);
});

test("reviews page renders seeded reviews", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "_site", "reviews", "index.html"),
    "utf8"
  );
  assert.match(html, /Ксения/);
  assert.match(html, /Наталья/);
});

test("articles list links to the individual article page", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "_site", "articles", "index.html"),
    "utf8"
  );
  assert.match(html, /href="\/articles\/s-chego-nachat\/"/);
});

test("product page now shows a real review snippet", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "_site", "product", "1", "index.html"),
    "utf8"
  );
  assert.match(html, /Гульнара/);
});

test("faq page renders questions and the WB promo block", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "_site", "faq", "index.html"),
    "utf8"
  );
  assert.match(html, /Как оформить заказ/);
  assert.match(html, /Промокод −15%/);
});

test("every page carries the footer with legal details", () => {
  for (const page of ["index.html", "faq/index.html", "about/index.html", "product/1/index.html"]) {
    const pageHtml = fs.readFileSync(path.join(__dirname, "..", "_site", page), "utf8");
    assert.match(pageHtml, /site-footer/, page);
    assert.match(pageHtml, /324330000025894/, page);
    assert.match(pageHtml, /332713750222/, page);
    assert.match(pageHtml, /18\+/, page);
  }
});
