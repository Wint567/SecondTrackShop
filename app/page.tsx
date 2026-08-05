import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { fetchPublicItems } from "@/services/store";
import { loadServerStoreState } from "@/utils/server-store-state";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: {
    absolute: "SECONDTRACK — Cut–Paste Club",
  },
  description: "Found items. Worn again. Every piece gets a next track.",
};

export default async function Home() {
  const initialState = await loadServerStoreState(fetchPublicItems);

  return <HomePage initialError={initialState.error} initialProducts={initialState.products} />;
}
