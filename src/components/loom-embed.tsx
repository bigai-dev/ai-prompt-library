"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

export function LoomEmbed({
  embedUrl,
  title,
  className,
}: {
  embedUrl: string;
  title?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const isPlaceholder = embedUrl.includes("placeholder");

  if (isPlaceholder) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center",
          className
        )}
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Play className="h-8 w-8 text-white/60" />
          </div>
          <p className="text-sm text-white/40">Video coming soon</p>
          {title && (
            <p className="mt-1 text-xs text-white/25">{title}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900",
        className
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      )}
      <iframe
        src={embedUrl}
        title={title ?? "Lesson video"}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
