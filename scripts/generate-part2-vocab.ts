#!/usr/bin/env tsx
/**
 * Generate key vocabulary for Part 2 practice lessons (short transcripts).
 *
 * Unlike scripts/generate-vocabulary.ts (5-8 words, built for Part 1/3/4 transcripts),
 * this asks for 3-4 items and prefers collocations, because a Part 2 transcript is only
 * one question + three options (~110 characters).
 *
 * Usage:
 *   tsx scripts/generate-part2-vocab.ts part2-who-what-which
 *   tsx scripts/generate-part2-vocab.ts part2-who-what-which --force
 *   tsx scripts/generate-part2-vocab.ts part2-who-what-which --limit=3   # smoke-test the prompt
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GoogleGenAI } from "@google/genai";

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const DELAY_MS = 8000; // ~7 RPM — conservative for the Gemini free tier
const slug = process.argv[2] ?? "part2-who-what-which";
const force = process.argv.includes("--force");

interface VocabItem {
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

/** Words too common to be worth a flashcard. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been",
  "i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those",
  "go", "goes", "went", "come", "came", "do", "does", "did", "have", "has", "had",
  "get", "got", "make", "made", "take", "took", "yes", "no", "not", "very", "just",
  "name", "time", "day", "week", "month", "year", "today", "yesterday", "tomorrow",
  "morning", "afternoon", "evening", "here", "there", "now", "then", "one", "two",
  // Function words and bare high-frequency verbs — useless as a spelling drill
  "the one", "mine", "yours", "his", "hers", "ours", "theirs", "about", "for",
  "with", "from", "between", "among", "into", "over", "under", "after", "before",
  "almost", "usually", "normally", "often", "always", "never", "sometimes",
  "believe", "heard", "hear", "think", "know", "want", "need", "like", "liked",
  "read", "say", "said", "tell", "told", "see", "saw", "look", "give", "gave",
  "next month", "next week", "this morning", "right now", "sometime", "last",
  "very good", "very soon", "usually best", "buy", "buys", "bought",
  // Time fillers and bare adjectives — nothing to study on a card
  "at the moment", "about an hour", "about two hours", "at eight o'clock",
  "eight-thirty", "on monday", "see you then", "good idea", "latest", "sixteen",
  "try", "stay", "enjoyed", "just a few",
]);

/** A trailing number means the model grabbed an identifier (e.g. "flight 48"). */
const HAS_DIGIT = /\d/;

/** The model sometimes returns a split phrase, e.g. "leave ... on" — not a usable card. */
const HAS_ELLIPSIS = /\.\.\.|…/;

/** A finite be-verb means it returned a clause ("manager is new", "isn't it"). */
const BE_VERB = /\b(is|are|was|were|isn't|aren't|wasn't|weren't)\b/;

/** Ending on a pronoun leaves nothing to learn ("have it", "either one"). */
const TRAILING_PRONOUN = /\b(it|them|one|me|you|us|him|her|its|they)$/;

/** An item made only of these carries no meaning to study. */
const FUNCTION_WORDS = new Set([
  "a", "an", "the", "at", "in", "on", "of", "to", "for", "by", "up", "out",
  "so", "as", "at the", "much", "many", "few", "some", "any", "every", "all",
  "yet", "already", "still", "soon", "then", "there", "here", "back", "well",
  "how", "what", "when", "where", "why", "who", "which", "that", "this",
  "do", "did", "does", "be", "been", "have", "has", "had", "will", "would",
  "can", "could", "should", "just", "only", "quite", "rather", "too", "very",
]);

async function extractOnce(transcript: string): Promise<VocabItem[]> {
  const prompt = `You are a TOEIC Part 2 coach. Below is one short Question-Response item: a question plus three answer options.

"""
${transcript}
"""

Pick exactly 3 or 4 vocabulary items a TOEIC learner should study before listening to it.

For each item provide:
- word: the item in base/dictionary form. Prefer a collocation, phrasal verb or noun phrase over a bare word (e.g. "set up", "technical support", "gift card"). Maximum 3 words.
- ipa: IPA pronunciation, e.g. /sɛt ʌp/
- partOfSpeech: one of: noun, verb, adjective, adverb, phrase, idiom
- meaning: Vietnamese translation, 2-6 words
- example: a natural short English sentence using the item — must NOT be a sentence from the transcript

Rules:
- Every item must actually appear in the transcript above.
- Never pick a proper noun: no person names, city names, hotel/company/brand names.
- Never pick extremely common words (the, is, go, yes, name, afternoon, ...).
- Prefer items that carry the meaning of the question or of the correct answer.
- Never use an ellipsis to join separated words: return "leave on", not "leave ... on".
- Return a dictionary item, never a clause or a sentence fragment: no "manager is new", no "isn't it".
- Never pick a bare time expression or number ("eight-thirty", "about an hour", "sixteen").

Return ONLY a valid JSON array, no explanation:
[{"word":"...","ipa":"...","partOfSpeech":"...","meaning":"...","example":"..."}]`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  const parsed: unknown = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item): item is Record<string, string> =>
        typeof item === "object" && item !== null &&
        typeof (item as Record<string, unknown>).word === "string"
    )
    .map((item) => ({
      word: (item.word ?? "").trim(),
      ipa: item.ipa ?? "",
      partOfSpeech: item.partOfSpeech ?? "",
      meaning: item.meaning ?? "",
      example: item.example ?? "",
    }));
}

