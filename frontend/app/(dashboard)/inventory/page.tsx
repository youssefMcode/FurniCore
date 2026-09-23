import {
  AlertTriangle,
  Boxes,
  CircleX,
  PackageCheck,
} from "lucide-react";

import { InventoryList } from "@/components/inventory/inventory-list";
import { getInventory } from "@/lib/api/inventory";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [profile, products] = await Promise.all([
    getCurrentUserProfile(),
    getInventory(),
  ]);

  const activeProducts = products.filter(
    (product) => product.is_active,
  );

  const outOfStock = activeProducts.filter(
    (product) => product.stock_quantity === 0,
  ).length;

  const lowStock = activeProducts.filter(
    (product) =>
      product.stock_quantity > 0 &&
      product.stock_quantity <=
        product.minimum_stock,
  ).length;

  const healthy = activeProducts.filter(
    (product) =>
      product.stock_quantity >
      product.minimum_stock,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
          Inventory
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Monitor product quantities and low-stock
          levels.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Boxes}
          label="Active Products"
          value={activeProducts.length}
        />

        <SummaryCard
          icon={PackageCheck}
          label="Healthy Stock"
          value={healthy}
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStock}
          warning
        />

        <SummaryCard
          icon={CircleX}
          label="Out of Stock"
          value={outOfStock}
          danger
        />
      </div>

      <InventoryList
        products={products}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  warning = false,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  warning?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm">
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${
          danger
            ? "bg-red-50 text-red-700"
            : warning
              ? "bg-amber-50 text-amber-700"
              : "bg-[#EEF3F0] text-[#244A3D]"
        }`}
      >
        <Icon className="size-4" />
      </div>

      <p className="mt-4 text-sm text-[#73766F]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-[#242624]">
        {value}
      </p>
    </div>
  );
}