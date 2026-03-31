export default function WithdrawalsLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 mt-12 lg:mt-0">
        <div className="skeleton w-6 h-6 rounded-lg" />
        <div>
          <div className="skeleton h-7 w-32 rounded-xl mb-1" />
          <div className="skeleton h-3 w-40 rounded-lg" />
        </div>
      </div>

      {/* Balance card */}
      <div className="glass-card p-6 mb-6">
        <div className="skeleton h-3 w-28 rounded-md mb-2" />
        <div className="skeleton h-12 w-40 rounded-xl mb-2" />
        <div className="skeleton h-3 w-64 rounded-md mb-4" />
        <div className="skeleton h-10 w-44 rounded-xl" />
      </div>

      {/* History */}
      <div className="skeleton h-3 w-28 rounded-md mb-3" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="skeleton h-6 w-24 rounded-xl mb-2" />
                <div className="skeleton h-3 w-40 rounded-md" />
              </div>
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
