import { createClient } from "@/lib/supabase/client";

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}

export async function getApiError(response: Response) {
  try {
    const data = await response.json();
    return data.detail || "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}