import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMockUnit, getUnit } from "@/lib/skills/structure";
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
import { WritingEssayClient } from "@/components/skills/WritingEssayClient";
import { Q8_PART_KEY } from "@/lib/skills/writing-q8";
import { READING_PART5 } from "@/lib/skills/sample";
import { SpeakingQ34TestList } from "@/components/skills/exam/SpeakingQ34TestList";
import { SpeakingQ810TestList } from "@/components/skills/exam/SpeakingQ810TestList";
import { SpeakingUnitList } from "@/components/skills/exam/SpeakingUnitList";
import { q11Groups, q12Groups, q57Groups } from "@/lib/skills/speaking-lists";
import { Q57_FREE_PER_CATEGORY } from "@/lib/skills/speaking-q5-7";
import { Q11_FREE_PER_FORM } from "@/lib/skills/speaking-q11";
import { isUsageExempt } from "@/lib/access";
import { MockTestList } from "@/components/skills/exam/MockTestList";
import { listSpeakingMocks, SPEAKING_MOCK_FREE } from "@/lib/skills/speaking-mock";
import { listWritingMocks, WRITING_MOCK_FREE } from "@/lib/skills/writing-mock";
import { FAMILY } from "@/lib/skills/exam-theme";

type Props = { params: Promise<{ skill: string; unit: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill, unit } = await params;
  const found = getUnit(skill, unit) ?? (unit === "mock" ? getMockUnit(skill) : undefined);
  return {
    title: found
      ? `${found.skill.label} · ${found.unit.label} — Luyện đề TOEIC`
      : "Luyện đề TOEIC",
  };
}

export default async function SkillUnitPage({ params }: Props) {
  const { skill, unit } = await params;

  // Thi thử trọn bộ — unit ảo "mock", chỉ có ở Speaking và Writing
  if (unit === "mock") {
    const m = getMockUnit(skill);
    if (!m) notFound();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;

    const speaking = skill === "speaking";
    const mocks = speaking
      ? listSpeakingMocks().map((x) => ({ slug: x.slug, label: x.label, parts: x.parts, free: x.free }))
      : listWritingMocks().map((x) => ({ slug: x.slug, label: x.label, parts: x.parts, free: x.free }));

    return (
      <MockTestList
        skill={m.skill}
        unit={m.unit}
        unlocked={isUsageExempt(profile)}
        mocks={mocks}
        color={FAMILY[m.skill.family].primary}
        intro={
          speaking
            ? `${mocks.length} đề thi thử, mỗi đề ghép từ bộ đề của cả 5 phần Speaking và chạy liền mạch 11 câu (~20 phút). ` +
              `${SPEAKING_MOCK_FREE} đề đầu mở cho mọi tài khoản.`
            : `${mocks.length} đề thi thử, mỗi đề gồm Q1-5 (5 ảnh), Q6-7 (2 e-mail) và Q8 (bài luận), tổng ~60 phút. ` +
              `${WRITING_MOCK_FREE} đề đầu mở cho mọi tài khoản.`
        }
      />
    );
  }

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

  // Speaking Q1-2 / Q5-7 / Q11 — danh sách bộ đề chữ + audio, chọn chế độ ở đầu trang
  if (skill === "speaking" && (unit === "q1-2" || unit === "q5-7" || unit === "q11")) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;

    const cfg = {
      "q1-2": {
        groups: q12Groups(),
        intro:
          "Mỗi bài đọc: 45 giây chuẩn bị, 45 giây đọc to. Giọng của bạn được ghi âm để nghe lại và gửi giáo viên chấm.",
        freeNote: undefined as string | undefined,
      },
      "q5-7": {
        groups: q57Groups(),
        intro:
          "Đúng nhịp thi thật: nghe lời dẫn tình huống, rồi mỗi câu 3 giây chuẩn bị — trả lời 15 giây (câu 5, 6) và 30 giây (câu 7).",
        freeNote: `${Q57_FREE_PER_CATEGORY} bộ đầu mỗi chủ đề mở cho mọi tài khoản. Các bộ còn lại cần đăng ký khoá học.`,
      },
      q11: {
        groups: q11Groups(),
        intro:
          "Câu nặng điểm nhất của bài thi Speaking: 45 giây chuẩn bị, 60 giây nói. Đề bài hiện cả chữ lẫn audio, đúng như thi thật.",
        freeNote: `${Q11_FREE_PER_FORM} bộ đầu mỗi dạng đề mở cho mọi tài khoản. Các bộ còn lại cần đăng ký khoá học.`,
      },
    }[unit];

    return (
      <SpeakingUnitList
        skill={found.skill}
        unit={found.unit}
        unlocked={isUsageExempt(profile)}
        intro={cfg.intro}
        freeNote={cfg.freeNote}
        groups={cfg.groups}
      />
    );
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

  // Writing Q8 — 24 đề luận, chấm bằng AI theo rubric ETS 0-5
  if (skill === "writing" && unit === "q8") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;
    const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";
    const unlocked = isUsageExempt(profile);

    const attempts = user
      ? await prisma.subskillAttempt
          .findMany({
            where: { userId: user.id, part: Q8_PART_KEY, itemIdx: null },
            select: { questionWord: true, score: true, passed: true },
          })
          .catch(() => [])
      : [];
    const bestByPrompt: Record<string, { score: number; passed: boolean }> = {};
    for (const a of attempts) {
      const cur = bestByPrompt[a.questionWord];
      if (!cur || a.score > cur.score) bestByPrompt[a.questionWord] = { score: a.score, passed: a.passed };
    }

    return (
      <WritingEssayClient
        skill={found.skill}
        unit={found.unit}
        userId={user?.id ?? null}
        isTestUser={isTestUser}
        canSubmit={unlocked}
        unlocked={unlocked}
        bestByPrompt={bestByPrompt}
      />
    );
  }

  return <SkillComingSoon skill={found.skill} unit={found.unit} />;
}
