#!/usr/bin/env tsx
/**
 * Pre-generate key vocabulary for all lessons using Gemini AI.
 * Reads lessons from DB, calls Gemini for each, saves back to DB.
 *
 * Usage:
 *   tsx scripts/generate-vocabulary.ts
 *   tsx scripts/generate-vocabulary.ts --force   # re-generate even if already has vocab
 *
 * Rate: ~24 req/min (one request per 2.5 seconds) to stay under Gemini free-tier limits.
 * Resumable: skips lessons that already have keyVocabulary unless --force is passed.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GoogleGenAI } from "@google/genai";

// ─── Setup ────────────────────────────────────────────────────────────────────

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const DELAY_MS = 8000; // 8s between calls → ~7 RPM (conservative for free tier)
const force = process.argv.includes("--force");

// ─── Vocab extraction ─────────────────────────────────────────────────────────

interface VocabItem {
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

async function extractVocabOnce(transcript: string): Promise<VocabItem[]> {
  const prompt = `You are a TOEIC vocabulary coach. Given an audio transcript, identify 5-8 important English vocabulary words or phrases that a TOEIC learner should know.

Transcript:
"""
${transcript.slice(0, 1200)}
"""

For each word/phrase, provide:
- word: the vocabulary item (base/dictionary form)
- ipa: IPA pronunciation (e.g., /ˈvɒkəbjʊleri/)
- partOfSpeech: one of: noun, verb, adjective, adverb, phrase, idiom
- meaning: Vietnamese translation (concise, 2-6 words)
- example: a natural short example sentence using the word (not the transcript sentence)

Rules:
- Prioritize TOEIC-relevant business/everyday vocabulary
- Skip extremely common words like "the", "is", "and", "I", "you"
- Prefer words that appear in the transcript

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
      word: item.word ?? "",
      ipa: item.ipa ?? "",
      partOfSpeech: item.partOfSpeech ?? "",
      meaning: item.meaning ?? "",
      example: item.example ?? "",
    }))
    .slice(0, 8);
}

async function extractVocab(transcript: string, retries = 3): Promise<VocabItem[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await extractVocabOnce(transcript);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is503 = msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE");
      const is429 = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");

      if ((is503 || is429) && attempt < retries) {
        // 429: wait 70s to let the rate-limit window reset; 503: wait 10s
        const wait = is429 ? 70000 : attempt * 10000;
        process.stdout.write(` (${is429 ? "429" : "503"}, retry ${attempt}/${retries - 1} in ${wait / 1000}s)... `);
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const prisma = createPrisma();

  const allLessons = await prisma.lesson.findMany({
    select: { id: true, title: true, transcriptFull: true, keyVocabulary: true },
    orderBy: { createdAt: "asc" },
  });

  const lessons = force
    ? allLessons
    : allLessons.filter((l) => l.keyVocabulary === null);

  const total = lessons.length;
  if (total === 0) {
    console.log("✅ All lessons already have vocabulary. Use --force to re-generate.");
    await prisma.$disconnect();
    return;
  }

  console.log(`📚 Generating vocabulary for ${total} lessons${force ? " (force mode)" : ""}...`);
  console.log(`⏱  Estimated time: ~${Math.ceil((total * DELAY_MS) / 60000)} minutes\n`);

  let done = 0;
  let errors = 0;

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const progress = `[${i + 1}/${total}]`;
    process.stdout.write(`${progress} ${lesson.title}... `);

    try {
      const vocab = await extractVocab(lesson.transcriptFull);

      await prisma.lesson.update({
        where: { id: lesson.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { keyVocabulary: vocab as any },
      });

      console.log(`✓ (${vocab.length} words)`);
      done++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ERROR: ${msg.slice(0, 80)}`);
      errors++;
    }

    // Rate limit — skip delay after the last item
    if (i + 1 < total) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅ Done: ${done} generated, ${errors} errors.`);
  if (errors > 0) {
    console.log("   Run again to retry failed lessons (they still have null keyVocabulary).");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
