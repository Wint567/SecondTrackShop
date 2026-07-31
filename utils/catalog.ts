import type { CatalogFilters, CatalogSort, Product } from "@/types/product";

export const emptyCatalogFilters = (): CatalogFilters => ({
  brands: [],
  categories: [],
  conditions: [],
  sizes: [],
  statuses: [],
});

export function normalizeCatalogSearch(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru");
}

const hasMatch = (selected: string[], value: string) =>
  selected.length === 0 || selected.includes(value);

const comparePrice = (
  first: Product,
  second: Product,
  direction: "asc" | "desc",
) => {
  if (first.price === null && second.price === null) return 0;
  if (first.price === null) return 1;
  if (second.price === null) return -1;
  return direction === "asc"
    ? first.price - second.price
    : second.price - first.price;
};

const createdAtTime = (product: Product) => {
  const time = Date.parse(product.createdAt);
  return Number.isFinite(time) ? time : 0;
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
      [product.title, product.brand, product.category, product.description].join(
        " ",
      ),
    );

    return (
      (queryTokens.length === 0 ||
        queryTokens.every((token) => searchable.includes(token))) &&
      (!favoritesOnly || favorites.has(product.id)) &&
      hasMatch(filters.categories, product.category) &&
      hasMatch(filters.brands, product.brand) &&
      hasMatch(filters.sizes, product.size) &&
      hasMatch(filters.conditions, product.condition) &&
      hasMatch(filters.statuses, product.status)
    );
  });

  return result.sort((first, second) => {
    let comparison = 0;
    if (sort === "price-asc") comparison = comparePrice(first, second, "asc");
    else if (sort === "price-desc") {
      comparison = comparePrice(first, second, "desc");
    } else comparison = createdAtTime(second) - createdAtTime(first);

    return comparison || first.id.localeCompare(second.id);
  });
}

const filterParamMap: Record<keyof CatalogFilters, string> = {
  brands: "brand",
  categories: "category",
  conditions: "condition",
  sizes: "size",
  statuses: "status",
};

export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const filters = emptyCatalogFilters();
  for (const [key, param] of Object.entries(filterParamMap) as Array<
    [keyof CatalogFilters, string]
  >) {
    filters[key] = [...new Set(params.getAll(param).map((value) => value.trim()))]
      .filter(Boolean);
  }
  return filters;
}

export function readCatalogSort(params: URLSearchParams): CatalogSort {
  const value = params.get("sort");
  return value === "price-asc" || value === "price-desc" ? value : "newest";
}

export function writeCatalogState(
  current: URLSearchParams,
  filters: CatalogFilters,
  sort: CatalogSort,
): URLSearchParams {
  const next = new URLSearchParams(current);
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
