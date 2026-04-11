import { Header } from "@/components/header";
import { CourseCard } from "@/components/course-card";
import { MOCK_COURSES } from "@/lib/mock-courses";
import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-yellow-50/50 to-white py-12 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Video Courses
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Vibe Coding
              <br />
              <span className="text-yellow-600">Video Courses</span>
            </h1>
            <p className="text-base text-muted-foreground">
              Step-by-step video lessons to master AI-assisted coding.
              <br />
              Watch at your own pace, track your progress.
            </p>
          </div>
        </section>

        {/* Course grid */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              All Courses{" "}
              <span className="text-base font-normal text-muted-foreground">
                ({MOCK_COURSES.length})
              </span>
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_COURSES.map((course, i) => (
              <CourseCard key={course.slug} course={course} index={i} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
