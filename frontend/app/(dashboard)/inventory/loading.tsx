export default function InventoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-gray-100" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl bg-gray-100"
          />
        ))}
      </div>

      <div className="h-16 rounded-2xl bg-gray-100" />
      <div className="h-80 rounded-2xl bg-gray-100" />
    </div>
  );
}