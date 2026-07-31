"use client";

import { useMemo, useState } from "react";

type ProductImageProps = {
  alt: string;
  className?: string;
  eager?: boolean;
  src?: string | null;
};

const getSpritePosition = (index: number, columns: number, rows: number) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns === 1 ? 0 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 0 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
};

export function ProductImage({
  alt,
  className = "",
  eager = false,
  src,
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const sprite = useMemo(() => {
    if (!src?.includes("#")) return null;
    const [imageUrl, rawIndex] = src.split("#");
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0) return null;

    const isGallery = imageUrl.includes("field-jacket-gallery");
    const columns = isGallery ? 2 : 3;
    const rows = 2;

    return {
      imageUrl,
      position: getSpritePosition(index, columns, rows),
      size: `${columns * 100}% ${rows * 100}%`,
    };
  }, [src]);

  if (!src || failedSrc === src) {
    return (
      <div
        aria-label={`${alt}. Фотография пока недоступна`}
        className={`image-placeholder ${className}`}
        role="img"
      >
        <span aria-hidden="true">S / T</span>
        <small>Фото готовится</small>
      </div>
    );
  }

  if (sprite) {
    return (
      <div
        aria-label={alt}
        className={`sprite-image ${className}`}
        role="img"
        style={{
          backgroundImage: `url("${sprite.imageUrl}")`,
          backgroundPosition: sprite.position,
          backgroundSize: sprite.size,
        }}
      />
    );
  }

  return (
    // Remote Supabase images are intentionally rendered without a domain allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={`product-image ${className}`}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailedSrc(src)}
      src={src}
    />
  );
}
