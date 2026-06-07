import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getPart2Set, getPart2MediumSet } from "@/lib/subskills";
import ExerciseClient from "@/components/subskills/ExerciseClient";
import DifficultyTabs from "@/components/subskills/DifficultyTabs";

type Props = { params: Promise<{ questionWord: string }>; searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { questionWord } = await params;
  const set = getPart2Set(questionWord);
  return { title: set ? `${set.label} — Subskills Listening Part 2` : "Subskills" };
}

export default async function ListeningPart2ExercisePage({ params, searchParams }: Props) {
  const { questionWord } = await params;
  const { d } = await searchParams;
  const difficulty = d === "medium" ? "medium" : "easy";

  const easySet = getPart2Set(questionWord);
  if (!easySet) notFound();

  const mediumSet = getPart2MediumSet(questionWord);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch Easy attempts
  const easyAttempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: "part2", questionWord },
          select: { exerciseIndex: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const easyBest: Record<string, { score: number; passed: boolean }> = {};
  for (const a of easyAttempts) {
    const key = `${questionWord}:${a.exerciseIndex}`;
    if (!easyBest[key] || a.score > easyBest[key].score) {
      easyBest[key] = { score: a.score, passed: a.passed };
    }
  }

  // Unlock Medium if any Easy attempt score ≥ 80%
  const easyTopScore = Object.values(easyBest).reduce((max, b) => Math.max(max, b.score), 0);
  const mediumUnlocked = easyTopScore >= 80;

  // Fetch Medium attempts (stored with part: "part2-medium")
  const mediumAttempts = user && mediumUnlocked
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: "part2-medium", questionWord },
          select: { exerciseIndex: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const mediumBest: Record<string, { score: number; passed: boolean }> = {};
  for (const a of mediumAttempts) {
    const key = `${questionWord}:${a.exerciseIndex}`;
    if (!mediumBest[key] || a.score > mediumBest[key].score) {
      mediumBest[key] = { score: a.score, passed: a.passed };
    }
  }

  const activeSet  = difficulty === "medium" && mediumUnlocked && mediumSet ? mediumSet : easySet;
  const activeBest = difficulty === "medium" && mediumUnlocked ? mediumBest : easyBest;
  const activeDiff = difficulty === "medium" && mediumUnlocked ? "medium" : "easy";

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 760,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
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
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          {easySet.labelVi}
        </p>
      </div>

      {/* Difficulty tabs */}
      <DifficultyTabs
        questionWord={questionWord}
        current={activeDiff}
        mediumUnlocked={mediumUnlocked}
        easyTopScore={easyTopScore}
      />

      {/* Client component */}
      <ExerciseClient
        key={activeDiff}
        set={activeSet}
        initialBest={activeBest}
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
