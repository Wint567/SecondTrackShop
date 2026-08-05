import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CableBackdrop } from "@/components/experience/CableBackdrop";
import { HomeDrop } from "@/components/pages/HomeDrop";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Product } from "@/types/product";
import { formatArchivePrice } from "@/utils/format";
import type { StoreErrorInfo } from "@/utils/store-state";

export function HomePage({
  initialError,
  initialProducts,
}: {
  initialError: StoreErrorInfo | null;
  initialProducts: Product[];
}) {
  const heroProduct = initialProducts[0];

  return (
    <main id="main-content" className="cutpaste-sheet cutpaste-home">
      <section className="club-hero" aria-labelledby="hero-title">
        <CableBackdrop className="club-hero__cable" />
        <div className="paper-slot paper-slot--hero" aria-hidden="true" />
        <div className="club-hero__copy">
          <h1 id="hero-title">
            <span>SECOND</span>
            <span>
              <i>TR</i>ACK
            </span>
          </h1>
          <p className="marker-note club-hero__club">CUT–PASTE CLUB</p>
          <div className="club-hero__intro">
            <ArrowRight aria-hidden="true" />
            <strong>
              FOUND ITEMS.
              <br />
              WORN AGAIN.
            </strong>
            <small>
              Curated second-hand clothing. Handpicked, checked and ready to wear. Every piece has a
              past.
            </small>
          </div>
        </div>

        <div className="club-hero__product">
          <Link
            href={heroProduct ? `/product/${encodeURIComponent(heroProduct.slug)}` : "/catalog"}
          >
            <ProductImage
              alt={
                heroProduct
                  ? `${heroProduct.brand}, ${heroProduct.title}`
                  : "Curated SECONDTRACK item"
              }
              eager
              sizes="(max-width: 767px) 82vw, 38vw"
              src={heroProduct?.photos[0]?.url}
            />
          </Link>
          <span className="lime-sticker">
            WORN
            <br />
            AGAIN
          </span>
        </div>

        <div className="club-hero__offer">
          <span>ARCHIVE {String(initialProducts.length).padStart(3, "0")}</span>
          <strong>{formatArchivePrice(heroProduct?.price ?? null)}</strong>
          <p>
            {heroProduct
              ? `${heroProduct.brand} “${heroProduct.title}”`
              : "One-of-one archive object"}
          </p>
          <Link className="club-button" href="/new-drop">
            Shop the drop <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <HomeDrop initialError={initialError} initialProducts={initialProducts} />
    </main>
  );
}
