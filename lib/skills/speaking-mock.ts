// Bài thi thử Speaking trọn bộ: 11 câu chạy liền mạch đúng trình tự ETS.
//
// Không có bộ đề "trọn bộ" riêng — mỗi đề thi thử được ghép từ các bộ đề lẻ
// của 5 unit theo chỉ số, nên thêm đề lẻ ở unit nào cũng làm giàu bài thi thử.

import type { SpeakingItem } from "@/components/skills/exam/SpeakingRunner";
import { Q12_DIRECTIONS, Q12_PREP_SECONDS, Q12_READ_SECONDS, Q12_TESTS } from "./speaking-q1-2";
import { Q34_PREP_SECONDS, Q34_RESPONSE_SECONDS, SPEAKING_Q34_TESTS } from "./speaking-q3-4";
import { Q57_DIRECTIONS, Q57_TESTS } from "./speaking-q5-7";
import { Q810_READ_SECONDS, SPEAKING_Q810_TESTS } from "./speaking-q8-10";
import { Q11_DIRECTIONS, Q11_PREP_SECONDS, Q11_RESPONSE_SECONDS, Q11_TESTS } from "./speaking-q11";

/** Số đề thi thử phát hành. Mỗi đề lấy bộ thứ (i mod số bộ) của từng unit. */
export const SPEAKING_MOCK_COUNT = 10;

/** Hai đề đầu mở cho mọi tài khoản. */
export const SPEAKING_MOCK_FREE = 2;

const Q34_DIRECTIONS =
  "In this part of the test, you will describe the picture on your screen in as much detail as you can. " +
  "You will have 45 seconds to prepare your response. Then you will have 30 seconds to speak about the picture.";

const Q810_DIRECTIONS =
  "In this part of the test, you will answer three questions based on the information provided. You will have " +
  "45 seconds to read the information before the questions begin. You will have three seconds to prepare and " +
  "15 seconds to respond to Questions 8 and 9. You will hear Question 10 two times. You will have three seconds " +
  "to prepare and 30 seconds to respond to Question 10.";

