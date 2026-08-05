"use client";

import { ArrowRight, ExternalLink, Heart } from "lucide-react";
import Link from "next/link";
import { CableBackdrop } from "@/components/experience/CableBackdrop";
import { BackToCatalogLink } from "@/components/product/BackToCatalogLink";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ErrorState, LoadingState } from "@/components/ui/AsyncStates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFavorites } from "@/hooks/use-favorites";
import { useRelatedStoreItems, useStoreItem } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import { formatArchivePrice, isSafeExternalUrl } from "@/utils/format";
import { presentCategory, presentCondition } from "@/utils/presentation";

export function ProductPage({
  initialProduct,
  initialRelated,
  relatedLoadFailed = false,
  slug,
}: {
  initialProduct?: Product;
  initialRelated?: Product[];
  relatedLoadFailed?: boolean;
  slug: string;
}) {
  const { data: product, error, loading, retry } = useStoreItem(slug, initialProduct);
  const related = useRelatedStoreItems(
    product?.category ?? "",
    product?.id ?? "",
    initialRelated,
    relatedLoadFailed,
  );
  const { favorites, toggleFavorite } = useFavorites();

  if (loading)
    return (
      <main id="main-content" className="product-loading cutpaste-sheet">
        <LoadingState count={2} />
      </main>
    );
  if (error)
    return (
      <main id="main-content" className="product-error cutpaste-sheet">
        <ErrorState
          description="Please try again in a moment. Your favorites are still on this device."
          retry={retry}
          title="We couldn't load this item."
        />
      </main>
    );
  if (!product)
    return (
      <main id="main-content" className="not-found cutpaste-sheet">
        <p>Item not found</p>
        <h1>THIS PIECE HAS LEFT THE ARCHIVE.</h1>
        <Link className="club-button" href="/catalog">
          Back to the archive
        </Link>
      </main>
    );

  const isFavorite = favorites.has(product.id);
  const canOpenVinted = isSafeExternalUrl(product.vintedUrl);
  const objectCode = `ARCHIVE ${product.id.slice(0, 3).toUpperCase()}`;

  return (
    <main id="main-content" className="cutpaste-sheet product-page">
      <BackToCatalogLink />
      <div className="product-layout">
        <section className="product-stage" aria-label="Product gallery">
          <CableBackdrop />
          <div className="product-stage__tape" aria-hidden="true" />
          <div className="product-stage__inner">
            <ProductGallery photos={product.photos} title={product.title} />
          </div>
          <div className="product-stage__file">
            FOUND_{product.id.slice(0, 3).toUpperCase()}.JPG
          </div>
        </section>
        <section className="product-info" aria-labelledby="product-title">
          <div className="product-info__inner">
            <p className="product-info__index">{objectCode}</p>
            <h1 id="product-title">
              <span>{product.brand}</span>
              {product.title}
            </h1>
            <span className="marker-note product-info__note">
              one more
              <br />
              life
            </span>
            <p className="product-info__price">{formatArchivePrice(product.price)}</p>
            <div className="product-info__facts">
              <StatusBadge status={product.status} />
              <span>{presentCondition(product.condition)}</span>
              <span>{presentCategory(product.category)}</span>
              <span>Size {product.size}</span>
            </div>
            <span className="lime-sticker">
              WORN
              <br />
              AGAIN
            </span>
            <div className="product-size">
              <span>Size</span>
              <span className="product-size__value">{product.size}</span>
            </div>
            <div className="product-accordions">
              <details>
                <summary>
                  Condition <span aria-hidden="true">+</span>
                </summary>
                <p>
                  {presentCondition(product.condition)}. This is a one-of-one pre-owned object; all
                  visible wear belongs to its individual history.
                </p>
              </details>
              <details>
                <summary>
                  Measurements <span aria-hidden="true">+</span>
                </summary>
                <p>Check the measurements and fit notes on the Vinted listing before purchase.</p>
              </details>
            </div>
            {canOpenVinted ? (
              <a
                className="club-button product-vinted"
                href={product.vintedUrl as string}
                rel="noopener noreferrer"
                target="_blank"
              >
                View on Vinted <ArrowRight aria-hidden="true" />
                <ExternalLink aria-hidden="true" />
              </a>
            ) : (
              <p className="vinted-unavailable">The Vinted listing is not available yet.</p>
            )}
            <button
              className={`product-save ${isFavorite ? "is-active" : ""}`}
              onClick={() => toggleFavorite(product.id)}
              type="button"
            >
              <Heart aria-hidden="true" />
              {isFavorite ? "Added to favorites" : "Add to favorites"}
            </button>
          </div>
        </section>
      </div>
      <section className="product-notes">
        <div>
          <h2>Product notes</h2>
          <p>{product.description}</p>
        </div>
        <div className="related-section" aria-labelledby="related-title">
          <div className="club-section-heading">
            <h2 id="related-title">YOU MAY ALSO LIKE</h2>
            <Link href={`/catalog?category=${encodeURIComponent(product.category)}`}>
              View all <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {related.loading ? (
            <LoadingState count={4} />
          ) : related.error ? (
            <ErrorState retry={related.retry} />
          ) : related.data.length > 0 ? (
            <ProductGrid products={related.data.slice(0, 4)} />
          ) : (
            <p className="related-empty">
              No other published pieces are available in this category yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
