"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Product } from "@/types/product";
import { formatArchivePrice } from "@/utils/format";

type ProductCardProps = {
  accent?: number;
  archiveIndex?: number;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  product: Product;
  priority?: boolean;
};

export function ProductCard({
  accent = 0,
  archiveIndex = 0,
  favorite,
  onToggleFavorite,
  product,
  priority = false,
}: ProductCardProps) {
  const objectCode = `#${product.id.slice(0, 5).toUpperCase()}-${String(archiveIndex + 1).padStart(3, "0")}`;

  return (
    <article className="product-card">
      <Link
        aria-label={`Open ${product.brand}: ${product.title}`}
        className="product-card__link"
        href={`/product/${encodeURIComponent(product.slug)}`}
      >
        <div className="product-card__media">
          <ProductImage
            alt={`${product.brand}, ${product.title}`}
            eager={priority}
            sizes="(max-width: 767px) 46vw, (max-width: 1120px) 23vw, 16vw"
            src={product.photos[0]?.url}
          />
          {accent === 0 && (
            <span className="product-card__sticker">
              WORN
              <br />
              AGAIN
            </span>
          )}
          {accent === 3 && (
            <span className="product-card__sticker product-card__sticker--pink">
              RARE
              <br />
              FIND
            </span>
          )}
        </div>
        <div className="product-card__body">
          <h3>
            <span>{product.brand}</span> {product.title}
          </h3>
          <div className="product-card__line">
            <span>{product.size}</span>
            <strong>{formatArchivePrice(product.price)}</strong>
          </div>
          <span className="product-card__code">{objectCode}</span>
        </div>
      </Link>
      <button
        aria-label={
          favorite ? `Remove ${product.title} from saved objects` : `Save ${product.title}`
        }
        aria-pressed={favorite}
        className={`favorite-button ${favorite ? "is-active" : ""}`}
        onClick={() => onToggleFavorite(product.id)}
        type="button"
      >
        <Heart aria-hidden="true" />
      </button>
    </article>
  );
}
