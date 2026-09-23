import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { getCategories } from "@/lib/api/products";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
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
          className="inline-flex items-center gap-2 text-sm font-medium text-[#73766F] transition hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
          Add Product
        </h2>

        <p className="mt-2 text-sm text-[#73766F] sm:text-base">
          Add a new furniture item to the FurniCore catalog.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}