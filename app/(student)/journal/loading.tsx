export default function JournalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg" style={{ background: "var(--border)" }} />
        <div className="h-4 w-36 rounded" style={{ background: "var(--border)" }} />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
      {/* Content card */}
      <div className="h-40 rounded-xl" style={{ background: "var(--border)" }} />
      <div className="h-32 rounded-xl" style={{ background: "var(--border)" }} />
    </div>
  );
}
