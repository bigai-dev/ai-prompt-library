const STORAGE_KEY = "prompt_library_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleFavorite(promptId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(promptId);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(promptId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return index === -1; // returns true if added
}

export function isFavorited(promptId: string): boolean {
  return getFavorites().includes(promptId);
}
