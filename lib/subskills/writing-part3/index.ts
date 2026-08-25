// ─────────────────────────────────────
// Writing Part 3 — Question 8, Write an Opinion Essay
//
// Thiết kế đầy đủ: docs/writing-part3-rnd.md
// Phase 1–3 mở Tầng 1–12. Tầng 0 và 13 đã khai báo sẵn
// metadata nhưng `active: false` cho tới khi có data.
//
// Data JSON viết thẳng ở dạng chuẩn hoá (không cần normalizer như Part 1).
// ─────────────────────────────────────

export type P3Difficulty = "easy" | "medium" | "hard";

// ─────────────────────────────────────
// Dạng đề — sáu dạng rút từ đề thi thật, không phải bốn dạng của sách
// ─────────────────────────────────────

export type P3EssayType =
  | "agree_disagree"
  | "choice_2"
  | "choice_3"
  | "pros_cons"
  | "open_q"
  | "policy";

export const P3_ESSAY_TYPES: { id: P3EssayType; labelVi: string; label: string; skeleton: string; trap: string }[] = [
  {
    id: "agree_disagree",
    labelVi: "Đồng ý / phản đối",
    label: "Agree or Disagree",
    skeleton: "Chọn dứt khoát một phe → 2–3 lý do → mỗi lý do một ví dụ",
    trap: "Đứng giữa hai phe cho an toàn, rồi cả bài không có luận điểm nào",
  },
  {
    id: "choice_2",
    labelVi: "Chọn 1 trong 2",
    label: "Two-way Choice",
    skeleton: "Chọn A → lý do chọn A → một câu nhượng bộ nói vì sao B kém hơn",
    trap: "Tả đều cả A lẫn B như bài so sánh, quên mất phải chọn",
  },
  {
    id: "choice_3",
    labelVi: "Chọn 1 trong 3",
    label: "Three-way Choice",
    skeleton: "Chọn 1 → loại bỏ 2 cái kia có lý do → chống đỡ lựa chọn của mình",
    trap: "Quên hẳn hai lựa chọn còn lại, giám khảo đọc thành «không đọc kỹ đề»",
  },
  {
    id: "pros_cons",
    labelVi: "Ưu & nhược",
    label: "Advantages and Disadvantages",
    skeleton: "Đoạn ưu → đoạn nhược → kết bài mới là chỗ ngả về một bên",
    trap: "Biến thành bài đồng ý/phản đối ngay từ mở bài, mất luôn nửa nội dung đề yêu cầu",
  },
  {
    id: "open_q",
    labelVi: "Câu hỏi mở",
    label: "Open Question",
    skeleton: "Tự đặt ra 2–3 hạng mục rồi chọn hoặc xếp hạng chúng",
    trap: "Đề không cho sẵn lựa chọn nên đứng hình mất mấy phút đầu, hết giờ trước khi đủ 300 từ",
  },
  {
    id: "policy",
    labelVi: "Nên hay không nên",
    label: "Should / Should Not",
    skeleton: "Nên hoặc không nên → lập luận theo từng bên liên quan",
    trap: "Chỉ nói cảm nghĩ cá nhân, không nhìn ra các bên chịu tác động nên ý rất mỏng",
  },
];

export function essayTypeLabel(id: P3EssayType): string {
  return P3_ESSAY_TYPES.find((t) => t.id === id)?.labelVi ?? id;
}

// ─────────────────────────────────────
// Khối văn bản hiển thị phía trên đề
// ─────────────────────────────────────

/**
 * Stimulus của Part 3 — khác Part 2 ở chỗ không có header e-mail.
 * `kind` chỉ đổi nhãn hiển thị, không đổi cách chấm.
 */
export type PassageBlock = {
  /** "prompt" = đề bài | "essay" = bài luận | "paragraph" = một đoạn | "draft" = bài nháp của học viên */
  kind?: "prompt" | "essay" | "paragraph" | "draft";
  title?: string;
  body: string[];
  /** Directions gốc của ETS, hiện trong khung vàng */
  directions?: string;
};

// ─────────────────────────────────────
// Các loại bài tập — 13 loại, `timed_write` là loại duy nhất phải viết renderer mới
// ─────────────────────────────────────

/** Trắc nghiệm trên đề hoặc trên đoạn văn (một hoặc nhiều đáp án) */
export type P3McqEx = {
  type: "mcq";
  id: string;
  /** khoá tra trong P3TestData.passages — nhiều câu hỏi dùng chung một đoạn */
  passageRef?: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  multi?: boolean;
  explanation: string;
};