export interface SpeakingMock {
  index: number;
  slug: string;
  label: string;
  /** Mô tả các bộ đề thành phần, hiện ở danh sách */
  parts: string[];
  items: SpeakingItem[];
  free: boolean;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

/** Dựng đề thi thử số `index` (bắt đầu từ 1). */
export function buildSpeakingMock(index: number): SpeakingMock | null {
  if (!Number.isInteger(index) || index < 1 || index > SPEAKING_MOCK_COUNT) return null;
  const i = index - 1;

  const q12 = pick(Q12_TESTS, i);
  const q34 = pick(SPEAKING_Q34_TESTS, i);
  const q57 = pick(Q57_TESTS, i);
  const q810 = pick(SPEAKING_Q810_TESTS, i);
  const q11 = pick(Q11_TESTS, i);

  const items: SpeakingItem[] = [];

  // ── Questions 1–2: đọc to đoạn văn ────────────────────────────────
  q12.texts.forEach((t, k) => {
    items.push({
      n: items.length + 1,
      headline: "Questions 1-2: Read a text aloud",
      screenText: t.text,
      badge: `${t.genre} · ${t.genreVi}`,
      prepSeconds: Q12_PREP_SECONDS,
      responseSeconds: Q12_READ_SECONDS,
      directionsBefore: k === 0 ? { headline: "Questions 1-2", text: Q12_DIRECTIONS } : undefined,
    });
  });
  // Bộ Q1-2 "ets-sample" chỉ có 1 đoạn — bù đoạn còn thiếu bằng bộ kế tiếp
  if (items.length < 2) {
    const filler = pick(Q12_TESTS, i + 1);
    const t = filler.texts.find((x) => x.text !== q12.texts[0]?.text) ?? filler.texts[0];
    items.push({
      n: items.length + 1,
      headline: "Questions 1-2: Read a text aloud",
      screenText: t.text,
      badge: `${t.genre} · ${t.genreVi}`,
      prepSeconds: Q12_PREP_SECONDS,
      responseSeconds: Q12_READ_SECONDS,
    });
  }

  // ── Questions 3–4: mô tả tranh ────────────────────────────────────
  // Bộ Q3-4 cuối mỗi mức có thể chỉ còn 1 ảnh (chia đôi lẻ) — bù bằng bộ kế tiếp.
  const pics = q34.items.slice(0, 2);
  for (let k = 1; pics.length < 2 && k <= SPEAKING_Q34_TESTS.length; k++) {
    const extra = pick(SPEAKING_Q34_TESTS, i + k).items.find((x) => x.imageUrl !== pics[0]?.imageUrl);
    if (extra) pics.push(extra);
  }
  pics.forEach((it, k) => {
    items.push({
      n: items.length + 1,
      headline: "Questions 3-4: Describe a picture",
      imageUrl: it.imageUrl,
      imageAlt: it.imageAlt,
      prepSeconds: Q34_PREP_SECONDS,
      responseSeconds: Q34_RESPONSE_SECONDS,
      directionsBefore: k === 0 ? { headline: "Questions 3-4", text: Q34_DIRECTIONS } : undefined,
    });
  });

  // ── Questions 5–7: trả lời câu hỏi ────────────────────────────────
  q57.questions.forEach((q, k) => {
    items.push({
      n: items.length + 1,
      headline: "Questions 5-7: Respond to questions",
      audioUrls: [q.audioUrl],
      transcript: q.transcript,
      transcriptVi: q.transcriptVi,
      prepSeconds: q.prepSeconds,
      responseSeconds: q.responseSeconds,
      directionsBefore:
        k === 0
          ? { headline: "Questions 5-7", text: Q57_DIRECTIONS, tips: [`Tình huống: ${q57.situation}`] }
          : undefined,
    });
  });

  // ── Questions 8–10: trả lời theo bảng thông tin ───────────────────
  q810.questions.forEach((q, k) => {
    items.push({
      n: items.length + 1,
      headline: "Questions 8-10: Respond to questions using information provided",
      imageUrl: q810.imageUrl,
      imageAlt: q810.title,
      // Câu 8 nghe lời dẫn tình huống trước
      audioUrls: k === 0 ? [q810.introAudioUrl, q.audioUrl] : [q.audioUrl],
      transcript: q.transcript,
      prepSeconds: q.prepSeconds,
      responseSeconds: q.responseSeconds,
      readSeconds: k === 0 ? Q810_READ_SECONDS : undefined,
      directionsBefore: k === 0 ? { headline: "Questions 8-10", text: Q810_DIRECTIONS } : undefined,
    });
  });

  // ── Question 11: nêu ý kiến ───────────────────────────────────────
  items.push({
    n: items.length + 1,
    headline: "Question 11: Express an opinion",
    audioUrls: [q11.audioUrl],
    screenText: q11.question,
    transcriptVi: q11.questionVi,
    prepSeconds: Q11_PREP_SECONDS,
    responseSeconds: Q11_RESPONSE_SECONDS,
    directionsBefore: { headline: "Question 11", text: Q11_DIRECTIONS },
  });

  return {
    index,
    slug: String(index),
    label: `Đề thi thử ${index}`,
    parts: [
      `Q1-2 ${q12.label}`,
      `Q3-4 ${q34.slug}`,
      `Q5-7 ${q57.topicVi}`,
      `Q8-10 ${q810.title}`,
      `Q11 ${q11.topicVi}`,
    ],
    items,
    free: index <= SPEAKING_MOCK_FREE,
  };
}

export function listSpeakingMocks(): SpeakingMock[] {
  return Array.from({ length: SPEAKING_MOCK_COUNT }, (_, k) => buildSpeakingMock(k + 1)).filter(
    (m): m is SpeakingMock => Boolean(m),
  );
}

/** Directions mở đầu bài thi Speaking, nguyên văn ETS. */
export const SPEAKING_TEST_DIRECTIONS =
  "This is the TOEIC Speaking test. This test includes eleven questions that measure different aspects of your " +
  "speaking ability. The test lasts approximately 20 minutes. For each type of question, you will be given " +
  "specific directions, including the time allowed for preparation and speaking.";
