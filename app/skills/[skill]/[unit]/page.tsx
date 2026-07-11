import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/skills/structure";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";
import { WritingSentenceClient } from "@/components/skills/WritingSentenceClient";
import { McqExamClient } from "@/components/skills/exam/McqExamClient";
import { SpeakingExamClient } from "@/components/skills/exam/SpeakingExamClient";
import { WRITING_Q1_5, Q15_PART_KEY } from "@/lib/skills/writing-q1-5";
import { READING_PART5, LISTENING_PART2, SPEAKING_Q3_4 } from "@/lib/skills/sample";

type Props = { params: Promise<{ skill: string; unit: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill, unit } = await params;
  const found = getUnit(skill, unit);
  return {
    title: found
      ? `${found.skill.label} · ${found.unit.label} — Luyện đề TOEIC`
      : "Luyện đề TOEIC",
  };
}

export default async function SkillUnitPage({ params }: Props) {
  const { skill, unit } = await params;
  const found = getUnit(skill, unit);
  if (!found) notFound();

  // Các unit "flagship" đã có khung màn thi mẫu
  if (skill === "reading" && unit === "part5") {
    return <McqExamClient skill={found.skill} unit={found.unit} items={READING_PART5} mode="reading" totalSeconds={360} />;
  }
  if (skill === "listening" && unit === "part2") {
    return <McqExamClient skill={found.skill} unit={found.unit} items={LISTENING_PART2} mode="listening" totalSeconds={300} />;
  }
  if (skill === "speaking" && unit === "q3-4") {
    return <SpeakingExamClient skill={found.skill} unit={found.unit} items={SPEAKING_Q3_4} />;
  }

  // Writing Q1-5 đã có bài tập thật → render trang làm bài
  if (skill === "writing" && unit === "q1-5") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const profile = user
      ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
      : null;
    const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

    // Best score per exercise (questionWord = exercise id, exerciseIndex = 0)
    const attempts = user
      ? await prisma.subskillAttempt
          .findMany({ where: { userId: user.id, part: Q15_PART_KEY }, select: { questionWord: true, score: true, passed: true } })
          .catch(() => [])
      : [];
    const bestByExercise: Record<string, { score: number; passed: boolean }> = {};
    for (const a of attempts) {
      const cur = bestByExercise[a.questionWord];
      if (!cur || a.score > cur.score) bestByExercise[a.questionWord] = { score: a.score, passed: a.passed };
    }

    return (
      <WritingSentenceClient
        skill={found.skill}
        unit={found.unit}
        exercises={WRITING_Q1_5}
        userId={user?.id ?? null}
        isTestUser={isTestUser}
        bestByExercise={bestByExercise}
      />
    );
  }

  return <SkillComingSoon skill={found.skill} unit={found.unit} />;
}
