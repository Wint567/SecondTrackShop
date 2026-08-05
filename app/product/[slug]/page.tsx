import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductPage } from "@/components/pages/ProductPage";
import { getSiteOrigin } from "@/lib/site-url";
import { fetchPublicItemBySlug, fetchRelatedPublicItems } from "@/services/store";
import type { Product } from "@/types/product";
import { isSafeExternalUrl } from "@/utils/format";
import { getPublicStatus } from "@/utils/status";

type ProductRouteProps = { params: Promise<{ slug: string }> };
const getProduct = cache((slug: string) => fetchPublicItemBySlug(slug));
export const revalidate = 300;

function ProductStructuredData({ product }: { product: Product }) {
  const canOpenVinted = isSafeExternalUrl(product.vintedUrl);
  const availability =
    getPublicStatus(product.status).kind === "available"
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";
  const productUrl = `${getSiteOrigin()}/product/${encodeURIComponent(product.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        brand: { "@type": "Brand", name: product.brand },
        description: product.description,
        image: product.photos.map((photo) => photo.url),
        name: product.title,
        offers:
          product.price !== null && canOpenVinted
            ? {
                "@type": "Offer",
                availability,
                price: product.price,
                priceCurrency: "PLN",
                url: product.vintedUrl,
              }
            : undefined,
        sku: product.id,
        url: productUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            item: `${getSiteOrigin()}/catalog`,
            name: "Shop",
            position: 1,
          },
          {
            "@type": "ListItem",
            item: productUrl,
            name: `${product.brand} ${product.title}`,
            position: 2,
          },
        ],
      },
    ],
  };

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    /* malformed slugs become a safe missing-item title */
  }
  const readableSlug = decodedSlug
    .replace(/-/g, " ")
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());

  try {
    const product = await getProduct(slug);
    if (product) {
      const image = product.photos[0]?.url;
      const title = `${product.title} — ${product.brand}`;
      return {
        alternates: { canonical: `/product/${encodeURIComponent(product.slug)}` },
        description: product.description,
        openGraph: {
          description: product.description,
          images: image ? [{ alt: `${product.brand}, ${product.title}`, url: image }] : undefined,
          title,
          type: "website",
        },
        title,
        twitter: {
          card: "summary_large_image",
          description: product.description,
          images: image ? [image] : undefined,
          title,
        },
      };
    }
  } catch {
    /* the client route exposes a retry state */
  }

  return {
    description: `${readableSlug} in the curated SECONDTRACK shop.`,
    robots: { follow: false, index: false },
    title: readableSlug,
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  let product: Product | null = null;
  let loadFailed = false;
  try {
    product = await getProduct(slug);
  } catch {
    loadFailed = true;
  }
  if (!loadFailed && !product) notFound();
  if (!product) return <ProductPage slug={slug} />;

  let related: Product[] = [];
  let relatedLoadFailed = false;
  try {
    related = await fetchRelatedPublicItems(product.category, product.id);
  } catch {
    relatedLoadFailed = true;
  }

  return (
    <>
      <ProductStructuredData product={product} />
      <ProductPage
        initialProduct={product}
        initialRelated={related}
        relatedLoadFailed={relatedLoadFailed}
        slug={slug}
      />
    </>
  );
}
