import type { Metadata } from "next";
import { SavedPage } from "@/components/pages/SavedPage";
import { fetchPublicItems } from "@/services/store";
import { loadServerStoreState } from "@/utils/server-store-state";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/saved" },
  title: "Saved objects",
  description: "Pieces held for later in your local SECONDTRACK archive.",
  robots: { follow: false, index: false },
};

export default async function SavedRoute() {
  const state = await loadServerStoreState(fetchPublicItems);
  return <SavedPage initialError={state.error} initialProducts={state.products} />;
}
