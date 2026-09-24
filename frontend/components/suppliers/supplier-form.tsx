"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Supplier } from "@/lib/api/suppliers";

export function SupplierForm({
  supplier,
}: {
  supplier?: Supplier;
}) {
  const router = useRouter();

  const [name, setName] = useState(
    supplier?.name ?? "",
  );
  const [phone, setPhone] = useState(
    supplier?.phone ?? "",
  );
  const [address, setAddress] = useState(
    supplier?.address ?? "",
  );
  const [notes, setNotes] = useState(
    supplier?.notes ?? "",
  );
  const [isActive, setIsActive] = useState(
    supplier?.is_active ?? true,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError(
        "Supplier name must contain at least 2 characters.",
      );
      return;
    }

    setLoading(true);
    setError("");

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
        supplier
          ? `${apiUrl}/api/suppliers/${supplier.id}`
          : `${apiUrl}/api/suppliers`,
        {
          method: supplier ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim() || null,
            address: address.trim() || null,
            notes: notes.trim() || null,
            ...(supplier
              ? { is_active: isActive }
              : {}),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to save supplier.",
        );
      }

      router.push(`/suppliers/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save supplier.",
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
        <Field label="Supplier Name" required>
          <input
            value={name}
            maxLength={150}
            onChange={(e) =>
              setName(e.target.value)
            }
            className={inputClass}
            placeholder="Furniture supplier"
            required
          />
        </Field>

        <Field label="Phone">
          <input
            value={phone}
            maxLength={50}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className={inputClass}
            placeholder="+961..."
          />
        </Field>
      </div>

      <Field label="Address">
        <input
          value={address}
          maxLength={300}
          onChange={(e) =>
            setAddress(e.target.value)
          }
          className={inputClass}
          placeholder="Supplier address"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          maxLength={1000}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          className={`${inputClass} min-h-28 resize-none py-3`}
          placeholder="Optional notes..."
        />
      </Field>

      {supplier && (
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) =>
              setIsActive(e.target.checked)
            }
          />

          Active supplier
        </label>
      )}

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
            : supplier
              ? "Save Changes"
              : "Create Supplier"}
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
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
        {required && (
          <span className="text-red-600">
            {" "}
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 text-sm outline-none transition focus:border-[#244A3D]";