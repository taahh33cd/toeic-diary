// ─────────────────────────────────────
// IPA sets registry + loader
// ─────────────────────────────────────

import type { IpaSet, IpaSection, IpaDifficulty } from "./types";

import vowelsEasy from "./data/vowels.easy.json";
import vowelsMedium from "./data/vowels.medium.json";
import vowelsHard from "./data/vowels.hard.json";
import diphthongsEasy from "./data/diphthongs.easy.json";
import diphthongsMedium from "./data/diphthongs.medium.json";
import diphthongsHard from "./data/diphthongs.hard.json";
import consonantsEasy from "./data/consonants.easy.json";
import consonantsMedium from "./data/consonants.medium.json";
import consonantsHard from "./data/consonants.hard.json";

export * from "./types";
export * from "./grade";

// key = `${section}.${difficulty}`
const REGISTRY: Record<string, IpaSet> = {
  "vowels.easy": vowelsEasy as IpaSet,
  "vowels.medium": vowelsMedium as IpaSet,
  "vowels.hard": vowelsHard as IpaSet,
  "diphthongs.easy": diphthongsEasy as IpaSet,
  "diphthongs.medium": diphthongsMedium as IpaSet,
  "diphthongs.hard": diphthongsHard as IpaSet,
  "consonants.easy": consonantsEasy as IpaSet,
  "consonants.medium": consonantsMedium as IpaSet,
  "consonants.hard": consonantsHard as IpaSet,
};

export const IPA_SECTIONS: { key: IpaSection; label: string }[] = [
  { key: "vowels", label: "Vowels — Nguyên âm đơn" },
  { key: "diphthongs", label: "Diphthongs — Nguyên âm đôi" },
  { key: "consonants", label: "Consonants — Phụ âm" },
];

export const IPA_DIFFICULTIES: IpaDifficulty[] = ["easy", "medium", "hard"];

export function getIpaSet(section: string, difficulty: string): IpaSet | undefined {
  return REGISTRY[`${section}.${difficulty}`];
}

export function isIpaSection(s: string): s is IpaSection {
  return s === "vowels" || s === "diphthongs" || s === "consonants";
}

/** Number of exercises in one section+difficulty (0 if not authored yet). */
export function ipaExerciseCount(section: string, difficulty: string): number {
  return getIpaSet(section, difficulty)?.exercises.length ?? 0;
}

/** Total exercises across all difficulties for a section. */
export function ipaSectionTotal(section: string): number {
  return IPA_DIFFICULTIES.reduce((sum, d) => sum + ipaExerciseCount(section, d), 0);
}
