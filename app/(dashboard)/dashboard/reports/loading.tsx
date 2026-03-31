export default function ReportsLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6 mt-12 lg:mt-0">
        <div className="skeleton w-6 h-6 rounded-lg" />
        <div>
          <div className="skeleton h-7 w-28 rounded-xl mb-1" />
          <div className="skeleton h-3 w-40 rounded-lg" />
        </div>
      </div>

      {/* Period pills */}
      <div className="flex gap-2 mb-6">
        {["Today", "This Week", "This Month"].map((_, i) => (
          <div key={i} className="skeleton h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="skeleton h-3 w-20 rounded-md mb-3" />
            <div className="skeleton h-7 w-24 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Rep summary cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div>
                  <div className="skeleton h-5 w-32 rounded-lg mb-1" />
                  <div className="skeleton h-3 w-44 rounded-md" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="skeleton h-8 w-16 rounded-xl" />
                <div className="skeleton h-8 w-14 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
