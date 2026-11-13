/**
 * lib/roadmap/types.ts — kiểu dùng chung của khu Lộ trình.
 *
 * Cố ý KHÔNG import Prisma ở đây: engine chẩn đoán và planner phải chạy được
 * trong script dry-run mà không cần kết nối DB.
 */

export type PartNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ─────────────────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cách biết một đầu việc đã làm xong. Mỗi biến thể trỏ thẳng vào một bảng làm
 * bài có thật — lộ trình không tự giữ trạng thái "đã học" của riêng nó.
 */
export type EvidenceSpec =
  /**
   * subskill_attempts. `minExercises` = số bài con (exerciseIndex khác nhau)
   * phải đạt; khu nào chỉ có một bài thì để 1.
   */
  | {
      source: "subskill";
      /** cột `part`, vd "part2", "part2-hard", "r5-hien-tai-don", "conn-tuong-phan" */
      part: string;
      /** cột `question_word`, vd "who", "l2", "classify" */
      questionWord: string;
      /**
       * Khu nào chia nhiều bài con trong một trang (Part 2 có 4 bài) thì chỉ
       * đích danh bài nào; bỏ trống nghĩa là bài nào cũng tính.
       */
      exerciseIndex?: number;
      minScore: number;
      minExercises: number;
    }
  /** ipa_attempts (khu IPA có bảng riêng, không dùng subskill_attempts) */
  | {
      source: "ipa";
      section: string;
      difficulty: string;
      minScore: number;
      minExercises: number;
    }
  /** grammar_attempts — đếm câu đúng trong một thẻ chủ đề */
  | {
      source: "grammar";
      topicSlug: string;
      minQuestions: number;
      minAccuracy: number;
    }
  /** part_practice_attempts — luyện một part lẻ */
  | {
      source: "part_practice";
      skill: "listening" | "reading";
      part: PartNumber;
      /** slug lượt làm, vd "ca-test-1-part2" */
      testSlug: string;
      minAccuracy: number;
    }
  /** full_test_attempts — mốc kiểm tra */
  | {
      source: "full_test";
      examSlug: string;
      testSlug: string;
    }
  /**
   * skill_submissions — bài Speaking/Writing học viên tự làm và lưu vào sổ.
   *
   * KHÔNG đòi `status = "graded"`: gửi bài cho thầy chấm chỉ mở cho học viên đã
   * đăng ký khoá (xem lib/access.ts), nên đòi chấm xong là người dùng miễn phí
   * không bao giờ hoàn thành được việc nào. Bằng chứng là bài có nội dung thật.
   */
  | {
      source: "submission";
      skill: "speaking" | "writing";
      /** "q3-4" | "q6-7" | … */
      unit: string;
      /** slug bộ đề; để trống nghĩa là bộ nào của unit này cũng tính. */
      testKey?: string;
    };

export type CatalogKind =
  | "subskill"
  | "part_practice"
  | "full_test"
  | "grammar"
  | "ipa"
  | "submission";

/** Một đầu mục nội dung có thật trên web. */
export type CatalogItem = {
  /** Khoá ổn định, vd "sub.part5.hien-tai-don.l2". Không đổi khi đổi tiêu đề. */
  id: string;
  title: string;
  /** Đường dẫn thật. Nguồn chân lý duy nhất — AI không bao giờ tự sinh href. */
  href: string;
  kind: CatalogKind;

  /**
   * Bài này chữa cho (những) part nào của đề thi L&R.
   * Rỗng với bài Speaking/Writing — hai kỹ năng đó không có part trong đề L&R.
   */
  parts: PartNumber[];
  skill: "listening" | "reading" | "both" | "speaking" | "writing";

  /** Nhãn kỹ năng nền, để planner biết bài nào là "nền" bài nào là "luyện đề". */
  tags: string[];

  /** Dải điểm phù hợp — không giao bài 800+ cho học viên 350. */
  bandMin: number;
  bandMax: number;

  estMinutes: number;
  /** Thứ tự trong nhóm (level 1,2,3…). Planner luôn chọn bậc thấp trước. */
  rank: number;
  /** Phải xong những catalogId này trước (vd bộ medium khoá sau bộ easy). */
  prereq: string[];
  /**
   * Giao lại được ở các tuần sau.
   *
   * Dành cho khu không chia bộ đề — viết email chẳng hạn, học viên chọn đề ngay
   * trong trang. Luyện viết là việc hằng tuần chứ không phải làm một lần là
   * xong, mà catalog chỉ có một mục cho cả khu. Không gameable: cửa sổ đối
   * chiếu bằng chứng tính từ ngày giao, nên mỗi lần giao đòi một bài MỚI.
   */
  repeatable?: boolean;

  evidence: EvidenceSpec;
};

