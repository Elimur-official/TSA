const test = require("node:test");
const assert = require("node:assert/strict");
const { buildOrderPayload } = require("../src/js/miniapp.js");

test("builds a JSON payload with a numeric productId from a string input", () => {
  assert.equal(buildOrderPayload("5"), JSON.stringify({ productId: 5 }));
});

test("builds a JSON payload when productId is already a number", () => {
  assert.equal(buildOrderPayload(7), JSON.stringify({ productId: 7 }));
});
