// QC data subskill Dịch Anh–Việt.
//   npx tsx scripts/audit-translation.ts          — kiểm tra cấu trúc + chất lượng
//   npx tsx scripts/audit-translation.ts --text   — in câu ghép L3 / bản vá L4 để rà bằng mắt
import { TOPIC_METAS, getTopicConfig } from "../lib/subskills/translation";
import type { TransQuestion } from "../lib/subskills/translation/types";

const TEXT_MODE = process.argv.includes("--text");

const errs: string[] = [];
const warns: string[] = [];
const E = (m: string) => errs.push(m);
const W = (m: string) => warns.push(m);

const ids = new Set<string>();

// mô phỏng đúng seededShuffle + displayOrder của client
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const slotOf = (correct: number, n: number, seed: string) =>
  seededShuffle(Array.from({ length: n }, (_, i) => i), seed).indexOf(correct);
const shownDist: Record<string, number[]> = {};
const bumpShown = (k: string, i: number) => { shownDist[k] ??= [0,0,0]; shownDist[k][i]++; };
const answerDist: Record<string, number[]> = {};   // kind -> [c0,c1,c2]
const bump = (k: string, i: number) => {
  answerDist[k] ??= [0, 0, 0];
  answerDist[k][i]++;
};

// gom mọi câu tiếng Anh để phát hiện trùng lặp ngữ liệu
const sentences = new Map<string, string[]>();

let totalQ = 0;

