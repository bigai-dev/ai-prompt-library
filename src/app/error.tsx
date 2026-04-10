"use client";

import { Header } from "@/components/header";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Header />
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          {error.message || "Please try again later"}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-yellow-400"
        >
          Retry
        </button>
      </div>
    </>
  );
}
