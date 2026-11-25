import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import { normalizeWord } from "./normalize";
import { checkLimit } from "./ratelimit";

/**
 * Từ điển dùng chung của Sổ từ vựng (bảng vocab_lexicon).
 *
 * Mỗi TỪ chỉ gọi AI một lần cho cả hệ thống rồi cache mãi, nên chi phí tỉ lệ
 * với số từ khác nhau (từ vựng TOEIC có hạn) chứ không với số lượt tra.
 *
 * Thứ tự rẻ trước đắt sau:
 *   1. vocab_lexicon (đã đủ)  — miễn phí
 *   2. dictionaryapi.dev      — IPA, loại từ, định nghĩa, phát âm UK/US
 *   3. Gemini Flash-Lite      — nghĩa Việt, ví dụ TOEIC, cụm từ, họ từ, cấp độ
 *   4. MyMemory               — nghĩa Việt khi AI hết lượt/lỗi (KHÔNG cache)
 */

export type Level = "550" | "650" | "750" | "850";
const LEVELS: Level[] = ["550", "650", "750", "850"];

export interface LexEntry {
  word: string;
  wordKey: string;
  ipa: string | null;
  pos: string | null;
  meaningVi: string | null;
  definition: string | null;
  example: string | null;
  collocations: string[];
  family: string[];
  level: Level | null;
  audioUk: string | null;
  audioUs: string | null;
}

export interface ViCandidate {
  word: string;
  pos: string;
  level: Level | null;
  note: string;
}

const MODEL = "gemini-2.5-flash-lite";

const MO_TA_CAP = `Thang cấp độ (theo điểm TOEIC học viên cần để nắm từ):
- "550": từ cơ bản, đời thường, hay gặp ở Part 1–2 (tray, pour, invoice)
- "650": từ công sở/thương mại phổ biến (negotiate, deadline, reimburse)
- "750": từ trang trọng hoặc chuyên môn hay gặp ở Part 5–7 (itinerary, comply with, tentative)
- "850": từ khó, ít gặp, sắc thái tinh, dùng để phân loại học viên giỏi (contingent, expedite, stipulate)`;

function ai() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

function asLevel(v: unknown): Level | null {
  const s = String(v ?? "").replace(/\D/g, "");
  return (LEVELS as string[]).includes(s) ? (s as Level) : null;
}

function strArr(v: unknown, max: number): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim()).slice(0, max)
    : [];
}

function parseJson(text: string): unknown {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const m = t.match(/[[{][\s\S]*[\]}]/);
  return m ? JSON.parse(m[0]) : null;
}

/** Từ/cụm tiếng Anh hợp lệ để tra: chữ cái, khoảng trắng, gạch nối, nháy đơn. */
export function looksEnglish(q: string): boolean {
  return /^[A-Za-z][A-Za-z\s'’.-]{0,59}$/.test(q.trim());
}

/** AI được gọi không: còn lượt của học viên VÀ còn trần chung của hệ thống. */
async function duocGoiAi(kind: "lookup" | "lookup-vi" | "levels", userId: string) {
  if (!process.env.GEMINI_API_KEY) return { ok: false, message: "Chưa cấu hình AI" };
  const rieng = await checkLimit(kind, userId);
  if (!rieng.ok) return rieng;
  const chung = await checkLimit("ai-global", "all");
  if (!chung.ok) return { ok: false, message: "AI tạm hết lượt trong hôm nay — đang dùng từ điển miễn phí." };
  return { ok: true as const };
}

// ── Nguồn miễn phí ──────────────────────────────────────────────────────────

const POS_MAP: Record<string, string> = { noun: "n", verb: "v", adjective: "adj", adverb: "adv" };

async function tuDien(word: string) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      phonetic?: string;
      phonetics?: Array<{ text?: string; audio?: string }>;
      meanings?: Array<{ partOfSpeech?: string; definitions?: Array<{ definition?: string }> }>;
    }>;
    const phon = data.flatMap((e) => e.phonetics ?? []);
    const m0 = data[0]?.meanings?.[0];
    const audio = (re: RegExp) => phon.find((p) => p.audio && re.test(p.audio))?.audio || null;
    return {
      ipa: chuanIpa(data[0]?.phonetic || phon.find((p) => p.text)?.text),
      pos: POS_MAP[m0?.partOfSpeech ?? ""] ?? null,
      definition: m0?.definitions?.[0]?.definition ?? null,
      audioUk: audio(/-uk\.mp3$/),
      audioUs: audio(/-us\.mp3$/) ?? phon.find((p) => p.audio)?.audio ?? null,
    };
  } catch {
    return null;
  }
}

function chuanIpa(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/^\/+|\/+$/g, "");
  return s ? `/${s}/` : null;
}

async function myMemory(word: string): Promise<string | null> {
  const de = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : "";
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi${de}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const d = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number };
    return d.responseStatus === 200 ? d.responseData?.translatedText || null : null;
  } catch {
    return null;
  }
}

// ── Tra Anh → Việt ──────────────────────────────────────────────────────────

