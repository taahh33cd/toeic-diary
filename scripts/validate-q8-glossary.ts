#!/usr/bin/env tsx
/**
 * validate-q8-glossary.ts
 *
 * Bắt các lỗi làm hỏng bài tập từ vựng của Writing Q8:
 *  - đề nào chưa có glossary
 *  - câu ví dụ không chứa nguyên văn cụm (bài "điền cụm" sẽ không khoét được chỗ trống)
 *  - cụm trùng nhau trong cùng một đề (bài "ghép nghĩa" sẽ có hai đáp án đúng)
 *  - số mục ít hơn số câu hỏi của một lượt luyện
 *
 * Usage: npx tsx scripts/validate-q8-glossary.ts
 */

import { Q8_PROMPTS } from "../lib/skills/writing-q8";
import { Q8_GLOSSARY, Q8_GLOSSARY_DRILL_SIZE } from "../lib/skills/writing-q8-glossary";

let problems = 0;

function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  problems++;
}

for (const p of Q8_PROMPTS) {
  const items = Q8_GLOSSARY[p.id];
  if (!items) {
    fail(`${p.id} (${p.topicVi}) — chưa có glossary`);
    continue;
  }
  if (items.length < Q8_GLOSSARY_DRILL_SIZE) {
    fail(`${p.id} — chỉ có ${items.length} mục, cần ít nhất ${Q8_GLOSSARY_DRILL_SIZE}`);
  }

  const seen = new Set<string>();
  for (const it of items) {
    const key = it.en.toLowerCase();
    if (seen.has(key)) fail(`${p.id} — cụm "${it.en}" bị lặp`);
    seen.add(key);

    if (!it.vi.trim()) fail(`${p.id} — "${it.en}" thiếu nghĩa tiếng Việt`);
    if (!it.example.toLowerCase().includes(key)) {
      fail(`${p.id} — câu ví dụ không chứa nguyên văn "${it.en}"\n      ${it.example}`);
    }
  }
}

const extra = Object.keys(Q8_GLOSSARY).filter((id) => !Q8_PROMPTS.some((p) => p.id === id));
for (const id of extra) fail(`glossary "${id}" không khớp đề nào`);

const total = Object.values(Q8_GLOSSARY).reduce((a, v) => a + v.length, 0);
console.log(
  problems === 0
    ? `✓ ${Object.keys(Q8_GLOSSARY).length} đề · ${total} mục từ vựng — không có lỗi`
    : `\n${problems} vấn đề cần sửa`,
);
process.exit(problems === 0 ? 0 : 1);
