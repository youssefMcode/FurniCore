"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";
import type { Customer } from "@/lib/api/customers";
import type { Product } from "@/lib/api/products";

interface Props {
  products: Product[];
  customers: Customer[];
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  customization: {
    dimensions?: string;
    color?: string;
    fabric?: string;
    material?: string;
    configuration?: string;
    extra_price?: number;
    notes?: string;
  } | null;
}

export function POSWorkspace({
  products,
  customers,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [saleDiscount, setSaleDiscount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "card" | "bank_transfer">("cash");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query),
    );
  }, [products, search]);

  /*
   * Trusted calculation mirrored by the PostgreSQL transaction:
   *
   * (selling price × quantity)
   * + customization extra price
   * - item discount
   */
  const subtotal = cart.reduce((sum, item) => {
    const base =
      Number(item.product.selling_price) * item.quantity;

    const extraPrice =
      Number(item.customization?.extra_price) || 0;

    return (
      sum +
      Math.max(
        base + extraPrice - item.discount,
        0,
      )
    );
  }, 0);

  const safeSaleDiscount = Math.min(
    Math.max(saleDiscount, 0),
    subtotal,
  );

  const total = subtotal - safeSaleDiscount;

  const safePayment = Math.min(
    Math.max(paymentAmount, 0),
    total,
  );

  const balance = total - safePayment;

  function addProduct(product: Product) {
    setError("");

    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id,
      );

      if (existing) {
        if (
          existing.quantity >= product.stock_quantity
        ) {
          return current;
        }

        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          discount: 0,
          customization: product.is_customizable
            ? {}
            : null,
        },
      ];
    });
  }

  function updateQuantity(
    productId: string,
    change: number,
  ) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const quantity = Math.min(
            Math.max(item.quantity + change, 0),
            item.product.stock_quantity,
          );

          return {
            ...item,
            quantity,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function removeProduct(productId: string) {
    setCart((current) =>
      current.filter(
        (item) => item.product.id !== productId,
      ),
    );
  }

  function updateItemDiscount(
    productId: string,
    value: number,
  ) {
    setCart((current) =>
      current.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        const extraPrice =
          Number(item.customization?.extra_price) || 0;

        const maximum =
          Number(item.product.selling_price) *
            item.quantity +
          extraPrice;

        return {
          ...item,
          discount: Math.min(
            Math.max(value || 0, 0),
            maximum,
          ),
        };
      }),
    );
  }

  function updateCustomization(
    productId: string,
    field: string,
    value: string,
  ) {
    setCart((current) =>
      current.map((item) => {
        if (
          item.product.id !== productId ||
          !item.product.is_customizable
        ) {
          return item;
        }

        const parsedValue =
          field === "extra_price"
            ? Math.min(
                Math.max(Number(value) || 0, 0),
                1000000,
              )
            : value;

        return {
          ...item,
          customization: {
            ...(item.customization ?? {}),
            [field]: parsedValue,
          },
        };
      }),
    );
  }

  async function checkout() {
    if (cart.length === 0) {
      setError("Add at least one product to the sale.");
      return;
    }

    if (
      saleDiscount < 0 ||
      saleDiscount > subtotal
    ) {
      setError("Sale discount is invalid.");
      return;
    }

    if (
      paymentAmount < 0 ||
      paymentAmount > total
    ) {
      setError(
        "Payment cannot exceed the sale total.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        "/api/sales",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id: customerId || null,
            discount: safeSaleDiscount,
            payment_amount: safePayment,
            payment_method: paymentMethod,
            payment_notes: null,

            items: cart.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
              discount: item.discount,
              customization:
                item.product.is_customizable
                  ? item.customization
                  : null,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(response),
        );
      }

      const sale = await response.json();

      router.push(`/sales/${sale.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete sale.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* PRODUCT CATALOG */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9C96]" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products by name or SKU..."
              className="h-11 pl-10"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCDAD3] bg-white p-10 text-center">
            <Package className="mx-auto size-7 text-[#9A9C96]" />

            <p className="mt-3 font-medium">
              No available products
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => addProduct(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* CART */}
      <aside className="h-fit rounded-2xl border border-[#E5E2DA] bg-white shadow-sm xl:sticky xl:top-6">
        <div className="border-b border-[#EEECE6] p-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-[#244A3D]" />

            <h3 className="font-semibold text-[#242624]">
              Current Sale
            </h3>

            <span className="ml-auto rounded-full bg-[#EEF3F0] px-2.5 py-1 text-xs font-medium text-[#244A3D]">
              {cart.length} items
            </span>
          </div>

          <label className="mt-5 block text-xs font-medium text-[#73766F]">
            Customer
          </label>

          <select
            value={customerId}
            onChange={(event) =>
              setCustomerId(event.target.value)
            }
            className="mt-2 h-10 w-full rounded-lg border border-[#DCDAD3] bg-white px-3 text-sm outline-none focus:border-[#244A3D]"
          >
            <option value="">
              Walk-in customer
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name} — {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-[460px] space-y-4 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingCart className="mx-auto size-8 text-[#C4C5C1]" />

              <p className="mt-3 text-sm text-[#73766F]">
                Select products to begin a sale.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemCard
                key={item.product.id}
                item={item}
                onIncrease={() =>
                  updateQuantity(
                    item.product.id,
                    1,
                  )
                }
                onDecrease={() =>
                  updateQuantity(
                    item.product.id,
                    -1,
                  )
                }
                onRemove={() =>
                  removeProduct(item.product.id)
                }
                onDiscount={(value) =>
                  updateItemDiscount(
                    item.product.id,
                    value,
                  )
                }
                onCustomization={(
                  field,
                  value,
                ) =>
                  updateCustomization(
                    item.product.id,
                    field,
                    value,
                  )
                }
              />
            ))
          )}
        </div>

        <div className="space-y-4 border-t border-[#EEECE6] p-5">
          <MoneyInput
            label="Sale discount"
            value={saleDiscount}
            onChange={setSaleDiscount}
            max={subtotal}
          />

          <div className="space-y-2 rounded-xl bg-[#F8F7F3] p-4 text-sm">
            <SummaryRow
              label="Subtotal"
              value={subtotal}
            />

            <SummaryRow
              label="Discount"
              value={safeSaleDiscount}
            />

            <div className="border-t border-[#E5E2DA] pt-2">
              <SummaryRow
                label="Total"
                value={total}
                strong
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#73766F]">
              Payment method
            </label>

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value as
                    | "cash"
                    | "card"
                    | "bank_transfer",
                )
              }
              className="mt-2 h-10 w-full rounded-lg border border-[#DCDAD3] bg-white px-3 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">
                Bank transfer
              </option>
            </select>
          </div>

          <MoneyInput
            label="Amount paid"
            value={paymentAmount}
            onChange={setPaymentAmount}
            max={total}
          />

          <div className="flex items-center justify-between rounded-xl border border-[#E5E2DA] px-4 py-3">
            <span className="text-sm text-[#73766F]">
              Remaining balance
            </span>

            <span
              className={`font-semibold ${
                balance > 0
                  ? "text-amber-700"
                  : "text-green-700"
              }`}
            >
              ${balance.toFixed(2)}
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="button"
            disabled={
              saving || cart.length === 0
            }
            onClick={checkout}
            className="h-11 w-full bg-[#244A3D] text-white hover:bg-[#19372D]"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Completing...
              </>
            ) : (
              "Complete Sale"
            )}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  const image =
    product.product_images?.find(
      (item) => item.is_primary,
    ) ??
    [...(product.product_images ?? [])].sort(
      (a, b) =>
        a.sort_order - b.sort_order,
    )[0];

  return (
    <button
      type="button"
      onClick={onAdd}
      className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#CFCBC1] hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-[#F3F1EC]">
        {image ? (
          <Image
            src={image.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-6 text-[#9A9C96]" />
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="truncate font-semibold text-[#242624]">
          {product.name}
        </p>

        <p className="mt-1 text-xs text-[#8A8D86]">
          {product.sku}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <span className="font-semibold text-[#244A3D]">
            ${Number(product.selling_price).toFixed(2)}
          </span>

          <span className="text-xs text-[#73766F]">
            {product.stock_quantity} available
          </span>
        </div>
      </div>
    </button>
  );
}

function CartItemCard({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onDiscount,
  onCustomization,
}: {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onDiscount: (value: number) => void;
  onCustomization: (
    field: string,
    value: string,
  ) => void;
}) {
  const extraPrice =
    Number(item.customization?.extra_price) || 0;

  const lineTotal =
    Number(item.product.selling_price) *
      item.quantity +
    extraPrice -
    item.discount;

  return (
    <div className="rounded-xl border border-[#E5E2DA] p-3">
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {item.product.name}
          </p>

          <p className="mt-1 text-xs text-[#73766F]">
            ${Number(item.product.selling_price).toFixed(2)} each
          </p>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          aria-label={`Remove ${item.product.name}`}
        >
          <Trash2 className="size-4 text-red-600" />
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onDecrease}
          >
            <Minus className="size-3" />
          </Button>

          <span className="min-w-6 text-center text-sm font-semibold">
            {item.quantity}
          </span>

          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={
              item.quantity >=
              item.product.stock_quantity
            }
            onClick={onIncrease}
          >
            <Plus className="size-3" />
          </Button>
        </div>

        <span className="text-sm font-semibold">
          ${Math.max(lineTotal, 0).toFixed(2)}
        </span>
      </div>

      <div className="mt-3">
        <label className="text-xs text-[#73766F]">
          Item discount
        </label>

        <Input
          type="number"
          min="0"
          max={
            Number(item.product.selling_price) *
              item.quantity +
            extraPrice
          }
          step="0.01"
          value={item.discount}
          onChange={(event) =>
            onDiscount(
              Number(event.target.value) || 0,
            )
          }
          className="mt-1 h-9"
        />
      </div>

      {item.product.is_customizable && (
        <div className="mt-4 rounded-xl bg-[#FBF5EF] p-3">
          <p className="text-xs font-semibold text-[#8A6039]">
            Furniture customization
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["dimensions", "Dimensions"],
              ["color", "Color"],
              ["fabric", "Fabric"],
              ["material", "Material"],
              ["configuration", "Configuration"],
              ["notes", "Notes"],
            ].map(([field, label]) => (
              <Input
                key={field}
                placeholder={label}
                value={String(
                  item.customization?.[
                    field as keyof typeof item.customization
                  ] ?? "",
                )}
                onChange={(event) =>
                  onCustomization(
                    field,
                    event.target.value,
                  )
                }
                className={
                  field === "notes"
                    ? "sm:col-span-2"
                    : ""
                }
              />
            ))}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[#8A6039]">
                Customization extra price
              </label>

              <Input
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                placeholder="0.00"
                value={
                  item.customization?.extra_price ??
                  ""
                }
                onChange={(event) =>
                  onCustomization(
                    "extra_price",
                    event.target.value,
                  )
                }
              />

              <p className="mt-1 text-[11px] text-[#9A7552]">
                Additional charge for customization on
                this line item.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[#73766F]">
        {label}
      </label>

      <Input
        type="number"
        min="0"
        max={max}
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value) || 0,
          )
        }
        className="mt-2"
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span
        className={
          strong
            ? "font-semibold text-[#242624]"
            : "text-[#73766F]"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-lg font-semibold text-[#244A3D]"
            : "font-medium"
        }
      >
        ${value.toFixed(2)}
      </span>
    </div>
  );
}