import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  PackageSearch,
  ReceiptText,
  ShoppingBag,
  WalletCards,
} from "lucide-react";

import { ExpenseChart } from "@/components/reports/expense-chart";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { SalesChart } from "@/components/reports/sales-chart";
import { getCurrentUserProfile } from "@/lib/auth";
import { getBusinessSettings } from "@/lib/api/business-settings";
import { getReports } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/format-currency";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function formatCategory(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    start?: string;
    end?: string;
  }>;
}) {
  const profile =
    await getCurrentUserProfile();

  if (profile.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;

  const [reports, settings] =
    await Promise.all([
      getReports(
        params.start,
        params.end,
      ),
      getBusinessSettings(),
    ]);

  const currency =
    settings.currency || "USD";

  const trend = reports.sales_trend;

  const actualStart =
    trend[0]?.date ?? "";

  const actualEnd =
    trend[trend.length - 1]?.date ?? "";

  const summary = reports.summary;

  const cards = [
    {
      title: "Gross Sales",
      value: formatCurrency(
        summary.gross_sales,
        currency,
      ),
      description: `${summary.sales_count} completed sales`,
      icon: CircleDollarSign,
    },
    {
      title: "Refunds",
      value: formatCurrency(
        summary.refunds,
        currency,
      ),
      description:
        "Processed customer returns",
      icon: ArrowDownRight,
    },
    {
      title: "Net Sales",
      value: formatCurrency(
        summary.net_sales,
        currency,
      ),
      description:
        "Gross sales minus refunds",
      icon: ArrowUpRight,
    },
    {
      title: "Expenses",
      value: formatCurrency(
        summary.expenses,
        currency,
      ),
      description:
        "Operating expenses",
      icon: ReceiptText,
    },
    {
      title: "Net Revenue",
      value: formatCurrency(
        summary.net_revenue,
        currency,
      ),
      description:
        "Net sales minus expenses",
      icon: Banknote,
    },
    {
      title: "Outstanding",
      value: formatCurrency(
        summary.outstanding_balance,
        currency,
      ),
      description:
        "Unpaid customer balances",
      icon: WalletCards,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8895B]">
            Business Analytics
          </p>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Reports
          </h1>

          <p className="mt-1 text-sm text-[#73766F]">
            Sales, expenses and inventory
            performance for{" "}
            {settings.business_name}.
          </p>
        </div>

        {actualStart && actualEnd && (
          <p className="text-sm text-[#73766F]">
            {formatDate(actualStart)}
            {" — "}
            {formatDate(actualEnd)}
          </p>
        )}
      </div>

      {/* Filters */}
      <ReportsFilters
        startDate={params.start ?? ""}
        endDate={params.end ?? ""}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1900px]:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#73766F]">
                    {card.title}
                  </p>

                  <p className="mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                    {card.value}
                  </p>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#244A3D]">
                  <Icon className="size-5" />
                </div>
              </div>

              <p className="mt-3 text-xs text-[#73766F]">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Sales Trend
            </h2>

            <p className="mt-1 text-sm text-[#73766F]">
              Net sales after refunds.
            </p>
          </div>

          <SalesChart
            data={reports.sales_trend}
            currency={currency}
          />
        </section>

        <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Expense Breakdown
            </h2>

            <p className="mt-1 text-sm text-[#73766F]">
              Spending grouped by
              category.
            </p>
          </div>

          <ExpenseChart
            data={
              reports.expense_breakdown
            }
            currency={currency}
          />
        </section>
      </div>

      {/* Average + Top products */}
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#F3EFE8] text-[#B8895B]">
              <ShoppingBag className="size-5" />
            </div>

            <div>
              <p className="text-sm text-[#73766F]">
                Average Sale
              </p>

              <p className="text-2xl font-semibold">
                {formatCurrency(
                  summary.average_sale,
                  currency,
                )}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-[#73766F]">
            Average value of completed
            sales during the selected
            reporting period.
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
          <div className="border-b border-[#E5E2DA] p-5 sm:p-6">
            <h2 className="font-semibold">
              Top Products
            </h2>

            <p className="mt-1 text-sm text-[#73766F]">
              Highest-selling products by
              quantity.
            </p>
          </div>

          {reports.top_products.length ===
          0 ? (
            <div className="p-8 text-center text-sm text-[#73766F]">
              No product sales in this
              period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-[#E5E2DA] bg-[#FAF9F6] text-left text-xs uppercase tracking-wide text-[#73766F]">
                    <th className="px-5 py-3">
                      Product
                    </th>

                    <th className="px-5 py-3">
                      SKU
                    </th>

                    <th className="px-5 py-3 text-right">
                      Qty Sold
                    </th>

                    <th className="px-5 py-3 text-right">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reports.top_products.map(
                    (product) => (
                      <tr
                        key={
                          product.product_id
                        }
                        className="border-b border-[#EEECE6] last:border-0"
                      >
                        <td className="px-5 py-4 font-medium">
                          <Link
                            href={`/products/${product.product_id}`}
                            className="hover:text-[#244A3D] hover:underline"
                          >
                            {product.name}
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-[#73766F]">
                          {product.sku}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {
                            product.quantity_sold
                          }
                        </td>

                        <td className="px-5 py-4 text-right font-medium">
                          {formatCurrency(
                            product.revenue,
                            currency,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Expense details + Low stock */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold">
            Expenses by Category
          </h2>

          <div className="mt-5 space-y-3">
            {reports.expense_breakdown
              .length === 0 ? (
              <p className="text-sm text-[#73766F]">
                No expenses in this period.
              </p>
            ) : (
              reports.expense_breakdown.map(
                (expense) => (
                  <div
                    key={expense.category}
                    className="flex items-center justify-between gap-4 rounded-xl bg-[#F8F7F3] px-4 py-3"
                  >
                    <span className="text-sm font-medium">
                      {formatCategory(
                        expense.category,
                      )}
                    </span>

                    <span className="text-sm font-semibold">
                      {formatCurrency(
                        expense.amount,
                        currency,
                      )}
                    </span>
                  </div>
                ),
              )
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <PackageSearch className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Low Stock
              </h2>

              <p className="text-sm text-[#73766F]">
                Products at or below their
                minimum stock.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reports.low_stock.length ===
            0 ? (
              <p className="text-sm text-[#73766F]">
                No low-stock products.
              </p>
            ) : (
              reports.low_stock
                .slice(0, 8)
                .map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#EEECE6] px-4 py-3 transition hover:bg-[#F8F7F3]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>

                      <p className="text-xs text-[#73766F]">
                        {product.sku}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-amber-700">
                        {
                          product.stock_quantity
                        }{" "}
                        left
                      </p>

                      <p className="text-xs text-[#73766F]">
                        Min{" "}
                        {
                          product.minimum_stock
                        }
                      </p>
                    </div>
                  </Link>
                ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}