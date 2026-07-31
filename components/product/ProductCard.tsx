"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Product } from "@/types/product";
import { formatPrice } from "@/utils/format";

const NEWNESS_CUTOFF = Date.now() - 21 * 24 * 60 * 60 * 1000;

type ProductCardProps = {
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  product: Product;
  priority?: boolean;
};

export function ProductCard({
  favorite,
  onToggleFavorite,
  product,
  priority = false,
}: ProductCardProps) {
  const mainPhoto = product.photos[0]?.url;
  const isNew = new Date(product.createdAt).getTime() >= NEWNESS_CUTOFF;

  return (
    <article className="product-card">
      <Link
        aria-label={`${product.brand}: ${product.title}`}
        className="product-card__link"
        href={`/product/${encodeURIComponent(product.slug)}`}
      >
        <div className="product-card__media">
          <ProductImage
            alt={`${product.brand}, ${product.title}`}
            eager={priority}
            src={mainPhoto}
          />
          <div className="product-card__badges">
            {product.status === "Куплено" ? (
              <StatusBadge status={product.status} />
            ) : isNew ? (
              <span className="status-badge status-badge--new">Новинка</span>
            ) : null}
          </div>
        </div>
        <div className="product-card__body">
          <p className="product-card__brand">{product.brand}</p>
          <h3>{product.title}</h3>
          <dl className="product-card__meta">
            <div>
              <dt>Размер</dt>
              <dd>{product.size}</dd>
            </div>
            <div>
              <dt>Состояние</dt>
              <dd>{product.condition}</dd>
            </div>
          </dl>
          <p className="product-card__price">{formatPrice(product.price)}</p>
        </div>
      </Link>
      <button
        aria-label={
          favorite
            ? `Удалить ${product.title} из избранного`
            : `Добавить ${product.title} в избранное`
        }
        aria-pressed={favorite}
        className={`favorite-button ${favorite ? "is-active" : ""}`}
        onClick={() => onToggleFavorite(product.id)}
        type="button"
      >
        <Heart aria-hidden="true" fill={favorite ? "currentColor" : "none"} />
      </button>
    </article>
  );
}
