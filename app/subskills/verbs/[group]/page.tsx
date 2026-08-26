import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, CheckCircle2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getVerbGroup, buildLevelMeta, isLevelUnlocked } from "@/lib/subskills/verbs";
import { groupToPartKey, type LevelSlug, type BestScore } from "@/lib/subskills/verbs/types";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ group: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group } = await params;
  const config = getVerbGroup(group);
  return { title: config ? `${config.name} — Động từ bất quy tắc` : "Động từ bất quy tắc" };
}

const LEVEL_SLUGS: LevelSlug[] = ["l1", "l2", "l3", "l4", "l5", "l6"];

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  easy:   { bg: "#dcfce7", color: "#15803d", label: "Easy" },
  medium: { bg: "#fef9c3", color: "#a16207", label: "Medium" },
  hard:   { bg: "#fee2e2", color: "#b91c1c", label: "Hard" },
};

export default async function VerbGroupPage({ params }: Props) {
  const { group } = await params;
  const config = getVerbGroup(group);
  if (!config) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const partKey = groupToPartKey(group);
  const rawAttempts = user
    ? await prisma.subskillAttempt
        .findMany({ where: { userId: user.id, part: partKey }, select: { questionWord: true, score: true, passed: true } })
        .catch(() => [])
    : [];

  const best: Record<string, BestScore> = {};
  for (const a of rawAttempts) {
    const cur = best[a.questionWord];
    if (!cur || a.score > cur.score) best[a.questionWord] = { score: a.score, passed: a.passed };
  }

  const levelMeta = buildLevelMeta();

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
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem", fontSize: FS.xs, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>/</span>
        <Link href="/subskills/verbs" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Động từ bất quy tắc</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{config.name}</span>
      </div>

      {/* Group header */}
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg, 12px)",
        padding: "1.5rem",
        marginBottom: "1.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
              <h1 style={{ fontSize: FS.lg, fontWeight: 800, color: "var(--text-primary)" }}>{config.name}</h1>
              <div style={{ display: "flex", gap: "2px" }}>
                {[1, 2, 3].map((i) => (
                  <Star key={i} size={12} fill={i <= config.importance ? "#f59e0b" : "none"} stroke={i <= config.importance ? "#f59e0b" : "#d1d5db"} />
                ))}
              </div>
            </div>
            <div style={{
              display: "inline-block",
              fontSize: FS.sm,
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "3px 10px",
              color: "var(--accent-primary)",
              marginBottom: "0.6rem",
            }}>
              {config.sample}
            </div>
            <div style={{ fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {config.description}
            </div>
          </div>

          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: FS.xl, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
              {LEVEL_SLUGS.filter((l) => best[l]?.passed).length}
              <span style={{ fontSize: FS.md, color: "var(--text-muted)", fontWeight: 500 }}>/6</span>
            </div>
            <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: "0.2rem" }}>levels passed</div>
          </div>
        </div>
      </div>

      {/* Verb table */}
      <h2 style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
        Bảng {config.verbs.length} động từ của nhóm này
      </h2>
      <div style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: "1.75rem",
        background: "var(--bg-elevated)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.1fr 1.1fr 1.4fr",
          gap: "0.5rem",
          padding: "0.5rem 0.9rem",
          background: "var(--bg-secondary)",
          fontSize: FS.xs,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-muted)",
        }}>
          <span>V1</span><span>V2</span><span>V3</span><span>Nghĩa</span>
        </div>
        {config.verbs.map((v, i) => (
          <div
            key={v.v1}
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1.1fr 1.1fr 1.4fr",
              gap: "0.5rem",
              padding: "0.5rem 0.9rem",
              fontSize: FS.sm,
              borderTop: i === 0 ? "none" : "1px solid var(--border)",
              alignItems: "baseline",
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{v.v1}</span>
            <span style={{ color: "var(--text-primary)" }}>{v.v2}</span>
            <span style={{ color: "var(--text-primary)" }}>{v.v3}</span>
            <span style={{ color: "var(--text-muted)", fontSize: FS.xs }}>
              {v.vi}
              {v.note && (
                <span style={{ display: "block", fontSize: FS.xs, fontStyle: "italic", marginTop: 2, color: "#b45309" }}>
                  ⚠ {v.note}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Levels */}
      <h2 style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
        6 Levels
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {levelMeta.map((meta) => {
          const levelBest = best[meta.slug];
          const nQuestions = config.levels.find((l) => l.slug === meta.slug)?.questions.length ?? 0;
          const unlocked = nQuestions > 0 && isLevelUnlocked(meta.slug as LevelSlug, best, isTestUser);
          const diff = DIFFICULTY_COLORS[meta.difficulty];

          return (
            <LevelCard
              key={meta.slug}
              meta={meta}
              diff={diff}
              unlocked={unlocked}
              comingSoon={nQuestions === 0}
              best={levelBest ?? null}
              groupSlug={group}
            />
          );
        })}
      </div>
    </div>
  );
}

function LevelCard({ meta, diff, unlocked, comingSoon, best, groupSlug }: {
  meta: ReturnType<typeof buildLevelMeta>[number];
  diff: { bg: string; color: string; label: string };
  unlocked: boolean;
  comingSoon: boolean;
  best: BestScore | null;
  groupSlug: string;
}) {
  const content = (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1rem 1.25rem",
      borderRadius: "var(--radius-md, 8px)",
      border: best?.passed ? "1.5px solid #16a34a" : "1px solid var(--border)",
      background: best?.passed ? "#f0fdf4" : "var(--bg-elevated)",
      opacity: unlocked ? 1 : 0.55,
      cursor: unlocked ? "pointer" : "default",
      textDecoration: "none",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: diff.bg, color: diff.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: FS.sm, flexShrink: 0,
      }}>
        {meta.level}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: FS.sm, color: "var(--text-primary)" }}>{meta.name}</span>
          <span style={{
            fontSize: FS.xs, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
            background: diff.bg, color: diff.color, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {diff.label}
          </span>
          {comingSoon && (
            <span style={{ fontSize: FS.xs, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sắp có
            </span>
          )}
        </div>
        <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: "0.15rem" }}>
          {meta.description}
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        {!unlocked ? (
          <Lock size={16} style={{ color: "var(--text-muted)" }} />
        ) : best ? (
          <div>
            {best.passed && <CheckCircle2 size={14} style={{ color: "#16a34a", marginBottom: 2 }} />}
            <div style={{ fontSize: FS.md, fontWeight: 800, color: best.passed ? "#16a34a" : "var(--text-primary)", lineHeight: 1 }}>
              {best.score}%
            </div>
            <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>best</div>
          </div>
        ) : (
          <span style={{ fontSize: FS.xs, color: "var(--accent-primary)", fontWeight: 600 }}>Bắt đầu →</span>
        )}
      </div>
    </div>
  );

  if (unlocked) {
    return (
      <Link href={`/subskills/verbs/${groupSlug}/${meta.slug}`} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}
