import type {
  ConnGroupConfig,
  ConnLevel,
  LevelSlug,
  BestScore,
} from "./types";
import { tuongPhanLevels } from "./data/tuong-phan";

// ── Level metadata template (giống nhau cho mọi nhóm) ────────────────────────
//
// L3 và L4 là cặp đối xứng — đây là điểm cốt lõi của khoá này:
//   L3: 4 đáp án CÙNG NGHĨA, KHÁC LOẠI  → chỉ cần nhìn sau chỗ trống, không cần hiểu nghĩa
//   L4: 4 đáp án CÙNG LOẠI, KHÁC NGHĨA  → buộc phải hiểu logic câu

export function buildLevelMeta(): Omit<ConnLevel, "questions">[] {
  return [
    {
      level: 1,
      slug: "l1",
      name: "Phân loại ngữ pháp",
      nameEn: "Grammar Category",
      description: "Từ nối này đi với mệnh đề, danh từ, hay nối 2 câu?",
      instruction:
        "Bấm chọn một từ nối, rồi bấm vào cột đúng. Đây là kỹ năng ăn điểm số 1 ở Part 5: nhìn sau chỗ trống là mệnh đề hay danh từ để loại đáp án.",
      difficulty: "easy",
      passThreshold: 80,
    },
    {
      level: 2,
      slug: "l2",
      name: "Nghĩa & sắc thái",
      nameEn: "Meaning & Nuance",
      description: "Ghép từ nối với đúng nghĩa và sắc thái tiếng Việt.",
      instruction:
        "Bấm chọn một từ nối, rồi bấm vào cột nghĩa đúng. Các từ trong cùng nhóm gần nghĩa nhau nhưng khác sắc thái và cách dùng.",
      difficulty: "easy",
      passThreshold: 80,
    },
    {
      level: 3,
      slug: "l3",
      name: "Bẫy cấu trúc",
      nameEn: "Structure Trap",
      description: "4 đáp án cùng nghĩa, khác loại — chỉ cần nhìn sau chỗ trống.",
      instruction:
        "Cả 4 đáp án đều cùng nghĩa. Hãy nhìn PHẦN SAU chỗ trống: nếu là mệnh đề (S + V) → chọn liên từ; nếu là danh từ / V-ing → chọn giới từ; nếu là câu độc lập → chọn trạng từ liên kết.",
      difficulty: "medium",
      passThreshold: 80,
    },
    {
      level: 4,
      slug: "l4",
      name: "Bẫy ngữ nghĩa",
      nameEn: "Meaning Trap",
      description: "4 đáp án cùng loại, khác nghĩa — buộc phải hiểu logic câu.",
      instruction:
        "Cả 4 đáp án đều đúng ngữ pháp. Hãy đọc kỹ quan hệ logic giữa hai vế: tương phản, nguyên nhân, kết quả, bổ sung, ví dụ hay điều kiện?",
      difficulty: "medium",
      passThreshold: 80,
    },
    {
      level: 5,
      slug: "l5",
      name: "Part 6 — Đoạn văn",
      nameEn: "Text Completion",
      description: "Điền từ nối vào đoạn văn — phải đọc câu trước và câu sau.",
      instruction:
        "Đọc cả đoạn văn. Từ nối đúng phụ thuộc vào quan hệ logic giữa câu TRƯỚC và câu SAU chỗ trống — không thể đoán chỉ từ một câu.",
      difficulty: "hard",
      passThreshold: 80,
    },
    {
      level: 6,
      slug: "l6",
      name: "TOEIC Part 5 + 6",
      nameEn: "Exam Style",
      description: "Trộn câu đơn và đoạn văn — không có bản dịch.",
      instruction:
        "Làm bài như trong phòng thi TOEIC thật. Không có bản dịch. Chọn đáp án đúng nhất.",
      difficulty: "hard",
      passThreshold: 80,
    },
  ];
}

// ── 10 nhóm nghĩa (questions được nạp dần theo từng phase) ───────────────────

