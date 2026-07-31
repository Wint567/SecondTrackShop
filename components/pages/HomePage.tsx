"use client";

import { ArrowRight, PackageCheck, Recycle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/AsyncStates";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useStoreItems } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";

export function HomePage({
  initialError,
  initialProducts,
}: {
  initialError: boolean;
  initialProducts: Product[];
}) {
  const { data: products, error, loading, retry } = useStoreItems(
    initialProducts,
    initialError,
  );
  const newArrivals = products.slice(0, 4);

  const categories = products.reduce<
    Array<{ name: string; photo: string | null }>
  >((result, product) => {
    if (result.some((entry) => entry.name === product.category)) return result;
    result.push({
      name: product.category,
      photo: product.photos[0]?.url ?? null,
    });
    return result;
  }, []);

  return (
    <main id="main-content">
      <section className="hero">
        <Image
          alt="Редакционная съёмка SECONDTRACK"
          className="hero__image"
          height="1024"
          priority
          sizes="100vw"
          src="/images/secondtrack-hero.webp"
          width="1536"
        />
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__content page-shell">
          <p className="eyebrow eyebrow--light">New edit</p>
          <h1>
            Вещи с историей.
            <br />
            Стиль без срока.
          </h1>
          <p>
            Отобранный винтаж и оригинальные бренды
            <br className="desktop-only" /> в единственном экземпляре.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/catalog?sort=newest">
              Смотреть новинки
            </Link>
            <Link className="button button--ghost" href="/catalog?status=Куплено">
              Скоро в продаже
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section page-shell" aria-labelledby="categories-heading">
        <div className="section-heading section-heading--compact">
          <h2 id="categories-heading">Категории</h2>
          <Link className="text-link" href="/catalog">
            Смотреть всё <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <div className="category-grid category-grid--loading">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="skeleton skeleton--category" key={index} />
            ))}
          </div>
        ) : (
          <div className="category-grid">
            {categories.slice(0, 5).map((category) => (
              <Link
                className="category-card"
                href={`/catalog?category=${encodeURIComponent(category.name)}`}
                key={category.name}
              >
                <ProductImage
                  alt={`Категория ${category.name}`}
                  src={category.photo}
                />
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="home-section page-shell" aria-labelledby="new-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Недавно добавлено</p>
            <h2 id="new-heading">Новые поступления</h2>
          </div>
          <Link className="text-link" href="/catalog?sort=newest">
            Смотреть всё <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState retry={retry} />
        ) : newArrivals.length > 0 ? (
          <ProductGrid products={newArrivals} priorityCount={2} />
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="concept-section" id="concept">
        <div className="page-shell concept-grid">
          <div className="concept-copy">
            <p className="eyebrow">Манифест SECONDTRACK</p>
            <h2>Хорошая вещь не заканчивается первым владельцем.</h2>
          </div>
          <p className="concept-lead">
            Мы выбираем одежду за материал, крой и характер — без гонки за
            трендами. Каждую позицию рассматриваем отдельно и честно описываем
            её состояние.
          </p>
        </div>
        <div className="page-shell benefits" id="delivery">
          <article>
            <Recycle aria-hidden="true" />
            <h3>Второй трек</h3>
            <p>Продлеваем жизнь качественным вещам и уменьшаем лишнее потребление.</p>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" />
            <h3>Честное состояние</h3>
            <p>Показываем детали и не скрываем следы времени, если они есть.</p>
          </article>
          <article>
            <PackageCheck aria-hidden="true" />
            <h3>Покупка через Vinted</h3>
            <p>Оплата, защита покупателя и доставка проходят на платформе Vinted.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
