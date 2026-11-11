#!/usr/bin/env tsx
/**
 * report-transcript-fidelity.ts
 *
 * Tổng hợp kết quả audit độ nguyên văn của transcript khu dictation.
 *
 * Usage:
 *   tsx scripts/report-transcript-fidelity.ts <audit_0.json> [audit_1.json ...] [--csv <out.csv>]
 *
 * Thước đo là `coverage`: tỉ lệ từ trong transcript DB khớp được với từ ASR
 * nghe ra từ audio (dóng bằng Needleman-Wunsch). Ngưỡng dưới đây đo từ 16 bài
 * đã soi tay, so cả model base và medium — hai nhóm cách nhau rất rộng
 * (82.6% -> 96.8% và 33.3% -> 63.4%) nên ngưỡng không nhạy cảm:
 *
 *   >= 95%  transcript nguyên văn       — chỉ cần căn lại timestamp nếu lệch
 *   50-95%  transcript là bản VIẾT LẠI  — HV gõ đúng vẫn bị báo sai cả câu
 *   <  50%  audio và transcript KHÁC ĐỀ — phải sửa dữ liệu
 */

import fs from "node:fs";

const VERBATIM = 0.95;
const MISMATCH = 0.5;

interface Rec {
  label: string;
  coverage: number;
  audioDuration: number;
  asrText?: string;
  sentences: { orderIndex: number; words: number; matchedWords: number; content: string }[];
}

function bucket(c: number) {
  if (c >= VERBATIM) return "nguyên văn";
  if (c >= MISMATCH) return "viết lại";
  return "khác đề";
}

function main() {
  const files = process.argv.slice(2).filter((a) => a.endsWith(".json"));
  const csvIdx = process.argv.indexOf("--csv");
  const csvOut = csvIdx !== -1 ? process.argv[csvIdx + 1] : null;
  if (files.length === 0) { console.error("Thiếu file audit_*.json"); process.exit(1); }

  const all: (Rec & { id: string })[] = [];
  for (const f of files) {
    const data: Record<string, Rec> = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const [id, r] of Object.entries(data)) all.push({ id, ...r });
  }
  all.sort((a, b) => a.coverage - b.coverage);

  // ── phân bố ──
  const counts: Record<string, number> = { "nguyên văn": 0, "viết lại": 0, "khác đề": 0 };
  const bySeriesTest = new Map<string, { n: number; bad: number }>();
  const byPart: Record<string, { n: number; bad: number }> = {};

  for (const r of all) {
    const b = bucket(r.coverage);
    counts[b]++;
    const [series, test, part] = r.label.split("|");
    const kt = `${series} ${test}`;
    const e = bySeriesTest.get(kt) ?? { n: 0, bad: 0 };
    e.n++; if (b !== "nguyên văn") e.bad++;
    bySeriesTest.set(kt, e);
    byPart[part] ??= { n: 0, bad: 0 };
    byPart[part].n++; if (b !== "nguyên văn") byPart[part].bad++;
  }

  console.log(`=== AUDIT ĐỘ NGUYÊN VĂN TRANSCRIPT — ${all.length} bài ===\n`);
  for (const k of ["nguyên văn", "viết lại", "khác đề"])
    console.log(`  ${k.padEnd(12)} ${String(counts[k]).padStart(5)}  (${((counts[k] / all.length) * 100).toFixed(1)}%)`);

  console.log("\n--- theo part ---");
  for (const p of Object.keys(byPart).sort())
    console.log(`  ${p}  ${byPart[p].bad}/${byPart[p].n} bài hỏng`);

  console.log("\n--- theo đề (chỉ đề có bài hỏng) ---");
  const bad = [...bySeriesTest.entries()].filter(([, v]) => v.bad > 0)
    .sort((a, b) => b[1].bad / b[1].n - a[1].bad / a[1].n);
  for (const [k, v] of bad)
    console.log(`  ${k.padEnd(22)} ${String(v.bad).padStart(3)}/${String(v.n).padStart(3)}  ${((v.bad / v.n) * 100).toFixed(0)}%`);

  console.log("\n--- 40 bài tệ nhất ---");
  for (const r of all.slice(0, 40))
    console.log(`  ${(r.coverage * 100).toFixed(1).padStart(5)}%  ${bucket(r.coverage).padEnd(11)} ${r.label}`);

  // ── phân bố chi tiết để thấy có khoảng trống giữa các nhóm không ──
  console.log("\n--- phân bố coverage ---");
  const bins = [0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.98, 1.01];
  for (let i = 0; i < bins.length - 1; i++) {
    const n = all.filter((r) => r.coverage >= bins[i] && r.coverage < bins[i + 1]).length;
    if (n === 0) continue;
    console.log(`  ${(bins[i] * 100).toFixed(0).padStart(3)}-${(Math.min(bins[i + 1], 1) * 100).toFixed(0).padStart(3)}%  ${String(n).padStart(4)}  ${"#".repeat(Math.ceil(n / 8))}`);
  }

  if (csvOut) {
    const rows = ["coverage,nhom,series,test,part,title,lessonId"];
    for (const r of all) {
      const [series, test, part, title] = r.label.split("|");
      rows.push([`${(r.coverage * 100).toFixed(1)}`, bucket(r.coverage), series, test, part, `"${title}"`, r.id].join(","));
    }
    fs.writeFileSync(csvOut, rows.join("\n"), "utf8");
    console.log(`\nĐã ghi CSV: ${csvOut}`);
  }
}

main();
