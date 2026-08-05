"use client";

import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AsyncStates";
import { useStoreItems } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import type { StoreErrorInfo } from "@/utils/store-state";

export function BrandsPage({
  initialError,
  initialProducts,
}: {
  initialError: StoreErrorInfo | null;
  initialProducts: Product[];
}) {
  const { data: products, error, loading, retry } = useStoreItems(initialProducts, initialError);
  const brands = [...new Set(products.map((product) => product.brand))].sort((first, second) =>
    first.localeCompare(second),
  );
  return (
    <main id="main-content" className="cutpaste-sheet editorial-page brands-page">
      <header className="editorial-page__header">
        <p>Real labels in the current archive</p>
        <h1>
          BRANDS <i>/ {String(brands.length).padStart(2, "0")}</i>
        </h1>
        <span>Grouped A-Z</span>
      </header>
      {loading ? (
        <LoadingState count={8} />
      ) : error ? (
        <ErrorState retry={retry} />
      ) : brands.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="brand-index">
          {brands.map((brand, index) => {
            const brandProducts = products.filter((product) => product.brand === brand);
            const normalizedBrand = brand
              .toLocaleLowerCase()
              .normalize("NFKD")
              .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
              .replace(/^-|-$/g, "");
            const id = `brand-${normalizedBrand || "label"}-${index + 1}`;
            return (
              <section aria-labelledby={id} className="brand-group" key={brand}>
                <header>
                  <h2 id={id}>{brand}</h2>
                  <span>{String(brandProducts.length).padStart(2, "0")} objects</span>
                </header>
                <ProductGrid products={brandProducts} />
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
