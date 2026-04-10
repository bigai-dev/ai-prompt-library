"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";
import type { Category } from "@/types/database";

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [newCat, setNewCat] = useState({
    name_zh: "",
    name_en: "",
    slug: "",
    icon: "folder",
    sort_order: categories.length + 1,
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name_zh || !newCat.slug) {
      toast.error("Please fill in the category name and slug");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });

      if (!res.ok) throw new Error("Creation failed");

      toast.success("Category created");
      setNewCat({
        name_zh: "",
        name_en: "",
        slug: "",
        icon: "folder",
        sort_order: categories.length + 2,
      });
      router.refresh();
    } catch {
      toast.error("Creation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, field: string, value: string | number) => {
    const res = await fetch(`/api/v1/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      toast.success("Updated");
    } else {
      toast.error("Update failed");
    }
    router.refresh();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Category Management</h1>

      {/* Existing Categories */}
      <div className="mb-8 rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order</TableHead>
              <TableHead>Chinese Name</TableHead>
              <TableHead>English Name</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead className="w-28">Icon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={cat.sort_order}
                    className="h-8 w-16 text-center text-sm"
                    onBlur={(e) =>
                      handleUpdate(cat.id, "sort_order", parseInt(e.target.value))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={cat.name_zh}
                    className="h-8 text-sm"
                    onBlur={(e) =>
                      handleUpdate(cat.id, "name_zh", e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={cat.name_en}
                    className="h-8 text-sm"
                    onBlur={(e) =>
                      handleUpdate(cat.id, "name_en", e.target.value)
                    }
                  />
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {cat.slug}
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={cat.icon}
                    className="h-8 text-sm"
                    onBlur={(e) =>
                      handleUpdate(cat.id, "icon", e.target.value)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* New Category Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Add New Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-xs">Chinese Name *</Label>
                <Input
                  value={newCat.name_zh}
                  onChange={(e) =>
                    setNewCat((n) => ({ ...n, name_zh: e.target.value }))
                  }
                  placeholder="e.g. 电商"
                />
              </div>
              <div>
                <Label className="text-xs">English Name</Label>
                <Input
                  value={newCat.name_en}
                  onChange={(e) =>
                    setNewCat((n) => ({ ...n, name_en: e.target.value }))
                  }
                  placeholder="e.g. E-Commerce"
                />
              </div>
              <div>
                <Label className="text-xs">Slug *</Label>
                <Input
                  value={newCat.slug}
                  onChange={(e) =>
                    setNewCat((n) => ({ ...n, slug: e.target.value }))
                  }
                  placeholder="e.g. e-commerce"
                />
              </div>
              <div>
                <Label className="text-xs">Icon (Lucide name)</Label>
                <Input
                  value={newCat.icon}
                  onChange={(e) =>
                    setNewCat((n) => ({ ...n, icon: e.target.value }))
                  }
                  placeholder="e.g. shopping-cart"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving} size="sm">
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Category"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
