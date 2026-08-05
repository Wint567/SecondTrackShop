import type { CatalogFilters, CatalogSort, Product } from "@/types/product";
import { presentCategory, presentCondition } from "./presentation.ts";

export const emptyCatalogFilters = (): CatalogFilters => ({
  brands: [],
  categories: [],
  conditions: [],
  priceRanges: [],
  sizes: [],
  statuses: [],
});

export function normalizeCatalogSearch(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

const hasMatch = (selected: string[], value: string) =>
  selected.length === 0 || selected.includes(value);

const comparePrice = (first: Product, second: Product, direction: "asc" | "desc") => {
  if (first.price === null && second.price === null) return 0;
  if (first.price === null) return 1;
  if (second.price === null) return -1;
  return direction === "asc" ? first.price - second.price : second.price - first.price;
};

const createdAtTime = (product: Product) => {
  const time = Date.parse(product.createdAt);
  return Number.isFinite(time) ? time : 0;
};

const matchesPriceRange = (selected: string[], price: number | null) => {
  if (selected.length === 0) return true;
  if (price === null) return false;

  return selected.some((range) => {
    if (range === "Under 100 PLN") return price < 100;
    if (range === "100–199 PLN") return price >= 100 && price < 200;
    if (range === "200 PLN & up") return price >= 200;
    return false;
  });
};

export function filterAndSortProducts({
  favorites,
  favoritesOnly,
  filters,
  products,
  query,
  sort,
}: {
  favorites: ReadonlySet<string>;
  favoritesOnly: boolean;
  filters: CatalogFilters;
  products: Product[];
  query: string;
  sort: CatalogSort;
}): Product[] {
  const normalizedQuery = normalizeCatalogSearch(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const result = products.filter((product) => {
    const searchable = normalizeCatalogSearch(
      [
        product.title,
        product.brand,
        product.category,
        presentCategory(product.category),
        product.condition,
        presentCondition(product.condition),
        product.description,
      ].join(" "),
    );

    return (
      (queryTokens.length === 0 || queryTokens.every((token) => searchable.includes(token))) &&
      (!favoritesOnly || favorites.has(product.id)) &&
      hasMatch(filters.categories, product.category) &&
      hasMatch(filters.brands, product.brand) &&
      hasMatch(filters.sizes, product.size) &&
      hasMatch(filters.conditions, product.condition) &&
      matchesPriceRange(filters.priceRanges, product.price) &&
      hasMatch(filters.statuses, product.status)
    );
  });

  return result.sort((first, second) => {
    let comparison = 0;
    if (sort === "price-asc") comparison = comparePrice(first, second, "asc");
    else if (sort === "price-desc") {
      comparison = comparePrice(first, second, "desc");
    } else if (sort === "name-asc") {
      comparison = first.title.localeCompare(second.title, undefined, {
        sensitivity: "base",
      });
    } else comparison = createdAtTime(second) - createdAtTime(first);

    return comparison || first.id.localeCompare(second.id);
  });
}

const filterParamMap: Record<keyof CatalogFilters, string> = {
  brands: "brand",
  categories: "category",
  conditions: "condition",
  priceRanges: "price",
  sizes: "size",
  statuses: "status",
};

export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const filters = emptyCatalogFilters();
  for (const [key, param] of Object.entries(filterParamMap) as Array<
    [keyof CatalogFilters, string]
  >) {
    filters[key] = [...new Set(params.getAll(param).map((value) => value.trim()))].filter(Boolean);
  }
  return filters;
}

export function sanitizeCatalogFilters(
  filters: CatalogFilters,
  options: Record<keyof CatalogFilters, readonly string[]>,
): CatalogFilters {
  const sanitized = emptyCatalogFilters();
  for (const key of Object.keys(sanitized) as Array<keyof CatalogFilters>) {
    const allowed = new Set(options[key]);
    sanitized[key] = filters[key].filter((value) => allowed.has(value));
  }
  return sanitized;
}

export function readCatalogSort(params: URLSearchParams): CatalogSort {
  const value = params.get("sort");
  return value === "price-asc" || value === "price-desc" || value === "name-asc" ? value : "newest";
}

export function writeCatalogState(
  current: URLSearchParams,
  filters: CatalogFilters,
  sort: CatalogSort,
): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete("page");
  for (const [key, param] of Object.entries(filterParamMap) as Array<
    [keyof CatalogFilters, string]
  >) {
    next.delete(param);
    for (const value of filters[key]) next.append(param, value);
  }

  if (sort === "newest") next.delete("sort");
  else next.set("sort", sort);
  return next;
}
