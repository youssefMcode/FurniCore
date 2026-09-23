import { createClient } from "@/lib/supabase/server";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface CustomerPayload {
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
}

async function getAccessToken() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required.");
  }

  return session.access_token;
}

export async function getCustomers(): Promise<Customer[]> {
  const token = await getAccessToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/customers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();

    console.error(
      "GET /api/customers failed:",
      response.status,
      detail,
    );

    throw new Error("Unable to load customers.");
  }

  return response.json();
}

export async function getCustomer(
  id: string,
): Promise<Customer> {
  const token = await getAccessToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(
    `${apiUrl}/api/customers/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }

    const detail = await response.text();

    console.error(
      "GET customer failed:",
      response.status,
      detail,
    );

    throw new Error("Unable to load customer.");
  }

  return response.json();
}