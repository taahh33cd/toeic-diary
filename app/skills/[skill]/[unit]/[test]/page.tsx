import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMockUnit, getUnit } from "@/lib/skills/structure";
import { getPracticeEntry, isPracticeTestFree, loadPracticeTest } from "@/lib/listening-practice";
import { toFullTest } from "@/lib/listening-practice/adapt";
import { PartPracticeRunner } from "@/components/skills/part-practice/PartPracticeRunner";
import { ContentLockModal } from "@/components/shared/ContentLockModal";
import { SpeakingExamClient } from "@/components/skills/exam/SpeakingExamClient";
import { Q34_LEVELS, getQ34Test } from "@/lib/skills/speaking-q3-4";
import { SpeakingQ810Client } from "@/components/skills/exam/SpeakingQ810Client";
import { getQ810Test, q810CategoryMeta } from "@/lib/skills/speaking-q8-10";
import { SpeakingRunner, type SpeakingItem, type SpeakingMode } from "@/components/skills/exam/SpeakingRunner";
import { Q12_DIRECTIONS, Q12_PREP_SECONDS, Q12_READ_SECONDS, getQ12Test } from "@/lib/skills/speaking-q1-2";
import { Q57_DIRECTIONS, getQ57Test, q57CategoryMeta } from "@/lib/skills/speaking-q5-7";
import { Q11_DIRECTIONS, Q11_PREP_SECONDS, Q11_RESPONSE_SECONDS, getQ11Test, q11FormMeta } from "@/lib/skills/speaking-q11";
import { SPEAKING_TEST_DIRECTIONS, buildSpeakingMock } from "@/lib/skills/speaking-mock";
import { buildWritingMock } from "@/lib/skills/writing-mock";
import { WritingMockClient } from "@/components/skills/WritingMockClient";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { isUsageExempt } from "@/lib/access";

type Props = {
  params: Promise<{ skill: string; unit: string; test: string }>;
  /** `?mode=exam` → thi thử; mặc định luyện tập */
  searchParams: Promise<{ mode?: string }>;
};

/** Listening Part 1/2 chia theo test số; Speaking Q3-4 chia theo mức độ (vd "easy-1") */
function parse(skill: string, unit: string, test: string) {
  const found = getUnit(skill, unit);
  if (!found) return null;

  if (skill === "listening" && (unit === "part1" || unit === "part2")) {
    const testNumber = Number(test);
    if (!Number.isInteger(testNumber)) return null;
    const entry = getPracticeEntry(testNumber);
    if (!entry) return null;
    return { kind: "listening" as const, ...found, entry, part: (unit === "part1" ? 1 : 2) as 1 | 2 };
  }

  if (skill === "speaking" && unit === "q3-4") {
    const q34 = getQ34Test(test);
    if (!q34) return null;
    const level = Q34_LEVELS.find((l) => l.level === q34.level)!;
    return { kind: "speaking-q34" as const, ...found, q34, title: `${level.label} · Đề ${q34.index}` };
  }

  if (skill === "speaking" && unit === "q1-2") {
    const q12 = getQ12Test(test);
    if (!q12) return null;
    return { kind: "speaking-q1-2" as const, ...found, q12, title: q12.label };
  }

  if (skill === "speaking" && unit === "q5-7") {
    const q57 = getQ57Test(test);
    if (!q57) return null;
    const cat = q57CategoryMeta(q57.category);
    return { kind: "speaking-q5-7" as const, ...found, q57, title: `${cat.label} · Đề ${q57.index}` };
  }

  if (skill === "speaking" && unit === "q11") {
    const q11 = getQ11Test(test);
    if (!q11) return null;
    const form = q11FormMeta(q11.form);
    return { kind: "speaking-q11" as const, ...found, q11, title: `${form.label} · Đề ${q11.index}` };
  }

  if (skill === "speaking" && unit === "q8-10") {
    const q810 = getQ810Test(test);
    if (!q810) return null;
    const cat = q810CategoryMeta(q810.category);
    return { kind: "speaking-q810" as const, ...found, q810, title: `${cat.label} · Đề ${q810.index}` };
  }

  return null;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { skill, unit, test } = await params;
  const f = parse(skill, unit, test);
  if (!f) return { title: "Luyện đề TOEIC" };
  const name = f.kind === "listening" ? f.entry.title : f.title;
  return { title: `${f.skill.label} · ${f.unit.label} · ${name} — Luyện đề TOEIC` };
}

