"use client";

import { useState } from "react";
import { LessonPlayer } from "@/components/lesson-player";
import { LessonSidebar } from "@/components/lesson-sidebar";
import type { MockCourse, MockLesson } from "@/lib/mock-courses";

export function LessonPageClient({
  course,
  lesson,
}: {
  course: MockCourse;
  lesson: MockLesson;
}) {
  // refreshKey forces sidebar + outline to re-read localStorage after toggling completion
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProgressChange = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r bg-white lg:block">
          <LessonSidebar
            course={course}
            currentLessonSlug={lesson.slug}
            refreshKey={refreshKey}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
            <LessonPlayer
              course={course}
              lesson={lesson}
              onProgressChange={handleProgressChange}
            />
          </div>

          {/* Mobile outline — below content */}
          <div className="border-t lg:hidden">
            <div className="px-4 py-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Course Content
              </h3>
              <LessonSidebar
                course={course}
                currentLessonSlug={lesson.slug}
                refreshKey={refreshKey}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
