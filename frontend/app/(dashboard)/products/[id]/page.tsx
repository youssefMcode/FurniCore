import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  DollarSign,
  Edit3,
  Palette,
  Tag,
} from "lucide-react";

import { ProductGallery } from "@/components/products/product-gallery";
import { ProductImagesManagerWrapper } from "@/components/products/product-images-manager-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/api/products";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [profile, product] = await Promise.all([
    getCurrentUserProfile(),
    getProduct(id),
  ]);

  const isAdmin = profile.role === "admin";

  const lowStock =
    product.stock_quantity <= product.minimum_stock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#73766F] transition hover:text-[#244A3D]"
          >
            <ArrowLeft className="size-4" />
            Back to Products
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
              {product.name}
            </h2>

            <Badge
              variant="outline"
              className={
                product.is_active
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-50 text-gray-600"
              }
            >
              {product.is_active ? "Active" : "Inactive"}
            </Badge>

            {product.is_customizable && (
              <Badge
                variant="outline"
                className="border-[#D7C4AF] bg-[#FBF5EF] text-[#8A6039]"
              >
                Customizable
              </Badge>
            )}
          </div>

          <p className="mt-2 text-sm text-[#73766F]">
            SKU {product.sku}
          </p>
        </div>

        {isAdmin && (
          <Button
            nativeButton={false}
            className="bg-[#244A3D] text-white hover:bg-[#19372D]"
            render={
              <Link href={`/products/${product.id}/edit`} />
            }
          >
            <Edit3 className="size-4" />
            Edit Product
          </Button>
        )}
      </div>

      {/* Main product information */}
      <div className="grid gap-6 xl:grid-cols-[minmax(400px,520px)_minmax(0,1fr)]">
        {/* Gallery + description */}
        <section className="rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
          <div className="p-4 sm:p-5">
            <ProductGallery
              images={product.product_images ?? []}
              productName={product.name}
            />
          </div>

          <div className="border-t border-[#EEECE6] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9A9C96]">
              Description
            </p>

            <p className="mt-2 text-sm leading-6 text-[#555852]">
              {product.description ||
                "No description has been added for this product."}
            </p>
          </div>
        </section>

        {/* Product information */}
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={DollarSign}
              label="Selling Price"
              value={`$${Number(
                product.selling_price,
              ).toFixed(2)}`}
              helper={`Cost: $${Number(
                product.cost_price,
              ).toFixed(2)}`}
            />

            <InfoCard
              icon={Boxes}
              label="Current Stock"
              value={`${product.stock_quantity} units`}
              helper={`Minimum: ${product.minimum_stock}`}
              warning={lowStock}
            />

            <InfoCard
              icon={Tag}
              label="Category"
              value={
                product.categories?.name ?? "Uncategorized"
              }
              helper="Product classification"
            />

            <InfoCard
              icon={Palette}
              label="Customization"
              value={
                product.is_customizable
                  ? "Available"
                  : "Not available"
              }
              helper={
                product.is_customizable
                  ? "Options can be captured during POS"
                  : "Sold as configured"
              }
            />
          </section>

          {/* Low-stock warning */}
          {lowStock && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-800">
                Low stock attention
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                This product is at or below its minimum stock
                level. Stock adjustments and replenishment are
                handled from Inventory and Purchases.
              </p>
            </section>
          )}

          {/* Customization information */}
          {product.is_customizable && (
            <section className="rounded-2xl border border-[#DCCDBE] bg-[#FBF7F2] p-5">
              <div className="flex items-center gap-2">
                <Palette className="size-5 text-[#B8895B]" />

                <h3 className="font-semibold text-[#242624]">
                  Customizable furniture
                </h3>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#73766F]">
                During a sale, staff can capture
                customer-specific dimensions, color, fabric or
                material, configuration, price adjustment and
                notes.
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Admin image management */}
      {isAdmin && (
        <ProductImagesManagerWrapper
          productId={product.id}
          images={product.product_images ?? []}
        />
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  helper,
  warning = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  helper: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm">
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${
          warning
            ? "bg-amber-50 text-amber-700"
            : "bg-[#EEF3F0] text-[#244A3D]"
        }`}
      >
        <Icon className="size-4" />
      </div>

      <p className="mt-4 text-sm text-[#73766F]">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-semibold ${
          warning
            ? "text-amber-700"
            : "text-[#242624]"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-[#9A9C96]">
        {helper}
      </p>
    </div>
  );
}