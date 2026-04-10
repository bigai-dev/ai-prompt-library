import { Header } from "@/components/header";
import { FavoritesClient } from "@/components/favorites-client";

export const metadata = {
  title: "My Favorites",
};

export default function FavoritesPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>
        <FavoritesClient />
      </div>
    </>
  );
}
