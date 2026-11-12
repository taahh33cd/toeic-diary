#!/usr/bin/env tsx
/**
 * recheck-transcript-fidelity.ts
 *
 * Đọc lại kết quả audit (audit_*.json của realign-broken-timestamps.py --audit)
 * và đo độ lệch giữa transcript DB với lời ASR nghe từ audio, nhưng bằng ĐÚNG
 * bộ chuẩn hoá mà trang chép chính tả dùng để chấm (lib/practice/match.ts).
 *
 * Vì sao phải đo lại: thước cũ chỉ có `coverage` tính theo phần trăm. Một bài
 * Part 2 chỉ khoảng 20 từ nên ASR nghe nhầm MỘT từ đã kéo xuống 94%, lọt vào
 * nhóm "viết lại" dù transcript hoàn toàn nguyên văn. Phần trăm một mình không
 * phân biệt được "ASR nghe nhầm lác đác" với "transcript bị viết lại".
 *
 * Thước mới thêm `longestGap`: chuỗi từ liên tiếp của transcript DB không khớp
 * được với lời audio. Bản viết lại đổi cả cụm nên gap dài; ASR nghe nhầm chỉ
 * làm hỏng một, hai từ rời rạc.
 *
 * Transcript phải lấy từ `all.json` (bản xuất đầy đủ), KHÔNG lấy từ audit_*.json:
 * file audit chỉ giữ 70 ký tự đầu mỗi câu cho nhẹ, đo trên đó thì bài Part 3-4
 * nào cũng ra lệch.
 *
 * Usage:
 *   tsx scripts/recheck-transcript-fidelity.ts <all.json> <audit_0.json> [...] [--csv <out>] [--show <n>]
 */

import fs from "node:fs";
import { normalizeToken, tokenizeSentence, wordsToNumber } from "../lib/practice/match";

interface AuditSentence { orderIndex: number; words: number; matchedWords: number; content: string }
interface AuditRec {
  label: string;
  audioDuration: number;
  coverage: number;
  asrText?: string;
  sentences: AuditSentence[];
}

function tokensOf(text: string): string[] {
  return tokenizeSentence(text).map(normalizeToken).filter(Boolean);
}

// Lời người dẫn ("Number 19.", "Questions 62 through 64 refer to...") không bị
// cắt khỏi chuỗi ASR: coverage chỉ đếm từ của TRANSCRIPT khớp được, nên từ thừa
// bên phía audio chỉ tốn phí gap chứ không làm hỏng số đo.

/** Hai từ coi là một: khớp chữ sau chuẩn hoá, hoặc cùng giá trị số. */
function same(a: string, b: string): boolean {
  if (a === b) return true;
  const na = wordsToNumber([a]);
  if (na === null) return false;
  return na === wordsToNumber([b]);
}

const GAP = -1.0, MATCH = 2.0, MISMATCH = -1.5;

/**
 * Needleman-Wunsch trên chuỗi từ. Trả mảng cùng độ dài với `ref`: từ thứ i của
 * transcript có khớp được với lời audio hay không.
 *
 * Trước khi so, thử gộp: transcript "sometime" ↔ audio "some time". Gộp tối đa
 * ba từ, đúng như matcher của trang chấm bài.
 */
function alignRef(ref: string[], hyp: string[]): boolean[] {
  const n = ref.length, m = hyp.length;
  const dp: Float64Array[] = [];
  const bt: Int8Array[] = [];
  for (let i = 0; i <= n; i++) { dp.push(new Float64Array(m + 1)); bt.push(new Int8Array(m + 1)); }
  for (let i = 1; i <= n; i++) { dp[i][0] = i * GAP; bt[i][0] = 1; }
  for (let j = 1; j <= m; j++) { dp[0][j] = j * GAP; bt[0][j] = 2; }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = dp[i - 1][j - 1] + (same(ref[i - 1], hyp[j - 1]) ? MATCH : MISMATCH);
      const up = dp[i - 1][j] + GAP;
      const left = dp[i][j - 1] + GAP;
      if (diag >= up && diag >= left) { dp[i][j] = diag; bt[i][j] = 0; }
      else if (up >= left) { dp[i][j] = up; bt[i][j] = 1; }
      else { dp[i][j] = left; bt[i][j] = 2; }
    }
  }

  const ok = new Array<boolean>(n).fill(false);
  // vị trí từ audio đã dóng với mỗi từ transcript, để thử gộp sau
  const pairedAt = new Array<number>(n).fill(-1);
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const b = i === 0 ? 2 : j === 0 ? 1 : bt[i][j];
    if (b === 0) {
      pairedAt[i - 1] = j - 1;
      if (same(ref[i - 1], hyp[j - 1])) ok[i - 1] = true;
      i--; j--;
    } else if (b === 1) i--;
    else j--;
  }

  // vớt lại các từ ghép bị tách đôi ở một trong hai phía
  for (let k = 0; k < n; k++) {
    if (ok[k] || pairedAt[k] < 0) continue;
    const at = pairedAt[k];
    for (let take = 2; take <= 3 && at + take <= m; take++) {
      if (hyp.slice(at, at + take).join("") === ref[k]) { ok[k] = true; break; }
    }
    if (ok[k]) continue;
    for (let take = 2; take <= 3 && k + take <= n; take++) {
      if (ref.slice(k, k + take).join("") === hyp[at]) {
        for (let x = k; x < k + take; x++) ok[x] = true;
        break;
      }
    }
  }
  return ok;
}

