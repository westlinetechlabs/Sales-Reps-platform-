export default function NewBookingLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="skeleton h-4 w-16 rounded-lg mb-6 mt-12 lg:mt-0" />
      <div className="skeleton h-7 w-40 rounded-xl mb-6" />

      <div className="glass-card p-6 space-y-5">
        {/* 2-col fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-3 w-24 rounded-md mb-2" />
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        {/* Full-width textarea */}
        <div>
          <div className="skeleton h-3 w-20 rounded-md mb-2" />
          <div className="skeleton h-24 w-full rounded-xl" />
        </div>
        <div className="skeleton h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
