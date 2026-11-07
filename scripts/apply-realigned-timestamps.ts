#!/usr/bin/env tsx
/**
 * apply-realigned-timestamps.ts
 *
 * Ghi timestamp đã căn lại (từ scripts/realign-broken-timestamps.py) vào DB.
 *
 * Chạy mặc định là CHẾ ĐỘ XEM TRƯỚC: chỉ in ra sẽ đổi gì. Thêm --apply để ghi.
 *
 * Mỗi bài phải qua các cổng an toàn dưới đây mới được ghi; bài nào trượt thì
 * bỏ nguyên, không ghi một phần.
 *
 * Usage:
 *   tsx scripts/apply-realigned-timestamps.ts <realigned.json> [--apply]
 */

import "dotenv/config";
import fs from "node:fs";
import { prisma } from "../lib/db/prisma";

/**
 * Các cổng này TỰ KIỂM CHỨNG, không so với timestamp cũ trong DB.
 *
 * Bản đầu tôi có một cổng "câu vốn đúng không được lệch quá 1.5s" làm phép thử
 * chéo. Nó sai ở đúng những bài cần sửa: EST 2024 Test 9 Questions 68–70 có DB
 * rải câu tới 90.6s trong khi hội thoại thật kết thúc ở 44.6s — DB sai gần như
 * mọi câu, nên lấy DB làm chuẩn thì loại bỏ chính kết quả đúng.
 */
const MIN_COVERAGE = 0.75;       // tỉ lệ từ transcript khớp được của cả bài
const MIN_SENT_COVERAGE = 0.6;   // tỉ lệ từ khớp tối thiểu của một câu
const MISMATCH_COVERAGE = 0.5;   // dưới mức này coi là audio KHÔNG khớp transcript
const SUSPECT_SEC_PER_WORD = 0.22; // nhanh hơn mức này là không thể đọc kịp
const MAX_SEC_PER_WORD = 1.6;      // chậm hơn mức này là nhịp đọc vô lý (align lỗi)

// Cùng quy ước đệm với apply-whisperx-timestamps.ts, để 11 câu ghi lại không
// lệch chuẩn so với 5.898 câu còn lại trong DB.
const PAD_START = 0.25;
const PAD_END = 0.4;

function padded(start: number, end: number, duration: number) {
  const s = Math.max(0, start - PAD_START);
  const e = duration > 0 ? Math.min(end + PAD_END, duration) : end + PAD_END;
  return { start: +s.toFixed(2), end: +e.toFixed(2) };
}

interface OutSentence {
  id: string;
  orderIndex: number;
  words: number;
  matchedWords: number;
  newStart: number | null;
  newEnd: number | null;
  dbStart: number;
  dbEnd: number;
  content: string;
}
interface OutLesson {
  label: string;
  audioDuration: number;
  badIdx: number[];
  coverage: number;
  asrText?: string;
  sentences: OutSentence[];
}

function checkLesson(id: string, L: OutLesson): { ok: boolean; reasons: string[]; mismatch: boolean } {
  const reasons: string[] = [];

  // Coverage rất thấp = audio và transcript là hai nội dung khác nhau, không
  // phải lỗi timestamp. Căn lại không cứu được, phải sửa dữ liệu.
  if (L.coverage < MISMATCH_COVERAGE) {
    return {
      ok: false,
      mismatch: true,
      reasons: [`AUDIO KHÔNG KHỚP TRANSCRIPT — chỉ ${(L.coverage * 100).toFixed(0)}% từ khớp`],
    };
  }

  if (L.coverage < MIN_COVERAGE) reasons.push(`khớp từ cả bài chỉ ${(L.coverage * 100).toFixed(1)}% < ${MIN_COVERAGE * 100}%`);

  for (let i = 0; i < L.sentences.length; i++) {
    const s = L.sentences[i];
    if (s.newStart === null || s.newEnd === null) { reasons.push(`#${s.orderIndex} không align được`); continue; }
    if (s.newEnd <= s.newStart) reasons.push(`#${s.orderIndex} khoảng rỗng ${s.newStart}->${s.newEnd}`);
    if (s.matchedWords / Math.max(1, s.words) < MIN_SENT_COVERAGE)
      reasons.push(`#${s.orderIndex} chỉ khớp ${s.matchedWords}/${s.words} từ`);
    if (L.audioDuration > 0 && s.newStart > L.audioDuration)
      reasons.push(`#${s.orderIndex} bắt đầu ngoài file (${s.newStart} > ${L.audioDuration})`);
    // thứ tự phải tăng dần
    if (i > 0) {
      const p = L.sentences[i - 1];
      if (p.newStart !== null && s.newStart < p.newStart - 0.01)
        reasons.push(`#${s.orderIndex} bắt đầu trước câu trước (${s.newStart} < ${p.newStart})`);
    }
    // Nhịp đọc phải hợp lý — xét trên giá trị SẼ ghi vào DB (đã đệm).
    // MỌI câu đều phải qua, không chỉ câu bị gắn cờ: nhanh quá là không đọc
    // kịp, chậm quá là align bắt sai từ cuối (có câu bị kéo ra 46s).
    const w = padded(s.newStart, s.newEnd, L.audioDuration);
    const perWord = (w.end - w.start) / Math.max(1, s.words);
    if (perWord < SUSPECT_SEC_PER_WORD)
      reasons.push(`#${s.orderIndex} quá nhanh: ${perWord.toFixed(2)} s/từ (${(w.end - w.start).toFixed(2)}s / ${s.words} từ)`);
    if (perWord > MAX_SEC_PER_WORD)
      reasons.push(`#${s.orderIndex} quá chậm: ${perWord.toFixed(2)} s/từ (${w.start}->${w.end})`);
  }
  return { ok: reasons.length === 0, reasons, mismatch: false };
}

