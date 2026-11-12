/**
 * lib/roadmap/ai.ts — lớp AI của khu Lộ trình.
 *
 * ★ Nguyên tắc sống còn: AI KHÔNG nằm trên đường chính.
 *   Hàm `enrichPlan` không bao giờ ném lỗi và không bao giờ trả về thứ chưa
 *   kiểm. Gemini sập, hết quota, quá chậm hay trả JSON rác → trả `{ ok: false }`
 *   và người gọi dùng thẳng bản rule. Học viên luôn có lộ trình, chỉ là lời lẽ
 *   khô hơn.
 *
 * AI ĐƯỢC làm:
 *   • viết nhãn + lời mô tả cho từng tháng
 *   • viết chủ đề + câu mục tiêu của tuần
 *   • đảo thứ tự ưu tiên các việc TRONG danh sách đã cho
 *   • nói tuần này nên nhẹ đi hay giữ nguyên
 *
 * AI KHÔNG được làm:
 *   • sinh href hay catalogId mới (chỉ được chọn trong danh sách đưa vào)
 *   • đặt điều kiện đạt (minScore/minItems) — planner quyết
 *   • đổi mốc điểm từng tháng, targetScore hay deadline — code tính
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { weekFacts } from "./planner";
import type { DraftWeek, MonthGoal, WeaknessReport } from "./types";

const MODEL = "gemini-2.5-flash-lite";

/**
 * Quá thời gian này thì bỏ AI, dùng bản rule. Học viên vừa nộp bài xong và đang
 * chờ màn hình kết quả — bắt họ nhìn spinner 30 giây để đổi lấy vài câu văn
 * mượt hơn là đổi sai.
 */
const TIMEOUT_MS = 12_000;

// ─────────────────────────────────────────────────────────────────────────────
// Hợp đồng JSON
// ─────────────────────────────────────────────────────────────────────────────

const AiOutputSchema = z.object({
  months: z
    .array(
      z.object({
        monthIndex: z.number().int().min(1).max(12),
        label: z.string().min(1).max(60),
        summary: z.string().min(1).max(400),
      }),
    )
    .max(6),
  week: z.object({
    theme: z.string().min(1).max(60),
    goalText: z.string().min(1).max(300),
    /** catalogId, phải là tập con của danh sách đưa vào. */
    taskOrder: z.array(z.string()).max(40),
    adjust: z.enum(["lighter", "keep", "heavier"]),
  }),
  encouragement: z.string().min(1).max(200),
});

export type AiEnrichment = z.infer<typeof AiOutputSchema>;

export type EnrichResult =
  | { ok: true; data: AiEnrichment; model: string }
  | { ok: false; reason: string };

// ─────────────────────────────────────────────────────────────────────────────

export type EnrichInput = {
  report: WeaknessReport;
  week: DraftWeek;
  months: MonthGoal[];
  intake: { minutesPerDay: number; daysPerWeek: number };
};

export function isAiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export async function enrichPlan(input: EnrichInput): Promise<EnrichResult> {
  if (!isAiConfigured()) return { ok: false, reason: "no_api_key" };

  const allowedIds = input.week.days.flatMap((d) => d.tasks.map((t) => t.catalogId));
  if (allowedIds.length === 0) return { ok: false, reason: "empty_week" };

  try {
    const raw = await withTimeout(callGemini(buildPrompt(input)), TIMEOUT_MS);
    if (raw === null) return { ok: false, reason: "timeout" };

    const json = extractJson(raw);
    if (!json) return { ok: false, reason: "no_json" };

    const parsed = AiOutputSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, reason: `schema: ${parsed.error.issues[0]?.message ?? "?"}` };
    }

    // Chốt chặn cuối: id lạ thì loại thẳng, không "sửa giúp" AI.
    const allowed = new Set(allowedIds);
    const order = parsed.data.week.taskOrder.filter((id) => allowed.has(id));
    const unknown = parsed.data.week.taskOrder.length - order.length;
    if (unknown > 0 && order.length === 0) {
      return { ok: false, reason: "taskOrder toàn id lạ" };
    }

    // Tháng nào AI không nhắc tới thì giữ nguyên bản rule — không ép đủ bộ.
    const validMonths = new Set(input.months.map((m) => m.monthIndex));
    const months = parsed.data.months.filter((m) => validMonths.has(m.monthIndex));

    return {
      ok: true,
      model: MODEL,
      data: { ...parsed.data, months, week: { ...parsed.data.week, taskOrder: order } },
    };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message.slice(0, 120) : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Áp kết quả AI lên bản rule
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trộn kết quả AI vào lịch rule. Hàm thuần, không gọi mạng — tách ra để thấy rõ
 * AI được phép đổi đúng những gì.
 *
 * `taskOrder` chỉ sắp lại thứ tự TRONG từng ngày. Cố ý không cho AI chuyển việc
 * sang ngày khác: planner đã cân ngân sách và né ngày bận rồi, để AI xáo giữa
 * các ngày là phá đúng thứ nó không nhìn thấy.
 */
