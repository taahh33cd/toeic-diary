import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  getSkillMeta,
  getSkillTests,
  SPEAKING_SKILLS,
  PASS_THRESHOLD,
  dbPart,
} from "@/lib/subskills/speaking";
import SpeakingExerciseClient from "@/components/subskills/speaking/SpeakingExerciseClient";

type Props = { params: Promise<{ skillId: string }>; searchParams: Promise<{ t?: string; d?: string }> };

export async function generateStaticParams() {
  return SPEAKING_SKILLS.map((s) => ({ skillId: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skillId } = await params;
  const skill = getSkillMeta(skillId);
  return { title: skill ? `${skill.labelVi} — Speaking Part 1` : "Subskills" };
}

export default async function SpeakingSkillPage({ params, searchParams }: Props) {
  const { skillId } = await params;
  const { t, d } = await searchParams;

  const skill = getSkillMeta(skillId);
  if (!skill) notFound();

  const tests = getSkillTests(skillId);
  if (!tests) notFound();

  const testNum   = Math.min(5, Math.max(1, parseInt(t ?? "1") || 1));
  const difficulty = d === "hard" ? "hard" : d === "medium" ? "medium" : "easy";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check TEST account
  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  // Fetch all attempts for this skill
  const [easyAttempts, mediumAttempts, hardAttempts] = user
    ? await Promise.all([
        prisma.subskillAttempt.findMany({
          where: { userId: user.id, part: dbPart(skillId, "easy") },
          select: { questionWord: true, exerciseIndex: true, score: true, passed: true },
        }).catch(() => []),
        prisma.subskillAttempt.findMany({
          where: { userId: user.id, part: dbPart(skillId, "medium") },
          select: { questionWord: true, exerciseIndex: true, score: true, passed: true },
        }).catch(() => []),
        prisma.subskillAttempt.findMany({
          where: { userId: user.id, part: dbPart(skillId, "hard") },
          select: { questionWord: true, exerciseIndex: true, score: true, passed: true },
        }).catch(() => []),
      ])
    : [[], [], []];

  // Best score per testNum per difficulty
  type BestMap = Record<string, { score: number; passed: boolean }>;
  function buildBest(list: typeof easyAttempts): BestMap {
    const best: BestMap = {};
    for (const a of list) {
      const key = a.questionWord; // "1".."5"
      if (!best[key] || a.score > best[key].score) {
        best[key] = { score: a.score, passed: a.passed };
      }
    }
    return best;
  }

  const easyBest   = buildBest(easyAttempts);
  const mediumBest = buildBest(mediumAttempts);
  const hardBest   = buildBest(hardAttempts);

  // Unlock Medium for this test if Easy ≥ threshold
  const easyScore  = easyBest[String(testNum)]?.score ?? 0;
  const mediumScore = mediumBest[String(testNum)]?.score ?? 0;
  const mediumUnlocked = isTestUser || easyScore >= PASS_THRESHOLD;
  const hardUnlocked   = isTestUser || mediumScore >= PASS_THRESHOLD;

  const activeDiff: "easy" | "medium" | "hard" =
    difficulty === "hard"   && hardUnlocked   ? "hard"   :
    difficulty === "medium" && mediumUnlocked ? "medium" : "easy";

  const activeBest =
    activeDiff === "hard"   ? hardBest   :
    activeDiff === "medium" ? mediumBest : easyBest;

  const testData = tests[testNum - 1];

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/speaking/part1" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Speaking · Part 1</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{skill.labelVi}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {skill.labelVi}
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          {skill.label} · {skill.description}
        </p>
      </div>

      {/* Difficulty tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
        {(["easy", "medium", "hard"] as const).map((diff) => {
          const label = diff === "easy" ? "🟢 Easy" : diff === "medium" ? "🟡 Medium" : "🔴 Hard";
          const locked = diff === "medium" ? !mediumUnlocked : diff === "hard" ? !hardUnlocked : false;
          const isActive = diff === activeDiff;
          const bestScore =
            diff === "easy"   ? easyBest[String(testNum)]?.score   :
            diff === "medium" ? mediumBest[String(testNum)]?.score  :
                                hardBest[String(testNum)]?.score;

          return (
            <div key={diff} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              {locked ? (
                <div
                  title={`Cần Easy ≥ ${PASS_THRESHOLD}% để mở`}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    background: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                    border: "1.5px solid var(--border)",
                    cursor: "not-allowed",
                    opacity: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  🔒 {label.split(" ")[1]}
                </div>
              ) : (
                <Link
                  href={`/subskills/speaking/part1/${skillId}?t=${testNum}&d=${diff}`}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    border: `1.5px solid ${isActive ? "var(--accent-primary)" : "var(--border)"}`,
                    background: isActive ? "var(--accent-primary)" : "var(--bg-elevated)",
                    color: isActive ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {label}
                </Link>
              )}
              {bestScore !== undefined && (
                <span style={{ fontSize: "0.62rem", color: bestScore >= PASS_THRESHOLD ? "rgb(34,197,94)" : "var(--text-muted)" }}>
                  {bestScore}%{bestScore >= PASS_THRESHOLD ? " ✓" : ""}
                </span>
              )}
            </div>
          );
        })}
        {!mediumUnlocked && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", alignSelf: "center", marginLeft: 4 }}>
            Easy ≥ {PASS_THRESHOLD}% để mở Medium
          </span>
        )}
      </div>

      {/* Client exercise component */}
      <SpeakingExerciseClient
        key={`${skillId}-${testNum}-${activeDiff}`}
        skillId={skillId}
        testNum={testNum}
        difficulty={activeDiff}
        testData={testData}
        initialBest={activeBest}
        tabBest={easyBest}
        userId={user?.id ?? null}
      />

      {/* Footer */}
      <div style={{ marginTop: "3rem", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
        TOEIC DICTATION DIARY
      </p>
    </div>
  );
}
