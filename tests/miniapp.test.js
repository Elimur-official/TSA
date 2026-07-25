const test = require("node:test");
const assert = require("node:assert/strict");
const { buildOrderPayload, shouldSendToBot } = require("../src/js/miniapp.js");

test("builds a JSON payload with a numeric productId from a string input", () => {
  assert.equal(buildOrderPayload("5"), JSON.stringify({ productId: 5 }));
});

test("builds a JSON payload when productId is already a number", () => {
  assert.equal(buildOrderPayload(7), JSON.stringify({ productId: 7 }));
});

test("shouldSendToBot returns false when tg is undefined", () => {
  assert.equal(shouldSendToBot(undefined), false);
});

test("shouldSendToBot returns false when tg is an empty object", () => {
  assert.equal(shouldSendToBot({}), false);
});

test("shouldSendToBot returns false when platform is 'unknown'", () => {
  assert.equal(shouldSendToBot({ platform: "unknown", initData: "" }), false);
});

test("shouldSendToBot returns false when initData is empty", () => {
  assert.equal(shouldSendToBot({ platform: "android", initData: "" }), false);
});

test("shouldSendToBot returns true when in a genuine Telegram launch context", () => {
  assert.equal(shouldSendToBot({ platform: "android", initData: "user=123" }), true);
});

test("shouldSendToBot returns true with iOS platform and valid initData", () => {
  assert.equal(shouldSendToBot({ platform: "ios", initData: "user=456" }), true);
});
