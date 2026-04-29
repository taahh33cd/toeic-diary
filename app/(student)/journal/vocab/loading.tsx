export default function VocabLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-lg" style={{ background: "var(--border)" }} />
        <div className="h-8 w-24 rounded-full" style={{ background: "var(--border)" }} />
      </div>
      <div className="h-10 rounded-xl" style={{ background: "var(--border)" }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    </div>
  );
}
