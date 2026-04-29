export default function MissionsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-36 rounded-lg" style={{ background: "var(--border)" }} />
      <div className="h-16 rounded-xl" style={{ background: "var(--border)" }} />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-36 rounded-xl" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
