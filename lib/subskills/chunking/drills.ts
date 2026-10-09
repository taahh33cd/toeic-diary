// Sinh đề cho nhánh Nghe từ dữ liệu listen.json.
//
// Mọi thứ ở đây đều tiền định (không random thật) để đề của một cấp luôn giống
// nhau giữa server và client, và học sinh làm lại thì vẫn gặp đúng đề cũ.

import { chunkSentence } from "./chunker";
import type { ListenPassage } from "./index";
import type { SpeakPassage } from "./speak";

/** Xáo trộn tiền định theo chuỗi khoá — cùng khoá cho ra cùng thứ tự. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type CatchChunkItem = {
  id: string;
  audioUrl: string;
  /** Chỉ phát đúng khoảng này của file */
  start: number;
  end: number;
  options: string[];
  correct: number;
  /** Cả dòng, hiện ra sau khi chấm */
  lineText: string;
  speaker: string | null;
};

/**
 * Nghe một cụm rồi chọn đúng ranh giới.
 *
 * Phương án nhiễu đều là cùng chỗ trong câu nhưng cắt lệch một từ — nên muốn
 * chọn đúng phải nghe được cụm bắt đầu và kết thúc ở đâu, chứ không đoán nghĩa.
 */
export function buildCatchChunk(passages: ListenPassage[], perPassage = 2): CatchChunkItem[] {
  const items: CatchChunkItem[] = [];

  for (const p of passages) {
    let taken = 0;
    for (let li = 0; li < p.lines.length && taken < perPassage; li++) {
      const line = p.lines[li];
      for (let ci = 0; ci < line.chunks.length && taken < perPassage; ci++) {
        const cur = line.chunks[ci];
        const prev = line.chunks[ci - 1];
        const next = line.chunks[ci + 1];
        const curWords = cur.text.split(/\s+/);
        if (curWords.length < 3 || !next || !prev) continue;

        const nextWords = next.text.split(/\s+/);
        const prevWords = prev.text.split(/\s+/);

        const variants = [
          // Lấn sang từ đầu của cụm sau
          [...curWords, nextWords[0]].join(" "),
          // Cắt thiếu từ cuối
          curWords.slice(0, -1).join(" "),
          // Lấn ngược về từ cuối của cụm trước
          [prevWords[prevWords.length - 1], ...curWords].join(" "),
        ].filter((v, i, a) => v !== cur.text && a.indexOf(v) === i && v.trim().length > 0);

        if (variants.length < 3) continue;

        const id = `${p.groupId}-l${li}-c${ci}`;
        const options = seededShuffle([cur.text, ...variants.slice(0, 3)], id);
        items.push({
          id,
          audioUrl: p.audioUrl,
          start: cur.start,
          end: cur.end,
          options,
          correct: options.indexOf(cur.text),
          lineText: line.text,
          speaker: line.speaker,
        });
        taken++;
      }
    }
  }

  return items;
}

export type OrderChunksItem = {
  id: string;
  audioUrl: string;
  start: number;
  end: number;
  /** Các cụm đã xáo trộn */
  shuffled: string[];
  /** Thứ tự đúng, là chỉ số trong `shuffled` */
  answer: number[];
  speaker: string | null;
};

/** Nghe cả dòng rồi xếp các cụm về đúng thứ tự. */
export function buildOrderChunks(passages: ListenPassage[], perPassage = 2): OrderChunksItem[] {
  const items: OrderChunksItem[] = [];

  for (const p of passages) {
    let taken = 0;
    for (let li = 0; li < p.lines.length && taken < perPassage; li++) {
      const line = p.lines[li];
      const chunks = line.chunks;
      if (chunks.length < 3 || chunks.length > 6) continue;
      // Dòng có cụm trùng nhau thì bỏ — xếp thứ tự sẽ không có đáp án duy nhất
      if (new Set(chunks.map((c) => c.text)).size !== chunks.length) continue;

      const id = `${p.groupId}-l${li}`;
      const shuffled = seededShuffle(
        chunks.map((c) => c.text),
        id
      );
      // Thứ tự đúng đã xáo, nên dòng nào xáo ra y nguyên thì bỏ
      if (shuffled.every((t, i) => t === chunks[i].text)) continue;

      items.push({
        id,
        audioUrl: p.audioUrl,
        start: chunks[0].start,
        end: chunks[chunks.length - 1].end,
        shuffled,
        answer: chunks.map((c) => shuffled.indexOf(c.text)),
        speaker: line.speaker,
      });
      taken++;
    }
  }

  return items;
}

export type DictationItem = {
  id: string;
  audioUrl: string;
  start: number;
  end: number;
  answer: string;
  /** Cả dòng, hiện sau khi chấm để thấy cụm nằm ở đâu */
  lineText: string;
  speaker: string | null;
};

