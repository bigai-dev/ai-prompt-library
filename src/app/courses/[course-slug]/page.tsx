import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { CourseOutline } from "@/components/course-outline";
import { ProgressBar } from "@/components/progress-bar";
import { findCourse, getTotalLessons, getTotalDuration, getAllLessons } from "@/lib/mock-courses";
import { ArrowLeft, BookOpen, Clock, Layers, Play } from "lucide-react";
import { CourseDetailClient } from "./course-detail-client";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ "course-slug": string }>;
}) {
  const { "course-slug": courseSlug } = await params;
  const course = findCourse(courseSlug);

  if (!course) notFound();

  const totalLessons = getTotalLessons(course);
  const totalDuration = getTotalDuration(course);
  const firstLesson = getAllLessons(course)[0];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href="/courses"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Courses
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
            {course.title_zh}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {course.title_en}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {course.description_zh}
          </p>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {course.modules.length} modules
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {totalDuration} min total
            </span>
          </div>

          {/* Progress + Start button */}
          <CourseDetailClient course={course} totalLessons={totalLessons} />

          {firstLesson && (
            <Link
              href={`/courses/${course.slug}/${firstLesson.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-yellow-400"
            >
              <Play className="h-4 w-4" />
              Start Learning
            </Link>
          )}
        </div>

        {/* Course outline */}
        <div>
          <h2 className="mb-4 text-lg font-bold">Course Content</h2>
          <CourseOutline course={course} />
        </div>
      </main>
    </>
  );
}
