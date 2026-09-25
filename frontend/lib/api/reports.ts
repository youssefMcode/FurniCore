import { createClient } from "@/lib/supabase/server";

export interface ReportSummary {
  gross_sales: number;
  refunds: number;
  net_sales: number;
  expenses: number;
  net_revenue: number;
  outstanding_balance: number;
  sales_count: number;
  average_sale: number;
}

export interface SalesTrendItem {
  date: string;
  sales: number;
  refunds: number;
  net_sales: number;
}

export interface TopProductItem {
  product_id: string;
  name: string;
  sku: string;
  quantity_sold: number;
  revenue: number;
}

export interface ExpenseBreakdownItem {
  category: string;
  amount: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  minimum_stock: number;
}

export interface ReportsData {
  summary: ReportSummary;
  sales_trend: SalesTrendItem[];
  top_products: TopProductItem[];
  expense_breakdown: ExpenseBreakdownItem[];
  low_stock: LowStockItem[];
}

export async function getReports(
  startDate?: string,
  endDate?: string,
): Promise<ReportsData> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated.");
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  const params = new URLSearchParams();

  if (startDate) {
    params.set("start_date", startDate);
  }

  if (endDate) {
    params.set("end_date", endDate);
  }

  const query = params.toString();

  const response = await fetch(
    `${apiUrl}/api/reports${query ? `?${query}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null);

    throw new Error(
      data?.detail ??
        "Unable to load reports.",
    );
  }

  return response.json();
}