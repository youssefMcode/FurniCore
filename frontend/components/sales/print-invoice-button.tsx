"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PrintInvoiceButton() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <Button
        type="button"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Print Invoice
      </Button>
    </div>
  );
}