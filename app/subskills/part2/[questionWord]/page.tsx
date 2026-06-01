import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getPart2Set } from "@/lib/subskills";
import ExerciseClient from "@/components/subskills/ExerciseClient";

type Props = { params: Promise<{ questionWord: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { questionWord } = await params;
  const set = getPart2Set(questionWord);
  return { title: set ? `${set.label} — Subskills Part 2` : "Subskills" };
}

export default async function SubskillsExercisePage({ params }: Props) {
  const { questionWord } = await params;
  const set = getPart2Set(questionWord);
  if (!set) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: "part2", questionWord },
          select: { exerciseIndex: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const initialBest: Record<string, { score: number; passed: boolean }> = {};
  for (const a of attempts) {
    const key = `${questionWord}:${a.exerciseIndex}`;
    if (!initialBest[key] || a.score > initialBest[key].score) {
      initialBest[key] = { score: a.score, passed: a.passed };
    }
  }

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Subskills
        </Link>
        <span>›</span>
        <span>Part 2</span>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{set.label}</span>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {set.label}
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          {set.labelVi}
        </p>
      </div>

      {/* Client component with all interaction logic */}
      <ExerciseClient
        set={set}
        initialBest={initialBest}
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
