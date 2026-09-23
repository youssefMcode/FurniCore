import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/customers"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Customers
        </Link>

        <h2 className="text-2xl font-semibold text-[#242624] sm:text-3xl">
          Add Customer
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Add a customer for sales and purchase history.
        </p>
      </div>

      <CustomerForm />
    </div>
  );
}