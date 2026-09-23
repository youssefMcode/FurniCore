import { createClient } from "@/lib/supabase/server";

export interface DashboardSummary {
  today_sales: number;
  monthly_revenue: number;
  monthly_expenses: number;
  estimated_profit: number;
  outstanding_balance: number;
  low_stock_count: number;
}

export interface SalesTrendItem {
  date: string;
  revenue: number;
  sales: number;
}

export interface RecentSale {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  status: "completed" | "cancelled";
  created_at: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  minimum_stock: number;
  image_url: string | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  sales_trend: SalesTrendItem[];
  recent_sales: RecentSale[];
  low_stock_products: LowStockProduct[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication session not found.");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/dashboard/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Dashboard request failed with status ${response.status}.`,
    );
  }

  return response.json();
}