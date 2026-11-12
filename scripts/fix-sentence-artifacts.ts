#!/usr/bin/env tsx
/**
 * fix-sentence-artifacts.ts
 *
 * Dọn hai vết bẩn còn sót trong dữ liệu câu của khu dictation.
 *
 * 1. NHÃN NGƯỜI NÓI LỌT VÀO NỘI DUNG — "W-Br: As you know, we've had…".
 *    Nhãn đã có cột `speaker` riêng, nên để trong nội dung là thừa: học viên
 *    nhìn thấy nó trong bài, và tệ hơn, ô trống Level 1-2 neo theo vị trí từ
 *    nên có thể trỏ thẳng vào cái nhãn.
 *
 * 2. VIẾT TẮT BỊ TÁCH THÀNH CÂU RIÊNG — câu "Ms." đứng một mình rồi câu sau
 *    mới là "Junko Adachi is the director…". Do bước tách câu lúc import cắt
 *    ở dấu chấm của "Ms.". Khoảng nghe của một câu một từ ngắn đến mức gần
 *    như không nghe được, và câu sau thì mất chủ ngữ.
 *
 * Ô trống được sinh lại cho câu nào bị sửa, vì vị trí từ đã đổi.
 * Mốc thời gian: câu gộp lấy từ đầu câu trước đến cuối câu sau.
 *
 * Usage:
 *   tsx scripts/fix-sentence-artifacts.ts            # xem trước
 *   tsx scripts/fix-sentence-artifacts.ts --apply
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";

const SERIES = ["ets-2026", "ets-2024"];
/** "W-Br:", "M-Au:", "W1:", "M:" … ở đầu câu */
const SPEAKER_PREFIX = /^\s*((?:W|M)(?:-(?:Am|Au|Br|Cn))?\s*\d?)\s*:\s*/i;
/** câu chỉ gồm đúng một viết tắt có dấu chấm */
const LONE_ABBREV = /^(Dr|Mr|Mrs|Ms|Prof|St|Inc|Ltd|Jr|Sr)\.$/i;

// ── Ô trống: cùng thuật toán với add-blanks-part3.ts ────────────────────────

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
  if (/^[A-Z]/.test(word) && pos > 0) return -1;
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
  const cand: number[] = [];
  for (let i = 0; i < words.length; i++) if (scoreWord(words[i], i, words.length) >= 0) cand.push(i);
  if (cand.length === 0) return [];
  const seed = sentenceId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = [...cand].sort((a, b) => {
    const ha = Math.sin(seed + a * 127.1) * 43758.5453;
    const hb = Math.sin(seed + b * 127.1) * 43758.5453;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });
  const picked: number[] = [];
  for (const pos of shuffled) {
    if (picked.length >= count) break;
    if (picked.every((p) => Math.abs(p - pos) >= 2)) picked.push(pos);
  }
  return picked.sort((a, b) => a - b).map((pos) => ({
    position: pos,
    answer: words[pos].toLowerCase().replace(/[^a-z0-9']/g, ""),
    hint: makeHint(words[pos]),
  }));
}

async function regenBlanks(tx: typeof prisma, sentenceId: string, lessonId: string, content: string) {
  await tx.blank.deleteMany({ where: { sentenceId } });
  const blanks = pickBlanks(sentenceId, content, 2);
  if (blanks.length) {
    await tx.blank.createMany({ data: blanks.map((b) => ({ sentenceId, lessonId, ...b })) });
  }
}

// ── Chạy ────────────────────────────────────────────────────────────────────

async function main() {
  const apply = process.argv.includes("--apply");

  const lessons = await prisma.lesson.findMany({
    where: { part: { testSet: { series: { slug: { in: SERIES } } } } },
    select: {
      id: true, title: true,
      part: { select: { partNumber: true, testSet: { select: { name: true } } } },
      sentences: {
        select: { id: true, orderIndex: true, content: true, speaker: true, startTime: true, endTime: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  let strippedLabels = 0, mergedAbbrev = 0, touchedLessons = 0;

  for (const lesson of lessons) {
    const sents = lesson.sentences;
    const stripIdx: number[] = [];
    const mergeIdx: number[] = [];

    for (let i = 0; i < sents.length; i++) {
      if (SPEAKER_PREFIX.test(sents[i].content)) stripIdx.push(i);
      if (LONE_ABBREV.test(sents[i].content.trim()) && i + 1 < sents.length) mergeIdx.push(i);
    }
    if (stripIdx.length === 0 && mergeIdx.length === 0) continue;

    touchedLessons++;
    const where = `${lesson.part.testSet.name} P${lesson.part.partNumber} ${lesson.title}`;
    for (const i of stripIdx) {
      const m = SPEAKER_PREFIX.exec(sents[i].content)!;
      console.log(`${where} #${sents[i].orderIndex}: bỏ nhãn "${m[1]}" — ${sents[i].content.slice(0, 60)}`);
      strippedLabels++;
    }
    for (const i of mergeIdx) {
      console.log(`${where} #${sents[i].orderIndex}: gộp "${sents[i].content}" + "${sents[i + 1].content.slice(0, 50)}"`);
      mergedAbbrev++;
    }

    if (!apply) continue;

    await prisma.$transaction(async (tx) => {
      // 1. bỏ nhãn
      for (const i of stripIdx) {
        const s = sents[i];
        const m = SPEAKER_PREFIX.exec(s.content)!;
        const content = s.content.replace(SPEAKER_PREFIX, "").trim();
        await tx.sentence.update({
          where: { id: s.id },
          // nhãn chuyển sang cột speaker nếu cột đó đang trống
          data: { content, speaker: s.speaker ?? m[1].replace(/\s+/g, "") },
        });
        s.content = content;
        await regenBlanks(tx as unknown as typeof prisma, s.id, lesson.id, content);
      }

      // 2. gộp viết tắt với câu kế — làm từ cuối lên để chỉ số không trượt
      for (const i of [...mergeIdx].reverse()) {
        const a = sents[i], b = sents[i + 1];
        const content = `${a.content.trim()} ${b.content.trim()}`;
        await tx.sentence.update({
          where: { id: a.id },
          data: { content, endTime: Math.max(a.endTime, b.endTime) },
        });
        await tx.sentence.delete({ where: { id: b.id } });
        await regenBlanks(tx as unknown as typeof prisma, a.id, lesson.id, content);
      }

      // 3. đánh lại orderIndex cho liền mạch
      if (mergeIdx.length > 0) {
        const left = await tx.sentence.findMany({
          where: { lessonId: lesson.id }, select: { id: true }, orderBy: { orderIndex: "asc" },
        });
        for (let i = 0; i < left.length; i++) {
          await tx.sentence.update({ where: { id: left[i].id }, data: { orderIndex: i } });
        }
      }

      // 4. dựng lại transcriptFull
      const fresh = await tx.sentence.findMany({
        where: { lessonId: lesson.id }, select: { content: true, speaker: true }, orderBy: { orderIndex: "asc" },
      });
      await tx.lesson.update({
        where: { id: lesson.id },
        data: { transcriptFull: fresh.map((s) => (s.speaker ? `${s.speaker}: ${s.content}` : s.content)).join("\n") },
      });
    });
  }

  console.log(`\n${touchedLessons} bài: bỏ ${strippedLabels} nhãn người nói, gộp ${mergedAbbrev} câu viết tắt.`);
  console.log(apply ? "Đã ghi DB." : "Mới là xem trước. Thêm --apply để ghi.");
  await prisma.$disconnect();
}

main();
