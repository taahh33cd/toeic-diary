import { NextRequest, NextResponse } from "next/server";

/**
 * TTS — Google Cloud Text-to-Speech Neural2-F
 * POST /api/tts  { text: string }
 * Returns { audioContent: string } — base64-encoded MP3
 *
 * Requires env var: GOOGLE_TTS_KEY
 * Voice: en-US-Neural2-F — clear American English female
 */

const TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export async function POST(request: NextRequest) {
  const { text } = (await request.json().catch(() => ({}))) as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_TTS_KEY;
  if (!apiKey) {
    // Graceful degradation — client sẽ fallback về Web Speech API
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  const res = await fetch(`${TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: text.trim() },
      voice: { languageCode: "en-US", name: "en-US-Neural2-F" },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[/api/tts] Google TTS error:", res.status, errText);
    return NextResponse.json({ error: "TTS upstream error" }, { status: 502 });
  }

  // Google TTS trả về { audioContent: base64 } trực tiếp
  const { audioContent } = await res.json();

  return NextResponse.json({ audioContent });
}
