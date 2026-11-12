#!/usr/bin/env tsx
/**
 * fix-swapped-transcripts.ts
 *
 * Trả transcript về đúng bài cho những bài bị gắn nhầm chỗ.
 *
 * Bằng chứng: audio Part 2 và Part 3-4 tự xưng số câu ở đầu ("Number 21.",
 * "Questions 65 through 67 refer to..."). Đối chiếu lời ASR với transcript cho
 * thấy audio nằm ĐÚNG chỗ, còn transcript bị dịch sang bài khác. Ví dụ EST 2024
 * Test 10 Part 2: audio câu 21 đọc "Why are you installing new software", mà
 * transcript ấy lại đang nằm ở bài Question 19.
 *
 * Vì vậy chỉ cần chuyển transcript về đúng bài — không phải viết lại chữ nào,
 * dữ liệu gốc vẫn nguyên văn.
 *
 * Số câu hai bài có thể khác nhau (5 với 7), nên phải thay cả cụm: xoá câu của
 * bài đích rồi tạo lại theo bài nguồn, kèm các ô trống (Blank) đi theo câu.
 * Blank nằm theo vị trí từ trong câu nên bắt buộc phải đi cùng nội dung.
 *
 * Mốc thời gian sau bước này còn SAI — chúng đo trên transcript cũ. Phải chạy
 * tiếp realign-broken-timestamps.py + apply-realigned-timestamps.ts cho đúng
 * những bài đã đổi.
 *
 * Usage:
 *   tsx scripts/fix-swapped-transcripts.ts                 # xem trước
 *   tsx scripts/fix-swapped-transcripts.ts --apply         # ghi DB
 *   tsx scripts/fix-swapped-transcripts.ts --backup <file> # nơi lưu bản cũ
 */

import "dotenv/config";
import fs from "node:fs";
import { prisma } from "../lib/db/prisma";

/** đích ← nguồn: bài `to` nhận transcript đang nằm ở bài `from`. */
interface Move { testSet: string; partNumber: number; to: string; from: string }

const MOVES: Move[] = [
  // EST 2024 Test 10 Part 2 — dịch vòng ba bài
  { testSet: "EST 2024 Test 10", partNumber: 2, to: "Question 21", from: "Question 19" },
  { testSet: "EST 2024 Test 10", partNumber: 2, to: "Question 22", from: "Question 21" },
  { testSet: "EST 2024 Test 10", partNumber: 2, to: "Question 19", from: "Question 22" },
  // EST 2024 Test 5 Part 2 — đổi chỗ đôi
  { testSet: "EST 2024 Test 5", partNumber: 2, to: "Question 15", from: "Question 13" },
  { testSet: "EST 2024 Test 5", partNumber: 2, to: "Question 13", from: "Question 15" },
  // EST 2026 Test 10 Part 3 — đổi chỗ đôi
  { testSet: "EST 2026 Test 10", partNumber: 3, to: "Questions 65–67", from: "Questions 62–64" },
  { testSet: "EST 2026 Test 10", partNumber: 3, to: "Questions 62–64", from: "Questions 65–67" },
];

const SELECT = {
  id: true,
  title: true,
  audioDuration: true,
  sentences: {
    select: {
      orderIndex: true, content: true, speaker: true, optionLabel: true,
      startTime: true, endTime: true,
      blanks: { select: { answer: true, position: true, hint: true } },
    },
    orderBy: { orderIndex: "asc" as const },
  },
} as const;

type LessonRow = {
  id: string;
  title: string;
  audioDuration: number | null;
  sentences: {
    orderIndex: number; content: string; speaker: string | null; optionLabel: string | null;
    startTime: number; endTime: number;
    blanks: { answer: string; position: number; hint: string | null }[];
  }[];
};

async function findLesson(testSet: string, partNumber: number, title: string): Promise<LessonRow> {
  const l = await prisma.lesson.findFirst({
    where: { title, part: { partNumber, testSet: { name: testSet } } },
    select: SELECT,
  });
  if (!l) throw new Error(`Không tìm thấy bài: ${testSet} / P${partNumber} / ${title}`);
  return l as LessonRow;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const bIdx = process.argv.indexOf("--backup");
  const backupPath = bIdx !== -1 ? process.argv[bIdx + 1] : null;

  // Đọc TOÀN BỘ trước khi ghi bất cứ gì: các bài hoán vòng tham chiếu lẫn nhau,
  // đọc xen ghi sẽ lấy phải nội dung vừa bị thay.
  const snapshot = new Map<string, LessonRow>();
  for (const m of MOVES) {
    for (const title of [m.to, m.from]) {
      const key = `${m.testSet}|${m.partNumber}|${title}`;
      if (!snapshot.has(key)) snapshot.set(key, await findLesson(m.testSet, m.partNumber, title));
    }
  }

  if (backupPath) {
    fs.writeFileSync(backupPath, JSON.stringify([...snapshot.entries()], null, 2), "utf8");
    console.log(`Đã lưu bản cũ: ${backupPath}\n`);
  }

  for (const m of MOVES) {
    const to = snapshot.get(`${m.testSet}|${m.partNumber}|${m.to}`)!;
    const from = snapshot.get(`${m.testSet}|${m.partNumber}|${m.from}`)!;
    console.log(`${m.testSet} · P${m.partNumber} · ${m.to}  ←  ${m.from}`);
    console.log(`   cũ (${to.sentences.length} câu): ${to.sentences.map((s) => s.content).join(" ").slice(0, 90)}`);
    console.log(`   mới (${from.sentences.length} câu): ${from.sentences.map((s) => s.content).join(" ").slice(0, 90)}`);

    if (!apply) continue;

    await prisma.$transaction(async (tx) => {
      await tx.sentence.deleteMany({ where: { lessonId: to.id } });
      for (const s of from.sentences) {
        const created = await tx.sentence.create({
          data: {
            lessonId: to.id,
            orderIndex: s.orderIndex,
            content: s.content,
            speaker: s.speaker,
            optionLabel: s.optionLabel,
            // Mốc thời gian tạm mượn của bài nguồn; bước căn lại sẽ ghi đè.
            startTime: s.startTime,
            endTime: s.endTime,
          },
          select: { id: true },
        });
        for (const b of s.blanks) {
          await tx.blank.create({
            data: { sentenceId: created.id, lessonId: to.id, answer: b.answer, position: b.position, hint: b.hint },
          });
        }
      }
    });
    console.log("   → đã ghi");
  }

  console.log(apply
    ? "\nXong. Mốc thời gian của những bài này còn sai — phải căn lại."
    : "\nMới là xem trước. Thêm --apply để ghi.");
  await prisma.$disconnect();
}

main();
