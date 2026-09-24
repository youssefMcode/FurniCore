import { notFound } from "next/navigation";

import { PrintInvoiceButton } from "@/components/sales/print-invoice-button";
import { getSale } from "@/lib/api/sales";

export const dynamic = "force-dynamic";

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

  const totalRefunded = (sale.returns ?? []).reduce(
    (total, saleReturn) =>
      total + Number(saleReturn.refund_amount),
    0,
  );

  return (
    <div className="min-h-screen bg-[#F8F7F3] px-4 py-6 print:bg-white print:p-0 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Print Actions */}
        <div className="mb-5 flex justify-end print:hidden">
          <PrintInvoiceButton />
        </div>

        {/* Invoice */}
        <main className="rounded-2xl border border-[#E5E2DA] bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
          {/* Header */}
          <header className="flex flex-col gap-6 border-b border-[#E5E2DA] pb-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#244A3D]">
                FurniCore
              </h1>

              <p className="mt-1 text-sm text-[#73766F]">
                Furniture Showroom
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#73766F]">
                Invoice
              </p>

              <h2 className="mt-1 text-xl font-semibold text-[#242624]">
                {sale.invoice_number}
              </h2>

              <p className="mt-2 text-sm text-[#73766F]">
                {new Date(
                  sale.created_at,
                ).toLocaleString()}
              </p>

              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  sale.status === "cancelled"
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {sale.status.toUpperCase()}
              </span>
            </div>
          </header>

          {/* Customer */}
          <section className="grid gap-6 border-b border-[#E5E2DA] py-7 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#73766F]">
                Customer
              </p>

              <p className="mt-2 font-semibold text-[#242624]">
                {sale.customers?.name ??
                  "Walk-in Customer"}
              </p>

              {sale.customers && (
                <div className="mt-1 space-y-1 text-sm text-[#73766F]">
                  <p>{sale.customers.phone}</p>

                  {sale.customers.address && (
                    <p>
                      {sale.customers.address}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#73766F]">
                Payment Status
              </p>

              <p className="mt-2 font-semibold capitalize text-[#242624]">
                {sale.payment_status}
              </p>

              <p className="mt-1 text-sm text-[#73766F]">
                Paid: $
                {Number(
                  sale.paid_amount,
                ).toFixed(2)}
              </p>
            </div>
          </section>

          {/* Items */}
          <section className="py-7">
            <h3 className="mb-4 font-semibold text-[#242624]">
              Items
            </h3>

            {/* Desktop */}
            <div className="hidden overflow-hidden rounded-xl border border-[#E5E2DA] sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F7F3] text-xs uppercase text-[#73766F]">
                  <tr>
                    <th className="px-4 py-3">
                      Product
                    </th>

                    <th className="px-4 py-3 text-center">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-right">
                      Unit Price
                    </th>

                    <th className="px-4 py-3 text-right">
                      Discount
                    </th>

                    <th className="px-4 py-3 text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EEECE6]">
                  {sale.sale_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {item.products.name}
                        </p>

                        <p className="mt-1 text-xs text-[#73766F]">
                          {item.products.sku}
                        </p>

                        {item.customization &&
                          Object.keys(
                            item.customization,
                          ).length > 0 && (
                            <div className="mt-2 text-xs text-[#73766F]">
                              {Object.entries(
                                item.customization,
                              ).map(
                                ([key, value]) =>
                                  value !== null &&
                                  value !==
                                    undefined &&
                                  value !== "" ? (
                                    <p key={key}>
                                      <span className="capitalize">
                                        {key.replace(
                                          /_/g,
                                          " ",
                                        )}
                                      </span>
                                      :{" "}
                                      {String(value)}
                                    </p>
                                  ) : null,
                              )}
                            </div>
                          )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-4 text-right">
                        $
                        {Number(
                          item.unit_price,
                        ).toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        $
                        {Number(
                          item.discount,
                        ).toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right font-semibold">
                        $
                        {Number(
                          item.line_total,
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="space-y-3 sm:hidden">
              {sale.sale_items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#E5E2DA] p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.products.name}
                      </p>

                      <p className="mt-1 text-xs text-[#73766F]">
                        {item.products.sku}
                      </p>
                    </div>

                    <p className="font-semibold">
                      $
                      {Number(
                        item.line_total,
                      ).toFixed(2)}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-[#73766F]">
                    {item.quantity} × $
                    {Number(
                      item.unit_price,
                    ).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Totals */}
          <section className="flex justify-end border-t border-[#E5E2DA] pt-6">
            <div className="w-full space-y-3 text-sm sm:max-w-xs">
              <InvoiceRow
                label="Subtotal"
                value={sale.subtotal}
              />

              <InvoiceRow
                label="Discount"
                value={-Number(sale.discount)}
              />

              <div className="border-t border-[#E5E2DA] pt-3">
                <InvoiceRow
                  label="Total"
                  value={sale.total}
                  strong
                />
              </div>

              <InvoiceRow
                label="Paid"
                value={sale.paid_amount}
              />

              {totalRefunded > 0 && (
                <InvoiceRow
                  label="Refunded"
                  value={-totalRefunded}
                />
              )}

              <div className="border-t border-[#E5E2DA] pt-3">
                <InvoiceRow
                  label="Balance"
                  value={sale.balance}
                  strong
                />
              </div>
            </div>
          </section>

          {/* Payments */}
          {sale.payments.length > 0 && (
            <section className="mt-8 border-t border-[#E5E2DA] pt-6">
              <h3 className="font-semibold">
                Payment History
              </h3>

              <div className="mt-3 space-y-2">
                {sale.payments.map(
                  (payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <div>
                        <span className="capitalize">
                          {payment.payment_method.replace(
                            /_/g,
                            " ",
                          )}
                        </span>

                        <span className="ml-2 text-xs text-[#73766F]">
                          {new Date(
                            payment.paid_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <span className="font-medium">
                        $
                        {Number(
                          payment.amount,
                        ).toFixed(2)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Returns */}
          {sale.returns?.length > 0 && (
            <section className="mt-8 border-t border-[#E5E2DA] pt-6">
              <h3 className="font-semibold">
                Returns & Refunds
              </h3>

              <div className="mt-3 space-y-3">
                {sale.returns.map(
                  (saleReturn) => (
                    <div
                      key={saleReturn.id}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <div>
                        <p>
                          Return ·{" "}
                          {new Date(
                            saleReturn.created_at,
                          ).toLocaleDateString()}
                        </p>

                        {saleReturn.reason && (
                          <p className="mt-1 text-xs text-[#73766F]">
                            {saleReturn.reason}
                          </p>
                        )}
                      </div>

                      <span className="font-medium text-red-700">
                        -$
                        {Number(
                          saleReturn.refund_amount,
                        ).toFixed(2)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-10 border-t border-[#E5E2DA] pt-6 text-center">
            <p className="text-sm font-medium text-[#244A3D]">
              Thank you for your business.
            </p>

            <p className="mt-1 text-xs text-[#73766F]">
              Generated by FurniCore
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function InvoiceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-5">
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