/** Gắn nhãn chức năng cho từng câu (thesis / topic sentence / ví dụ / …) */
export type P3LabelingEx = {
  type: "labeling";
  id: string;
  passageRef?: string;
  intro?: string;
  labels: string[];
  sentences: { text: string; label: string }[];
  explanation: string;
};

/** Dựng lại dàn ý hoặc chuỗi lý do từ các mảnh xáo trộn */
export type P3OrderingEx = {
  type: "ordering";
  id: string;
  prompt: string;
  items: string[]; // theo đúng thứ tự đúng
  explanation: string;
};

/** Ghép luận điểm với ví dụ chống đỡ nó */
export type P3MatchingEx = {
  type: "matching";
  id: string;
  prompt: string;
  pairs: { left: string; right: string }[];
  explanation: string;
};

/** Gõ từ vào chỗ trống trong khuôn câu luận điểm */
export type P3TypeBlankEx = {
  type: "type_blank";
  id: string;
  prompt?: string;
  sentence: string; // dùng ___ cho mỗi chỗ trống
  answers: string[];
  /** biến thể chấp nhận được, chỉ số khớp với answers */
  accepted?: string[][];
  vi?: string;
  explanation: string;
};

/** Bấm vào dòng hỏng trong một đoạn văn */
export type P3ErrorSpotEx = {
  type: "error_spot";
  id: string;
  intro?: string;
  directions?: string;
  lines: string[];
  errorIndex: number;
  errorLabel: string;
  fix: string;
  explanation: string;
};

/** Đối chiếu bài nháp với đề: đề giao mấy việc, bài làm được mấy việc */
export type P3MissionAuditEx = {
  type: "mission_audit";
  id: string;
  directions: string;
  draft: string[];
  missions: { text: string; done: boolean }[];
  explanation: string;
};

/** Điền từ nối vào chỗ trống bằng ngân hàng từ cho sẵn */
export type P3WordBankEx = {
  type: "word_bank";
  id: string;
  prompt?: string;
  sentence: string; // dùng ___ cho mỗi chỗ trống
  bank: string[];
  answers: string[];
  explanation: string;
};

/** Dịch một câu ví dụ cụ thể sang tiếng Anh */
export type P3TranslateEx = {
  type: "translate";
  id: string;
  vi: string;
  answer: string;
  accepted?: string[];
  /** Cụm gợi ý theo đúng thứ tự — giữ đáp án trong tầm so khớp được */
  hintWords?: string[];
  explanation: string;
};

/** Sắp xếp từ xáo trộn thành câu có cấu trúc nâng cao */
export type P3WordOrderEx = {
  type: "word_order";
  id: string;
  tokens: string[];
  answer: string;
  accepted?: string[];
  vi?: string;
  explanation: string;
};

/** Đặt hai bản cạnh nhau: bản nào tốt hơn, và vì sao */
export type P3CompareEx = {
  type: "compare";
  id: string;
  directions: string;
  versionA: string[];
  versionB: string[];
  better: "A" | "B";
  reasons: { id: string; text: string }[];
  correctReason: string;
  explanation: string;
};

/** Bỏ bớt câu thừa khỏi một đoạn văn (chọn nhiều dòng) */
export type P3TrimEx = {
  type: "trim";
  id: string;
  directions: string;
  intro?: string;
  lines: string[];
  /** chỉ số các dòng nên BỎ */
  cutIndexes: number[];
  /** lý do bỏ / lý do giữ, key = chỉ số dòng */
  reasons: Record<string, string>;
  explanation: string;
};

/**
 * Tầng 9 — viết một đoạn dưới đồng hồ.
 *
 * Chấm phần KHÁCH QUAN duy nhất chấm được bằng máy: có đủ số từ trước khi
 * hết giờ hay không. Checklist bên dưới là để tự soi, không tính vào điểm —
 * chất lượng câu chữ phải đợi Tầng 13 và người chấm thật.
 */
export type P3TimedWriteEx = {
  type: "timed_write";
  id: string;
  prompt: string;
  /** Dàn ý gợi ý cho đoạn, hiện trước khi bấm giờ */
  scaffold?: string[];
  minWords: number;
  seconds: number;
  /** Mục tự soi sau khi nộp — không tính điểm */
  checks: string[];
  explanation: string;
};

