(function () {
  function initGallery(doc) {
    const main = doc.getElementById("gallery-main");
    const thumbs = Array.from(doc.querySelectorAll(".gallery__thumb"));
    if (!main || !thumbs.length) return false;
    thumbs.forEach((btn) => {
      btn.addEventListener("click", () => {
        main.src = btn.dataset.src;
        thumbs.forEach((t) => t.classList.remove("gallery__thumb--active"));
        btn.classList.add("gallery__thumb--active");
      });
    });
    return true;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { initGallery };
  }
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => initGallery(document));
  }
})();
