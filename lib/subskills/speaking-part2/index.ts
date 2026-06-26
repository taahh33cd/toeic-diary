// ─────────────────────────────────────
// Raw JSON shapes (two schemas exist in the source files)
// ─────────────────────────────────────

type RawOption = { id: string; text: string };

type RawExercise = {
  id: string;
  type: "multiple_choice" | "essay_typing";
  instruction: string;
  image_url?: string;
  image_path?: string;
  content?: string;
  options: RawOption[];
  correct_answers: string[];
  explanation: string;
};

type RawLevel = {
  level: "Easy" | "Medium" | "Hard";
  exercises: RawExercise[];
};

// Skills 1–3 root schema
type RawSchemaA = {
  course: string;
  skill: { id: string; name: string; description: string };
  levels: RawLevel[];
};

// Skills 4–5 root schema
type RawSchemaB = {
  part: string;
  section: string;
  test_number: number;
  title: string;
  levels: RawLevel[];
  [key: string]: unknown;
};

// ─────────────────────────────────────
// Normalized types (what the UI consumes)
// ─────────────────────────────────────

export type Part2Option = { id: string; text: string };

export type Part2Exercise = {
  id: string;
  type: "multiple_choice" | "essay_typing";
  instruction: string;
  image_url: string;
  content?: string;
  options: Part2Option[];
  correct_answers: string[];
  explanation: string;
  tts_text: string;
};

export type Part2Level = {
  level: "Easy" | "Medium" | "Hard";
  exercises: Part2Exercise[];
};

export type Part2TestData = {
  skillId: string;
  testNum: number;
  levels: Part2Level[];
};

// ─────────────────────────────────────
// Skill metadata
// ─────────────────────────────────────

export type Part2SkillMeta = {
  id: string;
  label: string;
  labelVi: string;
  description: string;
  part: string;
};

export const SPEAKING_P2_SKILLS: Part2SkillMeta[] = [
  {
    id: "boi-canh",
    label: "Overview & Setting",
    labelVi: "Xác định bối cảnh chung",
    description: "Chọn giới từ và cấu trúc chuẩn để giới thiệu bức tranh.",
    part: "sp2-boi-canh",
  },
  {
    id: "vi-tri",
    label: "Prepositions of Place",
    labelVi: "Vị trí & Định hướng không gian",
    description: "Sử dụng chính xác giới từ chỉ vị trí để định vị đối tượng trong ảnh.",
    part: "sp2-vi-tri",
  },
  {
    id: "mieu-nguoi",
    label: "Describing People",
    labelVi: "Miêu tả người — Hành động & Trang phục",
    description: "Cấu trúc hiện tại tiếp diễn (S + is/are + V-ing) để miêu tả nhân vật.",
    part: "sp2-mieu-nguoi",
  },
  {
    id: "mieu-vat",
    label: "Describing Objects & Scenery",
    labelVi: "Miêu tả vật & Phong cảnh",
    description: "There is/are và bị động trạng thái để miêu tả vật và cảnh vật.",
    part: "sp2-mieu-vat",
  },
  {
    id: "suy-luan",
    label: "Inference & Impression",
    labelVi: "Suy luận & Cảm nhận",
    description: "looks / seems / might / probably / overall — cụm từ suy luận.",
    part: "sp2-suy-luan",
  },
];

export function getPart2SkillMeta(skillId: string): Part2SkillMeta | undefined {
  return SPEAKING_P2_SKILLS.find((s) => s.id === skillId);
}

export const PART2_PASS_THRESHOLD = 80;

// ─────────────────────────────────────
// Normalization helpers
// ─────────────────────────────────────

function deriveTtsText(ex: RawExercise): string {
  if (ex.type === "essay_typing" && ex.content) {
    const answer = ex.correct_answers[0] ?? "";
    // Replace one or more consecutive blank groups (______ or ______ ______ ______) with the answer
    return ex.content.replace(/_{6}(?:\s+_{6})*/g, answer);
  }
  if (ex.type === "multiple_choice") {
    const correctId = ex.correct_answers[0];
    const option = ex.options.find((o) => o.id === correctId);
    return option?.text ?? ex.instruction;
  }
  return ex.instruction;
}

function deriveImageUrl(ex: RawExercise): string {
  // Prefer local path (actual image in /public); fall back to placeholder URL
  if (ex.image_path) return `/${ex.image_path}`;
  if (ex.image_url) return ex.image_url;
  return "";
}

function normalizeExercise(ex: RawExercise): Part2Exercise {
  return {
    id: ex.id,
    type: ex.type,
    instruction: ex.instruction,
    image_url: deriveImageUrl(ex),
    content: ex.content,
    options: ex.options ?? [],
    correct_answers: ex.correct_answers,
    explanation: ex.explanation,
    tts_text: deriveTtsText(ex),
  };
}

