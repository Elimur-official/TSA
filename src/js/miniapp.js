function buildOrderPayload(productId) {
  return JSON.stringify({ productId: Number(productId) });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildOrderPayload };
}

if (typeof document !== "undefined") {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    document
      .querySelectorAll('[data-analytics="order-click"]')
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          try {
            tg.sendData(buildOrderPayload(button.dataset.productId));
          } catch (err) {
            window.location.href = button.href;
          }
        });
      });
  }
}
