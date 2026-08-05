"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import { useBodyLock } from "@/hooks/use-body-lock";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useStoreItems } from "@/hooks/use-store-items";
import { formatArchivePrice } from "@/utils/format";

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { data: products, error, loading, retry } = useStoreItems(undefined, null, true);
  const [searchValue, setSearchValue] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useBodyLock(true);
  useDialogFocus({ dialogRef, initialFocusRef: inputRef, open: true });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const matches = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase();
    if (!query) return products;
    const tokens = query.split(/\s+/).filter(Boolean);
    return products.filter((product) => {
      const haystack = [product.title, product.brand, product.category, product.description]
        .join(" ")
        .toLocaleLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [products, searchValue]);
  const displayed = matches.slice(0, 4);
  const suggestions = useMemo(
    () =>
      [
        ...new Set(
          products.flatMap((product) => [product.brand, product.category]).filter(Boolean),
        ),
      ].slice(0, 4),
    [products],
  );

  const openCatalog = () => {
    const query = searchValue.trim();
    onClose();
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openCatalog();
  };

  return (
    <div className="overlay club-overlay club-overlay--search" onMouseDown={onClose}>
      <section
        aria-label="Search the archive"
        aria-modal="true"
        className="search-panel"
        id="catalog-search"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <div className="search-panel__brand">
          <span>SECONDTRACK</span>
          <em>CUT-PASTE CLUB</em>
        </div>
        <button
          aria-label="Close search"
          className="search-panel__close"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" />
          <span>Close</span>
        </button>
        <header>
          <h2>
            SEARCH <i>/</i> THE ARCHIVE
          </h2>
          <p>
            Type what
            <br />
            you remember
          </p>
        </header>
        <form onSubmit={submitSearch} role="search">
          <label className="sr-only" htmlFor="header-search">
            Name, brand or category
          </label>
          <input
            autoComplete="off"
            id="header-search"
            name="search"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Try a brand, item or category"
            ref={inputRef}
            type="search"
            value={searchValue}
          />
          <button aria-label="Search catalog" type="submit">
            <ArrowRight aria-hidden="true" />
          </button>
        </form>
        <div className="search-panel__content">
          <aside>
            <h3>Search suggestions</h3>
            {suggestions.map((term) => (
              <button key={term} onClick={() => setSearchValue(term)} type="button">
                {term}
                <span aria-hidden="true">*</span>
              </button>
            ))}
          </aside>
          <div className="search-panel__results">
            <h3>
              {loading
                ? "Searching..."
                : `Showing ${displayed.length} of ${matches.length}${searchValue ? ` for ${searchValue}` : ""}`}
            </h3>
            {error ? (
              <div className="search-panel__state" role="alert">
                <p>The archive could not be reached.</p>
                <button onClick={retry} type="button">
                  Try again
                </button>
              </div>
            ) : displayed.length === 0 && !loading ? (
              <p className="search-panel__state">No published objects match this search.</p>
            ) : (
              <div>
                {displayed.map((product) => (
                  <Link
                    href={`/product/${encodeURIComponent(product.slug)}`}
                    key={product.id}
                    onClick={onClose}
                  >
                    <ProductImage
                      alt={`${product.brand}, ${product.title}`}
                      sizes="(max-width: 767px) 45vw, 220px"
                      src={product.photos[0]?.url}
                    />
                    <span>
                      {product.brand} {product.title}
                    </span>
                    <b>{product.size}</b>
                    <strong>{formatArchivePrice(product.price)}</strong>
                  </Link>
                ))}
              </div>
            )}
            {!loading && matches.length > displayed.length && (
              <button className="search-panel__all" onClick={openCatalog} type="button">
                View all {matches.length} results <ArrowRight aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
