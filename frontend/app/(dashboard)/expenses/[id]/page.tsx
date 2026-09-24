import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getExpense } from "@/lib/api/expenses";

export const dynamic = "force-dynamic";

function formatCategory(category: string) {
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

export default async function ExpenseDetailsPage({
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
          >
            <ArrowLeft className="size-4" />
            Expenses
          </Link>

          <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
            Expense Details
          </h2>
        </div>

        <Button
          nativeButton={false}
          variant="outline"
          render={
            <Link
              href={`/expenses/${expense.id}/edit`}
            />
          }
        >
          <Pencil className="size-4" />
          Edit Expense
        </Button>
      </div>

      <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#F3EFE8] text-[#B8895B]">
          <ReceiptText className="size-5" />
        </div>

        <div className="mt-5">
          <span className="rounded-full bg-[#F3EFE8] px-3 py-1 text-xs font-semibold text-[#6F563B]">
            {formatCategory(expense.category)}
          </span>

          <h3 className="mt-4 text-xl font-semibold">
            {expense.description}
          </h3>
        </div>

        <div className="mt-6 grid gap-5 border-t border-[#EEECE6] pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-[#73766F]">
              Amount
            </p>

            <p className="mt-2 text-xl font-semibold">
              ${Number(expense.amount).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-[#73766F]">
              Expense Date
            </p>

            <p className="mt-2 font-medium">
              {expense.expense_date}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}