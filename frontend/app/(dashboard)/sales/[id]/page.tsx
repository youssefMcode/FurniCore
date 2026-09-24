import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  ReceiptText,
} from "lucide-react";

import { AddPaymentDialog } from "@/components/sales/add-payment-dialog";
import { CancelSaleButton } from "@/components/sales/cancel-sale-button";
import { ReturnSaleDialog } from "@/components/sales/return-sale-dialog";
import { Button } from "@/components/ui/button";
import { getSale } from "@/lib/api/sales";

export const dynamic = "force-dynamic";

export default async function SaleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let sale;

  try {
    sale = await getSale(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SALE_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }

  const isCancelled = sale.status === "cancelled";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/sales"
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
          >
            <ArrowLeft className="size-4" />
            Sales
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#244A3D]">
              <ReceiptText className="size-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold text-[#242624] sm:text-3xl">
                  {sale.invoice_number}
                </h2>

                {isCancelled && (
                  <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    CANCELLED
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-[#73766F]">
                {new Date(
                  sale.created_at,
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Button
          nativeButton={false}
          variant="outline"
          render={
            <Link href={`/sales/${sale.id}/print`} />
          }
        >
          <Printer className="size-4" />
          Print Invoice
        </Button>
      </div>

      {/* Cancelled Notice */}
      {isCancelled && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            This sale has been cancelled. Its sold
            quantities were restored to inventory.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {/* Customer */}
          <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-semibold">
              Customer
            </h3>

            <div className="mt-4">
              <p className="font-medium">
                {sale.customers?.name ??
                  "Walk-in customer"}
              </p>

              {sale.customers && (
                <>
                  <p className="mt-1 text-sm text-[#73766F]">
                    {sale.customers.phone}
                  </p>

                  {sale.customers.address && (
                    <p className="mt-1 text-sm text-[#73766F]">
                      {sale.customers.address}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Sale Items */}
          <section className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
            <div className="border-b border-[#EEECE6] p-5">
              <h3 className="font-semibold">
                Sale Items
              </h3>
            </div>

            <div className="divide-y divide-[#EEECE6]">
              {sale.sale_items.map((item) => (
                <div
                  key={item.id}
                  className="p-5"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {item.products.name}
                      </p>

                      <p className="mt-1 text-xs text-[#73766F]">
                        {item.products.sku} · Qty{" "}
                        {item.quantity} × $
                        {Number(
                          item.unit_price,
                        ).toFixed(2)}
                      </p>
                    </div>

                    <p className="font-semibold">
                      $
                      {Number(
                        item.line_total,
                      ).toFixed(2)}
                    </p>
                  </div>

                  {Number(item.discount) > 0 && (
                    <p className="mt-2 text-xs text-[#73766F]">
                      Item discount: -$
                      {Number(
                        item.discount,
                      ).toFixed(2)}
                    </p>
                  )}

                  {item.customization &&
                    Object.keys(
                      item.customization,
                    ).length > 0 && (
                      <div className="mt-3 rounded-xl bg-[#FBF5EF] p-3">
                        <p className="text-xs font-semibold text-[#8A6039]">
                          Customization
                        </p>

                        <div className="mt-2 grid gap-1 text-xs text-[#73766F] sm:grid-cols-2">
                          {Object.entries(
                            item.customization,
                          ).map(
                            ([key, value]) =>
                              value !== null &&
                              value !== undefined &&
                              value !== "" ? (
                                <p key={key}>
                                  <span className="capitalize">
                                    {key.replace(
                                      /_/g,
                                      " ",
                                    )}
                                  </span>
                                  : {String(value)}
                                </p>
                              ) : null,
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </section>

          {/* Payments */}
          <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm">
            <h3 className="font-semibold">
              Payments
            </h3>

            {sale.payments.length === 0 ? (
              <p className="mt-3 text-sm text-[#73766F]">
                No payments recorded.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[#EEECE6]">
                {sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between gap-4 py-3 first:pt-0"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {payment.payment_method.replace(
                          /_/g,
                          " ",
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[#73766F]">
                        {new Date(
                          payment.paid_at,
                        ).toLocaleString()}
                      </p>

                      {payment.notes && (
                        <p className="mt-1 text-xs text-[#73766F]">
                          {payment.notes}
                        </p>
                      )}
                    </div>

                    <p className="font-semibold text-green-700">
                      +$
                      {Number(
                        payment.amount,
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Returns & Refunds */}
          {sale.returns?.length > 0 && (
            <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm">
              <h3 className="font-semibold">
                Returns & Refunds
              </h3>

              <div className="mt-4 divide-y divide-[#EEECE6]">
                {sale.returns.map((saleReturn) => (
                  <div
                    key={saleReturn.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          Return
                        </p>

                        <p className="mt-1 text-xs text-[#73766F]">
                          {new Date(
                            saleReturn.created_at,
                          ).toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-[#73766F]">
                          {saleReturn.return_items.reduce(
                            (total, item) =>
                              total +
                              Number(item.quantity),
                            0,
                          )}{" "}
                          item(s) returned
                        </p>
                      </div>

                      <p className="font-semibold text-red-700">
                        -$
                        {Number(
                          saleReturn.refund_amount,
                        ).toFixed(2)}
                      </p>
                    </div>

                    {saleReturn.reason && (
                      <p className="mt-2 text-sm text-[#73766F]">
                        Reason: {saleReturn.reason}
                      </p>
                    )}

                    <div className="mt-3 space-y-1">
                      {saleReturn.return_items.map(
                        (item) => {
                          const saleItem =
                            sale.sale_items.find(
                              (saleItem) =>
                                saleItem.id ===
                                item.sale_item_id,
                            );

                          return (
                            <div
                              key={item.id}
                              className="flex justify-between gap-3 text-xs text-[#73766F]"
                            >
                              <span>
                                {saleItem?.products
                                  .name ??
                                  "Sale item"}{" "}
                                × {item.quantity}
                                {item.restock
                                  ? " · Restocked"
                                  : " · Not restocked"}
                              </span>

                              <span>
                                $
                                {Number(
                                  item.amount,
                                ).toFixed(2)}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Payment Summary */}
        <aside className="h-fit rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">
              Payment Summary
            </h3>

            {isCancelled && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                CANCELLED
              </span>
            )}
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <Row
              label="Subtotal"
              value={sale.subtotal}
            />

            <Row
              label="Discount"
              value={-Number(sale.discount)}
            />

            <div className="border-t border-[#EEECE6] pt-3">
              <Row
                label="Total"
                value={sale.total}
                strong
              />
            </div>

            <Row
              label="Paid"
              value={sale.paid_amount}
            />

            <div className="border-t border-[#EEECE6] pt-3">
              <Row
                label="Balance"
                value={sale.balance}
                strong
              />
            </div>
          </div>

          <div className="mt-5">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                sale.payment_status === "paid"
                  ? "bg-green-50 text-green-700"
                  : sale.payment_status === "partial"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {sale.payment_status.toUpperCase()}
            </span>
          </div>

          {/* Sale Actions */}
          {!isCancelled && (
            <div className="mt-6 space-y-3 border-t border-[#EEECE6] pt-5">
              {sale.balance > 0 && (
                <AddPaymentDialog
                  saleId={sale.id}
                  balance={sale.balance}
                />
              )}

              <ReturnSaleDialog sale={sale} />

              <CancelSaleButton
                saleId={sale.id}
              />
            </div>
          )}
        </aside>
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
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#73766F]">
        {label}
      </span>

      <span
        className={
          strong
            ? "text-lg font-semibold text-[#244A3D]"
            : "font-medium"
        }
      >
        {value < 0 ? "-" : ""}$
        {Math.abs(Number(value)).toFixed(2)}
      </span>
    </div>
  );
}