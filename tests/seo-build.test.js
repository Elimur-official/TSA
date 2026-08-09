const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(...parts) {
  return fs.readFileSync(path.join(__dirname, "..", "_site", ...parts), "utf8");
}

test("every key page has a non-empty, distinct meta description", () => {
  const pages = {
    "index.html": null,
    "about/index.html": null,
    "faq/index.html": null,
    "reviews/index.html": null,
    "articles/index.html": null,
    "anonymity/index.html": null,
    "product/1/index.html": null,
  };
  for (const page of Object.keys(pages)) {
    const html = read(page);
    const m = html.match(/<meta name="description" content="([^"]+)">/);
    assert.ok(m, `${page} must carry a meta description`);
    assert.ok(m[1].length > 20, `${page} description must be real copy, not a stub`);
    pages[page] = m[1];
  }
  const uniqueDescriptions = new Set(Object.values(pages));
  assert.equal(uniqueDescriptions.size, Object.keys(pages).length, "descriptions must not all be the same fallback string");
});

test("individual guide articles carry their own description", () => {
  for (const slug of ["s-chego-nachat", "uhod-za-igrushkami", "smazki-kakuyu-vybrat"]) {
    const html = read("articles", slug, "index.html");
    const m = html.match(/<meta name="description" content="([^"]+)">/);
    assert.ok(m, `${slug} must carry a meta description`);
    assert.ok(m[1].length > 20, `${slug} description must be real copy`);
  }
});

test("robots.txt is published and points to the sitemap", () => {
  const robots = read("robots.txt");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/effulgent-smakager-3d5066\.netlify\.app\/sitemap\.xml/);
});

test("sitemap.xml lists key pages with absolute URLs", () => {
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  for (const url of [
    "https://effulgent-smakager-3d5066.netlify.app/",
    "https://effulgent-smakager-3d5066.netlify.app/about/",
    "https://effulgent-smakager-3d5066.netlify.app/product/1/",
    "https://effulgent-smakager-3d5066.netlify.app/product/2/",
    "https://effulgent-smakager-3d5066.netlify.app/product/3/",
    "https://effulgent-smakager-3d5066.netlify.app/anonymity/",
    "https://effulgent-smakager-3d5066.netlify.app/articles/s-chego-nachat/",
  ]) {
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap must list ${url}`);
  }
  // admin/CMS pages must never be indexed
  assert.doesNotMatch(sitemap, /\/admin\//);
});

test("yandex-verification meta tag renders only when a real code is configured", () => {
  const home = read("index.html");
  assert.doesNotMatch(home, /name="yandex-verification"/, "must stay absent until a real code is set in site.json");
});
