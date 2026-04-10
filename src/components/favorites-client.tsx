"use client";

import { useEffect, useState } from "react";
import { getFavorites } from "@/lib/favorites";
import { PromptCard } from "@/components/prompt-card";
import { Heart } from "lucide-react";
import Link from "next/link";
import type { PromptWithCategory } from "@/types/database";

export function FavoritesClient() {
  const [prompts, setPrompts] = useState<PromptWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const favoriteIds = getFavorites();
    if (favoriteIds.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch favorite prompts via API
    fetch(`/api/v1/prompts?limit=50`)
      .then((r) => r.json())
      .then((res) => {
        const filtered = (res.data || []).filter(
          (p: PromptWithCategory) => favoriteIds.includes(p.id)
        );
        setPrompts(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border bg-secondary/50"
          />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="py-20 text-center">
        <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="mb-2 text-lg font-medium text-muted-foreground">
          No favorites yet
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Browse the template library and tap the heart icon to save your favorites
        </p>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-yellow-400"
        >
          Browse Library
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
