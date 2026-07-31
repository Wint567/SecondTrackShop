"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CatalogControls } from "@/components/catalog/CatalogControls";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/AsyncStates";
import { useFavorites } from "@/hooks/use-favorites";
import { useStoreItems } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import { pluralizeProducts } from "@/utils/format";
import {
  filterAndSortProducts,
  readCatalogFilters,
  readCatalogSort,
  writeCatalogState,
} from "@/utils/catalog";

const unique = (values: string[]) =>
  [...new Set(values.filter(Boolean))].sort((first, second) =>
    first.localeCompare(second, "ru"),
  );

export function CatalogPage({
  initialError,
  initialProducts,
}: {
  initialError: boolean;
  initialProducts: Product[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: products, error, loading, retry } = useStoreItems(
    initialProducts,
    initialError,
  );
  const { favorites } = useFavorites();
  const routeState = searchParams.toString();
  const [pagination, setPagination] = useState({ count: 8, routeState });
  const params = useMemo(() => new URLSearchParams(routeState), [routeState]);
  const filters = useMemo(() => readCatalogFilters(params), [params]);
  const sort = useMemo(() => readCatalogSort(params), [params]);
  const visibleCount = pagination.routeState === routeState ? pagination.count : 8;

  const query = (searchParams.get("q") ?? "").trim().toLocaleLowerCase("ru");
  const favoritesOnly = searchParams.get("favorites") === "1";

  const options = useMemo(
    () => ({
      brands: unique(products.map((product) => product.brand)),
      categories: unique(products.map((product) => product.category)),
      conditions: unique(products.map((product) => product.condition)),
      sizes: unique(products.map((product) => product.size)),
      statuses: unique(products.map((product) => product.status)),
    }),
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts({
        favorites,
        favoritesOnly,
        filters,
        products,
        query,
        sort,
      }),
    [favorites, favoritesOnly, filters, products, query, sort],
  );

  const updateCatalogState = (
    nextFilters: typeof filters,
    nextSort: typeof sort,
  ) => {
    const next = writeCatalogState(params, nextFilters, nextSort);
    const queryString = next.toString();
    router.replace(queryString ? `/catalog?${queryString}` : "/catalog", {
      scroll: false,
    });
  };

  const resetFilters = () => {
    router.replace("/catalog");
  };

  const activeState =
    query ||
    favoritesOnly ||
    Object.values(filters).some((values) => values.length > 0);

  return (
    <main id="main-content" className="catalog-page page-shell">
      <nav aria-label="Хлебные крошки" className="breadcrumbs">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span aria-current="page">Каталог</span>
      </nav>

      <header className="catalog-heading">
        <p className="eyebrow">
          {favoritesOnly ? "Сохранённые вещи" : "Отобранная коллекция"}
        </p>
        <h1>{favoritesOnly ? "Избранное" : "Одежда"}</h1>
        {query && <p className="catalog-heading__query">Поиск: «{query}»</p>}
        <p>{pluralizeProducts(filteredProducts.length)}</p>
      </header>

      {!loading && !error && (
        <CatalogControls
          filters={filters}
          hasExternalState={Boolean(query || favoritesOnly)}
          onChange={(next) => {
            updateCatalogState(next, sort);
          }}
          onReset={resetFilters}
          onSortChange={(next) => {
            updateCatalogState(filters, next);
          }}
          options={options}
          resultCount={filteredProducts.length}
          sort={sort}
        />
      )}

      {loading ? (
        <LoadingState count={8} />
      ) : error ? (
        <ErrorState retry={retry} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState filtered={Boolean(activeState)} onReset={resetFilters} />
      ) : (
        <>
          <ProductGrid
            products={filteredProducts.slice(0, visibleCount)}
            priorityCount={4}
          />
          {visibleCount < filteredProducts.length && (
            <div className="load-more">
              <button
                className="button button--outline"
                onClick={() =>
                  setPagination({
                    count: visibleCount + 8,
                    routeState,
                  })
                }
                type="button"
              >
                Показать ещё
              </button>
              <span>
                {Math.min(visibleCount, filteredProducts.length)} из{" "}
                {filteredProducts.length}
              </span>
            </div>
          )}
        </>
      )}
    </main>
  );
}
