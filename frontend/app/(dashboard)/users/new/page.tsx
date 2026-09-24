import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { UserForm } from "@/components/users/user-form";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function NewUserPage() {
  const currentUser =
    await getCurrentUserProfile();

  if (currentUser.role !== "admin") {
    redirect("/");
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
          Add Staff
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Create a FurniCore staff account.
        </p>
      </div>

      <UserForm />
    </div>
  );
}