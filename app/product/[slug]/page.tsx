import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductPage } from "@/components/pages/ProductPage";
import { fetchPublicItemBySlug } from "@/services/store";
import type { Product } from "@/types/product";

type ProductRouteProps = {
  params: Promise<{ slug: string }>;
};

const getProduct = cache(fetchPublicItemBySlug);

export async function generateMetadata({
  params,
}: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    // Malformed percent-encoding is treated as an ordinary missing slug.
  }
  const readableSlug = decodedSlug
    .replace(/-/g, " ")
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());

  try {
    const product = await getProduct(slug);
    if (product) {
      return {
        alternates: {
          canonical: `/product/${encodeURIComponent(product.slug)}`,
        },
        title: `${product.title} — ${product.brand}`,
        description: product.description,
      };
    }
  } catch {
    // The client page exposes a retry state if the public source is unavailable.
  }

  return {
    title: readableSlug,
    description: `Карточка товара ${readableSlug} в каталоге SECONDTRACK.`,
    robots: { follow: false, index: false },
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
  return <ProductPage initialProduct={product ?? undefined} slug={slug} />;
}
