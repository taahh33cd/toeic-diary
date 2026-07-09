import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSkill } from "@/lib/skills/structure";
import { SkillUnitList } from "@/components/skills/SkillUnitList";

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

  return <SkillUnitList skill={s} />;
}
