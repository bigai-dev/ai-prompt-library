import { Header } from "@/components/header";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-6xl font-bold text-muted-foreground/20">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Page not found</p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-yellow-400"
        >
          Back to Home
        </Link>
      </div>
    </>
  );
}
