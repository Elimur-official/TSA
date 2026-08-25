function buildOrderPayload(productId) {
  return JSON.stringify({ productId: Number(productId) });
}

function shouldSendToBot(tg) {
  return !!(tg && tg.initData && tg.platform && tg.platform !== "unknown");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildOrderPayload, shouldSendToBot };
}

if (typeof document !== "undefined") {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (shouldSendToBot(tg)) {
    tg.ready();
    tg.expand();
    document
      .querySelectorAll('[data-analytics="order-click"]')
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          try {
            tg.sendData(buildOrderPayload(button.dataset.productId));
            setTimeout(() => {
              window.location.href = button.href;
            }, 600);
          } catch (err) {
            window.location.href = button.href;
          }
        });
      });
  }
}
