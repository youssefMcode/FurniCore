import Link from "next/link";
import { Plus } from "lucide-react";

import { CustomersList } from "@/components/customers/customers-list";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/lib/api/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
            Customers
          </h2>

          <p className="mt-1 text-sm text-[#73766F]">
            Manage customer information and sales
            relationships.
          </p>
        </div>

        <Button
          nativeButton={false}
          className="bg-[#244A3D] text-white hover:bg-[#19372D]"
          render={<Link href="/customers/new" />}
        >
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      <CustomersList customers={customers} />
    </div>
  );
}