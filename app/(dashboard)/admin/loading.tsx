export default function AdminLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-12 lg:pt-0">
        <div className="skeleton w-6 h-6 rounded-lg" />
        <div>
          <div className="skeleton h-7 w-24 rounded-xl mb-1" />
          <div className="skeleton h-3 w-36 rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="skeleton h-3 w-20 rounded-md mb-3" />
            <div className="skeleton h-8 w-28 rounded-xl mb-2" />
            <div className="skeleton h-3 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--surface-4)" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton flex-1 h-9 rounded-lg" />
        ))}
      </div>

      {/* Filter row */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-28 rounded-xl" />
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="skeleton h-5 w-40 rounded-lg mb-2" />
                <div className="skeleton h-3 w-28 rounded-md mb-2" />
                <div className="skeleton h-8 w-32 rounded-xl" />
              </div>
              <div className="text-right">
                <div className="skeleton h-6 w-24 rounded-lg mb-1" />
                <div className="skeleton h-3 w-16 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
