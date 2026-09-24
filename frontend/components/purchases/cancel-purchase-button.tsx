"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function CancelPurchaseButton({
  purchaseId,
}: {
  purchaseId: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    const confirmed = window.confirm(
      "Cancel this purchase? The purchased quantities will be removed from inventory.",
    );

    if (!confirmed) {
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/purchases/${purchaseId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to cancel purchase.",
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel purchase.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="destructive"
        disabled={loading}
        onClick={handleCancel}
      >
        {loading
          ? "Cancelling..."
          : "Cancel Purchase"}
      </Button>

      {error && (
        <p className="mt-2 max-w-md text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}