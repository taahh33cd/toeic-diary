#!/usr/bin/env tsx
/**
 * check-practice-windows.ts
 *
 * Kiểm cửa sổ nghe của một bộ luyện tập bằng CHÍNH `lib/practice/segment.ts`
 * mà trình phát dùng, rồi đối chiếu với mốc lời nói thật do ASR đo.
 *
 * Trả lời đúng hai câu hỏi học viên hay phàn nàn:
 *   - có bị CẮT mất tiếng ở đầu/cuối câu không?
 *   - có nghe LẤN sang lời của câu bên cạnh không?
 *
 * Mốc ASR lấy từ file realigned.json do realign-broken-timestamps.py sinh ra,
 * nên phải chạy sau bước căn mốc.
 *
 * Usage:
 *   tsx scripts/check-practice-windows.ts <realigned.json> <slug,slug>
 */

import "dotenv/config";
import fs from "node:fs";
import { prisma } from "../lib/db/prisma";
import { buildSegmentWindows } from "../lib/practice/segment";

interface Re {
  sentences: { id: string; newStart: number | null; newEnd: number | null }[];
}

async function main() {
  const [file, slugArg] = process.argv.slice(2);
  if (!file || !slugArg) {
    console.error("Usage: tsx scripts/check-practice-windows.ts <realigned.json> <slug,slug>");
    process.exit(1);
  }
  const slugs = slugArg.split(",").map((s) => s.trim()).filter(Boolean);

  const asr: Record<string, Re> = JSON.parse(fs.readFileSync(file, "utf8"));
  const truth = new Map<string, { s: number; e: number }>();
  for (const L of Object.values(asr)) {
    for (const s of L.sentences) {
      if (s.newStart !== null && s.newEnd !== null) truth.set(s.id, { s: s.newStart, e: s.newEnd });
    }
  }

  const lessons = await prisma.lesson.findMany({
    where: { part: { testSet: { slug: { in: slugs } } } },
    select: {
      title: true, audioDuration: true,
      sentences: {
        select: { id: true, content: true, startTime: true, endTime: true },
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  let n = 0, zero = 0, overrun = 0, clipHead = 0, clipTail = 0, bleedPrev = 0, bleedNext = 0;
  const chi: string[] = [];

  for (const l of lessons) {
    const ws = buildSegmentWindows(l.sentences, l.audioDuration ?? 0);
    for (let i = 0; i < l.sentences.length; i++) {
      const s = l.sentences[i];
      const w = ws[i];
      n++;
      if (s.startTime === 0 && s.endTime === 0) zero++;
      if (l.audioDuration && Number.isFinite(w.playUntil) && w.playUntil > l.audioDuration + 0.01) overrun++;
      const t = truth.get(s.id);
      if (!t) continue;

      if (w.start > t.s + 0.01) { clipHead++; chi.push(`${l.title} #${i} cụt đầu ${(w.start - t.s).toFixed(2)}s`); }
      if (Number.isFinite(w.playUntil) && w.playUntil < t.e - 0.01) {
        clipTail++; chi.push(`${l.title} #${i} cụt đuôi ${(t.e - w.playUntil).toFixed(2)}s`);
      }
      const prev = i > 0 ? truth.get(l.sentences[i - 1].id) : null;
      const next = i + 1 < l.sentences.length ? truth.get(l.sentences[i + 1].id) : null;
      if (prev && w.start < prev.e - 0.01) {
        bleedPrev++; chi.push(`${l.title} #${i} lùi vào câu trước ${(prev.e - w.start).toFixed(2)}s`);
      }
      if (next && Number.isFinite(w.playUntil) && w.playUntil > next.s + 0.01) {
        bleedNext++; chi.push(`${l.title} #${i} tràn sang câu sau ${(w.playUntil - next.s).toFixed(2)}s`);
      }
    }
  }

  console.log(`${lessons.length} bài, ${n} câu — dựng cửa sổ bằng chính segment.ts của trình phát\n`);
  console.log(`mốc 0-0 còn lại            : ${zero}`);
  console.log(`cửa sổ vượt quá độ dài file: ${overrun}`);
  console.log(`câu bị CẮT tiếng đầu       : ${clipHead}`);
  console.log(`câu bị CẮT tiếng cuối      : ${clipTail}`);
  console.log(`câu LÙI vào lời câu trước  : ${bleedPrev}`);
  console.log(`câu TRÀN sang lời câu sau  : ${bleedNext}`);
  if (chi.length) {
    console.log(`\n${chi.length} chỗ còn lệch:`);
    chi.slice(0, 25).forEach((x) => console.log(`  ${x}`));
  } else {
    console.log("\nSạch: không câu nào bị cắt tiếng, không câu nào lấn sang câu bên cạnh.");
  }
  await prisma.$disconnect();
}

main();
