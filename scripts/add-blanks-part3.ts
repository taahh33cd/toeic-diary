#!/usr/bin/env tsx
/**
 * Thêm Blank records cho tất cả sentences của Part 3 practice.
 * Chạy sau khi import-part3-practice.ts thành công.
 * Usage: tsx scripts/add-blanks-part3.ts
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "up", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "not",
  "no", "so", "if", "as", "it", "its", "this", "that", "these", "those",
  "i", "we", "you", "he", "she", "they", "me", "him", "her", "us", "them",
  "my", "our", "your", "his", "their", "about", "after", "before", "then",
  "than", "very", "just", "also", "more", "some", "any", "all", "both",
  "oh", "um", "uh", "yeah", "yes", "no", "well", "okay", "ok", "hi",
]);

function scoreWord(word: string, pos: number, total: number): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 3) return -1;
  if (STOP_WORDS.has(w)) return -1;
  if (/^[A-Z]/.test(word) && pos > 0) return -1; // likely proper noun

  let score = 0;
  if (w.length >= 6) score += 20;
  else if (w.length >= 4) score += 10;
  if (pos > 0 && pos < total - 1) score += 10;
  return score;
}

function makeHint(word: string): string {
  const clean = word.replace(/[^a-zA-Z0-9]/g, "");
  return clean[0] + "_".repeat(Math.max(1, clean.length - 1));
}

function pickBlanks(
  sentenceId: string,
  content: string,
  count: number,
): { position: number; answer: string; hint: string }[] {
  const words = content.trim().split(/\s+/);
  const total = words.length;

  const candidates: { pos: number; score: number }[] = [];
  for (let i = 0; i < total; i++) {
    const s = scoreWord(words[i], i, total);
    if (s >= 0) candidates.push({ pos: i, score: s });
  }
  if (candidates.length === 0) return [];

  // Deterministic seed from sentenceId
  const seed = sentenceId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = [...candidates].sort((a, b) => {
    const ha = Math.sin(seed + a.pos * 127.1) * 43758.5453;
    const hb = Math.sin(seed + b.pos * 127.1) * 43758.5453;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });

  const selected: number[] = [];
  for (const { pos } of shuffled) {
    if (selected.length >= count) break;
    if (selected.every((p) => Math.abs(p - pos) >= 2)) selected.push(pos);
  }

  return selected.sort((a, b) => a - b).map((pos) => {
    const raw = words[pos];
    return {
      position: pos,
      answer:   raw.toLowerCase().replace(/[^a-z0-9']/g, ""),
      hint:     makeHint(raw),
    };
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");

  const pool    = new Pool({ connectionString, max: 1 });
  const adapter = new PrismaPg(pool);
  const prisma  = new PrismaClient({ adapter } as any);

  const series = await prisma.testSeries.findUnique({
    where: { slug: "part3-practice" },
    include: {
      testSets: {
        include: {
          parts: {
            include: {
              lessons: {
                include: {
                  sentences: { include: { blanks: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!series) {
    console.error('Series "part3-practice" not found. Chạy import-part3-practice.ts trước.');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const set of series.testSets) {
    for (const part of set.parts) {
      for (const lesson of part.lessons) {
        for (const sentence of lesson.sentences) {
          if (sentence.blanks.length > 0) {
            skipped++;
            continue;
          }
          const blanks = pickBlanks(sentence.id, sentence.content, 2);
          if (blanks.length === 0) {
            console.warn(`  ⚠ Không tìm được blank: "${sentence.content.slice(0, 60)}"`);
            continue;
          }
          await prisma.blank.createMany({
            data: blanks.map((b) => ({
              sentenceId: sentence.id,
              lessonId:   lesson.id,
              position:   b.position,
              answer:     b.answer,
              hint:       b.hint,
            })),
          });
          created += blanks.length;
        }
      }
    }
  }

  console.log(`\n✅ Xong! Đã tạo ${created} blanks, bỏ qua ${skipped} sentences đã có.`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