export const CONNECTOR_GROUPS: ConnGroupConfig[] = [
  {
    slug: "tuong-phan",
    name: "Tương phản & Nhượng bộ",
    nameEn: "Contrast & Concession",
    description:
      "Diễn tả sự đối lập giữa hai ý. Chứa cặp bẫy kinh điển nhất của TOEIC: although / despite / however.",
    importance: 3,
    connectors: [
      { word: "although", kind: "conj", vi: "mặc dù", note: "Theo sau là mệnh đề đầy đủ." },
      { word: "even though", kind: "conj", vi: "mặc dù (nhấn mạnh hơn)" },
      { word: "though", kind: "conj", vi: "mặc dù", note: "Có thể đứng cuối câu như trạng từ." },
      { word: "while", kind: "conj", vi: "trong khi (ngược lại)", note: "Cũng có nghĩa thời gian." },
      { word: "whereas", kind: "conj", vi: "trong khi ngược lại", note: "Chỉ dùng khi đối lập trực tiếp 2 vế." },
      { word: "despite", kind: "prep", vi: "mặc dù", note: "KHÔNG có 'of'. Theo sau là danh từ / V-ing." },
      { word: "in spite of", kind: "prep", vi: "mặc dù", note: "Đồng nghĩa 'despite' nhưng có 'of'." },
      { word: "notwithstanding", kind: "prep", vi: "bất chấp", note: "Trang trọng." },
      { word: "however", kind: "adv", vi: "tuy nhiên", note: "Nối 2 câu; cần dấu chấm hoặc chấm phẩy trước." },
      { word: "nevertheless", kind: "adv", vi: "tuy vậy" },
      { word: "nonetheless", kind: "adv", vi: "dù vậy", note: "Đồng nghĩa 'nevertheless'." },
      { word: "on the other hand", kind: "adv", vi: "mặt khác" },
      { word: "in contrast", kind: "adv", vi: "trái lại" },
      { word: "conversely", kind: "adv", vi: "ngược lại" },
    ],
    levels: tuongPhanLevels,
  },
  {
    slug: "nguyen-nhan",
    name: "Nguyên nhân",
    nameEn: "Cause & Reason",
    description:
      "Diễn tả lý do. Bẫy chính: because (+ mệnh đề) vs because of / due to / owing to (+ danh từ).",
    importance: 3,
    connectors: [
      { word: "because", kind: "conj", vi: "bởi vì", note: "Theo sau là mệnh đề." },
      { word: "since", kind: "conj", vi: "vì", note: "Cũng có nghĩa 'kể từ khi' (thời gian)." },
      { word: "as", kind: "conj", vi: "vì", note: "Nhiều nghĩa — cần đọc ngữ cảnh." },
      { word: "now that", kind: "conj", vi: "giờ đây khi mà" },
      { word: "given that", kind: "conj", vi: "xét thấy rằng" },
      { word: "seeing that", kind: "conj", vi: "vì rằng", note: "Thân mật, ít trang trọng." },
      { word: "because of", kind: "prep", vi: "vì, do", note: "Theo sau là danh từ." },
      { word: "due to", kind: "prep", vi: "do", note: "Thường theo sau động từ 'be'." },
      { word: "owing to", kind: "prep", vi: "do bởi", note: "Trang trọng, đồng nghĩa 'due to'." },
      { word: "on account of", kind: "prep", vi: "vì lý do" },
      { word: "thanks to", kind: "prep", vi: "nhờ có", note: "Mang nghĩa TÍCH CỰC." },
      { word: "as a result of", kind: "prep", vi: "do kết quả của" },
      { word: "in light of", kind: "prep", vi: "xét theo, trước tình hình" },
      { word: "in view of", kind: "prep", vi: "xét về, do" },
    ],
    levels: [],
  },
  {
    slug: "ket-qua",
    name: "Kết quả",
    nameEn: "Result & Consequence",
    description:
      "Diễn tả hệ quả logic. Hầu hết là trạng từ liên kết — cần dấu chấm/chấm phẩy trước.",
    importance: 3,
    connectors: [
      { word: "so", kind: "conj", vi: "nên", note: "Liên từ kết hợp, đứng giữa 2 mệnh đề." },
      { word: "so ... that", kind: "conj", vi: "quá ... đến nỗi", note: "so + tính từ + that + mệnh đề." },
      { word: "such ... that", kind: "conj", vi: "quá ... đến nỗi", note: "such + (a) + danh từ + that." },
      { word: "therefore", kind: "adv", vi: "do đó" },
      { word: "thus", kind: "adv", vi: "vì thế", note: "Trang trọng." },
      { word: "hence", kind: "adv", vi: "do đó", note: "Trang trọng." },
      { word: "consequently", kind: "adv", vi: "kết quả là" },
      { word: "accordingly", kind: "adv", vi: "theo đó, vì vậy" },
      { word: "as a result", kind: "adv", vi: "kết quả là", note: "Không có 'of' — khác 'as a result of'." },
      { word: "otherwise", kind: "adv", vi: "nếu không thì", note: "Hệ quả nếu điều kiện không xảy ra." },
    ],
    levels: [],
  },
  {
    slug: "thoi-gian",
    name: "Thời gian & Trình tự",
    nameEn: "Time & Sequence",
    description:
      "Diễn tả thời điểm và thứ tự. Bẫy chính: while (+ mệnh đề) vs during (+ danh từ).",
    importance: 3,
    connectors: [
      { word: "when", kind: "conj", vi: "khi" },
      { word: "while", kind: "conj", vi: "trong khi", note: "Theo sau là mệnh đề — khác 'during'." },
      { word: "before", kind: "conj", vi: "trước khi", note: "Vừa là liên từ vừa là giới từ." },
      { word: "after", kind: "conj", vi: "sau khi", note: "Vừa là liên từ vừa là giới từ." },
      { word: "until", kind: "conj", vi: "cho đến khi", note: "Vừa là liên từ vừa là giới từ." },
      { word: "as soon as", kind: "conj", vi: "ngay khi" },
      { word: "once", kind: "conj", vi: "một khi", note: "Cũng là trạng từ: 'đã từng'." },
      { word: "by the time", kind: "conj", vi: "vào lúc mà" },
      { word: "during", kind: "prep", vi: "trong suốt", note: "Theo sau là danh từ — khác 'while'." },
      { word: "throughout", kind: "prep", vi: "xuyên suốt" },
      { word: "prior to", kind: "prep", vi: "trước", note: "Trang trọng, đồng nghĩa 'before'." },
      { word: "following", kind: "prep", vi: "sau", note: "Trang trọng, đồng nghĩa 'after'." },
      { word: "upon / on", kind: "prep", vi: "ngay khi", note: "upon + V-ing = ngay khi làm gì." },
      { word: "meanwhile", kind: "adv", vi: "trong khi đó" },
      { word: "in the meantime", kind: "adv", vi: "trong lúc chờ đợi" },
      { word: "subsequently", kind: "adv", vi: "sau đó" },
      { word: "afterward", kind: "adv", vi: "sau đó" },
    ],
    levels: [],
  },
  {
    slug: "bo-sung",
    name: "Bổ sung",
    nameEn: "Addition",
    description:
      "Thêm thông tin cùng chiều. Bẫy chính: in addition (trạng từ) vs in addition to (giới từ).",
    importance: 2,
    connectors: [
      { word: "in addition to", kind: "prep", vi: "ngoài ra còn", note: "CÓ 'to' → theo sau là danh từ." },
      { word: "besides", kind: "prep", vi: "ngoài ra", note: "Vừa là giới từ vừa là trạng từ — bẫy khó." },
      { word: "apart from", kind: "prep", vi: "ngoài ... ra" },
      { word: "aside from", kind: "prep", vi: "ngoài ... ra" },
      { word: "along with", kind: "prep", vi: "cùng với" },
      { word: "as well as", kind: "prep", vi: "cũng như" },
      { word: "moreover", kind: "adv", vi: "hơn nữa" },
      { word: "furthermore", kind: "adv", vi: "hơn thế nữa" },
      { word: "in addition", kind: "adv", vi: "thêm vào đó", note: "KHÔNG có 'to' → nối 2 câu." },
      { word: "additionally", kind: "adv", vi: "ngoài ra" },
      { word: "likewise", kind: "adv", vi: "tương tự" },
      { word: "similarly", kind: "adv", vi: "tương tự như vậy" },
    ],
    levels: [],
  },
  {
    slug: "dieu-kien",
    name: "Điều kiện",
    nameEn: "Condition",
    description:
      "Diễn tả điều kiện. Lưu ý: unless = if ... not (không dùng 'not' hai lần).",
    importance: 2,
    connectors: [
      { word: "if", kind: "conj", vi: "nếu" },
      { word: "unless", kind: "conj", vi: "trừ khi", note: "= if ... not. KHÔNG dùng 'not' sau unless." },
      { word: "provided that", kind: "conj", vi: "miễn là" },
      { word: "as long as", kind: "conj", vi: "miễn là, chừng nào" },
      { word: "in case", kind: "conj", vi: "phòng khi", note: "Theo sau là mệnh đề." },
      { word: "on condition that", kind: "conj", vi: "với điều kiện là" },
      { word: "in case of", kind: "prep", vi: "trong trường hợp", note: "CÓ 'of' → theo sau là danh từ." },
      { word: "in the event of", kind: "prep", vi: "trong trường hợp" },
      { word: "without", kind: "prep", vi: "nếu không có", note: "Theo sau là danh từ / V-ing." },
      { word: "otherwise", kind: "adv", vi: "nếu không thì" },
      { word: "in that case", kind: "adv", vi: "trong trường hợp đó" },
    ],
    levels: [],
  },
  {
    slug: "muc-dich",
    name: "Mục đích",
    nameEn: "Purpose",
    description:
      "Diễn tả mục đích. Bẫy chính: so that (+ mệnh đề) vs in order to / so as to (+ động từ nguyên mẫu).",
    importance: 2,
    connectors: [
      { word: "so that", kind: "conj", vi: "để mà", note: "Theo sau là mệnh đề, thường có can/will/could." },
      { word: "in order that", kind: "conj", vi: "để mà", note: "Trang trọng hơn 'so that'." },
      { word: "in order to", kind: "prep", vi: "để", note: "Theo sau là ĐỘNG TỪ NGUYÊN MẪU." },
      { word: "so as to", kind: "prep", vi: "để", note: "Theo sau là động từ nguyên mẫu." },
      { word: "with a view to", kind: "prep", vi: "nhằm mục đích", note: "Theo sau là V-ing." },
      { word: "for the purpose of", kind: "prep", vi: "nhằm mục đích", note: "Theo sau là danh từ / V-ing." },
    ],
    levels: [],
  },
  {
    slug: "vi-du",
    name: "Ví dụ & Giải thích",
    nameEn: "Example & Clarification",
    description:
      "Nêu ví dụ hoặc diễn giải lại. Bẫy chính: such as (giới từ) vs for example (trạng từ).",
    importance: 2,
    connectors: [
      { word: "such as", kind: "prep", vi: "chẳng hạn như", note: "Theo sau là danh từ, KHÔNG có dấu phẩy trước ví dụ." },
      { word: "like", kind: "prep", vi: "như là" },
      { word: "including", kind: "prep", vi: "bao gồm" },
      { word: "for example", kind: "adv", vi: "ví dụ", note: "Nối 2 câu hoặc chèn giữa câu với dấu phẩy." },
      { word: "for instance", kind: "adv", vi: "chẳng hạn", note: "Đồng nghĩa 'for example'." },
      { word: "namely", kind: "adv", vi: "cụ thể là", note: "Liệt kê ĐẦY ĐỦ — khác 'such as' (liệt kê một phần)." },
      { word: "specifically", kind: "adv", vi: "cụ thể" },
      { word: "in particular", kind: "adv", vi: "đặc biệt là" },
      { word: "that is", kind: "adv", vi: "tức là" },
      { word: "in other words", kind: "adv", vi: "nói cách khác" },
    ],
    levels: [],
  },
  {
    slug: "thay-the-loai-tru",
    name: "Thay thế, Loại trừ & Chủ đề",
    nameEn: "Alternative, Exception & Reference",
    description:
      "Thay vì, ngoại trừ, bất kể, và giới thiệu chủ đề. Bẫy chính: instead (trạng từ) vs instead of (giới từ).",
    importance: 2,
    connectors: [
      { word: "instead of", kind: "prep", vi: "thay vì", note: "CÓ 'of' → theo sau là danh từ / V-ing." },
      { word: "rather than", kind: "prep", vi: "thay vì" },
      { word: "in place of", kind: "prep", vi: "thay cho" },
      { word: "except", kind: "prep", vi: "ngoại trừ", note: "'except that' lại là liên từ + mệnh đề." },
      { word: "except for", kind: "prep", vi: "ngoại trừ" },
      { word: "other than", kind: "prep", vi: "ngoài ra" },
      { word: "regardless of", kind: "prep", vi: "bất kể", note: "CÓ 'of' → theo sau là danh từ." },
      { word: "according to", kind: "prep", vi: "theo như" },
      { word: "as for", kind: "prep", vi: "còn về", note: "Giới thiệu chủ đề mới." },
      { word: "regarding", kind: "prep", vi: "về việc" },
      { word: "concerning", kind: "prep", vi: "liên quan đến" },
      { word: "instead", kind: "adv", vi: "thay vào đó", note: "KHÔNG có 'of' → nối 2 câu." },
      { word: "alternatively", kind: "adv", vi: "hoặc là, cách khác" },
      { word: "by the way", kind: "adv", vi: "nhân tiện", note: "Chuyển sang chủ đề khác." },
    ],
    levels: [],
  },
  {
    slug: "nhan-manh",
    name: "Nhấn mạnh",
    nameEn: "Emphasis",
    description: "Nhấn mạnh, khẳng định hoặc chốt lại ý đã nêu.",
    importance: 1,
    connectors: [
      { word: "indeed", kind: "adv", vi: "quả thực", note: "Củng cố ý vừa nói." },
      { word: "in fact", kind: "adv", vi: "thực ra" },
      { word: "as a matter of fact", kind: "adv", vi: "thật ra là", note: "Đồng nghĩa 'in fact'." },
      { word: "after all", kind: "adv", vi: "suy cho cùng", note: "Đưa ra lý do củng cố ở cuối." },
      { word: "above all", kind: "adv", vi: "trên hết" },
      { word: "certainly", kind: "adv", vi: "chắc chắn" },
      { word: "in short", kind: "adv", vi: "nói ngắn gọn" },
      { word: "overall", kind: "adv", vi: "nhìn chung" },
    ],
    levels: [],
  },
];

// ── Lookup helpers ───────────────────────────────────────────────────────────

export function getGroupConfig(slug: string): ConnGroupConfig | undefined {
  return CONNECTOR_GROUPS.find((g) => g.slug === slug);
}

/** Trả về level cần pass để mở khoá level này (null = luôn mở) */
export function getLevelUnlockReq(levelSlug: LevelSlug): LevelSlug | null {
  if (levelSlug === "l1" || levelSlug === "l2") return null;
  if (levelSlug === "l3" || levelSlug === "l4") return "l2";
  return "l4";
}

export function isLevelUnlocked(
  levelSlug: LevelSlug,
  best: Record<string, BestScore>,
  isTestUser: boolean,
): boolean {
  if (isTestUser) return true;
  const req = getLevelUnlockReq(levelSlug);
  if (!req) return true;
  return best[req]?.passed === true;
}
