"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Package,
  Search,
} from "lucide-react";

import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { InventoryProduct } from "@/lib/api/inventory";

interface Props {
  products: InventoryProduct[];
  isAdmin: boolean;
}

type StockFilter = "all" | "in-stock" | "low" | "out";

export function InventoryList({
  products,
  isAdmin,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] =
    useState<StockFilter>("all");

  const categories = useMemo(() => {
    const values = new Map<string, string>();

    products.forEach((product) => {
      if (product.categories) {
        values.set(
          product.categories.id,
          product.categories.name,
        );
      }
    });

    return Array.from(values.entries());
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" ||
        product.category_id === category;

      const status = getStockStatus(product);

      const matchesStock =
        stockFilter === "all" ||
        stockFilter === status;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    });
  }, [products, search, category, stockFilter]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9C96]" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product or SKU..."
              className="pl-9"
            />
          </div>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm outline-none"
          >
            <option value="all">All categories</option>

            {categories.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(
                event.target.value as StockFilter,
              )
            }
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm outline-none"
          >
            <option value="all">All stock levels</option>
            <option value="in-stock">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8D5CD] bg-white px-6 py-14 text-center">
          <Boxes className="mx-auto size-8 text-[#9A9C96]" />

          <h3 className="mt-3 font-semibold">
            No inventory found
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#E5E2DA] bg-[#FAF9F6]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#73766F]">
                    <th className="px-5 py-4">
                      Product
                    </th>
                    <th className="px-5 py-4">
                      Category
                    </th>
                    <th className="px-5 py-4">
                      Stock
                    </th>
                    <th className="px-5 py-4">
                      Minimum
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EEECE6]">
                  {filtered.map((product) => (
                    <InventoryRow
                      key={product.id}
                      product={product}
                      isAdmin={isAdmin}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((product) => (
              <InventoryMobileCard
                key={product.id}
                product={product}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InventoryRow({
  product,
  isAdmin,
}: {
  product: InventoryProduct;
  isAdmin: boolean;
}) {
  const primaryImage = getPrimaryImage(product);
  const status = getStockStatus(product);

  return (
    <tr className="transition hover:bg-[#FCFBF8]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <ProductThumbnail
            image={primaryImage}
            name={product.name}
          />

          <div>
            <Link
              href={`/products/${product.id}`}
              className="font-medium text-[#242624] hover:text-[#244A3D]"
            >
              {product.name}
            </Link>

            <p className="mt-0.5 text-xs text-[#8A8D86]">
              {product.sku}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-[#555852]">
        {product.categories?.name ?? "—"}
      </td>

      <td className="px-5 py-4">
        <span className="font-semibold text-[#242624]">
          {product.stock_quantity}
        </span>
      </td>

      <td className="px-5 py-4 text-sm text-[#73766F]">
        {product.minimum_stock}
      </td>

      <td className="px-5 py-4">
        <StockBadge status={status} />
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          {isAdmin && (
            <StockAdjustmentDialog
              productId={product.id}
              productName={product.name}
              currentStock={product.stock_quantity}
            />
          )}

          <Link
            href={`/products/${product.id}`}
            aria-label={`View ${product.name}`}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-[#E5E2DA] transition hover:bg-[#F8F7F3]"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function InventoryMobileCard({
  product,
  isAdmin,
}: {
  product: InventoryProduct;
  isAdmin: boolean;
}) {
  const primaryImage = getPrimaryImage(product);
  const status = getStockStatus(product);

  return (
    <div className="rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <ProductThumbnail
          image={primaryImage}
          name={product.name}
        />

        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${product.id}`}
            className="font-semibold text-[#242624]"
          >
            {product.name}
          </Link>

          <p className="mt-0.5 text-xs text-[#73766F]">
            {product.sku} ·{" "}
            {product.categories?.name ?? "Uncategorized"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StockBadge status={status} />

            {!product.is_active && (
              <Badge variant="outline">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-xl bg-[#F8F7F3]">
        <div className="p-3">
          <p className="text-xs text-[#73766F]">
            Current stock
          </p>

          <p className="mt-1 font-semibold">
            {product.stock_quantity}
          </p>
        </div>

        <div className="border-l border-[#E5E2DA] p-3">
          <p className="text-xs text-[#73766F]">
            Minimum
          </p>

          <p className="mt-1 font-semibold">
            {product.minimum_stock}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-3">
          <StockAdjustmentDialog
            productId={product.id}
            productName={product.name}
            currentStock={product.stock_quantity}
          />
        </div>
      )}
    </div>
  );
}

function ProductThumbnail({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  if (!image) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#244A3D]">
        <Package className="size-5" />
      </div>
    );
  }

  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#F3F1EC]">
      <Image
        src={image}
        alt={name}
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}

function getPrimaryImage(product: InventoryProduct) {
  const images = product.product_images ?? [];

  return (
    images.find((image) => image.is_primary)
      ?.image_url ??
    [...images].sort(
      (a, b) => a.sort_order - b.sort_order,
    )[0]?.image_url
  );
}

function getStockStatus(
  product: InventoryProduct,
): StockFilter {
  if (product.stock_quantity === 0) {
    return "out";
  }

  if (
    product.stock_quantity <= product.minimum_stock
  ) {
    return "low";
  }

  return "in-stock";
}

function StockBadge({
  status,
}: {
  status: StockFilter;
}) {
  if (status === "out") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        Out of stock
      </Badge>
    );
  }

  if (status === "low") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        <AlertTriangle className="mr-1 size-3" />
        Low stock
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-green-200 bg-green-50 text-green-700"
    >
      In stock
    </Badge>
  );
}