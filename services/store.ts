import { supabase } from "@/lib/supabase/client";
import type { Product, ProductPhoto } from "@/types/product";
import { parsePublicPrice } from "@/utils/format";
import { selectProductPhotos } from "@/utils/photos";
import { createAbortError, isAbortError } from "@/utils/request";

const PUBLIC_ITEM_FIELDS = [
  "id",
  "slug",
  "title",
  "brand",
  "category",
  "size",
  "condition",
  "public_description",
  "planned_sale_price",
  "status",
  "vinted_url",
  "primary_photo_id",
  "created_at",
].join(",");

type PublicStoreRow = {
  id: string;
  slug: string | null;
  title: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  condition: string | null;
  public_description: string | null;
  planned_sale_price: number | string | null;
  status: string | null;
  vinted_url: string | null;
  primary_photo_id: string | null;
  created_at: string | null;
};

type PhotoRow = Record<string, unknown> & {
  id?: string;
  item_id?: string;
  image_url?: string;
  created_at?: string;
};

type SupabaseErrorLike = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
};

const safeRequestError = (cause: unknown) => {
  const source = cause && typeof cause === "object" ? (cause as SupabaseErrorLike) : {};
  const safeText = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;
  const safeStatus = typeof source.status === "number" ? source.status : undefined;

  return {
    code: safeText(source.code),
    details: safeText(source.details),
    hint: safeText(source.hint),
    message:
      safeText(source.message) ?? (cause instanceof Error ? cause.message : "Request failed."),
    name: safeText(source.name) ?? (cause instanceof Error ? cause.name : "SupabaseRequestError"),
    status: safeStatus,
  };
};

export class StoreDataError extends Error {
  public readonly area: "items" | "photos";

  constructor(area: "items" | "photos", cause?: unknown) {
    super("The shop data could not be loaded.", { cause });
    this.name = "StoreDataError";
    this.area = area;

    const diagnostic = safeRequestError(cause);
    console.error(
      `[SECONDTRACK] public ${area} request failed.`,
      process.env.NODE_ENV === "development"
        ? diagnostic
        : {
            code: diagnostic.code,
            message: diagnostic.message,
            name: diagnostic.name,
            status: diagnostic.status,
          },
    );
  }
}

const throwRequestError = (
  area: "items" | "photos",
  cause: unknown,
  signal?: AbortSignal,
): never => {
  if (signal?.aborted || isAbortError(cause)) throw createAbortError();
  throw new StoreDataError(area, cause);
};

