import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { CONNECTOR_GROUPS } from "@/lib/subskills/connectors";
import { groupToPartKey, CONN_KIND_LABEL, type ConnKind } from "@/lib/subskills/connectors/types";

export const metadata: Metadata = { title: "Liên từ & Từ nối — Part 5 & 6" };

const LEVEL_SLUGS = ["l1", "l2", "l3", "l4", "l5", "l6"] as const;
const TOTAL_LEVELS = LEVEL_SLUGS.length;

const KIND_COLOR: Record<ConnKind, { bg: string; color: string; border: string; short: string }> = {
  conj: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", short: "Liên từ" },
  prep: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", short: "Giới từ" },
  adv:  { bg: "#fef3c7", color: "#a16207", border: "#fde68a", short: "Trạng từ" },
};

export default async function ConnectorsGroupListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: { startsWith: "conn-" } },
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

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 1100,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>/</span>
        <Link href="/subskills/reading" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Reading</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Liên từ & Từ nối</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          Liên từ & Từ nối — Part 5 & 6
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Học theo 10 nhóm quan hệ logic. Mỗi nhóm có 6 levels: phân loại ngữ pháp → nghĩa & sắc thái → bẫy cấu trúc → bẫy ngữ nghĩa → Part 6 → đề thi thật.
        </p>
      </div>

      {/* Core idea callout */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--accent-primary)",
        borderRadius: 8,
        padding: "0.9rem 1.1rem",
        marginBottom: "2rem",
      }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
          Nguyên tắc cốt lõi
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
          ETS thường ra 4 đáp án <strong>cùng nghĩa nhưng khác loại</strong>. Chỉ cần nhìn phần <strong>SAU chỗ trống</strong> là loại được 2–3 đáp án mà chưa cần hiểu nghĩa:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
          {(Object.keys(CONN_KIND_LABEL) as ConnKind[]).map((k) => (
            <span
              key={k}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 99,
                background: KIND_COLOR[k].bg,
                color: KIND_COLOR[k].color,
                border: `1px solid ${KIND_COLOR[k].border}`,
              }}
            >
              {CONN_KIND_LABEL[k]}
            </span>
          ))}
        </div>
      </div>

      {/* Group grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "0.875rem" }}>
        {CONNECTOR_GROUPS.map((group) => {
          const partKey = groupToPartKey(group.slug);
          const groupBest = best[partKey] ?? {};
          const passedLevels = LEVEL_SLUGS.filter((l) => groupBest[l]?.passed).length;
          const startedLevels = LEVEL_SLUGS.filter((l) => groupBest[l] !== undefined).length;
          const pct = Math.round((passedLevels / TOTAL_LEVELS) * 100);
          const hasContent = group.levels.length > 0;

          const card = (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.25 }}>
                    {group.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    {group.nameEn} · {group.connectors.length} từ
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

              {/* Sample connectors */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                {group.connectors.slice(0, 4).map((c) => (
                  <span
                    key={c.word}
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: KIND_COLOR[c.kind].bg,
                      color: KIND_COLOR[c.kind].color,
                      border: `1px solid ${KIND_COLOR[c.kind].border}`,
                    }}
                  >
                    {c.word}
                  </span>
                ))}
                {group.connectors.length > 4 && (
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", alignSelf: "center" }}>
                    +{group.connectors.length - 4}
                  </span>
                )}
              </div>

              {hasContent ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
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
              ) : (
                <span style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                  alignSelf: "flex-start",
                }}>
                  Đang soạn nội dung
                </span>
              )}
            </>
          );

          const baseStyle = {
            display: "flex",
            flexDirection: "column" as const,
            padding: "1.25rem",
            borderRadius: "var(--radius-lg, 12px)",
            gap: "0.75rem",
          };

          return hasContent ? (
            <Link
              key={group.slug}
              href={`/subskills/reading/connectors/${group.slug}`}
              style={{
                ...baseStyle,
                border: passedLevels === TOTAL_LEVELS
                  ? "1.5px solid #16a34a"
                  : startedLevels > 0
                  ? "1.5px solid var(--accent-primary)"
                  : "1px solid var(--border)",
                background: "var(--bg-elevated)",
                textDecoration: "none",
              }}
            >
              {card}
            </Link>
          ) : (
            <div
              key={group.slug}
              style={{
                ...baseStyle,
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                opacity: 0.6,
              }}
            >
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
