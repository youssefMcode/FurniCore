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

import type { SalesTrendItem } from "@/lib/api/reports";

export function SalesChart({
  data,
  currency,
}: {
  data: SalesTrendItem[];
  currency: string;
}) {
  const formatter = new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  );

  const chartData = data.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      },
    ).format(
      new Date(`${item.date}T00:00:00Z`),
    ),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            minTickGap={24}
          />

          <YAxis
            tick={{ fontSize: 11 }}
            width={70}
            tickFormatter={(value) =>
              formatter.format(value)
            }
          />

       <Tooltip
  formatter={(value) => [
    formatter.format(Number(value ?? 0)),
    "Net Sales",
  ]}
/>

          <Area
            type="monotone"
            dataKey="net_sales"
            name="Net Sales"
            stroke="#244A3D"
            fill="#EEF3F0"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}