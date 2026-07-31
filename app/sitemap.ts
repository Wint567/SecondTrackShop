import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";
import { fetchPublicSitemapItems } from "@/services/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getSiteOrigin();
  const staticEntries: MetadataRoute.Sitemap = [
    { changeFrequency: "weekly", priority: 1, url: `${origin}/` },
    { changeFrequency: "daily", priority: 0.9, url: `${origin}/catalog` },
  ];

  try {
    const products = await fetchPublicSitemapItems();
    return [
      ...staticEntries,
      ...products.map((product) => ({
        changeFrequency: "weekly" as const,
        lastModified: product.createdAt,
        priority: 0.8,
        url: `${origin}/product/${encodeURIComponent(product.slug)}`,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
