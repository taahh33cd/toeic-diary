#!/usr/bin/env tsx
/**
 * resync-lesson-fields.ts
 *
 * Vá các cột của Lesson còn nói theo transcript CŨ sau khi `sentences` đã đổi.
 *
 * Một bài không chỉ có các câu. Trên bảng Lesson còn:
 *   - transcriptFull : bản ghép cả bài, dùng cho phần học từ vựng và màn xem lại
 *   - explanation    : lời giải đáp án (chỉ Part 2)
 *   - correctOption  : đáp án đúng A/B/C (chỉ Part 2)
 *
 * Hai việc script làm:
 *
 * 1. `--rebuild` : dựng lại transcriptFull từ chính các câu hiện có, cho những
 *    bài vừa thay transcript. Định dạng giữ như cũ: mỗi câu một dòng, có tiền
 *    tố "<speaker>: " khi câu có người nói.
 *
 * 2. `--swap` : với 7 bài bị gắn nhầm chỗ (xem fix-swapped-transcripts.ts),
 *    ba cột trên vẫn nằm ở bài cũ. Trước đây chúng khớp nhau và cùng lệch với
 *    audio; sau khi chuyển các câu về đúng bài thì chúng lệch với chính các
 *    câu ấy. Nên phải chuyển theo đúng phép hoán vị đã dùng.
 *
 * Usage:
 *   tsx scripts/resync-lesson-fields.ts --swap [--apply]
 *   tsx scripts/resync-lesson-fields.ts --rebuild "<tên đề>" <partNumber>... [--apply]
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";

interface Move { testSet: string; partNumber: number; to: string; from: string }

/** Giống hệt MOVES của fix-swapped-transcripts.ts. */
const MOVES: Move[] = [
  { testSet: "EST 2024 Test 10", partNumber: 2, to: "Question 21", from: "Question 19" },
  { testSet: "EST 2024 Test 10", partNumber: 2, to: "Question 22", from: "Question 21" },
  { testSet: "EST 2024 Test 10", partNumber: 2, to: "Question 19", from: "Question 22" },
  { testSet: "EST 2024 Test 5", partNumber: 2, to: "Question 15", from: "Question 13" },
  { testSet: "EST 2024 Test 5", partNumber: 2, to: "Question 13", from: "Question 15" },
  { testSet: "EST 2026 Test 10", partNumber: 3, to: "Questions 65–67", from: "Questions 62–64" },
  { testSet: "EST 2026 Test 10", partNumber: 3, to: "Questions 62–64", from: "Questions 65–67" },
];

function buildTranscript(sentences: { content: string; speaker: string | null }[]): string {
  return sentences.map((s) => (s.speaker ? `${s.speaker}: ${s.content}` : s.content)).join("\n");
}

async function doSwap(apply: boolean) {
  const snapshot = new Map<string, { id: string; transcriptFull: string; explanation: string | null; correctOption: string | null }>();
  for (const m of MOVES) {
    for (const title of [m.to, m.from]) {
      const key = `${m.testSet}|${m.partNumber}|${title}`;
      if (snapshot.has(key)) continue;
      const l = await prisma.lesson.findFirst({
        where: { title, part: { partNumber: m.partNumber, testSet: { name: m.testSet } } },
        select: { id: true, transcriptFull: true, explanation: true, correctOption: true },
      });
      if (!l) throw new Error(`Không tìm thấy bài: ${key}`);
      snapshot.set(key, l);
    }
  }

  for (const m of MOVES) {
    const to = snapshot.get(`${m.testSet}|${m.partNumber}|${m.to}`)!;
    const from = snapshot.get(`${m.testSet}|${m.partNumber}|${m.from}`)!;
    console.log(`${m.testSet} · P${m.partNumber} · ${m.to}  ←  ${m.from}`);
    console.log(`   đáp án ${to.correctOption} → ${from.correctOption}`);
    console.log(`   transcriptFull: ${from.transcriptFull.slice(0, 70).replace(/\n/g, " / ")}`);
    if (!apply) continue;
    await prisma.lesson.update({
      where: { id: to.id },
      data: { transcriptFull: from.transcriptFull, explanation: from.explanation, correctOption: from.correctOption },
    });
    console.log("   → đã ghi");
  }
}

async function doRebuild(testSet: string, parts: number[], apply: boolean) {
  const lessons = await prisma.lesson.findMany({
    where: { part: { partNumber: { in: parts }, testSet: { name: testSet } } },
    select: { id: true, title: true, transcriptFull: true,
      part: { select: { partNumber: true } },
      sentences: { select: { content: true, speaker: true }, orderBy: { orderIndex: "asc" } } },
  });

  let changed = 0;
  for (const l of lessons) {
    const fresh = buildTranscript(l.sentences);
    if (fresh === l.transcriptFull) continue;
    changed++;
    console.log(`${testSet} P${l.part.partNumber} ${l.title}`);
    console.log(`   cũ : ${l.transcriptFull.slice(0, 80).replace(/\n/g, " / ")}`);
    console.log(`   mới: ${fresh.slice(0, 80).replace(/\n/g, " / ")}`);
    if (apply) {
      await prisma.lesson.update({ where: { id: l.id }, data: { transcriptFull: fresh } });
      console.log("   → đã ghi");
    }
  }
  console.log(`\n${testSet}: ${changed}/${lessons.length} bài cần dựng lại transcriptFull.`);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const args = process.argv.slice(2).filter((a) => a !== "--apply");

  if (args[0] === "--swap") {
    await doSwap(apply);
  } else if (args[0] === "--rebuild") {
    const testSet = args[1];
    const parts = args.slice(2).map(Number).filter((n) => !Number.isNaN(n));
    if (!testSet || parts.length === 0) {
      console.error('Usage: tsx scripts/resync-lesson-fields.ts --rebuild "<tên đề>" <partNumber>... [--apply]');
      process.exit(1);
    }
    await doRebuild(testSet, parts, apply);
  } else {
    console.error("Thiếu --swap hoặc --rebuild");
    process.exit(1);
  }

  console.log(apply ? "\nĐã ghi DB." : "\nMới là xem trước. Thêm --apply để ghi.");
  await prisma.$disconnect();
}

main();
