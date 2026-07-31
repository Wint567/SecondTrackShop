import type { Product } from "@/types/product";

export type InitialStoreState = {
  error: boolean;
  products: Product[];
};

export async function loadInitialStoreState(
  fetchItems: () => Promise<Product[]>,
): Promise<InitialStoreState> {
  try {
    return {
      error: false,
      products: await fetchItems(),
    };
  } catch {
    return {
      error: true,
      products: [],
    };
  }
}
