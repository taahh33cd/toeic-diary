#!/usr/bin/env tsx
/**
 * check-speak-data.ts
 *
 * Đối chiếu liệu viết tay của nhánh Nói với bộ cắt chunk tự động, để đáp án hai
 * nhánh không trôi khỏi nhau. Báo lỗi khi:
 *   • `stress` không có trong `en`
 *   • cách cắt chunk viết tay khác với `chunkSentence`
 *
 * Usage: npx tsx scripts/chunking/check-speak-data.ts
 */

import { chunkSentence, toChunkTexts } from "../../lib/subskills/chunking/chunker";
import {
  SPEAK_PASSAGES,
  SPEAK_SAMPLES,
  type SpeakChunk,
} from "../../lib/subskills/chunking/speak";

let errors = 0;

function fail(where: string, msg: string) {
  errors++;
  console.error(`✗ ${where}\n  ${msg}`);
}

function checkStress(where: string, c: SpeakChunk) {
  if (!c.en.split(/\s+/).includes(c.stress)) {
    fail(where, `stress "${c.stress}" không có trong "${c.en}"`);
  }
  if (!c.vi.trim()) fail(where, `thiếu nghĩa Việt cho "${c.en}"`);
}

function checkSplit(where: string, chunks: SpeakChunk[]) {
  const sentence = chunks.map((c) => c.en).join(" ");
  const expected = toChunkTexts(chunkSentence(sentence));
  const actual = chunks.map((c) => c.en);
  if (expected.join(" | ") !== actual.join(" | ")) {
    fail(
      where,
      `cắt tay : ${actual.join(" / ")}\n  chunker: ${expected.join(" / ")}`
    );
  }
}

/** Cắt câu, bỏ qua dấu chấm của từ viết tắt. */
function splitSentences(line: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (const t of line.trim().split(/\s+/)) {
    buf += (buf ? " " : "") + t;
    const low = t.toLowerCase();
    const isAbbrev =
      /^(mr|mrs|ms|dr|prof|st|jr|sr|inc|ltd|co|corp|dept|ave|no|vs|etc)\.$/.test(low) ||
      /^[a-z]\.$/.test(low);
    if (/[.!?]["')\]]?$/.test(t) && !isAbbrev) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

for (const p of SPEAK_PASSAGES) {
  p.sentences.forEach((s, si) => {
    const where = `${p.id} · câu ${si + 1}`;
    s.chunks.forEach((c) => checkStress(where, c));
    checkSplit(where, s.chunks);
  });
}

for (const s of SPEAK_SAMPLES) {
  s.chunks.forEach((c) => checkStress(s.id, c));
  // Bài mẫu là một mạch nhiều câu — gom lại theo câu rồi mới đối chiếu
  const sentences = splitSentences(s.chunks.map((c) => c.en).join(" "));
  let i = 0;
  sentences.forEach((sentence, si) => {
    const nWords = sentence.split(/\s+/).length;
    const group: SpeakChunk[] = [];
    let count = 0;
    while (i < s.chunks.length && count < nWords) {
      count += s.chunks[i].en.split(/\s+/).length;
      group.push(s.chunks[i]);
      i++;
    }
    if (count !== nWords) {
      fail(`${s.id} · câu ${si + 1}`, "chunk không gom vừa một câu — kiểm tra dấu câu");
      return;
    }
    checkSplit(`${s.id} · câu ${si + 1}`, group);
  });
}

const chunkCount =
  SPEAK_PASSAGES.reduce((n, p) => n + p.sentences.reduce((m, s) => m + s.chunks.length, 0), 0) +
  SPEAK_SAMPLES.reduce((n, s) => n + s.chunks.length, 0);

if (errors) {
  console.error(`\n${errors} lỗi trong liệu nhánh Nói.`);
  process.exit(1);
}
console.log(
  `✓ ${SPEAK_PASSAGES.length} đoạn đọc to + ${SPEAK_SAMPLES.length} bài mẫu · ` +
    `${chunkCount} chunk khớp quy ước`
);
