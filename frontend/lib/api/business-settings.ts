import { createClient } from "@/lib/supabase/server";

export interface BusinessSettings {
  id: string;
  business_name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  currency: string;
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
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return apiUrl;
}

export async function getBusinessSettings():
  Promise<BusinessSettings> {
  const token = await getToken();

  const response = await fetch(
    `${getApiUrl()}/api/business-settings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load business settings.",
    );
  }

  return response.json();
}