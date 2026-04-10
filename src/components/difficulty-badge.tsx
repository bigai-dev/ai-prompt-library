import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types/database";

const config: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: "Easy", className: "bg-green-100 text-green-700" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  hard: { label: "Hard", className: "bg-red-100 text-red-700" },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, className } = config[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
