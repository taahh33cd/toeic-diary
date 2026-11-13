/**
 * lib/roadmap/catalog.meta.ts — phần KHAI TAY của catalog.
 *
 * Script `scripts/roadmap/build-catalog.ts` quét các registry nội dung có sẵn
 * (12 thì Part 5, 10 nhóm câu hỏi Part 2, 16 thẻ ngữ pháp…) để lấy slug, tiêu đề
 * và biết bộ nào có dữ liệu thật. Những thứ KHÔNG suy ra được từ dữ liệu —
 * bài này hợp với học viên tầm điểm nào, mất bao lâu, chữa part nào — khai ở đây,
 * theo NHÓM chứ không theo từng mục, rồi script nhân ra.
 *
 * Mọi con số dưới đây là ước lượng sư phạm. Sửa được, nhưng sửa thì chạy lại
 * `npm run build:catalog` và `npm run check:catalog`.
 */

import type { PartNumber } from "./types";

/** Dải điểm phù hợp theo bậc, dùng chung cho các khu chia 6 cấp (l1–l6). */
export const LEVEL_BANDS: Record<string, [number, number]> = {
  l1: [10, 600],
  l2: [10, 650],
  l3: [300, 750],
  l4: [350, 800],
  l5: [500, 900],
  l6: [550, 990],
};

/** Khu Part 3/4 chia 5 cấp, độ khó dốc hơn nên dải hẹp hơn. */
export const PART3_LEVEL_BANDS: Record<string, [number, number]> = {
  l1: [10, 600],
  l2: [300, 700],
  l3: [400, 800],
  l4: [500, 880],
  l5: [600, 990],
};

export type AreaMeta = {
  parts: PartNumber[];
  skill: "listening" | "reading" | "both" | "speaking" | "writing";
  tags: string[];
  /** Thời lượng ước tính cho MỘT mục của khu này. */
  estMinutes: number;
  /** Điểm đạt mặc định của khu (các khu đều dùng 80). */
  minScore: number;
};

export const AREA_META = {
  /**
   * Part 2 — 10 loại câu hỏi × 3 mức, mỗi bộ 4 bài con × 14 câu.
   * `estMinutes` là của MỘT BÀI CON (catalog tách từng bài một, xem
   * build-catalog), không phải cả bộ.
   */
  part2: {
    parts: [2] as PartNumber[],
    skill: "listening" as const,
    tags: ["listening-decode", "wh-question"],
    estMinutes: 8,
    minScore: 80,
  },

  /** Part 3/4 — 5 cấp, mỗi cấp vài drill. */
  part3: {
    parts: [3, 4] as PartNumber[],
    skill: "listening" as const,
    tags: ["listening-decode", "paraphrase"],
    estMinutes: 12,
    minScore: 80,
  },

  /** Part 5 theo thì — nền ngữ pháp, dùng chung cho cả Part 6. */
  part5Tense: {
    parts: [5, 6] as PartNumber[],
    skill: "reading" as const,
    tags: ["grammar-core", "tenses"],
    estMinutes: 15,
    minScore: 80,
  },

  /** Liên từ / từ nối — cũng là nền ngữ pháp, chạm cả Part 7. */
  connectors: {
    parts: [5, 6, 7] as PartNumber[],
    skill: "reading" as const,
    tags: ["grammar-core", "connectors"],
    estMinutes: 15,
    minScore: 80,
  },

  /** Động từ bất quy tắc — nền từ vựng cho Part 5. */
  verbs: {
    parts: [5] as PartNumber[],
    skill: "reading" as const,
    tags: ["grammar-core", "vocab"],
    estMinutes: 12,
    minScore: 80,
  },

  /** Dịch Anh–Việt — tốc độ đọc và vốn từ, phục vụ Part 6/7. */
  translation: {
    parts: [6, 7] as PartNumber[],
    skill: "reading" as const,
    tags: ["vocab", "reading-speed"],
    estMinutes: 20,
    minScore: 80,
  },

  /** Chunking nhánh Nghe — nền giải mã dòng âm thanh cho Part 3/4. */
  chunking: {
    parts: [3, 4] as PartNumber[],
    skill: "listening" as const,
    tags: ["listening-decode", "chunking"],
    estMinutes: 15,
    minScore: 80,
  },

  /** IPA — nền phát âm, đỡ cho Part 1/2. */
  ipa: {
    parts: [1, 2] as PartNumber[],
    skill: "listening" as const,
    tags: ["pronunciation", "listening-decode"],
    estMinutes: 20,
    minScore: 80,
  },

  /** Thẻ ngữ pháp — kho câu Part 5 lớn nhất trên web. */
  grammar: {
    parts: [5, 6] as PartNumber[],
    skill: "reading" as const,
    tags: ["grammar-core", "drill"],
    estMinutes: 15,
    minScore: 80,
  },

  /** Luyện từng part theo đúng format đề thi. */
  partPractice: {
    parts: [] as PartNumber[], // gán theo từng part lúc build
    skill: "listening" as const,
    tags: ["exam-format"],
    estMinutes: 15,
    minScore: 0,
  },

  /**
   * Nói — bài luyện theo đúng format đề S&W, học viên tự làm rồi lưu vào sổ.
   * Mở cho mọi tầm điểm: đây là kỹ năng khác hẳn, không xếp theo band L&R được.
   */
  speaking: {
    parts: [] as PartNumber[],
    skill: "speaking" as const,
    tags: ["sw", "speaking"],
    estMinutes: 20,
    minScore: 0,
  },

  /** Viết — tương tự Nói. */
  writing: {
    parts: [] as PartNumber[],
    skill: "writing" as const,
    tags: ["sw", "writing"],
    estMinutes: 25,
    minScore: 0,
  },

  /** Full test — mốc kiểm tra cuối tháng. */
  fullTest: {
    parts: [1, 2, 3, 4, 5, 6, 7] as PartNumber[],
    skill: "both" as const,
    tags: ["exam-format", "checkpoint"],
    estMinutes: 120,
    minScore: 0,
  },
} satisfies Record<string, AreaMeta>;

/** Dải điểm theo mức khó của Part 2 và IPA (hai khu dùng tham số ?d=). */
export const DIFFICULTY_BANDS: Record<string, [number, number]> = {
  easy: [10, 700],
  medium: [400, 850],
  hard: [550, 990],
};

export const DIFFICULTY_RANK: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** Thời lượng của một bài luyện part lẻ, theo số câu. */
export function partPracticeMinutes(questionCount: number): number {
  // Part 1 sáu câu ≈ 8 phút kể cả nghe lại; Part 2 hai lăm câu ≈ 15 phút.
  return Math.max(8, Math.round(questionCount * 0.55));
}

/** Thời lượng một thẻ ngữ pháp, theo số câu của đề con đó. */
export function grammarMinutes(size: number): number {
  return Math.max(8, Math.round(size * 0.75));
}

/**
 * Độ chính xác tối thiểu để coi là xong một bài luyện part lẻ / thẻ ngữ pháp.
 * Thấp hơn ngưỡng 80 của subskill vì đây là bài theo format đề thi, khó hơn hẳn
 * bài luyện kỹ năng nền — đặt 80 ở đây thì học viên tầm 400 sẽ không bao giờ
 * tích được việc nào.
 */
export const EXAM_STYLE_MIN_ACCURACY = 0.6;
export const GRAMMAR_MIN_ACCURACY = 0.6;
