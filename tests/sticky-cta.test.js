const test = require("node:test");
const assert = require("node:assert/strict");
const { initStickyOrder } = require("../src/js/sticky-cta.js");

function fakeDoc() {
  const bar = {
    classes: new Set(),
    classList: {
      toggle(name, force) {
        if (force) bar.classes.add(name);
        else bar.classes.delete(name);
      },
    },
  };
  const cta = {};
  return {
    bar,
    cta,
    getElementById: (id) => (id === "sticky-order" ? bar : null),
    querySelector: () => cta,
  };
}

test("bar becomes visible when the main CTA leaves the viewport", () => {
  const doc = fakeDoc();
  let callback;
  const observed = [];
  function FakeObserver(cb) {
    callback = cb;
    this.observe = (el) => observed.push(el);
  }
  const result = initStickyOrder(doc, FakeObserver);
  assert.ok(result, "returns the observer");
  assert.deepEqual(observed, [doc.cta]);
  callback([{ isIntersecting: false }]);
  assert.ok(doc.bar.classes.has("sticky-order--visible"));
  callback([{ isIntersecting: true }]);
  assert.ok(!doc.bar.classes.has("sticky-order--visible"));
});

test("does nothing without an observer constructor", () => {
  assert.equal(initStickyOrder(fakeDoc(), undefined), null);
});
