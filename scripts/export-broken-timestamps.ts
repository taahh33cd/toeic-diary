#!/usr/bin/env tsx
/**
 * export-broken-timestamps.ts
 *
 * Bước 1 của pipeline sửa timestamp lỗi khu dictation:
 *   1. tsx  scripts/export-broken-timestamps.ts <out.json> [--download <audioDir>]
 *   2. py -3.11 scripts/realign-broken-timestamps.py <out.json> <audioDir> <realigned.json>
 *   3. tsx  scripts/apply-realigned-timestamps.ts <realigned.json> [--apply]
 *
 * Dò hai loại bài cần căn lại:
 *
 * A. Câu mà ngay cả lưới an toàn trong lib/practice/segment.ts cũng không cứu
 *    được — khoảng nghe còn ngắn hơn nhịp đọc chậm nhất (0.22 giây/từ, dưới
 *    phân vị 1% của 4.684 câu hợp lệ).
 *
 * B. Bài mang DẤU VẾT CHIA ĐỀU: khi alignment lúc import thất bại, script cũ
 *    rải các câu còn lại cách nhau một khoảng y hệt nhau. Ví dụ EST 2024 Test 9
 *    Questions 68–70 có 7 câu cách đúng 1.03s và rải tới 90.6s, trong khi ASR
 *    cho thấy hội thoại kết thúc ở 44.6s — phần sau chỉ là giọng đọc câu hỏi.
 *    Loại này nguy hiểm hơn loại A vì độ dài mỗi câu trông vẫn hợp lý, chỉ có
 *    VỊ TRÍ là sai, nên lưới an toàn không phát hiện được.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db/prisma";
import { tokenizeSentence } from "../lib/practice/match";
import { buildSegmentWindows } from "../lib/practice/segment";

const SUSPECT_SEC_PER_WORD = 0.22;
const SERIES = ["ets-2026", "ets-2024"];

async function main() {
  const out = process.argv[2];
  if (!out) {
    console.error("Usage: tsx scripts/export-broken-timestamps.ts <out.json> [--download <audioDir>] [--all]");
    process.exit(1);
  }
  const dlIdx = process.argv.indexOf("--download");
  const audioDir = dlIdx !== -1 ? process.argv[dlIdx + 1] : null;
  // --all: xuất MỌI bài, không chỉ bài bị gắn cờ. Dùng để audit độ nguyên văn
  // của transcript trên toàn bộ dữ liệu (coverage ASR là thước đo khách quan).
  const all = process.argv.includes("--all");

  const lessons = await prisma.lesson.findMany({
    where: { part: { testSet: { series: { slug: { in: SERIES } } } } },
    select: {
      id: true, title: true, audioUrl: true, audioDuration: true,
      part: { select: { partNumber: true, testSet: { select: { name: true, series: { select: { slug: true } } } } } },
      sentences: {
        select: { id: true, orderIndex: true, content: true, startTime: true, endTime: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  const result: any[] = [];
  for (const l of lessons) {
    const ss = l.sentences;
    const windows = buildSegmentWindows(ss, l.audioDuration);
    const reasons: string[] = [];

    // A. câu lưới an toàn không cứu được
    const badIdx: number[] = [];
    for (let i = 0; i < ss.length; i++) {
      const words = tokenizeSentence(ss[i].content).length;
      const got = windows[i].end - windows[i].start;
      if (Number.isFinite(got) && got < words * SUSPECT_SEC_PER_WORD) badIdx.push(i);
    }
    if (badIdx.length) reasons.push(`${badIdx.length} câu dưới ${SUSPECT_SEC_PER_WORD} s/từ`);

    // B. dấu vết chia đều: >= 4 câu liền nhau có khoảng cách startTime y hệt
    if (ss.length >= 3) {
      let run = 1, maxRun = 1, runDelta = 0;
      for (let i = 2; i < ss.length; i++) {
        const d1 = ss[i].startTime - ss[i - 1].startTime;
        const d0 = ss[i - 1].startTime - ss[i - 2].startTime;
        if (d0 > 0.2 && Math.abs(d1 - d0) < 0.06) { run++; if (run > maxRun) { maxRun = run; runDelta = d1; } }
        else run = 1;
      }
      if (maxRun >= 3) reasons.push(`${maxRun + 1} câu cách đều ${runDelta.toFixed(2)}s`);
    }

    // B'. mọi câu dồn vào đoạn đầu file
    if (ss.length >= 3 && l.audioDuration > 0) {
      const lastEnd = Math.max(...ss.map((s) => s.endTime));
      if (lastEnd > 0 && lastEnd < l.audioDuration * 0.2)
        reasons.push(`mọi câu dồn trong ${((lastEnd / l.audioDuration) * 100).toFixed(0)}% đầu file`);
    }

    if (reasons.length === 0 && !all) continue;

    result.push({
      lessonId: l.id,
      label: `${l.part.testSet.series.slug}|${l.part.testSet.name}|P${l.part.partNumber}|${l.title}`,
      reasons,
      audioUrl: l.audioUrl,
      audioFile: `${l.id}.mp3`,
      audioDuration: l.audioDuration,
      badIdx,
      sentences: l.sentences.map((s) => ({
        id: s.id,
        orderIndex: s.orderIndex,
        content: s.content,
        words: tokenizeSentence(s.content),
        dbStart: s.startTime,
        dbEnd: s.endTime,
      })),
    });
  }

  fs.writeFileSync(out, JSON.stringify(result, null, 2), "utf8");
  if (all) {
    const flagged = result.filter((r) => r.reasons.length > 0).length;
    console.log(`${result.length} bài (${flagged} bài bị gắn cờ) -> ${out}`);
  } else {
    console.log(`${result.length} bài cần căn lại -> ${out}`);
    for (const r of result)
      console.log(`  ${r.label}  (${r.sentences.length} câu) | ${r.reasons.join(" | ")}`);
  }

  if (audioDir !== null) {
    const dir: string = audioDir;
    fs.mkdirSync(dir, { recursive: true });
    let done = 0, skipped = 0, failed = 0;
    const CONCURRENCY = 8;
    const queue = [...result];
    async function worker() {
      for (;;) {
        const r = queue.shift();
        if (!r) return;
        const dest = path.join(dir, r.audioFile);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { skipped++; continue; }
        try {
          const res = await fetch(r.audioUrl);
          if (!res.ok) { failed++; console.log(`LỖI ${res.status}  ${r.label}`); continue; }
          fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
          done++;
          if (done % 50 === 0) console.log(`  ...tải ${done} file`);
        } catch (e: any) { failed++; console.log(`LỖI ${e.message}  ${r.label}`); }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`audio: tải mới ${done}, có sẵn ${skipped}, lỗi ${failed}`);
  }
}

main().finally(() => prisma.$disconnect());
