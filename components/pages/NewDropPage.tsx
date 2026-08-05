"use client";

import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AsyncStates";
import { useStoreItems } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import type { StoreErrorInfo } from "@/utils/store-state";

export function NewDropPage({
  initialError,
  initialProducts,
}: {
  initialError: StoreErrorInfo | null;
  initialProducts: Product[];
}) {
  const { data: products, error, loading, retry } = useStoreItems(initialProducts, initialError);
  const drop = products.slice(0, 8);
  return (
    <main id="main-content" className="cutpaste-sheet editorial-page new-drop-page">
      <header className="editorial-page__header">
        <p>Latest published objects</p>
        <h1>
          NEW DROP <i>/ {String(drop.length).padStart(2, "0")}</i>
        </h1>
        <span>Newest first</span>
      </header>
      <section aria-labelledby="new-drop-results">
        <h2 className="sr-only" id="new-drop-results">
          Newest published pieces
        </h2>
        {loading ? (
          <LoadingState count={8} />
        ) : error ? (
          <ErrorState retry={retry} />
        ) : drop.length ? (
          <ProductGrid products={drop} />
        ) : (
          <EmptyState />
        )}
      </section>
    </main>
  );
}
