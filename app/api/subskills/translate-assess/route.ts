import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { ERROR_TAGS, type ErrorTag, type TransAssessResult } from "@/lib/subskills/translation/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const TAG_LIST = ERROR_TAGS.join(" | ");

function buildPrompt(input: {
  source: string;
  model: string;
  focus: string;
  keyPoints: string[];
  answer: string;
}): string {
  return `Bạn là giáo viên chấm bài DỊCH ANH → VIỆT cho học sinh Việt Nam luyện TOEIC.

VĂN BẢN GỐC (tiếng Anh):
"""
${input.source}
"""

BẢN DỊCH MẪU (tham khảo, không phải đáp án duy nhất):
"""
${input.model}
"""

TRỌNG TÂM cần kiểm tra ở bài này: ${input.focus}

CÁC Ý BẮT BUỘC phải có trong bản dịch:
${input.keyPoints.map((k) => `- ${k}`).join("\n")}

BẢN DỊCH CỦA HỌC SINH:
"""
${input.answer.replace(/"""/g, '"')}
"""

Chấm theo 4 tiêu chí, mỗi tiêu chí 0–25 điểm:
1. completeness (đủ ý): có bỏ sót hoặc bịa thêm thông tin không?
2. accuracy (đúng quan hệ): ai làm gì với ai, thời gian, điều kiện, quan hệ logic có đúng không?
3. naturalness (tự nhiên): có phải câu tiếng Việt người Việt thật sự viết, hay là câu dịch máy giữ nguyên khung tiếng Anh?
4. tone (sắc thái): giữ đúng mức trang trọng và đúng hành động của người viết (yêu cầu / từ chối / thông báo / nhắc nhở) không?

Nguyên tắc chấm:
- KHÔNG trừ điểm chỉ vì học sinh dùng từ khác bản mẫu. Diễn đạt khác mà đúng ý, đúng sắc thái thì vẫn cho điểm tối đa.
- TRỪ NẶNG khi: bỏ sót ý bắt buộc, đảo ngược quan hệ, dịch sai nghĩa từ đa nghĩa, giữ nguyên trật tự tiếng Anh khiến câu không đọc được.
- Nếu học sinh bỏ trống hoặc gõ vài chữ vô nghĩa, cho 0 điểm.
- feedback viết bằng TIẾNG VIỆT, tối đa 2 câu, nói thẳng lỗi nặng nhất và cách sửa.
- Mỗi lỗi gắn 1 nhãn trong danh sách: ${TAG_LIST}. Nếu không khớp nhãn nào, dùng null.

Chỉ trả về JSON, không markdown, không giải thích thêm:
{"criteria":{"completeness":<0-25>,"accuracy":<0-25>,"naturalness":<0-25>,"tone":<0-25>},"corrected":"<bản dịch của học sinh được sửa lại cho đúng và tự nhiên, giữ tối đa cách diễn đạt của họ>","feedback":"<nhận xét tiếng Việt, tối đa 2 câu>","errors":[{"tag":"<nhãn hoặc null>","detail":"<lỗi cụ thể bằng tiếng Việt>"}]}`;
}

function clamp25(v: unknown): number {
  const n = Math.round(Number(v ?? 0));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(25, n));
}

async function grade(
  input: { source: string; model: string; focus: string; keyPoints: string[]; answer: string },
  attempt = 0,
): Promise<TransAssessResult | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: buildPrompt(input),
    });
    const text = (response.text ?? "").trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as {
      criteria?: Record<string, unknown>;
      corrected?: unknown;
      feedback?: unknown;
      errors?: unknown;
    };

    const criteria = {
      completeness: clamp25(parsed.criteria?.completeness),
      accuracy: clamp25(parsed.criteria?.accuracy),
      naturalness: clamp25(parsed.criteria?.naturalness),
      tone: clamp25(parsed.criteria?.tone),
    };
    const score =
      criteria.completeness + criteria.accuracy + criteria.naturalness + criteria.tone;

    const rawErrors = Array.isArray(parsed.errors) ? parsed.errors : [];
    const errors = rawErrors
      .map((e) => {
        const row = e as { tag?: unknown; detail?: unknown };
        const tag =
          typeof row.tag === "string" && (ERROR_TAGS as readonly string[]).includes(row.tag)
            ? (row.tag as ErrorTag)
            : null;
        const detail = typeof row.detail === "string" ? row.detail : "";
        return { tag, detail };
      })
      .filter((e) => e.detail.length > 0)
      .slice(0, 5);

    return {
      score,
      criteria,
      corrected: typeof parsed.corrected === "string" ? parsed.corrected : input.model,
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attempt === 0 && (msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE"))) {
      await new Promise((r) => setTimeout(r, 1200));
      return grade(input, 1);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    source?: string;
    model?: string;
    focus?: string;
    keyPoints?: string[];
    answer?: string;
  };

  const source = body.source?.trim();
  const model = body.model?.trim();
  const answer = body.answer?.trim();
  const focus = body.focus?.trim() ?? "";
  const keyPoints = Array.isArray(body.keyPoints) ? body.keyPoints.filter((k) => typeof k === "string") : [];

  if (!source || !model || !answer) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (answer.length > 4000) {
    return NextResponse.json({ error: "Answer too long" }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const result = await grade({ source, model, focus, keyPoints, answer });
    if (!result) return NextResponse.json({ error: "AI parse failed" }, { status: 502 });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[translate-assess] Gemini error:", msg.slice(0, 200));
    return NextResponse.json({ error: "AI error" }, { status: 502 });
  }
}
