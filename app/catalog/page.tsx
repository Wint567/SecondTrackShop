import type { Metadata } from "next";
import { CatalogPage } from "@/components/pages/CatalogPage";
import { fetchPublicItems } from "@/services/store";
import { loadServerStoreState } from "@/utils/server-store-state";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/catalog" },
  title: "Shop all",
  description:
    "Shop the curated SECONDTRACK collection by category, brand, size, condition and price.",
};

export default async function CatalogRoute() {
  const initialState = await loadServerStoreState(fetchPublicItems);

  return <CatalogPage initialError={initialState.error} initialProducts={initialState.products} />;
}
