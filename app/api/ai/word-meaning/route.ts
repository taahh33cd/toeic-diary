import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { word, pos, definition } = await req.json();
    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "word required" }, { status: 400 });
    }

    const posHint = pos ? ` (${pos})` : "";
    const defHint = definition ? `\nEnglish definition: "${definition.slice(0, 200)}"` : "";

    const prompt = `You are a TOEIC vocabulary coach. Give a concise Vietnamese translation for this English word.

Word: "${word.trim()}"${posHint}${defHint}

Rules:
- Return ONLY a valid JSON object, no explanation
- "vi": 2-5 words in Vietnamese that best capture the meaning (flashcard style, e.g. "đàm phán, thương lượng")
- "example": one short, natural English example sentence (10-15 words) using the word in a TOEIC business/everyday context
- Use the part of speech and definition hint to disambiguate if the word has multiple meanings
- "vi" must be in Vietnamese

{"vi":"...","example":"..."}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ vi: "", example: "" });

    const parsed = JSON.parse(match[0]) as { vi?: string; example?: string };
    return NextResponse.json({
      vi: typeof parsed.vi === "string" ? parsed.vi : "",
      example: typeof parsed.example === "string" ? parsed.example : "",
    });
  } catch {
    return NextResponse.json({ vi: "", example: "" }, { status: 500 });
  }
}
