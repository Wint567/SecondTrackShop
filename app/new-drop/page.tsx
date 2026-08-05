import type { Metadata } from "next";
import { NewDropPage } from "@/components/pages/NewDropPage";
import { fetchPublicItems } from "@/services/store";
import { loadServerStoreState } from "@/utils/server-store-state";

export const revalidate = 300;
export const metadata: Metadata = {
  alternates: { canonical: "/new-drop" },
  description: "The eight newest published one-of-one SECONDTRACK pieces.",
  title: "New drop",
};
export default async function NewDropRoute() {
  const state = await loadServerStoreState(fetchPublicItems);
  return <NewDropPage initialError={state.error} initialProducts={state.products} />;
}
