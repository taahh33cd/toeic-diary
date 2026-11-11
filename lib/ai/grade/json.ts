// Lớp gọi Gemini dùng chung cho mọi part của engine chấm bài.
//
// Mỗi part chỉ việc dựng prompt và khai báo kiểu JSON mong đợi; phần bóc rào
// ```json, dò object và thử lại khi Gemini quá tải nằm hết ở đây.

import { GoogleGenAI, type ContentListUnion } from "@google/genai";

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
 * Cắt ra từng object JSON cân ngoặc ở mức ngoài cùng.
 * Cần vì model đôi khi trả mỗi câu một object rời (kiểu JSONL) thay vì một
 * object bọc cả danh sách — lúc đó cách dò `{...}` tham lam sẽ gộp hai object
 * thành một chuỗi không parse được.
 */
function balancedObjects(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        out.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}

/**
 * Đọc JSON từ câu trả lời của model, chịu được ba kiểu lạc chuẩn hay gặp:
 * bọc trong rào ```json, một mảng trần, và nhiều object rời.
 * Nhiều object rời được gói lại thành `{ items: [...] }` — khuôn mà grader
 * nhiều câu (Q1-5) vẫn đọc được.
 */
function parseLoose<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const asObject = (v: unknown): T => (Array.isArray(v) ? ({ items: v } as T) : (v as T));

  try {
    return asObject(JSON.parse(cleaned));
  } catch {
    // tiếp tục với các cách dò bên dưới
  }

  const objs = balancedObjects(cleaned);
  if (objs.length === 1) {
    try {
      return JSON.parse(objs[0]) as T;
    } catch {
      return null;
    }
  }
  if (objs.length > 1) {
    const parsed: unknown[] = [];
    for (const o of objs) {
      try {
        parsed.push(JSON.parse(o));
      } catch {
        // bỏ object hỏng, giữ phần đọc được
      }
    }
    if (parsed.length > 0) return { items: parsed } as T;
  }
  return null;
}

/**
 * Gọi Gemini và trả về object JSON đầu tiên tìm được trong câu trả lời.
 * `null` = không parse được (caller tự quyết định báo lỗi hay bỏ qua).
 * Quá tải thì thử lại một lần; lỗi khác thì ném ra để route xếp hàng lại.
 */
export async function generateJson<T>(
  model: string,
  /** Chuỗi prompt, hoặc danh sách part khi cần gửi kèm audio. */
  prompt: ContentListUnion,
  attempt = 0,
): Promise<T | null> {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      // Buộc trả JSON thuần (không rào markdown) và hạ nhiệt độ: chấm bài cần
      // chấm lại ra gần như cùng một kết quả, không cần sáng tạo.
      config: { responseMimeType: "application/json", temperature: 0.2 },
    });
    return parseLoose<T>((response.text ?? "").trim());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attempt === 0 && isOverloaded(msg)) {
      await new Promise((r) => setTimeout(r, 1200));
      return generateJson<T>(model, prompt, 1);
    }
    throw err;
  }
}
