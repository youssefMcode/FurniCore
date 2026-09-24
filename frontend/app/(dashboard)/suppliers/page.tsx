import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSuppliers } from "@/lib/api/suppliers";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Suppliers
          </h2>

          <p className="mt-1 text-sm text-[#73766F]">
            Manage furniture suppliers and purchasing relationships.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/suppliers/new" />}
        >
          <Plus className="size-4" />
          New Supplier
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7D3CA] bg-white p-10 text-center">
          <Building2 className="mx-auto size-8 text-[#73766F]" />

          <h3 className="mt-3 font-semibold">
            No suppliers yet
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Add your first furniture supplier.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#244A3D]">
                  <Building2 className="size-5" />
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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

              <h3 className="mt-4 font-semibold">
                {supplier.name}
              </h3>

              <div className="mt-3 space-y-2 text-sm text-[#73766F]">
                {supplier.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-4" />
                    {supplier.phone}
                  </p>
                )}

                {supplier.address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {supplier.address}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}