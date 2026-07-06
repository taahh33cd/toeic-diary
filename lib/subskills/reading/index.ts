import type { Part5TenseConfig, Part5Level, LevelSlug } from "./types";
import { hienTaiHoanThanhLevels } from "./data/hien-tai-hoan-thanh";
import { hienTaiDonLevels } from "./data/hien-tai-don";
import { hienTaiTiepDienLevels } from "./data/hien-tai-tiep-dien";
import { quaKhuDonLevels } from "./data/qua-khu-don";

// ── Level metadata template (same for all tenses) ────────────────────────────

export function buildLevelMeta(): Omit<Part5Level, "questions">[] {
  return [
    {
      level: 1,
      slug: "l1",
      name: "Nhận diện thì",
      nameEn: "Tense Recognition",
      description: "Đọc câu và xác định đây là thì gì?",
      instruction:
        "Đọc từng câu và chọn tên thì đúng. Chú ý động từ chính và ngữ cảnh câu.",
      difficulty: "easy",
      passThreshold: 80,
    },
    {
      level: 2,
      slug: "l2",
      name: "Dấu hiệu thời gian",
      nameEn: "Time Markers",
      description: "Bấm vào từ/cụm là dấu hiệu nhận biết thì trong câu.",
      instruction:
        "Bấm vào các từ hoặc cụm từ là dấu hiệu thì (time markers). Có thể có nhiều từ trong một câu.",
      difficulty: "easy",
      passThreshold: 80,
    },
    {
      level: 3,
      slug: "l3",
      name: "Kết nối Việt–Anh",
      nameEn: "Vietnamese → English",
      description: "Câu tiếng Việt → chọn dạng động từ đúng bằng tiếng Anh.",
      instruction:
        "Đọc câu tiếng Việt, hiểu ý nghĩa thời gian, rồi chọn dạng động từ tiếng Anh phù hợp.",
      difficulty: "medium",
      passThreshold: 80,
    },
    {
      level: 4,
      slug: "l4",
      name: "Chia động từ",
      nameEn: "Verb Form",
      description: "Chọn dạng động từ đúng để hoàn thành câu (active + passive).",
      instruction:
        "Chọn dạng động từ đúng điền vào chỗ trống. Chú ý cả dạng chủ động và bị động.",
      difficulty: "medium",
      passThreshold: 80,
    },
    {
      level: 5,
      slug: "l5",
      name: "Phân biệt 2 thì",
      nameEn: "Tense Discrimination",
      description: "Phân biệt thì này với thì dễ nhầm lẫn nhất.",
      instruction:
        "Chú ý ngữ cảnh câu để chọn đúng thì. Đây là bước chuẩn bị trước khi làm đề TOEIC thật.",
      difficulty: "hard",
      passThreshold: 80,
    },
    {
      level: 6,
      slug: "l6",
      name: "TOEIC Part 5",
      nameEn: "Exam Style",
      description: "Câu hoàn chỉnh đúng định dạng Part 5 — không có gợi ý tiếng Việt.",
      instruction:
        "Làm bài như trong phòng thi TOEIC thật. Không có bản dịch. Chọn đáp án đúng nhất.",
      difficulty: "hard",
      passThreshold: 80,
    },
  ];
}

// ── 12 Tense configs (questions populated per-tense in data/ files) ───────────

