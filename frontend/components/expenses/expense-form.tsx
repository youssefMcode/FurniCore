"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type {
  Expense,
  ExpenseCategory,
} from "@/lib/api/expenses";

const categories: {
  value: ExpenseCategory;
  label: string;
}[] = [
  { value: "rent", label: "Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "transport", label: "Transport" },
  { value: "maintenance", label: "Maintenance" },
  { value: "salaries", label: "Salaries" },
  { value: "other", label: "Other" },
];

export function ExpenseForm({
  expense,
}: {
  expense?: Expense;
}) {
  const router = useRouter();

  const [category, setCategory] =
    useState<ExpenseCategory>(
      expense?.category ?? "other",
    );

  const [amount, setAmount] = useState(
    expense ? String(expense.amount) : "",
  );

  const [description, setDescription] = useState(
    expense?.description ?? "",
  );

  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date ??
      new Date().toISOString().slice(0, 10),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Expense amount must be greater than zero.",
      );
      return;
    }

    if (description.trim().length < 2) {
      setError(
        "Please enter an expense description.",
      );
      return;
    }

    if (!expenseDate) {
      setError("Please select an expense date.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired.",
        );
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          "API URL is not configured.",
        );
      }

      const response = await fetch(
        expense
          ? `${apiUrl}/api/expenses/${expense.id}`
          : `${apiUrl}/api/expenses`,
        {
          method: expense ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            amount: numericAmount,
            description: description.trim(),
            expense_date: expenseDate,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to save expense.",
        );
      }

      router.push(`/expenses/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save expense.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-medium">
            Category *
          </span>

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value as ExpenseCategory,
              )
            }
            className={inputClass}
          >
            {categories.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium">
            Amount *
          </span>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            className={inputClass}
            placeholder="0.00"
            required
          />
        </label>
      </div>

      <label>
        <span className="mb-2 block text-sm font-medium">
          Expense Date *
        </span>

        <input
          type="date"
          value={expenseDate}
          max={new Date()
            .toISOString()
            .slice(0, 10)}
          onChange={(event) =>
            setExpenseDate(event.target.value)
          }
          className={inputClass}
          required
        />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium">
          Description *
        </span>

        <textarea
          value={description}
          maxLength={500}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          className={`${inputClass} min-h-28 resize-none py-3`}
          placeholder="Describe the expense..."
          required
        />
      </label>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : expense
              ? "Save Changes"
              : "Record Expense"}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 text-sm outline-none transition focus:border-[#244A3D]";