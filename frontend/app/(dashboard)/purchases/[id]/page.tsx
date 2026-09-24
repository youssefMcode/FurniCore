import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CancelPurchaseButton } from "@/components/purchases/cancel-purchase-button";
import { getPurchase } from "@/lib/api/purchases";

export const dynamic = "force-dynamic";

export default async function PurchaseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let purchase;

  try {
    purchase = await getPurchase(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PURCHASE_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/purchases"
            className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
          >
            <ArrowLeft className="size-4" />
            Purchases
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Purchase
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                purchase.status === "completed"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {purchase.status}
            </span>
          </div>

          <p className="mt-1 font-mono text-xs text-[#73766F]">
            {purchase.id}
          </p>
        </div>

        {purchase.status === "completed" && (
          <CancelPurchaseButton
            purchaseId={purchase.id}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm lg:col-span-2 sm:p-6">
          <h3 className="font-semibold">
            Purchase Items
          </h3>

          <div className="mt-5 space-y-3">
            {purchase.purchase_items.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#EEECE6] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {item.products?.name ??
                        "Unknown Product"}
                    </p>

                    <p className="mt-1 text-xs text-[#73766F]">
                      {item.products?.sku}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-sm sm:text-right">
                    <div>
                      <p className="text-xs text-[#73766F]">
                        Qty
                      </p>
                      <p className="font-medium">
                        {item.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#73766F]">
                        Cost
                      </p>
                      <p className="font-medium">
                        $
                        {Number(
                          item.unit_cost,
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#73766F]">
                        Total
                      </p>
                      <p className="font-semibold">
                        $
                        {Number(
                          item.line_total,
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-semibold">
            Summary
          </h3>

          <div className="mt-5 space-y-4 text-sm">
            <Row
              label="Supplier"
              value={
                purchase.suppliers?.name ??
                "Unknown"
              }
            />

            <Row
              label="Purchase Date"
              value={purchase.purchase_date}
            />

            <Row
              label="Total"
              value={`$${Number(
                purchase.total,
              ).toFixed(2)}`}
              strong
            />
          </div>

          {purchase.notes && (
            <div className="mt-5 border-t border-[#EEECE6] pt-5">
              <p className="text-xs font-semibold uppercase text-[#73766F]">
                Notes
              </p>

              <p className="mt-2 text-sm">
                {purchase.notes}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#73766F]">
        {label}
      </span>

      <span
        className={
          strong
            ? "font-semibold"
            : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}