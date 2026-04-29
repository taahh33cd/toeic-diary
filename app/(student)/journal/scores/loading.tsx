export default function ScoresLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-40 rounded-lg" style={{ background: "var(--border)" }} />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
