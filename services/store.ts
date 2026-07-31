import { supabase } from "@/lib/supabase/client";
import type { Product, ProductPhoto } from "@/types/product";
import { parsePublicPrice } from "@/utils/format";
import { selectProductPhotos } from "@/utils/photos";

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

export class StoreDataError extends Error {
  public readonly area: "items" | "photos";

  constructor(area: "items" | "photos", cause?: unknown) {
    super("Не удалось загрузить данные магазина.");
    this.name = "StoreDataError";
    this.area = area;

    if (import.meta.env.DEV) {
      console.error(`[SECONDTRACK] Ошибка загрузки ${area}:`, cause);
    }
  }
}

const textValue = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolvePhotoUrl = (row: PhotoRow): string | null => {
  const imageUrl =
    typeof row.image_url === "string" ? row.image_url.trim() : "";
  if (!imageUrl) return null;
  if (isAbsoluteUrl(imageUrl)) return imageUrl;
  if (!supabase) return null;

  const publicStorageMarker = "/storage/v1/object/public/item-photos/";
  const markerIndex = imageUrl.indexOf(publicStorageMarker);
  const storagePath =
    markerIndex >= 0
      ? imageUrl.slice(markerIndex + publicStorageMarker.length)
      : imageUrl.replace(/^\/+/, "").replace(/^item-photos\//, "");

  return supabase.storage
    .from("item-photos")
    .getPublicUrl(storagePath).data.publicUrl;
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

const normalizeProduct = (
  row: PublicStoreRow,
  allPhotos: ProductPhoto[],
): Product => {
  const itemPhotos = selectProductPhotos(
    allPhotos,
    row.id,
    row.primary_photo_id,
  );

  return {
    id: row.id,
    slug: textValue(row.slug, row.id),
    title: textValue(row.title, "Вещь без названия"),
    brand: textValue(row.brand, "Без бренда"),
    category: textValue(row.category, "Другое"),
    size: textValue(row.size, "Не указан"),
    condition: textValue(row.condition, "Не указано"),
    description: textValue(
      row.public_description,
      "Описание появится в ближайшее время.",
    ),
    price: parsePublicPrice(row.planned_sale_price),
    status: textValue(row.status, "Статус не указан"),
    vintedUrl: textValue(row.vinted_url, "") || null,
    primaryPhotoId: row.primary_photo_id,
    createdAt: textValue(row.created_at, new Date(0).toISOString()),
    photos: itemPhotos,
  };
};

async function fetchPhotosByItemIds(itemIds: string[]) {
  if (!supabase || itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("item_photos")
    .select("id,item_id,image_url,created_at")
    .in("item_id", itemIds)
    .order("created_at", { ascending: true });

  if (error) throw new StoreDataError("photos", error);
  return normalizePhotos((data ?? []) as PhotoRow[]);
}

const requirePublicClient = () => {
  if (!supabase) {
    throw new StoreDataError(
      "items",
      new Error("Public Supabase configuration is unavailable."),
    );
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

  if (error) throw new StoreDataError("items", error);
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

export async function fetchPublicItems(): Promise<Product[]> {
  const publicClient = requirePublicClient();

  const { data, error } = await publicClient
    .from("public_store_items")
    .select(PUBLIC_ITEM_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw new StoreDataError("items", error);

  const rows = (data ?? []) as unknown as PublicStoreRow[];
  const photos = await fetchPhotosByItemIds(rows.map((row) => row.id));
  return rows.map((row) => normalizeProduct(row, photos));
}

export async function fetchPublicItemBySlug(
  slug: string,
): Promise<Product | null> {
  const publicClient = requirePublicClient();

  const { data, error } = await publicClient
    .from("public_store_items")
    .select(PUBLIC_ITEM_FIELDS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new StoreDataError("items", error);
  if (!data) return null;

  const row = data as unknown as PublicStoreRow;
  const photos = await fetchPhotosByItemIds([row.id]);
  return normalizeProduct(row, photos);
}

export async function fetchRelatedPublicItems(
  category: string,
  excludedId: string,
): Promise<Product[]> {
  if (!category) return [];
  const publicClient = requirePublicClient();

  const { data, error } = await publicClient
    .from("public_store_items")
    .select(PUBLIC_ITEM_FIELDS)
    .eq("category", category)
    .neq("id", excludedId)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) throw new StoreDataError("items", error);

  const rows = (data ?? []) as unknown as PublicStoreRow[];
  const photos = await fetchPhotosByItemIds(rows.map((row) => row.id));
  return rows.map((row) => normalizeProduct(row, photos));
}
