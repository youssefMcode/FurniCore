import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getSupplier } from "@/lib/api/suppliers";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let supplier;

  try {
    supplier = await getSupplier(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SUPPLIER_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/suppliers/${supplier.id}`}
          className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          {supplier.name}
        </Link>

        <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
          Edit Supplier
        </h2>
      </div>

      <SupplierForm supplier={supplier} />
    </div>
  );
}