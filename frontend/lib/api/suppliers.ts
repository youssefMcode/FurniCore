import { createClient } from "@/lib/supabase/server";

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
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

export async function getSuppliers(): Promise<
  Supplier[]
> {
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(
    `${apiUrl}/api/suppliers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to load suppliers.");
  }

  return response.json();
}

export async function getSupplier(
  id: string,
): Promise<Supplier> {
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(
    `${apiUrl}/api/suppliers/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    throw new Error("SUPPLIER_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("Unable to load supplier.");
  }

  return response.json();
}