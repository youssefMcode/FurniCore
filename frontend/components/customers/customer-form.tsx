"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";
import type {
  Customer,
  CustomerPayload,
} from "@/lib/api/customers";

interface Props {
  customer?: Customer;
}

export function CustomerForm({ customer }: Props) {
  const router = useRouter();
  const editing = Boolean(customer);

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(
    customer?.address ?? "",
  );
  const [notes, setNotes] = useState(
    customer?.notes ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      setError(
        "Customer name must contain at least 2 characters.",
      );
      return;
    }

    if (cleanPhone.length < 5) {
      setError("Please enter a valid phone number.");
      return;
    }

    const payload: CustomerPayload = {
      name: cleanName,
      phone: cleanPhone,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    setError("");

    try {
      const endpoint = editing
        ? `/api/customers/${customer!.id}`
        : "/api/customers";

      const response = await authenticatedFetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const savedCustomer = await response.json();

      router.push(`/customers/${savedCustomer.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save customer.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Customer name" required>
          <Input
            value={name}
            maxLength={120}
            required
            placeholder="e.g. Ahmad Khalil"
            onChange={(event) =>
              setName(event.target.value)
            }
          />
        </Field>

        <Field label="Phone number" required>
          <Input
            type="tel"
            value={phone}
            maxLength={30}
            required
            placeholder="e.g. +961 70 123 456"
            onChange={(event) =>
              setPhone(event.target.value)
            }
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Address">
            <Input
              value={address}
              maxLength={300}
              placeholder="Customer address"
              onChange={(event) =>
                setAddress(event.target.value)
              }
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[#242624]">
            Notes
          </label>

          <textarea
            value={notes}
            maxLength={1000}
            rows={4}
            placeholder="Optional notes about this customer..."
            onChange={(event) =>
              setNotes(event.target.value)
            }
            className="w-full resize-none rounded-lg border border-[#DCDAD3] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#244A3D] focus:ring-2 focus:ring-[#244A3D]/10"
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#EEECE6] pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => router.back()}
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

          {saving
            ? "Saving..."
            : editing
              ? "Save changes"
              : "Create customer"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#242624]">
        {label}
        {required && (
          <span className="ml-1 text-red-600">*</span>
        )}
      </label>

      {children}
    </div>
  );
}