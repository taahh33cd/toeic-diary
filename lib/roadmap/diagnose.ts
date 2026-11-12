/**
 * lib/roadmap/diagnose.ts — từ kết quả đề đầu vào ra bảng xếp hạng điểm yếu.
 *
 * Thuần code, không gọi AI, không chạm DB: cùng một đầu vào luôn cho cùng một
 * đầu ra, nên kiểm chứng được bằng script (scripts/roadmap/dry-run.ts).
 *
 * Cách xếp hạng — xem plan-roadmap-ai.md §6:
 *   priority = gapScore × √(số câu) × leverage
 * trong đó gapScore so part này với MẶT BẰNG CỦA CHÍNH HỌC VIÊN, không so với
 * một bảng chuẩn ngoài. Bảng chuẩn theo band vừa khó bảo trì vừa dễ sai; so với
 * chính mình thì luôn chỉ đúng chỗ lệch nhất. `absoluteFloor` bù cho trường hợp
 * học viên yếu đều — khi đó mọi relativeGap đều ~0 mà vẫn cần giao bài nền.
 */

import {
  REFERENCE_MINUTES_PER_WEEK,
  REFERENCE_POINTS_PER_MONTH,
} from "./config";
import type {
  Band,
  Feasibility,
  PartDiagnosis,
  PartNumber,
  PartScoreInput,
  WeaknessReport,
} from "./types";

/**
 * Hệ số "dễ cải thiện". Đây là ước lượng sư phạm, không phải đo đạc — ghi rõ lý
 * do để sau này có số liệu thật thì còn biết đường sửa cái gì.
 *   Part 5: ngữ pháp, lên nhanh nhất, lại có sẵn kho câu lớn nhất trên web.
 *   Part 2: luyện theo loại câu hỏi là lên rõ, đủ 10 nhóm.
 *   Part 6: cùng gốc ngữ pháp với Part 5.
 *   Part 1: dễ lên nhưng chỉ 6 câu, không kéo được nhiều điểm.
 *   Part 3/4: cần nền nghe, lên chậm.
 *   Part 7: chậm nhất, phụ thuộc vốn từ và tốc độ đọc.
 */
export const PART_LEVERAGE: Record<PartNumber, number> = {
  1: 0.75,
  2: 0.9,
  3: 0.6,
  4: 0.6,
  5: 1.0,
  6: 0.8,
  7: 0.5,
};

/** Cộng thêm vào gapScore khi part đúng dưới 50%. */
const FLOOR_BONUS = 0.15;
const FLOOR_THRESHOLD = 0.5;

const BAND_RANGES: { band: Band; min: number; max: number }[] = [
  { band: "<400", min: 10, max: 399 },
  { band: "400-595", min: 400, max: 595 },
  { band: "600-745", min: 600, max: 745 },
  { band: "750-855", min: 750, max: 855 },
  { band: "860+", min: 860, max: 990 },
];

export function bandOf(total: number): Band {
  for (const r of BAND_RANGES) if (total <= r.max) return r.band;
  return "860+";
}

/** Điểm giữa của band — dùng để lọc catalog theo bandMin/bandMax. */
export function bandAnchorOf(total: number): number {
  const band = bandOf(total);
  const r = BAND_RANGES.find((x) => x.band === band)!;
  return Math.round((r.min + r.max) / 2);
}

export type DiagnoseInput = {
  partScores: PartScoreInput[];
  total: number;
  listening?: number | null;
  reading?: number | null;
  targetScore?: number | null;
  /** "YYYY-MM-DD" — ngày thi dự kiến. */
  deadline?: string | null;
  /** "YYYY-MM-DD" — mốc tính số tuần còn lại. Mặc định là hôm nay (giờ VN). */
  startDate?: string;
  /** Ngân sách đã khai, để ước tính tính khả thi. */
  minutesPerDay?: number;
  daysPerWeek?: number;
};

