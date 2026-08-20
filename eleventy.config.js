module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("prototip");
  eleventyConfig.addPassthroughCopy("shkola-vx82k4");

  eleventyConfig.addFilter("categories", (products) => {
    return [...new Set((products || []).map((p) => p.category))].sort();
  });

  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  eleventyConfig.addFilter("faqPick", (items, questions) =>
    (questions || [])
      .map((q) => (items || []).find((i) => i.question === q))
      .filter(Boolean)
  );

  eleventyConfig.addFilter("stars", (rating) => "★".repeat(Number(rating) || 0));

  eleventyConfig.addFilter("withRating", (ld, rating, count) =>
    rating && count
      ? Object.assign({}, ld, {
          aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: count },
        })
      : ld
  );

  eleventyConfig.addFilter("ruDate", (d) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" })
      .format(d instanceof Date ? d : new Date(d))
      .replace(/\s?г\.$/, "")
  );

  eleventyConfig.addFilter("pickProducts", (products, ids) =>
    (ids || [])
      .map((id) => (products || []).find((p) => p.id === id))
      .filter(Boolean)
  );

  eleventyConfig.addFilter("articleBySlug", (coll, slug) =>
    (coll || []).find((a) => a.fileSlug === slug) || null
  );

  eleventyConfig.addFilter("ruSitemapDate", (d) =>
    (d instanceof Date ? d : new Date(d || Date.now())).toISOString().slice(0, 10)
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
