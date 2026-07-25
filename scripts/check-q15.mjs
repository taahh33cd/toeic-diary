import fs from "node:fs";
const src = fs.readFileSync("lib/skills/writing-q1-5-bank.ts", "utf8");
const unsp = fs.readFileSync("lib/skills/writing-q1-5.ts", "utf8");

const grab = (s) => [...s.matchAll(/id: "(q15-[\d]+)",\s*\n\s*difficulty: "(\w+)",[\s\S]*?keywords: \[("[^"]*"), ("[^"]*")\]/g)]
  .map((m) => ({ id: m[1], lv: m[2], kw: [JSON.parse(m[3]), JSON.parse(m[4])] }));

const all = [...grab(unsp), ...grab(src)];
const ids = new Set(all.map((x) => x.id));
console.log("total exercises:", all.length, "| unique ids:", ids.size);

const byLv = all.reduce((a, x) => ((a[x.lv] = (a[x.lv] || 0) + 1), a), {});
console.log("per level:", byLv);
for (const [lv, n] of Object.entries(byLv)) console.log(`  ${lv}: ${Math.ceil(n / 5)} test (${n} câu, test cuối ${n % 5 || 5} câu)`);

// Khuôn cặp từ: easy = không giới từ/liên từ; medium = có giới từ; hard = liên từ hoặc bị động
const PREP = new Set(["in","on","at","to","with","behind","around","along","across","through","into","onto","under","between","from","down","by","over","inside","next to","in front of","beside"]);
const CONJ = new Set(["while","because","although"]);
const bad = [];
for (const x of all) {
  const hasPrep = x.kw.some((w) => PREP.has(w));
  const hasConj = x.kw.some((w) => CONJ.has(w));
  if (x.lv === "easy" && (hasPrep || hasConj)) bad.push(`${x.id} easy nhưng có giới từ/liên từ: ${x.kw}`);
  if (x.lv === "medium" && (!hasPrep || hasConj)) bad.push(`${x.id} medium nhưng cặp từ không phải N+giới từ: ${x.kw}`);
  if (x.lv === "hard" && hasPrep && !hasConj) bad.push(`${x.id} hard nhưng cặp từ là N+giới từ: ${x.kw}`);
}
console.log(bad.length ? "KHUÔN LỆCH:\n" + bad.join("\n") : "khuôn cặp từ: khớp mức 100%");

// Ảnh tồn tại
const missing = grab(src).filter((x) => !fs.existsSync(`public/images/skills/writing-q1-5/${x.id}.jpg`));
console.log(missing.length ? "THIẾU ẢNH: " + missing.map((x) => x.id).join(", ") : "ảnh: đủ 79/79 file");
