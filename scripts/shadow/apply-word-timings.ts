#!/usr/bin/env tsx
/**
 * Ghi kết quả scripts/shadow/align_word_timings.py vào sentences.word_timings.
 *
 * Mặc định là XEM TRƯỚC: chỉ in thống kê. Thêm --apply để ghi.
 * Câu chỉ được ghi khi số mốc khớp đúng số từ của content hiện tại trong DB
 * (content có thể đã sửa sau lúc export) và mốc tăng dần. Câu căn hỏng (null)
 * thì ghi NULL — giao diện chỉ làm nổi cả câu.
 *
 * Usage:
 *   tsx scripts/shadow/apply-word-timings.ts <word-timings.json> [--apply]
 */

import "dotenv/config";
import fs from "node:fs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/db/prisma";
import { splitDisplayWords } from "../../lib/shadow/prosody";

type Pairs = [number, number][] | null;
interface AlignOut {
  lessons: Record<string, { label: string; sentences: Record<string, Pairs>; issues: { sentenceId: string; reason: string }[] }>;
}

export function checkPairs(pairs: Pairs, content: string): string | null {
  if (pairs === null) return null;
  if (pairs.length !== splitDisplayWords(content).length) return "số mốc khác số từ";
  for (let i = 0; i < pairs.length; i++) {
    const [s, e] = pairs[i];
    if (!(e >= s) || (i > 0 && s < pairs[i - 1][0])) return "mốc không tăng dần";
  }
  return null;
}

async function main() {
  const [file, flag] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: tsx scripts/shadow/apply-word-timings.ts <word-timings.json> [--apply]");
    process.exit(1);
  }
  const apply = flag === "--apply";
  const data: AlignOut = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Object.values(data.lessons).flatMap((l) => Object.entries(l.sentences));
  const rows = await prisma.sentence.findMany({
    where: { id: { in: entries.map(([id]) => id) } },
    select: { id: true, content: true },
  });
  const content = new Map(rows.map((r) => [r.id, r.content]));

  const writes: { id: string; pairs: Pairs }[] = [];
  let missing = 0, rejected = 0, nulls = 0;
  for (const [id, pairs] of entries) {
    const c = content.get(id);
    if (c === undefined) { missing++; continue; }
    const err = checkPairs(pairs, c);
    if (err) { rejected++; console.log(`  bỏ ${id}: ${err}`); continue; }
    if (pairs === null) nulls++;
    writes.push({ id, pairs });
  }
  console.log(`${entries.length} câu trong file | ghi ${writes.length} (${writes.length - nulls} có mốc, ${nulls} NULL) | bỏ ${rejected} | không còn trong DB ${missing}`);
  if (!apply) { console.log("Xem trước — thêm --apply để ghi."); return; }

  for (let i = 0; i < writes.length; i += 200) {
    const batch = writes.slice(i, i + 200);
    await prisma.$transaction(
      batch.map((w) =>
        prisma.sentence.update({ where: { id: w.id }, data: { wordTimings: w.pairs ?? Prisma.DbNull } })
      )
    );
    process.stdout.write(`\r  đã ghi ${Math.min(i + 200, writes.length)}/${writes.length}`);
  }
  console.log("\nXong.");
}

main().finally(() => prisma.$disconnect());