export type P3Exercise =
  | P3McqEx
  | P3LabelingEx
  | P3OrderingEx
  | P3MatchingEx
  | P3TypeBlankEx
  | P3ErrorSpotEx
  | P3MissionAuditEx
  | P3WordBankEx
  | P3TranslateEx
  | P3CompareEx
  | P3TrimEx
  | P3TimedWriteEx
  | P3WordOrderEx;

export type P3Level = { difficulty: P3Difficulty; exercises: P3Exercise[] };

export type P3TestData = {
  skillId: string;
  testNum: number;
  /** Ngân hàng đoạn văn dùng chung cho cả bộ test, tra bằng exercise.passageRef */
  passages: Record<string, PassageBlock>;
  levels: P3Level[];
};

// ─────────────────────────────────────
// Band điểm
// ─────────────────────────────────────

/**
 * Band của Part 3 DỊCH LÊN so với Part 2 — đây là chủ ý, không phải sơ suất.
 *
 * Score User Guide của ETS mô tả năng lực theo bậc thang: người 140–160 "yếu
 * đúng ở bài luận dài" còn Q1–Q7 thì ổn, người 50–80 "chưa viết nổi bài luận
 * dài". Nghĩa là bài luận ngăn cách 140–160 với 170–200, và KHÔNG phải đòn bẩy
 * cho người dưới 90 — nhóm đó luyện Part 1/Part 2 lên điểm nhanh hơn.
 *
 * Bê nguyên band của Part 2 sang đây là hứa sai với người 70 điểm.
 */
export type P3Band = "A" | "B" | "C" | "D";

export const P3_BANDS: { id: P3Band; range: string; title: string; blurb: string; goal: string }[] = [
  {
    id: "A",
    range: "≤ 90",
    title: "Chưa tới lượt",
    blurb: "Nói được ý kiến ở mức câu, chưa dựng được bài.",
    goal: "Làm Part 2 trước sẽ lên điểm nhanh hơn",
  },
  {
    id: "B",
    range: "100–130",
    title: "Có ý, chưa chống đỡ",
    blurb: "Viết được nhưng hay lệch việc đề giao, nêu khái quát rồi bỏ lửng.",
    goal: "Thoát mốc 1–2, chạm mốc 3",
  },
  {
    id: "C",
    range: "140–160",
    title: "Đủ ý, thiếu độ sâu",
    blurb: "Bám đề và có ý, nhưng dẫn chứng chung chung và nối ý mờ.",
    goal: "Mốc 3 → 4",
  },
  {
    id: "D",
    range: "170+",
    title: "Đủ chuẩn, thiếu đa dạng",
    blurb: "Bài đúng và sạch, nhưng câu đơn điệu và còn lặp ý.",
    goal: "Mốc 4 → 5",
  },
];

// ─────────────────────────────────────
// Gợi ý band
// ─────────────────────────────────────

/**
 * Tín hiệu để đoán band, xếp theo độ tin cậy giảm dần.
 *
 * BẪY đã tránh ở đây: KHÔNG dùng trường `SkillSubmission.band` của một bài Q8.
 * `estimateBand()` quy đổi điểm rubric của RIÊNG câu đó ra thang 200
 * (`rubric ÷ 5 × 200`), nên bài Q8 được 2 điểm ra 80 — nếu lấy con số đó chọn
 * band thì học viên bị đẩy vào "≤90 · chưa tới lượt", ngược đúng thứ ETS nói.
 * Điểm rubric của một câu KHÁC điểm nền Writing tổng.
 *
 * Với bài Q8 thì đọc điểm rubric thô; chỉ khi chưa có bài Q8 nào mới dùng
 * `band` của Q1-5 / Q6-7, vì lúc đó nó đúng là proxy cho nền chung.
 */
export type P3BandSignal =
  | { source: "q8"; rubric: number }
  | { source: "writing-other"; band: number }
  | { source: "none" };

export type P3BandSuggestion = { band: P3Band; why: string };

