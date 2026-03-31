export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="skeleton w-16 h-16 rounded-full mb-4" />
          <div className="skeleton h-7 w-48 rounded-xl mb-2" />
          <div className="skeleton h-4 w-36 rounded-lg" />
        </div>
        <div className="glass-card p-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-3 w-16 rounded-md mb-2" />
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          ))}
          <div className="skeleton h-11 w-full rounded-xl mt-2" />
        </div>
      </div>
    </div>
  );
}
