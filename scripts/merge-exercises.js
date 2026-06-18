/**
 * Merge all exercise phase files + existing review file into one final file.
 */
const fs = require("fs");

const existing = JSON.parse(fs.readFileSync("E:/toeic-dictation-master/data/reading-exercises-review.json", "utf8"));
const p1 = JSON.parse(fs.readFileSync("E:/toeic-dictation-master/data/exercises_phase1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync("E:/toeic-dictation-master/data/exercises_phase2.json", "utf8"));
const p3 = JSON.parse(fs.readFileSync("E:/toeic-dictation-master/data/exercises_phase3.json", "utf8"));
const p4 = JSON.parse(fs.readFileSync("E:/toeic-dictation-master/data/exercises_phase4.json", "utf8"));

const all = [...existing, ...p1, ...p2, ...p3, ...p4];

// Summary
const byType = {};
all.forEach(e => {
  const t = e.type || "unknown";
  byType[t] = (byType[t] || 0) + 1;
});

const SECTIONS = ["vocab", "paraphrase", "translation", "context"];
const totalItems = all.reduce((n, e) =>
  n + SECTIONS.reduce((m, s) => m + (e[s]?.length ?? 0), 0), 0
);

const withExercises = all.filter(e =>
  SECTIONS.some(s => (e[s]?.length ?? 0) > 0)
).length;

const withoutExercises = all.filter(e =>
  SECTIONS.every(s => (e[s]?.length ?? 0) === 0)
).length;

console.log(`Total passages: ${all.length}`);
console.log(`By type:`, byType);
console.log(`With exercises: ${withExercises}`);
console.log(`Without exercises (no rich data): ${withoutExercises}`);
console.log(`Total exercise items: ${totalItems}`);

fs.writeFileSync(
  "E:/toeic-dictation-master/data/reading-exercises-all.json",
  JSON.stringify(all, null, 2),
  "utf8"
);
console.log("\nWritten to data/reading-exercises-all.json");
