export default function ErrorLogLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-56 rounded-lg" style={{ background: "var(--border)" }} />
      <div className="flex gap-2">
        <div className="h-9 w-36 rounded-lg" style={{ background: "var(--border)" }} />
        <div className="h-9 w-36 rounded-lg" style={{ background: "var(--border)" }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
