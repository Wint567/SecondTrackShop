import type { Metadata } from "next";
import { CatalogPage } from "@/components/pages/CatalogPage";
import { fetchPublicItems } from "@/services/store";
import { loadInitialStoreState } from "@/utils/store-state";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/catalog" },
  title: "Каталог",
  description:
    "Каталог отобранной одежды SECONDTRACK: фильтры по категории, бренду, размеру и состоянию.",
};

export default async function CatalogRoute() {
  const initialState = await loadInitialStoreState(fetchPublicItems);

  return (
    <CatalogPage
      initialError={initialState.error}
      initialProducts={initialState.products}
    />
  );
}
