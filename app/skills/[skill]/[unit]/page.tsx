import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/skills/structure";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";

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

  return <SkillComingSoon skill={found.skill} unit={found.unit} />;
}
