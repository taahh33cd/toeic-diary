import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const ERROR_TYPES = {
  Listening: [
    "Không nghe kịp tốc độ",
    "Nghe nhầm từ",
    "Không hiểu context",
    "Từ vựng không biết",
    "Phát âm giống nhau",
    "Mất tập trung",
    "Dạng câu hỏi suy luận",
  ],
  Reading: [
    "Ngữ pháp không chắc",
    "Từ vựng không biết",
    "Đọc hiểu sai ý",
    "Bẫy từ đồng nghĩa",
    "Không đủ thời gian",
    "Preposition / Collocation",
    "Câu điều kiện / mệnh đề",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "description required" }, { status: 400 });
    }

    const prompt = `You are a TOEIC coach. A student describes a mistake they made.

Student's description: "${description.slice(0, 300)}"

Classify this error into:
- category: "Listening" or "Reading"
- errorType: pick the MOST fitting from this list (choose exactly one):
  Listening types: ${ERROR_TYPES.Listening.join(", ")}
  Reading types: ${ERROR_TYPES.Reading.join(", ")}
- suggestion: one short sentence in Vietnamese on how to improve (max 20 words)

Return ONLY valid JSON: {"category": "...", "errorType": "...", "suggestion": "..."}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    const match = text.match(/\{[\s\S]*?\}/);
    const parsed = match ? JSON.parse(match[0]) : {};

    return NextResponse.json({
      category: parsed.category ?? "Listening",
      errorType: parsed.errorType ?? "Không nghe kịp tốc độ",
      suggestion: parsed.suggestion ?? "",
    });
  } catch {
    return NextResponse.json({ error: "AI classification failed" }, { status: 500 });
  }
}
