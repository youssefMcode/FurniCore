import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/auth";
import { getUsers } from "@/lib/api/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser =
    await getCurrentUserProfile();

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Users & Staff
          </h2>

          <p className="mt-1 text-sm text-[#73766F]">
            Manage staff accounts and access roles.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/users/new" />}
        >
          <Plus className="size-4" />
          Add Staff
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#F3EFE8] text-[#244A3D]">
                {user.role === "admin" ? (
                  <ShieldCheck className="size-5" />
                ) : (
                  <UserRound className="size-5" />
                )}
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  user.is_active
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {user.is_active
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <h3 className="mt-4 font-semibold">
              {user.name}
            </h3>

            <p className="mt-1 text-sm capitalize text-[#73766F]">
              {user.role}
            </p>

            <Button
              nativeButton={false}
              variant="outline"
              className="mt-5 w-full"
              render={
                <Link
                  href={`/users/${user.id}/edit`}
                />
              }
            >
              Manage User
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}