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

test("promo code WB15 is visible on home and faq with a copy button", () => {
  for (const page of ["index.html", "faq/index.html"]) {
    const pageHtml = fs.readFileSync(path.join(__dirname, "..", "_site", page), "utf8");
    assert.match(pageHtml, /WB15/, page);
    assert.match(pageHtml, /data-copy="WB15"/, page);
  }
});

test("reviews page shows dates and the WB purchase badge", () => {
  const reviewsHtml = fs.readFileSync(path.join(__dirname, "..", "_site", "reviews", "index.html"), "utf8");
  assert.match(reviewsHtml, /11 июля 2026/);
  assert.match(reviewsHtml, /покупка на Wildberries/);
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

test("pages link the favicon and carry og tags", () => {
  const home = fs.readFileSync(path.join(__dirname, "..", "_site", "index.html"), "utf8");
  assert.match(home, /rel="icon"[^>]+favicon\.svg/);
  assert.match(home, /property="og:title"/);
  const productPage = fs.readFileSync(path.join(__dirname, "..", "_site", "product", "1", "index.html"), "utf8");
  assert.match(productPage, /property="og:title" content="Вибратор «Полночь» — elimur"/);
  assert.match(productPage, /property="og:image" content="https:\/\/effulgent-smakager-3d5066\.netlify\.app\/images\/products\/placeholder\.svg"/);
});

test("home page falls back to the raster default og:image, not the SVG placeholder", () => {
  const home = fs.readFileSync(path.join(__dirname, "..", "_site", "index.html"), "utf8");
  assert.match(home, /property="og:image" content="https:\/\/effulgent-smakager-3d5066\.netlify\.app\/images\/og-default\.png"/);
  assert.match(home, /property="og:image:width" content="1200"/);
  assert.match(home, /property="og:image:height" content="630"/);
});

test("article page shows related products from the catalog", () => {
  const articleHtml = fs.readFileSync(
    path.join(__dirname, "..", "_site", "articles", "s-chego-nachat", "index.html"),
    "utf8"
  );
  assert.match(articleHtml, /Из каталога/);
  assert.match(articleHtml, /href="\/product\/1\/"/);
});
