import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  NotebookText,
  Pencil,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCustomer,
  getCustomerSales,
} from "@/lib/api/customers";

export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let customer;
  let sales;

  try {
    const [customerData, customerSales] =
      await Promise.all([
        getCustomer(id),
        getCustomerSales(id),
      ]);

    customer = customerData;
    sales = customerSales;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CUSTOMER_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/customers"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Customers
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#EEF3F0] text-[#244A3D]">
              <UserRound className="size-6" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-[#242624] sm:text-3xl">
                {customer.name}
              </h2>

              <p className="mt-1 text-sm text-[#73766F]">
                Customer profile
              </p>
            </div>
          </div>

          <Button
            nativeButton={false}
            className="bg-[#244A3D] text-white hover:bg-[#19372D]"
            render={
              <Link
                href={`/customers/${customer.id}/edit`}
              />
            }
          >
            <Pencil className="size-4" />
            Edit Customer
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-semibold text-[#242624]">
              Contact Information
            </h3>

            <div className="mt-5 space-y-5">
              <InfoRow
                icon={Phone}
                label="Phone"
                value={customer.phone}
              />

              <InfoRow
                icon={MapPin}
                label="Address"
                value={
                  customer.address ||
                  "No address provided"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <NotebookText className="size-4 text-[#244A3D]" />

              <h3 className="font-semibold text-[#242624]">
                Notes
              </h3>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#73766F]">
              {customer.notes ||
                "No notes have been added for this customer."}
            </p>
          </section>
        </div>

        {/* REAL PURCHASE HISTORY */}
        <section className="h-fit rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#244A3D]">
            <ReceiptText className="size-4" />
          </div>

          <h3 className="mt-4 font-semibold text-[#242624]">
            Purchase History
          </h3>

          {sales.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[#73766F]">
              No recorded sales for this customer yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#EEECE6]">
              {sales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="group flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#242624] transition group-hover:text-[#244A3D]">
                      {sale.invoice_number}
                    </p>

                    <p className="mt-1 text-xs text-[#73766F]">
                      {new Date(
                        sale.created_at,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-[#242624]">
                      $
                      {Number(
                        sale.total,
                      ).toFixed(2)}
                    </p>

                    {sale.status ===
                    "cancelled" ? (
                      <p className="mt-1 text-xs font-medium text-red-700">
                        Cancelled
                      </p>
                    ) : sale.balance > 0 ? (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        $
                        {Number(
                          sale.balance,
                        ).toFixed(2)}{" "}
                        due
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-medium text-green-700">
                        Paid
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F8F7F3] text-[#244A3D]">
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-xs text-[#8A8D86]">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-[#242624]">
          {value}
        </p>
      </div>
    </div>
  );
}