export default async function SkillTestPage({ params, searchParams }: Props) {
  const { skill, unit, test } = await params;
  const { mode: rawMode } = await searchParams;
  const mode: SpeakingMode = rawMode === "exam" ? "exam" : "practice";

  // ── Thi thử trọn bộ ────────────────────────────────────────────────
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
    const unlocked = isUsageExempt(profile);
    const backHref = `/skills/${skill}/mock`;

    if (skill === "speaking") {
      const mock = buildSpeakingMock(Number(test));
      if (!mock) notFound();
      if (!mock.free && !unlocked) return <ContentLockModal />;
      return (
        <SpeakingRunner
          skill={m.skill}
          unit={m.unit}
          mode={mode}
          items={mock.items}
          testTitle={`Speaking · ${mock.label}`}
          testKey={`mock-${mock.slug}`}
          headline="TOEIC Speaking Test"
          directions={SPEAKING_TEST_DIRECTIONS}
          tips={[
            "Bài chạy liền 11 câu — mỗi phần có màn Directions riêng trước khi vào câu hỏi.",
            "Cho phép truy cập micro ngay từ đầu; toàn bộ bài nói được giữ lại để nghe lại ở cuối.",
            "Đừng thoát giữa chừng: thoát ra là mất các bản ghi chưa nghe lại.",
          ]}
          totalQuestions={11}
          signedIn={Boolean(user)}
          canSubmit={unlocked}
          backHref={backHref}
        />
      );
    }

    const mock = buildWritingMock(Number(test));
    if (!mock) notFound();
    if (!mock.free && !unlocked) return <ContentLockModal />;
    return (
      <WritingMockClient
        skill={m.skill}
        unit={m.unit}
        mock={mock}
        mode={mode}
        signedIn={Boolean(user)}
        canSubmit={unlocked}
        backHref={backHref}
      />
    );
  }

  const f = parse(skill, unit, test);
  if (!f) notFound();

  // Speaking Q1-2 / Q5-7 / Q11 — cùng một khung làm bài, khác data và nhịp thời gian
  if (f.kind === "speaking-q1-2" || f.kind === "speaking-q5-7" || f.kind === "speaking-q11") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;
    const unlocked = isUsageExempt(profile);

    let items: SpeakingItem[];
    let headline: string;
    let directions: string;
    let context: { label: string; text: string; textVi?: string } | undefined;
    let tips: string[];
    let free: boolean;
    let testKey: string;
    let sampleVoice = false;

    if (f.kind === "speaking-q1-2") {
      free = f.q12.free ?? false;
      testKey = f.q12.slug;
      headline = "Questions 1-2: Read a text aloud";
      directions = Q12_DIRECTIONS;
      sampleVoice = true;
      tips = [
        "Chấm ở phát âm, trọng âm và ngữ điệu — không chấm nội dung, nên đừng đọc vội cho hết.",
        "Ngắt hơi ở dấu phẩy và dấu chấm; lên giọng ở câu hỏi, xuống giọng ở câu kể.",
        "Chế độ luyện tập có nút nghe bản đọc mẫu bằng giọng máy để đối chiếu nhịp và chỗ ngắt.",
      ];
      items = f.q12.texts.map((t) => ({
        n: t.n,
        screenText: t.text,
        badge: `${t.genre} · ${t.genreVi}`,
        prepSeconds: Q12_PREP_SECONDS,
        responseSeconds: Q12_READ_SECONDS,
      }));
    } else if (f.kind === "speaking-q5-7") {
      free = f.q57.free;
      testKey = f.q57.slug;
      headline = "Questions 5-7: Respond to questions";
      directions = Q57_DIRECTIONS;
      context = { label: "Tình huống", text: f.q57.situation, textVi: f.q57.situationVi };
      tips = [
        "Câu hỏi CHỈ được nghe khi thi thật — hãy tập bắt từ để hỏi (How often / What kind / Why).",
        "Câu 5 và 6 chỉ có 15 giây: trả lời thẳng rồi thêm đúng một chi tiết, đừng mở bài.",
        "Câu 7 có 30 giây và luôn cần lý do — dùng khuôn \"ý kiến + 2 lý do\".",
      ];
      items = f.q57.questions.map((q) => ({
        n: q.n,
        audioUrls: [q.audioUrl],
        transcript: q.transcript,
        transcriptVi: q.transcriptVi,
        prepSeconds: q.prepSeconds,
        responseSeconds: q.responseSeconds,
      }));
    } else {
      free = f.q11.free;
      testKey = f.q11.slug;
      headline = "Question 11: Express an opinion";
      directions = Q11_DIRECTIONS;
      tips = [
        "Đề hiện cả chữ lẫn audio — đọc kỹ xem đề hỏi CHỌN PHE hay hỏi Ý KIẾN MỞ.",
        "45 giây chuẩn bị: chốt lựa chọn + 2 lý do + 1 ví dụ, đừng cố nghĩ 3 lý do.",
        "60 giây nói là dài — im lặng quá 5 giây là mất điểm, thà nhắc lại ý còn hơn dừng.",
      ];
      items = [
        {
          n: 11,
          audioUrls: [f.q11.audioUrl],
          screenText: f.q11.question,
          transcriptVi: f.q11.questionVi,
          badge: q11FormMeta(f.q11.form).label,
          prepSeconds: Q11_PREP_SECONDS,
          responseSeconds: Q11_RESPONSE_SECONDS,
        },
      ];
    }

    if (!free && !unlocked) return <ContentLockModal />;

    return (
      <SpeakingRunner
        skill={f.skill}
        unit={f.unit}
        mode={mode}
        items={items}
        testTitle={`${f.unit.label} · ${f.title}`}
        testKey={testKey}
        headline={headline}
        directions={directions}
        context={context}
        tips={tips}
        sampleVoice={sampleVoice}
        totalQuestions={11}
        signedIn={Boolean(user)}
        canSubmit={unlocked}
        backHref={`/skills/${skill}/${unit}`}
      />
    );
  }

  if (f.kind === "speaking-q34") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;

    return (
      <SpeakingExamClient
        skill={f.skill}
        unit={f.unit}
        items={f.q34.items}
        testTitle={f.title}
        testKey={f.q34.slug}
        signedIn={Boolean(user)}
        canSubmit={isUsageExempt(profile)}
      />
    );
  }

  if (f.kind === "speaking-q810") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = user
      ? await prisma.profile
          .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
          .catch(() => null)
      : null;
    const unlocked = isUsageExempt(profile);

    // Mỗi thể loại mở 2 bộ đầu; còn lại cần đã đăng ký khoá.
    if (!f.q810.free && !unlocked) return <ContentLockModal />;

    return (
      <SpeakingQ810Client
        skill={f.skill}
        unit={f.unit}
        test={f.q810}
        signedIn={Boolean(user)}
        canSubmit={unlocked}
      />
    );
  }

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

  // Đề 1-2 mở cho mọi người; còn lại cần đã đăng ký khoá (hoặc là HV nội bộ/giáo viên).
  if (!isPracticeTestFree(f.entry.testNumber) && !isUsageExempt(profile)) {
    return <ContentLockModal />;
  }

  const practice = await loadPracticeTest(`test-${f.entry.testNumber}`);
  if (!practice) notFound();

  const fullTest = toFullTest(practice, f.part);
  if (fullTest.groups.length === 0) notFound();

  // Sổ từ vựng ghi theo studentCode trên Firebase, nên chỉ HV nội bộ mới lưu được.
  const canSaveVocab = Boolean(profile?.studentCode)
    || profile?.role === "teacher" || profile?.role === "admin";

  return (
    <PartPracticeRunner
      test={fullTest}
      skill={skill}
      part={f.part}
      backHref={`/skills/${skill}/${unit}`}
      canSaveVocab={canSaveVocab}
    />
  );
}
