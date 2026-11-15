#!/usr/bin/env tsx
/** Xuất 15 bài Part 3 practice theo đúng khuôn realign-broken-timestamps.py cần. */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db/prisma";
import { tokenizeSentence } from "../lib/practice/match";

async function main() {
  const out = process.argv[2];
  const dlIdx = process.argv.indexOf("--download");
  const audioDir = dlIdx !== -1 ? process.argv[dlIdx + 1] : null;

  const lessons = await prisma.lesson.findMany({
    where: { part: { testSet: { slug: { in: ["part3-basic", "part3-advanced"] } } } },
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

  const result = lessons.map((l) => ({
    lessonId: l.id,
    label: `${l.part.testSet.slug}|${l.part.testSet.name}|P${l.part.partNumber}|${l.title}`,
    reasons: ["p3-practice-audit"],
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
  console.log(`${result.length} bài → ${out}`);

  if (audioDir) {
    fs.mkdirSync(audioDir, { recursive: true });
    for (const r of result) {
      const dest = path.join(audioDir, r.audioFile);
      if (fs.existsSync(dest)) continue;
      const res = await fetch(r.audioUrl!);
      if (!res.ok) { console.log(`tải lỗi ${r.label}: ${res.status}`); continue; }
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      console.log(`tải ${r.audioFile}`);
    }
  }
  await prisma.$disconnect();
}
main();
