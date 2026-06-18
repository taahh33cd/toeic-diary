// ─────────────────────────────────────
// Types — Speaking Part 1 JSON structure
// ─────────────────────────────────────

export type McqOption = { id: string; text: string };

export type SpeakingExercise =
  | {
      type: "multiple_choice";
      id: string;
      instruction: string;
      tts_text: string;
      content?: string;
      options: McqOption[];
      correct_answers: string[];
      explanation: string;
    }
  | {
      type: "essay_typing";
      id: string;
      instruction: string;
      tts_text: string;
      content: string;
      options: [];
      correct_answers: string[];
      explanation: string;
    };

export type SpeakingLevel = {
  level: "Easy" | "Medium" | "Hard";
  exercises: SpeakingExercise[];
};

export type SpeakingTestData = {
  course: string;
  skill: { id: string; name: string; description: string };
  levels: SpeakingLevel[];
};

// ─────────────────────────────────────
// Skill metadata
// ─────────────────────────────────────

export type SkillMeta = {
  id: string;           // slug used in URL
  label: string;        // English label
  labelVi: string;      // Vietnamese label
  description: string;
  part: string;         // DB "part" prefix (without difficulty suffix)
};

export const SPEAKING_SKILLS: SkillMeta[] = [
  {
    id: "phat-am",
    label: "Pronunciation",
    labelVi: "Phát âm nền tảng",
    description: "Phiên âm IPA, trọng âm từ, âm đuôi -s/-ed, âm câm.",
    part: "sp1-phat-am",
  },
  {
    id: "ngat-nghi",
    label: "Chunking & Pausing",
    labelVi: "Ngắt nghỉ",
    description: "Nhận biết vị trí ngắt hơi tự nhiên giữa các cụm ý nghĩa.",
    part: "sp1-ngat-nghi",
  },
  {
    id: "ngu-dieu",
    label: "Intonation",
    labelVi: "Ngữ điệu",
    description: "Lên giọng (↗) và xuống giọng (↘) theo loại câu.",
    part: "sp1-ngu-dieu",
  },
  {
    id: "trong-am",
    label: "Sentence Stress",
    labelVi: "Trọng âm câu",
    description: "Từ nội dung (nhấn) và từ chức năng (lướt) trong câu.",
    part: "sp1-trong-am",
  },
  {
    id: "noi-am",
    label: "Linking Sounds",
    labelVi: "Nối âm",
    description: "Nối âm, Flap T, Geminate, chèn /w/ và /j/.",
    part: "sp1-noi-am",
  },
];

export function getSkillMeta(skillId: string): SkillMeta | undefined {
  return SPEAKING_SKILLS.find((s) => s.id === skillId);
}

// ─────────────────────────────────────
// Data loaders — static JSON imports
// ─────────────────────────────────────

// Phát âm
import phatAm1 from "./phat-am.1.json";
import phatAm2 from "./phat-am.2.json";
import phatAm3 from "./phat-am.3.json";
import phatAm4 from "./phat-am.4.json";
import phatAm5 from "./phat-am.5.json";
// Ngắt nghỉ
import ngatNghi1 from "./ngat-nghi.1.json";
import ngatNghi2 from "./ngat-nghi.2.json";
import ngatNghi3 from "./ngat-nghi.3.json";
import ngatNghi4 from "./ngat-nghi.4.json";
import ngatNghi5 from "./ngat-nghi.5.json";
// Ngữ điệu
import nguDieu1 from "./ngu-dieu.1.json";
import nguDieu2 from "./ngu-dieu.2.json";
import nguDieu3 from "./ngu-dieu.3.json";
import nguDieu4 from "./ngu-dieu.4.json";
import nguDieu5 from "./ngu-dieu.5.json";
// Trọng âm
import trongAm1 from "./trong-am.1.json";
import trongAm2 from "./trong-am.2.json";
import trongAm3 from "./trong-am.3.json";
import trongAm4 from "./trong-am.4.json";
import trongAm5 from "./trong-am.5.json";
// Nối âm
import noiAm1 from "./noi-am.1.json";
import noiAm2 from "./noi-am.2.json";
import noiAm3 from "./noi-am.3.json";
import noiAm4 from "./noi-am.4.json";
import noiAm5 from "./noi-am.5.json";

const DATA_MAP: Record<string, SpeakingTestData[]> = {
  "phat-am":  [phatAm1, phatAm2, phatAm3, phatAm4, phatAm5] as SpeakingTestData[],
  "ngat-nghi":[ngatNghi1, ngatNghi2, ngatNghi3, ngatNghi4, ngatNghi5] as SpeakingTestData[],
  "ngu-dieu": [nguDieu1, nguDieu2, nguDieu3, nguDieu4, nguDieu5] as SpeakingTestData[],
  "trong-am": [trongAm1, trongAm2, trongAm3, trongAm4, trongAm5] as SpeakingTestData[],
  "noi-am":   [noiAm1, noiAm2, noiAm3, noiAm4, noiAm5] as SpeakingTestData[],
};

/** Return all 5 test sets for a skill (index 0-4 = tests 1-5) */
export function getSkillTests(skillId: string): SpeakingTestData[] | undefined {
  return DATA_MAP[skillId];
}

/** Return a specific test set (testNum 1-5) */
export function getSkillTest(skillId: string, testNum: number): SpeakingTestData | undefined {
  return DATA_MAP[skillId]?.[testNum - 1];
}

/** Return exercises for a specific level within a test */
export function getLevelExercises(
  data: SpeakingTestData,
  level: "Easy" | "Medium" | "Hard"
): SpeakingExercise[] {
  return data.levels.find((l) => l.level === level)?.exercises ?? [];
}

// ─────────────────────────────────────
// DB helpers
// ─────────────────────────────────────

export function dbPart(skillId: string, difficulty: "easy" | "medium" | "hard"): string {
  const skill = SPEAKING_SKILLS.find((s) => s.id === skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return difficulty === "easy" ? skill.part : `${skill.part}-${difficulty}`;
}

// ─────────────────────────────────────
// Answer checking
// ─────────────────────────────────────

function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]/g, "");
}

export function checkMcqAnswer(
  exercise: Extract<SpeakingExercise, { type: "multiple_choice" }>,
  selectedId: string
): boolean {
  return exercise.correct_answers.includes(selectedId);
}

export function checkEssayAnswer(
  exercise: Extract<SpeakingExercise, { type: "essay_typing" }>,
  input: string
): boolean {
  const norm = normalizeAnswer(input);
  return exercise.correct_answers.some((a) => normalizeAnswer(a) === norm);
}

export const PASS_THRESHOLD = 80;
