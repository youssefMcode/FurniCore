"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError || !data.user) {
      setError(loginError?.message ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, role, is_active")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError("Your FurniCore profile could not be found.");
      setLoading(false);
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setError("Your account is inactive.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F7F3] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-[#244A3D] text-xl font-semibold text-white">
            F
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#242624]">
            Welcome to FurniCore
          </h1>

          <p className="mt-2 text-sm text-[#73766F]">
            Sign in to manage your furniture business
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-[#E5E2DA] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#242624]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9C96]" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 w-full rounded-lg border border-[#DCDAD3] bg-white pl-10 pr-3 text-sm text-[#242624] outline-none transition focus:border-[#244A3D] focus:ring-2 focus:ring-[#244A3D]/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#242624]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9C96]" />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-11 w-full rounded-lg border border-[#DCDAD3] bg-white pl-10 pr-3 text-sm text-[#242624] outline-none transition focus:border-[#244A3D] focus:ring-2 focus:ring-[#244A3D]/10"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-[#244A3D] text-white hover:bg-[#19372D]"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-[#9A9C96]">
          FurniCore Furniture Management System
        </p>
      </div>
    </main>
  );
}