"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { getCourseCompletionPercent } from "@/lib/course-progress";
import type { MockCourse } from "@/lib/mock-courses";

export function CourseDetailClient({
  course,
  totalLessons,
}: {
  course: MockCourse;
  totalLessons: number;
}) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    setPercent(getCourseCompletionPercent(course.slug, totalLessons));
  }, [course.slug, totalLessons]);

  if (percent === 0) return null;

  return (
    <div className="mt-4 max-w-sm">
      <ProgressBar percent={percent} />
    </div>
  );
}
