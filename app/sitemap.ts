import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";
import { fetchPublicSitemapItems } from "@/services/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const staticEntries: MetadataRoute.Sitemap = [
    { changeFrequency: "weekly", priority: 1, url: `${origin}/` },
    { changeFrequency: "daily", priority: 0.9, url: `${origin}/catalog` },
    { changeFrequency: "daily", priority: 0.8, url: `${origin}/new-drop` },
    { changeFrequency: "weekly", priority: 0.7, url: `${origin}/brands` },
    { changeFrequency: "monthly", priority: 0.6, url: `${origin}/about` },
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
