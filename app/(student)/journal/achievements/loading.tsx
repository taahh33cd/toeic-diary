export default function AchievementsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-48 rounded-lg" style={{ background: "var(--border)" }} />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    </div>
  );
}
