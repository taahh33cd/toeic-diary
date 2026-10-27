/**
 * Gọi API bộ thẻ từ phía client. Gom vào một chỗ để mọi màn dùng chung kiểu
 * dữ liệu và cách báo lỗi, thay vì mỗi component tự fetch rồi tự đoán shape.
 */

export interface DeckSummary {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  visibility: "private" | "link" | "library";
  source: string;
  part: number | null;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardRow {
  id: string;
  word: string;
  wordKey: string;
  ipa: string | null;
  pos: string | null;
  meaningVi: string | null;
  definition: string | null;
  example: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  order: number;
}

export interface ProgressRow {
  wordKey: string;
  repCount: number;
  intervalDays: number;
  mastered: boolean;
  wrongCount: number;
  seenCount: number;
  lastReview: string | null;
  dueAt: string | null;
}

export interface DeckDetail {
  deck: DeckSummary & { cards: CardRow[] };
  progress: ProgressRow[];
}

export interface CardDraft {
  word: string;
  ipa?: string;
  pos?: string;
  meaningVi?: string;
  definition?: string;
  example?: string;
  imageUrl?: string;
  imagePublicId?: string;
  audioUrl?: string;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(data?.error ?? `Lỗi ${res.status}`);
  return data as T;
}

export function listDecks() {
  return call<{ decks: DeckSummary[] }>("/api/flashcards/decks");
}

export function getDeck(id: string) {
  return call<DeckDetail>(`/api/flashcards/decks/${id}`);
}

export function createDeck(body: {
  title: string;
  description?: string;
  part?: number;
  source?: "manual" | "ai_bulk" | "ai_content";
  sourceRef?: string;
  cards?: CardDraft[];
}) {
  return call<{ deck: { id: string; title: string; slug: string; cardCount: number }; duplicates: string[] }>(
    "/api/flashcards/decks",
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function patchDeck(id: string, body: { title?: string; description?: string; part?: number | null }) {
  return call<{ ok: true }>(`/api/flashcards/decks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteDeck(id: string) {
  return call<{ ok: true }>(`/api/flashcards/decks/${id}`, { method: "DELETE" });
}

export function putCards(id: string, cards: CardDraft[]) {
  return call<{ ok: true; cardCount: number; duplicates: string[] }>(
    `/api/flashcards/decks/${id}/cards`,
    { method: "PUT", body: JSON.stringify({ cards }) }
  );
}

export type ReviewBody =
  | { kind: "flip"; word: string; known: boolean }
  | { kind: "quiz"; word: string; correct: boolean; answerMs?: number; quizType?: string };

/**
 * Ghi một lượt ôn của một từ. Bắn event "vocab:reviewed" để badge nav và
 * dashboard cập nhật ngay — chúng nghe event này thay vì poll.
 */
export async function postReview(body: ReviewBody) {
  const r = await call<{ progress: ProgressRow; wasMastered: boolean }>("/api/flashcards/review", {
    method: "POST",
    body: JSON.stringify(body),
  });
  window.dispatchEvent(new Event("vocab:reviewed"));
  return r;
}

// ── Kho từ phẳng ────────────────────────────────────────────────────────────

/** Một TỪ trong kho: nội dung lấy từ thẻ đầu tiên tìm được, tiến độ chỉ có một. */
export interface WordRow {
  wordKey: string;
  word: string;
  ipa: string | null;
  pos: string | null;
  meaningVi: string | null;
  definition: string | null;
  example: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  part: number | null;
  /** YYYY-MM-DD — ngày thẻ được tạo */
  addedDate: string;
  deckIds: string[];
  repCount: number;
  intervalDays: number;
  mastered: boolean;
  wrongCount: number;
  seenCount: number;
  /** ISO string */
  lastReview: string | null;
  /** ISO string; null = chưa ôn lần nào → đến hạn ngay */
  dueAt: string | null;
}

export function listWords() {
  return call<{ words: WordRow[] }>("/api/flashcards/words");
}

export async function quickAddWord(body: {
  word: string;
  vi?: string;
  ipa?: string;
  pos?: string;
  def?: string;
  example?: string;
  audioUrl?: string;
  part?: number;
}) {
  const r = await call<{ ok: true; deckId: string; deckTitle: string }>("/api/flashcards/words", {
    method: "POST",
    body: JSON.stringify(body),
  });
  window.dispatchEvent(new Event("vocab:changed"));
  window.dispatchEvent(new Event("decks:changed"));
  return r;
}

export async function deleteWord(word: string) {
  const r = await call<{ ok: true; removed: number }>(
    `/api/flashcards/words?word=${encodeURIComponent(word)}`,
    { method: "DELETE" }
  );
  window.dispatchEvent(new Event("vocab:changed"));
  window.dispatchEvent(new Event("decks:changed"));
  return r;
}

/** Từ này có cần ôn hôm nay không — dùng dueAt của Postgres, không tự tính lại. */
export function wordIsDue(w: Pick<WordRow, "mastered" | "dueAt">): boolean {
  if (w.mastered) return false;
  return w.dueAt === null || new Date(w.dueAt) <= new Date();
}

// ── AI điền nghĩa ───────────────────────────────────────────────────────────

export interface EnrichedWord {
  word: string;
  ipa?: string;
  pos?: string;
  definition?: string;
  meaningVi?: string;
  example?: string;
  audioUrl?: string;
  viSource?: "cache" | "gemini" | "mymemory" | "none";
}

export function enrichWords(words: string[]) {
  return call<{ words: EnrichedWord[]; remaining: number }>("/api/flashcards/ai/enrich", {
    method: "POST",
    body: JSON.stringify({ words }),
  });
}

// ── Chia sẻ ─────────────────────────────────────────────────────────────────

export async function setShare(id: string, enabled: boolean) {
  const r = await call<{ visibility: "private" | "link"; slug: string | null }>(
    `/api/flashcards/decks/${id}/share`,
    { method: "POST", body: JSON.stringify({ enabled }) }
  );
  window.dispatchEvent(new Event("decks:changed"));
  return r;
}
