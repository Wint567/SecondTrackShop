"use client";

import { useState } from "react";
import { getResponsiveImageCandidates } from "@/utils/images";

type ProductImageProps = {
  alt: string;
  className?: string;
  decorative?: boolean;
  eager?: boolean;
  sizes?: string;
  src?: string | null;
};

export function ProductImage({
  alt,
  className = "",
  decorative = false,
  eager = false,
  sizes = "100vw",
  src,
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [unoptimizedSrc, setUnoptimizedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        aria-hidden={decorative || !alt ? true : undefined}
        aria-label={decorative || !alt ? undefined : `${alt}. Photo unavailable`}
        className={`image-placeholder ${className}`}
        role={decorative || !alt ? undefined : "img"}
      >
        <span aria-hidden="true">S / T</span>
        <small>Photo unavailable</small>
      </div>
    );
  }

  const candidates = unoptimizedSrc === src ? [] : getResponsiveImageCandidates(src);
  const srcSet = candidates.join(", ") || undefined;

  return (
    // Supabase Storage transformation support is verified by the public render endpoint.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      className={`product-image ${className}`}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      height={1280}
      loading={eager ? "eager" : "lazy"}
      onError={() => {
        if (srcSet) setUnoptimizedSrc(src);
        else setFailedSrc(src);
      }}
      sizes={srcSet ? sizes : undefined}
      src={src}
      srcSet={srcSet}
      width={960}
    />
  );
}
