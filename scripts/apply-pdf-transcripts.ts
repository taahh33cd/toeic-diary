#!/usr/bin/env tsx
/**
 * apply-pdf-transcripts.ts
 *
 * Thay transcript của một đề bằng bản nguyên văn đọc từ tài liệu gốc.
 *
 * Vì sao cần: bản đang nằm trong DB (và trong scripts/data/testN/parsed.json)
 * là bản DIỄN ĐẠT LẠI, không phải lời đọc trong audio. Học viên chép đúng
 * những gì nghe được vẫn bị chấm sai cả câu. Đối chiếu với ASR cho thấy tài
 * liệu gốc mới khớp audio.
 *
 * Đầu vào là file JSON gõ lại từ tài liệu, mỗi bài một khoá "P3|Questions 32–34",
 * giá trị là các lượt nói:  [{ "sp": "M" | "W" | null, "t": "..." }]
 *
 * Việc script làm:
 *   - tách mỗi lượt nói thành câu (bài chép chính tả chạy theo từng câu);
 *   - thay toàn bộ câu của bài — số câu bản mới thường khác bản cũ;
 *   - sinh lại ô trống cho Level 1-2, dùng đúng thuật toán của
 *     add-blanks-part3.ts (tối đa 2 ô mỗi câu, không kề nhau, seed theo id câu).
 *
 * Mốc thời gian sau bước này còn SAI — phải chạy realign-broken-timestamps.py
 * rồi apply-realigned-timestamps.ts cho những bài vừa thay.
 *
 * Usage:
 *   tsx scripts/apply-pdf-transcripts.ts <file.json> "<tên đề>"            # xem trước
 *   tsx scripts/apply-pdf-transcripts.ts <file.json> "<tên đề>" --apply
 */

import "dotenv/config";
import fs from "node:fs";
import { prisma } from "../lib/db/prisma";

interface Turn { sp: string | null; t: string }

// ── Tách câu ────────────────────────────────────────────────────────────────

/** Viết tắt có dấu chấm nhưng KHÔNG kết thúc câu. */
const ABBREV = /\b(Dr|Mr|Mrs|Ms|Prof|St|Ave|Blvd|Rd|Inc|Ltd|Co|vs|etc|No|Jr|Sr|a\.m|p\.m)\.$/i;

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  // cắt sau . ! ? khi tiếp theo là khoảng trắng + chữ hoa/số
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/);
  for (const part of parts) {
    buf = buf ? `${buf} ${part}` : part;
    if (ABBREV.test(buf.trim())) continue; // "Dr." chưa phải hết câu
    out.push(buf.trim());
    buf = "";
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(Boolean);
}

// ── Ô trống: giống add-blanks-part3.ts ──────────────────────────────────────

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
  if (/^[A-Z]/.test(word) && pos > 0) return -1; // nhiều khả năng là tên riêng
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

function pickBlanks(sentenceId: string, content: string, count: number) {
  const words = content.trim().split(/\s+/);
  const total = words.length;
  const candidates: { pos: number }[] = [];
  for (let i = 0; i < total; i++) if (scoreWord(words[i], i, total) >= 0) candidates.push({ pos: i });
  if (candidates.length === 0) return [];

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
  return selected.sort((a, b) => a - b).map((pos) => ({
    position: pos,
    answer: words[pos].toLowerCase().replace(/[^a-z0-9']/g, ""),
    hint: makeHint(words[pos]),
  }));
}

// ── Chạy ────────────────────────────────────────────────────────────────────

async function main() {
  const [file, testSetName] = process.argv.slice(2);
  const apply = process.argv.includes("--apply");
  if (!file || !testSetName) {
    console.error('Usage: tsx scripts/apply-pdf-transcripts.ts <file.json> "<tên đề>" [--apply]');
    process.exit(1);
  }

  const data: Record<string, Turn[]> = JSON.parse(fs.readFileSync(file, "utf8"));
  let changed = 0, same = 0, missing = 0;

  for (const [key, turns] of Object.entries(data)) {
    const [partStr, title] = key.split("|");
    const partNumber = Number(partStr.replace("P", ""));

    const lesson = await prisma.lesson.findFirst({
      where: { title, part: { partNumber, testSet: { name: testSetName } } },
      select: { id: true, sentences: { select: { content: true }, orderBy: { orderIndex: "asc" } } },
    });
    if (!lesson) { console.log(`KHÔNG THẤY: ${testSetName} / ${key}`); missing++; continue; }

    const fresh: { content: string; speaker: string | null }[] = [];
    for (const turn of turns) {
      for (const s of splitSentences(turn.t)) fresh.push({ content: s, speaker: turn.sp });
    }

    const oldJoined = lesson.sentences.map((s) => s.content).join(" ");
    const newJoined = fresh.map((s) => s.content).join(" ");
    if (oldJoined === newJoined) { same++; continue; }

    changed++;
    console.log(`\n${key}  (${lesson.sentences.length} câu → ${fresh.length} câu)`);
    console.log(`  cũ : ${oldJoined.slice(0, 100)}`);
    console.log(`  mới: ${newJoined.slice(0, 100)}`);

    if (!apply) continue;

    await prisma.$transaction(async (tx) => {
      await tx.sentence.deleteMany({ where: { lessonId: lesson.id } });
      for (let i = 0; i < fresh.length; i++) {
        const created = await tx.sentence.create({
          data: {
            lessonId: lesson.id,
            orderIndex: i,
            content: fresh[i].content,
            speaker: fresh[i].speaker,
            // mốc thời gian tạm; bước căn lại sẽ ghi đè
            startTime: 0,
            endTime: 0,
          },
          select: { id: true },
        });
        const blanks = pickBlanks(created.id, fresh[i].content, 2);
        if (blanks.length > 0) {
          await tx.blank.createMany({
            data: blanks.map((b) => ({ sentenceId: created.id, lessonId: lesson.id, ...b })),
          });
        }
      }
    });
    console.log("  → đã ghi");
  }

  console.log(`\n${changed} bài khác bản gốc, ${same} bài đã trùng, ${missing} bài không tìm thấy.`);
  console.log(apply ? "Đã ghi DB. Còn phải căn lại mốc thời gian." : "Mới là xem trước. Thêm --apply để ghi.");
  await prisma.$disconnect();
}

main();
