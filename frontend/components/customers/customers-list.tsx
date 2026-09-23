"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/api/customers";

export function CustomersList({
  customers,
}: {
  customers: Customer[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.address
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [customers, search]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9C96]" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, phone or address..."
            className="h-11 pl-10"
          />
        </div>

        <p className="mt-3 text-sm text-[#73766F]">
          {filtered.length} of {customers.length} customers
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCDAD3] bg-white px-6 py-16 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#EEF3F0] text-[#244A3D]">
            <UserRound className="size-5" />
          </div>

          <h3 className="mt-4 font-semibold">
            No customers found
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            {customers.length === 0
              ? "Add your first customer to get started."
              : "Try changing your search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="group rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#CFCBC1] hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#EEF3F0] font-semibold text-[#244A3D]">
                  {getInitials(customer.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#242624]">
                        {customer.name}
                      </h3>

                      <p className="mt-1 text-sm text-[#73766F]">
                        {customer.phone}
                      </p>
                    </div>

                    <ChevronRight className="mt-1 size-4 shrink-0 text-[#9A9C96] transition group-hover:translate-x-0.5" />
                  </div>

                  {customer.address && (
                    <div className="mt-3 flex items-start gap-1.5 text-sm text-[#73766F]">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span className="line-clamp-1">
                        {customer.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}