import { Header } from "@/components/header";
import { FavoritesClient } from "@/components/favorites-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("favorites");
  return { title: t("pageTitle") };
}

export default async function FavoritesPage() {
  const t = await getTranslations("favorites");
  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t("pageTitle")}</h1>
        <FavoritesClient />
      </div>
    </>
  );
}
