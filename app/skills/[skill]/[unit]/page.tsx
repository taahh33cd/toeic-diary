import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/skills/structure";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";
import { WritingSentenceClient } from "@/components/skills/WritingSentenceClient";
import { McqExamClient } from "@/components/skills/exam/McqExamClient";
import { PracticeTestList } from "@/components/skills/listening/PracticeTestList";
import { FREE_PRACTICE_TESTS, listPracticeTests } from "@/lib/listening-practice";
import { WRITING_Q1_5, Q15_PART_KEY } from "@/lib/skills/writing-q1-5";
import { Q67_PART_KEY } from "@/lib/skills/writing-q6-7";
import { WritingEmailClient } from "@/components/skills/WritingEmailClient";
import { READING_PART5 } from "@/lib/skills/sample";
import { SpeakingQ34TestList } from "@/components/skills/exam/SpeakingQ34TestList";
import { SpeakingQ810TestList } from "@/components/skills/exam/SpeakingQ810TestList";
import { isUsageExempt } from "@/lib/access";

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

  // Listening Part 1 / Part 2 đã có bộ đề thật → danh sách test
  if (skill === "listening" && (unit === "part1" || unit === "part2")) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = user
      ? await prisma.profile
          .findUnique({
            where: { id: user.id },
            select: { role: true, studentCode: true, enrolledCourses: true, freeUsageSeconds: true },
          })
          .catch(() => null)
      : null;

    return (
      <PracticeTestList
        skill={found.skill}
        unit={found.unit}
        part={unit === "part1" ? 1 : 2}
        tests={listPracticeTests()}
        unlocked={isUsageExempt(profile)}
        freeTests={FREE_PRACTICE_TESTS}
      />
    );
  }

  // Các unit "flagship" đã có khung màn thi mẫu
  if (skill === "reading" && unit === "part5") {
    return <McqExamClient skill={found.skill} unit={found.unit} items={READING_PART5} mode="reading" totalSeconds={360} />;
  }
  // Speaking Q3-4 đã chia bộ đề theo 3 mức độ → danh sách bộ đề
  if (skill === "speaking" && unit === "q3-4") {
    return <SpeakingQ34TestList skill={found.skill} unit={found.unit} />;
  }

  // Speaking Q8-10 — 50 bộ đề chia theo loại bảng thông tin
  if (skill === "speaking" && unit === "q8-10") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;

    return <SpeakingQ810TestList skill={found.skill} unit={found.unit} unlocked={isUsageExempt(profile)} />;
  }

  // Writing Q1-5 đã có bài tập thật → render trang làm bài
  if (skill === "writing" && unit === "q1-5") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;
    const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";
    const canSubmit = isUsageExempt(profile);

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
        canSubmit={canSubmit}
        bestByExercise={bestByExercise}
      />
    );
  }

  // Writing Q6-7 — 15 đề e-mail chia 3 mức, tự chấm bằng Model Answer + checklist
  if (skill === "writing" && unit === "q6-7") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;
    const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";
    const canSubmit = isUsageExempt(profile);

    // Điểm tốt nhất của mỗi bộ đề — chỉ lấy bản ghi tổng kết (itemIdx = null)
    const attempts = user
      ? await prisma.subskillAttempt
          .findMany({
            where: { userId: user.id, part: Q67_PART_KEY, itemIdx: null },
            select: { questionWord: true, score: true, passed: true },
          })
          .catch(() => [])
      : [];
    const bestByTest: Record<string, { score: number; passed: boolean }> = {};
    for (const a of attempts) {
      const cur = bestByTest[a.questionWord];
      if (!cur || a.score > cur.score) bestByTest[a.questionWord] = { score: a.score, passed: a.passed };
    }

    return (
      <WritingEmailClient
        skill={found.skill}
        unit={found.unit}
        userId={user?.id ?? null}
        isTestUser={isTestUser}
        canSubmit={canSubmit}
        bestByTest={bestByTest}
      />
    );
  }

  return <SkillComingSoon skill={found.skill} unit={found.unit} />;
}
