import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyCatalogFilters,
  filterAndSortProducts,
  normalizeCatalogSearch,
  readCatalogFilters,
  readCatalogSort,
  writeCatalogState,
} from "../utils/catalog.ts";
import { parseFavoriteIds } from "../utils/favorites.ts";
import {
  formatPrice,
  isSafeExternalUrl,
  parsePublicPrice,
  pluralizeProducts,
} from "../utils/format.ts";
import { selectProductPhotos } from "../utils/photos.ts";
import { getPublicStatus } from "../utils/status.ts";
import { loadInitialStoreState } from "../utils/store-state.ts";

const product = (overrides = {}) => ({
  brand: "Nike",
  category: "Куртка",
  condition: "Хорошее",
  createdAt: "2026-07-01T10:00:00.000Z",
  description: "Лёгкая спортивная куртка",
  id: "one",
  photos: [],
  price: 49,
  primaryPhotoId: null,
  size: "M",
  slug: "nike-jacket",
  status: "Выставлено",
  title: "Windbreaker Jacket",
  vintedUrl: null,
  ...overrides,
});

test("catalog search is case-insensitive, trims whitespace and matches brand", () => {
  const products = [
    product(),
    product({ brand: "Adidas", id: "two", title: "Trefoil Hoodie" }),
  ];
  const result = filterAndSortProducts({
    favorites: new Set(),
    favoritesOnly: false,
    filters: emptyCatalogFilters(),
    products,
    query: "  nIkE   wind  ",
    sort: "newest",
  });

  assert.deepEqual(result.map((item) => item.id), ["one"]);
  assert.equal(normalizeCatalogSearch("  NIKE   Air  "), "nike air");
});

test("catalog combines filters and favorites without duplicates", () => {
  const filters = emptyCatalogFilters();
  filters.categories = ["Куртка"];
  filters.sizes = ["M"];
  const products = [
    product(),
    product({ category: "Худи", id: "two" }),
    product({ id: "three", size: "L" }),
  ];
  const result = filterAndSortProducts({
    favorites: new Set(["one", "two"]),
    favoritesOnly: true,
    filters,
    products,
    query: "",
    sort: "newest",
  });

  assert.deepEqual(result.map((item) => item.id), ["one"]);
});

test("price sorting keeps missing values last and remains deterministic", () => {
  const products = [
    product({ id: "null-b", price: null }),
    product({ id: "high", price: 100 }),
    product({ id: "null-a", price: null }),
    product({ id: "low", price: 10 }),
  ];
  const base = {
    favorites: new Set(),
    favoritesOnly: false,
    filters: emptyCatalogFilters(),
    products,
    query: "",
  };

  assert.deepEqual(
    filterAndSortProducts({ ...base, sort: "price-asc" }).map((item) => item.id),
    ["low", "high", "null-a", "null-b"],
  );
  assert.deepEqual(
    filterAndSortProducts({ ...base, sort: "price-desc" }).map((item) => item.id),
    ["high", "low", "null-a", "null-b"],
  );
});

test("catalog URL state round-trips every filter and sort", () => {
  const filters = emptyCatalogFilters();
  filters.brands = ["Nike", "Adidas"];
  filters.conditions = ["Хорошее"];
  const params = writeCatalogState(
    new URLSearchParams("q=hoodie&favorites=1"),
    filters,
    "price-desc",
  );

  assert.equal(params.get("q"), "hoodie");
  assert.equal(params.get("favorites"), "1");
  assert.deepEqual(readCatalogFilters(params), filters);
  assert.equal(readCatalogSort(params), "price-desc");
});

test("price parser rejects missing and invalid values without turning them into zero", () => {
  assert.equal(parsePublicPrice(null), null);
  assert.equal(parsePublicPrice(undefined), null);
  assert.equal(parsePublicPrice(""), null);
  assert.equal(parsePublicPrice("not-a-number"), null);
  assert.equal(parsePublicPrice(-1), null);
  assert.equal(parsePublicPrice("48.97"), 48.97);
  assert.match(formatPrice(48.97), /48,97\s*zł/);
  assert.equal(formatPrice(null), "Цена по запросу");
});

test("Vinted URLs accept only HTTPS vinted.pl hosts", () => {
  assert.equal(isSafeExternalUrl("https://www.vinted.pl/items/123"), true);
  assert.equal(isSafeExternalUrl("https://vinted.pl/items/123"), true);
  assert.equal(isSafeExternalUrl("http://vinted.pl/items/123"), false);
  assert.equal(isSafeExternalUrl("https://vinted.pl.evil.example/items/123"), false);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
});

test("photo selection prefers primary, falls back to first and removes duplicates", () => {
  const photos = [
    { id: "first", itemId: "item", order: 1, url: "https://img/first.jpg" },
    { id: "duplicate", itemId: "item", order: 2, url: "https://img/first.jpg" },
    { id: "primary", itemId: "item", order: 3, url: "https://img/primary.jpg" },
    { id: "other", itemId: "other", order: 0, url: "https://img/other.jpg" },
  ];

  assert.deepEqual(
    selectProductPhotos(photos, "item", "primary").map((photo) => photo.id),
    ["primary", "first"],
  );
  assert.deepEqual(
    selectProductPhotos(photos, "item", "missing").map((photo) => photo.id),
    ["first", "primary"],
  );
});

test("favorites, statuses and plurals survive unknown or corrupted input", () => {
  assert.deepEqual(parseFavoriteIds("not-json"), []);
  assert.deepEqual(parseFavoriteIds('{"id":"one"}'), []);
  assert.deepEqual(parseFavoriteIds('["one",null,"one",2,"two"]'), ["one", "two"]);
  assert.deepEqual(getPublicStatus("Куплено"), {
    kind: "soon",
    label: "Скоро в продаже",
  });
  assert.deepEqual(getPublicStatus(""), {
    kind: "default",
    label: "Статус не указан",
  });
  assert.equal(pluralizeProducts(1), "1 товар");
  assert.equal(pluralizeProducts(2), "2 товара");
  assert.equal(pluralizeProducts(11), "11 товаров");
});

test("initial store state keeps an empty catalog distinct from an error", async () => {
  const empty = await loadInitialStoreState(async () => []);
  assert.deepEqual(empty, { error: false, products: [] });

  const failed = await loadInitialStoreState(async () => {
    throw new Error("Supabase is unavailable");
  });
  assert.deepEqual(failed, { error: true, products: [] });
});
