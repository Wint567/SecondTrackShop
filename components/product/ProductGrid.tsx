"use client";

import { useFavorites } from "@/hooks/use-favorites";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: Product[];
  priorityCount?: number;
}) {
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          accent={index % 4}
          archiveIndex={index}
          favorite={favorites.has(product.id)}
          key={product.id}
          onToggleFavorite={toggleFavorite}
          priority={index < priorityCount}
          product={product}
        />
      ))}
    </div>
  );
}
