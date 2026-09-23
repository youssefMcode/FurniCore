import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  PackageOpen,
} from "lucide-react";

import type { LowStockProduct } from "@/lib/api/dashboard";

interface LowStockProps {
  products: LowStockProduct[];
}

export function LowStock({ products }: LowStockProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-[#EEECE6] px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-lg font-semibold text-[#242624]">
            Low Stock
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Products that need attention
          </p>
        </div>

        <Link
          href="/inventory"
          className="hidden items-center gap-1 text-sm font-medium text-[#244A3D] hover:underline sm:flex"
        >
          Inventory
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EEF3F0] text-[#244A3D]">
            <PackageOpen className="size-5" />
          </div>

          <p className="mt-4 font-medium text-[#242624]">
            Stock levels look good
          </p>

          <p className="mt-1 max-w-xs text-sm text-[#73766F]">
            No active products are currently at or below their minimum stock.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEECE6]">
          {products.map((product) => (
            <Link
              href={`/products/${product.id}`}
              key={product.id}
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#FAF9F6] sm:px-6"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#242624]">
                  {product.name}
                </p>

                <p className="mt-0.5 text-xs text-[#73766F]">
                  {product.sku}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-amber-700">
                  {product.stock_quantity} left
                </p>

                <p className="text-xs text-[#9A9C96]">
                  Min {product.minimum_stock}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}