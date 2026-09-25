import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PrintInvoiceButton } from "@/components/sales/print-invoice-button";
import { Button } from "@/components/ui/button";
import { getBusinessSettings } from "@/lib/api/business-settings";
import { getSale } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/format-currency";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(new Date(value));
}

export default async function PrintInvoicePage({
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

  const settings =
    await getBusinessSettings();

  const currency = settings.currency || "USD";

  const paid = (sale.payments ?? []).reduce(
  (sum, payment) =>
    sum + Number(payment.amount),
  0,
);

const balance = Math.max(
  Number(sale.total) - paid,
  0,
);

  const refunded = (sale.returns ?? []).reduce(
    (sum, saleReturn) =>
      sum +
      Number(
        saleReturn.refund_amount ?? 0,
      ),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 print:max-w-none print:space-y-0">
      {/* Screen controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Button
          nativeButton={false}
          variant="outline"
          render={
            <Link
              href={`/sales/${sale.id}`}
            />
          }
        >
          <ArrowLeft className="size-4" />
          Sale Details
        </Button>

        <PrintInvoiceButton />
      </div>

      {/* Printable invoice */}
      <article className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* Business + invoice header */}
        <header className="flex flex-col gap-6 border-b border-[#D9D5CC] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {settings.logo_url && (
              <Image
                src={settings.logo_url}
                alt={`${settings.business_name} logo`}
                width={110}
                height={85}
                className="h-20 w-auto max-w-32 object-contain"
                unoptimized
              />
            )}

            <div>
              <h1 className="text-2xl font-bold text-[#244A3D]">
                {settings.business_name}
              </h1>

              {settings.phone && (
                <p className="mt-2 text-sm text-[#555950]">
                  {settings.phone}
                </p>
              )}

              {settings.address && (
                <p className="mt-1 max-w-sm text-sm text-[#555950]">
                  {settings.address}
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#73766F]">
              Invoice
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {sale.invoice_number}
            </h2>

            <p className="mt-2 text-sm text-[#73766F]">
              {formatDate(sale.created_at)}
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                sale.status === "completed"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {sale.status}
            </span>
          </div>
        </header>

        {/* Customer */}
        <section className="grid gap-6 border-b border-[#E5E2DA] py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#73766F]">
              Bill To
            </p>

            <p className="mt-2 font-semibold">
              {sale.customers?.name ??
                "Walk-in Customer"}
            </p>

            {sale.customers?.phone && (
              <p className="mt-1 text-sm text-[#73766F]">
                {sale.customers.phone}
              </p>
            )}

            {sale.customers?.address && (
              <p className="mt-1 text-sm text-[#73766F]">
                {sale.customers.address}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#73766F]">
              Payment
            </p>

            <p className="mt-2 text-sm">
              Paid:{" "}
              <span className="font-semibold">
                {formatCurrency(
                  Number(paid),
                  currency,
                )}
              </span>
            </p>

            <p className="mt-1 text-sm">
              Balance:{" "}
              <span className="font-semibold">
                {formatCurrency(
                  Number(balance),
                  currency,
                )}
              </span>
            </p>
          </div>
        </section>

        {/* Items */}
        <section className="py-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#D9D5CC] text-xs uppercase text-[#73766F]">
                  <th className="pb-3 pr-4">
                    Product
                  </th>

                  <th className="pb-3 pr-4 text-center">
                    Qty
                  </th>

                  <th className="pb-3 pr-4 text-right">
                    Unit Price
                  </th>

                  <th className="pb-3 pr-4 text-right">
                    Discount
                  </th>

                  <th className="pb-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.sale_items.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#EEECE6] align-top"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-medium">
                          {item.products?.name ??
                            "Product"}
                        </p>

                        {item.products?.sku && (
                          <p className="mt-1 text-xs text-[#73766F]">
                            SKU:{" "}
                            {item.products.sku}
                          </p>
                        )}

                        {item.customization &&
                          Object.keys(
                            item.customization,
                          ).length > 0 && (
                            <div className="mt-2 text-xs text-[#73766F]">
                              {Object.entries(
                                item.customization,
                              )
                                .filter(
                                  ([key]) =>
                                    key !==
                                    "extra_price",
                                )
                                .map(
                                  ([
                                    key,
                                    value,
                                  ]) => (
                                    <p key={key}>
                                      {key
                                        .replaceAll(
                                          "_",
                                          " ",
                                        )
                                        .replace(
                                          /\b\w/g,
                                          (
                                            char,
                                          ) =>
                                            char.toUpperCase(),
                                        )}
                                      :{" "}
                                      {String(
                                        value,
                                      )}
                                    </p>
                                  ),
                                )}
                            </div>
                          )}
                      </td>

                      <td className="py-4 pr-4 text-center">
                        {item.quantity}
                      </td>

                      <td className="py-4 pr-4 text-right">
                        {formatCurrency(
                          Number(
                            item.unit_price,
                          ),
                          currency,
                        )}
                      </td>

                      <td className="py-4 pr-4 text-right">
                        {formatCurrency(
                          Number(
                            item.discount,
                          ),
                          currency,
                        )}
                      </td>

                      <td className="py-4 text-right font-medium">
                        {formatCurrency(
                          Number(
                            item.line_total,
                          ),
                          currency,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Totals */}
        <section className="flex justify-end border-t border-[#E5E2DA] pt-5">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between gap-6 text-sm">
              <span className="text-[#73766F]">
                Subtotal
              </span>

              <span>
                {formatCurrency(
                  Number(sale.subtotal),
                  currency,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-6 text-sm">
              <span className="text-[#73766F]">
                Discount
              </span>

              <span>
                -
                {formatCurrency(
                  Number(sale.discount),
                  currency,
                )}
              </span>
            </div>

            {refunded > 0 && (
              <div className="flex justify-between gap-6 text-sm text-red-700">
                <span>Refunded</span>

                <span>
                  -
                  {formatCurrency(
                    refunded,
                    currency,
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-6 border-t border-[#D9D5CC] pt-3 text-lg font-semibold">
              <span>Total</span>

              <span>
                {formatCurrency(
                  Number(sale.total),
                  currency,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-6 text-sm">
              <span className="text-[#73766F]">
                Paid
              </span>

              <span>
                {formatCurrency(
                  Number(paid),
                  currency,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-6 text-sm font-semibold">
              <span>Balance</span>

              <span>
                {formatCurrency(
                  Number(balance),
                  currency,
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#E5E2DA] pt-5 text-center">
          <p className="font-medium text-[#244A3D]">
            Thank you for your business.
          </p>

          <p className="mt-1 text-xs text-[#73766F]">
            {settings.business_name}
            {settings.phone
              ? ` • ${settings.phone}`
              : ""}
          </p>
        </footer>
      </article>
    </div>
  );
}