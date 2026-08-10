const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const feed = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "_site", "products.json"), "utf8")
);

test("feed ids match the product files in src/content/products/, sorted by id", () => {
  const contentDir = path.join(__dirname, "..", "src", "content", "products");
  const fileIds = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")).id)
    .sort((a, b) => a - b);
  assert.deepEqual(feed.map((p) => p.id), fileIds);
});

test("every image is an absolute URL the bot can hand to Telegram", () => {
  for (const product of feed) {
    assert.match(product.image, /^https:\/\//, product.name);
  }
});

test("no feed image is an SVG, because Telegram's sendPhoto cannot render SVG", () => {
  for (const product of feed) {
    assert.ok(
      !product.image.toLowerCase().endsWith(".svg"),
      `${product.name}: image ${product.image} is an SVG — Telegram's answer_photo raises TelegramBadRequest on SVG, breaking the product card`
    );
  }
});

test("feed carries the fields the bot card needs", () => {
  const first = feed[0];
  assert.equal(first.name, "Вибратор «Полночь»");
  assert.equal(first.description, "Тихий мотор и мягкий силикон, 5 уровней мощности.");
  assert.equal(first.price, 3890);
  assert.equal(first.category, "Вибраторы");
  assert.equal(first.inStock, true);
});
