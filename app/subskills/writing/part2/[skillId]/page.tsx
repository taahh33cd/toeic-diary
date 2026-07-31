import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  WRITING_P2_SKILLS,
  getSkillMetaP2,
  getSkillTestsP2,
  PASS_THRESHOLD,
  dbPartW2,
} from "@/lib/subskills/writing-part2";
import WritingPart2Client from "@/components/subskills/writing/WritingPart2Client";

type Props = { params: Promise<{ skillId: string }> };

export async function generateStaticParams() {
  return WRITING_P2_SKILLS.filter((s) => s.active).map((s) => ({ skillId: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skillId } = await params;
  const skill = getSkillMetaP2(skillId);
  return { title: skill ? `${skill.labelVi} — Writing Part 2` : "Subskills" };
}

type BestMap = Record<string, { score: number; passed: boolean }>;

function buildBest(list: { questionWord: string; itemIdx: number | null; score: number; passed: boolean }[]): BestMap {
  const best: BestMap = {};
  const perQ: Record<string, Record<number, number>> = {};

  for (const a of list) {
    if (a.itemIdx === null) {
      if (!best[a.questionWord] || a.score > best[a.questionWord].score) {
        best[a.questionWord] = { score: a.score, passed: a.passed };
      }
    } else {
      if (!perQ[a.questionWord]) perQ[a.questionWord] = {};
      const prev = perQ[a.questionWord][a.itemIdx] ?? -1;
      if (a.score > prev) perQ[a.questionWord][a.itemIdx] = a.score;
    }
  }

  // Bài làm dở dang: tính điểm tạm từ các câu đã trả lời
  for (const [qw, qBest] of Object.entries(perQ)) {
    if (best[qw]) continue;
    const answered = Object.keys(qBest).length;
    if (answered === 0) continue;
    const sum = Object.values(qBest).reduce((a, b) => a + b, 0);
    best[qw] = { score: Math.round(sum / answered), passed: false };
  }

  return best;
}

export default async function WritingP2SkillPage({ params }: Props) {
  const { skillId } = await params;

  const skill = getSkillMetaP2(skillId);
  if (!skill || !skill.active) notFound();

  const tests = getSkillTestsP2(skillId);
  if (!tests) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const [easyRaw, mediumRaw, hardRaw] = user
    ? await Promise.all(
        (["easy", "medium", "hard"] as const).map((d) =>
          prisma.subskillAttempt
            .findMany({
              where: { userId: user.id, part: dbPartW2(skillId, d) },
              select: { questionWord: true, itemIdx: true, score: true, passed: true },
            })
            .catch(() => []),
        ),
      )
    : [[], [], []];

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/writing" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Writing</Link>
        <span>›</span>
        <Link href="/subskills/writing/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 2</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{skill.labelVi}</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {skill.labelVi}
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          {skill.label} · {skill.description}
        </p>
      </div>

      <WritingPart2Client
        skillId={skillId}
        allTests={tests}
        easyBest={buildBest(easyRaw)}
        mediumBest={buildBest(mediumRaw)}
        hardBest={buildBest(hardRaw)}
        isTestUser={isTestUser}
        userId={user?.id ?? null}
        passThreshold={PASS_THRESHOLD}
      />

      <div style={{ marginTop: "3rem", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
    </div>
  );
}
