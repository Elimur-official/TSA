function filterProducts(products, category) {
  if (category === "all") return products;
  return products.filter((p) => p.category === category);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { filterProducts };
}

if (typeof document !== "undefined") {
  const grid = document.getElementById("product-grid");
  const filterBar = document.getElementById("category-filter");
  if (grid && filterBar) {
    const cards = [...grid.querySelectorAll(".product-card")];
    filterBar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      filterBar
        .querySelectorAll(".chip")
        .forEach((chip) => chip.classList.remove("chip--active"));
      button.classList.add("chip--active");
      const category = button.dataset.category;
      cards.forEach((card) => {
        const visible = category === "all" || card.dataset.category === category;
        card.hidden = !visible;
      });
    });
  }
}
