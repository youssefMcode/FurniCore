import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import {
  getCategories,
  getProduct,
} from "@/lib/api/products";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();

  if (profile.role !== "admin") {
    redirect(`/products/${id}`);
  }

  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/products/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Back to Product
        </Link>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
          Edit Product
        </h2>

        <p className="mt-2 text-sm text-[#73766F] sm:text-base">
          Update product information, pricing and catalog
          behavior.
        </p>
      </div>

      <ProductForm
        product={product}
        categories={categories}
      />
    </div>
  );
}