function longestRun(ok: boolean[]): number {
  let best = 0, cur = 0;
  for (const v of ok) { cur = v ? 0 : cur + 1; best = Math.max(best, cur); }
  return best;
}

function main() {
  const files = process.argv.slice(2).filter((a) => a.endsWith(".json"));
  const csvIdx = process.argv.indexOf("--csv");
  const csvOut = csvIdx !== -1 ? process.argv[csvIdx + 1] : null;
  const showIdx = process.argv.indexOf("--show");
  const show = showIdx !== -1 ? Number(process.argv[showIdx + 1]) : 25;
  if (files.length === 0) { console.error("Thiếu file audit_*.json"); process.exit(1); }

  // file đầu là all.json (mảng), các file sau là audit_*.json (map theo lessonId)
  const lessons: { lessonId: string; label: string; sentences: { content: string }[] }[] =
    JSON.parse(fs.readFileSync(files[0], "utf8"));
  const all: Record<string, AuditRec> = {};
  for (const f of files.slice(1)) Object.assign(all, JSON.parse(fs.readFileSync(f, "utf8")));

  const rows = lessons.filter((l) => all[l.lessonId]).map((l) => {
    const id = l.lessonId;
    const r = all[id];
    const ref = tokensOf(l.sentences.map((s) => s.content).join(" "));
    const hyp = tokensOf(r.asrText ?? "");
    const ok = ref.length && hyp.length ? alignRef(ref, hyp) : ref.map(() => false);
    const matched = ok.filter(Boolean).length;
    return {
      id,
      label: l.label,
      words: ref.length,
      cov: ref.length ? matched / ref.length : 0,
      miss: ref.length - matched,
      gap: longestRun(ok),
      oldCov: r.coverage,
    };
  });

  rows.sort((a, b) => b.gap - a.gap || a.cov - b.cov);

  console.log(`=== ĐO LẠI ĐỘ NGUYÊN VĂN — ${rows.length} bài ===\n`);

  console.log("--- phân bố chuỗi từ liên tiếp không khớp (longestGap) ---");
  const bins = [0, 1, 2, 3, 4, 6, 8, 12, 20, 1e9];
  for (let i = 0; i < bins.length - 1; i++) {
    const n = rows.filter((r) => r.gap >= bins[i] && r.gap < bins[i + 1]).length;
    if (!n) continue;
    const lo = bins[i], hi = bins[i + 1] > 1e8 ? "+" : bins[i + 1] - 1;
    console.log(`  ${String(lo).padStart(3)}-${String(hi).padStart(3)}  ${String(n).padStart(4)}  ${"#".repeat(Math.ceil(n / 8))}`);
  }

  console.log("\n--- phân bố tỷ lệ khớp ---");
  const cb = [0, 0.5, 0.7, 0.8, 0.9, 0.95, 0.98, 1.01];
  for (let i = 0; i < cb.length - 1; i++) {
    const n = rows.filter((r) => r.cov >= cb[i] && r.cov < cb[i + 1]).length;
    if (!n) continue;
    console.log(`  ${(cb[i] * 100).toFixed(0).padStart(3)}-${(Math.min(cb[i + 1], 1) * 100).toFixed(0).padStart(3)}%  ${String(n).padStart(4)}`);
  }

  console.log(`\n--- ${show} bài lệch nặng nhất ---`);
  for (const r of rows.slice(0, show)) {
    console.log(`  gap=${String(r.gap).padStart(3)}  khớp=${(r.cov * 100).toFixed(1).padStart(5)}%  thiếu=${String(r.miss).padStart(3)}/${String(r.words).padStart(3)}  ${r.label}`);
  }

  if (csvOut) {
    const out = ["longestGap,tyLeKhop,thieuTu,tongTu,covCu,series,test,part,title,lessonId"];
    for (const r of rows) {
      const [series, test, part, title] = r.label.split("|");
      out.push([r.gap, (r.cov * 100).toFixed(1), r.miss, r.words, (r.oldCov * 100).toFixed(1),
        series, test, part, `"${title}"`, r.id].join(","));
    }
    fs.writeFileSync(csvOut, out.join("\n"), "utf8");
    console.log(`\nĐã ghi CSV: ${csvOut}`);
  }
}

main();
