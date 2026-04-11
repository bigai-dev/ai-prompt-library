/**
 * localStorage-based course progress tracking.
 * Uses the same anon_id pattern as the existing prompt events system.
 */

const STORAGE_KEY = "course_progress";

type ProgressMap = Record<string, string[]>; // courseSlug -> completedLessonSlugs[]

function getStore(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getCompletedLessons(courseSlug: string): string[] {
  return getStore()[courseSlug] ?? [];
}

export function isLessonComplete(
  courseSlug: string,
  lessonSlug: string
): boolean {
  return getCompletedLessons(courseSlug).includes(lessonSlug);
}

export function toggleLessonComplete(
  courseSlug: string,
  lessonSlug: string
): boolean {
  const store = getStore();
  const lessons = store[courseSlug] ?? [];
  const idx = lessons.indexOf(lessonSlug);

  if (idx >= 0) {
    lessons.splice(idx, 1);
  } else {
    lessons.push(lessonSlug);
  }

  store[courseSlug] = lessons;
  saveStore(store);
  return idx < 0; // returns true if now completed
}

export function getCourseCompletionPercent(
  courseSlug: string,
  totalLessons: number
): number {
  if (totalLessons === 0) return 0;
  const completed = getCompletedLessons(courseSlug).length;
  return Math.round((completed / totalLessons) * 100);
}
