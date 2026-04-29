const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "up", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "not",
  "no", "so", "if", "as", "it", "its", "this", "that", "these", "those",
  "i", "we", "you", "he", "she", "they", "me", "him", "her", "us", "them",
  "my", "our", "your", "his", "their", "about", "after", "before", "then",
  "than", "very", "just", "also", "more", "some", "any", "all", "both",
]);

function scoreWord(word: string, pos: number, total: number): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 4) return -1;
  if (STOP_WORDS.has(w)) return -1;
  if (/^[A-Z]/.test(word) && pos > 0) return -1; // proper noun

  let score = 0;
  if (w.length >= 6) score += 20;
  else if (w.length >= 5) score += 10;
  if (pos > 0 && pos < total - 1) score += 10; // middle position bonus
  return score;
}

export interface GeneratedBlank {
  id: string;
  position: number;
  answer: string;
  hint: string;
}

function makeHint(word: string): string {
  const clean = word.replace(/[^a-zA-Z0-9]/g, "");
  return clean[0] + "_".repeat(Math.max(1, clean.length - 1));
}

export function generateBlanks(
  sentenceId: string,
  content: string,
  count: number,
  seed: number
): GeneratedBlank[] {
  const words = content.trim().split(/\s+/);
  const total = words.length;

  const candidates: { pos: number; score: number }[] = [];
  for (let i = 0; i < total; i++) {
    const s = scoreWord(words[i], i, total);
    if (s >= 0) candidates.push({ pos: i, score: s });
  }

  if (candidates.length === 0) return [];

  // Seeded shuffle so blanks stay consistent within a session but vary across replays
  const shuffled = [...candidates].sort((a, b) => {
    const ha = Math.sin(seed + a.pos * 127.1) * 43758.5453;
    const hb = Math.sin(seed + b.pos * 127.1) * 43758.5453;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });

  // Pick up to `count` blanks, enforce min spacing of 2 words
  const selected: number[] = [];
  for (const { pos } of shuffled) {
    if (selected.length >= count) break;
    if (selected.every((p) => Math.abs(p - pos) >= 2)) {
      selected.push(pos);
    }
  }

  return selected.sort((a, b) => a - b).map((pos) => {
    const raw = words[pos];
    const answer = raw.toLowerCase().replace(/[^a-z0-9']/g, "");
    return {
      id: `gen-${sentenceId}-${pos}`,
      position: pos,
      answer,
      hint: makeHint(raw),
    };
  });
}
