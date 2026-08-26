import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  WRITING_P1_SKILLS,
  getSkillMeta,
  getSkillTests,
  PASS_THRESHOLD,
  dbPartW1,
} from "@/lib/subskills/writing-part1";
import WritingPart1Client from "@/components/subskills/writing/WritingPart1Client";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ skillId: string }> };

export async function generateStaticParams() {
  return WRITING_P1_SKILLS.map((s) => ({ skillId: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skillId } = await params;
  const skill = getSkillMeta(skillId);
  return { title: skill ? `${skill.labelVi} — Writing Part 1` : "Subskills" };
}

type BestMap = Record<string, { score: number; passed: boolean }>;

function buildBest(list: { questionWord: string; exerciseIndex: number; itemIdx: number | null; score: number; passed: boolean }[]): BestMap {
  const best: BestMap = {};
  // Per-question records grouped by (questionWord, itemIdx)
  const perQ: Record<string, Record<number, number>> = {};

  for (const a of list) {
    if (a.itemIdx === null) {
      // Final summary record — authoritative score
      if (!best[a.questionWord] || a.score > best[a.questionWord].score) {
        best[a.questionWord] = { score: a.score, passed: a.passed };
      }
    } else {
      // Per-question record: track best score per question index
      if (!perQ[a.questionWord]) perQ[a.questionWord] = {};
      const prev = perQ[a.questionWord][a.itemIdx] ?? -1;
      if (a.score > prev) perQ[a.questionWord][a.itemIdx] = a.score;
    }
  }

  // For tests with no final summary, compute partial score from per-question data
  for (const [qw, qBest] of Object.entries(perQ)) {
    if (best[qw]) continue; // already have a final score
    const answered = Object.keys(qBest).length;
    if (answered === 0) continue;
    const correct = Object.values(qBest).filter((s) => s === 100).length;
    const score = Math.round((correct / answered) * 100);
    best[qw] = { score, passed: false }; // partial attempt — not officially passed
  }

  return best;
}

export default async function WritingSkillPage({ params }: Props) {
  const { skillId } = await params;

  const skill = getSkillMeta(skillId);
  if (!skill) notFound();

  const tests = getSkillTests(skillId);
  if (!tests) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const [easyRaw, mediumRaw, hardRaw] = user
    ? await Promise.all([
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: dbPartW1(skillId, "easy") }, select: { questionWord: true, exerciseIndex: true, itemIdx: true, score: true, passed: true } }).catch(() => []),
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: dbPartW1(skillId, "medium") }, select: { questionWord: true, exerciseIndex: true, itemIdx: true, score: true, passed: true } }).catch(() => []),
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: dbPartW1(skillId, "hard") }, select: { questionWord: true, exerciseIndex: true, itemIdx: true, score: true, passed: true } }).catch(() => []),
      ])
    : [[], [], []];

  const easyBest = buildBest(easyRaw);
  const mediumBest = buildBest(mediumRaw);
  const hardBest = buildBest(hardRaw);

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/writing" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Writing</Link>
        <span>›</span>
        <Link href="/subskills/writing/part1" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 1</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{skill.labelVi}</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {skill.labelVi}
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
          {skill.label} · {skill.description}
        </p>
      </div>

      <WritingPart1Client
        skillId={skillId}
        allTests={tests}
        easyBest={easyBest}
        mediumBest={mediumBest}
        hardBest={hardBest}
        isTestUser={isTestUser}
        userId={user?.id ?? null}
        passThreshold={PASS_THRESHOLD}
      />

      <div style={{ marginTop: "auto", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
    </div>
  );
}
