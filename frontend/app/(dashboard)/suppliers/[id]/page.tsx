import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSupplier } from "@/lib/api/suppliers";

export const dynamic = "force-dynamic";

export default async function SupplierDetailsPage({
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/suppliers"
            className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
          >
            <ArrowLeft className="size-4" />
            Suppliers
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {supplier.name}
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                supplier.is_active
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {supplier.is_active
                ? "Active"
                : "Inactive"}
            </span>
          </div>
        </div>

        <Button
          nativeButton={false}
          variant="outline"
          render={
            <Link
              href={`/suppliers/${supplier.id}/edit`}
            />
          }
        >
          <Pencil className="size-4" />
          Edit Supplier
        </Button>
      </div>

      <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-semibold">
          Supplier Information
        </h3>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Info
            label="Phone"
            value={supplier.phone}
            icon={<Phone className="size-4" />}
          />

          <Info
            label="Address"
            value={supplier.address}
            icon={<MapPin className="size-4" />}
          />
        </div>

        <div className="mt-6 border-t border-[#EEECE6] pt-5">
          <p className="text-xs font-semibold uppercase text-[#73766F]">
            Notes
          </p>

          <p className="mt-2 text-sm">
            {supplier.notes ||
              "No notes recorded."}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-[#D7D3CA] bg-white p-6">
        <h3 className="font-semibold">
          Purchase History
        </h3>

        <p className="mt-2 text-sm text-[#73766F]">
          Purchases from this supplier will appear here.
        </p>
      </section>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[#73766F]">
        {label}
      </p>

      <div className="mt-2 flex items-start gap-2">
        <span className="mt-0.5 text-[#73766F]">
          {icon}
        </span>

        <span className="text-sm">
          {value || "Not provided"}
        </span>
      </div>
    </div>
  );
}