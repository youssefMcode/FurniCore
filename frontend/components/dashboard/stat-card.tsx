import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  warning?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  warning = false,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#73766F]">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            warning
              ? "bg-amber-50 text-amber-700"
              : "bg-[#EEF3F0] text-[#244A3D]"
          }`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#8A8D86]">
        {description}
      </p>
    </div>
  );
}