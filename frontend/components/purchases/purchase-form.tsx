"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Supplier } from "@/lib/api/suppliers";

type Product = {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
  stock_quantity: number;
};

type PurchaseRow = {
  product_id: string;
  quantity: number;
  unit_cost: number;
};

export function PurchaseForm({
  suppliers,
  products,
}: {
  suppliers: Supplier[];
  products: Product[];
}) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseRow[]>([
    {
      product_id: "",
      quantity: 1,
      unit_cost: 0,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.is_active,
  );

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) *
            Number(item.unit_cost || 0),
        0,
      ),
    [items],
  );

  function updateItem(
    index: number,
    changes: Partial<PurchaseRow>,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...changes }
          : item,
      ),
    );
  }

  function selectProduct(
    index: number,
    productId: string,
  ) {
    const product = products.find(
      (item) => item.id === productId,
    );

    updateItem(index, {
      product_id: productId,
      unit_cost: product
        ? Number(product.cost_price)
        : 0,
    });
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        product_id: "",
        quantity: 1,
        unit_cost: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (_, itemIndex) => itemIndex !== index,
      );
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (!purchaseDate) {
      setError("Please select a purchase date.");
      return;
    }

    if (items.some((item) => !item.product_id)) {
      setError("Please select a product for every item.");
      return;
    }

    if (
      items.some(
        (item) =>
          item.quantity <= 0 ||
          item.unit_cost < 0,
      )
    ) {
      setError(
        "Quantity must be greater than zero and cost cannot be negative.",
      );
      return;
    }

    const ids = items.map(
      (item) => item.product_id,
    );

    if (new Set(ids).size !== ids.length) {
      setError(
        "The same product cannot be added twice.",
      );
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

      const response = await fetch(
        `${apiUrl}/api/purchases`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supplier_id: supplierId,
            purchase_date: purchaseDate,
            notes: notes.trim() || null,
            items,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to create purchase.",
        );
      }

      router.push(`/purchases/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create purchase.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-semibold">
          Purchase Information
        </h3>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-medium">
              Supplier *
            </span>

            <select
              value={supplierId}
              onChange={(event) =>
                setSupplierId(event.target.value)
              }
              className={inputClass}
              required
            >
              <option value="">
                Select supplier
              </option>

              {activeSuppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium">
              Purchase Date *
            </span>

            <input
              type="date"
              value={purchaseDate}
              max={new Date()
                .toISOString()
                .slice(0, 10)}
              onChange={(event) =>
                setPurchaseDate(event.target.value)
              }
              className={inputClass}
              required
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              Purchase Items
            </h3>

            <p className="mt-1 text-sm text-[#73766F]">
              Stock will increase when the purchase is completed.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
          >
            <Plus className="size-4" />
            Add Item
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-[#EEECE6] p-4 md:grid-cols-[minmax(0,1fr)_120px_150px_120px_44px] md:items-end"
            >
              <label>
                <span className="mb-2 block text-xs font-medium text-[#73766F]">
                  Product
                </span>

                <select
                  value={item.product_id}
                  onChange={(event) =>
                    selectProduct(
                      index,
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-medium text-[#73766F]">
                  Quantity
                </span>

                <input
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, {
                      quantity: Number(
                        event.target.value,
                      ),
                    })
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-medium text-[#73766F]">
                  Unit Cost
                </span>

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unit_cost}
                  onChange={(event) =>
                    updateItem(index, {
                      unit_cost: Number(
                        event.target.value,
                      ),
                    })
                  }
                  className={inputClass}
                />
              </label>

              <div>
                <span className="mb-2 block text-xs font-medium text-[#73766F]">
                  Line Total
                </span>

                <div className="flex h-11 items-center font-semibold">
                  $
                  {(
                    item.quantity *
                    item.unit_cost
                  ).toFixed(2)}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={items.length === 1}
                onClick={() => removeItem(index)}
                aria-label="Remove purchase item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
        <label>
          <span className="mb-2 block text-sm font-medium">
            Notes
          </span>

          <textarea
            value={notes}
            maxLength={1000}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Optional purchase notes..."
            className={`${inputClass} min-h-24 py-3`}
          />
        </label>

        <div className="mt-6 flex flex-col gap-4 border-t border-[#EEECE6] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[#73766F]">
              Purchase Total
            </p>

            <p className="text-2xl font-semibold">
              ${total.toFixed(2)}
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Recording..."
              : "Complete Purchase"}
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 text-sm outline-none transition focus:border-[#244A3D]";