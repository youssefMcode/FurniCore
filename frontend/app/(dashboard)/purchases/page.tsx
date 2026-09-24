import Link from "next/link";
import {
  PackagePlus,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPurchases } from "@/lib/api/purchases";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const purchases = await getPurchases();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Purchases
          </h2>

          <p className="mt-1 text-sm text-[#73766F]">
            Track inventory received from suppliers.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/purchases/new" />}
        >
          <Plus className="size-4" />
          New Purchase
        </Button>
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7D3CA] bg-white p-10 text-center">
          <PackagePlus className="mx-auto size-8 text-[#73766F]" />

          <h3 className="mt-3 font-semibold">
            No purchases yet
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Record your first supplier purchase.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E2DA] bg-[#FAF9F6] text-xs uppercase text-[#73766F]">
                <tr>
                  <th className="px-5 py-4">
                    Supplier
                  </th>
                  <th className="px-5 py-4">
                    Date
                  </th>
                  <th className="px-5 py-4">
                    Total
                  </th>
                  <th className="px-5 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b border-[#EEECE6] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/purchases/${purchase.id}`}
                        className="font-medium hover:text-[#244A3D] hover:underline"
                      >
                        {purchase.suppliers?.name ??
                          "Unknown Supplier"}
                      </Link>
                    </td>

                    <td className="px-5 py-4 text-[#73766F]">
                      {purchase.purchase_date}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      $
                      {Number(
                        purchase.total,
                      ).toFixed(2)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          purchase.status ===
                          "completed"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}