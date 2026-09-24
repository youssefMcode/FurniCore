import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExpenseForm } from "@/components/expenses/expense-form";

export default function NewExpensePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/expenses"
          className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Expenses
        </Link>

        <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
          New Expense
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Record a business operating expense.
        </p>
      </div>

      <ExpenseForm />
    </div>
  );
}