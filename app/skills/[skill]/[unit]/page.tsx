import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/skills/structure";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";
import { WritingSentenceClient } from "@/components/skills/WritingSentenceClient";
import { WRITING_Q1_5 } from "@/lib/skills/writing-q1-5";

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

  // Writing Q1-5 đã có bài tập thật → render trang làm bài
  if (skill === "writing" && unit === "q1-5") {
    return <WritingSentenceClient skill={found.skill} unit={found.unit} exercises={WRITING_Q1_5} />;
  }

  return <SkillComingSoon skill={found.skill} unit={found.unit} />;
}
