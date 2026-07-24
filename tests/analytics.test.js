const test = require("node:test");
const assert = require("node:assert/strict");
const { trackOrderClick } = require("../src/js/analytics.js");

test("calls ym with reachGoal, goal name and params", () => {
  const calls = [];
  const fakeYm = (...args) => calls.push(args);
  trackOrderClick(fakeYm, 12345, "order_click", { productId: "7" });
  assert.deepEqual(calls, [[12345, "reachGoal", "order_click", { productId: "7" }]]);
});
