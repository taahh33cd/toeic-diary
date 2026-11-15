#!/usr/bin/env tsx
/**
 * export-practice-timestamps.ts
 *
 * Bước 1 của pipeline căn mốc, dùng cho các bộ LUYỆN TẬP (part3-practice,
 * part4-practice…). Xuất đúng khuôn mà realign-broken-timestamps.py cần.
 *
 * Vì sao không dùng export-broken-timestamps.ts: script đó chỉ quét hai series
 * đề thi `ets-2026` / `ets-2024`, và chỉ xuất bài BỊ GẮN CỜ. Ở đây ta cần xuất
 * trọn một bộ, kể cả bài chưa có mốc nào (mới import, startTime = 0).
 *
 * Usage:
 *   tsx scripts/export-practice-timestamps.ts <out.json> --sets part4-basic,part4-advanced [--download <audioDir>]
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db/prisma";
import { tokenizeSentence } from "../lib/practice/match";

async function main() {
  const out = process.argv[2];
  const si = process.argv.indexOf("--sets");
  const slugs = si !== -1 ? (process.argv[si + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : [];
  const di = process.argv.indexOf("--download");
  const audioDir = di !== -1 ? process.argv[di + 1] : null;

  if (!out || slugs.length === 0) {
    console.error(
      'Usage: tsx scripts/export-practice-timestamps.ts <out.json> --sets <slug,slug> [--download <audioDir>]'
    );
    process.exit(1);
  }

  const lessons = await prisma.lesson.findMany({
    where: { part: { testSet: { slug: { in: slugs } } } },
    select: {
      id: true, title: true, audioUrl: true, audioDuration: true, orderIndex: true,
      part: { select: { partNumber: true, testSet: { select: { name: true, slug: true } } } },
      sentences: {
        select: { id: true, orderIndex: true, content: true, startTime: true, endTime: true },
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  if (lessons.length === 0) {
    console.error(`Không tìm thấy bài nào thuộc: ${slugs.join(", ")}`);
    process.exit(1);
  }

  const result = lessons.map((l) => ({
    lessonId: l.id,
    label: `${l.part.testSet.slug}|${l.part.testSet.name}|P${l.part.partNumber}|${l.title}`,
    reasons: ["xuat-ca-bo"],
    audioUrl: l.audioUrl,
    audioFile: `${l.id}.mp3`,
    audioDuration: l.audioDuration,
    badIdx: l.sentences.map((s) => s.orderIndex),
    sentences: l.sentences.map((s) => ({
      id: s.id,
      orderIndex: s.orderIndex,
      content: s.content,
      words: tokenizeSentence(s.content),
      dbStart: s.startTime,
      dbEnd: s.endTime,
    })),
  }));

  fs.writeFileSync(out, JSON.stringify(result, null, 2), "utf8");
  const câu = result.reduce((n, r) => n + r.sentences.length, 0);
  console.log(`${result.length} bài, ${câu} câu → ${out}`);

  if (audioDir) {
    fs.mkdirSync(audioDir, { recursive: true });
    let tải = 0;
    for (const r of result) {
      const dest = path.join(audioDir, r.audioFile);
      if (fs.existsSync(dest)) continue;
      if (!r.audioUrl) { console.log(`thiếu audioUrl: ${r.label}`); continue; }
      const res = await fetch(r.audioUrl);
      if (!res.ok) { console.log(`tải lỗi ${r.label}: ${res.status}`); continue; }
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      tải++;
    }
    console.log(`tải về ${tải} file audio vào ${audioDir}`);
  }

  await prisma.$disconnect();
}

main();
