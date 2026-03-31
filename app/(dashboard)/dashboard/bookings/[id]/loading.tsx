export default function BookingDetailLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="skeleton h-4 w-16 rounded-lg mb-6 mt-12 lg:mt-0" />

      {/* Title area */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="skeleton h-8 w-52 rounded-xl mb-3" />
          <div className="skeleton h-6 w-28 rounded-full" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-16 rounded-xl" />
          <div className="skeleton h-8 w-16 rounded-xl" />
          <div className="skeleton h-8 w-16 rounded-xl" />
          <div className="skeleton h-8 w-20 rounded-xl" />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {[120, 90, 80, 100].map((h, i) => (
          <div key={i} className="glass-card p-5">
            <div className="skeleton h-3 w-32 rounded-md mb-4" />
            <div className="space-y-3">
              <div className="skeleton rounded-lg" style={{ height: h }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
