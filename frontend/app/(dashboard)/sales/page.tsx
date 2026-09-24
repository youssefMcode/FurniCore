import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SalesList } from "@/components/sales/sales-list";
import { getSales } from "@/lib/api/sales";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const sales = await getSales();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#242624] sm:text-3xl">
            Sales
          </h2>

          <p className="mt-1 text-sm text-[#73766F]">
            Review sales, payments and outstanding balances.
          </p>
        </div>

        <Button
          nativeButton={false}
          className="bg-[#244A3D] text-white hover:bg-[#19372D]"
          render={<Link href="/pos" />}
        >
          <Plus className="size-4" />
          New Sale
        </Button>
      </div>

      <SalesList sales={sales} />
    </div>
  );
}