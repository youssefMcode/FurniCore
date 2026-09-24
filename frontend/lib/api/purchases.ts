import { createClient } from "@/lib/supabase/server";

export interface PurchaseListItem {
  id: string;
  supplier_id: string;
  purchase_date: string;
  total: number;
  status: "completed" | "cancelled";
  created_at: string;
  suppliers: {
    id: string;
    name: string;
  } | null;
}

export interface PurchaseItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  products: {
    id: string;
    name: string;
    sku: string;
  } | null;
}

export interface Purchase {
  id: string;
  supplier_id: string;
  created_by: string;
  purchase_date: string;
  total: number;
  receipt_url: string | null;
  notes: string | null;
  status: "completed" | "cancelled";
  created_at: string;

  suppliers: {
    id: string;
    name: string;
    phone: string | null;
  } | null;

  purchase_items: PurchaseItem[];
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

export async function getPurchases(
  supplierId?: string,
): Promise<PurchaseListItem[]> {
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const url = new URL(`${apiUrl}/api/purchases`);

  if (supplierId) {
    url.searchParams.set("supplier_id", supplierId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load purchases.");
  }

  return response.json();
}

export async function getPurchase(
  id: string,
): Promise<Purchase> {
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(
    `${apiUrl}/api/purchases/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    throw new Error("PURCHASE_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("Unable to load purchase.");
  }

  return response.json();
}