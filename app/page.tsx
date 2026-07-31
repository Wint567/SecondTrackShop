import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { fetchPublicItems } from "@/services/store";
import { loadInitialStoreState } from "@/utils/store-state";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: {
    absolute: "SECONDTRACK — отобранная одежда",
  },
  description:
    "Отобранная винтажная одежда и оригинальные вещи в единственном экземпляре.",
};

export default async function Home() {
  const initialState = await loadInitialStoreState(fetchPublicItems);

  return (
    <HomePage
      initialError={initialState.error}
      initialProducts={initialState.products}
    />
  );
}