async function main() {
  const file = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!file) { console.error("Thiếu đường dẫn realigned.json"); process.exit(1); }

  const data: Record<string, OutLesson> = JSON.parse(fs.readFileSync(file, "utf8"));
  let pass = 0, fail = 0, written = 0;
  const mismatched: string[] = [];

  for (const [lessonId, L] of Object.entries(data)) {
    const { ok, reasons, mismatch } = checkLesson(lessonId, L);
    if (mismatch) {
      console.log(`\nLỆCH DỮ LIỆU ${L.label}   khớp ${(L.coverage * 100).toFixed(1)}%`);
      reasons.forEach((r) => console.log(`     ! ${r}`));
      console.log(`     transcript DB : ${L.sentences.map((x) => x.content).join(" ").slice(0, 110)}`);
      console.log(`     audio nghe ra : ${(L.asrText ?? "").slice(0, 110)}`);
      mismatched.push(L.label);
      fail++;
      continue;
    }
    console.log(`\n${ok ? "ĐẠT " : "TRƯỢT"} ${L.label}   khớp ${(L.coverage * 100).toFixed(1)}%`);
    const bad = new Set(L.badIdx);
    for (let i = 0; i < L.sentences.length; i++) {
      const s = L.sentences[i];
      const mark = bad.has(i) ? "HỎNG" : "    ";
      const w = s.newStart !== null && s.newEnd !== null ? padded(s.newStart, s.newEnd, L.audioDuration) : null;
      const nd = w ? `${w.start.toFixed(2)}->${w.end.toFixed(2)} (${(w.end - w.start).toFixed(2)}s)` : "KHÔNG ALIGN";
      console.log(`  ${mark} #${s.orderIndex} DB ${s.dbStart.toFixed(2)}->${s.dbEnd.toFixed(2)} | MỚI ${nd} | ${s.matchedWords}/${s.words} từ  "${s.content.slice(0, 44)}"`);
    }
    if (!ok) { reasons.forEach((r) => console.log(`     ! ${r}`)); fail++; continue; }
    pass++;

    if (apply) {
      for (const s of L.sentences) {
        if (s.newStart === null || s.newEnd === null) continue;
        const p = padded(s.newStart, s.newEnd, L.audioDuration);
        await prisma.sentence.update({
          where: { id: s.id },
          data: { startTime: p.start, endTime: p.end },
        });
        written++;
      }
      console.log("     -> đã ghi DB");
    }
  }

  console.log(`\n${pass} bài đạt, ${fail} bài trượt.`);
  if (mismatched.length) {
    console.log(`\n${mismatched.length} bài AUDIO KHÔNG KHỚP TRANSCRIPT — căn lại không cứu được, phải sửa dữ liệu:`);
    mismatched.forEach((m) => console.log(`  - ${m}`));
  }
  if (apply) console.log(`Đã ghi ${written} câu.`);
  else console.log("Đây là xem trước. Thêm --apply để ghi DB.");
}

main().finally(() => prisma.$disconnect());
