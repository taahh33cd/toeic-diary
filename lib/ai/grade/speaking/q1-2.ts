// Chấm Speaking Questions 1-2 — "Read a text aloud".
//
// Đây là part điểm gần như do máy đo: có văn bản gốc nên Azure so được từng từ
// và trả điểm phát âm, lưu loát, ngữ điệu, mức đọc đủ. Rubric 0-3 suy ra từ hai
// con số đó, AI chỉ viết lời nhận xét cho dễ đọc.
//
// Không có Azure (chưa cấu hình hoặc hết hạn mức) thì đo bằng cách so bản ghi
// chữ của Gemini với văn bản gốc — thô hơn nhưng vẫn có điểm.

import { Q12_READ_SECONDS, getQ12Test } from "@/lib/skills/speaking-q1-2";
import type { FeedbackItem, SubmissionItem } from "@/lib/submissions";
import { generateJson, MODEL_LIGHT } from "../json";
import type { GradedItem } from "./../types";
import { listen, type Heard } from "./listen";
import { AUDIO_PROBLEM, type SpeakingRubric } from "./shared";

/** Chuẩn hoá về danh sách từ để so bản đọc với văn bản gốc. */
function words(text: string): string[] {
  return text.toLowerCase().split(/[^a-z']+/).filter(Boolean);
}

/**
 * Tỉ lệ từ của văn bản gốc xuất hiện trong bản ghi, theo đúng thứ tự
 * (dãy con chung dài nhất / số từ gốc). Dùng khi không có điểm Azure.
 */
function readRatio(reference: string, transcript: string): number {
  const a = words(reference);
  const b = words(transcript);
  if (a.length === 0) return 0;

  // Dãy con chung dài nhất, chạy theo hàng để không tốn bộ nhớ.
  let prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length] / a.length;
}

/**
 * Rubric 0-3 từ điểm Azure.
 * `overall` (PronScore) là điểm tổng hợp của Azure; `completeness` cho biết đọc
 * được bao nhiêu phần văn bản — đọc nửa bài thì phát âm hay cũng không thể 3.
 */
function scoreFromAzure(pron: { overall: number; completeness: number }): { score: SpeakingRubric; why: string | null } {
  const { overall, completeness } = pron;
  if (completeness < 40) return { score: 1, why: "Mới đọc được một phần nhỏ của đoạn văn." };

  let score: SpeakingRubric = overall >= 80 ? 3 : overall >= 60 ? 2 : overall >= 35 ? 1 : 0;
  let why: string | null = null;
  if (completeness < 75 && score > 2) {
    score = 2;
    why = "Phát âm tốt nhưng chưa đọc hết đoạn văn.";
  }
  return { score, why };
}

function scoreFromRatio(ratio: number): { score: SpeakingRubric; why: string | null } {
  if (ratio >= 0.9) return { score: 3, why: null };
  if (ratio >= 0.7) return { score: 2, why: "Đọc thiếu hoặc sai một số từ so với đoạn văn." };
  if (ratio >= 0.4) return { score: 1, why: "Bỏ sót khá nhiều từ trong đoạn văn." };
  return { score: 0, why: "Bản đọc gần như không khớp đoạn văn trên đề." };
}

async function comment(reference: string, heard: Heard, score: SpeakingRubric): Promise<string> {
  const raw = await generateJson<{ comment?: unknown }>(
    MODEL_LIGHT,
    `A Vietnamese learner read this English text aloud in a TOEIC Speaking test (Questions 1-2):
"""
${reference}
"""

This is what the speech recogniser heard (it may differ from the text exactly where the learner mispronounced or skipped words):
"""
${heard.transcript}
"""

${heard.pron ? `Machine scores out of 100 — pronunciation accuracy ${heard.pron.accuracy}, fluency ${heard.pron.fluency}, intonation ${heard.pron.prosody}, how much of the text was read ${heard.pron.completeness}.` : "No pronunciation scores are available for this recording."}
The rubric score given is ${score} out of 3.

Write 2-3 sentences of feedback in VIETNAMESE for this learner. Name the concrete words or phrases where the reading went wrong (compare the two texts above), then one thing to practise. Do not mention that a machine graded it, and do not repeat the scores as numbers.

Respond with ONLY a JSON object: {"comment": "<nhận xét TIẾNG VIỆT>"}`,
  );
  return typeof raw?.comment === "string" ? raw.comment.trim() : "";
}

export async function gradeSpeakingQ12(testKey: string, items: SubmissionItem[]): Promise<GradedItem[]> {
  const test = getQ12Test(testKey);
  if (!test) throw new Error(`Không tìm thấy bộ đề Speaking Q1-2 "${testKey}"`);

  const out: GradedItem[] = [];
  // Tuần tự: gói Azure free chỉ cho 1 yêu cầu cùng lúc.
  for (const item of items) {
    const text = test.texts[item.idx];
    if (!text) continue;

    if (!item.audioUrl) {
      out.push({ feedback: { idx: item.idx, score: 0, comment: "Chưa ghi âm câu này nên tính 0 điểm." }, annotations: [] });
      continue;
    }

    const heard = await listen(item.audioUrl, text.text);
    if (heard.status !== "ok") {
      out.push({ feedback: { idx: item.idx, comment: AUDIO_PROBLEM[heard.status] }, annotations: [] });
      continue;
    }

    const { score, why } = heard.pron
      ? scoreFromAzure(heard.pron)
      : scoreFromRatio(readRatio(text.text, heard.transcript));

    const note = await comment(text.text, heard, score);
    const used = heard.durationSec
      ? `Thời lượng: ${heard.durationSec}s trên ${Q12_READ_SECONDS}s cho phép.`
      : null;

    out.push({
      feedback: {
        idx: item.idx,
        score,
        comment: [note, why, used].filter(Boolean).join("\n"),
      },
      annotations: [],
    });
  }
  return out;
}
