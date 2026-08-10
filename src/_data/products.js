const fs = require("node:fs");
const path = require("node:path");

const PRODUCTS_DIR = path.join(__dirname, "..", "content", "products");

module.exports = function () {
  if (!fs.existsSync(PRODUCTS_DIR)) return [];
  return fs
    .readdirSync(PRODUCTS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) =>
      JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR, file), "utf8"))
    )
    .filter((product) => product && Number.isInteger(product.id))
    .sort((a, b) => a.id - b.id);
};
