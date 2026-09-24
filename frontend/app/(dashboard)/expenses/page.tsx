import Link from "next/link";
import {
  Plus,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getExpenses } from "@/lib/api/expenses";

export const dynamic = "force-dynamic";

function formatCategory(category: string) {
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  const total = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Expenses
          </h2>

          <p className="mt-1 text-sm text-[#73766F]">
            Track showroom operating expenses.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/expenses/new" />}
        >
          <Plus className="size-4" />
          New Expense
        </Button>
      </div>

      <div className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#73766F]">
          Total Recorded Expenses
        </p>

        <p className="mt-2 text-2xl font-semibold">
          ${total.toFixed(2)}
        </p>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7D3CA] bg-white p-10 text-center">
          <ReceiptText className="mx-auto size-8 text-[#73766F]" />

          <h3 className="mt-3 font-semibold">
            No expenses yet
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Record your first business expense.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E2DA] bg-[#FAF9F6] text-xs uppercase text-[#73766F]">
                <tr>
                  <th className="px-5 py-4">
                    Description
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-[#EEECE6] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/expenses/${expense.id}`}
                        className="font-medium hover:text-[#244A3D] hover:underline"
                      >
                        {expense.description}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#F3EFE8] px-2.5 py-1 text-xs font-medium text-[#6F563B]">
                        {formatCategory(
                          expense.category,
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-[#73766F]">
                      {expense.expense_date}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      $
                      {Number(
                        expense.amount,
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}