const textValue = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolvePhotoUrl = (row: PhotoRow): string | null => {
  const imageUrl = typeof row.image_url === "string" ? row.image_url.trim() : "";
  if (!imageUrl) return null;
  if (isAbsoluteUrl(imageUrl)) return imageUrl;
  if (!supabase) return null;

  const publicStorageMarker = "/storage/v1/object/public/item-photos/";
  const markerIndex = imageUrl.indexOf(publicStorageMarker);
  const storagePath =
    markerIndex >= 0
      ? imageUrl.slice(markerIndex + publicStorageMarker.length)
      : imageUrl.replace(/^\/+/, "").replace(/^item-photos\//, "");

  return supabase.storage.from("item-photos").getPublicUrl(storagePath).data.publicUrl;
};

const normalizePhotos = (rows: PhotoRow[]): ProductPhoto[] => {
  const seen = new Set<string>();

  return rows.flatMap((row, index) => {
    const itemId = textValue(row.item_id, "");
    const url = resolvePhotoUrl(row);
    if (!itemId || !url) return [];

    const id = textValue(row.id, `${itemId}-${index}`);
    const duplicateKey = `${itemId}:${url}`;
    if (seen.has(duplicateKey)) return [];
    seen.add(duplicateKey);

    const createdAt = Date.parse(textValue(row.created_at, ""));
    const order = Number.isFinite(createdAt) ? createdAt : index;

    return [
      {
        id,
        itemId,
        url,
        order,
      },
    ];
  });
};

const normalizeProduct = (row: PublicStoreRow, allPhotos: ProductPhoto[]): Product => {
  const itemPhotos = selectProductPhotos(allPhotos, row.id, row.primary_photo_id);

  return {
    id: row.id,
    slug: textValue(row.slug, row.id),
    title: textValue(row.title, "Untitled item"),
    brand: textValue(row.brand, "Unbranded"),
    category: textValue(row.category, "Other"),
    size: textValue(row.size, "Not specified"),
    condition: textValue(row.condition, "Not specified"),
    description: textValue(row.public_description, "More details are coming soon."),
    price: parsePublicPrice(row.planned_sale_price),
    status: textValue(row.status, "Status unavailable"),
    vintedUrl: textValue(row.vinted_url, "") || null,
    primaryPhotoId: row.primary_photo_id,
    createdAt: textValue(row.created_at, new Date(0).toISOString()),
    photos: itemPhotos,
  };
};

async function fetchPhotosByItemIds(itemIds: string[], signal?: AbortSignal) {
  if (!supabase || itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("item_photos")
    .select("id,item_id,image_url,created_at")
    .in("item_id", itemIds)
    .order("created_at", { ascending: true })
    .abortSignal(signal ?? new AbortController().signal);

  if (error) throwRequestError("photos", error, signal);
  return normalizePhotos((data ?? []) as PhotoRow[]);
}

const requirePublicClient = () => {
  if (!supabase) {
    throw new StoreDataError("items", new Error("Public Supabase configuration is unavailable."));
  }

  return supabase;
};

export async function fetchPublicSitemapItems(): Promise<
  Array<{ createdAt: string; slug: string }>
> {
  const publicClient = requirePublicClient();

  const { data, error } = await publicClient
    .from("public_store_items")
    .select("slug,created_at")
    .order("created_at", { ascending: false });

  if (error) throwRequestError("items", error);
  return (data ?? []).flatMap((row) => {
    const slug = textValue(row.slug, "");
    if (!slug) return [];
    return [
      {
        createdAt: textValue(row.created_at, new Date(0).toISOString()),
        slug,
      },
    ];
  });
}

export async function fetchPublicItems(signal?: AbortSignal): Promise<Product[]> {
  const publicClient = requirePublicClient();

  const { data, error } = await publicClient
    .from("public_store_items")
    .select(PUBLIC_ITEM_FIELDS)
    .order("created_at", { ascending: false })
    .abortSignal(signal ?? new AbortController().signal);

  if (error) throwRequestError("items", error, signal);

  const rows = (data ?? []) as unknown as PublicStoreRow[];
  const photos = await fetchPhotosByItemIds(
    rows.map((row) => row.id),
    signal,
  );
  const products = rows.map((row) => normalizeProduct(row, photos));

  if (process.env.NODE_ENV === "development") {
    console.info("[SECONDTRACK] public store response.", {
      itemIds: products.slice(0, 3).map((product) => product.id),
      items: products.length,
      photos: photos.length,
      productsWithPhotos: products.filter((product) => product.photos.length > 0).length,
    });
  }

  return products;
}

export async function fetchPublicItemBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Product | null> {
  const publicClient = requirePublicClient();

  const { data, error } = await publicClient
    .from("public_store_items")
    .select(PUBLIC_ITEM_FIELDS)
    .eq("slug", slug)
    .abortSignal(signal ?? new AbortController().signal)
    .maybeSingle();

  if (error) throwRequestError("items", error, signal);
  if (!data) return null;

  const row = data as unknown as PublicStoreRow;
  const photos = await fetchPhotosByItemIds([row.id], signal);
  return normalizeProduct(row, photos);
}

export async function fetchRelatedPublicItems(
  category: string,
  excludedId: string,
  signal?: AbortSignal,
): Promise<Product[]> {
  if (!category) return [];
  const publicClient = requirePublicClient();

  const { data, error } = await publicClient
    .from("public_store_items")
    .select(PUBLIC_ITEM_FIELDS)
    .eq("category", category)
    .neq("id", excludedId)
    .order("created_at", { ascending: false })
    .abortSignal(signal ?? new AbortController().signal)
    .limit(4);

  if (error) throwRequestError("items", error, signal);

  const rows = (data ?? []) as unknown as PublicStoreRow[];
  const photos = await fetchPhotosByItemIds(
    rows.map((row) => row.id),
    signal,
  );
  return rows.map((row) => normalizeProduct(row, photos));
}
