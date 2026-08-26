import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getPart2Set, getPart2MediumSet, getPart2HardSet } from "@/lib/subskills";
import ExerciseClient from "@/components/subskills/ExerciseClient";
import DifficultyTabs from "@/components/subskills/DifficultyTabs";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ questionWord: string }>; searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { questionWord } = await params;
  const set = getPart2Set(questionWord);
  return { title: set ? `${set.label} — Subskills Listening Part 2` : "Subskills" };
}

export default async function ListeningPart2ExercisePage({ params, searchParams }: Props) {
  const { questionWord } = await params;
  const { d } = await searchParams;
  const difficulty = d === "hard" ? "hard" : d === "medium" ? "medium" : "easy";

  const easySet = getPart2Set(questionWord);
  if (!easySet) notFound();

  const mediumSet = getPart2MediumSet(questionWord);
  const hardSet   = getPart2HardSet(questionWord);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if this is the TEST account (always unlock all difficulties)
  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  type AttemptRow = { exerciseIndex: number; score: number; passed: boolean; itemIdx: number | null; correctCount: number | null; completedAt: Date };
  type DraftMap = Record<number, { itemIdx: number; correctCount: number }>;

  function computeBestAndDrafts(attempts: AttemptRow[], qw: string) {
    const best: Record<string, { score: number; passed: boolean }> = {};
    // Track latest checkpoint (itemIdx != null) and latest complete (itemIdx == null) per exercise
    const latestCheckpoint: Record<number, { itemIdx: number; correctCount: number; at: Date }> = {};
    const latestComplete: Record<number, Date> = {};

    for (const a of attempts) {
      const key = `${qw}:${a.exerciseIndex}`;
      if (!best[key] || a.score > best[key].score) {
        best[key] = { score: a.score, passed: a.passed };
      }
      if (a.itemIdx !== null && a.correctCount !== null) {
        const cur = latestCheckpoint[a.exerciseIndex];
        if (!cur || a.completedAt > cur.at) {
          latestCheckpoint[a.exerciseIndex] = { itemIdx: a.itemIdx, correctCount: a.correctCount, at: a.completedAt };
        }
      } else {
        const cur = latestComplete[a.exerciseIndex];
        if (!cur || a.completedAt > cur) latestComplete[a.exerciseIndex] = a.completedAt;
      }
    }

    const drafts: DraftMap = {};
    for (const [eiStr, cp] of Object.entries(latestCheckpoint)) {
      const ei = Number(eiStr);
      const done = latestComplete[ei];
      if (!done || cp.at > done) drafts[ei] = { itemIdx: cp.itemIdx, correctCount: cp.correctCount };
    }

    return { best, drafts };
  }

  // Fetch Easy attempts
  const easyAttempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: "part2", questionWord },
          select: { exerciseIndex: true, score: true, passed: true, itemIdx: true, correctCount: true, completedAt: true },
        })
        .catch(() => [] as AttemptRow[])
    : [] as AttemptRow[];

  const { best: easyBest, drafts: easyDrafts } = computeBestAndDrafts(easyAttempts, questionWord);

  // Unlock Medium if any Easy attempt score ≥ 80% (or TEST user)
  const easyTopScore = Object.values(easyBest).reduce((max, b) => Math.max(max, b.score), 0);
  const mediumUnlocked = isTestUser || easyTopScore >= 80;

  // Fetch Medium attempts (stored with part: "part2-medium")
  const mediumAttempts = user && mediumUnlocked
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: "part2-medium", questionWord },
          select: { exerciseIndex: true, score: true, passed: true, itemIdx: true, correctCount: true, completedAt: true },
        })
        .catch(() => [] as AttemptRow[])
    : [] as AttemptRow[];

  const { best: mediumBest, drafts: mediumDrafts } = computeBestAndDrafts(mediumAttempts, questionWord);

  // Unlock Hard if any Medium attempt score ≥ 80% (or TEST user)
  const mediumTopScore = Object.values(mediumBest).reduce((max, b) => Math.max(max, b.score), 0);
  const hardUnlocked = isTestUser || mediumTopScore >= 80;

  // Fetch Hard attempts (stored with part: "part2-hard")
  const hardAttempts = user && hardUnlocked
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: "part2-hard", questionWord },
          select: { exerciseIndex: true, score: true, passed: true, itemIdx: true, correctCount: true, completedAt: true },
        })
        .catch(() => [] as AttemptRow[])
    : [] as AttemptRow[];

  const { best: hardBest, drafts: hardDrafts } = computeBestAndDrafts(hardAttempts, questionWord);

  const activeSet =
    difficulty === "hard"   && hardUnlocked   && hardSet   ? hardSet   :
    difficulty === "medium" && mediumUnlocked && mediumSet ? mediumSet : easySet;

  const activeBest =
    difficulty === "hard"   && hardUnlocked   ? hardBest   :
    difficulty === "medium" && mediumUnlocked ? mediumBest : easyBest;

  const activeDrafts =
    difficulty === "hard"   && hardUnlocked   ? hardDrafts   :
    difficulty === "medium" && mediumUnlocked ? mediumDrafts : easyDrafts;

  const activeDiff: "easy" | "medium" | "hard" =
    difficulty === "hard"   && hardUnlocked   ? "hard"   :
    difficulty === "medium" && mediumUnlocked ? "medium" : "easy";

  return (
    <div
      style={{
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: `${PAD_Y} ${PAD_X}`,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Subskills
        </Link>
        <span>›</span>
        <Link href="/subskills/listening/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Listening · Part 2
        </Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{easySet.label}</span>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {easySet.label}
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
          {easySet.labelVi}
        </p>
      </div>

      {/* Difficulty tabs */}
      <DifficultyTabs
        questionWord={questionWord}
        current={activeDiff}
        mediumUnlocked={mediumUnlocked}
        hardUnlocked={hardUnlocked}
        easyTopScore={easyTopScore}
        mediumTopScore={mediumTopScore}
      />

      {/* Client component */}
      <ExerciseClient
        key={activeDiff}
        set={activeSet}
        initialBest={activeBest}
        initialDrafts={activeDrafts}
        userId={user?.id ?? null}
      />

      {/* Footer */}
      <div style={{ marginTop: "auto", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
        TOEIC DICTATION DIARY
      </p>
    </div>
  );
}
