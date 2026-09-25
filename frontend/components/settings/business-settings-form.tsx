"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { BusinessSettings } from "@/lib/api/business-settings";

export function BusinessSettingsForm({
  settings,
}: {
  settings: BusinessSettings;
}) {
  const router = useRouter();

  const [businessName, setBusinessName] =
    useState(settings.business_name);

  const [phone, setPhone] = useState(
    settings.phone ?? "",
  );

  const [address, setAddress] = useState(
    settings.address ?? "",
  );

  const [currency, setCurrency] = useState(
    settings.currency,
  );

  const [logoUrl, setLogoUrl] = useState(
    settings.logo_url,
  );

  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function getSessionToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "Your session has expired.",
      );
    }

    return session.access_token;
  }

  function getApiUrl() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      throw new Error(
        "API URL is not configured.",
      );
    }

    return apiUrl;
  }

  async function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Logo must be a JPG, PNG, or WebP image.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Logo must be 5 MB or smaller.",
      );
      event.target.value = "";
      return;
    }

    setLogoLoading(true);

    try {
      const token = await getSessionToken();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${getApiUrl()}/api/business-settings/logo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to upload logo.",
        );
      }

      setLogoUrl(data.logo_url);

      setSuccess(
        "Business logo updated successfully.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload logo.",
      );
    } finally {
      setLogoLoading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (businessName.trim().length < 2) {
      setError(
        "Business name is required.",
      );
      return;
    }

    if (
      currency.trim().length !== 3 ||
      !/^[A-Za-z]{3}$/.test(
        currency.trim(),
      )
    ) {
      setError(
        "Currency must be a 3-letter code such as USD.",
      );
      return;
    }

    setLoading(true);

    try {
      const token = await getSessionToken();

      const response = await fetch(
        `${getApiUrl()}/api/business-settings`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            business_name:
              businessName.trim(),
            phone: phone.trim() || null,
            address:
              address.trim() || null,
            currency: currency
              .trim()
              .toUpperCase(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to update settings.",
        );
      }

      setBusinessName(
        data.business_name,
      );
      setPhone(data.phone ?? "");
      setAddress(data.address ?? "");
      setCurrency(data.currency);
      setLogoUrl(data.logo_url ?? logoUrl);

      setSuccess(
        "Business settings updated successfully.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center gap-3 border-b border-[#EEECE6] pb-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F3EFE8] text-[#244A3D]">
          <Building2 className="size-5" />
        </div>

        <div>
          <h3 className="font-semibold">
            Business Information
          </h3>

          <p className="text-sm text-[#73766F]">
            Information used across
            FurniCore.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Logo */}
        <div>
          <span className="mb-2 block text-sm font-medium">
            Business Logo
          </span>

          <div className="flex flex-col gap-4 rounded-xl border border-[#E5E2DA] p-4 sm:flex-row sm:items-center">
            <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F8F7F3] sm:w-40">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${businessName} logo`}
                  width={180}
                  height={120}
                  className="h-full w-full object-contain p-3"
                  unoptimized
                />
              ) : (
                <Building2 className="size-9 text-[#73766F]" />
              )}
            </div>

            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E2DA] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[#F8F7F3]">
                <Upload className="size-4" />

                {logoLoading
                  ? "Uploading..."
                  : logoUrl
                    ? "Change Logo"
                    : "Upload Logo"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={logoLoading}
                  onChange={
                    handleLogoUpload
                  }
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-xs text-[#73766F]">
                JPG, PNG or WebP. Maximum
                5 MB.
              </p>

              <p className="mt-1 text-xs text-[#73766F]">
                Used for business branding
                and printable invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Business name */}
        <label>
          <span className="mb-2 block text-sm font-medium">
            Business Name *
          </span>

          <input
            value={businessName}
            onChange={(event) =>
              setBusinessName(
                event.target.value,
              )
            }
            maxLength={150}
            className={inputClass}
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Phone */}
          <label>
            <span className="mb-2 block text-sm font-medium">
              Phone
            </span>

            <input
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value,
                )
              }
              maxLength={50}
              className={inputClass}
              placeholder="+961..."
            />
          </label>

          {/* Currency */}
          <label>
            <span className="mb-2 block text-sm font-medium">
              Currency *
            </span>

            <input
              value={currency}
              onChange={(event) =>
                setCurrency(
                  event.target.value.toUpperCase(),
                )
              }
              maxLength={3}
              className={inputClass}
              placeholder="USD"
              required
            />

            <p className="mt-1 text-xs text-[#73766F]">
              ISO code such as USD, EUR or
              LBP.
            </p>
          </label>
        </div>

        {/* Address */}
        <label>
          <span className="mb-2 block text-sm font-medium">
            Address
          </span>

          <textarea
            value={address}
            onChange={(event) =>
              setAddress(
                event.target.value,
              )
            }
            maxLength={300}
            className={`${inputClass} min-h-24 resize-none py-3`}
            placeholder="Business address"
          />
        </label>
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={
            loading || logoLoading
          }
        >
          {loading
            ? "Saving..."
            : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 text-sm outline-none transition focus:border-[#244A3D]";