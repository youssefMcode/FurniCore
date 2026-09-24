import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { UserForm } from "@/components/users/user-form";
import { getCurrentUserProfile } from "@/lib/auth";
import { getStaffUser } from "@/lib/api/users";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser =
    await getCurrentUserProfile();

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const { id } = await params;

  let user;

  try {
    user = await getStaffUser(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Users & Staff
        </Link>

        <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
          Manage User
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Update role and account access.
        </p>
      </div>

      <UserForm user={user} />
    </div>
  );
}