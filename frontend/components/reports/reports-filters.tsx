"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReportsFiltersProps {
  startDate: string;
  endDate: string;
}

export function ReportsFilters({
  startDate,
  endDate,
}: ReportsFiltersProps) {
  const router = useRouter();

  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [error, setError] = useState("");

  // Local date in YYYY-MM-DD format.
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    // Same day is valid. Only start > end is invalid.
    if (start && end && start > end) {
      setError(
        "Start date cannot be after end date.",
      );
      return;
    }

    // Reports should not include future dates.
    if (
      (start && start > today) ||
      (end && end > today)
    ) {
      setError(
        "Report dates cannot be in the future.",
      );
      return;
    }

    const params = new URLSearchParams();

    if (start) {
      params.set("start", start);
    }

    if (end) {
      params.set("end", end);
    }

    const query = params.toString();

    router.push(
      query
        ? `/reports?${query}`
        : "/reports",
    );
  }

  function reset() {
    setStart("");
    setEnd("");
    setError("");
    router.push("/reports");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#244A3D]">
        <CalendarDays className="size-5" />
      </div>

      <label className="flex-1">
        <span className="mb-1.5 block text-xs font-medium text-[#73766F]">
          Start Date
        </span>

        <input
          type="date"
          value={start}
          max={today}
          onChange={(event) => {
            setStart(event.target.value);
            setError("");
          }}
          className="h-10 w-full rounded-lg border border-[#E5E2DA] bg-white px-3 text-sm outline-none focus:border-[#244A3D]"
        />
      </label>

      <label className="flex-1">
        <span className="mb-1.5 block text-xs font-medium text-[#73766F]">
          End Date
        </span>

        <input
          type="date"
          value={end}
          max={today}
          onChange={(event) => {
            setEnd(event.target.value);
            setError("");
          }}
          className="h-10 w-full rounded-lg border border-[#E5E2DA] bg-white px-3 text-sm outline-none focus:border-[#244A3D]"
        />
      </label>

      <div className="flex gap-2">
        <Button type="submit">
          Apply
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={reset}
        >
          Last 30 Days
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </form>
  );
}