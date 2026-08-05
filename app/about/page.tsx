import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/AboutPage";
import { fetchPublicItems } from "@/services/store";
import { loadServerStoreState } from "@/utils/server-store-state";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About",
  description: "How SECONDTRACK curates, documents and keeps one-of-one clothing in motion.",
};

export default async function AboutRoute() {
  const state = await loadServerStoreState(fetchPublicItems);
  return <AboutPage initialError={state.error} initialProducts={state.products} />;
}
