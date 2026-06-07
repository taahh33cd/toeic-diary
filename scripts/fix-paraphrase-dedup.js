/**
 * Fix paraphrase duplicate distractors.
 * Bug from previous script: candidates not excluding existing non-generic distractors,
 * leading to the same phrase appearing twice.
 */
const fs = require("fs");
const FILE = "E:/toeic-dictation-master/data/reading-exercises-all.json";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let fixed = 0;

data.forEach((passage) => {
  if (!passage.paraphrase || passage.paraphrase.length === 0) return;

  // Build phrase pool for this passage
  const pool = new Set();
  passage.paraphrase.forEach((item) => {
    const m = item.question.match(/"([^"]+)"/);
    if (m) pool.add(m[1].trim());
    pool.add(item.options[item.correctIndex].trim());
  });
  (passage.vocab || []).forEach((item) => {
    const m = item.question.match(/['"]([^'"]{2,30})['"] (có nghĩa|nghĩa)/);
    if (m) pool.add(m[1].trim());
  });
  (passage.translation || []).forEach((item) => {
    const c = item.options[item.correctIndex];
    if (c && c.length <= 50 && !/[àáạảãăắặẩẫâầấậđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/u.test(c)) {
      pool.add(c.trim());
    }
  });

  passage.paraphrase.forEach((item) => {
    const origM = item.question.match(/"([^"]+)"/);
    const orig = origM ? origM[1].trim() : "";
    const correct = item.options[item.correctIndex];

    // Check for duplicates in this item
    const lowerOpts = item.options.map(o => o.toLowerCase().trim());
    const hasDup = new Set(lowerOpts).size < lowerOpts.length;
    if (!hasDup) return;

    // Good (non-generic, non-duplicate) distractors from current item
    const seen = new Set();
    seen.add(correct.toLowerCase().trim());
    const goodDists = [];
    item.options.forEach((opt, i) => {
      if (i === item.correctIndex) return;
      const key = opt.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        goodDists.push(opt);
      }
    });

    if (goodDists.length >= 3) return; // Already 3 unique non-correct options

    // Build candidates from pool, excluding everything already in item
    const excluded = new Set([
      orig.toLowerCase(),
      correct.toLowerCase(),
      ...goodDists.map(d => d.toLowerCase()),
    ]);
    const candidates = shuffle([...pool]).filter(
      (s) =>
        s.trim().length > 1 &&
        !s.includes("not mentioned") &&
        !s.includes("does not provide") &&
        !excluded.has(s.toLowerCase())
    );

    // Fill distractors to 3
    const newDists = [...goodDists];
    for (const c of candidates) {
      if (newDists.length >= 3) break;
      const key = c.toLowerCase();
      if (!excluded.has(key)) {
        newDists.push(c);
        excluded.add(key);
      }
    }

    if (newDists.length < 3) {
      // Not enough from passage pool; skip to avoid making things worse
      return;
    }

    item.options = shuffle([correct, ...newDists.slice(0, 3)]);
    item.correctIndex = item.options.indexOf(correct);
    fixed++;
  });
});

// Re-balance
const SECS = ["vocab", "paraphrase", "translation", "context"];
const allItems = [];
data.forEach((p) => SECS.forEach((sec) => (p[sec] || []).forEach((it, i) => allItems.push({ p, sec, i }))));
const order = shuffle(allItems.map((_, i) => i));
order.forEach((origIdx, rank) => {
  const { p, sec, i } = allItems[origIdx];
  const item = p[sec][i];
  if (!item) return;
  const correct = item.options[item.correctIndex];
  if (!correct) return;
  const targetPos = rank % 4;
  const others = shuffle(item.options.filter((_, j) => j !== item.correctIndex));
  const newOpts = [...others];
  newOpts.splice(targetPos, 0, correct);
  item.options = newOpts;
  item.correctIndex = targetPos;
});

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");

// Verify
let dupLeft = 0;
data.forEach((p) => {
  (p.paraphrase || []).forEach((item) => {
    const lower = item.options.map(o => o.toLowerCase().trim());
    if (new Set(lower).size < lower.length) dupLeft++;
  });
});
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
data.forEach((p) => SECS.forEach((sec) => (p[sec] || []).forEach((item) => dist[item.correctIndex]++)));
const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log(`Fixed ${fixed} duplicate paraphrase items. Remaining dups: ${dupLeft}`);
console.log(`Distribution (${total}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
