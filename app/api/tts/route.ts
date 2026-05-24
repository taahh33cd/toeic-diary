import { NextRequest, NextResponse } from "next/server";

/**
 * Q1 — Google Cloud Text-to-Speech
 * POST /api/tts  { text: string }
 * Returns { audioContent: string } — base64-encoded MP3
 *
 * Requires env var: GOOGLE_TTS_API_KEY
 * (Google Cloud API key with Text-to-Speech API enabled)
 */
export async function POST(request: NextRequest) {
  const { text } = await request.json().catch(() => ({})) as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    // Graceful degradation: client will fall back to Web Speech API
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: text.trim() },
        voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.85 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[/api/tts] Google TTS error:", res.status, errText);
    return NextResponse.json({ error: "TTS upstream error" }, { status: 502 });
  }

  const { audioContent } = (await res.json()) as { audioContent: string };
  return NextResponse.json({ audioContent });
}
