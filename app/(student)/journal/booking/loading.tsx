export default function BookingLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-32 rounded-lg" style={{ background: "var(--border)" }} />
      <div className="h-48 rounded-xl" style={{ background: "var(--border)" }} />
      <div className="h-7 w-40 rounded-lg" style={{ background: "var(--border)" }} />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
