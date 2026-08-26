import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { VERB_GROUPS, VERBS } from "@/lib/subskills/verbs";
import { groupToPartKey } from "@/lib/subskills/verbs/types";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Động từ bất quy tắc — Subskills" };

const LEVEL_SLUGS = ["l1", "l2", "l3", "l4", "l5", "l6"] as const;
const TOTAL_LEVELS = LEVEL_SLUGS.length;

export default async function VerbsGroupListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: { startsWith: "verb-" } },
          select: { part: true, questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const best: Record<string, Record<string, { score: number; passed: boolean }>> = {};
  for (const a of attempts) {
    if (!best[a.part]) best[a.part] = {};
    const cur = best[a.part][a.questionWord];
    if (!cur || a.score > cur.score) {
      best[a.part][a.questionWord] = { score: a.score, passed: a.passed };
    }
  }

  const totalPassed = VERB_GROUPS.reduce((sum, g) => {
    const gb = best[groupToPartKey(g.slug)] ?? {};
    return sum + LEVEL_SLUGS.filter((l) => gb[l]?.passed).length;
  }, 0);

  return (
    <div
      style={{
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: `${PAD_Y} ${PAD_X}`,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Động từ bất quy tắc</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          Động từ bất quy tắc — {VERBS.length} từ trọng tâm
        </h1>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Học theo 6 nhóm quy luật biến đổi. Mỗi nhóm có 6 levels: nhận diện dạng → gõ V2 → gõ V3 → gõ cả hai → điền vào câu → đề thi thật.
        </p>
      </div>

      {/* Method callout */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--accent-primary)",
        borderRadius: 8,
        padding: "0.9rem 1.1rem",
        marginBottom: "2rem",
      }}>
        <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
          Cách học hiệu quả
        </div>
        <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
          Ở đây bạn phải <strong>tự gõ đáp án</strong>, không chọn A/B/C/D. Chọn đáp án chỉ cần <em>nhận ra</em>,
          nhưng khi đi thi bạn phải <em>tự nhớ ra</em> — đó là lý do gõ lại giúp nhớ lâu hơn hẳn.
          Các động từ được nhóm theo quy luật biến đổi để bạn nhớ theo cụm thay vì học vẹt từng từ.
        </p>
        <div style={{ marginTop: "0.75rem", fontSize: FS.sm, color: "var(--text-muted)" }}>
          Đã pass <strong style={{ color: "var(--text-primary)" }}>{totalPassed}</strong>/{VERB_GROUPS.length * TOTAL_LEVELS} levels
        </div>
      </div>

      {/* Group grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "0.875rem" }}>
        {VERB_GROUPS.map((group) => {
          const gb = best[groupToPartKey(group.slug)] ?? {};
          const passedLevels = LEVEL_SLUGS.filter((l) => gb[l]?.passed).length;
          const startedLevels = LEVEL_SLUGS.filter((l) => gb[l] !== undefined).length;
          const pct = Math.round((passedLevels / TOTAL_LEVELS) * 100);

          return (
            <Link
              key={group.slug}
              href={`/subskills/verbs/${group.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.25rem",
                borderRadius: "var(--radius-lg, 12px)",
                gap: "0.75rem",
                border: passedLevels === TOTAL_LEVELS
                  ? "1.5px solid #16a34a"
                  : startedLevels > 0
                  ? "1.5px solid var(--accent-primary)"
                  : "1px solid var(--border)",
                background: "var(--bg-elevated)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: FS.md, color: "var(--text-primary)", lineHeight: 1.25 }}>
                    {group.name}
                  </div>
                  <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    {group.verbs.length} động từ
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1px", flexShrink: 0 }}>
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      size={11}
                      fill={i <= group.importance ? "#f59e0b" : "none"}
                      stroke={i <= group.importance ? "#f59e0b" : "#d1d5db"}
                    />
                  ))}
                </div>
              </div>

              <span style={{
                alignSelf: "flex-start",
                fontSize: FS.xs,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 5,
                padding: "3px 9px",
                color: "var(--accent-primary)",
              }}>
                {group.sample}
              </span>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  <span>{passedLevels}/{TOTAL_LEVELS} levels passed</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 99,
                    width: `${pct}%`,
                    background: passedLevels === TOTAL_LEVELS ? "#16a34a" : "var(--accent-primary)",
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
