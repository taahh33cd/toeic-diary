/**
 * Shuffles options so correct answers are evenly spread across A/B/C/D.
 * Uses a balanced assignment: correct answer cycles through positions
 * 0→1→2→3→0→... globally, then shuffles the remaining options around it.
 */
const fs = require("fs");

const FILE = process.argv[2] || "E:/toeic-dictation-master/data/reading-exercises-all.json";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SECTIONS = ["vocab", "paraphrase", "translation", "context"];

// Collect all items in order (passage → section → item)
const allItems = [];
data.forEach((passage, pi) => {
  SECTIONS.forEach((sec) => {
    (passage[sec] || []).forEach((item, ii) => {
      allItems.push({ pi, sec, ii, item });
    });
  });
});

// Assign target positions: cycle 0,1,2,3,0,1,2,3,...
// but first shuffle the order of items so the cycling isn't predictable by section
const shuffledOrder = shuffleArray(allItems.map((_, i) => i));
shuffledOrder.forEach((originalIdx, rank) => {
  const targetPos = rank % 4; // 0,1,2,3,0,1,...
  const { pi, sec, ii } = allItems[originalIdx];
  const item = data[pi][sec][ii];

  const correct = item.options[item.correctIndex];
  const others  = item.options.filter((_, i) => i !== item.correctIndex);
  const shuffledOthers = shuffleArray(others);

  // Place correct at targetPos, fill others around it
  const newOptions = [...shuffledOthers];
  newOptions.splice(targetPos, 0, correct);

  data[pi][sec][ii] = { ...item, options: newOptions, correctIndex: targetPos };
});

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");

// Report distribution
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
let errors = 0;
data.forEach((p, pi) => {
  SECTIONS.forEach((sec) => {
    (p[sec] || []).forEach((item, ii) => {
      dist[item.correctIndex]++;
      const correct = item.options[item.correctIndex];
      if (!correct) {
        console.error(`ERROR Passage ${pi + 1} ${sec}[${ii}]: correctIndex out of range`);
        errors++;
      }
    });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log(`Shuffled ${total} items.`);
console.log(`A(0): ${dist[0]}  B(1): ${dist[1]}  C(2): ${dist[2]}  D(3): ${dist[3]}`);
if (errors === 0) console.log("Verification passed.");
else console.error(`${errors} error(s) found!`);
