"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CableBackdrop } from "@/components/experience/CableBackdrop";
import { ErrorState, LoadingState } from "@/components/ui/AsyncStates";
import { ProductImage } from "@/components/ui/ProductImage";
import { useStoreItems } from "@/hooks/use-store-items";
import type { Product } from "@/types/product";
import type { StoreErrorInfo } from "@/utils/store-state";

export function AboutPage({
  initialError,
  initialProducts,
}: {
  initialError: StoreErrorInfo | null;
  initialProducts: Product[];
}) {
  const { data: products, error, loading, retry } = useStoreItems(initialProducts, initialError);
  const photos = products
    .flatMap((product) =>
      product.photos[0]
        ? [{ ...product.photos[0], label: `${product.brand}, ${product.title}` }]
        : [],
    )
    .slice(0, 3);

  if (loading)
    return (
      <main id="main-content" className="cutpaste-sheet about-page about-page--state">
        <LoadingState count={3} />
      </main>
    );
  if (error)
    return (
      <main id="main-content" className="cutpaste-sheet about-page about-page--state">
        <ErrorState
          description="The story is here, but its live archive photos are temporarily unavailable."
          retry={retry}
          title="We couldn't load the archive."
        />
      </main>
    );

  return (
    <main id="main-content" className="cutpaste-sheet about-page">
      <section className="about-collage">
        <CableBackdrop />
        <header className="about-collage__title">
          <h1>
            SECOND
            <br />
            LIFE
          </h1>
          <p>NOT A TREND - A HABIT</p>
        </header>
        <div className="about-card about-card--why">
          <h2>Why SECONDTRACK</h2>
          <p>We started SECONDTRACK because vintage means more when it lives on.</p>
          <p>
            Too much good clothing gets lost, ignored, or buried in closets. We see it differently -
            every piece has a past, and it has more to give.
          </p>
        </div>
        <div className="about-card about-card--found">
          <h2>
            FOUND / CHECKED /<br />
            WORN AGAIN
          </h2>
          <p>We dig for the real ones. Every piece is handpicked, not pulled from a pile.</p>
          <p>
            We check the quality and details, then it is cleaned, tagged, and ready for its next
            chapter.
          </p>
        </div>
        <div className="about-card about-card--next">
          <h2>The next track</h2>
          <p>We are not chasing hype. We are building a collection we would wear ourselves.</p>
          <p>No boring drops. Just timeless pieces with real character.</p>
        </div>
        {photos.map((photo, index) => (
          <figure className={`about-photo about-photo--${index + 1}`} key={photo.id}>
            <ProductImage
              alt={photo.label}
              eager={index === 0}
              sizes="(max-width: 767px) 55vw, 24vw"
              src={photo.url}
            />
          </figure>
        ))}
        <div className="about-slot" aria-hidden="true" />
      </section>
      <section className="about-stats">
        <div>
          <strong>100%</strong>
          <em>HANDPICKED</em>
        </div>
        <div>
          <strong>ONE PIECE /</strong>
          <em>ONE STORY</em>
        </div>
        <div>
          <strong>ZERO</strong>
          <em>BORING DROPS</em>
        </div>
      </section>
      <Link className="club-button about-cta" href="/catalog">
        Shop the archive <ArrowRight aria-hidden="true" />
      </Link>
    </main>
  );
}