for (const meta of TOPIC_METAS) {
  const cfg = getTopicConfig(meta.slug);
  if (!cfg) { if (meta.available) E(`${meta.slug}: available nhưng thiếu data`); continue; }
  if (cfg.levels.length !== 6) E(`${meta.slug}: ${cfg.levels.length} level`);

  const kindsByLevel: string[] = [];

  cfg.levels.forEach((lv, li) => {
    if (lv.level !== li + 1) E(`${meta.slug}/${lv.slug}: level lệch`);
    if (lv.questions.length === 0) E(`${meta.slug}/${lv.slug}: rỗng`);
    const kinds = [...new Set(lv.questions.map((q) => q.kind))];
    if (kinds.length > 1) W(`${meta.slug}/${lv.slug}: trộn nhiều kind [${kinds}]`);
    kindsByLevel.push(kinds.join(","));

    for (const q of lv.questions as TransQuestion[]) {
      totalQ++;
      if (ids.has(q.id)) E(`id trùng: ${q.id}`);
      ids.add(q.id);

      const en = "sentence" in q ? q.sentence : "source" in q ? q.source : "";
      if (en) {
        const arr = sentences.get(en) ?? [];
        arr.push(q.id);
        sentences.set(en, arr);
      }

      if (q.kind === "highlight") {
        const raw: string[] = q.sentence.match(/\S+/g) ?? [];
        const bare = raw.map((t) => t.replace(/[^a-zA-Z0-9'-]/g, ""));
        for (const w of q.correctWords)
          if (!bare.includes(w) && !raw.includes(w)) E(`${q.id}: "${w}" không có trong câu`);
        // cảnh báo mơ hồ: từ đáp án xuất hiện nhiều lần -> click nào cũng tính
        for (const w of q.correctWords) {
          const n = bare.filter((t) => t === w).length;
          if (n > 1) W(`${q.id}: "${w}" xuất hiện ${n} lần trong câu (dễ mơ hồ)`);
        }
        if (!q.instruction.trim()) E(`${q.id}: thiếu instruction`);
        if (!q.explanation.trim()) E(`${q.id}: thiếu explanation`);
      }

      if (q.kind === "compare") {
        if (q.options.length !== 3 || q.optionNotes.length !== 3) E(`${q.id}: thiếu option/note`);
        if (new Set(q.options).size !== 3) E(`${q.id}: option trùng`);
        bump("compare", q.correct);
        bumpShown("compare", slotOf(q.correct, 3, q.id));
        const note = q.optionNotes[q.correct] ?? "";
        if (!/^Đúng/.test(note)) E(`${q.id}: optionNotes[correct] không mở đầu bằng "Đúng" -> "${note.slice(0,40)}"`);
        q.optionNotes.forEach((n, i) => {
          if (i !== q.correct && /^Đúng/.test(n)) E(`${q.id}: note của phương án SAI lại mở đầu bằng "Đúng" (idx ${i})`);
          if (!n.trim()) E(`${q.id}: note rỗng idx ${i}`);
        });
        if (!q.explanation.trim()) E(`${q.id}: thiếu explanation`);
      }

      if (q.kind === "order") {
        if (q.chunks.length < 2) E(`${q.id}: <2 chunk`);
        if (new Set(q.chunks).size !== q.chunks.length) E(`${q.id}: chunk trùng`);
        for (const d of q.distractors ?? [])
          if (q.chunks.includes(d)) E(`${q.id}: distractor trùng chunk "${d}"`);
        if (new Set(q.distractors ?? []).size !== (q.distractors ?? []).length)
          E(`${q.id}: distractor trùng nhau`);
        if (!q.explanation.trim()) E(`${q.id}: thiếu explanation`);
        const joined = q.chunks.join(" ");
        if (/\s\s/.test(joined)) W(`${q.id}: câu ghép có khoảng trắng kép`);
        if (/\s[,.;:?!]/.test(joined)) E(`${q.id}: câu ghép có khoảng trắng trước dấu câu`);
        // ro ri dap an: neu CHI chunk dung mang dau cau con moi nhu thi khong
        const cComma = q.chunks.filter((c) => /[,;]$/.test(c)).length;
        const dComma = (q.distractors ?? []).filter((c) => /[,;]$/.test(c)).length;
        if (cComma > 0 && (q.distractors ?? []).length > 0 && dComma === 0)
          E(`${q.id}: chỉ chunk đúng có dấu phẩy cuối — học sinh đoán được đáp án`);
      }

      if (q.kind === "repair") {
        const holes = q.draft.split("___").length - 1;
        if (holes !== q.blanks.length) E(`${q.id}: ${holes} chỗ trống vs ${q.blanks.length} blank`);
        q.blanks.forEach((b, bi) => {
          if (b.options.length !== 3) E(`${q.id}#${bi}: cần 3 option`);
          if (new Set(b.options).size !== 3) E(`${q.id}#${bi}: option trùng`);
          if (!b.note.trim()) E(`${q.id}#${bi}: thiếu note`);
          bump("repair", b.correct);
          bumpShown("repair", slotOf(b.correct, 3, `${q.id}#${bi}`));
        });
        if (!q.explanation.trim()) E(`${q.id}: thiếu explanation`);
        let filled = q.draft;
        for (const b of q.blanks) filled = filled.replace("___", b.options[b.correct]);
        if (/\s[,.;:?!]/.test(filled)) E(`${q.id}: bản dịch đã vá có khoảng trắng trước dấu câu`);
        if (/\s\s/.test(filled)) E(`${q.id}: bản dịch đã vá có khoảng trắng kép`);
      }

      if (q.kind === "free") {
        if (!q.model.trim()) E(`${q.id}: thiếu model`);
        if (!q.focus.trim()) E(`${q.id}: thiếu focus`);
        if (q.keyPoints.length < 3) W(`${q.id}: chỉ ${q.keyPoints.length} keyPoints`);
        if (q.source.length < 40) W(`${q.id}: source quá ngắn (${q.source.length})`);
        if (q.comprehension) {
          const c = q.comprehension;
          if (c.options.length !== 3) E(`${q.id}: comprehension cần 3 option`);
          if (new Set(c.options).size !== 3) E(`${q.id}: comprehension option trùng`);
          if (!c.explanation.trim()) E(`${q.id}: comprehension thiếu explanation`);
          bump("comprehension", c.correct);
          bumpShown("comprehension", slotOf(c.correct, 3, `${q.id}-comp`));
        }
      }
    }
  });

  const expect = ["highlight", "compare", "order", "repair", "free", "free"];
  kindsByLevel.forEach((k, i) => {
    if (k !== expect[i]) E(`${meta.slug}/L${i + 1}: kind "${k}", mong đợi "${expect[i]}"`);
  });

  const n = cfg.levels.reduce((a, l) => a + l.questions.length, 0);
  const l6 = cfg.levels[5].questions.filter((q) => q.kind === "free" && q.comprehension).length;
  console.log(`  ${meta.slug.padEnd(18)} ${String(n).padStart(3)} câu · L6 có ${l6}/3 câu hỏi hiểu ý`);
}

for (const [sent, list] of sentences)
  if (list.length > 1 && sent.length > 30)
    W(`ngữ liệu lặp ở ${list.join(", ")}: "${sent.slice(0, 55)}…"`);

console.log(`\nPhân bố đáp án (muốn đều ~1/3 mỗi vị trí):`);
for (const [k, d] of Object.entries(answerDist)) {
  const t = d.reduce((a, b) => a + b, 0);
  const pct = d.map((x) => `${Math.round((x / t) * 100)}%`).join(" / ");
  console.log(`  ${k.padEnd(14)} A/B/C = ${d.join(" / ")}  (${pct})  n=${t}`);
}

console.log(`\nTổng: ${TOPIC_METAS.length} nhóm, ${totalQ} câu, ${ids.size} id duy nhất`);
if (TEXT_MODE) {
for (const meta of TOPIC_METAS) {
  const cfg = getTopicConfig(meta.slug);
  if (!cfg) continue;
  console.log(`\n===== ${meta.slug} =====`);
  for (const q of cfg.levels[2].questions) {
    if (q.kind !== "order") continue;
    console.log(`L3 ${q.id}\n   EN: ${q.sentence}\n   VI: ${q.chunks.join(" ")}`);
  }
  for (const q of cfg.levels[3].questions) {
    if (q.kind !== "repair") continue;
    let filled = q.draft;
    for (const b of q.blanks) filled = filled.replace("___", b.options[b.correct]);
    console.log(`L4 ${q.id}\n   EN: ${q.sentence}\n   VI: ${filled}`);
  }
}
}

console.log("");
console.log("Phan bo THUC TE hoc sinh thay (sau khi client xao theo seed):");
for (const [k, d] of Object.entries(shownDist)) {
  const t = d.reduce((a, b) => a + b, 0);
  const pct = d.map((x) => `${Math.round((x / t) * 100)}%`).join(" / ");
  console.log(`  ${k.padEnd(14)} A/B/C = ${d.join(" / ")}  (${pct})  n=${t}`);
  const max = Math.max(...d);
  if (max / t > 0.45) E(`phan bo hien thi ${k} van lech: ${Math.round((max / t) * 100)}%`);
}
console.log("");

if (warns.length) { console.log(`\n── CẢNH BÁO (${warns.length}) ──`); warns.forEach((w) => console.log("  ! " + w)); }
if (errs.length) { console.log(`\n── LỖI (${errs.length}) ──`); errs.forEach((e) => console.log("  x " + e)); }
else console.log("\nKhông có lỗi cấu trúc.");
process.exit(errs.length ? 1 : 0);


