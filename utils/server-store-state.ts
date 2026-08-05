import { unstable_noStore as noStore } from "next/cache";
import type { Product } from "@/types/product";
import { loadInitialStoreState, type InitialStoreState } from "@/utils/store-state";

export function loadServerStoreState(
  fetchItems: () => Promise<Product[]>,
): Promise<InitialStoreState> {
  return loadInitialStoreState(fetchItems, noStore);
}
