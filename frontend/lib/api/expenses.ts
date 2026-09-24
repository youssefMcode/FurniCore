import { createClient } from "@/lib/supabase/server";

export type ExpenseCategory =
  | "rent"
  | "electricity"
  | "transport"
  | "maintenance"
  | "salaries"
  | "other";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expense_date: string;
  receipt_url: string | null;
  created_by: string;
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

export async function getExpenses(): Promise<Expense[]> {
  const token = await getToken();

  const response = await fetch(
    `${getApiUrl()}/api/expenses`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to load expenses.");
  }

  return response.json();
}

export async function getExpense(
  id: string,
): Promise<Expense> {
  const token = await getToken();

  const response = await fetch(
    `${getApiUrl()}/api/expenses/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("Unable to load expense.");
  }

  return response.json();
}