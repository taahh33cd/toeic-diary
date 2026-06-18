import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAdminDb } from "@/lib/firebase/admin";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function cacheKey(word: string) {
  return word.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
}

async function readCache(word: string): Promise<{ vi: string; example: string } | null> {
  try {
    const snap = await getAdminDb().ref(`vocab_word_cache/${cacheKey(word)}`).get();
    if (!snap.exists()) return null;
    const val = snap.val() as { vi?: string; example?: string };
    return val?.vi ? { vi: val.vi, example: val.example ?? "" } : null;
  } catch {
    return null;
  }
}

async function writeCache(word: string, vi: string, example: string) {
  try {
    await getAdminDb()
      .ref(`vocab_word_cache/${cacheKey(word)}`)
      .set({ vi, example, ts: Date.now() });
  } catch {
    // Non-fatal — cache miss on next request is fine
  }
}

async function geminiTranslate(
  word: string,
  pos: string,
  definition: string,
  attempt = 0
): Promise<{ vi: string; example: string } | null> {
  const posHint = pos ? ` (${pos})` : "";
  const defHint = definition ? `\nEnglish definition: "${definition.slice(0, 200)}"` : "";

  const prompt = `You are a TOEIC vocabulary coach. Give a concise Vietnamese translation for this English word.

Word: "${word}"${posHint}${defHint}

Respond with ONLY a JSON object in this exact format (no extra text, no markdown):
{"vi":"2-5 từ tiếng Việt ngắn gọn","example":"one short TOEIC English sentence using the word"}

Example output for "negotiate":
{"vi":"đàm phán, thương lượng","example":"The sales team negotiated a new contract with the client."}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = (response.text ?? "").trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as { vi?: string; example?: string };
    const vi = typeof parsed.vi === "string" ? parsed.vi : "";
    const example = typeof parsed.example === "string" ? parsed.example : "";
    return vi ? { vi, example } : null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Retry once on transient server errors (503, overloaded)
    if (attempt === 0 && (msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE"))) {
      await new Promise((r) => setTimeout(r, 1200));
      return geminiTranslate(word, pos, definition, 1);
    }
    throw err;
  }
}

async function myMemoryTranslate(word: string): Promise<string> {
  const emailParam = process.env.MYMEMORY_EMAIL
    ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}`
    : "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi${emailParam}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return "";
  const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
  return data.responseStatus === 200 ? (data.responseData?.translatedText ?? "") : "";
}

export async function POST(req: NextRequest) {
  const { word, pos, definition } = await req.json().catch(() => ({})) as {
    word?: string; pos?: string; definition?: string;
  };
  if (!word || typeof word !== "string") {
    return NextResponse.json({ error: "word required" }, { status: 400 });
  }

  const w = word.trim();

  // 1. Firestore cache
  const cached = await readCache(w);
  if (cached) return NextResponse.json(cached);

  // 2. Gemini (best quality: Vietnamese + example sentence)
  let vi = "";
  let example = "";

  try {
    const result = await geminiTranslate(w, pos ?? "", definition ?? "");
    if (result) { vi = result.vi; example = result.example; }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[word-meaning] Gemini error:", msg.slice(0, 200));
  }

  // 3. MyMemory fallback (free, 1000–10000 req/day)
  if (!vi) {
    vi = await myMemoryTranslate(w).catch(() => "");
  }

  // 4. Write cache so future requests are free
  if (vi) await writeCache(w, vi, example);

  return NextResponse.json({ vi, example });
}
