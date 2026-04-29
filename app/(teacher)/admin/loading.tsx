export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-lg" style={{ background: "var(--border)" }} />
        <div className="h-4 w-48 rounded" style={{ background: "var(--border)" }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
      <div className="h-40 rounded-xl" style={{ background: "var(--border)" }} />
    </div>
  );
}
