// Subskills cho TOEIC Speaking Questions 8-10 (Respond to questions using information provided).
//
// Khác Part 2 ở chỗ mọi bài tập đều neo vào MỘT bảng thông tin thật đã dùng ở
// /skills/speaking/q8-10, và cấp Hard cho nghe lại chính audio câu hỏi của đề đó.
// Ba cấp bám ba việc khác nhau: nhận diện (Easy) → viết ra (Medium) → nói (Hard).

import soVaGio1 from "./so-va-gio.1.json";
import soVaGio2 from "./so-va-gio.2.json";
import soVaGio3 from "./so-va-gio.3.json";
import quetBang1 from "./quet-bang.1.json";
import quetBang2 from "./quet-bang.2.json";
import quetBang3 from "./quet-bang.3.json";
import batCauHoi1 from "./bat-cau-hoi.1.json";
import batCauHoi2 from "./bat-cau-hoi.2.json";
import batCauHoi3 from "./bat-cau-hoi.3.json";
import traLoiNgan1 from "./tra-loi-ngan.1.json";
import traLoiNgan2 from "./tra-loi-ngan.2.json";
import traLoiNgan3 from "./tra-loi-ngan.3.json";
import bangThanhCau1 from "./bang-thanh-cau.1.json";
import bangThanhCau2 from "./bang-thanh-cau.2.json";
import bangThanhCau3 from "./bang-thanh-cau.3.json";
import dinhChinh1 from "./dinh-chinh.1.json";
import dinhChinh2 from "./dinh-chinh.2.json";
import dinhChinh3 from "./dinh-chinh.3.json";
import lietKe1 from "./liet-ke.1.json";
import lietKe2 from "./liet-ke.2.json";
import lietKe3 from "./liet-ke.3.json";
import giuNhip1 from "./giu-nhip.1.json";
import giuNhip2 from "./giu-nhip.2.json";
import giuNhip3 from "./giu-nhip.3.json";

export const PART4_PASS_THRESHOLD = 80;

export type Part4Level = "Easy" | "Medium" | "Hard";
export type Part4Difficulty = "easy" | "medium" | "hard";

/** `speak_aloud` không có đáp án đúng/sai — học viên nói rồi đối chiếu câu mẫu. */
export type Part4ExerciseType = "multiple_choice" | "essay_typing" | "speak_aloud";

export type Part4Option = { id: string; text: string };

export type Part4Exercise = {
  id: string;
  type: Part4ExerciseType;
  instruction: string;
  content?: string;
  options: Part4Option[];
  correct_answers: string[];
  explanation: string;
  /** Audio câu hỏi thật của đề (chỉ bài speak_aloud). */
  audio_url?: string;
  /** Câu trả lời mẫu — vừa để đối chiếu, vừa làm reference chấm phát âm. */
  reference_text?: string;
};

export type Part4Test = {
  skillId: string;
  testNum: number;
  title: string;
  /** Slug bộ đề gốc ở /skills/speaking/q8-10 — để dẫn học viên sang làm đề đầy đủ. */
  sourceSlug: string;
  imageUrl: string;
  levels: { level: Part4Level; exercises: Part4Exercise[] }[];
};

export type Part4SkillMeta = {
  id: string;
  label: string;
  labelVi: string;
  description: string;
  /** Mức điểm mà kỹ năng này phục vụ. */
  band: "nen" | "trong-tam" | "nang-cao";
  /** Khoá part lưu vào subskill_attempts. */
  part: string;
  /** Đã có bộ bài tập hay chưa. */
  ready: boolean;
};

export const PART4_BANDS: { id: Part4SkillMeta["band"]; label: string; target: string; hint: string }[] = [
  {
    id: "nen",
    label: "Kỹ năng nền",
    target: "nhắm 100–120",
    hint: "Đọc đúng bảng và đọc đúng con số. Hỏng ở đây thì mọi câu trả lời phía sau đều sai thông tin.",
  },
  {
    id: "trong-tam",
    label: "Kỹ năng trọng tâm",
    target: "nhắm 130–150",
    hint: "Trả lời trọn câu và xử lý được thông tin người gọi nhớ sai — đây là phần quyết định điểm câu 8 và 9.",
  },
  {
    id: "nang-cao",
    label: "Kỹ năng nâng cao",
    target: "nhắm 160–200",
    hint: "Câu 10: liệt kê nhiều dòng thông tin liền mạch và nói đủ 30 giây không hụt ý.",
  },
];

