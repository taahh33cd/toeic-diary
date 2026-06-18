/**
 * audit-fix-duplicates.js
 * Audit 2: Fix duplicate options by deduplicating and padding with fallback distractors.
 * Usage: node scripts/audit-fix-duplicates.js <file>
 */
const fs = require("fs");

const file = process.argv[2];
if (!file) { console.error("Usage: node audit-fix-duplicates.js <json-file>"); process.exit(1); }

const data = JSON.parse(fs.readFileSync(file, "utf8"));

const FALLBACK_DISTRACTORS_VI = [
  "không có thông tin này trong bài",
  "điều này không được đề cập",
  "bài đọc không nêu rõ điều này",
  "đây không phải nội dung bài đọc",
];
const FALLBACK_DISTRACTORS_EN = [
  "This is not mentioned in the passage.",
  "The passage does not provide this information.",
  "None of the above is stated.",
  "This detail is not discussed.",
];

const SECTIONS = ["vocab", "paraphrase", "translation", "context"];
let fixedCount = 0, dupCount = 0, emptyCount = 0;

function isVietnamese(text) {
  return /[àáạảãăắằặẳẵâấầậẩẫ]/i.test(text);
}

function getFallback(options) {
  const pool = isVietnamese(options[0] || "") ? FALLBACK_DISTRACTORS_VI : FALLBACK_DISTRACTORS_EN;
  return pool.find(f => !options.includes(f)) || "---";
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

data.forEach((passage) => {
  const bai = `Bài ${passage.orderIndex}`;

  SECTIONS.forEach((sec) => {
    (passage[sec] || []).forEach((item, ii) => {
      const correct = item.options[item.correctIndex];

      // 1. Deduplicate options
      const seen = new Set();
      const deduped = [];
      for (const opt of item.options) {
        const key = opt.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(opt);
        } else {
          dupCount++;
        }
      }

      // 2. Pad back to 4 options if deduplication removed some
      while (deduped.length < 4) {
        const fb = getFallback(deduped);
        deduped.push(fb);
        fixedCount++;
      }

      // 3. Ensure correct answer is still present
      if (!deduped.includes(correct)) {
        deduped[deduped.length - 1] = correct;
      }

      // 4. Re-shuffle and update correctIndex
      const shuffled = shuffle(deduped);
      item.options = shuffled;
      item.correctIndex = shuffled.indexOf(correct);

      // 5. Validate
      if (item.correctIndex < 0) {
        console.error(`  CRITICAL ${bai} ${sec}[${ii}]: correct answer lost after dedup!`);
        emptyCount++;
      }
    });
  });
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");

// Re-audit
let errors = 0, warnings = 0;
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };

data.forEach((passage) => {
  SECTIONS.forEach((sec) => {
    (passage[sec] || []).forEach((item, ii) => {
      dist[item.correctIndex]++;
      const dupes = item.options.filter((o, idx) => item.options.indexOf(o) !== idx);
      if (dupes.length > 0) {
        console.warn(`  STILL DUPE: Bài ${passage.orderIndex} ${sec}[${ii}]: ${dupes.join(", ")}`);
        warnings++;
      }
      if (item.correctIndex < 0 || item.correctIndex >= item.options.length) {
        console.error(`  ERROR: Bài ${passage.orderIndex} ${sec}[${ii}]: correctIndex out of range`);
        errors++;
      }
    });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log(`\nFixed ${dupCount} duplicates, padded ${fixedCount} options.`);
console.log(`Distribution (${total} items): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Post-fix audit: ${errors} error(s), ${warnings} warning(s).`);
if (errors === 0 && warnings === 0) console.log("All clean.");
