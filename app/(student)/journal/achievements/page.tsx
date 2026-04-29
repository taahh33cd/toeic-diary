import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { computeUnlocked } from "@/lib/achievement-check";

export const metadata = { title: "Thành tựu" };

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/journal/achievements");

  const { ids: unlocked, progress } = await computeUnlocked(user.id);
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">🏆 Thành tựu</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Đã mở khoá <b>{unlockedCount}</b> / {ACHIEVEMENTS.length} huy hiệu
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.has(a.id);
          return (
            <div
              key={a.id}
              className="rounded-2xl p-4 border flex flex-col items-center text-center gap-2 transition"
              style={{
                background: isUnlocked ? "var(--bg-elevated)" : "var(--bg-primary)",
                borderColor: "var(--border)",
                opacity: isUnlocked ? 1 : 0.55,
                boxShadow: isUnlocked ? "var(--shadow-sm)" : "none",
              }}
            >
              <span
                className="text-4xl leading-none"
                style={{ filter: isUnlocked ? "none" : "grayscale(0.8)" }}
              >
                {a.icon}
              </span>
              <div className="text-sm font-semibold">{a.label}</div>
              <div
                className="text-xs leading-snug"
                style={{ color: "var(--text-secondary)" }}
              >
                {a.desc}
              </div>
              {progress[a.id] && !isUnlocked && (
                <div
                  className="text-[10px] font-mono mt-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {progress[a.id]}
                </div>
              )}
              {isUnlocked && (
                <div
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--accent-primary, #C4622D)" }}
                >
                  ✓ Đã đạt
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
