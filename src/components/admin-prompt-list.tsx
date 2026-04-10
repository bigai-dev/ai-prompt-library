"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { MoreHorizontal, Plus, Eye, Edit, Trash2, ToggleLeft } from "lucide-react";
import type { PromptWithCategory, Category } from "@/types/database";

interface Props {
  prompts: PromptWithCategory[];
  categories: Category[];
}

export function AdminPromptList({ prompts }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("");

  const filtered = prompts.filter(
    (p) =>
      p.title_en.includes(filter) ||
      p.title_en.toLowerCase().includes(filter.toLowerCase()) ||
      p.slug.includes(filter)
  );

  const handlePublish = async (id: string) => {
    await fetch(`/api/v1/admin/prompts/${id}/publish`, { method: "POST" });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    await fetch(`/api/v1/admin/prompts/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prompt Management</h1>
        <Link
          href="/admin/prompts/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-yellow-400"
        >
          <Plus className="h-4 w-4" />
          New Prompt
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search prompts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-xs rounded-lg border bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Copies</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{prompt.title_en}</div>
                    <div className="text-xs text-muted-foreground">
                      /{prompt.slug}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {prompt.category?.name_en}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DifficultyBadge difficulty={prompt.difficulty} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      prompt.status === "published" ? "default" : "secondary"
                    }
                  >
                    {prompt.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {prompt.times_copied}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded p-1 hover:bg-secondary">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(`/prompt/${prompt.slug}`, "_blank")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/prompts/${prompt.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePublish(prompt.id)}>
                        <ToggleLeft className="mr-2 h-4 w-4" />
                        {prompt.status === "published" ? "Unpublish" : "Publish"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(prompt.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
