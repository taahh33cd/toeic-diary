import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/** Rubric ETS của Question 8 là thang 0-5 (khác Q1-5 và Q6-7). */
export type Q8Assess = {
  rubric: 0 | 1 | 2 | 3 | 4 | 5;
  /** Điểm từng tiêu chí ETS, thang 0-5 */
  criteria: { opinionSupported: number; grammar: number; vocabulary: number; organization: number };
  /** Nhận xét tổng bằng tiếng Việt */
  feedback: string;
  /** Việc cần làm để lên một mức, tiếng Việt */
  toImprove: string[];
  /** Lỗi cụ thể: câu sai → câu sửa → giải thích tiếng Việt */
  fixes: { original: string; corrected: string; why: string }[];
  wordCount: number;
};

const MODEL = "gemini-2.5-flash-lite";

async function gradeEssay(question: string, essay: string, attempt = 0): Promise<Q8Assess | null> {
  const prompt = `You are an official ETS rater for TOEIC Writing Question 8 ("Write an opinion essay").

Essay question given to the test taker:
"""
${question}
"""

Test taker's essay:
"""
${essay}
"""

Score it with the real ETS Question 8 rubric, which is 0 to 5:
5 — effectively addresses the task; well organised and developed with reasons/examples; consistent language facility; may have minor errors.
4 — addresses the task well; generally well organised and developed; some noticeable errors that do not obscure meaning.
3 — addresses the task using some reasons/examples but development is limited or repetitive; occasional errors that obscure meaning; ideas may be listed rather than connected.
2 — limited development; poor organisation; frequent errors; only loosely connected to the question.
1 — serious and frequent errors; almost no relevant development; may only repeat the prompt.
0 — blank, off topic, not in English, or merely copies the question.

Important: a response under about 150 words can rarely earn above 3, and ETS says an effective essay typically has at least 300 words. Do NOT reward length alone — a long but repetitive essay stays at 3.

Also give 0-5 for each ETS criterion: whether the opinion is supported with reasons and/or examples, grammar, vocabulary, organisation.

Then list at most 5 concrete language fixes taken verbatim from the essay.

Respond with ONLY a JSON object, no markdown:
{"rubric": <int 0-5>, "criteria": {"opinionSupported": <int 0-5>, "grammar": <int 0-5>, "vocabulary": <int 0-5>, "organization": <int 0-5>}, "feedback": "<3-4 câu nhận xét bằng TIẾNG VIỆT, nói rõ vì sao ở mức này>", "toImprove": ["<việc cần làm để lên một mức, TIẾNG VIỆT>", "..."], "fixes": [{"original": "<câu sai trích nguyên văn từ bài>", "corrected": "<câu đã sửa>", "why": "<giải thích ngắn bằng TIẾNG VIỆT>"}]}`;

  try {
    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const text = (response.text ?? "").trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const p = JSON.parse(match[0]) as Record<string, unknown>;
    const clamp5 = (v: unknown) => Math.max(0, Math.min(5, Math.round(Number(v) || 0)));
    const c = (p.criteria ?? {}) as Record<string, unknown>;

    return {
      rubric: clamp5(p.rubric) as Q8Assess["rubric"],
      criteria: {
        opinionSupported: clamp5(c.opinionSupported),
        grammar: clamp5(c.grammar),
        vocabulary: clamp5(c.vocabulary),
        organization: clamp5(c.organization),
      },
      feedback: typeof p.feedback === "string" ? p.feedback : "",
      toImprove: Array.isArray(p.toImprove)
        ? (p.toImprove as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 5)
        : [],
      fixes: Array.isArray(p.fixes)
        ? (p.fixes as unknown[])
            .filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object")
            .map((f) => ({
              original: String(f.original ?? ""),
              corrected: String(f.corrected ?? ""),
              why: String(f.why ?? ""),
            }))
            .filter((f) => f.original && f.corrected)
            .slice(0, 5)
        : [],
      wordCount: essay.trim().split(/\s+/).filter(Boolean).length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attempt === 0 && (msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE"))) {
      await new Promise((r) => setTimeout(r, 1200));
      return gradeEssay(question, essay, 1);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { question?: string; essay?: string };
  const question = body.question?.trim();
  const essay = body.essay?.trim();

  if (!question || !essay) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  // Bài quá ngắn thì không cần gọi AI — client đã có nhánh tự đánh giá theo độ dài.
  if (essay.split(/\s+/).filter(Boolean).length < 20) {
    return NextResponse.json({ error: "Too short" }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  try {
    const result = await gradeEssay(question, essay);
    if (!result) return NextResponse.json({ error: "AI parse failed" }, { status: 502 });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[writing-q8-assess] Gemini error:", msg.slice(0, 200));
    return NextResponse.json({ error: "AI error" }, { status: 502 });
  }
}
