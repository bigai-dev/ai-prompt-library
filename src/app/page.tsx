import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PromptCard } from "@/components/prompt-card";
import { CourseCard } from "@/components/course-card";
import { ContinueLearning } from "@/components/continue-learning";
import { MOCK_COURSES, getTotalLessons, getTotalDuration } from "@/lib/mock-courses";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  BookOpen,
  FileText,
  Play,
  Clock,
  Users,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import type { PromptWithCategory } from "@/types/database";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function HomePage() {
  const supabase = await createClient();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const [promptsRes, promptCountRes, settingsRes] = await Promise.all([
    supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("status", "published")
      .order("times_copied", { ascending: false })
      .limit(6),
    supabase
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "library_enabled",
        "courses_enabled",
        "feedback_enabled",
        "diagnostic_enabled",
      ]),
  ]);

  const prompts = (promptsRes.data || []) as PromptWithCategory[];
  const promptCount = promptCountRes.count ?? 0;

  // Module visibility — default enabled if missing
  const settingsMap: Record<string, string> = {};
  (settingsRes.data || []).forEach((r) => {
    settingsMap[r.key] = r.value;
  });
  const libraryEnabled = settingsMap.library_enabled !== "false";
  const coursesEnabled = settingsMap.courses_enabled !== "false";
  const feedbackEnabled = settingsMap.feedback_enabled !== "false";
  const diagnosticEnabled = settingsMap.diagnostic_enabled !== "false";

  const tDiag = await getTranslations("diagnostic");

  // Aggregate course stats
  const totalCourses = MOCK_COURSES.length;
  const totalLessons = MOCK_COURSES.reduce((s, c) => s + getTotalLessons(c), 0);
  const totalMinutes = MOCK_COURSES.reduce((s, c) => s + getTotalDuration(c), 0);

  return (
    <>
      <Header />
      <main>
        {/* Hero — Dual product hub */}
        <section className="border-b bg-linear-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-1.5 text-sm font-medium text-yellow-800">
                <Zap className="h-3.5 w-3.5" />
                {t("heroBadge")}
              </div>
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                {t("heroTitle1")}
                <span className="block text-yellow-600">{t("heroTitle2")}</span>
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-base text-slate-600 sm:text-lg">
                {t("heroTagline1")}
                <br className="hidden sm:block" />
                {t("heroTagline2")}
              </p>
            </div>

            {/* CTA cards — adapt grid based on enabled modules */}
            {(coursesEnabled || libraryEnabled || diagnosticEnabled) && (
              <div
                className={`mx-auto grid gap-4 ${
                  [coursesEnabled, libraryEnabled, diagnosticEnabled].filter(Boolean).length === 3
                    ? "max-w-5xl sm:grid-cols-3"
                    : [coursesEnabled, libraryEnabled, diagnosticEnabled].filter(Boolean).length === 2
                      ? "max-w-2xl sm:grid-cols-2"
                      : "max-w-md"
                }`}
              >
                {coursesEnabled && (
                  <Link
                    href="/courses"
                    className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:border-yellow-300 hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Play className="h-6 w-6" />
                    </div>
                    <h2 className="mb-1 text-xl font-bold text-slate-900">
                      {t("cardCoursesTitle")}
                    </h2>
                    <p className="mb-1 text-sm font-medium text-slate-600">
                      {t("cardCoursesSubtitle")}
                    </p>
                    <p className="mb-4 text-sm text-slate-500">
                      {t("cardCoursesDesc")}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {t("cardCoursesCourses", { count: totalCourses })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {t("cardCoursesLessons", { count: totalLessons })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("cardCoursesMinutes", { count: totalMinutes })}
                      </span>
                    </div>
                    <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-hover:bg-yellow-400 group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                )}

                {libraryEnabled && (
                  <Link
                    href="/library"
                    className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:border-yellow-300 hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-white">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h2 className="mb-1 text-xl font-bold text-slate-900">
                      {t("cardPromptsTitle")}
                    </h2>
                    <p className="mb-1 text-sm font-medium text-slate-600">
                      {t("cardPromptsSubtitle")}
                    </p>
                    <p className="mb-4 text-sm text-slate-500">
                      {t("cardPromptsDesc")}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {t("cardPromptsTemplates", { count: promptCount })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t("cardPromptsCategories")}
                      </span>
                    </div>
                    <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-hover:bg-yellow-400 group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                )}

                {diagnosticEnabled && (
                  <Link
                    href="/diagnostic"
                    className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:border-yellow-300 hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <h2 className="mb-1 text-xl font-bold text-slate-900">
                      {tDiag("cardTitle")}
                    </h2>
                    <p className="mb-1 text-sm font-medium text-slate-600">
                      {tDiag("cardSubtitle")}
                    </p>
                    <p className="mb-4 text-sm text-slate-500">
                      {tDiag("cardDesc")}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {tDiag("cardMeta1")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tDiag("cardMeta2")}
                      </span>
                    </div>
                    <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-hover:bg-yellow-400 group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Continue Learning — only shows if courses enabled and user has in-progress courses */}
        {coursesEnabled && <ContinueLearning />}

        {/* Courses section */}
        {coursesEnabled && (
          <section className="mx-auto max-w-7xl px-4 py-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("sectionCoursesTitle")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("sectionCoursesSubtitle")}
                </p>
              </div>
              <Link
                href="/courses"
                className="flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700"
              >
                {tc("viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_COURSES.slice(0, 3).map((course, i) => (
                <CourseCard key={course.slug} course={course} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Divider — only show if both sections are visible */}
        {coursesEnabled && libraryEnabled && (
          <div className="mx-auto max-w-7xl px-4">
            <hr className="border-slate-100" />
          </div>
        )}

        {/* Prompts section */}
        {libraryEnabled && (
          <section className="mx-auto max-w-7xl px-4 py-10 pb-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("sectionPromptsTitle")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("sectionPromptsSubtitle")}
                </p>
              </div>
              <Link
                href="/library"
                className="flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700"
              >
                {tc("browseAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400">
                  <Zap className="h-5 w-5 text-slate-900" />
                </div>
                <span className="font-bold text-white">Vibe Coding</span>
              </div>
              <p className="text-sm leading-relaxed">{t("footerBrand")}</p>
            </div>

            {/* Learn */}
            {(coursesEnabled || libraryEnabled || diagnosticEnabled) && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-white">
                  {t("footerLearn")}
                </h4>
                <ul className="space-y-2 text-sm">
                  {coursesEnabled && (
                    <li>
                      <Link href="/courses" className="transition-colors hover:text-white">
                        {t("footerVideoCourses")}
                      </Link>
                    </li>
                  )}
                  {libraryEnabled && (
                    <>
                      <li>
                        <Link href="/library" className="transition-colors hover:text-white">
                          {t("footerPromptLibrary")}
                        </Link>
                      </li>
                      <li>
                        <Link href="/favorites" className="transition-colors hover:text-white">
                          {t("footerFavorites")}
                        </Link>
                      </li>
                    </>
                  )}
                  {diagnosticEnabled && (
                    <li>
                      <Link href="/diagnostic" className="transition-colors hover:text-white">
                        {tDiag("cardTitle")}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Support */}
            {feedbackEnabled && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-white">
                  {t("footerSupport")}
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/feedback" className="transition-colors hover:text-white">
                      {t("footerFeedback")}
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            <p>{t("footerBuiltWith")}</p>
            <p className="mt-1">{t("footerCopyright", { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
