"use client";

import Link from "next/link";
import { BookOpen, Clock, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/progress-bar";
import { getCourseCompletionPercent } from "@/lib/course-progress";
import { getTotalLessons, getTotalDuration } from "@/lib/mock-courses";
import type { MockCourse } from "@/lib/mock-courses";
import { useEffect, useState } from "react";

// Gradient placeholders when no cover image
const GRADIENTS = [
  "from-slate-800 to-slate-600",
  "from-indigo-900 to-indigo-700",
  "from-amber-800 to-amber-600",
];

export function CourseCard({
  course,
  index = 0,
}: {
  course: MockCourse;
  index?: number;
}) {
  const totalLessons = getTotalLessons(course);
  const totalDuration = getTotalDuration(course);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    setPercent(getCourseCompletionPercent(course.slug, totalLessons));
  }, [course.slug, totalLessons]);

  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-slate-300">
        {/* Cover image or gradient placeholder */}
        <div
          className={`relative h-40 bg-gradient-to-br ${gradient} flex items-end p-4`}
        >
          <div className="absolute inset-0 bg-black/10" />
          <h3 className="relative z-10 text-lg font-bold leading-snug text-white">
            {course.title_zh}
          </h3>
        </div>

        <CardContent className="p-4">
          <p className="mb-1 text-sm font-medium text-muted-foreground">
            {course.title_en}
          </p>
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
            {course.description_zh}
          </p>

          {/* Metadata row */}
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {course.modules.length} modules
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {totalDuration} min
            </span>
          </div>

          {/* Progress bar */}
          <ProgressBar percent={percent} size="sm" />
        </CardContent>
      </Card>
    </Link>
  );
}
