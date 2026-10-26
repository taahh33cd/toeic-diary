import { GoogleGenAI } from "@google/genai";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeWord } from "./normalize";

/**
 * Điền nghĩa / IPA / ví dụ cho một danh sách từ.
 *
 * Thứ tự rẻ trước đắt sau, tất cả chạy ở SERVER (bản FlashCards Pro gọi từ
 * trình duyệt nên phải mượn proxy CORS của bên thứ ba — bỏ hẳn):
 *   1. cache RTDB vocab_word_cache  — miễn phí, dùng chung với QuickAddBar
 *   2. dictionaryapi.dev            — IPA, loại từ, định nghĩa, file phát âm
 *   3. datamuse                     — IPA khi bước 2 trượt
 *   4. Gemini, MỘT lần cho cả danh sách — nghĩa Việt + ví dụ TOEIC
 *   5. MyMemory                     — nghĩa Việt khi Gemini lỗi
 *
 * Gọi Gemini một lần cho cả lô là điểm khác chính so với /api/ai/word-meaning
 * (một lần mỗi từ): 50 từ sẽ là 50 request, vừa chậm vừa tốn quota.
 */

export interface EnrichedWord {
  word: string;
  ipa?: string;
  pos?: string;
  definition?: string;
  meaningVi?: string;
  example?: string;
  audioUrl?: string;
  /** Nguồn của nghĩa tiếng Việt, để UI nói rõ cho học viên biết. */
  viSource?: "cache" | "gemini" | "mymemory" | "none";
}

const POS_MAP: Record<string, string> = {
  noun: "n",
  verb: "v",
  adjective: "adj",
  adverb: "adv",
};

function cacheKey(word: string) {
  return word.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
}

async function readCache(word: string): Promise<{ vi: string; example: string } | null> {
  try {
    const snap = await getAdminDb().ref(`vocab_word_cache/${cacheKey(word)}`).get();
    if (!snap.exists()) return null;
    const v = snap.val() as { vi?: string; example?: string };
    return v?.vi ? { vi: v.vi, example: v.example ?? "" } : null;
  } catch {
    return null;
  }
}

async function writeCache(word: string, vi: string, example: string) {
  try {
    await getAdminDb().ref(`vocab_word_cache/${cacheKey(word)}`).set({ vi, example, ts: Date.now() });
  } catch {
    /* cache trượt lần sau tra lại, không sao */
  }
}

/** Tra từ điển: IPA, loại từ, định nghĩa, file phát âm. */
async function tuDien(word: string): Promise<Partial<EnrichedWord>> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{
      phonetic?: string;
      phonetics?: Array<{ text?: string; audio?: string }>;
      meanings?: Array<{ partOfSpeech?: string; definitions?: Array<{ definition?: string }> }>;
    }>;
    const e = data[0];
    if (!e) return {};
    const m0 = e.meanings?.[0];
    return {
      ipa: e.phonetic || e.phonetics?.find((p) => p.text)?.text || undefined,
      pos: POS_MAP[m0?.partOfSpeech ?? ""] || undefined,
      definition: m0?.definitions?.[0]?.definition || undefined,
      audioUrl: e.phonetics?.find((p) => p.audio)?.audio || undefined,
    };
  } catch {
    return {};
  }
}

/** Chỉ lấy IPA, dùng khi từ điển trượt. */
async function datamuseIpa(word: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word.toLowerCase())}&md=r&ipa=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as Array<{ tags?: string[] }>;
    const tag = data[0]?.tags?.find((t) => t.startsWith("ipa_pron:"));
    return tag ? tag.slice("ipa_pron:".length) : undefined;
  } catch {
    return undefined;
  }
}

function chuanIpa(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().replace(/^\/+|\/+$/g, ""); // bỏ gạch chéo thừa, kể cả "//x//"
  return s ? `/${s}/` : undefined;
}

