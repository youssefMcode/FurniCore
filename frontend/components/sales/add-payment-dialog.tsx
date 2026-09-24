"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";

export function AddPaymentDialog({
  saleId,
  balance,
}: {
  saleId: string;
  balance: number;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] =
    useState<"cash" | "card" | "bank_transfer">("cash");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (amount <= 0 || amount > balance) {
      setError("Enter a valid payment amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `/api/sales/${saleId}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            payment_method: method,
            notes: notes.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-[#244A3D] text-white hover:bg-[#19372D]"
      >
        Record Payment
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D8D5CC] bg-[#F8F7F3] p-4">
      <h4 className="font-semibold">Record Payment</h4>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs text-[#73766F]">
            Amount
          </label>

          <Input
            type="number"
            min="0.01"
            max={balance}
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(Number(event.target.value) || 0)
            }
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs text-[#73766F]">
            Payment method
          </label>

          <select
            value={method}
            onChange={(event) =>
              setMethod(
                event.target.value as
                  | "cash"
                  | "card"
                  | "bank_transfer",
              )
            }
            className="mt-1 h-10 w-full rounded-lg border border-[#DCDAD3] bg-white px-3 text-sm"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">
              Bank transfer
            </option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[#73766F]">
            Notes
          </label>

          <Input
            value={notes}
            maxLength={500}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Optional payment note"
            className="mt-1"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          disabled={saving}
          onClick={submit}
          className="bg-[#244A3D] text-white hover:bg-[#19372D]"
        >
          {saving && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Save Payment
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}