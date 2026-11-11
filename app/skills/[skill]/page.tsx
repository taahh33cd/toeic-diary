import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSkill } from "@/lib/skills/structure";
import { SkillUnitList } from "@/components/skills/SkillUnitList";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ skill: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill } = await params;
  const s = getSkill(skill);
  return { title: s ? `${s.label} — Luyện đề TOEIC` : "Luyện đề TOEIC" };
}

export default async function SkillHubPage({ params }: Props) {
  const { skill } = await params;
  const s = getSkill(skill);
  if (!s) notFound();

  // Mỗi kỹ năng có một thứ lưu lại được → hiện lối vào sổ tay để xem lại:
  // Speaking/Writing là bài đã nộp, Listening/Reading là lượt làm đã chấm.
  let savedCount = 0;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    savedCount = s.family === "lr"
      ? await prisma.partPracticeAttempt
          .count({ where: { userId: user.id, skill: s.slug, status: "done" } })
          .catch(() => 0)
      : await prisma.skillSubmission
          .count({ where: { userId: user.id, skill: s.slug } })
          .catch(() => 0);
  }

  return <SkillUnitList skill={s} savedCount={savedCount} />;
}
