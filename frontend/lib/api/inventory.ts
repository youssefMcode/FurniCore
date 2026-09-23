import { createClient } from "@/lib/supabase/server";
import type { ProductImage } from "@/lib/api/products";

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  stock_quantity: number;
  minimum_stock: number;
  is_active: boolean;

  categories: {
    id: string;
    name: string;
  } | null;

  product_images: ProductImage[];
}

export async function getInventory(): Promise<
  InventoryProduct[]
> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required.");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/inventory`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();

    console.error(
      "GET /api/inventory failed:",
      response.status,
      detail,
    );

    throw new Error("Unable to load inventory.");
  }

  return response.json();
}