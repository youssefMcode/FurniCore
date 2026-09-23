import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "cashier";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, name, role, is_active")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect("/login");
  }

  return profile as UserProfile;
}