function normalizeRaw(raw: RawSchemaA | RawSchemaB, skillId: string, testNum: number): Part2TestData {
  return {
    skillId,
    testNum,
    levels: raw.levels.map((lvl) => ({
      level: lvl.level,
      exercises: lvl.exercises.map(normalizeExercise),
    })),
  };
}

// ─────────────────────────────────────
// Static JSON imports
// ─────────────────────────────────────

import boiCanh1 from "./boi-canh.1.json";
import boiCanh2 from "./boi-canh.2.json";
import boiCanh3 from "./boi-canh.3.json";
import boiCanh4 from "./boi-canh.4.json";
import boiCanh5 from "./boi-canh.5.json";

import viTri1 from "./vi-tri.1.json";
import viTri2 from "./vi-tri.2.json";
import viTri3 from "./vi-tri.3.json";
import viTri4 from "./vi-tri.4.json";
import viTri5 from "./vi-tri.5.json";

import mieuNguoi1 from "./mieu-nguoi.1.json";
import mieuNguoi2 from "./mieu-nguoi.2.json";
import mieuNguoi3 from "./mieu-nguoi.3.json";
import mieuNguoi4 from "./mieu-nguoi.4.json";
import mieuNguoi5 from "./mieu-nguoi.5.json";

import mieuVat1 from "./mieu-vat.1.json";
import mieuVat2 from "./mieu-vat.2.json";
import mieuVat3 from "./mieu-vat.3.json";
import mieuVat4 from "./mieu-vat.4.json";
import mieuVat5 from "./mieu-vat.5.json";

import suyLuan1 from "./suy-luan.1.json";
import suyLuan2 from "./suy-luan.2.json";
import suyLuan3 from "./suy-luan.3.json";
import suyLuan4 from "./suy-luan.4.json";
import suyLuan5 from "./suy-luan.5.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRaw = any;

const RAW_MAP: Record<string, [AnyRaw, AnyRaw, AnyRaw, AnyRaw, AnyRaw]> = {
  "boi-canh":   [boiCanh1,   boiCanh2,   boiCanh3,   boiCanh4,   boiCanh5],
  "vi-tri":     [viTri1,     viTri2,     viTri3,     viTri4,     viTri5],
  "mieu-nguoi": [mieuNguoi1, mieuNguoi2, mieuNguoi3, mieuNguoi4, mieuNguoi5],
  "mieu-vat":   [mieuVat1,   mieuVat2,   mieuVat3,   mieuVat4,   mieuVat5],
  "suy-luan":   [suyLuan1,   suyLuan2,   suyLuan3,   suyLuan4,   suyLuan5],
};

// ─────────────────────────────────────
// Public accessors
// ─────────────────────────────────────

/** Return all 5 normalized test sets for a skill */
export function getPart2SkillTests(skillId: string): Part2TestData[] | undefined {
  const raws = RAW_MAP[skillId];
  if (!raws) return undefined;
  return raws.map((raw, i) => normalizeRaw(raw, skillId, i + 1));
}

/** Return a specific normalized test (testNum 1–5) */
export function getPart2SkillTest(skillId: string, testNum: number): Part2TestData | undefined {
  const raws = RAW_MAP[skillId];
  if (!raws) return undefined;
  const raw = raws[testNum - 1];
  if (!raw) return undefined;
  return normalizeRaw(raw, skillId, testNum);
}

/** Return exercises for a specific level */
export function getPart2LevelExercises(
  data: Part2TestData,
  level: "Easy" | "Medium" | "Hard"
): Part2Exercise[] {
  return data.levels.find((l) => l.level === level)?.exercises ?? [];
}

// ─────────────────────────────────────
// DB helpers
// ─────────────────────────────────────

export function dbPart2(skillId: string, difficulty: "easy" | "medium" | "hard"): string {
  const skill = SPEAKING_P2_SKILLS.find((s) => s.id === skillId);
  if (!skill) throw new Error(`Unknown Part 2 skill: ${skillId}`);
  return difficulty === "easy" ? skill.part : `${skill.part}-${difficulty}`;
}

// ─────────────────────────────────────
// Answer checking
// ─────────────────────────────────────

function normalizeAnswer(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.,!?;:]/g, "");
}

export function checkPart2McqAnswer(exercise: Part2Exercise, selectedId: string): boolean {
  return exercise.correct_answers.includes(selectedId);
}

export function checkPart2EssayAnswer(exercise: Part2Exercise, input: string): boolean {
  const norm = normalizeAnswer(input);
  return exercise.correct_answers.some((a) => normalizeAnswer(a) === norm);
}
