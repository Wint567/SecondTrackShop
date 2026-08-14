import type { Product } from "../types/product.ts";
import { normalizeCatalogSearch } from "./catalog.ts";
import { presentCategory, presentCondition } from "./presentation.ts";

const createdAtTime = (product: Product) => {
  const time = Date.parse(product.createdAt);
  return Number.isFinite(time) ? time : 0;
};

export function searchProducts(products: Product[], rawQuery: string): Product[] {
  const query = normalizeCatalogSearch(rawQuery);
  if (!query) {
    return [...products].sort(
      (first, second) =>
        createdAtTime(second) - createdAtTime(first) || first.id.localeCompare(second.id),
    );
  }

  const tokens = query.split(" ").filter(Boolean);
  return products
    .flatMap((product) => {
      const title = normalizeCatalogSearch(product.title);
      const brand = normalizeCatalogSearch(product.brand);
      const category = normalizeCatalogSearch(
        `${product.category} ${presentCategory(product.category)}`,
      );
      const condition = normalizeCatalogSearch(
        `${product.condition} ${presentCondition(product.condition)}`,
      );
      const searchable = normalizeCatalogSearch(
        [title, brand, category, condition, product.size, product.description].join(" "),
      );

      if (!tokens.every((token) => searchable.includes(token))) return [];

      let score = 0;
      if (title === query || brand === query) score += 120;
      if (title.startsWith(query)) score += 70;
      if (brand.startsWith(query)) score += 60;
      if (category.includes(query)) score += 30;
      for (const token of tokens) {
        if (title.split(" ").some((word) => word.startsWith(token))) score += 15;
        if (brand.split(" ").some((word) => word.startsWith(token))) score += 12;
      }

      return [{ product, score }];
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        createdAtTime(second.product) - createdAtTime(first.product) ||
        first.product.id.localeCompare(second.product.id),
    )
    .map(({ product }) => product);
}
