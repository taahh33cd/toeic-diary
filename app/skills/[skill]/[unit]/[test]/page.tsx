import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/skills/structure";
import { getPracticeEntry, isPracticeTestFree, loadPracticeTest } from "@/lib/listening-practice";
import { toFullTest } from "@/lib/listening-practice/adapt";
import { PartPracticeRunner } from "@/components/skills/part-practice/PartPracticeRunner";
import { ContentLockModal } from "@/components/shared/ContentLockModal";
import { SpeakingExamClient } from "@/components/skills/exam/SpeakingExamClient";
import { Q34_LEVELS, getQ34Test } from "@/lib/skills/speaking-q3-4";
import { SpeakingQ810Client } from "@/components/skills/exam/SpeakingQ810Client";
import { getQ810Test, q810CategoryMeta } from "@/lib/skills/speaking-q8-10";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { isUsageExempt } from "@/lib/access";

type Props = { params: Promise<{ skill: string; unit: string; test: string }> };

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

  if (skill === "speaking" && unit === "q8-10") {
    const q810 = getQ810Test(test);
    if (!q810) return null;
    const cat = q810CategoryMeta(q810.category);
    return { kind: "speaking-q810" as const, ...found, q810, title: `${cat.label} · Đề ${q810.index}` };
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill, unit, test } = await params;
  const f = parse(skill, unit, test);
  if (!f) return { title: "Luyện đề TOEIC" };
  const name = f.kind === "listening" ? f.entry.title : f.title;
  return { title: `${f.skill.label} · ${f.unit.label} · ${name} — Luyện đề TOEIC` };
}

export default async function SkillTestPage({ params }: Props) {
  const { skill, unit, test } = await params;
  const f = parse(skill, unit, test);
  if (!f) notFound();

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
