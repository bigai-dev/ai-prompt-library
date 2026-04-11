"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCompletedLessons } from "@/lib/course-progress";
import type { MockCourse, MockModule, MockLesson } from "@/lib/mock-courses";

export function CourseOutline({
  course,
  currentLessonSlug,
  refreshKey,
}: {
  course: MockCourse;
  currentLessonSlug?: string;
  refreshKey?: number;
}) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map((m) => m.id))
  );
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    setCompletedLessons(getCompletedLessons(course.slug));
  }, [course.slug, refreshKey]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {course.modules.map((mod, modIdx) => (
        <ModuleItem
          key={mod.id}
          module={mod}
          moduleIndex={modIdx}
          courseSlug={course.slug}
          expanded={expandedModules.has(mod.id)}
          onToggle={() => toggleModule(mod.id)}
          completedLessons={completedLessons}
          currentLessonSlug={currentLessonSlug}
        />
      ))}
    </div>
  );
}

function ModuleItem({
  module,
  moduleIndex,
  courseSlug,
  expanded,
  onToggle,
  completedLessons,
  currentLessonSlug,
}: {
  module: MockModule;
  moduleIndex: number;
  courseSlug: string;
  expanded: boolean;
  onToggle: () => void;
  completedLessons: string[];
  currentLessonSlug?: string;
}) {
  const completedCount = module.lessons.filter((l) =>
    completedLessons.includes(l.slug)
  ).length;

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">
            {moduleIndex + 1}. {module.title_zh}
          </p>
          <p className="text-xs text-muted-foreground">{module.title_en}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {completedCount}/{module.lessons.length}
        </span>
      </button>

      {expanded && (
        <div className="border-t">
          {module.lessons.map((lesson, idx) => (
            <LessonItem
              key={lesson.slug}
              lesson={lesson}
              index={idx}
              courseSlug={courseSlug}
              isCompleted={completedLessons.includes(lesson.slug)}
              isCurrent={currentLessonSlug === lesson.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonItem({
  lesson,
  index,
  courseSlug,
  isCompleted,
  isCurrent,
}: {
  lesson: MockLesson;
  index: number;
  courseSlug: string;
  isCompleted: boolean;
  isCurrent: boolean;
}) {
  return (
    <Link
      href={`/courses/${courseSlug}/${lesson.slug}`}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50",
        isCurrent && "bg-yellow-50 hover:bg-yellow-50",
        index > 0 && "border-t border-slate-50"
      )}
    >
      {/* Status icon */}
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : isCurrent ? (
        <Play className="h-4 w-4 shrink-0 text-yellow-600" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-slate-300" />
      )}

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug truncate",
            isCurrent && "font-medium text-yellow-700",
            isCompleted && "text-muted-foreground"
          )}
        >
          {lesson.title_zh}
        </p>
      </div>

      {/* Duration */}
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        {lesson.duration_minutes}m
      </span>
    </Link>
  );
}
