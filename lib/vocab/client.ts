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
