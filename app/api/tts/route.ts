import { NextRequest, NextResponse } from "next/server";

/**
 * Q1 — ElevenLabs Text-to-Speech
 * POST /api/tts  { text: string }
 * Returns { audioContent: string } — base64-encoded MP3
 *
 * Requires env var: ELEVENLABS_API_KEY
 * Voice: Rachel (21m00Tcm4TlvDq8ikWAM) — clear American English, tự nhiên
 * Model: eleven_turbo_v2_5 — nhanh, phù hợp từ đơn lẻ
 */

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — American English
const MODEL_ID = "eleven_turbo_v2_5";

export async function POST(request: NextRequest) {
  const { text } = (await request.json().catch(() => ({}))) as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // Graceful degradation — client sẽ fallback về Web Speech API
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[/api/tts] ElevenLabs error:", res.status, errText);
    return NextResponse.json({ error: "TTS upstream error" }, { status: 502 });
  }

  // Convert binary MP3 → base64 (giữ nguyên interface với client)
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return NextResponse.json({ audioContent: base64 });
}
