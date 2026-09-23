import Link from "next/link";
import { FolderCog, Plus } from "lucide-react";

import { ProductsList } from "@/components/products/products-list";
import { Button } from "@/components/ui/button";
import {
  getCategories,
  getProducts,
} from "@/lib/api/products";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const profile = await getCurrentUserProfile();

  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#B8895B]">
            Catalog management
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
            Products
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-[#73766F] sm:text-base">
            Manage furniture products, pricing, categories and
            customization availability.
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
           <Button
  variant="outline"
  nativeButton={false}
  render={<Link href="/products/categories" />}
>
              <FolderCog className="size-4" />
              Categories
            </Button>

           <Button
  nativeButton={false}
  className="bg-[#244A3D] text-white hover:bg-[#19372D]"
  render={<Link href="/products/new" />}
>
  <Plus className="size-4" />
  Add Product
</Button>
          </div>
        )}
      </div>

      <ProductsList
        products={products}
        categories={categories}
        isAdmin={isAdmin}
      />
    </div>
  );
}