import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { getExpense } from "@/lib/api/expenses";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let expense;

  try {
    expense = await getExpense(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EXPENSE_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/expenses/${expense.id}`}
          className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Expense Details
        </Link>

        <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
          Edit Expense
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Update this business expense.
        </p>
      </div>

      <ExpenseForm expense={expense} />
    </div>
  );
}