// ─────────────────────────────────────────────────────────────────────────────
// Chẩn đoán
// ─────────────────────────────────────────────────────────────────────────────

export type PartScoreInput = {
  part: PartNumber;
  correct: number;
  /** Số câu được tính điểm (đã loại câu thiếu đáp án / câu lỗi). */
  gradable: number;
};

export type PartDiagnosis = {
  part: PartNumber;
  accuracy: number;
  /** Độ chính xác trung bình toàn đề trừ đi độ chính xác part này. */
  relativeGap: number;
  /** Đúng dưới 50% — luôn là ưu tiên dù mặt bằng chung thấp. */
  absoluteFloor: boolean;
  leverage: number;
  weight: number;
  priority: number;
};

export type Band = "<400" | "400-595" | "600-745" | "750-855" | "860+";

export type Feasibility = "comfortable" | "tight" | "unrealistic";

export type WeaknessReport = {
  total: number;
  listening: number | null;
  reading: number | null;
  overallAccuracy: number;
  band: Band;
  /** Điểm giữa của dải band, dùng để lọc catalog theo bandMin/bandMax. */
  bandAnchor: number;
  /** Xếp hạng giảm dần theo `priority`. */
  parts: PartDiagnosis[];
  /** parts[0..1] — hai part được ưu tiên chữa. */
  focusParts: PartNumber[];
  /** Hai part khá nhất, dùng cho phần "duy trì". */
  strongParts: PartNumber[];

  targetScore: number | null;
  gapToTarget: number | null;
  weeksLeft: number | null;
  feasibility: Feasibility | null;
  /** Số điểm ước tính tăng được trong thời gian còn lại với ngân sách đã khai. */
  expectedGain: number | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Planner
// ─────────────────────────────────────────────────────────────────────────────

export type Intake = {
  minutesPerDay: number;
  daysPerWeek: number;
  /** "YYYY-MM-DD" theo giờ VN. */
  startDate: string;
  /** Part học viên muốn ưu tiên, nếu có khai. */
  preferredParts?: PartNumber[];
  /** Có muốn xen bài Nói/Viết vào lộ trình không (mặc định: không). */
  wantsSpeakingWriting?: boolean;
};

export type DraftTask = {
  catalogId: string;
  title: string;
  href: string;
  kind: CatalogKind;
  target: EvidenceSpec;
  estMinutes: number;
  priority: "core" | "bonus";
  /** Vì sao bài này được giao — để hiển thị cho học viên và để dò lỗi planner. */
  reason: "focus" | "foundation" | "maintenance" | "checkpoint" | "sw";
};

export type DraftDay = {
  /** "YYYY-MM-DD" */
  date: string;
  /** 0 = CN … 6 = T7 */
  weekday: number;
  /** Ngày nghỉ: tasks rỗng. */
  rest: boolean;
  /** Ngày có BTVN/buổi học → đã giảm tải. */
  busy: boolean;
  budgetMinutes: number;
  tasks: DraftTask[];
};

/** Một mục tiêu tháng. Mốc điểm do code tính, lời mô tả có thể do AI viết lại. */
export type MonthGoal = {
  monthIndex: number;
  label: string;
  targetScore: number;
  /** Nhãn các part được chữa trong tháng, vd "Part 5 · Hoàn thành câu". */
  focus: string[];
  summary: string;
  /** "YYYY-MM-DD" */
  startDate: string;
  endDate: string;
};

export type DraftWeek = {
  weekIndex: number;
  startDate: string;
  endDate: string;
  theme: string;
  goalText: string;
  targetMinutes: number;
  days: DraftDay[];
};
