"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AsyncStates";
import { useStoreItems } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import type { StoreErrorInfo } from "@/utils/store-state";

export function HomeDrop({
  initialError,
  initialProducts,
}: {
  initialError: StoreErrorInfo | null;
  initialProducts: Product[];
}) {
  const { data: products, error, loading, retry } = useStoreItems(initialProducts, initialError);
  const newDrop = products.slice(0, 4);

  return (
    <section className="new-drop" aria-labelledby="new-drop-title">
      <div className="section-cutout" aria-hidden="true" />
      <header className="club-section-heading">
        <h2 id="new-drop-title">
          NEW DROP <i>/ {String(newDrop.length).padStart(2, "0")}</i>
        </h2>
        <Link href="/new-drop">
          View all <ArrowRight aria-hidden="true" />
        </Link>
      </header>
      {loading ? (
        <LoadingState count={4} />
      ) : error ? (
        <ErrorState retry={retry} />
      ) : newDrop.length > 0 ? (
        <ProductGrid products={newDrop} />
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
