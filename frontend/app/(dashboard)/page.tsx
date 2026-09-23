import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  HandCoins,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { LowStock } from "@/components/dashboard/low-stock";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardData } from "@/lib/api/dashboard";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  let data;

  try {
    data = await getDashboardData();
  } catch (error) {
    console.error("Dashboard loading error:", error);

    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-[#242624]">
            Dashboard could not be loaded
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#73766F]">
            We could not retrieve the latest business data. Make sure
            the FurniCore API is running and try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Intro */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#B8895B]">
            Business overview
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
            Welcome back, {profile.name}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73766F] sm:text-base">
            Here&apos;s the latest overview of your showroom&apos;s
            sales, finances and inventory.
          </p>
        </div>

        <div className="w-fit rounded-full border border-[#E5E2DA] bg-white px-3 py-1.5 text-xs font-medium text-[#73766F]">
          Live business data
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Today's Sales"
          value={formatMoney(summary.today_sales)}
          description="Completed sales today"
          icon={Banknote}
        />

        <StatCard
          title="Monthly Revenue"
          value={formatMoney(summary.monthly_revenue)}
          description="Completed sales this month"
          icon={TrendingUp}
        />

        <StatCard
          title="Expenses"
          value={formatMoney(summary.monthly_expenses)}
          description="Operational expenses this month"
          icon={CircleDollarSign}
        />

        <StatCard
          title="Estimated Profit"
          value={formatMoney(summary.estimated_profit)}
          description="Revenue minus expenses"
          icon={WalletCards}
        />

        <StatCard
          title="Outstanding"
          value={formatMoney(summary.outstanding_balance)}
          description="Remaining customer balances"
          icon={HandCoins}
          warning={summary.outstanding_balance > 0}
        />

        <StatCard
          title="Low Stock"
          value={summary.low_stock_count.toString()}
          description="Products requiring attention"
          icon={AlertTriangle}
          warning={summary.low_stock_count > 0}
        />
      </section>

      {/* Chart */}
      <SalesChart data={data.sales_trend} />

      {/* Operational sections */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentSales sales={data.recent_sales} />

        <LowStock products={data.low_stock_products} />
      </section>
    </div>
  );
}