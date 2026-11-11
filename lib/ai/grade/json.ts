// Lớp gọi Gemini dùng chung cho mọi part của engine chấm bài.
//
// Mỗi part chỉ việc dựng prompt và khai báo kiểu JSON mong đợi; phần bóc rào
// ```json, dò object và thử lại khi Gemini quá tải nằm hết ở đây.

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/** Part dễ, điểm gần như do code quyết: Writing Q1-5, Speaking Q1-2. */
export const MODEL_LIGHT = "gemini-2.5-flash-lite";
/**
 * Part luận: email, essay, các part nói tự do.
 * KHÔNG dùng gemini-2.5-flash: API trả 404 "no longer available to new users"
 * cho key của site và chỉ sang 3.8-flash. Ghim số hiệu thay vì dùng
 * `gemini-flash-latest` để Google đổi model không âm thầm đổi cách chấm.
 */
export const MODEL_STRONG = "gemini-3.8-flash";

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function isOverloaded(msg: string): boolean {
  return msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE");
}

/**
 * Gọi Gemini và trả về object JSON đầu tiên tìm được trong câu trả lời.
 * `null` = không parse được (caller tự quyết định báo lỗi hay bỏ qua).
 * Quá tải thì thử lại một lần; lỗi khác thì ném ra để route xếp hàng lại.
 */
export async function generateJson<T>(model: string, prompt: string, attempt = 0): Promise<T | null> {
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = (response.text ?? "").trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attempt === 0 && isOverloaded(msg)) {
      await new Promise((r) => setTimeout(r, 1200));
      return generateJson<T>(model, prompt, 1);
    }
    throw err;
  }
}
