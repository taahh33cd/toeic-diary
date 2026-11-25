/**
 * lib/homework/ai-draft.ts — soạn nháp BTVN từ ghi chú buổi học bằng Gemini.
 *
 * Cùng nguyên tắc với Lộ trình (lib/roadmap/ai.ts): AI chỉ được CHỌN catalogId
 * trong danh sách đưa vào, không tự bịa link. Id lạ bị loại thẳng. Việc không có
 * trong kho (vd "ôn 20 từ chủ đề văn phòng") AI chỉ được ghi thành dòng chữ, để
 * giáo viên tự gắn link.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { CATALOG_ITEMS, getCatalogItem } from "@/lib/roadmap/catalog";
import { sectionForLib, type HwCatKey } from "./library";

const MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 25_000;

const OutSchema = z.object({
  items: z
    .array(z.object({ catalogId: z.string(), why: z.string().max(200).optional() }))
    .max(12),
  manual: z
    .array(z.object({ text: z.string().min(1).max(200), section: z.enum(["vocab", "listening", "reading", "practice", "other"]).optional() }))
    .max(4)
    .optional(),
});

export type AiDraftItem = {
  section: HwCatKey;
  text: string;
  link: string;
  catalogId?: string;
  minutes?: number;
  why?: string;
};

export type AiDraftResult = { ok: true; items: AiDraftItem[] } | { ok: false; reason: string };

function catalogLines(): string {
  return CATALOG_ITEMS.filter((c) => c.kind !== "submission")
    .map((c) => `${c.id} | ${c.title} | P${c.parts.join(",") || "-"} | ${c.estMinutes}m | ${c.bandMin}-${c.bandMax}`)
    .join("\n");
}

function buildPrompt(note: string, budget: number, band: number | null): string {
  return `Bạn là trợ lý giáo viên TOEIC. Giáo viên ghi chú về buổi học hôm nay; hãy chọn bài tập về nhà (BTVN) từ KHO BÀI bên dưới cho đúng nội dung buổi học.

QUY TẮC:
- Chỉ dùng catalogId có trong KHO BÀI, chép đúng từng ký tự. Không bịa id, không bịa link.
- Bám sát chủ đề trong ghi chú (ngữ pháp nào, part nào, dạng câu hỏi nào). Ưu tiên bài cơ bản (bậc thấp) trước.
- Tổng thời gian khoảng ${budget} phút (cột "m"), tối đa 8 bài.${band ? `\n- Trình độ lớp khoảng ${band} điểm: tránh bài có khoảng điểm (cột cuối) cao hơn nhiều.` : ""}
- Việc trong ghi chú mà KHO không có bài phù hợp (vd ôn từ vựng theo chủ đề, xem video) → đưa vào "manual" dưới dạng một dòng việc ngắn, tiếng Việt.
- "why": một câu ngắn tiếng Việt, vì sao chọn bài này.

Trả về JSON đúng dạng:
{"items":[{"catalogId":"...","why":"..."}],"manual":[{"text":"...","section":"vocab|listening|reading|practice|other"}]}

GHI CHÚ BUỔI HỌC:
"""${note.slice(0, 2000)}"""

KHO BÀI (catalogId | tên | part | phút | khoảng điểm):
${catalogLines()}`;
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    if (s === -1 || e <= s) return null;
    try {
      return JSON.parse(cleaned.slice(s, e + 1));
    } catch {
      return null;
    }
  }
}

export async function draftFromNote(note: string, opts: { budget?: number; band?: number | null } = {}): Promise<AiDraftResult> {
  if (!process.env.GEMINI_API_KEY) return { ok: false, reason: "Chưa cấu hình Gemini" };
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const call = ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(note, opts.budget ?? 60, opts.band ?? null),
    config: { responseMimeType: "application/json", temperature: 0.2, thinkingConfig: { thinkingBudget: 0 } },
  });
  const res = await Promise.race([call, new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS))]);
  if (!res) return { ok: false, reason: "AI trả lời quá lâu, thử lại nhé" };

  const parsed = OutSchema.safeParse(extractJson(res.text ?? ""));
  if (!parsed.success) return { ok: false, reason: "AI trả về sai định dạng, thử lại nhé" };

  const seen = new Set<string>();
  const items: AiDraftItem[] = [];
  for (const it of parsed.data.items) {
    const c = getCatalogItem(it.catalogId.trim());
    if (!c || seen.has(c.id)) continue; // id lạ → bỏ, không "sửa giúp"
    seen.add(c.id);
    items.push({ section: sectionForLib(c), text: c.title, link: c.href, catalogId: c.id, minutes: c.estMinutes, why: it.why });
  }
  for (const m of parsed.data.manual ?? []) {
    items.push({ section: m.section ?? "other", text: m.text, link: "" });
  }
  if (items.length === 0) return { ok: false, reason: "AI không tìm được bài phù hợp trong kho" };
  return { ok: true, items };
}
