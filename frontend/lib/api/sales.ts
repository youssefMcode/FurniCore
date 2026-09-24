import { createClient } from "@/lib/supabase/server";

export interface ReturnItem {
  id: string;
  sale_item_id: string;
  quantity: number;
  amount: number;
  restock: boolean;
}

export interface SaleReturn {
  id: string;
  refund_amount: number;
  reason: string | null;
  created_at: string;
  return_items: ReturnItem[];
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: "completed" | "cancelled";
  created_at: string;

  customers: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
  } | null;

  payments: {
    id: string;
    amount: number;
    payment_method: string;
    paid_at: string;
  }[];

  paid_amount: number;
  balance: number;
  payment_status: "paid" | "partial" | "unpaid";
}

export interface SaleDetails extends Sale {
  sale_items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    discount: number;
    customization: Record<string, unknown> | null;
    line_total: number;

    products: {
      id: string;
      name: string;
      sku: string;
    };
  }[];

  payments: {
    id: string;
    amount: number;
    payment_method: string;
    paid_at: string;
    recorded_by: string;
    notes: string | null;
  }[];

  returns: SaleReturn[];
}

async function getToken() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required.");
  }

  return session.access_token;
}

export async function getSales(): Promise<Sale[]> {
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/sales`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();

    console.error(
      "GET sales failed:",
      response.status,
      detail,
    );

    throw new Error("Unable to load sales.");
  }

  return response.json();
}

export async function getSale(
  id: string,
): Promise<SaleDetails> {
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(
    `${apiUrl}/api/sales/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("SALE_NOT_FOUND");
    }

    const detail = await response.text();

    console.error(
      "GET sale failed:",
      response.status,
      detail,
    );

    throw new Error("Unable to load sale.");
  }

  return response.json();
}