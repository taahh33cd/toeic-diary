// Chấm bài đọc theo chunk (Chunking · nhánh Nói · cấp 3).
//
// Azure Pronunciation Assessment trả mốc thời gian TỪNG TỪ, nên đo được nhịp
// ngắt thật của người đọc chứ không chỉ lấy điểm tổng như /api/speaking/assess.
//
// Ngưỡng ở đây được hiệu chỉnh bằng chính giọng phát thanh viên trong đề EST
// 2026 (xem ghi chú dưới), vì đo thử cho thấy một điều phải tôn trọng:
//
//   • Im lặng CHỈ đánh dấu được chỗ ngắt lớn. Ở 9/14 ranh giới cụm, phát thanh
//     viên bản ngữ không để lại khoảng lặng nào đo được (mốc Azure lượng tử hoá
//     theo 10ms). Nên nếu bắt lỗi "quên ngắt" ở mọi ranh giới thì chính giọng
//     chuẩn cũng trượt — thành ra dạy sai.
//   • Ranh giới cụm trong tiếng Anh chủ yếu được đánh dấu bằng KÉO DÀI âm cuối
//     cụm. Tín hiệu này có thật và nhất quán (từ cuối cụm dài gấp ~1.2-1.6 lần
//     từ giữa cụm) nhưng quá yếu để phán từng chỗ, nên chỉ dùng làm chỉ số
//     TỔNG THỂ "có gom cụm hay không", không chỉ mặt từng vị trí.
//
// Vì vậy chấm bằng ba chỉ số, mỗi cái chỉ nói đúng phần nó đo được:
//   1. Ngắt lớn   — ranh giới sau dấu câu, đo bằng im lặng. Rất sạch, chỉ được đích danh.
//   2. Nhịp cụm   — tỉ lệ kéo dài cuối cụm so với giữa cụm. Chỉ số tổng thể.
//   3. Ngắt giữa cụm — im lặng dài trong lòng một cụm. Rất sạch, chỉ được đích danh.

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSpeakPassage, getSpeakSample, type SpeakChunk } from "@/lib/subskills/chunking/speak";
import { attemptPart } from "@/lib/subskills/chunking";

/** Im lặng từ mức này ở chỗ ngắt lớn mới tính là có dừng. */
const MAJOR_PAUSE_SECONDS = 0.1;
/** Im lặng từ mức này trong lòng một cụm là ngắt sai, nghe thành lắp. */
const INTRUSIVE_SECONDS = 0.25;
/**
 * Tỉ lệ kéo dài cuối cụm của giọng bản ngữ, đo trên 5 đoạn Part 4 đề EST 2026:
 * 1.24 / 1.51 / 1.59 / 1.36 / 1.26. Lấy 1.35 làm mốc "đạt chuẩn người bản ngữ".
 */
const NATIVE_LENGTHENING = 1.35;
/** Azure trả Offset/Duration theo tick 100 nano giây. */
const TICKS_PER_SECOND = 1e7;

const GEMINI_MODEL = "gemini-2.5-flash-lite";

type AzureWord = {
  Word: string;
  Offset: number;
  Duration: number;
  PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string };
};

/** Gom chunk của một nguồn thành danh sách phẳng + vị trí ranh giới theo từ. */
function flatten(chunks: SpeakChunk[]) {
  const words: string[] = [];
  const boundaries: number[] = [];
  chunks.forEach((c, i) => {
    if (i > 0) boundaries.push(words.length);
    words.push(...c.en.split(/\s+/));
  });
  return { words, boundaries };
}

function resolveSource(kind: string, sourceId: string) {
  if (kind === "passage") {
    const p = getSpeakPassage(sourceId);
    if (!p) return null;
    return { chunks: p.sentences.flatMap((s) => s.chunks) };
  }
  const s = getSpeakSample(sourceId);
  if (!s) return null;
  return { chunks: s.chunks };
}

