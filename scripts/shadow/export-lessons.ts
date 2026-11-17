#!/usr/bin/env tsx
/**
 * Xuất bài cần căn mốc từng từ cho Shadow → lessons.json
 * (đầu vào của scripts/shadow/align_word_timings.py).
 *
 * Usage:
 *   tsx scripts/shadow/export-lessons.ts <out.json> [--only-missing] [--test "EST 2026 Test 1"]
 *
 *   --only-missing  chỉ lấy bài còn câu chưa có word_timings (dùng khi thêm đề mới)
 *   --test          chỉ lấy một bộ đề theo tên test_sets.name
 */

import "dotenv/config";
import fs from "node:fs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/db/prisma";

async function main() {
  const args = process.argv.slice(2);
  const outPath = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--test");
  if (!outPath) {
    console.error('Usage: tsx scripts/shadow/export-lessons.ts <out.json> [--only-missing] [--test "<tên bộ đề>"]');
    process.exit(1);
  }
  const onlyMissing = args.includes("--only-missing");
  const testIdx = args.indexOf("--test");
  const testName = testIdx >= 0 ? args[testIdx + 1] : undefined;

  const lessons = await prisma.lesson.findMany({
    where: {
      audioUrl: { notIn: ["", "pending"] },
      ...(testName ? { part: { testSet: { name: testName } } } : {}),
      ...(onlyMissing ? { sentences: { some: { wordTimings: { equals: Prisma.DbNull } } } } : {}),
    },
    orderBy: [{ part: { testSet: { orderIndex: "asc" } } }, { part: { partNumber: "asc" } }, { orderIndex: "asc" }],
    select: {
      id: true,
      title: true,
      audioUrl: true,
      part: { select: { partNumber: true, testSet: { select: { name: true } } } },
      sentences: {
        orderBy: { orderIndex: "asc" },
        select: { id: true, content: true, startTime: true, endTime: true },
      },
    },
  });

  const out = lessons.map((l) => ({
    id: l.id,
    label: `${l.part.testSet.name} · P${l.part.partNumber} · ${l.title}`,
    audioUrl: l.audioUrl,
    sentences: l.sentences,
  }));
  fs.writeFileSync(outPath, JSON.stringify(out));
  console.log(`Đã xuất ${out.length} bài, ${out.reduce((n, l) => n + l.sentences.length, 0)} câu → ${outPath}`);
}

main().finally(() => prisma.$disconnect());
