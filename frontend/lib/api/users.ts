import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "cashier";

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
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

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  return apiUrl;
}

export async function getUsers(): Promise<StaffUser[]> {
  const token = await getToken();

  const response = await fetch(
    `${getApiUrl()}/api/users`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to load users.");
  }

  return response.json();
}

export async function getStaffUser(
  id: string,
): Promise<StaffUser> {
  const token = await getToken();

  const response = await fetch(
    `${getApiUrl()}/api/users/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("Unable to load user.");
  }

  return response.json();
}