/** Ước số âm tiết, để so thời lượng giữa từ dài và từ ngắn cho công bằng. */
function syllables(word: string): number {
  const s = word.toLowerCase().replace(/[^a-z]/g, "");
  const groups = s.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  if (s.endsWith("e") && n > 1) n--;
  return Math.max(1, n);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio") as Blob | null;
  const kind = (form.get("kind") as string | null) ?? "passage";
  const sourceId = (form.get("sourceId") as string | null) ?? "";
  const exerciseIndex = Number.parseInt((form.get("exerciseIndex") as string) ?? "0", 10) || 0;

  if (!audio || !sourceId) {
    return NextResponse.json({ error: "Thiếu bản thu hoặc mã bài" }, { status: 400 });
  }

  const source = resolveSource(kind, sourceId);
  if (!source) return NextResponse.json({ error: "Không có bài này" }, { status: 404 });

  const sourceChunks = source.chunks;
  const { words: refWords, boundaries } = flatten(sourceChunks);
  const referenceText = refWords.join(" ");

  const region = process.env.AZURE_SPEECH_REGION;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!region || !key) {
    return NextResponse.json({ error: "Chưa cấu hình Azure Speech" }, { status: 503 });
  }

  const assessmentConfig = Buffer.from(
    JSON.stringify({
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Dimension: "Comprehensive",
      EnableMiscue: false,
      EnableProsodyAssessment: true,
    })
  ).toString("base64");

  const azureRes = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Pronunciation-Assessment": assessmentConfig,
      },
      body: await audio.arrayBuffer(),
    }
  );

  if (!azureRes.ok) {
    const detail = await azureRes.text().catch(() => "");
    console.error("[chunk-read] Azure lỗi", azureRes.status, detail.slice(0, 300));
    return NextResponse.json({ error: `Azure lỗi ${azureRes.status}` }, { status: 502 });
  }

  const data = await azureRes.json();

  const STATUS_MESSAGES: Record<string, string> = {
    NoMatch: "Không nhận ra giọng đọc. Hãy đọc to và rõ hơn.",
    InitialSilenceTimeout: "Không thấy tiếng nói. Đọc ngay sau khi bấm ghi âm.",
    BabbleTimeout: "Quá nhiều tiếng ồn. Thử lại ở nơi yên tĩnh hơn.",
    Error: "Azure gặp lỗi nội bộ. Thử lại giúp.",
  };
  const status = data.RecognitionStatus as string | undefined;
  if (status && status !== "Success") {
    return NextResponse.json(
      { error: STATUS_MESSAGES[status] ?? `Nhận diện thất bại: ${status}` },
      { status: 422 }
    );
  }

  const nBest = data.NBest?.[0];
  const azureWords: AzureWord[] = (nBest?.Words ?? []).filter(
    (w: AzureWord) => w.PronunciationAssessment?.ErrorType !== "Insertion"
  );
  if (azureWords.length === 0) {
    return NextResponse.json(
      { error: "Azure không trả về mốc từng từ. Thu lại giúp." },
      { status: 502 }
    );
  }

  const limit = Math.min(azureWords.length, refWords.length);
  const spoken = (i: number) =>
    i < limit && azureWords[i].PronunciationAssessment?.ErrorType !== "Omission";

  // Khoảng lặng ngay trước từ thứ i, giây. null = không đo được.
  const gapBefore = new Array<number | null>(refWords.length).fill(null);
  for (let i = 1; i < limit; i++) {
    if (!spoken(i - 1) || !spoken(i)) continue;
    const prev = azureWords[i - 1];
    gapBefore[i] = Math.max(0, (azureWords[i].Offset - (prev.Offset + prev.Duration)) / TICKS_PER_SECOND);
  }

  /** Cụm chứa vị trí từ thứ `i`, để nói rõ lỗi nằm ở cụm nào. */
  function chunkTextAt(i: number): string {
    let acc = 0;
    for (const c of sourceChunks) {
      const n = c.en.split(/\s+/).length;
      if (i < acc + n) return c.en;
      acc += n;
    }
    return sourceChunks[sourceChunks.length - 1]?.en ?? "";
  }

  // ── 1. Ngắt lớn: ranh giới mà từ đứng trước kết thúc bằng dấu câu ─────────
  const majorPositions = boundaries.filter((b) => /[,;:.!?]["')\]]?$/.test(refWords[b - 1] ?? ""));
  const majorMeasured = majorPositions.filter((b) => gapBefore[b] !== null);
  const majorHit = majorMeasured.filter((b) => gapBefore[b]! >= MAJOR_PAUSE_SECONDS);
  const majorMissed = majorMeasured
    .filter((b) => gapBefore[b]! < MAJOR_PAUSE_SECONDS)
    .map((b) => ({ after: chunkTextAt(b - 1), before: chunkTextAt(b) }));

  // ── 2. Nhịp cụm: kéo dài âm cuối cụm so với từ nằm giữa cụm ───────────────
  const chunkFinal = new Set(boundaries.map((b) => b - 1));
  const perSyllable: (number | null)[] = refWords.map((w, i) =>
    spoken(i) ? azureWords[i].Duration / TICKS_PER_SECOND / syllables(w) : null
  );
  const finalDur: number[] = [];
  const innerDur: number[] = [];
  perSyllable.forEach((d, i) => {
    if (d === null || i === refWords.length - 1) return;
    (chunkFinal.has(i) ? finalDur : innerDur).push(d);
  });
  const innerMedian = median(innerDur);
  const lengthening = innerMedian > 0 ? median(finalDur) / innerMedian : 0;
  const groupingScore = Math.max(
    0,
    Math.min(1, (lengthening - 1) / (NATIVE_LENGTHENING - 1))
  );

  // ── 3. Ngắt giữa cụm: im lặng dài ở chỗ không phải ranh giới ──────────────
  const boundarySet = new Set(boundaries);
  const intrusiveBreaks: { chunk: string; at: string }[] = [];
  for (let i = 1; i < refWords.length; i++) {
    if (boundarySet.has(i)) continue;
    const gap = gapBefore[i];
    if (gap !== null && gap >= INTRUSIVE_SECONDS) {
      intrusiveBreaks.push({ chunk: chunkTextAt(i), at: `${refWords[i - 1]} | ${refWords[i]}` });
    }
  }

  const majorScore = majorMeasured.length === 0 ? 1 : majorHit.length / majorMeasured.length;
  const cleanScore = Math.max(
    0,
    1 - intrusiveBreaks.length / Math.max(3, boundaries.length)
  );
  const chunkScore = Math.round(100 * (0.45 * majorScore + 0.35 * groupingScore + 0.2 * cleanScore));

  const scores = {
    chunkScore,
    pronunciationScore: Math.round(nBest?.AccuracyScore ?? 0),
    fluencyScore: Math.round(nBest?.FluencyScore ?? 0),
    prosodyScore: Math.round(nBest?.ProsodyScore ?? nBest?.CompletenessScore ?? 0),
    overallScore: Math.round(nBest?.PronScore ?? 0),
  };

  // ── Lời khuyên tiếng Việt, dựa trên đúng những chỗ đo được ────────────────
  let advice = "";
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Bạn là giáo viên TOEIC Speaking, nhận xét cho học viên Việt Nam về việc ĐỌC THÀNH CỤM (chunking).

Số liệu đo từ bản thu:
- Dừng đúng ${majorHit.length}/${majorMeasured.length} chỗ ngắt lớn (sau dấu câu)
- Đọc trôi qua, không dừng ở: ${majorMissed.map((m) => `sau "${m.after}"`).slice(0, 5).join("; ") || "không có"}
- Mức kéo dài âm cuối cụm: ${lengthening.toFixed(2)} lần (người bản ngữ khoảng ${NATIVE_LENGTHENING}; bằng 1.00 nghĩa là đọc đều tăm tắp, không gom cụm)
- Ngắt sai giữa lòng cụm: ${intrusiveBreaks.map((m) => `"${m.at}"`).slice(0, 5).join("; ") || "không có"}
- Điểm phát âm ${scores.pronunciationScore}, độ trôi ${scores.fluencyScore}, ngữ điệu ${scores.prosodyScore}

Viết 2-3 câu tiếng Việt: nói thẳng lỗi lớn nhất về nhịp đọc và một cách sửa cụ thể làm được ngay. Không khen suông, không nhắc lại số liệu.

Chỉ trả JSON: {"advice": "<tiếng Việt>"}`;
      const res = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      const match = (res.text ?? "").match(/\{[\s\S]*\}/);
      if (match) advice = JSON.parse(match[0]).advice ?? "";
    } catch (err) {
      console.error("[chunk-read] Gemini lỗi", err);
    }
  }

  // Điểm nhịp ngắt vào bảng chung của subskills; điểm phát âm của Azure vẫn vào
  // bảng riêng để xem lại tiến bộ phát âm.
  try {
    await prisma.subskillAttempt.create({
      data: {
        userId: user.id,
        part: attemptPart("noi"),
        questionWord: "l3",
        exerciseIndex,
        score: chunkScore,
        passed: chunkScore >= 70,
      },
    });
    await prisma.$executeRaw`
      INSERT INTO speaking_recording_attempts
        (id, user_id, skill_id, test_num, exercise_index, reference_text,
         pronunciation_score, fluency_score, prosody_score, overall_score)
      VALUES
        (${crypto.randomUUID()}, ${user.id}, ${`chunking-${sourceId}`}, 0, ${exerciseIndex},
         ${referenceText}, ${scores.pronunciationScore}, ${scores.fluencyScore},
         ${scores.prosodyScore}, ${scores.overallScore})
    `;
  } catch (err) {
    // Mất DB thì vẫn trả kết quả cho học viên xem
    console.error("[chunk-read] lưu điểm thất bại", err);
  }

  return NextResponse.json({
    scores,
    major: { total: majorMeasured.length, hit: majorHit.length, missed: majorMissed },
    grouping: {
      ratio: +lengthening.toFixed(2),
      nativeRatio: NATIVE_LENGTHENING,
      score: Math.round(groupingScore * 100),
    },
    intrusiveBreaks,
    advice,
  });
}
