"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import type { ProductPhoto } from "@/types/product";

export function ProductGallery({
  photos,
  title,
}: {
  photos: ProductPhoto[];
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safePhotos =
    photos.length > 0
      ? photos
      : [{ id: "placeholder", itemId: "placeholder", order: 0, url: "" }];

  const show = (index: number) => {
    const next = (index + safePhotos.length) % safePhotos.length;
    setSelectedIndex(next);
  };

  return (
    <section className="product-gallery" aria-label="Фотографии товара">
      <div className="product-gallery__thumbs" aria-label="Миниатюры">
        {safePhotos.map((photo, index) => (
          <button
            aria-label={`Показать фото ${index + 1}`}
            aria-pressed={selectedIndex === index}
            className={selectedIndex === index ? "is-active" : ""}
            key={photo.id}
            onClick={() => show(index)}
            type="button"
          >
            <ProductImage
              alt={`${title}, фото ${index + 1}`}
              src={photo.url}
            />
          </button>
        ))}
      </div>
      <div className="product-gallery__main">
        <ProductImage
          alt={`${title}, фото ${selectedIndex + 1}`}
          eager
          src={safePhotos[selectedIndex]?.url}
        />
      </div>
      <div className="product-gallery__controls">
        <button
          aria-label="Предыдущее фото"
          className="icon-button"
          disabled={safePhotos.length < 2}
          onClick={() => show(selectedIndex - 1)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <span>
          {selectedIndex + 1} / {safePhotos.length}
        </span>
        <button
          aria-label="Следующее фото"
          className="icon-button"
          disabled={safePhotos.length < 2}
          onClick={() => show(selectedIndex + 1)}
          type="button"
        >
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
