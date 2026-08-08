module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("admin");

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

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
