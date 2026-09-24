import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SupplierForm } from "@/components/suppliers/supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/suppliers"
          className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Suppliers
        </Link>

        <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
          New Supplier
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Add a furniture supplier to FurniCore.
        </p>
      </div>

      <SupplierForm />
    </div>
  );
}