/** Drop proper nouns, stopwords, long phrases and items absent from the transcript. */
function clean(items: VocabItem[], transcript: string): VocabItem[] {
  const haystack = transcript.toLowerCase();
  const seen = new Set<string>();
  const out: VocabItem[] = [];

  for (const item of items) {
    const w = item.word;
    if (!w) continue;
    const lower = w.toLowerCase();
    if (seen.has(lower)) continue;
    if (STOPWORDS.has(lower)) continue;
    if (HAS_DIGIT.test(lower)) continue;
    if (HAS_ELLIPSIS.test(lower)) continue;
    if (BE_VERB.test(lower)) continue;
    if (TRAILING_PRONOUN.test(lower)) continue;
    if (lower.length < 3) continue;
    const tokens = w.split(/\s+/);
    if (tokens.length > 3) continue;
    if (tokens.every((t) => FUNCTION_WORDS.has(t.toLowerCase()))) continue;
    // A capitalised word that is not sentence-initial in the transcript is a proper noun.
    if (/^[A-Z]/.test(w) && !haystack.includes(`\n${lower}`) && !haystack.startsWith(lower)) continue;
    if (!haystack.includes(lower.split(/\s+/)[0])) continue;
    seen.add(lower);
    out.push({ ...item, word: lower });
    if (out.length === 4) break;
  }

  return out;
}

async function extract(transcript: string, retries = 3): Promise<VocabItem[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const items = clean(await extractOnce(transcript), transcript);
      if (items.length >= 2) return items;
      if (attempt < retries) {
        process.stdout.write(` (only ${items.length} kept, retry ${attempt})... `);
        await sleep(3000);
        continue;
      }
      return items;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is503 = msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE");
      const is429 = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");

      if ((is503 || is429) && attempt < retries) {
        const wait = is429 ? 70000 : attempt * 10000;
        process.stdout.write(` (${is429 ? "429" : "503"}, retry ${attempt} in ${wait / 1000}s)... `);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  return [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const prisma = createPrisma();

  const testSet = await prisma.testSet.findUnique({
    where: { slug },
    include: {
      parts: {
        where: { partNumber: 2 },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, title: true, transcriptFull: true, keyVocabulary: true },
          },
        },
      },
    },
  });

  if (!testSet) {
    console.error(`Test set not found: ${slug}`);
    process.exit(1);
  }

  const allLessons = testSet.parts.flatMap((p) => p.lessons);
  // --repair: re-generate lessons whose stored vocab contains an item the current
  // filter would reject (used after tightening STOPWORDS).
  const repair = process.argv.includes("--repair");
  const pending = repair
    ? allLessons.filter((l) => {
        const stored = (l.keyVocabulary ?? []) as unknown as VocabItem[];
        if (!Array.isArray(stored) || stored.length < 2) return true;
        return clean(stored, l.transcriptFull).length !== stored.length;
      })
    : force
      ? allLessons
      : allLessons.filter((l) => l.keyVocabulary === null);
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const lessons = limitArg ? pending.slice(0, Number(limitArg.split("=")[1])) : pending;

  if (lessons.length === 0) {
    console.log("✅ All lessons already have vocabulary. Use --force to re-generate.");
    await prisma.$disconnect();
    return;
  }

  console.log(`📚 ${slug}: generating for ${lessons.length}/${allLessons.length} lessons`);
  console.log(`⏱  Estimated time: ~${Math.ceil((lessons.length * DELAY_MS) / 60000)} minutes\n`);

  let done = 0;
  let errors = 0;

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    process.stdout.write(`[${i + 1}/${lessons.length}] ${lesson.title}... `);

    try {
      const vocab = await extract(lesson.transcriptFull);
      await prisma.lesson.update({
        where: { id: lesson.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { keyVocabulary: vocab as any },
      });
      console.log(`✓ ${vocab.map((v) => v.word).join(", ")}`);
      done++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ERROR: ${msg.slice(0, 80)}`);
      errors++;
    }

    if (i + 1 < lessons.length) await sleep(DELAY_MS);
  }

  console.log(`\n✅ Done: ${done} generated, ${errors} errors.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
