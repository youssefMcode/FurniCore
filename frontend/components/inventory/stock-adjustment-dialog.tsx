"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Minus,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";

interface Props {
  productId: string;
  productName: string;
  currentStock: number;
}

export function StockAdjustmentDialog({
  productId,
  productName,
  currentStock,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"add" | "remove">(
    "add",
  );
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (saving) return;

    setOpen(false);
    setError("");
    setQuantity("1");
    setReason("");
    setType("add");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "Quantity must be a positive whole number.",
      );
      return;
    }

    if (parsedQuantity > 100000) {
      setError("Quantity is too large.");
      return;
    }

    if (reason.trim().length < 3) {
      setError(
        "Please provide a short reason for the adjustment.",
      );
      return;
    }

    if (
      type === "remove" &&
      parsedQuantity > currentStock
    ) {
      setError(
        `Only ${currentStock} units are currently available.`,
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `/api/inventory/${productId}/adjust`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adjustment_type: type,
            quantity: parsedQuantity,
            reason: reason.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      closeAfterSuccess();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to adjust stock.",
      );
    } finally {
      setSaving(false);
    }
  }

  function closeAfterSuccess() {
    setOpen(false);
    setError("");
    setQuantity("1");
    setReason("");
    setType("add");
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-3.5" />
        Adjust
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`adjust-stock-${productId}`}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div>
          <h2
            id={`adjust-stock-${productId}`}
            className="text-xl font-semibold text-[#242624]"
          >
            Adjust stock
          </h2>

          <p className="mt-1 text-sm text-[#73766F]">
            {productName} · Current stock:{" "}
            <strong>{currentStock}</strong>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Adjustment
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={
                  type === "add" ? "default" : "outline"
                }
                onClick={() => setType("add")}
                className={
                  type === "add"
                    ? "bg-[#244A3D] hover:bg-[#19372D]"
                    : ""
                }
              >
                <Plus className="size-4" />
                Add stock
              </Button>

              <Button
                type="button"
                variant={
                  type === "remove"
                    ? "default"
                    : "outline"
                }
                onClick={() => setType("remove")}
                className={
                  type === "remove"
                    ? "bg-[#244A3D] hover:bg-[#19372D]"
                    : ""
                }
              >
                <Minus className="size-4" />
                Remove
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Quantity
            </label>

            <Input
              type="number"
              min="1"
              max="100000"
              step="1"
              required
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Reason
            </label>

            <Input
              value={reason}
              maxLength={300}
              required
              placeholder="e.g. Physical stock correction"
              onChange={(event) =>
                setReason(event.target.value)
              }
            />

            <p className="mt-1.5 text-xs text-[#9A9C96]">
              This reason will be recorded in the audit
              log.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={close}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="bg-[#244A3D] text-white hover:bg-[#19372D]"
            >
              {saving && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {saving ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}