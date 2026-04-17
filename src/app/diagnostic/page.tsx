import { Header } from "@/components/header";
import { DiagnosticClient } from "./diagnostic-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("diagnostic");
  return { title: t("pageTitle") };
}

export default function DiagnosticPage() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] bg-slate-50">
        <DiagnosticClient />
      </main>
    </>
  );
}