/** Audio dừng cuối mỗi cụm, học sinh gõ lại cụm vừa nghe. */
export function buildDictation(passages: ListenPassage[], perPassage = 3): DictationItem[] {
  const items: DictationItem[] = [];

  for (const p of passages) {
    let taken = 0;
    for (let li = 0; li < p.lines.length && taken < perPassage; li++) {
      const line = p.lines[li];
      for (let ci = 0; ci < line.chunks.length && taken < perPassage; ci++) {
        const c = line.chunks[ci];
        const n = c.text.split(/\s+/).length;
        if (n < 3 || n > 6) continue;
        items.push({
          id: `${p.groupId}-l${li}-c${ci}`,
          audioUrl: p.audioUrl,
          start: c.start,
          end: c.end,
          answer: c.text,
          lineText: line.text,
          speaker: line.speaker,
        });
        taken++;
      }
    }
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chấm bài gõ lại
// ─────────────────────────────────────────────────────────────────────────────

/** Từ chức năng — gõ sai/thiếu vẫn còn tính là nghe được cụm. */
const FUNCTION_WORDS = new Set([
  "a", "an", "the", "of", "to", "in", "on", "at", "for", "with", "and", "or",
  "but", "is", "are", "was", "were", "be", "been", "am", "do", "does", "did",
  "that", "this", "it", "its", "we", "you", "i", "he", "she", "they", "our",
  "your", "my", "his", "her", "their", "so", "as", "by", "from", "will",
  "would", "can", "could", "have", "has", "had",
]);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export type DictationResult = {
  correct: boolean;
  missedContent: string[];
  /** Tỉ lệ từ khớp, 0-1 */
  ratio: number;
};

/**
 * Đúng khi gõ đủ MỌI từ nội dung và khớp ít nhất 80% tổng số từ.
 * Thiếu "the" thì vẫn tính, thiếu "appointment" thì không.
 */
export function gradeDictation(answer: string, typed: string): DictationResult {
  const want = words(answer);
  const got = new Set(words(typed));
  const missedContent = want.filter((w) => !FUNCTION_WORDS.has(w) && !got.has(w));
  const matched = want.filter((w) => got.has(w)).length;
  const ratio = want.length === 0 ? 0 : matched / want.length;
  return { correct: missedContent.length === 0 && ratio >= 0.8, missedContent, ratio };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sinh đề cho nhánh Nói từ liệu viết tay ở speak.ts
// ─────────────────────────────────────────────────────────────────────────────

export type MarkBoundaryItem = {
  id: string;
  genreVi: string;
  words: string[];
  /** Vị trí ranh giới đúng: ngắt TRƯỚC từ thứ n */
  answer: number[];
  /** Lý do ngắt, hiện khi chữa bài */
  reasons: Record<number, string>;
};

/**
 * Bấm vào khoảng trắng để cắt câu thành cụm.
 *
 * Ranh giới lấy từ `chunkSentence` chứ không từ liệu viết tay, để còn kèm được
 * LÝ DO ngắt. Hai nguồn này luôn khớp nhau — `check-speak-data.ts` canh việc đó.
 */
export function buildMarkBoundary(passages: SpeakPassage[]): MarkBoundaryItem[] {
  const items: MarkBoundaryItem[] = [];
  for (const p of passages) {
    p.sentences.forEach((s, si) => {
      const sentence = s.chunks.map((c) => c.en).join(" ");
      const cut = chunkSentence(sentence);
      // Câu một cụm thì không có gì để cắt
      if (cut.boundaries.length === 0) return;
      items.push({
        id: `${p.id}-s${si}`,
        genreVi: p.genreVi,
        words: cut.words,
        answer: cut.boundaries.map((b) => b.at),
        reasons: Object.fromEntries(cut.boundaries.map((b) => [b.at, b.reason])),
      });
    });
  }
  return items;
}

/** Điểm một câu: ranh giới đúng trừ ranh giới thừa, chia cho số ranh giới cần. */
export function gradeMarkBoundary(item: MarkBoundaryItem, picked: number[]) {
  const want = new Set(item.answer);
  const hits = picked.filter((p) => want.has(p));
  const extra = picked.filter((p) => !want.has(p));
  const missed = item.answer.filter((a) => !picked.includes(a));
  const ratio = Math.max(0, (hits.length - extra.length) / item.answer.length);
  return { hits, extra, missed, ratio: Math.min(1, ratio) };
}

export type MatchMeaningItem = {
  id: string;
  en: string;
  /** Nghĩa Việt của cả cụm */
  options: string[];
  correct: number;
  words: string[];
  /** Chỉ số từ nhận đỉnh nhấn trong `words` */
  stressIdx: number;
};

/** Nối cụm với nghĩa Việt, rồi bấm đúng từ nhận đỉnh nhấn. */
export function buildMatchMeaning(passages: SpeakPassage[], perPassage = 6): MatchMeaningItem[] {
  const items: MatchMeaningItem[] = [];

  for (const p of passages) {
    const all = p.sentences.flatMap((s) => s.chunks);
    const usable = all.filter((c) => c.en.split(/\s+/).length >= 2);
    const chosen = seededShuffle(usable, p.id).slice(0, perPassage);

    for (const c of chosen) {
      const words = c.en.split(/\s+/);
      const stressIdx = words.indexOf(c.stress);
      if (stressIdx === -1) continue;

      const pool = all.filter((o) => o.vi !== c.vi).map((o) => o.vi);
      const distractors = seededShuffle(pool, c.en).slice(0, 3);
      if (distractors.length < 3) continue;

      const options = seededShuffle([c.vi, ...distractors], c.en + p.id);
      items.push({
        id: `${p.id}-${words.join("-")}`,
        en: c.en,
        options,
        correct: options.indexOf(c.vi),
        words,
        stressIdx,
      });
    }
  }

  return items;
}
