import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomer } from "@/lib/api/customers";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let customer;

  try {
    customer = await getCustomer(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CUSTOMER_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/customers/${customer.id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Customer
        </Link>

        <h2 className="text-2xl font-semibold text-[#242624] sm:text-3xl">
          Edit Customer
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Update {customer.name}&apos;s information.
        </p>
      </div>

      <CustomerForm customer={customer} />
    </div>
  );
}