export function diagnose(input: DiagnoseInput): WeaknessReport {
  const scores = input.partScores.filter((p) => p.gradable > 0);
  if (scores.length === 0) {
    throw new Error(
      "diagnose: không có part nào chấm được — bài test đầu vào chưa đủ dữ liệu",
    );
  }

  const totalCorrect = scores.reduce((a, p) => a + p.correct, 0);
  const totalGradable = scores.reduce((a, p) => a + p.gradable, 0);
  const overallAccuracy = totalCorrect / totalGradable;

  const parts: PartDiagnosis[] = scores
    .map((p) => {
      const accuracy = p.correct / p.gradable;
      const relativeGap = overallAccuracy - accuracy;
      const absoluteFloor = accuracy < FLOOR_THRESHOLD;
      const gapScore = Math.max(relativeGap, 0) + (absoluteFloor ? FLOOR_BONUS : 0);
      const leverage = PART_LEVERAGE[p.part];
      const weight = p.gradable;
      return {
        part: p.part,
        accuracy,
        relativeGap,
        absoluteFloor,
        leverage,
        weight,
        priority: gapScore * Math.sqrt(weight) * leverage,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  // Hai part khá nhất tính theo độ chính xác, không theo priority — "duy trì"
  // là giữ phong độ chỗ đang tốt, không liên quan tới chuyện dễ cải thiện.
  const byAccuracy = [...parts].sort((a, b) => b.accuracy - a.accuracy);

  const targetScore = input.targetScore ?? null;
  const gapToTarget = targetScore === null ? null : Math.max(targetScore - input.total, 0);

  let weeksLeft: number | null = null;
  if (input.deadline && input.startDate) {
    const days =
      (Date.parse(`${input.deadline}T00:00:00Z`) -
        Date.parse(`${input.startDate}T00:00:00Z`)) /
      86_400_000;
    weeksLeft = Math.max(Math.round(days / 7), 0);
  }

  let expectedGain: number | null = null;
  let feasibility: Feasibility | null = null;
  if (
    gapToTarget !== null &&
    weeksLeft !== null &&
    input.minutesPerDay &&
    input.daysPerWeek
  ) {
    const minutesPerWeek = input.minutesPerDay * input.daysPerWeek;
    const pointsPerMonth =
      REFERENCE_POINTS_PER_MONTH * (minutesPerWeek / REFERENCE_MINUTES_PER_WEEK);
    const months = weeksLeft / 4.345;
    expectedGain = Math.round(pointsPerMonth * months);

    if (gapToTarget === 0) {
      feasibility = "comfortable";
    } else if (expectedGain <= 0) {
      feasibility = "unrealistic";
    } else {
      const ratio = gapToTarget / expectedGain;
      feasibility =
        ratio <= 0.8 ? "comfortable" : ratio <= 1.2 ? "tight" : "unrealistic";
    }
  }

  return {
    total: input.total,
    listening: input.listening ?? null,
    reading: input.reading ?? null,
    overallAccuracy,
    band: bandOf(input.total),
    bandAnchor: bandAnchorOf(input.total),
    parts,
    focusParts: parts.slice(0, 2).map((p) => p.part),
    strongParts: byAccuracy.slice(0, 2).map((p) => p.part),
    targetScore,
    gapToTarget,
    weeksLeft,
    feasibility,
    expectedGain,
  };
}

/** Câu giải thích ngắn vì sao part này được ưu tiên — dùng ở màn hình kết quả. */
export function explainPriority(d: PartDiagnosis): string {
  const pct = Math.round(d.accuracy * 100);
  if (d.absoluteFloor && d.relativeGap <= 0) {
    return `Part ${d.part} đúng ${pct}% — dưới một nửa, cần bù nền trước đã.`;
  }
  if (d.absoluteFloor) {
    return `Part ${d.part} đúng ${pct}%, vừa dưới một nửa vừa thấp hơn mặt bằng của bạn.`;
  }
  if (d.relativeGap > 0) {
    const gap = Math.round(d.relativeGap * 100);
    return `Part ${d.part} đúng ${pct}%, thấp hơn mặt bằng của bạn ${gap} điểm phần trăm.`;
  }
  return `Part ${d.part} đúng ${pct}% — đang ổn, chỉ cần duy trì.`;
}
