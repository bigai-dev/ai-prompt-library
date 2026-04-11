"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import {
  getCompletedLessons,
  getCourseCompletionPercent,
} from "@/lib/course-progress";
import {
  MOCK_COURSES,
  getTotalLessons,
  getAllLessons,
} from "@/lib/mock-courses";
import type { MockCourse } from "@/lib/mock-courses";

interface InProgressCourse {
  course: MockCourse;
  percent: number;
  completedCount: number;
  totalLessons: number;
  nextLessonSlug: string;
}

export function ContinueLearning() {
  const [inProgress, setInProgress] = useState<InProgressCourse[]>([]);

  useEffect(() => {
    const courses: InProgressCourse[] = [];

    for (const course of MOCK_COURSES) {
      const total = getTotalLessons(course);
      const completed = getCompletedLessons(course.slug);
      const percent = getCourseCompletionPercent(course.slug, total);

      if (percent > 0 && percent < 100) {
        const allLessons = getAllLessons(course);
        const nextLesson = allLessons.find(
          (l) => !completed.includes(l.slug)
        );

        courses.push({
          course,
          percent,
          completedCount: completed.length,
          totalLessons: total,
          nextLessonSlug: nextLesson?.slug ?? allLessons[0].slug,
        });
      }
    }

    setInProgress(courses);
  }, []);

  if (inProgress.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8">
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        Continue Learning
      </h2>
      <div className="space-y-3">
        {inProgress.map(({ course, percent, completedCount, totalLessons, nextLessonSlug }) => (
          <Link
            key={course.slug}
            href={`/courses/${course.slug}/${nextLessonSlug}`}
            className="group flex items-center gap-4 rounded-xl border border-yellow-200 bg-yellow-50/50 p-4 transition-all hover:border-yellow-300 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-white">
              <Play className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-snug text-slate-900">
                {course.title_zh}
              </p>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{totalLessons} lessons completed
              </p>
              <div className="mt-1.5 max-w-xs">
                <ProgressBar percent={percent} size="sm" />
              </div>
            </div>
            <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-yellow-700 group-hover:text-yellow-800 sm:flex">
              Resume
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
