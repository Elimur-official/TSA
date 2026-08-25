function trackOrderClick(ymFn, ymId, goal, params) {
  ymFn(ymId, "reachGoal", goal, params);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { trackOrderClick };
}

if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const el = event.target.closest('[data-analytics="order-click"]');
    if (!el || typeof window.ym !== "function" || !window.YM_ID) return;
    trackOrderClick(window.ym, window.YM_ID, "order_click", {
      productId: el.dataset.productId,
    });
  });
}
