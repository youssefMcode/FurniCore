"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type {
  SaleDetails,
} from "@/lib/api/sales";

interface ReturnSelection {
  quantity: number;
  restock: boolean;
}

export function ReturnSaleDialog({
  sale,
}: {
  sale: SaleDetails;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const [selections, setSelections] = useState<
    Record<string, ReturnSelection>
  >({});

  const returnedByItem = useMemo(() => {
    const result: Record<string, number> = {};

    for (const saleReturn of sale.returns ?? []) {
      for (const item of saleReturn.return_items ?? []) {
        result[item.sale_item_id] =
          (result[item.sale_item_id] ?? 0) +
          Number(item.quantity);
      }
    }

    return result;
  }, [sale.returns]);

  const returnableItems = sale.sale_items.filter(
    (item) =>
      item.quantity -
        (returnedByItem[item.id] ?? 0) >
      0,
  );

  function updateQuantity(
    itemId: string,
    quantity: number,
    max: number,
  ) {
    const safeQuantity = Math.max(
      0,
      Math.min(quantity, max),
    );

    setSelections((current) => ({
      ...current,
      [itemId]: {
        quantity: safeQuantity,
        restock:
          current[itemId]?.restock ?? true,
      },
    }));
  }

  function updateRestock(
    itemId: string,
    restock: boolean,
  ) {
    setSelections((current) => ({
      ...current,
      [itemId]: {
        quantity:
          current[itemId]?.quantity ?? 0,
        restock,
      },
    }));
  }

  async function handleReturn() {
    const items = returnableItems
      .map((item) => ({
        sale_item_id: item.id,
        quantity:
          selections[item.id]?.quantity ?? 0,
        restock:
          selections[item.id]?.restock ?? true,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setError(
        "Select at least one item to return.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Process this return? Returned quantities marked for restocking will be added back to inventory.",
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please sign in again.",
        );
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sales/${sale.id}/returns`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: reason.trim() || null,
            items,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to process return.",
        );
      }

      setOpen(false);
      setReason("");
      setSelections({});

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process return.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (returnableItems.length === 0) {
    return (
      <p className="rounded-xl bg-[#F8F7F3] p-3 text-center text-xs text-[#73766F]">
        All items have already been returned.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="size-4" />
        Process Return
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E2DA] bg-[#F8F7F3] p-4">
      <div>
        <h4 className="font-semibold">
          Return Items
        </h4>

        <p className="mt-1 text-xs text-[#73766F]">
          Select the quantities being returned.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {returnableItems.map((item) => {
          const alreadyReturned =
            returnedByItem[item.id] ?? 0;

          const available =
            item.quantity - alreadyReturned;

          const selection =
            selections[item.id];

          return (
            <div
              key={item.id}
              className="rounded-xl border border-[#E5E2DA] bg-white p-3"
            >
              <p className="text-sm font-medium">
                {item.products.name}
              </p>

              <p className="mt-1 text-xs text-[#73766F]">
                {item.products.sku} ·{" "}
                {available} returnable
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="text-xs">
                  Quantity
                </label>

                <input
                  type="number"
                  min={0}
                  max={available}
                  value={
                    selection?.quantity ?? 0
                  }
                  onChange={(event) =>
                    updateQuantity(
                      item.id,
                      Number(
                        event.target.value,
                      ),
                      available,
                    )
                  }
                  className="h-9 w-20 rounded-lg border border-[#E5E2DA] bg-white px-2 text-sm outline-none focus:border-[#244A3D]"
                />

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={
                      selection?.restock ?? true
                    }
                    onChange={(event) =>
                      updateRestock(
                        item.id,
                        event.target.checked,
                      )
                    }
                  />
                  Restock
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium">
          Reason
        </label>

        <textarea
          value={reason}
          maxLength={500}
          onChange={(event) =>
            setReason(event.target.value)
          }
          placeholder="Optional return reason..."
          className="mt-2 min-h-20 w-full resize-none rounded-xl border border-[#E5E2DA] bg-white p-3 text-sm outline-none focus:border-[#244A3D]"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          className="flex-1"
          disabled={loading}
          onClick={handleReturn}
        >
          {loading
            ? "Processing..."
            : "Confirm Return"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setOpen(false);
            setError("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}