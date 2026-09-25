"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Home,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function DashboardError({
  error,
  reset,
}: ErrorPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#E5E2DA] bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-6 text-red-600" />
        </div>

        <h1 className="text-xl font-semibold text-[#242624]">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#73766F]">
          We couldn&apos;t load this page.
          Please try again or return to the dashboard.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={() => reset()}
            className="bg-[#244A3D] hover:bg-[#19372D]"
          >
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>

          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <Home className="mr-2 size-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}