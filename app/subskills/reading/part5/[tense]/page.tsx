import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, CheckCircle2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getTenseConfig, buildLevelMeta, isLevelUnlocked } from "@/lib/subskills/reading";
import { tenseToPartKey, type LevelSlug, type BestScore } from "@/lib/subskills/reading/types";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ tense: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tense } = await params;
  const config = getTenseConfig(tense);
  return { title: config ? `${config.name} — Part 5 Subskills` : "Part 5 Subskills" };
}

const LEVEL_SLUGS: LevelSlug[] = ["l1", "l2", "l3", "l4", "l5", "l6"];

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  easy:   { bg: "#dcfce7", color: "#15803d", label: "Easy" },
  medium: { bg: "#fef9c3", color: "#a16207", label: "Medium" },
  hard:   { bg: "#fee2e2", color: "#b91c1c", label: "Hard" },
};

export default async function TensePage({ params }: Props) {
  const { tense } = await params;
  const config = getTenseConfig(tense);
  if (!config) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile
        .findUnique({ where: { id: user.id }, select: { studentCode: true } })
        .catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const partKey = tenseToPartKey(tense);
  const rawAttempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: partKey },
          select: { questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  // best[levelSlug] = best score
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
        <Link href="/subskills/reading/part5" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 5</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{config.name}</span>
      </div>

      {/* Tense header */}
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
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
              <h1 style={{ fontSize: FS.lg, fontWeight: 800, color: "var(--text-primary)" }}>
                {config.name}
              </h1>
              <div style={{ display: "flex", gap: "2px" }}>
                {[1, 2, 3].map((i) => (
                  <Star key={i} size={12} fill={i <= config.importance ? "#f59e0b" : "none"} stroke={i <= config.importance ? "#f59e0b" : "#d1d5db"} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: FS.sm, color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              {config.nameEn} · {config.description}
            </div>

            {/* Formulas */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <FormulaTag label="Chủ động" formula={config.formula} color="#0369a1" bg="#f0f9ff" border="#bae6fd" />
              {config.formulaPassive && (
                <FormulaTag label="Bị động" formula={config.formulaPassive} color="#7c3aed" bg="#faf5ff" border="#ddd6fe" />
              )}
            </div>

            {/* Time markers */}
            <div>
              <span style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginRight: "0.5rem" }}>
                Dấu hiệu:
              </span>
              {config.timeMarkers.slice(0, 8).map((m) => (
                <span
                  key={m}
                  style={{
                    display: "inline-block",
                    margin: "2px",
                    fontSize: FS.xs,
                    padding: "2px 7px",
                    borderRadius: 99,
                    background: "rgba(var(--accent-primary-rgb, 1,62,55), 0.06)",
                    border: "1px solid rgba(var(--accent-primary-rgb, 1,62,55), 0.15)",
                    color: "var(--accent-primary)",
                    fontWeight: 500,
                  }}
                >
                  {m}
                </span>
              ))}
              {config.timeMarkers.length > 8 && (
                <span style={{ fontSize: FS.xs, color: "var(--text-muted)", marginLeft: 4 }}>
                  +{config.timeMarkers.length - 8} nữa
                </span>
              )}
            </div>
          </div>

          {/* Progress summary */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: FS.xl, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
              {LEVEL_SLUGS.filter((l) => best[l]?.passed).length}
              <span style={{ fontSize: FS.md, color: "var(--text-muted)", fontWeight: 500 }}>/6</span>
            </div>
            <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: "0.2rem" }}>levels passed</div>
          </div>
        </div>
      </div>

      {/* Level cards */}
      {!hasContent ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: FS.sm }}>
          Nội dung đang được soạn thảo. Vui lòng quay lại sau.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {levelMeta.map((meta) => {
            const levelBest = best[meta.slug];
            const unlocked = isLevelUnlocked(meta.slug as LevelSlug, best, isTestUser);
            const diff = DIFFICULTY_COLORS[meta.difficulty];
            const hasQuestions = config.levels.find((l) => l.slug === meta.slug)?.questions.length ?? 0;

            // Level not in data yet → show locked/coming
            if (!hasQuestions) {
              return (
                <LevelCard
                  key={meta.slug}
                  meta={meta}
                  diff={diff}
                  unlocked={false}
                  comingSoon
                  best={null}
                  tenseSlug={tense}
                />
              );
            }

            return (
              <LevelCard
                key={meta.slug}
                meta={meta}
                diff={diff}
                unlocked={unlocked}
                comingSoon={false}
                best={levelBest ?? null}
                tenseSlug={tense}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormulaTag({ label, formula, color, bg, border }: { label: string; formula: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
      <span style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", color, opacity: 0.8 }}>{label}:</span>
      <span style={{
        fontSize: FS.xs,
        fontFamily: "var(--font-mono, monospace)",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
        padding: "2px 8px",
        color,
        fontWeight: 600,
      }}>
        {formula}
      </span>
    </div>
  );
}

function LevelCard({
  meta, diff, unlocked, comingSoon, best, tenseSlug,
}: {
  meta: ReturnType<typeof buildLevelMeta>[number];
  diff: { bg: string; color: string; label: string };
  unlocked: boolean;
  comingSoon: boolean;
  best: BestScore | null;
  tenseSlug: string;
}) {
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 1.25rem",
        borderRadius: "var(--radius-md, 8px)",
        border: best?.passed
          ? "1.5px solid #16a34a"
          : unlocked
          ? "1px solid var(--border)"
          : "1px solid var(--border)",
        background: best?.passed
          ? "#f0fdf4"
          : "var(--bg-elevated)",
        opacity: (!unlocked && !comingSoon) || comingSoon ? 0.55 : 1,
        cursor: unlocked && !comingSoon ? "pointer" : "default",
        transition: "box-shadow 0.15s",
        textDecoration: "none",
      }}
    >
      {/* Level number */}
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
        fontSize: FS.sm,
        flexShrink: 0,
      }}>
        {meta.level}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: FS.sm, color: "var(--text-primary)" }}>
            {meta.name}
          </span>
          <span style={{
            fontSize: FS.xs,
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
            <span style={{ fontSize: FS.xs, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sắp có
            </span>
          )}
        </div>
        <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: "0.15rem" }}>
          {meta.description}
        </div>
      </div>

      {/* Right: score or lock */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        {comingSoon || (!unlocked && !best) ? (
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

  if (unlocked && !comingSoon) {
    return (
      <Link href={`/subskills/reading/part5/${tenseSlug}/${meta.slug}`} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}
