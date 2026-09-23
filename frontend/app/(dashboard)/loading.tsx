export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 lg:space-y-8">
      <div>
        <div className="h-4 w-32 rounded bg-[#E8E6E0]" />
        <div className="mt-3 h-8 w-72 max-w-full rounded bg-[#E8E6E0]" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#EEECE6]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-2xl border border-[#E5E2DA] bg-white"
          />
        ))}
      </div>

      <div className="h-[380px] rounded-2xl border border-[#E5E2DA] bg-white" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-2xl border border-[#E5E2DA] bg-white" />
        <div className="h-80 rounded-2xl border border-[#E5E2DA] bg-white" />
      </div>
    </div>
  );
}