"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleChange = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  const current = OPTIONS.find((o) => o.value === locale) ?? OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => handleChange(o.value)}
            className="flex items-center justify-between"
          >
            <span>{o.label}</span>
            {o.value === locale && <Check className="h-4 w-4 text-yellow-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