/** Gọi Gemini MỘT lần cho cả lô. Trả map wordKey → { vi, example }. */
async function geminiLo(
  items: { word: string; pos?: string; definition?: string }[]
): Promise<Map<string, { vi: string; example: string }>> {
  const out = new Map<string, { vi: string; example: string }>();
  if (items.length === 0 || !process.env.GEMINI_API_KEY) return out;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const danhSach = items
    .map((i, n) => `${n + 1}. ${i.word}${i.pos ? ` (${i.pos})` : ""}${i.definition ? ` — ${i.definition.slice(0, 120)}` : ""}`)
    .join("\n");

  const prompt = `Bạn là giáo viên TOEIC. Với MỖI từ tiếng Anh dưới đây, cho nghĩa tiếng Việt ngắn gọn và một câu ví dụ tiếng Anh theo văn phong TOEIC (công sở, thương mại, đời sống).

${danhSach}

Trả về DUY NHẤT một mảng JSON, mỗi phần tử ứng với một từ theo đúng thứ tự:
[{"word":"...","vi":"2-5 từ tiếng Việt","example":"một câu tiếng Anh ngắn"}]

Quy tắc:
- "vi" ngắn gọn, không giải thích dài dòng
- "example" phải DÙNG chính từ đó, dưới 20 từ
- Giữ nguyên "word" y như đầu vào`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const text = res.text ?? "";
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return out;
    const parsed = JSON.parse(m[0]) as unknown;
    if (!Array.isArray(parsed)) return out;

    // Khớp theo THỨ TỰ khi số phần tử trùng khớp — prompt đã yêu cầu đúng thứ
    // tự. Khớp theo tên từ không đáng tin: model hay lặp lại từ kèm loại từ
    // ("take over (v)"), khớp trượt là rơi xuống MyMemory và nhận bản dịch tệ
    // ("complimentary" → "sự biếu" thay vì "miễn phí").
    const theoThuTu = parsed.length === items.length;

    parsed.forEach((r, i) => {
      if (typeof r !== "object" || r === null) return;
      const o = r as Record<string, unknown>;
      const vi = typeof o.vi === "string" ? o.vi.trim() : "";
      if (!vi) return;
      const example = typeof o.example === "string" ? o.example.trim() : "";

      // Bỏ đuôi " (n)" / " (adj)" nếu model thêm vào
      const echo = typeof o.word === "string" ? o.word.replace(/\s*\([^)]*\)\s*$/, "").trim() : "";
      const khoa = theoThuTu ? normalizeWord(items[i].word) : echo ? normalizeWord(echo) : "";
      if (khoa) out.set(khoa, { vi, example });
    });
  } catch (e) {
    console.error("[enrich] Gemini:", e instanceof Error ? e.message : String(e));
  }
  return out;
}

async function myMemory(word: string): Promise<string> {
  const de = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : "";
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi${de}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return "";
    const d = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number };
    return d.responseStatus === 200 ? (d.responseData?.translatedText ?? "") : "";
  } catch {
    return "";
  }
}

/** Số từ tra từ điển cùng lúc — đủ nhanh mà không làm API bên kia chặn. */
const SONG_SONG = 6;

export async function enrichWords(words: string[]): Promise<EnrichedWord[]> {
  // Bỏ trùng, giữ thứ tự học viên nhập
  const seen = new Set<string>();
  const list = words
    .map((w) => w.trim())
    .filter((w) => w && !seen.has(normalizeWord(w)) && seen.add(normalizeWord(w)));

  const ketQua: EnrichedWord[] = list.map((word) => ({ word }));

  // 1 + 2 + 3: cache và từ điển, chạy theo lô nhỏ
  for (let i = 0; i < ketQua.length; i += SONG_SONG) {
    const lo = ketQua.slice(i, i + SONG_SONG);
    await Promise.all(
      lo.map(async (r) => {
        const [cached, dict] = await Promise.all([readCache(r.word), tuDien(r.word)]);
        Object.assign(r, dict);
        r.ipa = chuanIpa(r.ipa ?? (await datamuseIpa(r.word)));
        if (cached) {
          r.meaningVi = cached.vi;
          r.example = cached.example || undefined;
          r.viSource = "cache";
        }
      })
    );
  }

  // 4: Gemini một lần cho từ thiếu nghĩa HOẶC thiếu câu ví dụ. Gộp cả hai vào
  //    cùng một lô vì dù sao cũng chỉ tốn một request — thẻ không có ví dụ thì
  //    học viên mất ngữ cảnh, mà cache cũ nhiều mục chỉ có nghĩa.
  const thieu = ketQua.filter((r) => !r.meaningVi || !r.example);
  const geminiMap = await geminiLo(
    thieu.map((r) => ({ word: r.word, pos: r.pos, definition: r.definition }))
  );
  for (const r of thieu) {
    const g = geminiMap.get(normalizeWord(r.word));
    if (!g) continue;
    if (!r.meaningVi) {
      r.meaningVi = g.vi;
      r.viSource = "gemini";
    }
    if (!r.example && g.example) r.example = g.example;
    void writeCache(r.word, r.meaningVi ?? g.vi, r.example ?? g.example);
  }

  // 5: MyMemory cho phần Gemini vẫn bỏ sót.
  //    KHÔNG ghi cache kết quả MyMemory: nó là nguồn kém nhất, cache lại là
  //    đóng băng bản dịch tệ cho mọi học viên và Gemini không bao giờ có cơ hội
  //    sửa. Đã dính một lần: "complimentary" bị cache thành "sự biếu" thay vì
  //    "miễn phí, tặng kèm".
  const conThieu = ketQua.filter((r) => !r.meaningVi);
  for (let i = 0; i < conThieu.length; i += SONG_SONG) {
    const lo = conThieu.slice(i, i + SONG_SONG);
    await Promise.all(
      lo.map(async (r) => {
        const vi = await myMemory(r.word);
        if (vi) {
          r.meaningVi = vi;
          r.viSource = "mymemory";
        } else {
          r.viSource = "none";
        }
      })
    );
  }

  return ketQua;
}
