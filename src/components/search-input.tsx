"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQ = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(currentQ);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync when URL changes externally (back button, filter clicks)
  useEffect(() => {
    setInputValue(currentQ);
  }, [currentQ]);

  const pushSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const qs = params.toString();
      router.push(`/library${qs ? `?${qs}` : ""}`);
    },
    [router, searchParams]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => pushSearch(value), 300);
  };

  const handleClear = () => {
    setInputValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
    pushSearch("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (timerRef.current) clearTimeout(timerRef.current);
      pushSearch(inputValue);
    }
  };

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search templates..."
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="h-10 pl-9 pr-9"
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
