const test = require("node:test");
const assert = require("node:assert/strict");
const { wireCopyButtons } = require("../src/js/promo-copy.js");

function fakeButton(code) {
  const listeners = {};
  return {
    dataset: { copy: code },
    textContent: "Скопировать",
    addEventListener: (ev, fn) => { listeners[ev] = fn; },
    click: () => listeners.click && listeners.click({ preventDefault() {} }),
  };
}

test("click copies the code and gives feedback", async () => {
  const btn = fakeButton("WB15");
  const copied = [];
  wireCopyButtons({ querySelectorAll: () => [btn] }, async (t) => copied.push(t));
  btn.click();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(copied, ["WB15"]);
  assert.equal(btn.textContent, "Скопировано ✓");
});
