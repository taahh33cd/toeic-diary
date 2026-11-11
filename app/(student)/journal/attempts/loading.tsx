export default function AttemptsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-48 rounded-lg" style={{ background: "var(--border)" }} />
      <div className="h-16 rounded-xl" style={{ background: "var(--border)" }} />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
