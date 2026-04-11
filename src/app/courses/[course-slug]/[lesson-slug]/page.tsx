import { notFound } from "next/navigation";
import { findCourse, findLesson } from "@/lib/mock-courses";
import { LessonPageClient } from "./lesson-page-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ "course-slug": string; "lesson-slug": string }>;
}) {
  const { "course-slug": courseSlug, "lesson-slug": lessonSlug } = await params;
  const course = findCourse(courseSlug);

  if (!course) notFound();

  const found = findLesson(course, lessonSlug);
  if (!found) notFound();

  return <LessonPageClient course={course} lesson={found.lesson} />;
}
