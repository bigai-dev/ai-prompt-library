import { Header } from "@/components/header";
import { FeedbackForm } from "./feedback-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("feedback");
  return { title: t("pageTitle") };
}

export default async function FeedbackPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-4 py-12">
        <FeedbackForm />
      </main>
    </>
  );
}
