import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/skills/structure";
import { getPracticeEntry, loadPracticePart } from "@/lib/listening-practice";
import { ListeningPracticeClient } from "@/components/skills/listening/ListeningPracticeClient";
import { SpeakingExamClient } from "@/components/skills/exam/SpeakingExamClient";
import { Q34_LEVELS, getQ34Test } from "@/lib/skills/speaking-q3-4";

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
    return <SpeakingExamClient skill={f.skill} unit={f.unit} items={f.q34.items} testTitle={f.title} />;
  }

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
