export default function ProductsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-32 rounded bg-[#E8E6E0]" />
        <div className="mt-3 h-8 w-52 rounded bg-[#E8E6E0]" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#EEECE6]" />
      </div>

      <div className="h-24 rounded-2xl border border-[#E5E2DA] bg-white" />

      <div className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-20 border-b border-[#EEECE6] last:border-0"
          />
        ))}
      </div>
    </div>
  );
}