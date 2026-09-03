const STORAGE_KEY = "tmb_age_confirmed";
// Ключ прежнего бренда: читаем, но больше не пишем. Иначе те, кто уже
// подтвердил возраст, увидели бы заставку 18+ заново.
const STORAGE_KEY_STARY = "elimur_age_confirmed";

function hasConfirmedAge(storage) {
  return (
    storage.getItem(STORAGE_KEY) === "yes" ||
    storage.getItem(STORAGE_KEY_STARY) === "yes"
  );
}

function confirmAge(storage) {
  storage.setItem(STORAGE_KEY, "yes");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { STORAGE_KEY, STORAGE_KEY_STARY, hasConfirmedAge, confirmAge };
}

if (typeof document !== "undefined") {
  const gate = document.getElementById("age-gate");
  if (gate) {
    const yesBtn = document.getElementById("age-yes");
    const noBtn = document.getElementById("age-no");
    const denied = document.getElementById("age-denied");

    if (hasConfirmedAge(window.localStorage)) {
      gate.hidden = true;
    }
    yesBtn.addEventListener("click", () => {
      confirmAge(window.localStorage);
      gate.hidden = true;
    });
    noBtn.addEventListener("click", () => {
      yesBtn.hidden = true;
      noBtn.hidden = true;
      denied.hidden = false;
    });
  }
}
