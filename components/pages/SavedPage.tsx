"use client";

import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AsyncStates";
import { ProductImage } from "@/components/ui/ProductImage";
import { useFavorites } from "@/hooks/use-favorites";
import { useStoreItems } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import type { StoreErrorInfo } from "@/utils/store-state";
import { formatArchivePrice, isSafeExternalUrl } from "@/utils/format";

export function SavedPage({
  initialError,
  initialProducts,
}: {
  initialError: StoreErrorInfo | null;
  initialProducts: Product[];
}) {
  const { data: products, error, loading, retry } = useStoreItems(initialProducts, initialError);
  const { clearFavorites, favorites, hydrated, replaceFavorites, toggleFavorite } = useFavorites();
  const [recentlyCleared, setRecentlyCleared] = useState<string[]>([]);
  const saved = products.filter((product) => favorites.has(product.id));
  const suggestions = products.filter((product) => !favorites.has(product.id)).slice(0, 4);

  useEffect(() => {
    if (recentlyCleared.length === 0) return;
    const timeout = window.setTimeout(() => setRecentlyCleared([]), 8000);
    return () => window.clearTimeout(timeout);
  }, [recentlyCleared]);

  const clearSaved = () => {
    setRecentlyCleared([...favorites]);
    clearFavorites();
  };

  const undoClear = () => {
    replaceFavorites(recentlyCleared);
    setRecentlyCleared([]);
  };

  return (
    <main id="main-content" className="cutpaste-sheet saved-page">
      <header className="saved-page__header">
        <div>
          <h1>
            SAVED <i>/</i>
            <br />
            FOR LATER
          </h1>
          <p>
            don’t let
            <br />
            it disappear
          </p>
        </div>
        <div className="saved-page__slot" aria-hidden="true" />
        <span>{String(saved.length).padStart(2, "0")} pieces</span>
        {saved.length > 0 && (
          <button onClick={clearSaved} type="button">
            Clear all
          </button>
        )}
      </header>

      {recentlyCleared.length > 0 && (
        <div className="saved-undo" role="status">
          <span>Saved objects cleared.</span>
          <button onClick={undoClear} type="button">
            Undo
          </button>
        </div>
      )}

      {loading || !hydrated ? (
        <LoadingState count={6} />
      ) : error ? (
        <ErrorState retry={retry} />
      ) : saved.length === 0 ? (
        <EmptyState variant="favorites" />
      ) : (
        <div className="saved-grid">
          {saved.map((product, index) => {
            const vinted = isSafeExternalUrl(product.vintedUrl);
            return (
              <article className="saved-object" key={product.id}>
                {index === 4 && (
                  <span className="saved-object__sticker">
                    LAST
                    <br />
                    ONE
                  </span>
                )}
                <Link
                  className="saved-object__media"
                  href={`/product/${encodeURIComponent(product.slug)}`}
                >
                  <ProductImage
                    alt={`${product.brand}, ${product.title}`}
                    sizes="(max-width: 767px) 46vw, 31vw"
                    src={product.photos[0]?.url}
                  />
                </Link>
                <div className="saved-object__info">
                  <h2>
                    {product.brand} {product.title}
                  </h2>
                  <button
                    aria-label={`Remove ${product.title} from favorites`}
                    onClick={() => toggleFavorite(product.id)}
                    type="button"
                  >
                    <Heart aria-hidden="true" fill="currentColor" />
                  </button>
                  <span>{product.size}</span>
                  <strong>{formatArchivePrice(product.price)}</strong>
                  {vinted ? (
                    <a href={product.vintedUrl as string} rel="noopener noreferrer" target="_blank">
                      View on Vinted <ArrowRight aria-hidden="true" />
                    </a>
                  ) : (
                    <Link href={`/product/${encodeURIComponent(product.slug)}`}>
                      View object <ArrowRight aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && hydrated && !error && suggestions.length > 0 && (
        <section className="saved-suggestions">
          <div className="club-section-heading">
            <h2>You may also like</h2>
            <span className="saved-suggestions__slot" aria-hidden="true" />
          </div>
          <ProductGrid products={suggestions} />
        </section>
      )}
    </main>
  );
}
