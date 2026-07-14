import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, CheckCircle2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getGroupConfig, buildLevelMeta, isLevelUnlocked } from "@/lib/subskills/connectors";
import {
  groupToPartKey,
  CONN_KIND_LABEL,
  type ConnKind,
  type LevelSlug,
  type BestScore,
} from "@/lib/subskills/connectors/types";

type Props = { params: Promise<{ group: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group } = await params;
  const config = getGroupConfig(group);
  return { title: config ? `${config.name} — Liên từ & Từ nối` : "Liên từ & Từ nối" };
}

const LEVEL_SLUGS: LevelSlug[] = ["l1", "l2", "l3", "l4", "l5", "l6"];

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  easy:   { bg: "#dcfce7", color: "#15803d", label: "Easy" },
  medium: { bg: "#fef9c3", color: "#a16207", label: "Medium" },
  hard:   { bg: "#fee2e2", color: "#b91c1c", label: "Hard" },
};

const KIND_COLOR: Record<ConnKind, { bg: string; color: string; border: string }> = {
  conj: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  prep: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  adv:  { bg: "#fef3c7", color: "#a16207", border: "#fde68a" },
};

const KIND_ORDER: ConnKind[] = ["conj", "prep", "adv"];

export default async function ConnectorGroupPage({ params }: Props) {
  const { group } = await params;
  const config = getGroupConfig(group);
  if (!config) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile
        .findUnique({ where: { id: user.id }, select: { studentCode: true } })
        .catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const partKey = groupToPartKey(group);
  const rawAttempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: partKey },
          select: { questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const best: Record<string, BestScore> = {};
  for (const a of rawAttempts) {
    const cur = best[a.questionWord];
    if (!cur || a.score > cur.score) {
      best[a.questionWord] = { score: a.score, passed: a.passed };
    }
  }

  const levelMeta = buildLevelMeta();
  const hasContent = config.levels.length > 0;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 900,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>/</span>
        <Link href="/subskills/reading" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Reading</Link>
        <span>/</span>
        <Link href="/subskills/reading/connectors" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Liên từ & Từ nối</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{config.name}</span>
      </div>

      {/* Group header */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: "1.5rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {config.name}
              </h1>
              <div style={{ display: "flex", gap: "2px" }}>
                {[1, 2, 3].map((i) => (
                  <Star key={i} size={12} fill={i <= config.importance ? "#f59e0b" : "none"} stroke={i <= config.importance ? "#f59e0b" : "#d1d5db"} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              {config.nameEn} · {config.description}
            </div>
          </div>

          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
              {LEVEL_SLUGS.filter((l) => best[l]?.passed).length}
              <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>/6</span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>levels passed</div>
          </div>
        </div>
      </div>

      {/* Theory table — connectors grouped by grammatical kind */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
          Bảng từ nối của nhóm này
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {KIND_ORDER.map((kind) => {
            const items = config.connectors.filter((c) => c.kind === kind);
            if (items.length === 0) return null;
            const col = KIND_COLOR[kind];

            return (
              <div
                key={kind}
                style={{
                  border: `1px solid ${col.border}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--bg-elevated)",
                }}
              >
                <div style={{
                  background: col.bg,
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: col.color,
                }}>
                  {CONN_KIND_LABEL[kind]}
                </div>
                <div style={{ padding: "0.6rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {items.map((c) => (
                    <div key={c.word} style={{ display: "flex", gap: "0.6rem", alignItems: "baseline", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: col.color,
                        minWidth: 132,
                      }}>
                        {c.word}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{c.vi}</span>
                      {c.note && (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          — {c.note}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level cards */}
      <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
        6 Levels
      </h2>
      {!hasContent ? (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.875rem", border: "1px dashed var(--border)", borderRadius: 10 }}>
          Nội dung bài tập đang được soạn thảo. Bảng lý thuyết phía trên đã dùng được.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {levelMeta.map((meta) => {
            const levelBest = best[meta.slug];
            const unlocked = isLevelUnlocked(meta.slug as LevelSlug, best, isTestUser);
            const diff = DIFFICULTY_COLORS[meta.difficulty];
            const nQuestions = config.levels.find((l) => l.slug === meta.slug)?.questions.length ?? 0;

            return (
              <LevelCard
                key={meta.slug}
                meta={meta}
                diff={diff}
                unlocked={nQuestions > 0 && unlocked}
                comingSoon={nQuestions === 0}
                best={levelBest ?? null}
                groupSlug={group}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function LevelCard({
  meta, diff, unlocked, comingSoon, best, groupSlug,
}: {
  meta: ReturnType<typeof buildLevelMeta>[number];
  diff: { bg: string; color: string; label: string };
  unlocked: boolean;
  comingSoon: boolean;
  best: BestScore | null;
  groupSlug: string;
}) {
  const content = (
    <div
      style={{
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
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: diff.bg,
        color: diff.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: "0.85rem",
        flexShrink: 0,
      }}>
        {meta.level}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
            {meta.name}
          </span>
          <span style={{
            fontSize: "0.58rem",
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 99,
            background: diff.bg,
            color: diff.color,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {diff.label}
          </span>
          {comingSoon && (
            <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sắp có
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
          {meta.description}
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        {!unlocked ? (
          <Lock size={16} style={{ color: "var(--text-muted)" }} />
        ) : best ? (
          <div>
            {best.passed && <CheckCircle2 size={14} style={{ color: "#16a34a", marginBottom: 2 }} />}
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: best.passed ? "#16a34a" : "var(--text-primary)", lineHeight: 1 }}>
              {best.score}%
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>best</div>
          </div>
        ) : (
          <span style={{ fontSize: "0.78rem", color: "var(--accent-primary)", fontWeight: 600 }}>Bắt đầu →</span>
        )}
      </div>
    </div>
  );

  if (unlocked) {
    return (
      <Link href={`/subskills/reading/connectors/${groupSlug}/${meta.slug}`} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}
