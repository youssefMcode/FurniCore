"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ReceiptText, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Sale } from "@/lib/api/sales";

export function SalesList({
  sales,
}: {
  sales: Sale[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return sales;

    return sales.filter(
      (sale) =>
        sale.invoice_number
          .toLowerCase()
          .includes(query) ||
        sale.customers?.name
          .toLowerCase()
          .includes(query) ||
        sale.customers?.phone
          .toLowerCase()
          .includes(query),
    );
  }, [sales, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9C96]" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search invoice or customer..."
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <ReceiptText className="mx-auto size-7 text-[#9A9C96]" />
          <p className="mt-3 font-medium">
            No sales found
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((sale) => (
            <Link
              key={sale.id}
              href={`/sales/${sale.id}`}
              className="grid gap-4 rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm transition hover:shadow-md sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
            >
              <div>
                <p className="font-semibold text-[#242624]">
                  {sale.invoice_number}
                </p>

                <p className="mt-1 text-sm text-[#73766F]">
                  {sale.customers?.name ??
                    "Walk-in customer"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#8A8D86]">
                  Total
                </p>
                <p className="font-semibold">
                  ${Number(sale.total).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#8A8D86]">
                  Balance
                </p>
                <p className="font-semibold">
                  ${Number(sale.balance).toFixed(2)}
                </p>
              </div>

              <PaymentBadge
                status={sale.payment_status}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentBadge({
  status,
}: {
  status: Sale["payment_status"];
}) {
  if (status === "paid") {
    return (
      <Badge className="bg-green-50 text-green-700">
        Paid
      </Badge>
    );
  }

  if (status === "partial") {
    return (
      <Badge className="bg-amber-50 text-amber-700">
        Partial
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-50 text-red-700">
      Unpaid
    </Badge>
  );
}