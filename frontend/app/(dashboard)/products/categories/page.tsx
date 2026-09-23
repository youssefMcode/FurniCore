import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { CategoriesManager } from "@/components/products/categories-manager";
import { getCategories } from "@/lib/api/products";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const profile = await getCurrentUserProfile();

  if (profile.role !== "admin") {
    redirect("/products");
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
          Product Categories
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-[#73766F] sm:text-base">
          Organize the furniture catalog without removing
          categories used by historical records.
        </p>
      </div>

      <CategoriesManager categories={categories} />
    </div>
  );
}