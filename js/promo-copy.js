(function (global) {
  function wireCopyButtons(root, writeText) {
    root.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await writeText(btn.dataset.copy);
          btn.textContent = "Скопировано ✓";
          setTimeout(() => { btn.textContent = "Скопировать"; }, 2000);
        } catch (err) {
          btn.textContent = btn.dataset.copy;
        }
      });
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { wireCopyButtons };
  }
  if (typeof document !== "undefined" && global.navigator && global.navigator.clipboard) {
    document.addEventListener("DOMContentLoaded", () => {
      wireCopyButtons(document, (t) => global.navigator.clipboard.writeText(t));
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
