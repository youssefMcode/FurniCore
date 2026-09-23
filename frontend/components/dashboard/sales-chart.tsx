"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SalesTrendItem } from "@/lib/api/dashboard";

interface SalesChartProps {
  data: SalesTrendItem[];
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    day: formatDay(item.date),
  }));

  const hasRevenue = data.some((item) => item.revenue > 0);

  return (
    <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#242624]">
          Sales Trend
        </h3>

        <p className="mt-1 text-sm text-[#73766F]">
          Revenue performance over the last 7 days
        </p>
      </div>

      {!hasRevenue && (
        <div className="mb-4 rounded-lg bg-[#F8F7F3] px-4 py-3 text-sm text-[#73766F]">
          No sales have been recorded during this period yet.
        </div>
      )}

      <div className="h-[280px] w-full sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -15,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="revenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#244A3D"
                  stopOpacity={0.22}
                />
                <stop
                  offset="95%"
                  stopColor="#244A3D"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#EEECE6"
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#73766F",
                fontSize: 12,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#73766F",
                fontSize: 12,
              }}
              tickFormatter={(value) => `$${value}`}
            />

            <Tooltip
              formatter={(value) => [
                `$${Number(value ?? 0).toFixed(2)}`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #E5E2DA",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#244A3D"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}