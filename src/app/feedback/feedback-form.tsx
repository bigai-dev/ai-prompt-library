"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function FeedbackForm() {
  const router = useRouter();
  const t = useTranslations("feedback");
  const tc = useTranslations("common");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const CATEGORIES = [
    { value: "general", label: t("categoryOther") },
    { value: "bug", label: t("categoryBug") },
    { value: "feature", label: t("categoryFeature") },
    { value: "content", label: t("categoryContent") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("errorMessage"));
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error(t("errorMessage"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold">{t("successTitle")}</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {t("successMessage")}
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            {tc("back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
          <MessageSquare className="h-6 w-6 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <Label>{t("categoryLabel")}</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      category === cat.value
                        ? "border-yellow-400 bg-yellow-50 text-slate-900"
                        : "border-slate-200 text-muted-foreground hover:border-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">{t("messageLabel")}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                rows={5}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={submitting || !message.trim()}
            >
              <Send className="h-4 w-4" />
              {submitting ? t("submitting") : t("submitButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
