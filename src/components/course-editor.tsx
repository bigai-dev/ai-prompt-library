"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Video,
  Save,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { parseLoomUrl } from "@/lib/loom";
import type { MockCourse, MockModule, MockLesson } from "@/lib/mock-courses";

interface EditorModule {
  id: string;
  title_zh: string;
  title_en: string;
  lessons: EditorLesson[];
}

interface EditorLesson {
  id: string;
  slug: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  loom_url: string;
  duration_minutes: number;
}

function generateId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CourseEditor({ course }: { course?: MockCourse }) {
  const router = useRouter();
  const isEdit = !!course;

  const [titleZh, setTitleZh] = useState(course?.title_zh ?? "");
  const [titleEn, setTitleEn] = useState(course?.title_en ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [descZh, setDescZh] = useState(course?.description_zh ?? "");
  const [descEn, setDescEn] = useState(course?.description_en ?? "");
  const [coverUrl, setCoverUrl] = useState(course?.cover_image_url ?? "");
  const [status, setStatus] = useState<"draft" | "published">(isEdit ? "published" : "draft");

  const [modules, setModules] = useState<EditorModule[]>(
    course?.modules.map((m) => ({
      id: m.id,
      title_zh: m.title_zh,
      title_en: m.title_en,
      lessons: m.lessons.map((l) => ({
        id: generateId(),
        slug: l.slug,
        title_zh: l.title_zh,
        title_en: l.title_en,
        description_zh: l.description_zh,
        description_en: l.description_en,
        loom_url: l.loom_embed_url,
        duration_minutes: l.duration_minutes,
      })),
    })) ?? []
  );

  // Auto-generate slug from English title
  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!isEdit) {
      setSlug(slugify(val));
    }
  };

  // Module operations
  const addModule = () => {
    setModules((prev) => [
      ...prev,
      { id: generateId(), title_zh: "", title_en: "", lessons: [] },
    ]);
  };

  const updateModule = (
    idx: number,
    field: keyof EditorModule,
    value: string
  ) => {
    setModules((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const removeModule = (idx: number) => {
    if (
      modules[idx].lessons.length > 0 &&
      !confirm(
        "This module has lessons. Are you sure you want to delete it?"
      )
    )
      return;
    setModules((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveModule = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= modules.length) return;
    setModules((prev) => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  // Lesson operations
  const addLesson = (moduleIdx: number) => {
    setModules((prev) =>
      prev.map((m, i) =>
        i === moduleIdx
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                {
                  id: generateId(),
                  slug: "",
                  title_zh: "",
                  title_en: "",
                  description_zh: "",
                  description_en: "",
                  loom_url: "",
                  duration_minutes: 0,
                },
              ],
            }
          : m
      )
    );
  };

  const updateLesson = (
    moduleIdx: number,
    lessonIdx: number,
    field: keyof EditorLesson,
    value: string | number
  ) => {
    setModules((prev) =>
      prev.map((m, mi) =>
        mi === moduleIdx
          ? {
              ...m,
              lessons: m.lessons.map((l, li) => {
                if (li !== lessonIdx) return l;
                const updated = { ...l, [field]: value };
                // Auto-generate slug from English title
                if (field === "title_en" && typeof value === "string") {
                  updated.slug = slugify(value);
                }
                return updated;
              }),
            }
          : m
      )
    );
  };

  const removeLesson = (moduleIdx: number, lessonIdx: number) => {
    setModules((prev) =>
      prev.map((m, mi) =>
        mi === moduleIdx
          ? { ...m, lessons: m.lessons.filter((_, li) => li !== lessonIdx) }
          : m
      )
    );
  };

  const moveLesson = (
    moduleIdx: number,
    lessonIdx: number,
    direction: "up" | "down"
  ) => {
    const newIdx = direction === "up" ? lessonIdx - 1 : lessonIdx + 1;
    setModules((prev) =>
      prev.map((m, mi) => {
        if (mi !== moduleIdx) return m;
        if (newIdx < 0 || newIdx >= m.lessons.length) return m;
        const next = [...m.lessons];
        [next[lessonIdx], next[newIdx]] = [next[newIdx], next[lessonIdx]];
        return { ...m, lessons: next };
      })
    );
  };

  const handleSave = () => {
    toast.success(
      isEdit ? "Course updated (mock)" : "Course created (mock)"
    );
    router.push("/admin/courses");
  };

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalDuration = modules.reduce(
    (s, m) => s + m.lessons.reduce((ls, l) => ls + (l.duration_minutes || 0), 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Course" : "New Course"}
        </h1>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {modules.length} modules · {totalLessons} lessons · {totalDuration}{" "}
            min
          </Badge>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </div>

      {/* Course metadata */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Course Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title (Chinese)</Label>
              <Input
                value={titleZh}
                onChange={(e) => setTitleZh(e.target.value)}
                placeholder="Vibe Coding 基础入门"
              />
            </div>
            <div className="space-y-2">
              <Label>Title (English)</Label>
              <Input
                value={titleEn}
                onChange={(e) => handleTitleEnChange(e.target.value)}
                placeholder="Vibe Coding Fundamentals"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="vibe-coding-fundamentals"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL (optional)</Label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Description (Chinese)</Label>
              <Textarea
                value={descZh}
                onChange={(e) => setDescZh(e.target.value)}
                rows={3}
                placeholder="课程简介..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description (English)</Label>
              <Textarea
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                rows={3}
                placeholder="Course description..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label>Status:</Label>
            <button
              onClick={() =>
                setStatus((s) => (s === "draft" ? "published" : "draft"))
              }
              className="cursor-pointer"
            >
              <Badge variant={status === "published" ? "default" : "secondary"}>
                {status === "published" ? "Published" : "Draft"}
              </Badge>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Modules & Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Modules & Lessons</h2>
          <Button variant="outline" onClick={addModule} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Module
          </Button>
        </div>

        {modules.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Video className="mb-2 h-8 w-8" />
              <p className="text-sm">
                No modules yet. Click &ldquo;Add Module&rdquo; to start
                building your course.
              </p>
            </CardContent>
          </Card>
        )}

        {modules.map((mod, modIdx) => (
          <Card key={mod.id}>
            <CardContent className="p-4">
              {/* Module header */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    onClick={() => moveModule(modIdx, "up")}
                    disabled={modIdx === 0}
                    className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveModule(modIdx, "down")}
                    disabled={modIdx === modules.length - 1}
                    className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="shrink-0">
                      Module {modIdx + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {mod.lessons.length} lesson
                      {mod.lessons.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={mod.title_zh}
                      onChange={(e) =>
                        updateModule(modIdx, "title_zh", e.target.value)
                      }
                      placeholder="模块标题 (中文)"
                    />
                    <Input
                      value={mod.title_en}
                      onChange={(e) =>
                        updateModule(modIdx, "title_en", e.target.value)
                      }
                      placeholder="Module title (English)"
                    />
                  </div>

                  <Separator />

                  {/* Lessons */}
                  <div className="space-y-3">
                    {mod.lessons.map((lesson, lessonIdx) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        index={lessonIdx}
                        total={mod.lessons.length}
                        onUpdate={(field, value) =>
                          updateLesson(modIdx, lessonIdx, field, value)
                        }
                        onRemove={() => removeLesson(modIdx, lessonIdx)}
                        onMove={(dir) =>
                          moveLesson(modIdx, lessonIdx, dir)
                        }
                      />
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLesson(modIdx)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Lesson
                    </Button>
                  </div>
                </div>

                <button
                  onClick={() => removeModule(modIdx)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  lesson: EditorLesson;
  index: number;
  total: number;
  onUpdate: (field: keyof EditorLesson, value: string | number) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const loomInfo = lesson.loom_url ? parseLoomUrl(lesson.loom_url) : null;

  return (
    <div className="rounded-lg border bg-slate-50/50 p-3">
      <div className="flex items-start gap-2">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="rounded p-0.5 text-muted-foreground hover:bg-white disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <GripVertical className="h-3 w-3 text-muted-foreground/40" />
          <button
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className="rounded p-0.5 text-muted-foreground hover:bg-white disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 space-y-2">
          {/* Titles */}
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={lesson.title_zh}
              onChange={(e) => onUpdate("title_zh", e.target.value)}
              placeholder="课程标题 (中文)"
              className="text-sm"
            />
            <Input
              value={lesson.title_en}
              onChange={(e) => onUpdate("title_en", e.target.value)}
              placeholder="Lesson title (English)"
              className="text-sm"
            />
          </div>

          {/* Loom URL + Duration */}
          <div className="grid gap-2 sm:grid-cols-[1fr_100px]">
            <div className="relative">
              <Input
                value={lesson.loom_url}
                onChange={(e) => onUpdate("loom_url", e.target.value)}
                placeholder="https://www.loom.com/share/..."
                className="pr-8 text-sm font-mono"
              />
              {loomInfo && (
                <a
                  href={loomInfo.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <Input
              type="number"
              value={lesson.duration_minutes || ""}
              onChange={(e) =>
                onUpdate("duration_minutes", parseInt(e.target.value) || 0)
              }
              placeholder="Min"
              className="text-sm"
              min={0}
            />
          </div>

          {/* Loom validation */}
          {lesson.loom_url && !loomInfo && (
            <p className="text-xs text-red-500">
              Invalid Loom URL. Use format: loom.com/share/... or
              loom.com/embed/...
            </p>
          )}
          {loomInfo && (
            <p className="text-xs text-emerald-600">
              Loom video detected: {loomInfo.videoId.slice(0, 12)}...
            </p>
          )}
        </div>

        <button
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