export function suggestBandP3(signal: P3BandSignal): P3BandSuggestion {
  if (signal.source === "q8") {
    if (signal.rubric >= 4) {
      return { band: "D", why: `Bài luận gần nhất được ${signal.rubric}/5 — việc còn lại là độ đa dạng.` };
    }
    if (signal.rubric === 3) {
      return { band: "C", why: "Bài luận gần nhất được 3/5 — đã bám đề, cần thêm độ sâu và mạch nối." };
    }
    return { band: "B", why: `Bài luận gần nhất được ${signal.rubric}/5 — cần chống đỡ ý kiến trước đã.` };
  }

  if (signal.source === "writing-other") {
    // Band A không bao giờ được tự gợi ý — suy ra "bạn quá yếu" từ bài Q1-7 là
    // suy diễn quá đà, và vô ích vì Tầng 0 dù sao cũng luôn mở.
    if (signal.band >= 170) {
      return { band: "D", why: `Điểm Writing ước lượng ${signal.band} — vào thẳng nhóm tinh chỉnh.` };
    }
    if (signal.band >= 140) {
      return { band: "C", why: `Điểm Writing ước lượng ${signal.band} — bài luận là thứ đang giữ bạn lại.` };
    }
    return { band: "B", why: `Điểm Writing ước lượng ${signal.band} — bắt đầu từ khâu chống đỡ ý kiến.` };
  }

  return { band: "B", why: "Chưa có bài Writing nào được chấm — mở sẵn band phổ biến nhất." };
}

// ─────────────────────────────────────
// Skill metadata — 14 tầng
// ─────────────────────────────────────

export type P3SkillMeta = {
  id: string;
  labelVi: string;
  label: string;
  description: string;
  dbPartPrefix: string;
  active: boolean;
  band: P3Band;
  /** Trục trong thang chấm mà tầng này nhắm vào — hiện ở trang danh sách */
  axis: string;
  /** Tầng có route riêng (không đi qua [skillId] + không có bộ test tự chấm) */
  href?: string;
};

/**
 * KHÁC PART 2: ở đây `id` tangN LUÔN khớp với số hiển thị "Tầng N".
 * Part 2 bị lệch vì đổi thứ tự sau khi đã có dữ liệu học viên; Part 3 dựng mới
 * nên giữ được sự trùng khớp — đừng đổi thứ tự tầng sau khi phát hành, `id` nằm
 * trong `dbPartPrefix` của mọi lượt làm bài đã lưu.
 */
