"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoomEmbed } from "@/components/loom-embed";
import { cn } from "@/lib/utils";
import {
  isLessonComplete,
  toggleLessonComplete,
} from "@/lib/course-progress";
import type { MockCourse, MockLesson } from "@/lib/mock-courses";
import { getAllLessons } from "@/lib/mock-courses";

export function LessonPlayer({
  course,
  lesson,
  onProgressChange,
}: {
  course: MockCourse;
  lesson: MockLesson;
  onProgressChange?: () => void;
}) {
  const [completed, setCompleted] = useState(false);
  const allLessons = getAllLessons(course);
  const currentIdx = allLessons.findIndex((l) => l.slug === lesson.slug);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  useEffect(() => {
    setCompleted(isLessonComplete(course.slug, lesson.slug));
  }, [course.slug, lesson.slug]);

  const handleToggleComplete = () => {
    const nowComplete = toggleLessonComplete(course.slug, lesson.slug);
    setCompleted(nowComplete);
    onProgressChange?.();
  };

  return (
    <div className="space-y-6">
      {/* Video */}
      <LoomEmbed embedUrl={lesson.loom_embed_url} title={lesson.title_en} />

      {/* Title + description */}
      <div>
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">
          {lesson.title_zh}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lesson.title_en}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {lesson.description_zh}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleToggleComplete}
          className={cn(
            "gap-2",
            completed
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-primary hover:bg-yellow-400 text-primary-foreground"
          )}
        >
          {completed ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              <Circle className="h-4 w-4" />
              Mark as Complete
            </>
          )}
        </Button>

        <span className="text-xs text-muted-foreground">
          {completed
            ? "Click again to undo"
            : "你的学习进度保存在此浏览器中"}
        </span>
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center gap-3 border-t pt-4">
        {prevLesson ? (
          <Link
            href={`/courses/${course.slug}/${prevLesson.slug}`}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Previous
              </p>
              <p className="font-medium leading-snug line-clamp-1">
                {prevLesson.title_zh}
              </p>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextLesson && (
          <Link
            href={`/courses/${course.slug}/${nextLesson.slug}`}
            className="ml-auto flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
          >
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Next
              </p>
              <p className="font-medium leading-snug line-clamp-1">
                {nextLesson.title_zh}
              </p>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
