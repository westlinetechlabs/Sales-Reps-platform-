export default function BinLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="skeleton h-4 w-16 rounded-lg mb-6 mt-12 lg:mt-0" />
      <div className="skeleton h-7 w-40 rounded-xl mb-1" />
      <div className="skeleton h-4 w-56 rounded-lg mb-6" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="skeleton h-5 w-36 rounded-lg mb-2" />
                <div className="skeleton h-3 w-24 rounded-md mb-2" />
                <div className="skeleton h-3 w-44 rounded-md" />
              </div>
              <div className="skeleton h-7 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
