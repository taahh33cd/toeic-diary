// Bài thi thử Writing trọn bộ: 8 câu chạy liền mạch đúng trình tự và nhịp giờ ETS.
//
// Mỗi đề được ghép từ data của ba unit lẻ theo chỉ số, nên thêm đề ở unit nào
// cũng làm giàu bài thi thử.

import { WRITING_Q1_5, type WritingQ15Exercise } from "./writing-q1-5";
import { Q67_TESTS, promptsOfTest, type Q67Prompt } from "./writing-q6-7";
import { Q8_PROMPTS, type Q8Prompt } from "./writing-q8";

export const WRITING_MOCK_COUNT = 10;
export const WRITING_MOCK_FREE = 2;

/** Nhịp giờ chuẩn của đề thi thật */
export const WM_Q15_SECONDS = 8 * 60;
export const WM_Q67_SECONDS = 10 * 60;
export const WM_Q8_SECONDS = 30 * 60;

/** Directions nguyên văn ETS cho từng phần */
export const WM_DIRECTIONS = {
  test:
    "This is the TOEIC Writing test. This test includes eight questions that measure different aspects of your " +
    "writing ability. The test lasts approximately one hour. For each type of question, you will be given " +
    "specific directions, including the time allowed for writing.",
  q15:
    "In this part of the test, you will write ONE sentence that is based on a picture. With each picture, you " +
    "will be given TWO words or phrases that you must use in your sentence. You can change the forms of the words " +
    "and you can use the words in any order. Your sentence will be scored on the appropriate use of grammar and " +
    "the relevance of the sentence to the picture. You will have eight minutes to complete this part of the test.",
  q67:
    "In this part of the test, you will show how well you can write a response to an e-mail. Your response will " +
    "be scored on the quality and variety of your sentences, vocabulary, and organization. You will have " +
    "10 minutes to read and answer each e-mail.",
  q8:
    "In this part of the test, you will write an essay in response to a question that asks you to state, explain, " +
    "and support your opinion on an issue. Typically, an effective essay will contain a minimum of 300 words. " +
    "You will have 30 minutes to plan, write, and revise your essay.",
} as const;

export interface WritingMock {
  index: number;
  slug: string;
  label: string;
  parts: string[];
  q15: WritingQ15Exercise[];
  q67: Q67Prompt[];
  q8: Q8Prompt;
  free: boolean;
}

function slice5(i: number): WritingQ15Exercise[] {
  const n = WRITING_Q1_5.length;
  return Array.from({ length: 5 }, (_, k) => WRITING_Q1_5[(i * 5 + k) % n]);
}

export function buildWritingMock(index: number): WritingMock | null {
  if (!Number.isInteger(index) || index < 1 || index > WRITING_MOCK_COUNT) return null;
  const i = index - 1;

  const test67 = Q67_TESTS[i % Q67_TESTS.length];
  const q67 = promptsOfTest(test67);
  const q8 = Q8_PROMPTS[i % Q8_PROMPTS.length];
  if (q67.length < 2) return null;

  return {
    index,
    slug: String(index),
    label: `Đề thi thử ${index}`,
    parts: [
      `Q1-5 ${5} ảnh`,
      `Q6-7 ${q67.map((p) => p.email.subject).join(" · ")}`,
      `Q8 ${q8.topicVi}`,
    ],
    q15: slice5(i),
    q67: q67.slice(0, 2),
    q8,
    free: index <= WRITING_MOCK_FREE,
  };
}

export function listWritingMocks(): WritingMock[] {
  return Array.from({ length: WRITING_MOCK_COUNT }, (_, k) => buildWritingMock(k + 1)).filter(
    (m): m is WritingMock => Boolean(m),
  );
}
