import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript required" }, { status: 400 });
    }

    const prompt = `You are a TOEIC vocabulary coach. Given an audio transcript, identify 5-8 important English vocabulary words or phrases that a TOEIC learner should know.

Transcript:
"""
${transcript.slice(0, 1200)}
"""

For each word/phrase, provide:
- word: the vocabulary item (base/dictionary form)
- ipa: IPA pronunciation (e.g., /ˈvɒkəbjʊleri/)
- partOfSpeech: one of: noun, verb, adjective, adverb, phrase, idiom
- meaning: Vietnamese translation (concise, 2-6 words)
- example: a natural short example sentence using the word (not the transcript sentence)

Rules:
- Prioritize TOEIC-relevant business/everyday vocabulary
- Skip extremely common words like "the", "is", "and"
- Prefer words that appear in the transcript

Return ONLY a valid JSON array, no explanation:
[{"word":"...","ipa":"...","partOfSpeech":"...","meaning":"...","example":"..."}]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const text = response.text ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ items: [] });

    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return NextResponse.json({ items: [] });

    const items = parsed
      .filter(
        (item): item is Record<string, string> =>
          typeof item === "object" && item !== null &&
          typeof (item as Record<string, unknown>).word === "string"
      )
      .map((item) => ({
        word: item.word ?? "",
        ipa: item.ipa ?? "",
        partOfSpeech: item.partOfSpeech ?? "",
        meaning: item.meaning ?? "",
        example: item.example ?? "",
      }))
      .slice(0, 8);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Vocabulary extraction failed" }, { status: 500 });
  }
}
