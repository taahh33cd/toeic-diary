#!/usr/bin/env tsx
/**
 * import-part4-practice.ts
 *
 * Đẩy 20 bài nói Part 4 lên web, chia hai bộ giống hệt Part 3:
 *
 *   TestSeries  "TOEIC Part 4 — Luyện tập bài nói"  (slug: part4-practice)
 *     ├── TestSet  "Luyện tập cơ bản"   (slug: part4-basic)     → Talk 1–10
 *     └── TestSet  "Luyện tập nâng cao" (slug: part4-advanced)  → Talk 11–20
 *           └── Part partNumber=4 → Lesson → Sentence (+ Blank cho Level 1-2)
 *
 * Audio dùng BẢN ĐÃ CẮT của scripts/trim-part4-audio.py, không phải file gốc:
 * file gốc bộ nâng cao chỉ có ~29/79 giây là lời bài, phần còn lại là giọng
 * dẫn và phần đọc to ba câu hỏi — không có gì để chép.
 *
 * Mốc thời gian để 0 ở bước này. Phải chạy tiếp pipeline căn mốc:
 *   tsx scripts/export-part4-practice.ts <out.json> --download <dir>
 *   py -3.11 scripts/realign-broken-timestamps.py <out.json> <dir> <realigned.json>
 *   tsx scripts/apply-realigned-timestamps.ts <realigned.json> --apply
 * Trang /practice/part-4 chỉ hiện bài có câu với startTime > 0, nên trước khi
 * căn xong thì bài chưa lộ ra cho học viên — đúng ý.
 *
 * Usage:
 *   tsx scripts/import-part4-practice.ts <transcripts.json> <thư_mục_audio_đã_cắt> [--apply]
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/db/prisma";

const BUCKET = "audio";

interface Talk {
  setSlug: string;
  setName: string;
  audioIndex: number;
  lessonIndex: number;
  title: string;
  speaker: string | null;
  text: string;
}

const SETS = [
  { slug: "part4-basic", name: "Luyện tập cơ bản", orderIndex: 1 },
  { slug: "part4-advanced", name: "Luyện tập nâng cao", orderIndex: 2 },
];

// ── Tách câu ────────────────────────────────────────────────────────────────
// Giống apply-pdf-transcripts.ts. Viết tắt có dấu chấm nhưng chưa hết câu.
const ABBREV = /\b(Dr|Mr|Mrs|Ms|Prof|St|Ave|Blvd|Rd|Inc|Ltd|Co|vs|etc|No|Jr|Sr|a\.m|p\.m)\.$/i;

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/);
  for (const part of parts) {
    buf = buf ? `${buf} ${part}` : part;
    if (ABBREV.test(buf.trim())) continue;
    out.push(buf.trim());
    buf = "";
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(Boolean);
}

// ── Ô trống Level 1-2 ───────────────────────────────────────────────────────
// Thuật toán phải GIỐNG HỆT add-blanks-part3.ts, nếu không ô trống của Part 4
// sẽ lệch chuẩn so với phần còn lại của khu dictation.
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

// ── Chạy ────────────────────────────────────────────────────────────────────

async function main() {
  const [transcriptsPath, audioDir] = process.argv.slice(2);
  const apply = process.argv.includes("--apply");
  if (!transcriptsPath || !audioDir) {
    console.error("Usage: tsx scripts/import-part4-practice.ts <transcripts.json> <audioDir> [--apply]");
    process.exit(1);
  }

  const talks: Talk[] = JSON.parse(fs.readFileSync(transcriptsPath, "utf8"));
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`${talks.length} bài, audio từ ${audioDir}`);
  console.log(apply ? "CHẾ ĐỘ GHI\n" : "XEM TRƯỚC — thêm --apply để ghi\n");

  let series: { id: string } | null = null;
  if (apply) {
    series = await prisma.testSeries.upsert({
      where: { slug: "part4-practice" },
      update: { name: "TOEIC Part 4 — Luyện tập bài nói" },
      create: {
        name: "TOEIC Part 4 — Luyện tập bài nói",
        slug: "part4-practice",
        publisher: "Practice",
        year: 2024,
        description: "Bộ bài nói luyện nghe Part 4 theo 4 cấp độ dictation.",
        icon: "📢",
        color: "from-amber-500 to-orange-600",
        orderIndex: 4,
      },
    });
  }

  let uploaded = 0, lessons = 0, sentences = 0, blanks = 0;

  for (const setConf of SETS) {
    const mine = talks.filter((t) => t.setSlug === setConf.slug);
    console.log(`\n── ${setConf.name} (${mine.length} bài)`);

    let partId = "";
    if (apply) {
      const testSet = await prisma.testSet.upsert({
        where: { slug: setConf.slug },
        update: { name: setConf.name },
        create: {
          seriesId: series!.id,
          name: setConf.name,
          slug: setConf.slug,
          year: 2024,
          orderIndex: setConf.orderIndex,
        },
      });
      const part = await prisma.part.upsert({
        where: { testSetId_partNumber: { testSetId: testSet.id, partNumber: 4 } },
        update: { totalLessons: mine.length },
        create: {
          testSetId: testSet.id,
          partNumber: 4,
          title: "Part 4 — Talks",
          description: "Nghe bài nói và luyện dictation theo 4 cấp độ.",
          totalLessons: mine.length,
        },
      });
      partId = part.id;
    }

    for (const t of mine) {
      const file = path.join(audioDir, `${t.setSlug}-${t.audioIndex}.mp3`);
      if (!fs.existsSync(file)) {
        console.error(`  THIẾU AUDIO: ${file}`);
        process.exit(1);
      }
      const parts = splitSentences(t.text);
      console.log(`  ${t.title.padEnd(8)} ${parts.length} câu, ${t.text.split(/\s+/).length} từ — ${parts[0].slice(0, 56)}…`);
      if (!apply) continue;

      // audio
      const storagePath = `practice/part4/${t.setSlug}/${t.audioIndex}.mp3`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fs.readFileSync(file), { contentType: "audio/mpeg", upsert: true });
      if (error) throw new Error(`Upload hỏng ${storagePath}: ${error.message}`);
      const audioUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
      uploaded++;

      // execFileSync + mảng tham số: không qua shell nên đường dẫn có dấu cách
      // hay ký tự lạ cũng không bị diễn giải.
      const { execFileSync } = await import("node:child_process");
      const audioDuration = Number(
        execFileSync("ffprobe", [
          "-v", "error",
          "-show_entries", "format=duration",
          "-of", "default=noprint_wrappers=1:nokey=1",
          file,
        ]).toString().trim()
      );

      const transcriptFull = parts
        .map((c) => (t.speaker ? `${t.speaker}: ${c}` : c))
        .join("\n");

      const existing = await prisma.lesson.findFirst({
        where: { partId, orderIndex: t.lessonIndex },
        select: { id: true },
      });
      const data = {
        partId,
        title: t.title,
        questionStart: t.lessonIndex,
        questionEnd: t.lessonIndex,
        transcriptFull,
        audioUrl,
        audioDuration,
        orderIndex: t.lessonIndex,
        correctOption: null,
        explanation: "",
      };
      const lesson = existing
        ? await prisma.lesson.update({ where: { id: existing.id }, data })
        : await prisma.lesson.create({ data });
      lessons++;

      await prisma.sentence.deleteMany({ where: { lessonId: lesson.id } });
      for (let i = 0; i < parts.length; i++) {
        const s = await prisma.sentence.create({
          data: {
            lessonId: lesson.id,
            orderIndex: i,
            content: parts[i],
            speaker: t.speaker,
            optionLabel: null,
            // mốc tạm; bước căn lại sẽ ghi đè
            startTime: 0,
            endTime: 0,
          },
          select: { id: true },
        });
        sentences++;
        const bs = pickBlanks(s.id, parts[i], 2);
        if (bs.length) {
          await prisma.blank.createMany({
            data: bs.map((b) => ({ sentenceId: s.id, lessonId: lesson.id, ...b })),
          });
          blanks += bs.length;
        }
      }
    }
  }

  console.log(
    apply
      ? `\nĐã ghi: ${uploaded} audio, ${lessons} bài, ${sentences} câu, ${blanks} ô trống.\n` +
        "CÒN PHẢI CĂN MỐC THỜI GIAN — xem phần đầu file."
      : "\nMới là xem trước. Thêm --apply để ghi."
  );
  await prisma.$disconnect();
}

main();
