"use client";

import {
  ExternalLink,
  Heart,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  ErrorState,
  LoadingState,
} from "@/components/ui/AsyncStates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFavorites } from "@/hooks/use-favorites";
import {
  useRelatedStoreItems,
  useStoreItem,
} from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import { formatPrice, isSafeExternalUrl } from "@/utils/format";

export function ProductPage({
  initialProduct,
  slug,
}: {
  initialProduct?: Product;
  slug: string;
}) {
  const { data: product, error, loading, retry } = useStoreItem(
    slug,
    initialProduct,
  );
  const related = useRelatedStoreItems(
    product?.category ?? "",
    product?.id ?? "",
  );
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (product) {
      document.title = `${product.title} — ${product.brand} — SECONDTRACK`;
    }
  }, [product]);

  if (loading) {
    return (
      <main id="main-content" className="product-page page-shell product-loading">
        <LoadingState count={2} />
      </main>
    );
  }

  if (error) {
    return (
      <main id="main-content" className="product-page page-shell">
        <ErrorState
          description="Попробуйте ещё раз или вернитесь в каталог. Избранное останется на месте."
          retry={retry}
          title="Не получилось загрузить товар"
        />
      </main>
    );
  }

  if (!product) {
    return (
      <main id="main-content" className="not-found page-shell">
        <p className="eyebrow">Товар не найден</p>
        <h1>Похоже, эта вещь уже ушла.</h1>
        <p>Вернитесь в каталог — там появились другие отобранные позиции.</p>
        <Link className="button button--primary" href="/catalog">
          Перейти в каталог
        </Link>
      </main>
    );
  }

  const isFavorite = favorites.has(product.id);
  const canOpenVinted =
    product.status === "Выставлено" && isSafeExternalUrl(product.vintedUrl);

  return (
    <main id="main-content" className="product-page page-shell">
      <nav aria-label="Хлебные крошки" className="breadcrumbs">
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link>
        <span>/</span>
        <span aria-current="page">{product.brand}</span>
      </nav>

      <div className="product-layout">
        <ProductGallery photos={product.photos} title={product.title} />

        <section className="product-info" aria-labelledby="product-title">
          <div className="product-info__top">
            <div>
              <p className="product-info__brand">{product.brand}</p>
              <h1 id="product-title">{product.title}</h1>
            </div>
            <button
              aria-label={
                isFavorite
                  ? "Удалить товар из избранного"
                  : "Добавить товар в избранное"
              }
              aria-pressed={isFavorite}
              className={`icon-button product-favorite ${
                isFavorite ? "is-active" : ""
              }`}
              onClick={() => toggleFavorite(product.id)}
              type="button"
            >
              <Heart
                aria-hidden="true"
                fill={isFavorite ? "currentColor" : "none"}
              />
            </button>
          </div>

          <p className="product-info__price">{formatPrice(product.price)}</p>
          <div className="product-info__availability">
            <StatusBadge status={product.status} />
            <span>Единственный экземпляр</span>
          </div>

          <dl className="product-specs">
            <div>
              <dt>Размер</dt>
              <dd>{product.size}</dd>
            </div>
            <div>
              <dt>Состояние</dt>
              <dd>{product.condition}</dd>
            </div>
            <div>
              <dt>Категория</dt>
              <dd>{product.category}</dd>
            </div>
          </dl>

          <p className="product-description">{product.description}</p>

          <div className="product-accordions">
            <details>
              <summary>Замеры и посадка</summary>
              <p>
                Точные замеры уточняйте на странице объявления Vinted. Размер
                указан по маркировке производителя.
              </p>
            </details>
            <details>
              <summary>Состояние вещи</summary>
              <p>
                Состояние: {product.condition}. Возможные следы времени
                отражены на фотографиях и в публичном описании.
              </p>
            </details>
            <details>
              <summary>Доставка и возврат</summary>
              <p>
                Условия доставки, оплаты и защиты покупателя определяются
                платформой Vinted для выбранного способа получения.
              </p>
            </details>
          </div>

          <div className="product-actions">
            {canOpenVinted && (
              <a
                className="button button--primary button--wide"
                href={product.vintedUrl as string}
                rel="noopener noreferrer"
                target="_blank"
              >
                Купить на Vinted <ExternalLink aria-hidden="true" />
              </a>
            )}
            {product.status === "Куплено" && (
              <div className="soon-panel">
                <StatusBadge status={product.status} />
                <p>Мы ещё готовим эту вещь к публикации на Vinted.</p>
              </div>
            )}
            {product.status === "Выставлено" && !canOpenVinted && (
              <p className="vinted-unavailable">
                Ссылка на объявление пока недоступна.
              </p>
            )}
            <button
              className="button button--outline button--wide"
              onClick={() => toggleFavorite(product.id)}
              type="button"
            >
              <Heart
                aria-hidden="true"
                fill={isFavorite ? "currentColor" : "none"}
              />
              {isFavorite ? "В избранном" : "В избранное"}
            </button>
          </div>

          <p className="purchase-note">
            <LockKeyhole aria-hidden="true" />
            Безопасная покупка и доставка через Vinted
          </p>
        </section>
      </div>

      <section className="related-section" aria-labelledby="related-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Продолжить просмотр</p>
            <h2 id="related-title">Вам также может понравиться</h2>
          </div>
          <Link
            className="text-link"
            href={`/catalog?category=${encodeURIComponent(product.category)}`}
          >
            Смотреть категорию
          </Link>
        </div>
        {related.loading ? (
          <LoadingState />
        ) : related.error ? (
          <ErrorState retry={related.retry} />
        ) : related.data.length > 0 ? (
          <ProductGrid products={related.data} />
        ) : (
          <p className="related-empty">
            В этой категории пока нет других опубликованных вещей.
          </p>
        )}
      </section>
    </main>
  );
}
