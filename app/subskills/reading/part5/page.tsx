import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { TENSES } from "@/lib/subskills/reading";
import { tenseToPartKey } from "@/lib/subskills/reading/types";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Part 5 — Reading Subskills" };

const LEVEL_SLUGS = ["l1", "l2", "l3", "l4", "l5", "l6"] as const;
const TOTAL_LEVELS = LEVEL_SLUGS.length;

export default async function Part5TenseListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all r5-* attempts for this user in one query
  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: {
            userId: user.id,
            part: { startsWith: "r5-" },
          },
          select: { part: true, questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  // best[part][levelSlug] = {score, passed}
  const best: Record<string, Record<string, { score: number; passed: boolean }>> = {};
  for (const a of attempts) {
    if (!best[a.part]) best[a.part] = {};
    const cur = best[a.part][a.questionWord];
    if (!cur || a.score > cur.score) {
      best[a.part][a.questionWord] = { score: a.score, passed: a.passed };
    }
  }

  function getTenseProgress(slug: string) {
    const partKey = tenseToPartKey(slug);
    const tenseBest = best[partKey] ?? {};
    const passedLevels = LEVEL_SLUGS.filter((l) => tenseBest[l]?.passed).length;
    const startedLevels = LEVEL_SLUGS.filter((l) => tenseBest[l] !== undefined).length;
    return { passedLevels, startedLevels };
  }

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
        <Link href="/subskills/reading" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Reading</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Part 5</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "0.5rem" }}>
        <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          Part 5 — Ngữ pháp: 12 Thì
        </h1>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)" }}>
          Mỗi thì có 6 levels (L1–L6) từ nhận diện đến luyện đề TOEIC thật · Unlock bằng cách pass level trước ≥ 80%.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { label: "L1–L2", color: "#16a34a", bg: "#dcfce7", text: "Easy — luôn mở" },
          { label: "L3–L4", color: "#d97706", bg: "#fef9c3", text: "Medium — unlock khi L2 ≥ 80%" },
          { label: "L5–L6", color: "#dc2626", bg: "#fee2e2", text: "Hard — unlock khi L4 ≥ 80%" },
        ].map((d) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: FS.xs }}>
            <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: 99, background: d.bg, color: d.color, fontWeight: 700 }}>
              {d.label}
            </span>
            <span style={{ color: "var(--text-muted)" }}>{d.text}</span>
          </div>
        ))}
      </div>

      {/* Tense grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "0.875rem",
        }}
      >
        {TENSES.map((tense) => {
          const { passedLevels, startedLevels } = getTenseProgress(tense.slug);
          const hasContent = tense.levels.length > 0;
          const pct = Math.round((passedLevels / TOTAL_LEVELS) * 100);

          return (
            <div key={tense.slug}>
              {hasContent ? (
                <Link
                  href={`/subskills/reading/part5/${tense.slug}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1.25rem",
                    borderRadius: "var(--radius-lg, 12px)",
                    border: passedLevels === TOTAL_LEVELS
                      ? "1.5px solid #16a34a"
                      : startedLevels > 0
                      ? "1.5px solid var(--accent-primary)"
                      : "1px solid var(--border)",
                    background: "var(--bg-elevated)",
                    textDecoration: "none",
                    transition: "box-shadow 0.15s",
                    gap: "0.75rem",
                  }}
                >
                  <TenseCardContent tense={tense} passedLevels={passedLevels} startedLevels={startedLevels} pct={pct} />
                </Link>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1.25rem",
                    borderRadius: "var(--radius-lg, 12px)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    opacity: 0.6,
                    gap: "0.75rem",
                  }}
                >
                  <TenseCardContent tense={tense} passedLevels={0} startedLevels={0} pct={0} comingSoon />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TenseCardContent({
  tense,
  passedLevels,
  startedLevels,
  pct,
  comingSoon,
}: {
  tense: (typeof TENSES)[number];
  passedLevels: number;
  startedLevels: number;
  pct: number;
  comingSoon?: boolean;
}) {
  return (
    <>
      {/* Top row: name + importance stars */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: FS.md, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {tense.name}
          </div>
          <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: "0.15rem" }}>
            {tense.nameEn}
          </div>
        </div>
        <div style={{ display: "flex", gap: "1px", flexShrink: 0 }}>
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={11}
              fill={i <= tense.importance ? "#f59e0b" : "none"}
              stroke={i <= tense.importance ? "#f59e0b" : "#d1d5db"}
            />
          ))}
        </div>
      </div>

      {/* Formula */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        <span style={{
          fontSize: FS.xs,
          fontFamily: "var(--font-mono, monospace)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "2px 7px",
          color: "var(--text-secondary)",
        }}>
          {tense.formula}
        </span>
        {tense.formulaPassive && (
          <span style={{
            fontSize: FS.xs,
            fontFamily: "var(--font-mono, monospace)",
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 4,
            padding: "2px 7px",
            color: "#0369a1",
          }}>
            {tense.formulaPassive}
          </span>
        )}
      </div>

      {/* Progress or coming soon */}
      {comingSoon ? (
        <span style={{
          fontSize: FS.xs,
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
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.3rem" }}>
            <span>{passedLevels}/{TOTAL_LEVELS} levels passed</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                width: `${pct}%`,
                background: passedLevels === TOTAL_LEVELS ? "#16a34a" : "var(--accent-primary)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
