// Chuyển bản thu của học viên thành chữ (subskill Đặt câu nhanh · nhánh Nói).
//
// Khác /api/speaking/assess: ở đó có câu mẫu nên gọi Pronunciation Assessment.
// Ở đây học viên tự nghĩ ra câu, không có câu tham chiếu, nên dùng đúng endpoint
// nhận dạng tự do — bỏ header Pronunciation-Assessment và lấy DisplayText.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STATUS_MESSAGES: Record<string, string> = {
  NoMatch: "Không nhận ra tiếng nói. Nói to và rõ hơn giúp mình.",
  InitialSilenceTimeout: "Không nghe thấy gì. Nói ngay sau khi bấm ghi âm.",
  BabbleTimeout: "Ồn quá. Thử lại ở chỗ yên tĩnh hơn.",
  Error: "Azure gặp lỗi nội bộ. Thử lại giúp mình.",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio") as Blob | null;
  if (!audio) return NextResponse.json({ error: "Thiếu bản thu" }, { status: 400 });

  const region = process.env.AZURE_SPEECH_REGION;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!region || !key) {
    return NextResponse.json({ error: "Chưa cấu hình Azure Speech" }, { status: 500 });
  }

  const azureRes = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
      },
      body: await audio.arrayBuffer(),
    },
  );

  if (!azureRes.ok) {
    const detail = await azureRes.text();
    console.error("sentence-stt azure:", azureRes.status, detail.slice(0, 300));
    return NextResponse.json({ error: `Azure lỗi ${azureRes.status}` }, { status: 502 });
  }

  const data = (await azureRes.json()) as {
    RecognitionStatus?: string;
    DisplayText?: string;
    NBest?: { Display?: string; Lexical?: string }[];
  };

  const status = data.RecognitionStatus;
  if (status && status !== "Success") {
    return NextResponse.json(
      { error: STATUS_MESSAGES[status] ?? `Nhận dạng thất bại: ${status}` },
      { status: 422 },
    );
  }

  const transcript = (data.DisplayText ?? data.NBest?.[0]?.Display ?? "").trim();
  if (!transcript) {
    return NextResponse.json({ error: "Bản thu không có câu nào nghe được." }, { status: 422 });
  }

  return NextResponse.json({ transcript });
}