export const TENSES: Part5TenseConfig[] = [
  {
    slug: "hien-tai-don",
    name: "Hiện tại đơn",
    nameEn: "Simple Present",
    formula: "V / V-s/es",
    formulaPassive: "am/is/are + V3",
    description: "Diễn tả thói quen, sự thật hiển nhiên, lịch trình cố định.",
    timeMarkers: [
      "always", "usually", "often", "sometimes", "rarely", "never",
      "every day / week / month / year", "generally", "regularly",
      "on a daily basis", "as a rule", "in general",
    ],
    contrastWith: "hien-tai-tiep-dien",
    importance: 3,
    levels: hienTaiDonLevels,
  },
  {
    slug: "hien-tai-tiep-dien",
    name: "Hiện tại tiếp diễn",
    nameEn: "Present Continuous",
    formula: "am/is/are + V-ing",
    formulaPassive: "am/is/are being + V3",
    description: "Diễn tả hành động đang xảy ra ngay lúc nói hoặc tình huống tạm thời.",
    timeMarkers: [
      "now", "right now", "currently", "at the moment", "at present",
      "these days", "this week / month", "at this time",
    ],
    contrastWith: "hien-tai-don",
    importance: 2,
    levels: hienTaiTiepDienLevels,
  },
  {
    slug: "hien-tai-hoan-thanh",
    name: "Hiện tại hoàn thành",
    nameEn: "Present Perfect",
    formula: "has/have + V3",
    formulaPassive: "has/have been + V3",
    description: "Diễn tả hành động xảy ra trong quá khứ có liên quan đến hiện tại.",
    timeMarkers: [
      "since", "for", "just", "already", "yet", "recently", "lately",
      "ever", "never", "so far", "up to now", "in recent years",
    ],
    contrastWith: "qua-khu-don",
    importance: 3,
    levels: hienTaiHoanThanhLevels,
  },
  {
    slug: "hien-tai-hoan-thanh-tiep-dien",
    name: "Hiện tại hoàn thành tiếp diễn",
    nameEn: "Present Perfect Continuous",
    formula: "has/have been + V-ing",
    description: "Nhấn mạnh khoảng thời gian của hành động từ quá khứ đến hiện tại.",
    timeMarkers: [
      "since", "for", "all day / week / morning",
      "how long", "lately", "recently",
    ],
    contrastWith: "hien-tai-hoan-thanh",
    importance: 1,
    levels: [],
  },
  {
    slug: "qua-khu-don",
    name: "Quá khứ đơn",
    nameEn: "Simple Past",
    formula: "V-ed / V2 (bất quy tắc)",
    formulaPassive: "was/were + V3",
    description: "Diễn tả hành động đã xảy ra và kết thúc tại một thời điểm xác định trong quá khứ.",
    timeMarkers: [
      "yesterday", "last week / month / year", "ago",
      "in [year]", "when", "then", "at that time",
      "in the past", "once", "formerly",
    ],
    contrastWith: "hien-tai-hoan-thanh",
    importance: 3,
    levels: quaKhuDonLevels,
  },
  {
    slug: "qua-khu-tiep-dien",
    name: "Quá khứ tiếp diễn",
    nameEn: "Past Continuous",
    formula: "was/were + V-ing",
    formulaPassive: "was/were being + V3",
    description: "Diễn tả hành động đang diễn ra tại một thời điểm trong quá khứ.",
    timeMarkers: [
      "while", "when", "at that time", "at [time] yesterday",
      "as", "all day yesterday",
    ],
    contrastWith: "qua-khu-don",
    importance: 2,
    levels: [],
  },
  {
    slug: "qua-khu-hoan-thanh",
    name: "Quá khứ hoàn thành",
    nameEn: "Past Perfect",
    formula: "had + V3",
    formulaPassive: "had been + V3",
    description: "Diễn tả hành động xảy ra trước một hành động khác trong quá khứ.",
    timeMarkers: [
      "by the time", "before", "after", "when",
      "already", "just", "never … before", "by [past time]",
    ],
    contrastWith: "qua-khu-don",
    importance: 2,
    levels: [],
  },
  {
    slug: "qua-khu-hoan-thanh-tiep-dien",
    name: "Quá khứ hoàn thành tiếp diễn",
    nameEn: "Past Perfect Continuous",
    formula: "had been + V-ing",
    description: "Nhấn mạnh thời gian kéo dài của hành động trước một mốc quá khứ.",
    timeMarkers: [
      "by the time", "before", "for [duration]", "since",
    ],
    contrastWith: "qua-khu-hoan-thanh",
    importance: 1,
    levels: [],
  },
  {
    slug: "tuong-lai-don",
    name: "Tương lai đơn",
    nameEn: "Simple Future",
    formula: "will + V",
    formulaPassive: "will be + V3",
    description: "Diễn tả dự đoán, quyết định tức thì, lời hứa, hoặc kế hoạch tương lai.",
    timeMarkers: [
      "tomorrow", "next week / month / year", "soon",
      "in the future", "by [future date]", "shortly",
      "in [N] days/weeks/months",
    ],
    contrastWith: "tuong-lai-tiep-dien",
    importance: 3,
    levels: [],
  },
  {
    slug: "tuong-lai-tiep-dien",
    name: "Tương lai tiếp diễn",
    nameEn: "Future Continuous",
    formula: "will be + V-ing",
    description: "Diễn tả hành động đang diễn ra tại một thời điểm trong tương lai.",
    timeMarkers: [
      "at this time tomorrow", "at [time] next week",
      "while", "this time next year",
    ],
    contrastWith: "tuong-lai-don",
    importance: 1,
    levels: [],
  },
  {
    slug: "tuong-lai-hoan-thanh",
    name: "Tương lai hoàn thành",
    nameEn: "Future Perfect",
    formula: "will have + V3",
    formulaPassive: "will have been + V3",
    description: "Diễn tả hành động sẽ hoàn thành trước một mốc thời gian tương lai.",
    timeMarkers: [
      "by [future time]", "by then", "before", "by the time",
      "by the end of",
    ],
    contrastWith: "tuong-lai-don",
    importance: 2,
    levels: [],
  },
  {
    slug: "tuong-lai-hoan-thanh-tiep-dien",
    name: "Tương lai hoàn thành tiếp diễn",
    nameEn: "Future Perfect Continuous",
    formula: "will have been + V-ing",
    description: "Nhấn mạnh thời gian kéo dài của hành động tính đến một mốc tương lai.",
    timeMarkers: [
      "by [future time]", "for [duration]", "by the time",
    ],
    contrastWith: "tuong-lai-hoan-thanh",
    importance: 1,
    levels: [],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getTenseConfig(slug: string): Part5TenseConfig | undefined {
  return TENSES.find((t) => t.slug === slug);
}

/** Returns the unlock requirements for a given level slug */
export function getLevelUnlockReq(levelSlug: LevelSlug): LevelSlug | null {
  // L1, L2 always open
  if (levelSlug === "l1" || levelSlug === "l2") return null;
  // L3, L4 unlock when L2 passed
  if (levelSlug === "l3" || levelSlug === "l4") return "l2";
  // L5, L6 unlock when L4 passed
  return "l4";
}

/** Given a map of best scores by levelSlug, returns whether a level is unlocked */
export function isLevelUnlocked(
  levelSlug: LevelSlug,
  best: Record<string, { score: number; passed: boolean }>,
  isTestUser: boolean,
): boolean {
  if (isTestUser) return true;
  const req = getLevelUnlockReq(levelSlug);
  if (!req) return true;
  return best[req]?.passed === true;
}