export function applyEnrichment(
  week: DraftWeek,
  months: MonthGoal[],
  ai: AiEnrichment,
  opts: { daysPerWeek: number; monthCheckpoint?: boolean },
): { week: DraftWeek; months: MonthGoal[] } {
  const rank = new Map(ai.week.taskOrder.map((id, i) => [id, i]));

  const days = week.days.map((day) => {
    let tasks = [...day.tasks].sort(
      (a, b) =>
        (rank.get(a.catalogId) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.catalogId) ?? Number.MAX_SAFE_INTEGER),
    );

    // "lighter": bỏ việc bonus. Chỉ bỏ bonus, không đụng core — core là phần
    // chữa điểm yếu, cắt vào đó thì tuần này học xong cũng không lên được gì.
    if (ai.week.adjust === "lighter") {
      tasks = tasks.filter((t) => t.priority === "core");
    }

    return { ...day, tasks };
  });

  const byIndex = new Map(ai.months.map((m) => [m.monthIndex, m]));
  const mergedMonths = months.map((m) => {
    const a = byIndex.get(m.monthIndex);
    // Mốc điểm giữ nguyên của code — AI chỉ được đổi chữ.
    return a ? { ...m, label: a.label, summary: a.summary } : m;
  });

  const targetMinutes = days.reduce(
    (sum, d) => sum + d.tasks.reduce((s, t) => s + t.estMinutes, 0),
    0,
  );

  // Nối lại phần sự thật (mấy giờ, mấy buổi, có mốc kiểm tra không) sau câu văn
  // của AI. Lần chạy thử đầu tiên AI viết đè mất đúng mấy dữ kiện này, học viên
  // mở ra không còn biết tuần đầu chỉ có 2 buổi — dữ kiện không để AI cầm.
  const facts = weekFacts(
    {
      targetMinutes,
      studyDays: days.filter((d) => d.tasks.length > 0).length,
      checkpointAdded: days.some((d) => d.tasks.some((t) => t.reason === "checkpoint")),
    },
    opts,
  );

  return {
    week: {
      ...week,
      theme: ai.week.theme,
      goalText: ai.week.goalText.trimEnd() + facts,
      days,
      targetMinutes,
    },
    months: mergedMonths,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(input: EnrichInput): string {
  const { report, week, months, intake } = input;

  const partLines = report.parts
    .map(
      (p) =>
        `  Part ${p.part}: đúng ${Math.round(p.accuracy * 100)}% (${p.weight} câu)` +
        `${p.absoluteFloor ? " — dưới một nửa" : ""}`,
    )
    .join("\n");

  const taskLines = week.days
    .filter((d) => !d.rest)
    .map((d) => {
      const items = d.tasks
        .map((t) => `    - ${t.catalogId} | ${t.estMinutes} phút | ${t.title} | ${t.reason}`)
        .join("\n");
      return `  ${d.date}${d.busy ? " (đã có bài tập của giáo viên)" : ""}:\n${items}`;
    })
    .join("\n");

  const monthLines = months
    .map((m) => `  Tháng ${m.monthIndex}: mốc ${m.targetScore} điểm, chữa ${m.focus.join(", ")}`)
    .join("\n");

  const deadlineNote =
    report.weeksLeft === null
      ? "Học viên chưa đặt ngày thi."
      : `Còn ${report.weeksLeft} tuần tới ngày thi. Mức tăng ước tính: ${report.expectedGain} điểm — đánh giá: ${report.feasibility}.`;

  return `Bạn là giáo viên TOEIC người Việt, đang viết lời cho lộ trình học của một học viên.

HỒ SƠ
  Điểm bài test đầu vào: ${report.total} (Listening ${report.listening ?? "?"}, Reading ${report.reading ?? "?"})
  Mục tiêu: ${report.targetScore ?? "chưa đặt"}
  ${deadlineNote}
  Học được ${intake.minutesPerDay} phút/ngày, ${intake.daysPerWeek} ngày/tuần.

ĐỘ CHÍNH XÁC TỪNG PART
${partLines}

KHUNG MỤC TIÊU THÁNG (mốc điểm đã cố định, KHÔNG được đổi)
${monthLines}

LỊCH TUẦN ${week.weekIndex} ĐÃ XẾP SẴN
${taskLines}

VIỆC CỦA BẠN
1. Viết lại nhãn và lời mô tả cho từng tháng cho dễ hiểu, giữ nguyên mốc điểm.
2. Đặt chủ đề ngắn và câu mục tiêu cho tuần ${week.weekIndex}.
3. Sắp lại thứ tự ưu tiên các việc trong tuần: trả về mảng catalogId theo thứ tự
   nên làm trước. CHỈ dùng đúng các catalogId đã liệt kê ở trên, không thêm bất
   cứ id nào khác.
4. Nói tuần này nên "lighter" (nhẹ đi), "keep" (giữ nguyên) hay "heavier".
5. Viết một câu động viên.

QUY TẮC VIẾT
- Tiếng Việt, xưng "bạn", giọng bình thường như giáo viên nói chuyện.
- KHÔNG hứa chắc chắn sẽ đạt bao nhiêu điểm.
- Nhãn tháng KHÔNG chứa số điểm (giao diện đã hiện mốc điểm riêng rồi).
- Câu mục tiêu tuần KHÔNG nhắc số giờ hay số buổi — phần đó hệ thống tự nối vào sau.
${report.feasibility === "unrealistic" ? "- Lịch này đang CĂNG so với mục tiêu: nói thật điều đó, đừng trấn an suông.\n" : ""}- Không dùng emoji. Không viết hoa cả cụm để nhấn mạnh.

Trả về DUY NHẤT một JSON đúng dạng:
{
  "months": [{"monthIndex": 1, "label": "...", "summary": "..."}],
  "week": {"theme": "...", "goalText": "...", "taskOrder": ["..."], "adjust": "keep"},
  "encouragement": "..."
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hạ tầng
// ─────────────────────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return res.text ?? "";
}

/** Trả null khi quá hạn. Không huỷ được request Gemini nên chỉ bỏ qua kết quả. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Lấy JSON đầu tiên trong chuỗi trả về.
 *
 * `responseMimeType: "application/json"` phần lớn trả JSON thuần, nhưng thỉnh
 * thoảng vẫn kèm rào ```json — nên vẫn phải gỡ.
 */
function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
