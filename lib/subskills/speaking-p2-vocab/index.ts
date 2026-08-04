// Speaking Part 2 — vocabulary reflex training.
// Learn a group as flashcards, then drill it two ways: scan a real Part 2 photo
// against the clock, or match picture-to-word pairs. The word list is drawn from
// the frequency of the actual /subskills/speaking/part2/mo-ta-buoc picture corpus,
// so anything learned here is guaranteed to pay off in the scan game.

import wordsData from "./words.json";
import { getFreeItems, type FreeItem } from "@/lib/subskills/speaking-p2-steps";

export type VocabGroupId =
  | "clothing-items"
  | "clothing-style"
  | "action-posture"
  | "action-object";

export type VocabWord = {
  id: string;
  group: VocabGroupId;
  en: string;
  vi: string;
  /** Extra surface forms accepted when typing: plurals, base verbs, synonyms. */
  forms: string[];
  example: string;
  /** Unsplash photo id, e.g. "photo-1717700921740-a1440f3b89a4". Empty = text-only card. */
  photo: string;
  credit: string;
};

const WORDS = wordsData as VocabWord[];

export const VOCAB_GROUPS: { id: VocabGroupId; label: string; hint: string; icon: string }[] = [
  { id: "clothing-items", label: "Trang phục — món đồ", hint: "shirt, jacket, apron, hard hat…", icon: "👕" },
  { id: "clothing-style", label: "Trang phục — màu & hoạ tiết", hint: "striped, checked, beige, navy…", icon: "🎨" },
  { id: "action-posture", label: "Hành động — tư thế người", hint: "leaning, kneeling, pointing…", icon: "🧍" },
  { id: "action-object", label: "Hành động — với đồ vật", hint: "holding, pushing, pouring…", icon: "🤲" },
];

export function getVocabGroup(id: VocabGroupId): VocabWord[] {
  return WORDS.filter((w) => w.group === id);
}

/**
 * Scanning a photo works on the wider pool, not a single group: nobody looking at
 * a picture says "shirt" and "striped" as separate thoughts. Two 30-word pools
 * also means far more photos are rich enough to make a real round.
 */
export type ScanPoolId = "clothing" | "action";

export const SCAN_POOLS: { id: ScanPoolId; label: string; ask: string; groups: VocabGroupId[]; icon: string }[] = [
  {
    id: "clothing",
    label: "Trang phục",
    ask: "Gõ mọi món đồ, màu sắc và hoạ tiết bạn nhìn thấy",
    groups: ["clothing-items", "clothing-style"],
    icon: "👕",
  },
  {
    id: "action",
    label: "Hành động",
    ask: "Gõ mọi tư thế và hành động bạn nhìn thấy",
    groups: ["action-posture", "action-object"],
    icon: "🤲",
  },
];

export function getScanPool(id: ScanPoolId): VocabWord[] {
  const groups = SCAN_POOLS.find((p) => p.id === id)?.groups ?? [];
  return WORDS.filter((w) => groups.includes(w.group));
}

export function getAllVocab(): VocabWord[] {
  return WORDS;
}

export function groupLabel(id: VocabGroupId): string {
  return VOCAB_GROUPS.find((g) => g.id === id)?.label ?? id;
}

export const UNSPLASH = (photo: string, w = 500) =>
  `https://images.unsplash.com/${photo}?w=${w}&q=80&auto=format&fit=crop`;

// ─────────────────────────────────────
// Matching what the learner types
// ─────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.,!?;:]/g, "");
}

/** Every string that should count as "the learner said this word". */
function surfaces(w: VocabWord): string[] {
  return [w.en, ...w.forms].map(normalize);
}

/**
 * Find which word of the pool the learner just typed. Accepts the word inside a
 * longer phrase ("a red shirt" → shirt) so learners can answer naturally.
 */
export function matchTypedWord(pool: VocabWord[], input: string): VocabWord | null {
  const norm = normalize(input);
  if (!norm) return null;
  return (
    pool.find((w) => surfaces(w).some((s) => s === norm)) ??
    pool.find((w) => surfaces(w).some((s) => new RegExp(`\\b${escapeRe(s)}\\b`).test(norm))) ??
    null
  );
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────
// Scan game: which words are really in a picture
// ─────────────────────────────────────

/** All the text that describes a picture, so we can tell what it actually contains. */
function pictureText(item: FreeItem): string {
  return normalize([item.fullModel, item.models[2], ...item.hints.flat()].join(" "));
}

/** Words from `pool` that the picture's own model description mentions. */
export function wordsInPicture(item: FreeItem, pool: VocabWord[]): VocabWord[] {
  const text = pictureText(item);
  return pool.filter((w) => surfaces(w).some((s) => new RegExp(`\\b${escapeRe(s)}\\b`).test(text)));
}

export const SCAN_SECONDS = 45;

/** Pictures worth scanning for a group: enough words present to be a real round. */
export function scanPictures(pool: VocabWord[], minWords = 5): { item: FreeItem; words: VocabWord[] }[] {
  return getFreeItems()
    .map((item) => ({ item, words: wordsInPicture(item, pool) }))
    .filter((r) => r.words.length >= minWords);
}

// ─────────────────────────────────────
// Deterministic shuffle (no hydration mismatch)
// ─────────────────────────────────────

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const MEMORY_PAIRS = 6;
