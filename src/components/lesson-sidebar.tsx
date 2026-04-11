"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CourseOutline } from "@/components/course-outline";
import { ProgressBar } from "@/components/progress-bar";
import { getCourseCompletionPercent } from "@/lib/course-progress";
import { getTotalLessons } from "@/lib/mock-courses";
import type { MockCourse } from "@/lib/mock-courses";
import { useEffect, useState } from "react";

export function LessonSidebar({
  course,
  currentLessonSlug,
  refreshKey,
}: {
  course: MockCourse;
  currentLessonSlug: string;
  refreshKey?: number;
}) {
  const totalLessons = getTotalLessons(course);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    setPercent(getCourseCompletionPercent(course.slug, totalLessons));
  }, [course.slug, totalLessons, refreshKey]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Link
          href={`/courses/${course.slug}`}
          className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Course
        </Link>
        <h2 className="text-sm font-semibold leading-snug">
          {course.title_zh}
        </h2>
        <div className="mt-2">
          <ProgressBar percent={percent} size="sm" />
        </div>
      </div>

      {/* Outline */}
      <div className="flex-1 overflow-y-auto p-3">
        <CourseOutline
          course={course}
          currentLessonSlug={currentLessonSlug}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
