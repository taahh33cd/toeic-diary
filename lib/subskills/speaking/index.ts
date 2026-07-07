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
import phatAm6 from "./phat-am.6.json";
import phatAm7 from "./phat-am.7.json";
import phatAm8 from "./phat-am.8.json";
import phatAm9 from "./phat-am.9.json";
import phatAm10 from "./phat-am.10.json";
import phatAm11 from "./phat-am.11.json";
import phatAm12 from "./phat-am.12.json";
import phatAm13 from "./phat-am.13.json";
import phatAm14 from "./phat-am.14.json";
import phatAm15 from "./phat-am.15.json";
import phatAm16 from "./phat-am.16.json";
import phatAm17 from "./phat-am.17.json";
import phatAm18 from "./phat-am.18.json";
import phatAm19 from "./phat-am.19.json";
import phatAm20 from "./phat-am.20.json";
// Ngắt nghỉ
import ngatNghi1 from "./ngat-nghi.1.json";
import ngatNghi2 from "./ngat-nghi.2.json";
import ngatNghi3 from "./ngat-nghi.3.json";
import ngatNghi4 from "./ngat-nghi.4.json";
import ngatNghi5 from "./ngat-nghi.5.json";
import ngatNghi6 from "./ngat-nghi.6.json";
import ngatNghi7 from "./ngat-nghi.7.json";
import ngatNghi8 from "./ngat-nghi.8.json";
import ngatNghi9 from "./ngat-nghi.9.json";
import ngatNghi10 from "./ngat-nghi.10.json";
import ngatNghi11 from "./ngat-nghi.11.json";
import ngatNghi12 from "./ngat-nghi.12.json";
import ngatNghi13 from "./ngat-nghi.13.json";
import ngatNghi14 from "./ngat-nghi.14.json";
import ngatNghi15 from "./ngat-nghi.15.json";
import ngatNghi16 from "./ngat-nghi.16.json";
import ngatNghi17 from "./ngat-nghi.17.json";
import ngatNghi18 from "./ngat-nghi.18.json";
import ngatNghi19 from "./ngat-nghi.19.json";
import ngatNghi20 from "./ngat-nghi.20.json";
// Ngữ điệu
import nguDieu1 from "./ngu-dieu.1.json";
import nguDieu2 from "./ngu-dieu.2.json";
import nguDieu3 from "./ngu-dieu.3.json";
import nguDieu4 from "./ngu-dieu.4.json";
import nguDieu5 from "./ngu-dieu.5.json";
import nguDieu6 from "./ngu-dieu.6.json";
import nguDieu7 from "./ngu-dieu.7.json";
import nguDieu8 from "./ngu-dieu.8.json";
import nguDieu9 from "./ngu-dieu.9.json";
import nguDieu10 from "./ngu-dieu.10.json";
import nguDieu11 from "./ngu-dieu.11.json";
import nguDieu12 from "./ngu-dieu.12.json";
import nguDieu13 from "./ngu-dieu.13.json";
import nguDieu14 from "./ngu-dieu.14.json";
import nguDieu15 from "./ngu-dieu.15.json";
import nguDieu16 from "./ngu-dieu.16.json";
import nguDieu17 from "./ngu-dieu.17.json";
import nguDieu18 from "./ngu-dieu.18.json";
import nguDieu19 from "./ngu-dieu.19.json";
import nguDieu20 from "./ngu-dieu.20.json";
// Trọng âm
import trongAm1 from "./trong-am.1.json";
import trongAm2 from "./trong-am.2.json";
import trongAm3 from "./trong-am.3.json";
import trongAm4 from "./trong-am.4.json";
import trongAm5 from "./trong-am.5.json";
import trongAm6 from "./trong-am.6.json";
import trongAm7 from "./trong-am.7.json";
import trongAm8 from "./trong-am.8.json";
import trongAm9 from "./trong-am.9.json";
import trongAm10 from "./trong-am.10.json";
import trongAm11 from "./trong-am.11.json";
import trongAm12 from "./trong-am.12.json";
import trongAm13 from "./trong-am.13.json";
import trongAm14 from "./trong-am.14.json";
import trongAm15 from "./trong-am.15.json";
import trongAm16 from "./trong-am.16.json";
import trongAm17 from "./trong-am.17.json";
import trongAm18 from "./trong-am.18.json";
import trongAm19 from "./trong-am.19.json";
import trongAm20 from "./trong-am.20.json";
// Nối âm
import noiAm1 from "./noi-am.1.json";
import noiAm2 from "./noi-am.2.json";
import noiAm3 from "./noi-am.3.json";
import noiAm4 from "./noi-am.4.json";
import noiAm5 from "./noi-am.5.json";
import noiAm6 from "./noi-am.6.json";
import noiAm7 from "./noi-am.7.json";
import noiAm8 from "./noi-am.8.json";
import noiAm9 from "./noi-am.9.json";
import noiAm10 from "./noi-am.10.json";
import noiAm11 from "./noi-am.11.json";
import noiAm12 from "./noi-am.12.json";
import noiAm13 from "./noi-am.13.json";
import noiAm14 from "./noi-am.14.json";
import noiAm15 from "./noi-am.15.json";
import noiAm16 from "./noi-am.16.json";
import noiAm17 from "./noi-am.17.json";
import noiAm18 from "./noi-am.18.json";
import noiAm19 from "./noi-am.19.json";
import noiAm20 from "./noi-am.20.json";

const DATA_MAP: Record<string, SpeakingTestData[]> = {
  "phat-am":  [phatAm1, phatAm2, phatAm3, phatAm4, phatAm5, phatAm6, phatAm7, phatAm8, phatAm9, phatAm10, phatAm11, phatAm12, phatAm13, phatAm14, phatAm15, phatAm16, phatAm17, phatAm18, phatAm19, phatAm20] as SpeakingTestData[],
  "ngat-nghi":[ngatNghi1, ngatNghi2, ngatNghi3, ngatNghi4, ngatNghi5, ngatNghi6, ngatNghi7, ngatNghi8, ngatNghi9, ngatNghi10, ngatNghi11, ngatNghi12, ngatNghi13, ngatNghi14, ngatNghi15, ngatNghi16, ngatNghi17, ngatNghi18, ngatNghi19, ngatNghi20] as SpeakingTestData[],
  "ngu-dieu": [nguDieu1, nguDieu2, nguDieu3, nguDieu4, nguDieu5, nguDieu6, nguDieu7, nguDieu8, nguDieu9, nguDieu10, nguDieu11, nguDieu12, nguDieu13, nguDieu14, nguDieu15, nguDieu16, nguDieu17, nguDieu18, nguDieu19, nguDieu20] as SpeakingTestData[],
  "trong-am": [trongAm1, trongAm2, trongAm3, trongAm4, trongAm5, trongAm6, trongAm7, trongAm8, trongAm9, trongAm10, trongAm11, trongAm12, trongAm13, trongAm14, trongAm15, trongAm16, trongAm17, trongAm18, trongAm19, trongAm20] as SpeakingTestData[],
  "noi-am":   [noiAm1, noiAm2, noiAm3, noiAm4, noiAm5, noiAm6, noiAm7, noiAm8, noiAm9, noiAm10, noiAm11, noiAm12, noiAm13, noiAm14, noiAm15, noiAm16, noiAm17, noiAm18, noiAm19, noiAm20] as SpeakingTestData[],
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
