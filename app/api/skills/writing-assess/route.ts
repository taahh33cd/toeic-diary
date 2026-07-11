import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type AssessResult = {
  score: number;           // 0–100
  usedBothKeywords: boolean;
  corrected: string;       // câu đã sửa đúng ngữ pháp
  feedback: string;        // nhận xét tiếng Việt ngắn
  errors: string[];        // các lỗi cụ thể (tiếng Việt)
};

async function gradeSentence(
  sentence: string,
  keywords: [string, string],
  modelAnswers: string[],
  attempt = 0,
): Promise<AssessResult | null> {
  const prompt = `You are a TOEIC Writing examiner grading Question 1-5 ("Write a sentence based on a picture").

The picture shows a scene. Reference model sentences (correct answers describing the picture):
${modelAnswers.map((m) => `- ${m}`).join("\n")}

The student MUST use BOTH of these words (any inflected form is OK): "${keywords[0]}" and "${keywords[1]}".

Student's sentence: "${sentence.replace(/"/g, "'")}"

Grade it on: (1) grammar correctness, (2) whether BOTH required words are used, (3) whether it plausibly describes the same scene as the model sentences.
Scoring guide (0-100): 90-100 correct grammar + both words + relevant; 70-89 minor errors; 40-69 understandable but wrong grammar or missing a word; 0-39 off-topic or missing both words.

Respond with ONLY a JSON object, no markdown:
{"score": <int 0-100>, "usedBothKeywords": <true|false>, "corrected": "<the student's sentence rewritten correctly, keeping both required words>", "feedback": "<1-2 câu nhận xét bằng TIẾNG VIỆT>", "errors": ["<lỗi 1 bằng tiếng Việt>", "..."]}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    const text = (response.text ?? "").trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as Partial<AssessResult>;
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));
    return {
      score,
      usedBothKeywords: Boolean(parsed.usedBothKeywords),
      corrected: typeof parsed.corrected === "string" ? parsed.corrected : sentence,
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
      errors: Array.isArray(parsed.errors) ? parsed.errors.filter((e) => typeof e === "string").slice(0, 5) : [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attempt === 0 && (msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE"))) {
      await new Promise((r) => setTimeout(r, 1200));
      return gradeSentence(sentence, keywords, modelAnswers, 1);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    sentence?: string;
    keywords?: string[];
    modelAnswers?: string[];
  };

  const sentence = body.sentence?.trim();
  const keywords = body.keywords;
  const modelAnswers = body.modelAnswers;

  if (!sentence || !Array.isArray(keywords) || keywords.length !== 2 || !Array.isArray(modelAnswers)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const result = await gradeSentence(sentence, keywords as [string, string], modelAnswers);
    if (!result) return NextResponse.json({ error: "AI parse failed" }, { status: 502 });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[writing-assess] Gemini error:", msg.slice(0, 200));
    return NextResponse.json({ error: "AI error" }, { status: 502 });
  }
}
