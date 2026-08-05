import type { Product } from "@/types/product";

export type StoreErrorInfo = {
  area: "items" | "photos" | "unknown";
  code: "PUBLIC_STORE_UNAVAILABLE";
};

export type InitialStoreState = {
  error: StoreErrorInfo | null;
  products: Product[];
};

export async function loadInitialStoreState(
  fetchItems: () => Promise<Product[]>,
  markUncacheable: () => void = () => undefined,
): Promise<InitialStoreState> {
  try {
    return {
      error: null,
      products: await fetchItems(),
    };
  } catch (cause) {
    // A transient Supabase failure must not become the route's ISR snapshot.
    markUncacheable();
    const area =
      cause instanceof Error &&
      "area" in cause &&
      (cause.area === "items" || cause.area === "photos")
        ? cause.area
        : "unknown";
    const error: StoreErrorInfo = {
      area,
      code: "PUBLIC_STORE_UNAVAILABLE",
    };
    console.error("[SECONDTRACK] initial public store load failed.", error);
    return {
      error,
      products: [],
    };
  }
}
