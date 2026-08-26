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
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ skillId: string }> };

export async function generateStaticParams() {
  return SPEAKING_SKILLS.map((s) => ({ skillId: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skillId } = await params;
  const skill = getSkillMeta(skillId);
  return { title: skill ? `${skill.labelVi} — Speaking Part 1` : "Subskills" };
}

type BestMap = Record<string, { score: number; passed: boolean }>;

function buildBest(list: { questionWord: string; score: number; passed: boolean }[]): BestMap {
  const best: BestMap = {};
  for (const a of list) {
    const key = a.questionWord;
    if (!best[key] || a.score > best[key].score) best[key] = { score: a.score, passed: a.passed };
  }
  return best;
}

export default async function SpeakingSkillPage({ params }: Props) {
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
        prisma.subskillAttempt.findMany({
          where: { userId: user.id, part: dbPart(skillId, "easy") },
          select: { questionWord: true, score: true, passed: true },
        }).catch(() => []),
        prisma.subskillAttempt.findMany({
          where: { userId: user.id, part: dbPart(skillId, "medium") },
          select: { questionWord: true, score: true, passed: true },
        }).catch(() => []),
        prisma.subskillAttempt.findMany({
          where: { userId: user.id, part: dbPart(skillId, "hard") },
          select: { questionWord: true, score: true, passed: true },
        }).catch(() => []),
      ])
    : [[], [], []];

  const easyBest   = buildBest(easyRaw);
  const mediumBest = buildBest(mediumRaw);
  const hardBest   = buildBest(hardRaw);

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
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
          {skill.label} · {skill.description}
        </p>
      </div>

      <SpeakingExerciseClient
        skillId={skillId}
        allTests={tests}
        easyBest={easyBest}
        mediumBest={mediumBest}
        hardBest={hardBest}
        isTestUser={isTestUser}
        userId={user?.id ?? null}
      />

      <div style={{ marginTop: "auto", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
        TOEIC DICTATION DIARY
      </p>
    </div>
  );
}
