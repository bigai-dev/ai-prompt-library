import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/course-editor";
import { findCourse } from "@/lib/mock-courses";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = findCourse(id);

  if (!course) notFound();

  return <CourseEditor course={course} />;
}
