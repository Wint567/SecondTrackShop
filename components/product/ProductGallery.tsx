"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { KeyboardEvent, TouchEvent, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import { useBodyLock } from "@/hooks/use-body-lock";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import type { ProductPhoto } from "@/types/product";

export function ProductGallery({ photos, title }: { photos: ProductPhoto[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const safePhotos =
    photos.length > 0 ? photos : [{ id: "placeholder", itemId: "placeholder", order: 0, url: "" }];

  useBodyLock(zoomOpen);
  useDialogFocus({ dialogRef, initialFocusRef: closeRef, open: zoomOpen });

  useEffect(() => {
    if (!zoomOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomOpen]);

  const show = (index: number) => {
    const next = (index + safePhotos.length) % safePhotos.length;
    setSelectedIndex(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(selectedIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(selectedIndex + 1);
    }
  };

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const distance =
      (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 45) return;
    show(distance > 0 ? selectedIndex - 1 : selectedIndex + 1);
  };

  return (
    <section
      aria-label="Product photos. Use left and right arrow keys to change image."
      className="product-gallery"
      onKeyDown={onKeyDown}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
      tabIndex={0}
    >
      <div className="product-gallery__thumbs" aria-label="Photo thumbnails">
        {safePhotos.map((photo, index) => (
          <button
            aria-label={`Show photo ${index + 1}`}
            aria-pressed={selectedIndex === index}
            className={selectedIndex === index ? "is-active" : ""}
            key={photo.id}
            onClick={() => show(index)}
            type="button"
          >
            <ProductImage alt="" decorative sizes="88px" src={photo.url} />
          </button>
        ))}
      </div>
      <div className="product-gallery__main">
        <button
          aria-label={`Enlarge ${title}, photo ${selectedIndex + 1}`}
          className="product-gallery__zoom-trigger"
          disabled={!safePhotos[selectedIndex]?.url}
          onClick={() => setZoomOpen(true)}
          type="button"
        >
          <ProductImage
            alt={`${title}, photo ${selectedIndex + 1}`}
            eager
            sizes="(max-width: 767px) 92vw, 48vw"
            src={safePhotos[selectedIndex]?.url}
          />
        </button>
      </div>
      <div className="product-gallery__controls">
        <button
          aria-label="Previous photo"
          className="icon-button"
          disabled={safePhotos.length < 2}
          onClick={() => show(selectedIndex - 1)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <span aria-live="polite">
          {selectedIndex + 1} / {safePhotos.length}
        </span>
        <button
          aria-label="Next photo"
          className="icon-button"
          disabled={safePhotos.length < 2}
          onClick={() => show(selectedIndex + 1)}
          type="button"
        >
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      {zoomOpen && (
        <div className="overlay product-lightbox" onMouseDown={() => setZoomOpen(false)}>
          <section
            aria-label={`${title} enlarged photo`}
            aria-modal="true"
            className="product-lightbox__dialog"
            onMouseDown={(event) => event.stopPropagation()}
            ref={dialogRef}
            role="dialog"
          >
            <button
              aria-label="Close enlarged photo"
              className="product-lightbox__close"
              onClick={() => setZoomOpen(false)}
              ref={closeRef}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
            <ProductImage
              alt={`${title}, photo ${selectedIndex + 1}`}
              eager
              sizes="96vw"
              src={safePhotos[selectedIndex]?.url}
            />
            {safePhotos.length > 1 && (
              <div className="product-lightbox__controls">
                <button
                  aria-label="Previous photo"
                  onClick={() => show(selectedIndex - 1)}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" />
                </button>
                <span aria-live="polite">
                  {selectedIndex + 1} / {safePhotos.length}
                </span>
                <button
                  aria-label="Next photo"
                  onClick={() => show(selectedIndex + 1)}
                  type="button"
                >
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
