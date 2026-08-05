import type { Metadata } from "next";
import { BrandsPage } from "@/components/pages/BrandsPage";
import { fetchPublicItems } from "@/services/store";
import { loadServerStoreState } from "@/utils/server-store-state";

export const revalidate = 300;
export const metadata: Metadata = {
  alternates: { canonical: "/brands" },
  description: "Browse the real labels represented in the current SECONDTRACK archive.",
  title: "Brands",
};
export default async function BrandsRoute() {
  const state = await loadServerStoreState(fetchPublicItems);
  return <BrandsPage initialError={state.error} initialProducts={state.products} />;
}
