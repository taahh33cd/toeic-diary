// Sinh lib/skills/writing-q1-5-bank.ts từ bảng phân loại đã chấm tay.
// Chạy: node scripts/gen-q15-bank.mjs
import fs from "node:fs";

const SRC = "scripts/writing-q1-5-classified.jsonl";

const rows = fs.readFileSync(SRC, "utf8").trim().split("\n").map((l) => JSON.parse(l));

const q = (s) => JSON.stringify(s);

const body = rows
  .map(
    (r) => `  {
    id: ${q(r.id)},
    difficulty: "${r.lv}",
    imageUrl: "/images/skills/writing-q1-5/${r.id}.jpg",
    imageAlt: ${q(r.alt)},
    keywords: [${q(r.kw[0])}, ${q(r.kw[1])}],
    modelAnswers: [${r.ans.map(q).join(", ")}],
    tip: ${q(r.tip)},
  },`,
  )
  .join("\n");

const counts = rows.reduce((a, r) => ((a[r.lv] = (a[r.lv] || 0) + 1), a), {});

const out = `// Bộ đề ảnh Writing Q1-5 — sinh tự động bởi scripts/gen-q15-bank.mjs, KHÔNG sửa tay.
//
// Ảnh nguồn do giáo viên cung cấp, đã chuẩn hoá bởi scripts/normalize-q15-images.mjs
// (map tên gốc: scripts/writing-q1-5-source-map.json).
//
// Phân loại độ khó (ảnh gate mức, cặp từ khớp mức):
//   easy   — ảnh 1 chủ thể + 1 hành động rõ  → cặp từ danh từ + động từ hành động
//   medium — 2-3 chủ thể / có quan hệ vị trí  → cặp từ danh từ + giới từ
//   hard   — cảnh đông, 2 hành động song song, hoặc trọng tâm là vật thể
//            → cặp từ có liên từ (while/because) hoặc động từ buộc dùng bị động
//
// Phân bố: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(" · ")}

import type { WritingQ15Exercise } from "./writing-q1-5";

export const WRITING_Q1_5_BANK: WritingQ15Exercise[] = [
${body}
];
`;

fs.writeFileSync("lib/skills/writing-q1-5-bank.ts", out);
console.log(`wrote lib/skills/writing-q1-5-bank.ts — ${rows.length} exercises`, counts);