function toEntry(r: {
  word: string; wordKey: string; ipa: string | null; pos: string | null; meaningVi: string | null;
  definition: string | null; example: string | null; collocations: string[]; family: string[];
  level: string | null; audioUk: string | null; audioUs: string | null;
}): LexEntry {
  return { ...r, level: asLevel(r.level) };
}

export type LookupResult =
  | { found: true; entry: LexEntry; aiNote?: string }
  | { found: false; reason: string };

export async function lookupEn(raw: string, userId: string): Promise<LookupResult> {
  const word = raw.trim().replace(/\s+/g, " ");
  if (!looksEnglish(word)) return { found: false, reason: "Chỉ tra được từ hoặc cụm tiếng Anh." };
  const wordKey = normalizeWord(word);

  const cu = await prisma.vocabLexicon.findUnique({ where: { wordKey } });
  if (cu?.complete) return { found: true, entry: toEntry(cu) };

  const dict = await tuDien(word);
  const duoc = await duocGoiAi("lookup", userId);

  if (!duoc.ok) {
    // Không có AI: vẫn trả phần từ điển miễn phí, KHÔNG ghi cache để lần sau AI bù.
    if (!dict && !cu) return { found: false, reason: duoc.message ?? "Không tra được từ này." };
    const vi = cu?.meaningVi ?? (await myMemory(word));
    return {
      found: true,
      aiNote: duoc.message,
      entry: {
        word, wordKey,
        ipa: dict?.ipa ?? cu?.ipa ?? null, pos: dict?.pos ?? cu?.pos ?? null,
        meaningVi: vi, definition: dict?.definition ?? null, example: cu?.example ?? null,
        collocations: cu?.collocations ?? [], family: cu?.family ?? [],
        level: asLevel(cu?.level), audioUk: dict?.audioUk ?? null, audioUs: dict?.audioUs ?? null,
      },
    };
  }

  const prompt = `Bạn là giáo viên TOEIC người Việt. Soạn mục từ điển cho từ/cụm tiếng Anh: "${word}"${
    dict?.pos ? ` (loại từ: ${dict.pos})` : ""}${dict?.definition ? `\nĐịnh nghĩa tiếng Anh: "${dict.definition.slice(0, 200)}"` : ""}

${MO_TA_CAP}

Trả về DUY NHẤT một object JSON:
{"valid":true,"pos":"n|v|adj|adv|phrase","vi":"nghĩa tiếng Việt ngắn gọn, 2-6 từ, nghĩa hay gặp trong TOEIC trước","example":"một câu tiếng Anh văn phong TOEIC, dưới 18 từ, dùng chính từ đó","collocations":["2-3 cụm hay gặp trong đề TOEIC"],"family":["các từ cùng họ, dạng \\"negotiation (n)\\", tối đa 4, bỏ qua nếu không có"],"level":"550|650|750|850"}

Nếu "${word}" không phải từ hay cụm tiếng Anh có nghĩa, trả {"valid":false}.`;

  try {
    const res = await ai().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const o = parseJson(res.text ?? "") as Record<string, unknown> | null;
    if (!o || o.valid === false) {
      return { found: false, reason: `Không tìm thấy “${word}” trong từ điển.` };
    }
    const data = {
      word: cu?.word ?? word,
      ipa: dict?.ipa ?? cu?.ipa ?? null,
      pos: (typeof o.pos === "string" && o.pos.trim()) || dict?.pos || null,
      meaningVi: typeof o.vi === "string" && o.vi.trim() ? o.vi.trim() : null,
      definition: dict?.definition ?? null,
      example: typeof o.example === "string" && o.example.trim() ? o.example.trim() : null,
      collocations: strArr(o.collocations, 3),
      family: strArr(o.family, 4),
      level: asLevel(o.level),
      audioUk: dict?.audioUk ?? null,
      audioUs: dict?.audioUs ?? null,
      complete: true,
    };
    const saved = await prisma.vocabLexicon.upsert({
      where: { wordKey },
      create: { wordKey, ...data },
      update: data,
    });
    return { found: true, entry: toEntry(saved) };
  } catch (e) {
    console.error("[lexicon] lookupEn:", e instanceof Error ? e.message : String(e));
    if (!dict) return { found: false, reason: "Không tra được lúc này, thử lại sau." };
    return {
      found: true,
      aiNote: "AI đang lỗi — tạm hiện phần từ điển.",
      entry: {
        word, wordKey, ipa: dict.ipa, pos: dict.pos, meaningVi: await myMemory(word),
        definition: dict.definition, example: null, collocations: [], family: [],
        level: null, audioUk: dict.audioUk, audioUs: dict.audioUs,
      },
    };
  }
}

// ── Tra Việt → Anh ──────────────────────────────────────────────────────────

