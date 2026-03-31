export default function ProfileLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 mt-12 lg:mt-0">
        <div className="skeleton w-8 h-8 rounded-xl" />
        <div>
          <div className="skeleton h-6 w-32 rounded-xl mb-1" />
          <div className="skeleton h-3 w-48 rounded-lg" />
        </div>
      </div>

      {/* Avatar card */}
      <div className="glass-card p-6 mb-4">
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton w-24 h-24 rounded-full" />
          <div className="skeleton h-5 w-36 rounded-xl" />
          <div className="skeleton h-4 w-24 rounded-lg" />
        </div>
      </div>

      {/* Info sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card p-5 mb-4">
          <div className="skeleton h-3 w-28 rounded-md mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <div className="skeleton h-4 w-24 rounded-md" />
                <div className="skeleton h-4 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
