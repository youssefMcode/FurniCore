"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Edit3,
  FolderOpen,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";
import type { Category } from "@/lib/api/products";

interface CategoriesManagerProps {
  categories: Category[];
}

export function CategoriesManager({
  categories,
}: CategoriesManagerProps) {
  const router = useRouter();

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createCategory(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await authenticatedFetch(
        "/api/categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create category.",
      );
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
    setError("");
  }

  async function updateCategory(
    category: Category,
    changes?: Partial<Category>,
  ) {
    setError("");
    setSaving(true);

    try {
      const payload =
        changes ??
        {
          name: editName.trim(),
          description:
            editDescription.trim() || null,
        };

      const response = await authenticatedFetch(
        `/api/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
        <div className="border-b border-[#EEECE6] px-5 py-5 sm:px-6">
          <h3 className="text-lg font-semibold text-[#242624]">
            Categories
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Organize products into clear showroom groups.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FolderOpen className="mx-auto size-8 text-[#244A3D]" />

            <p className="mt-3 font-medium text-[#242624]">
              No categories yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEECE6]">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-5 sm:px-6"
              >
                {editingId === category.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(event) =>
                        setEditName(event.target.value)
                      }
                    />

                    <Textarea
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Category description"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={
                          saving || !editName.trim()
                        }
                        onClick={() =>
                          updateCategory(category)
                        }
                        className="bg-[#244A3D] text-white hover:bg-[#19372D]"
                      >
                        <Check className="size-4" />
                        Save
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() =>
                          setEditingId(null)
                        }
                      >
                        <X className="size-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[#242624]">
                          {category.name}
                        </p>

                        <Badge
                          variant="outline"
                          className={
                            category.is_active
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }
                        >
                          {category.is_active
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-[#73766F]">
                        {category.description ||
                          "No description"}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          beginEdit(category)
                        }
                      >
                        <Edit3 className="size-4" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() =>
                          updateCategory(category, {
                            is_active:
                              !category.is_active,
                          })
                        }
                      >
                        {category.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <aside>
        <form
          onSubmit={createCategory}
          className="sticky top-24 rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#244A3D]">
            <Plus className="size-4" />
          </div>

          <h3 className="mt-4 font-semibold text-[#242624]">
            New Category
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Add another group to your furniture catalog.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#242624]">
                Name
              </label>

              <Input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Office Furniture"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#242624]">
                Description
              </label>

              <Textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
                placeholder="Optional description"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full bg-[#244A3D] text-white hover:bg-[#19372D]"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}

              Add Category
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}