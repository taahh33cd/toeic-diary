// Nghe lại bài nói của học viên: ra bản ghi chữ, và nếu có văn bản gốc thì ra
// cả điểm phát âm.
//
// Hai nguồn:
// - Azure Speech — bản ghi + độ tin cậy từng từ; thêm điểm phát âm/lưu loát/ngữ
//   điệu khi có `referenceText` (đúng kiểu gọi đang chạy ở /api/speaking/assess).
// - Gemini — nghe thẳng file ogg, chỉ ra bản ghi chữ.
//
// Gói Azure free F0 chỉ ~5 giờ tiếng nói mỗi tháng cho cả site. Không đếm phút
// (đếm thì phải đoán), mà cứ gọi: hết hạn mức Azure trả lỗi quota và code rơi
// sang Gemini — học viên không bị chặn, chỉ mất điểm phát âm.

import { durationFromWavHead, fetchAudio, oggUrl, wavDurationSec, wavUrl } from "./audio";
import { generateJson, MODEL_LIGHT } from "../json";

export interface PronScores {
  accuracy: number;
  fluency: number;
  prosody: number;
  completeness: number;
  overall: number;
}

export interface Heard {
  /** "ok" = nghe được; ba trạng thái còn lại là audio không dùng được. */
  status: "ok" | "silent" | "noisy" | "unrecognized";
  transcript: string;
  /** Độ dài bài nói (giây) — đo từ file, không phải do client gửi. */
  durationSec: number | null;
  /** Chỉ có khi chấm bằng Azure kèm văn bản gốc (Q1-2 đọc to). */
  pron?: PronScores;
  /** Số từ Azure nghe không chắc (confidence thấp) — dấu hiệu phát âm khó hiểu. */
  lowConfidenceWords?: number;
  source: "azure" | "gemini";
}

const AZURE_STATUS: Record<string, Heard["status"]> = {
  NoMatch: "unrecognized",
  InitialSilenceTimeout: "silent",
  BabbleTimeout: "noisy",
};

interface AzureWord {
  Word?: string;
  AccuracyScore?: number;
  Confidence?: number;
}

interface AzureNBest {
  Display?: string;
  Lexical?: string;
  AccuracyScore?: number;
  FluencyScore?: number;
  ProsodyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  Confidence?: number;
  Words?: AzureWord[];
}

function azureConfigured(): boolean {
  return Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
}

/** Lỗi đáng để chuyển sang Gemini (hết hạn mức, bị chặn, quá tải). */
function shouldFallBack(status: number): boolean {
  return status === 401 || status === 403 || status === 429 || status >= 500;
}

async function azureListen(wav: Buffer, referenceText?: string): Promise<Heard | null> {
  const region = process.env.AZURE_SPEECH_REGION!;
  const key = process.env.AZURE_SPEECH_KEY!;

  const headers: Record<string, string> = {
    "Ocp-Apim-Subscription-Key": key,
    "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
  };
  // Chỉ bật đánh giá phát âm khi CÓ văn bản gốc. Phần nói tự do dùng nhận dạng
  // thường — vừa là đường đã chạy ổn, vừa không phụ thuộc tính năng chấm phát
  // âm không văn bản gốc.
  if (referenceText) {
    headers["Pronunciation-Assessment"] = Buffer.from(
      JSON.stringify({
        ReferenceText: referenceText,
        GradingSystem: "HundredMark",
        Dimension: "Comprehensive",
        EnableMiscue: true,
      }),
    ).toString("base64");
  }

  const res = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
    { method: "POST", headers, body: new Uint8Array(wav) },
  );

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    console.error(`[speaking] Azure ${res.status}: ${detail}`);
    if (shouldFallBack(res.status)) return null; // để caller dùng Gemini
    throw new Error(`Azure lỗi ${res.status}`);
  }

  const data = (await res.json()) as { RecognitionStatus?: string; Duration?: number; NBest?: AzureNBest[] };
  const status = data.RecognitionStatus ?? "";
  if (status !== "Success") {
    return {
      status: AZURE_STATUS[status] ?? "unrecognized",
      transcript: "",
      durationSec: data.Duration ? data.Duration / 1e7 : null,
      source: "azure",
    };
  }

  const best = data.NBest?.[0];
  const words = best?.Words ?? [];
  const pron = referenceText && best?.PronScore != null
    ? {
        accuracy: Math.round(best.AccuracyScore ?? 0),
        fluency: Math.round(best.FluencyScore ?? 0),
        prosody: Math.round(best.ProsodyScore ?? 0),
        completeness: Math.round(best.CompletenessScore ?? 0),
        overall: Math.round(best.PronScore ?? 0),
      }
    : undefined;

  return {
    status: "ok",
    transcript: (best?.Display ?? best?.Lexical ?? "").trim(),
    durationSec: data.Duration ? Math.round((data.Duration / 1e7) * 10) / 10 : null,
    pron,
    lowConfidenceWords: words.filter((w) => (w.AccuracyScore ?? w.Confidence ?? 100) < 60).length,
    source: "azure",
  };
}

