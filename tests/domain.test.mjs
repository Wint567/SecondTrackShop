import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyCatalogFilters,
  filterAndSortProducts,
  normalizeCatalogSearch,
  readCatalogFilters,
  readCatalogSort,
  sanitizeCatalogFilters,
  writeCatalogState,
} from "../utils/catalog.ts";
import { parseFavoriteIds } from "../utils/favorites.ts";
import { getResponsiveImageCandidates } from "../utils/images.ts";
import {
  formatPrice,
  isSafeExternalUrl,
  parsePublicPrice,
  pluralizeProducts,
} from "../utils/format.ts";
import { selectProductPhotos } from "../utils/photos.ts";
import { getPublicStatus } from "../utils/status.ts";
import { loadInitialStoreState } from "../utils/store-state.ts";
import {
  PUBLIC_STORE_REVALIDATE_SECONDS,
  withPublicStoreRevalidation,
} from "../lib/supabase/public-fetch.ts";

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
  const products = [product(), product({ brand: "Adidas", id: "two", title: "Trefoil Hoodie" })];
  const result = filterAndSortProducts({
    favorites: new Set(),
    favoritesOnly: false,
    filters: emptyCatalogFilters(),
    products,
    query: "  nIkE   wind  ",
    sort: "newest",
  });

  assert.deepEqual(
    result.map((item) => item.id),
    ["one"],
  );
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

  assert.deepEqual(
    result.map((item) => item.id),
    ["one"],
  );
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
  assert.deepEqual(
    filterAndSortProducts({
      ...base,
      products: [product({ id: "z", title: "Zulu" }), product({ id: "a", title: "alpha" })],
      sort: "name-asc",
    }).map((item) => item.id),
    ["a", "z"],
  );
});

test("catalog price ranges filter real prices and exclude missing prices", () => {
  const filters = emptyCatalogFilters();
  filters.priceRanges = ["Under 100 PLN", "200 PLN & up"];
  const products = [
    product({ id: "low", price: 89 }),
    product({ id: "middle", price: 149 }),
    product({ id: "high", price: 249 }),
    product({ id: "missing", price: null }),
  ];

  assert.deepEqual(
    filterAndSortProducts({
      favorites: new Set(),
      favoritesOnly: false,
      filters,
      products,
      query: "",
      sort: "newest",
    }).map((item) => item.id),
    ["high", "low"],
  );
});

test("catalog URL state round-trips every filter and sort", () => {
  const filters = emptyCatalogFilters();
  filters.brands = ["Nike", "Adidas"];
  filters.conditions = ["Хорошее"];
  filters.priceRanges = ["100–199 PLN"];
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

test("changing catalog filters resets pagination while preserving search state", () => {
  const filters = emptyCatalogFilters();
  filters.sizes = ["M"];
  const params = writeCatalogState(
    new URLSearchParams("q=jacket&page=4&favorites=1"),
    filters,
    "newest",
  );

  assert.equal(params.get("page"), null);
  assert.equal(params.get("q"), "jacket");
  assert.equal(params.get("favorites"), "1");
  assert.deepEqual(params.getAll("size"), ["M"]);
});

test("catalog ignores unknown URL filters instead of producing a false empty state", () => {
  const raw = readCatalogFilters(new URLSearchParams("brand=Not+A+Real+Brand&size=M"));
  const sanitized = sanitizeCatalogFilters(raw, {
    brands: ["Nike"],
    categories: ["Jacket"],
    conditions: ["Good"],
    priceRanges: ["Under 100 PLN"],
    sizes: ["M"],
    statuses: ["Available"],
  });
  assert.deepEqual(sanitized.brands, []);
  assert.deepEqual(sanitized.sizes, ["M"]);
});

test("price parser rejects missing and invalid values without turning them into zero", () => {
  assert.equal(parsePublicPrice(null), null);
  assert.equal(parsePublicPrice(undefined), null);
  assert.equal(parsePublicPrice(""), null);
  assert.equal(parsePublicPrice("not-a-number"), null);
  assert.equal(parsePublicPrice(-1), null);
  assert.equal(parsePublicPrice("48.97"), 48.97);
  assert.match(formatPrice(48.97), /PLN\s*48\.97/);
  assert.equal(formatPrice(null), "Price on request");
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

test("responsive photos use only the public Supabase image transform endpoint", () => {
  const source = "https://project.supabase.co/storage/v1/object/public/item-photos/item/photo.jpg";
  const candidates = getResponsiveImageCandidates(source);

  assert.equal(candidates.length, 4);
  assert.match(candidates[0], /render\/image\/public\/item-photos/);
  assert.match(candidates[0], /width=240/);
  assert.equal(
    getResponsiveImageCandidates(
      "https://images.example.com/storage/v1/object/public/item-photos/photo.jpg",
    ).length,
    0,
  );
  assert.equal(
    getResponsiveImageCandidates(
      "https://project.supabase.co/storage/v1/render/image/public/item-photos/photo.jpg",
    ).length,
    0,
  );
});

test("favorites, statuses and plurals survive unknown or corrupted input", () => {
  assert.deepEqual(parseFavoriteIds("not-json"), []);
  assert.deepEqual(parseFavoriteIds('{"id":"one"}'), []);
  assert.deepEqual(parseFavoriteIds('["one",null,"one",2,"two"]'), ["one", "two"]);
  assert.deepEqual(getPublicStatus("Куплено"), {
    kind: "soon",
    label: "Coming soon",
  });
  assert.deepEqual(getPublicStatus(""), {
    kind: "default",
    label: "Status unavailable",
  });
  assert.equal(pluralizeProducts(1), "1 item");
  assert.equal(pluralizeProducts(2), "2 items");
  assert.equal(pluralizeProducts(11), "11 items");
});

test("initial store state keeps an empty catalog distinct from an error", async () => {
  const empty = await loadInitialStoreState(async () => []);
  assert.deepEqual(empty, { error: null, products: [] });

  let markedUncacheable = false;
  const failed = await loadInitialStoreState(
    async () => {
      throw new Error("Supabase is unavailable");
    },
    () => {
      markedUncacheable = true;
    },
  );
  assert.deepEqual(failed, {
    error: { area: "unknown", code: "PUBLIC_STORE_UNAVAILABLE" },
    products: [],
  });
  assert.equal(markedUncacheable, true);
});

test("server Supabase reads use Next revalidation without an unsupported cache mode", () => {
  const signal = new AbortController().signal;
  const init = withPublicStoreRevalidation({
    cache: "force-cache",
    headers: { accept: "application/json" },
    signal,
  });

  assert.equal(init.next?.revalidate, PUBLIC_STORE_REVALIDATE_SECONDS);
  assert.equal(init.signal, signal);
  assert.equal(init.cache, undefined);
  assert.equal(Object.hasOwn(init, "cache"), false);
});
