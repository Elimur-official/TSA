const test = require("node:test");
const assert = require("node:assert/strict");
const { hasConfirmedAge, confirmAge, STORAGE_KEY } = require("../src/js/age-gate.js");

function fakeStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
  };
}

test("hasConfirmedAge is false for empty storage", () => {
  assert.equal(hasConfirmedAge(fakeStorage()), false);
});

test("confirmAge then hasConfirmedAge returns true", () => {
  const storage = fakeStorage();
  confirmAge(storage);
  assert.equal(hasConfirmedAge(storage), true);
});

test("uses the expected storage key", () => {
  assert.equal(STORAGE_KEY, "elimur_age_confirmed");
});