export const WRITING_P3_SKILLS: P3SkillMeta[] = [
  {
    id: "tang0",
    labelVi: "Tầng 0: Câu ý kiến",
    label: "Opinion Sentences",
    description: "Dựng câu nêu quan điểm và câu lý do. Dành cho người chưa viết được câu nào.",
    dbPartPrefix: "wp3-tang0",
    active: false,
    band: "A",
    axis: "Dựng câu",
  },
  {
    id: "tang1",
    labelVi: "Tầng 1: Giải mã đề",
    label: "Reading the Prompt",
    description: "Nhận ra đề thuộc dạng nào trong 6 dạng, rồi đếm đủ số việc đề giao. Lệch việc là rơi xuống mốc 1–2 dù tiếng Anh khá.",
    dbPartPrefix: "wp3-tang1",
    active: true,
    band: "B",
    axis: "Trả lời đúng việc",
  },
  {
    id: "tang2",
    labelVi: "Tầng 2: Chọn phe & luận điểm",
    label: "Taking a Position",
    description: "Viết câu luận điểm đúng khuôn của từng dạng đề. Đứng giữa hai phe là mất luôn cả bài.",
    dbPartPrefix: "wp3-tang2",
    active: true,
    band: "B",
    axis: "Trả lời đúng việc",
  },
  {
    id: "tang3",
    labelVi: "Tầng 3: Chuỗi lý do – ví dụ",
    label: "Claim, Reason, Example",
    description: "Luận điểm → vì sao → ví dụ cụ thể. Mốc 2 chết vì nêu khái quát rồi bỏ lửng, không phải vì thiếu ý.",
    dbPartPrefix: "wp3-tang3",
    active: true,
    band: "B",
    axis: "Phát triển & ví dụ",
  },
  {
    id: "tang4",
    labelVi: "Tầng 4: Khung bốn đoạn",
    label: "Essay Skeleton",
    description: "Gắn chức năng cho từng câu trong bài mẫu, rồi tự dựng lại dàn ý từ các mảnh rời.",
    dbPartPrefix: "wp3-tang4",
    active: true,
    band: "B",
    axis: "Mạch bài",
  },
  {
    id: "tang5",
    labelVi: "Tầng 5: Từ chung chung sang cụ thể",
    label: "Getting Specific",
    description: "Nâng ví dụ mờ thành ví dụ có tình huống, con số, trải nghiệm.",
    dbPartPrefix: "wp3-tang5",
    active: true,
    band: "C",
    axis: "Phát triển & ví dụ",
  },
  {
    id: "tang6",
    labelVi: "Tầng 6: Mạch nối",
    label: "Cohesion",
    description: "Chọn từ nối đúng quan hệ, nối ý giữa các đoạn.",
    dbPartPrefix: "wp3-tang6",
    active: true,
    band: "C",
    axis: "Mạch bài",
  },
  {
    id: "tang7",
    labelVi: "Tầng 7: Cắt lặp và lạc ý",
    label: "Trim the Fat",
    description: "Bấm bỏ câu thừa. Mốc 4 vẫn được phép lặp ý, mốc 5 thì không.",
    dbPartPrefix: "wp3-tang7",
    active: true,
    band: "C",
    axis: "Mạch bài",
  },
  {
    id: "tang8",
    labelVi: "Tầng 8: Sạch lỗi trong bài dài",
    label: "Accuracy Under Load",
    description: "Lỗi điển hình người Việt: chia thì, hoà hợp chủ–vị, mạo từ, danh từ đếm được.",
    dbPartPrefix: "wp3-tang8",
    active: true,
    band: "C",
    axis: "Độ chính xác",
  },
  {
    id: "tang9",
    labelVi: "Tầng 9: Tốc độ sản xuất",
    label: "Writing Speed",
    description: "Viết một đoạn 80–100 từ trong 6 phút, đếm từ thời gian thực.",
    dbPartPrefix: "wp3-tang9",
    active: true,
    band: "C",
    axis: "Đủ 300 từ trong 30 phút",
  },
  {
    id: "tang10",
    labelVi: "Tầng 10: Đa dạng cấu trúc",
    label: "Syntactic Variety",
    description: "Nâng câu đơn thành mệnh đề nhượng bộ, phân từ, danh hoá, bị động có mục đích. Đây là thứ chặn bài sạch lỗi ở mốc 3.",
    dbPartPrefix: "wp3-tang10",
    active: true,
    band: "D",
    axis: "Độ đa dạng",
  },
  {
    id: "tang11",
    labelVi: "Tầng 11: Chọn từ",
    label: "Word Choice",
    description: "Kết hợp từ, sắc thái trang trọng, thay good / bad / thing bằng từ chính xác.",
    dbPartPrefix: "wp3-tang11",
    active: true,
    band: "D",
    axis: "Độ đa dạng",
  },
  {
    id: "tang12",
    labelVi: "Tầng 12: Mở bài & kết bài",
    label: "Openings and Closings",
    description: "Kết bài không được chỉ chép lại mở bài.",
    dbPartPrefix: "wp3-tang12",
    active: true,
    band: "D",
    axis: "Mạch bài · Độ đa dạng",
  },
  {
    id: "tang13",
    labelVi: "Tầng 13: Viết thật & nộp chấm",
    label: "The Real Thing",
    description: "Đề thật, đồng hồ 30 phút, tự soi checklist rồi gửi giáo viên chấm.",
    dbPartPrefix: "wp3-tang13",
    active: false,
    band: "D",
    axis: "Toàn bộ",
    href: "/subskills/writing/part3/tang13",
  },
];

export const PASS_THRESHOLD_P3 = 80;

export function getSkillMetaP3(skillId: string): P3SkillMeta | undefined {
  return WRITING_P3_SKILLS.find((s) => s.id === skillId);
}

