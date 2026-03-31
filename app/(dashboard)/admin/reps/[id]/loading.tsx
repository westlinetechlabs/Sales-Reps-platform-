export default function AdminRepViewLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="skeleton h-4 w-28 rounded-lg mb-6 mt-12 lg:mt-0" />

      {/* Profile card */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="skeleton w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="skeleton h-7 w-44 rounded-xl" />
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-4 w-40 rounded-md" />
              <div className="skeleton h-4 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="skeleton h-3 w-20 rounded-md mb-3" />
            <div className="skeleton h-7 w-28 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--surface-4)" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton flex-1 h-9 rounded-lg" />
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="skeleton h-5 w-36 rounded-lg mb-2" />
                <div className="skeleton h-3 w-28 rounded-md" />
              </div>
              <div className="skeleton h-6 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