async function geminiListen(ogg: Buffer, durationSec: number | null): Promise<Heard> {
  const raw = await generateJson<{ transcript?: unknown; speech?: unknown }>(MODEL_LIGHT, [
    {
      inlineData: { mimeType: "audio/ogg", data: ogg.toString("base64") },
    },
    {
      text: `This is a TOEIC Speaking test recording made by a Vietnamese learner of English.

Write down EXACTLY what you hear, word for word. Do not fix grammar, do not fix pronunciation, do not add anything the speaker did not say. Keep filler sounds like "um" and "uh". If the speaker says nothing at all, or there is only noise, return an empty transcript.

Write only the words. No timestamps, no speaker labels, no line numbers.

Respond with ONLY a JSON object: {"speech": <true nếu có người nói, false nếu im lặng hoặc chỉ tiếng ồn>, "transcript": "<nguyên văn lời nói>"}`,
    },
  ]);

  // Gemini vẫn hay chèn mốc thời gian kiểu "00:04" dù đã bảo đừng — cắt bỏ,
  // không thì nó lọt vào cả lời nhận xét cho học viên.
  const transcript = (typeof raw?.transcript === "string" ? raw.transcript : "")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\b/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const hasSpeech = raw?.speech !== false && transcript.length > 0;
  return {
    status: hasSpeech ? "ok" : "silent",
    transcript,
    durationSec,
    source: "gemini",
  };
}

/**
 * Nghe một bài nói. `referenceText` chỉ truyền cho Q1-2 (đọc to).
 *
 * Azure báo im lặng/không nhận ra thì vẫn hỏi Gemini một lần nữa trước khi kết
 * luận: bảo học viên ghi âm lại trong khi họ đã nói thật là mất công vô ích.
 */
export async function listen(audioUrl: string, referenceText?: string): Promise<Heard> {
  const wav = wavUrl(audioUrl);
  const ogg = oggUrl(audioUrl);
  if (!wav || !ogg) throw new Error("Audio không nằm trên Cloudinary nên không chấm được");

  let heard: Heard | null = null;
  let durationSec: number | null = null;

  if (azureConfigured()) {
    const buf = await fetchAudio(wav);
    durationSec = wavDurationSec(buf);
    heard = await azureListen(buf, referenceText);
    if (heard?.status === "ok") {
      return { ...heard, durationSec: heard.durationSec ?? durationSec };
    }
  }

  // Nhánh Gemini chỉ tải ogg, nên độ dài phải hỏi riêng bằng một HEAD rẻ tiền.
  const fromGemini = await geminiListen(await fetchAudio(ogg), durationSec ?? (await durationFromWavHead(wav)));
  // Azure nghe ra im lặng mà Gemini cũng vậy thì chắc chắn audio hỏng; Gemini
  // nghe ra chữ thì chấm tiếp bằng bản của Gemini (mất điểm phát âm).
  if (fromGemini.status !== "ok" && heard) return { ...heard, durationSec: heard.durationSec ?? durationSec };
  return fromGemini;
}
