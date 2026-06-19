import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio") as Blob | null;
  const referenceText = (form.get("referenceText") as string | null)?.trim();
  const skillId = form.get("skillId") as string | null;
  const testNum = parseInt(form.get("testNum") as string);
  const exerciseIndex = parseInt(form.get("exerciseIndex") as string);

  if (!audio || !referenceText || !skillId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const region = process.env.AZURE_SPEECH_REGION;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!region || !key) {
    return NextResponse.json({ error: "Azure Speech not configured" }, { status: 500 });
  }

  const assessmentConfig = Buffer.from(
    JSON.stringify({
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Dimension: "Comprehensive",
      EnableMiscue: false,
    })
  ).toString("base64");

  const audioBuffer = await audio.arrayBuffer();

  const azureRes = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "audio/wav",
        "Pronunciation-Assessment": assessmentConfig,
      },
      body: audioBuffer,
    }
  );

  if (!azureRes.ok) {
    const detail = await azureRes.text();
    console.error("Azure Speech error:", detail);
    return NextResponse.json({ error: "Azure API error", detail }, { status: 502 });
  }

  const azureData = await azureRes.json();
  const pa = azureData.NBest?.[0]?.PronunciationAssessment;

  if (!pa) {
    return NextResponse.json({ error: "No pronunciation data in response" }, { status: 502 });
  }

  const scores = {
    pronunciationScore: Math.round(pa.AccuracyScore ?? 0),
    fluencyScore: Math.round(pa.FluencyScore ?? 0),
    prosodyScore: Math.round(pa.ProsodyScore ?? 0),
    overallScore: Math.round(pa.PronScore ?? 0),
  };

  const id = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO speaking_recording_attempts
      (id, user_id, skill_id, test_num, exercise_index, reference_text,
       pronunciation_score, fluency_score, prosody_score, overall_score)
    VALUES
      (${id}, ${user.id}, ${skillId}, ${testNum}, ${exerciseIndex}, ${referenceText},
       ${scores.pronunciationScore}, ${scores.fluencyScore}, ${scores.prosodyScore}, ${scores.overallScore})
  `;

  const words = azureData.NBest?.[0]?.Words ?? [];
  return NextResponse.json({ scores, words });
}
