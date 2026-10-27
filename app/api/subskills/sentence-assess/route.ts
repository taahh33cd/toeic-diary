// Chấm câu học viên TỰ ĐẶT với các từ cho sẵn (subskill Đặt câu nhanh).
//
// Dùng cho cả hai nhánh: nhánh Viết gửi câu đã gõ, nhánh Nói gửi bản thu đã
// được /api/subskills/sentence-stt chuyển thành chữ. Vì vậy prompt phải nói rõ
// nguồn: câu nói thì bỏ qua lỗi dấu câu và chữ hoa, còn câu viết thì không.

import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { usesWord } from "@/lib/subskills/sentence-sprint/match";
import type { SentenceAssess } from "@/lib/subskills/sentence-sprint/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = "gemini-2.5-flash-lite";

type Input = {
  words: string[];
  situation: string;
  model: string;
  answer: string;
  mode: "write" | "speak";
  minSentences: number;
};

function buildPrompt(input: Input): string {
  const spoken = input.mode === "speak";
  return `Bạn là giáo viên TOEIC chấm bài ĐẶT CÂU của học viên Việt Nam.

CÁC TỪ BẮT BUỘC PHẢI DÙNG: ${input.words.map((w) => `"${w}"`).join(", ")}
${input.situation ? `TÌNH HUỐNG: ${input.situation}` : "TÌNH HUỐNG: không có — câu nào đúng và tự nhiên cũng được."}
CÂU MẪU (tham khảo, KHÔNG phải đáp án duy nhất): "${input.model}"
SỐ CÂU TỐI THIỂU: ${input.minSentences}

${spoken ? "BÀI CỦA HỌC VIÊN (lời nói đã được máy chuyển thành chữ)" : "BÀI CỦA HỌC VIÊN (gõ tay)"}:
"""
${input.answer.replace(/"""/g, '"')}
"""

Chấm 4 tiêu chí, mỗi tiêu chí 0–25:
1. usage — có dùng ĐỦ các từ bắt buộc, đúng nghĩa của từ đó không? Thiếu một từ thì tối đa 12.
2. grammar — dạng từ, thì, giới từ, mạo từ có đúng không?
3. fit — câu có khớp tình huống và đúng vai người nói không? Nếu không có tình huống thì chấm xem câu có nghĩa dùng được trong môi trường công sở không.
4. natural — người bản ngữ có nói/viết như vậy không, hay là câu dịch cứng từ tiếng Việt?

Nguyên tắc:
- KHÔNG trừ điểm vì học viên diễn đạt khác câu mẫu. Khác mà đúng thì vẫn điểm tối đa.
- ${spoken ? "Bỏ qua hoàn toàn lỗi dấu câu, chữ hoa và lỗi nghe nhầm nhỏ của máy (vd 'to' thành 'too'). Chấm nội dung và ngữ pháp của lời nói." : "Tính cả lỗi chính tả và dấu câu, nhưng chỉ trừ nhẹ ở tiêu chí grammar."}
- Nếu học viên để trống, gõ vài chữ vô nghĩa, hoặc chỉ lặp lại từ cho sẵn mà không thành câu: cho 0 điểm tất cả tiêu chí.
- Nếu bài ít hơn số câu tối thiểu, trừ ở tiêu chí fit.
- feedback viết TIẾNG VIỆT, tối đa 2 câu, nói thẳng lỗi nặng nhất và cách sửa. Nếu bài tốt thì nói ngắn gọn điều làm tốt.
- usedWords chỉ liệt kê những từ bắt buộc mà học viên THỰC SỰ đã dùng đúng.

Chỉ trả về JSON, không markdown:
{"criteria":{"usage":<0-25>,"grammar":<0-25>,"fit":<0-25>,"natural":<0-25>},"usedWords":["<từ đã dùng>"],"corrected":"<câu của học viên được sửa lại cho đúng, giữ tối đa cách diễn đạt của họ>","feedback":"<nhận xét tiếng Việt, tối đa 2 câu>"}`;
}

function clamp25(v: unknown): number {
  const n = Math.round(Number(v ?? 0));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(25, n));
}

async function grade(input: Input, attempt = 0): Promise<SentenceAssess | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(input),
    });
    const text = (response.text ?? "").trim();
    const match = text.replace(/^```(?:json)?/i, "").match(/\{[\s\S]*\}/);
    if (!match) return attempt === 0 ? grade(input, 1) : null;

    const parsed = JSON.parse(match[0]) as {
      criteria?: Record<string, unknown>;
      usedWords?: unknown;
      corrected?: unknown;
      feedback?: unknown;
    };

    const criteria = {
      usage: clamp25(parsed.criteria?.usage),
      grammar: clamp25(parsed.criteria?.grammar),
      fit: clamp25(parsed.criteria?.fit),
      natural: clamp25(parsed.criteria?.natural),
    };

    // Lưới đỡ: AI đôi khi khen "đã dùng" một từ không có trong bài. Việc này
    // kiểm được bằng chuỗi nên không giao cho AI.
    const reallyUsed = input.words.filter((w) => usesWord(input.answer, w));

    return {
      score: criteria.usage + criteria.grammar + criteria.fit + criteria.natural,
      criteria,
      usedWords: Array.isArray(parsed.usedWords)
        ? reallyUsed.filter((w) => (parsed.usedWords as unknown[]).includes(w))
        : reallyUsed,
      corrected: typeof parsed.corrected === "string" ? parsed.corrected : "",
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
    };
  } catch (err) {
    if (attempt === 0) return grade(input, 1);
    console.error("sentence-assess:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<Input> | null;
  if (!body?.answer?.trim() || !Array.isArray(body.words) || body.words.length === 0) {
    return NextResponse.json({ error: "Thiếu câu trả lời hoặc từ cho sẵn" }, { status: 400 });
  }

  const result = await grade({
    words: body.words,
    situation: body.situation ?? "",
    model: body.model ?? "",
    answer: body.answer,
    mode: body.mode === "speak" ? "speak" : "write",
    minSentences: body.minSentences ?? 1,
  });

  if (!result) {
    return NextResponse.json({ error: "Chưa chấm được, thử lại giúp mình" }, { status: 502 });
  }
  return NextResponse.json(result);
}
