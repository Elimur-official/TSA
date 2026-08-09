const test = require("node:test");
const assert = require("node:assert/strict");
const { initGallery } = require("../src/js/gallery.js");

test("clicking a thumb swaps the main image and active class", () => {
  const main = { src: "/a.jpg" };
  const listeners = {};
  function thumb(src) {
    const t = {
      dataset: { src },
      classes: new Set(),
      classList: {
        add: (c) => t.classes.add(c),
        remove: (c) => t.classes.delete(c),
      },
      addEventListener: (ev, fn) => { listeners[src] = fn; },
    };
    return t;
  }
  const t1 = thumb("/a.jpg");
  const t2 = thumb("/b.jpg");
  const doc = {
    getElementById: (id) => (id === "gallery-main" ? main : null),
    querySelectorAll: () => [t1, t2],
  };
  assert.equal(initGallery(doc), true);
  listeners["/b.jpg"]();
  assert.equal(main.src, "/b.jpg");
  assert.ok(t2.classes.has("gallery__thumb--active"));
  assert.ok(!t1.classes.has("gallery__thumb--active"));
});

test("does nothing on pages without a gallery", () => {
  assert.equal(initGallery({ getElementById: () => null, querySelectorAll: () => [] }), false);
});
