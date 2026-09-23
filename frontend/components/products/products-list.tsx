"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  Eye,
  Package,
  Pencil,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Category,
  Product,
} from "@/lib/api/products";

interface ProductsListProps {
  products: Product[];
  categories: Category[];
  isAdmin: boolean;
}

export function ProductsList({
  products,
  categories,
  isAdmin,
}: ProductsListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" ||
        product.categories?.id === category;

      const matchesStatus =
        status === "all" ||
        (status === "active" && product.is_active) ||
        (status === "inactive" && !product.is_active) ||
        (status === "low" &&
          product.stock_quantity <=
            product.minimum_stock);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [products, search, category, status]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9C96]" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products by name or SKU..."
              className="h-11 pl-10"
            />
          </div>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="h-11 rounded-lg border border-[#DCDAD3] bg-white px-3 text-sm text-[#242624] outline-none focus:border-[#244A3D]"
          >
            <option value="all">
              All categories
            </option>

            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-11 rounded-lg border border-[#DCDAD3] bg-white px-3 text-sm text-[#242624] outline-none focus:border-[#244A3D]"
          >
            <option value="all">
              All products
            </option>
            <option value="active">Active</option>
            <option value="inactive">
              Inactive
            </option>
            <option value="low">
              Low stock
            </option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-[#73766F]">
          <SlidersHorizontal className="size-4" />

          {filteredProducts.length} of{" "}
          {products.length} products
        </div>
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCDAD3] bg-white px-6 py-16 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#EEF3F0] text-[#244A3D]">
            <Boxes className="size-5" />
          </div>

          <h3 className="mt-4 font-semibold text-[#242624]">
            No products found
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm text-[#73766F]">
            {products.length === 0
              ? "Your product catalog is currently empty."
              : "Try changing your search or filters."}
          </p>

          {isAdmin && products.length === 0 && (
            <Button
              nativeButton={false}
              className="mt-5 bg-[#244A3D] text-white hover:bg-[#19372D]"
              render={
                <Link href="/products/new" />
              }
            >
              Add first product
            </Button>
          )}
        </div>
      ) : (
        /* Catalog */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  isAdmin,
}: {
  product: Product;
  isAdmin: boolean;
}) {
  const lowStock =
    product.stock_quantity <=
    product.minimum_stock;

  const outOfStock =
    product.stock_quantity === 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Large furniture image */}
      <Link
        href={`/products/${product.id}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        <ProductImage product={product} />
      </Link>

      <div className="p-4 sm:p-5">
        {/* Category + active state */}
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-[#8A8D86]">
            {product.categories?.name ??
              "Uncategorized"}
          </p>

          <Badge
            variant="outline"
            className={
              product.is_active
                ? "shrink-0 border-green-200 bg-green-50 text-green-700"
                : "shrink-0 border-gray-200 bg-gray-50 text-gray-600"
            }
          >
            {product.is_active
              ? "Active"
              : "Inactive"}
          </Badge>
        </div>

        {/* Name */}
        <Link
          href={`/products/${product.id}`}
          className="mt-3 block"
        >
          <h3 className="line-clamp-1 text-lg font-semibold text-[#242624] transition group-hover:text-[#244A3D]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-xs text-[#8A8D86]">
          SKU: {product.sku}
        </p>

        {/* Price */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-[#8A8D86]">
              Selling price
            </p>

            <p className="mt-0.5 text-xl font-semibold text-[#244A3D]">
              $
              {Number(
                product.selling_price,
              ).toFixed(2)}
            </p>
          </div>

          <StockStatus
            stock={product.stock_quantity}
            lowStock={lowStock}
            outOfStock={outOfStock}
          />
        </div>

        {/* Product properties */}
        <div className="mt-4 flex min-h-7 flex-wrap gap-2">
          {product.is_customizable && (
            <Badge
              variant="outline"
              className="border-[#D7C4AF] bg-[#FBF5EF] text-[#8A6039]"
            >
              Customizable
            </Badge>
          )}

          {lowStock && !outOfStock && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-700"
            >
              Low stock
            </Badge>
          )}

          {outOfStock && (
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-red-700"
            >
              Out of stock
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 border-t border-[#EEECE6] pt-4">
          <Button
            nativeButton={false}
            variant="outline"
            className="flex-1"
            render={
              <Link
                href={`/products/${product.id}`}
              />
            }
          >
            <Eye className="size-4" />
            View
          </Button>

          {isAdmin && (
            <Button
              nativeButton={false}
              className="flex-1 bg-[#244A3D] text-white hover:bg-[#19372D]"
              render={
                <Link
                  href={`/products/${product.id}/edit`}
                />
              }
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductImage({
  product,
}: {
  product: Product;
}) {
  const primaryImage =
    product.product_images?.find(
      (image) => image.is_primary,
    ) ??
    [...(product.product_images ?? [])].sort(
      (a, b) =>
        a.sort_order - b.sort_order,
    )[0];

  if (!primaryImage) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#F3F1EC]">
        <div className="text-center text-[#8A8D86]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/80">
            <Package className="size-5 text-[#244A3D]" />
          </div>

          <p className="mt-2 text-xs">
            No product image
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F1EC]">
      <Image
        src={primaryImage.image_url}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
        className="object-cover transition duration-300 group-hover:scale-[1.025]"
      />

      {product.product_images.length > 1 && (
        <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-[#242624] shadow-sm backdrop-blur-sm">
          {product.product_images.length} photos
        </div>
      )}
    </div>
  );
}

function StockStatus({
  stock,
  lowStock,
  outOfStock,
}: {
  stock: number;
  lowStock: boolean;
  outOfStock: boolean;
}) {
  if (outOfStock) {
    return (
      <div className="text-right">
        <p className="text-xs text-[#8A8D86]">
          Stock
        </p>
        <p className="mt-0.5 text-sm font-semibold text-red-700">
          0 units
        </p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <p className="text-xs text-[#8A8D86]">
        Stock
      </p>

      <p
        className={`mt-0.5 text-sm font-semibold ${
          lowStock
            ? "text-amber-700"
            : "text-[#242624]"
        }`}
      >
        {stock} {stock === 1 ? "unit" : "units"}
      </p>
    </div>
  );
}