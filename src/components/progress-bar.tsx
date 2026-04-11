"use client";

import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  size = "default",
  showLabel = true,
  className,
}: {
  percent: number;
  size?: "sm" | "default";
  showLabel?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const barHeight = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn("flex-1 overflow-hidden rounded-full bg-slate-100", barHeight)}
      >
        <div
          className={cn(
            "rounded-full transition-all duration-500",
            barHeight,
            clamped === 100
              ? "bg-emerald-500"
              : clamped > 0
                ? "bg-yellow-400"
                : "bg-transparent"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "shrink-0 tabular-nums text-muted-foreground",
            size === "sm" ? "text-[10px]" : "text-xs"
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
