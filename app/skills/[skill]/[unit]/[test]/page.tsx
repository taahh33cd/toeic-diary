import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/skills/structure";
import { getPracticeEntry, loadPracticePart } from "@/lib/listening-practice";
import { ListeningPracticeClient } from "@/components/skills/listening/ListeningPracticeClient";

type Props = { params: Promise<{ skill: string; unit: string; test: string }> };

/** Hiện chỉ Listening Part 1/2 có bộ đề chia theo test */
function parse(skill: string, unit: string, test: string) {
  if (skill !== "listening" || (unit !== "part1" && unit !== "part2")) return null;
  const testNumber = Number(test);
  if (!Number.isInteger(testNumber)) return null;
  const found = getUnit(skill, unit);
  const entry = getPracticeEntry(testNumber);
  if (!found || !entry) return null;
  return { ...found, entry, part: (unit === "part1" ? 1 : 2) as 1 | 2 };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill, unit, test } = await params;
  const f = parse(skill, unit, test);
  return {
    title: f
      ? `${f.skill.label} · ${f.unit.label} · ${f.entry.title} — Luyện đề TOEIC`
      : "Luyện đề TOEIC",
  };
}

export default async function ListeningPracticeTestPage({ params }: Props) {
  const { skill, unit, test } = await params;
  const f = parse(skill, unit, test);
  if (!f) notFound();

  const loaded = await loadPracticePart(f.entry.testNumber, f.part);
  if (!loaded || loaded.questions.length === 0) notFound();

  return (
    <ListeningPracticeClient
      skill={f.skill}
      unit={f.unit}
      part={f.part}
      testTitle={f.entry.title}
      questions={loaded.questions}
    />
  );
}
