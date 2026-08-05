"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { CatalogControls } from "@/components/catalog/CatalogControls";
import { CableBackdrop } from "@/components/experience/CableBackdrop";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AsyncStates";
import { useFavorites } from "@/hooks/use-favorites";
import { useStoreItems } from "@/hooks/use-store-items";
import type { CatalogSort, Product } from "@/types/product";
import {
  filterAndSortProducts,
  readCatalogFilters,
  readCatalogSort,
  sanitizeCatalogFilters,
  writeCatalogState,
} from "@/utils/catalog";
import type { StoreErrorInfo } from "@/utils/store-state";

const unique = (values: string[]) =>
  [...new Set(values.filter(Boolean))].sort((first, second) => first.localeCompare(second));

function CatalogUrlSync({ onChange }: { onChange: (value: string) => void }) {
  const searchParams = useSearchParams();
  const serialized = searchParams.toString();

  useEffect(() => {
    onChange(serialized);
  }, [onChange, serialized]);

  return null;
}

export function CatalogPage({
  initialError,
  initialProducts,
}: {
  initialError: StoreErrorInfo | null;
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [routeState, setRouteState] = useState("");
  const { data: products, error, loading, retry } = useStoreItems(initialProducts, initialError);
  const { favorites } = useFavorites();
  const params = useMemo(() => new URLSearchParams(routeState), [routeState]);
  const sort = useMemo(() => readCatalogSort(params), [params]);
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const visibleCount = page * 12;
  const query = (params.get("q") ?? "").trim();
  const favoritesOnly = params.get("favorites") === "1";

  const options = useMemo(
    () => ({
      brands: unique(products.map((product) => product.brand)),
      categories: unique(products.map((product) => product.category)),
      conditions: unique(products.map((product) => product.condition)),
      priceRanges: ["Under 100 PLN", "100–199 PLN", "200 PLN & up"],
      sizes: unique(products.map((product) => product.size)),
      statuses: unique(products.map((product) => product.status)),
    }),
    [products],
  );

  const filters = useMemo(
    () => sanitizeCatalogFilters(readCatalogFilters(params), options),
    [options, params],
  );

  const filteredProducts = useMemo(
    () => filterAndSortProducts({ favorites, favoritesOnly, filters, products, query, sort }),
    [favorites, favoritesOnly, filters, products, query, sort],
  );
  const replaceParams = (next: URLSearchParams) => {
    const queryString = next.toString();
    setRouteState(queryString);
    router.replace(queryString ? `/catalog?${queryString}` : "/catalog", { scroll: false });
  };
  const updateCatalogState = (nextFilters: typeof filters, nextSort: typeof sort) =>
    replaceParams(writeCatalogState(params, nextFilters, nextSort));
  const updateSearch = (nextQuery: string) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (nextQuery) next.set("q", nextQuery);
    else next.delete("q");
    replaceParams(next);
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearch(String(new FormData(event.currentTarget).get("catalog-search") ?? "").trim());
  };
  const resetFilters = () => replaceParams(new URLSearchParams());
  const activeState =
    query || favoritesOnly || Object.values(filters).some((values) => values.length > 0);

  return (
    <main id="main-content" className="cutpaste-sheet catalog-page">
      <Suspense fallback={null}>
        <CatalogUrlSync onChange={setRouteState} />
      </Suspense>
      <header className="catalog-hero">
        <CableBackdrop />
        <div className="catalog-hero__title">
          <h1>
            FOUND <i>/</i> AGAIN
          </h1>
          <p>
            pick your
            <br />
            next track
          </p>
        </div>
        <div className="catalog-hero__slot" aria-hidden="true" />
      </header>

      <section className="catalog-surface">
        <form className="catalog-search" onSubmit={submitSearch} role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="catalog-search-input">
            Search the archive
          </label>
          <input
            defaultValue={query}
            id="catalog-search-input"
            key={query}
            name="catalog-search"
            placeholder="SEARCH FOUND ITEMS"
            type="search"
          />
        </form>

        {!loading && !error && (
          <CatalogControls
            filters={filters}
            getResultCount={(nextFilters) =>
              filterAndSortProducts({
                favorites,
                favoritesOnly,
                filters: nextFilters,
                products,
                query,
                sort,
              }).length
            }
            hasExternalState={Boolean(query || favoritesOnly)}
            onChange={(next) => updateCatalogState(next, sort)}
            onReset={resetFilters}
            options={options}
          />
        )}

        <div className="catalog-results__bar">
          <span>{String(filteredProducts.length).padStart(2, "0")} found</span>
          <label className="catalog-sort">
            <span>Sort by</span>
            <select
              onChange={(event) => updateCatalogState(filters, event.target.value as CatalogSort)}
              value={sort}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name: A–Z</option>
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
        </div>

        {loading ? (
          <LoadingState count={12} />
        ) : error ? (
          <ErrorState retry={retry} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState filtered={Boolean(activeState)} onReset={resetFilters} />
        ) : (
          <>
            <section aria-labelledby="catalog-results-heading">
              <h2 className="sr-only" id="catalog-results-heading">
                Catalog results
              </h2>
              <ProductGrid products={filteredProducts.slice(0, visibleCount)} />
            </section>
            {visibleCount < filteredProducts.length && (
              <div className="load-more">
                <button
                  className="club-button"
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set("page", String(page + 1));
                    replaceParams(next);
                  }}
                  type="button"
                >
                  Show more <span aria-hidden="true">→</span>
                </button>
                <span>
                  {Math.min(visibleCount, filteredProducts.length)} / {filteredProducts.length}
                </span>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