export const SPEAKING_P4_SKILLS: Part4SkillMeta[] = [
  {
    id: "quet-bang",
    label: "Scan the table",
    labelVi: "Quét bảng đúng ô",
    description: "45 giây tìm đúng hàng/cột: Time × Session × Speaker, và những dòng có dấu sao.",
    band: "nen",
    part: "sp4-quet-bang",
    ready: true,
  },
  {
    id: "so-va-gio",
    label: "Saying numbers & times",
    labelVi: "Đọc số & thời gian thành lời",
    description: "Giờ, ngày, giá tiền, mã số — chuyển từ bảng thành lời nói tự nhiên, đúng đuôi -th và -s.",
    band: "nen",
    part: "sp4-so-va-gio",
    ready: true,
  },
  {
    id: "bat-cau-hoi",
    label: "Catching the question",
    labelVi: "Nghe bắt dạng câu hỏi",
    description: "What time / Who / How much / How long / Where — nhận ra dạng hỏi ngay lần nghe đầu.",
    band: "nen",
    part: "sp4-bat-cau-hoi",
    ready: true,
  },
  {
    id: "tra-loi-ngan",
    label: "Answering Q8 & Q9",
    labelVi: "Mẫu câu trả lời ngắn",
    description: "Trả lời trọn câu trong 15 giây, có chủ ngữ vị ngữ, không nói cụt lủn.",
    band: "trong-tam",
    part: "sp4-tra-loi-ngan",
    ready: true,
  },
  {
    id: "bang-thanh-cau",
    label: "Turning rows into sentences",
    labelVi: "Đọc bảng thành câu hoàn chỉnh",
    description: "Cột Speaker → “It will be presented by…”; cột Location → “It takes place at…”.",
    band: "trong-tam",
    part: "sp4-bang-thanh-cau",
    ready: true,
  },
  {
    id: "dinh-chinh",
    label: "Correcting wrong information",
    labelVi: "Xử lý thông tin sai · bị huỷ",
    description: "Dòng gạch ngang, phiên bị dời giờ, chi tiết người gọi nhớ nhầm — bẫy cố định của câu 9.",
    band: "trong-tam",
    part: "sp4-dinh-chinh",
    ready: true,
  },
  {
    id: "liet-ke",
    label: "Listing for Q10",
    labelVi: "Liệt kê nhiều mục cho câu 10",
    description: "First… After that… Finally… — gộp nhiều dòng bảng thành một đoạn liền mạch.",
    band: "nang-cao",
    part: "sp4-liet-ke",
    ready: true,
  },
  {
    id: "giu-nhip",
    label: "Filling 30 seconds",
    labelVi: "Giữ nhịp 30 giây",
    description: "Nói đủ thời lượng, không ngập ngừng, không hết ý ở giây thứ mười lăm.",
    band: "nang-cao",
    part: "sp4-giu-nhip",
    ready: true,
  },
];

export function getPart4SkillMeta(skillId: string): Part4SkillMeta | undefined {
  return SPEAKING_P4_SKILLS.find((s) => s.id === skillId);
}

// ─────────────────────────────────────
// Data
// ─────────────────────────────────────

type RawExercise = {
  id: string;
  type: string;
  instruction: string;
  content?: string;
  options?: Part4Option[];
  correct_answers?: string[];
  explanation: string;
  audio_url?: string;
  reference_text?: string;
};

type RawTest = {
  test_number: number;
  title: string;
  source_slug: string;
  image_url: string;
  levels: { level: Part4Level; exercises: RawExercise[] }[];
};

const RAW_MAP: Record<string, RawTest[]> = {
  "so-va-gio":      [soVaGio1 as RawTest, soVaGio2 as RawTest, soVaGio3 as RawTest],
  "quet-bang":      [quetBang1 as RawTest, quetBang2 as RawTest, quetBang3 as RawTest],
  "bat-cau-hoi":    [batCauHoi1 as RawTest, batCauHoi2 as RawTest, batCauHoi3 as RawTest],
  "tra-loi-ngan":   [traLoiNgan1 as RawTest, traLoiNgan2 as RawTest, traLoiNgan3 as RawTest],
  "bang-thanh-cau": [bangThanhCau1 as RawTest, bangThanhCau2 as RawTest, bangThanhCau3 as RawTest],
  "dinh-chinh":     [dinhChinh1 as RawTest, dinhChinh2 as RawTest, dinhChinh3 as RawTest],
  "liet-ke":        [lietKe1 as RawTest, lietKe2 as RawTest, lietKe3 as RawTest],
  "giu-nhip":       [giuNhip1 as RawTest, giuNhip2 as RawTest, giuNhip3 as RawTest],
};

function normalize(raw: RawTest, skillId: string): Part4Test {
  return {
    skillId,
    testNum: raw.test_number,
    title: raw.title,
    sourceSlug: raw.source_slug,
    imageUrl: raw.image_url,
    levels: raw.levels.map((lvl) => ({
      level: lvl.level,
      exercises: lvl.exercises.map((ex) => ({
        id: ex.id,
        type: ex.type as Part4ExerciseType,
        instruction: ex.instruction,
        content: ex.content,
        options: ex.options ?? [],
        correct_answers: ex.correct_answers ?? [],
        explanation: ex.explanation,
        audio_url: ex.audio_url,
        reference_text: ex.reference_text,
      })),
    })),
  };
}

export function getPart4SkillTests(skillId: string): Part4Test[] | undefined {
  const raws = RAW_MAP[skillId];
  if (!raws) return undefined;
  return raws.map((raw) => normalize(raw, skillId));
}

export function getPart4Exercises(test: Part4Test, level: Part4Level): Part4Exercise[] {
  return test.levels.find((l) => l.level === level)?.exercises ?? [];
}

// ─────────────────────────────────────
// DB + chấm bài
// ─────────────────────────────────────

export function dbPart4(skillId: string, difficulty: Part4Difficulty): string {
  const skill = getPart4SkillMeta(skillId);
  if (!skill) throw new Error(`Unknown Part 4 skill: ${skillId}`);
  return difficulty === "easy" ? skill.part : `${skill.part}-${difficulty}`;
}

function normalizeAnswer(s: string): string {
  return s.toLowerCase().trim().replace(/[.,!?;:]/g, "").replace(/[-\s]+/g, " ");
}

export function checkPart4Answer(exercise: Part4Exercise, input: string): boolean {
  if (exercise.type === "multiple_choice") return exercise.correct_answers.includes(input);
  if (exercise.type === "speak_aloud") return true; // bài nói: xem câu mẫu là xong
  const norm = normalizeAnswer(input);
  return exercise.correct_answers.some((a) => normalizeAnswer(a) === norm);
}
