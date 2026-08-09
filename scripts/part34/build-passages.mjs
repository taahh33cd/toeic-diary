// Sinh kho đoạn nghe cho chế độ Nghe sâu (quy trình 5 bước).
//
// Khác với build-drills.mjs (cắt nhỏ thành câu trắc nghiệm rời), file này giữ
// nguyên từng đoạn: audio + transcript tách dòng + 3 câu hỏi + từ mới, để người
// học đi hết vòng làm đề → tra từ → nghe theo transcript → nghe chay → thuộc bài.
//
// Chạy: node scripts/part34/build-passages.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BANK = join(ROOT, "scripts", "data", "part34", "question-bank.json");
const OUT_DIR = join(ROOT, "lib", "subskills", "part3", "data");
const OUT = join(OUT_DIR, "passages.json");

const { groups } = JSON.parse(readFileSync(BANK, "utf8"));

/**
 * Tách transcript thành từng lượt nói.
 * Part 3 có nhãn người nói ("W:", "M:"); Part 4 là khối liền nên tách theo câu.
 * Danh sách câu hỏi gắn ở cuối transcript gốc phải loại bỏ.
 */
function splitTranscript(raw) {
  const isQuestionLine = (s) => /^\d{1,3}[.)]\s/.test(s);

  const rows = (raw || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isQuestionLine(s));

  const out = [];
  for (const row of rows) {
    const m = row.match(/^([A-Z]{1,2}\d?):\s*(.+)$/);
    if (m) {
      out.push({ speaker: m[1], text: m[2].trim() });
      continue;
    }
    // Bài nói một người: cắt theo dấu chấm câu cho vừa một lượt nghe
    for (const sentence of row.split(/(?<=[.!?])\s+(?=[A-Z"'“])/)) {
      const t = sentence.trim();
      if (t) out.push({ speaker: null, text: t });
    }
  }
  return out;
}

const passages = groups
  .map((g) => {
    const lines = splitTranscript(g.transcript);
    if (lines.length < 2 || !g.audioUrl) return null;

    return {
      groupId: g.groupId,
      testNumber: g.testNumber,
      part: g.part,
      questionStart: g.questionStart,
      questionEnd: g.questionEnd,
      audioUrl: g.audioUrl,
      image: g.image,
      lines,
      keywords: (g.keywords ?? []).map((k) => ({
        term: k.term,
        ipa: k.ipa,
        pos: k.pos,
        meaning: k.meaning,
      })),
      questions: g.questions.map((q) => ({
        number: q.number,
        position: q.position,
        labelVi: q.labelVi,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        reasoning: (q.reasoning || "").replace(/^[\s\-–—•*]+/, "").trim(),
      })),
    };
  })
  .filter(Boolean);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify({ passages }, null, 1), "utf8");

const noKeywords = passages.filter((p) => p.keywords.length === 0).length;
const avgLines = Math.round(passages.reduce((s, p) => s + p.lines.length, 0) / passages.length);

console.log(`Đoạn: ${passages.length}/${groups.length}`);
console.log(`  Part 3: ${passages.filter((p) => p.part === 3).length} · Part 4: ${passages.filter((p) => p.part === 4).length}`);
console.log(`  Trung bình ${avgLines} lượt nói/đoạn · ${noKeywords} đoạn chưa có từ mới`);
console.log(`-> ${OUT}`);
