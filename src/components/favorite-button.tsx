"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { isFavorited, toggleFavorite } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  promptId,
  className,
}: {
  promptId: string;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorited(promptId));
  }, [promptId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(promptId);
    setFavorited(added);
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "rounded-full p-1.5 transition-colors hover:bg-secondary",
        className
      )}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          favorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </button>
  );
}