export function viKey(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export type ViResult =
  | { ok: true; candidates: ViCandidate[] }
  | { ok: false; reason: string };

export async function lookupVi(raw: string, userId: string): Promise<ViResult> {
  const query = raw.trim().replace(/\s+/g, " ");
  if (!query || query.length > 60) return { ok: false, reason: "Nhập một từ hoặc cụm tiếng Việt ngắn." };
  const queryKey = viKey(query);

  const cu = await prisma.vocabViLookup.findUnique({ where: { queryKey } });
  if (cu) return { ok: true, candidates: cu.results as unknown as ViCandidate[] };

  const duoc = await duocGoiAi("lookup-vi", userId);
  if (!duoc.ok) return { ok: false, reason: duoc.message ?? "Hết lượt tra hôm nay." };

  const prompt = `Bạn là giáo viên TOEIC người Việt. Học viên muốn biết tiếng Anh của: "${query}".
Đưa 2-4 từ/cụm tiếng Anh tương ứng hay gặp trong TOEIC, phổ biến nhất trước.

${MO_TA_CAP}

Trả về DUY NHẤT một mảng JSON:
[{"word":"từ tiếng Anh","pos":"n|v|adj|adv|phrase","level":"550|650|750|850","note":"khác biệt ngắn gọn bằng tiếng Việt + một cụm ví dụ, dưới 12 từ"}]
Nếu "${query}" không có nghĩa, trả [].`;

  try {
    const res = await ai().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const arr = parseJson(res.text ?? "");
    const candidates: ViCandidate[] = (Array.isArray(arr) ? arr : [])
      .map((x) => x as Record<string, unknown>)
      .filter((x) => typeof x.word === "string" && looksEnglish(x.word))
      .slice(0, 4)
      .map((x) => ({
        word: String(x.word).trim(),
        pos: typeof x.pos === "string" ? x.pos : "",
        level: asLevel(x.level),
        note: typeof x.note === "string" ? x.note.trim() : "",
      }));
    if (candidates.length) {
      await prisma.vocabViLookup.upsert({
        where: { queryKey },
        create: { queryKey, query, results: candidates as unknown as object },
        update: { results: candidates as unknown as object },
      });
    }
    return { ok: true, candidates };
  } catch (e) {
    console.error("[lexicon] lookupVi:", e instanceof Error ? e.message : String(e));
    return { ok: false, reason: "Không tra được lúc này, thử lại sau." };
  }
}

// ── Gắn cấp hàng loạt ──────────────────────────────────────────────────────

/** Tối đa bấy nhiêu từ mỗi lượt gọi — đủ nhỏ để model không lạc thứ tự. */
export const LEVEL_BATCH = 40;

/**
 * Gắn cấp cho các từ chưa có trong vocab_lexicon (hoặc có mà chưa có cấp).
 * Trả map wordKey → level cho những từ gắn được.
 */
export async function tagLevels(words: string[], userId: string): Promise<{ levels: Record<string, Level>; message?: string }> {
  const seen = new Set<string>();
  const list = words
    .map((w) => w.trim())
    .filter((w) => looksEnglish(w))
    .filter((w) => !seen.has(normalizeWord(w)) && !!seen.add(normalizeWord(w)))
    .slice(0, LEVEL_BATCH);
  if (!list.length) return { levels: {} };

  const keys = list.map(normalizeWord);
  const cu = await prisma.vocabLexicon.findMany({
    where: { wordKey: { in: keys } },
    select: { wordKey: true, level: true },
  });
  const levels: Record<string, Level> = {};
  for (const r of cu) {
    const l = asLevel(r.level);
    if (l) levels[r.wordKey] = l;
  }
  const thieu = list.filter((w) => !levels[normalizeWord(w)]);
  if (!thieu.length) return { levels };

  const duoc = await duocGoiAi("levels", userId);
  if (!duoc.ok) return { levels, message: duoc.message };

  const prompt = `Bạn là giáo viên TOEIC. Gắn cấp độ cho MỖI từ/cụm dưới đây.

${MO_TA_CAP}

${thieu.map((w, i) => `${i + 1}. ${w}`).join("\n")}

Trả về DUY NHẤT một mảng JSON đúng ${thieu.length} phần tử, theo đúng thứ tự:
[{"word":"...","level":"550|650|750|850"}]`;

  try {
    const res = await ai().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const arr = parseJson(res.text ?? "");
    if (!Array.isArray(arr)) return { levels };
    // Khớp THEO THỨ TỰ khi đủ số phần tử — model hay viết lại từ kèm loại từ.
    const theoThuTu = arr.length === thieu.length;
    const ghi: { wordKey: string; word: string; level: Level }[] = [];
    arr.forEach((x, i) => {
      const o = x as Record<string, unknown>;
      const l = asLevel(o?.level);
      const w = theoThuTu ? thieu[i] : typeof o?.word === "string" ? o.word : "";
      if (!l || !w) return;
      const k = normalizeWord(w);
      if (!keys.includes(k)) return;
      levels[k] = l;
      ghi.push({ wordKey: k, word: w, level: l });
    });
    await Promise.all(
      ghi.map((g) =>
        prisma.vocabLexicon.upsert({
          where: { wordKey: g.wordKey },
          create: { wordKey: g.wordKey, word: g.word, level: g.level },
          update: { level: g.level },
        })
      )
    );
    return { levels };
  } catch (e) {
    console.error("[lexicon] tagLevels:", e instanceof Error ? e.message : String(e));
    return { levels };
  }
}
