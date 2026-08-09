(function () {
  function initStickyOrder(doc, ObserverCtor) {
    const bar = doc.getElementById("sticky-order");
    const cta = doc.querySelector('.product-detail__info a[data-analytics="order-click"]');
    if (!bar || !cta || typeof ObserverCtor !== "function") return null;
    const observer = new ObserverCtor((entries) => {
      entries.forEach((entry) => {
        bar.classList.toggle("sticky-order--visible", !entry.isIntersecting);
      });
    });
    observer.observe(cta);
    return observer;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { initStickyOrder };
  }
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      initStickyOrder(document, window.IntersectionObserver);
    });
  }
})();
