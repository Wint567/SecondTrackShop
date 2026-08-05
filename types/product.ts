export type ProductStatus = "Куплено" | "Выставлено" | string;

export type ProductPhoto = {
  id: string;
  itemId: string;
  url: string;
  order: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  condition: string;
  description: string;
  price: number | null;
  status: ProductStatus;
  vintedUrl: string | null;
  primaryPhotoId: string | null;
  createdAt: string;
  photos: ProductPhoto[];
};

export type CatalogFilters = {
  categories: string[];
  brands: string[];
  sizes: string[];
  conditions: string[];
  priceRanges: string[];
  statuses: string[];
};

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "name-asc";
