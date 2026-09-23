import { createClient } from "@/lib/supabase/server";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id?: string;
  name: string;
  sku: string;
  description: string | null;
product_images: ProductImage[];
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  is_customizable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
  } | null;
}

export interface ProductPayload {
  name: string;
  sku: string;
  category_id: string;
  description?: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity?: number;
  minimum_stock: number;
  is_customizable: boolean;
  is_active: boolean;
}

async function getAccessToken() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication session not found.");
  }

  return session.access_token;
}

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return apiUrl;
}

export async function getProducts(): Promise<Product[]> {
  const token = await getAccessToken();

  const response = await fetch(`${getApiUrl()}/api/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

if (!response.ok) {
  const errorText = await response.text();

  console.error(
    "GET /api/products failed:",
    response.status,
    errorText,
  );

  throw new Error(
    `Unable to load products (${response.status}).`,
  );
}

  return response.json();
}

export async function getProduct(id: string): Promise<Product> {
  const token = await getAccessToken();

  const response = await fetch(`${getApiUrl()}/api/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load product.");
  }

  return response.json();
}

export async function getCategories(): Promise<Category[]> {
  const token = await getAccessToken();

  const response = await fetch(`${getApiUrl()}/api/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load categories.");
  }

  return response.json();
}

export interface ProductImage {
  id: string;
  image_url: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
}