export function dbPartW3(skillId: string, difficulty: P3Difficulty): string {
  const skill = WRITING_P3_SKILLS.find((s) => s.id === skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return difficulty === "easy" ? skill.dbPartPrefix : `${skill.dbPartPrefix}-${difficulty}`;
}

// ─────────────────────────────────────
// Chuẩn hoá & so khớp
//
// Bản riêng của Part 3, KHÔNG dùng lại normP2: bảng viết tắt của Part 2 có
// quy tắc riêng của e-mail (e-mail → email) không liên quan tới bài luận.
// ─────────────────────────────────────

const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, "i am"],
  [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bcan't\b/g, "cannot"],
  [/\bcouldn't\b/g, "could not"],
  [/\bwon't\b/g, "will not"],
  [/\bwouldn't\b/g, "would not"],
  [/\bshouldn't\b/g, "should not"],
  [/\bhaven't\b/g, "have not"],
  [/\bhasn't\b/g, "has not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bthey're\b/g, "they are"],
  [/\bit's\b/g, "it is"],
  [/\bthat's\b/g, "that is"],
  [/\bi've\b/g, "i have"],
  [/\bwe've\b/g, "we have"],
  [/\bi'd\b/g, "i would"],
  [/\bwe'd\b/g, "we would"],
  [/\bi'll\b/g, "i will"],
  [/\bwe'll\b/g, "we will"],
];

/** Bỏ hoa/thường, dấu câu, khoảng trắng thừa, viết tắt, dấu nháy cong */
export function normP3(s: string): string {
  let out = s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out
    .replace(/[.,!?;:"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Đúng nếu khớp đáp án chính hoặc bất kỳ biến thể nào được chấp nhận */
export function matchesAcceptedP3(input: string, answer: string, accepted?: string[]): boolean {
  const n = normP3(input);
  if (n === normP3(answer)) return true;
  return (accepted ?? []).some((a) => normP3(a) === n);
}

/**
 * Trả về true nếu chỉ sai đúng 1 từ so với đáp án gần nhất
 * (báo "Gần đúng" thay vì "Sai" — đỡ nản khi câu dài).
 */
export function isNearMissP3(input: string, answer: string, accepted?: string[]): { near: boolean; wrongIdx: number; target: string } {
  const inWords = normP3(input).split(" ").filter(Boolean);
  const candidates = [answer, ...(accepted ?? [])];
  for (const cand of candidates) {
    const cw = normP3(cand).split(" ").filter(Boolean);
    if (cw.length !== inWords.length) continue;
    const diffs: number[] = [];
    for (let i = 0; i < cw.length; i++) if (cw[i] !== inWords[i]) diffs.push(i);
    if (diffs.length === 1) return { near: true, wrongIdx: diffs[0], target: cand };
  }
  return { near: false, wrongIdx: -1, target: answer };
}

/** Đếm từ — dùng cho timed_write */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─────────────────────────────────────
// Static data — mỗi tầng đang có 1 bộ test, nhân lên 5 bộ ở phase sau
// ─────────────────────────────────────

import t1_1 from "./tang1.1.json";
import t2_1 from "./tang2.1.json";
import t3_1 from "./tang3.1.json";
import t4_1 from "./tang4.1.json";
import t5_1 from "./tang5.1.json";
import t6_1 from "./tang6.1.json";
import t7_1 from "./tang7.1.json";
import t8_1 from "./tang8.1.json";
import t9_1 from "./tang9.1.json";
import t10_1 from "./tang10.1.json";
import t11_1 from "./tang11.1.json";
import t12_1 from "./tang12.1.json";

type RawTest = {
  passages?: Record<string, PassageBlock>;
  levels: { difficulty: string; exercises: unknown[] }[];
};

function load(raw: unknown, skillId: string, testNum: number): P3TestData {
  const r = raw as RawTest;
  return {
    skillId,
    testNum,
    passages: r.passages ?? {},
    levels: r.levels.map((lev) => ({
      difficulty: lev.difficulty as P3Difficulty,
      exercises: lev.exercises as P3Exercise[],
    })),
  };
}

const DATA: Record<string, P3TestData[]> = {
  tang1: [t1_1].map((r, i) => load(r, "tang1", i + 1)),
  tang2: [t2_1].map((r, i) => load(r, "tang2", i + 1)),
  tang3: [t3_1].map((r, i) => load(r, "tang3", i + 1)),
  tang4: [t4_1].map((r, i) => load(r, "tang4", i + 1)),
  tang5: [t5_1].map((r, i) => load(r, "tang5", i + 1)),
  tang6: [t6_1].map((r, i) => load(r, "tang6", i + 1)),
  tang7: [t7_1].map((r, i) => load(r, "tang7", i + 1)),
  tang8: [t8_1].map((r, i) => load(r, "tang8", i + 1)),
  tang9: [t9_1].map((r, i) => load(r, "tang9", i + 1)),
  tang10: [t10_1].map((r, i) => load(r, "tang10", i + 1)),
  tang11: [t11_1].map((r, i) => load(r, "tang11", i + 1)),
  tang12: [t12_1].map((r, i) => load(r, "tang12", i + 1)),
};

/** Số bộ test hiện có của một tầng — dùng cho thanh tiến độ ở trang danh sách */
export function countTestsP3(skillId: string): number {
  return DATA[skillId]?.length ?? 0;
}

export function getSkillTestsP3(skillId: string): P3TestData[] | undefined {
  return DATA[skillId];
}
