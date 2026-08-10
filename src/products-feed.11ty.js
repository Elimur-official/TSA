module.exports = class {
  data() {
    return {
      permalink: "/products.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ products, site }) {
    const base = site.baseUrl.replace(/\/$/, "");
    const feed = (products || []).map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      oldPrice: product.oldPrice,
      category: product.category,
      image: /^https?:\/\//.test(product.image)
        ? product.image
        : base + product.image,
      inStock: product.inStock !== false,
    }));
    return JSON.stringify(feed, null, 2);
  }
};
