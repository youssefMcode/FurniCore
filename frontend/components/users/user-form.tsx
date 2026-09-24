"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type {
  StaffUser,
  UserRole,
} from "@/lib/api/users";

export function UserForm({
  user,
}: {
  user?: StaffUser;
}) {
  const router = useRouter();

  const [name, setName] = useState(
    user?.name ?? "",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<UserRole>(
    user?.role ?? "cashier",
  );

  const [isActive, setIsActive] = useState(
    user?.is_active ?? true,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter the staff member's name.");
      return;
    }

    if (!user && !email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!user && password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
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

      if (!apiUrl) {
        throw new Error(
          "API URL is not configured.",
        );
      }

      const body = user
        ? {
            name: name.trim(),
            role,
            is_active: isActive,
          }
        : {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role,
          };

      const response = await fetch(
        user
          ? `${apiUrl}/api/users/${user.id}`
          : `${apiUrl}/api/users`,
        {
          method: user ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ?? "Unable to save user.",
        );
      }

      router.push("/users");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save user.",
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
      <label>
        <span className="mb-2 block text-sm font-medium">
          Full Name *
        </span>

        <input
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          className={inputClass}
          maxLength={100}
          required
        />
      </label>

      {!user && (
        <>
          <label>
            <span className="mb-2 block text-sm font-medium">
              Email *
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className={inputClass}
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium">
              Temporary Password *
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className={inputClass}
              minLength={8}
              required
            />

            <p className="mt-1 text-xs text-[#73766F]">
              Minimum 8 characters.
            </p>
          </label>
        </>
      )}

      <label>
        <span className="mb-2 block text-sm font-medium">
          Role *
        </span>

        <select
          value={role}
          onChange={(event) =>
            setRole(
              event.target.value as UserRole,
            )
          }
          className={inputClass}
        >
          <option value="cashier">
            Cashier / Staff
          </option>

          <option value="admin">
            Admin / Owner
          </option>
        </select>
      </label>

      {user && (
        <label className="flex items-center gap-3 rounded-xl border border-[#E5E2DA] p-4">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(event.target.checked)
            }
          />

          <div>
            <p className="text-sm font-medium">
              Active account
            </p>

            <p className="text-xs text-[#73766F]">
              Inactive staff cannot access FurniCore.
            </p>
          </div>
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
            : user
              ? "Save Changes"
              : "Create Staff Account"}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 text-sm outline-none transition focus:border-[#244A3D]";