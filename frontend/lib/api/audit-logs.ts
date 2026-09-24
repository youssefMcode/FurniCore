import { createClient } from "@/lib/supabase/server";

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  users: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export async function getAuditLogs(): Promise<
  AuditLog[]
> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required.");
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "API URL is not configured.",
    );
  }

  const response = await fetch(
    `${apiUrl}/api/audit-logs?limit=100`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load audit logs.",
    );
  }

  return response.json();
}