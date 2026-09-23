import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RecentSale } from "@/lib/api/dashboard";

interface RecentSalesProps {
  sales: RecentSale[];
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-[#EEECE6] px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-lg font-semibold text-[#242624]">
            Recent Sales
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Latest showroom transactions
          </p>
        </div>

        <Link
          href="/sales"
          className="hidden items-center gap-1 text-sm font-medium text-[#244A3D] hover:underline sm:flex"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EEF3F0] text-[#244A3D]">
            <ReceiptText className="size-5" />
          </div>

          <p className="mt-4 font-medium text-[#242624]">
            No sales yet
          </p>

          <p className="mt-1 max-w-xs text-sm text-[#73766F]">
            Completed sales will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEECE6]">
          {sales.map((sale) => (
            <Link
              href={`/sales/${sale.id}`}
              key={sale.id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#FAF9F6] sm:px-6"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#242624]">
                    {sale.invoice_number}
                  </p>

                  <Badge
                    variant="outline"
                    className={
                      sale.status === "completed"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {sale.status}
                  </Badge>
                </div>

                <p className="mt-1 truncate text-sm text-[#73766F]">
                  {sale.customer_name} · {formatDate(sale.created_at)}
                </p>
              </div>

              <p className="shrink-0 font-semibold text-[#242624]">
                {formatMoney(sale.total)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}