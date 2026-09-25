"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ExpenseBreakdownItem } from "@/lib/api/reports";

function formatCategory(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

export function ExpenseChart({
  data,
  currency,
}: {
  data: ExpenseBreakdownItem[];
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
    label: formatCategory(
      item.category,
    ),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-[#73766F]">
        No expenses in this period.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
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
    "Expenses",
  ]}
/>

          <Bar
            dataKey="amount"
            name="Expenses"
            fill="#B8895B"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}