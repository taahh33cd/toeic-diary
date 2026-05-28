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

Respond with ONLY a JSON object in this exact format (no extra text, no markdown):
{"vi":"2-5 từ tiếng Việt ngắn gọn","example":"one short TOEIC English sentence using the word"}

Example output for "negotiate":
{"vi":"đàm phán, thương lượng","example":"The sales team negotiated a new contract with the client."}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = (response.text ?? "").trim();
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error("[word-meaning] No JSON in response:", text.slice(0, 200));
      return NextResponse.json({ vi: "", example: "" });
    }

    const parsed = JSON.parse(match[0]) as { vi?: string; example?: string };
    return NextResponse.json({
      vi: typeof parsed.vi === "string" ? parsed.vi : "",
      example: typeof parsed.example === "string" ? parsed.example : "",
    });
  } catch (err) {
    console.error("[word-meaning] Error:", err);
    return NextResponse.json({ vi: "", example: "" }, { status: 500 });
  }
}
