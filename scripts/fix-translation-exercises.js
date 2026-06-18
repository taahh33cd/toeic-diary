/**
 * Fix translation exercises:
 * 1. Long Vietnamese prompts (>120 chars) → extract the best single sentence
 * 2. Short distractors (<25 chars) → replace with proper sentence-length alternatives
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

// ─── Build a global pool of proper sentence-length English phrases ───────────
// Collect all correct translation answers as a reusable distractor pool
const sentencePool = [];
data.forEach(p => {
  (p.translation || []).forEach(item => {
    const correct = item.options[item.correctIndex];
    if (correct && correct.length >= 30) {
      sentencePool.push(correct);
    }
  });
});
// Add more from dan_chung across all passages (load from the JS data files)
const FALLBACK_SENTENCES = [
  "The company will announce the changes at the next quarterly meeting.",
  "All employees must complete the training by the end of the month.",
  "The new policy will take effect starting from next Monday.",
  "Please contact our customer service department for further assistance.",
  "The renovation project is expected to be completed by the end of June.",
  "We are pleased to announce the opening of our new branch office.",
  "The conference will feature presentations from industry experts.",
  "Registration is required for all participants before the deadline.",
  "The management team has approved the proposed budget for next year.",
  "Customers will receive an email confirmation once their order ships.",
  "The building will be closed for maintenance during the holiday weekend.",
  "All staff members are encouraged to attend the annual team-building event.",
  "The product launch has been rescheduled to accommodate additional testing.",
  "We appreciate your patience while we work to resolve this issue.",
  "The parking lot will be temporarily unavailable due to construction work.",
  "New employees will receive a comprehensive orientation package on their first day.",
  "The updated schedule will be posted on the company intranet by Friday.",
  "Our team has been recognized for outstanding performance this quarter.",
  "The store will extend its hours during the holiday shopping season.",
  "Please review the attached document and provide your feedback by Wednesday.",
];
const fullPool = [...new Set([...sentencePool, ...FALLBACK_SENTENCES])];

// ─── Fix each translation item ──────────────────────────────────────────────
let fixedPrompts = 0, fixedDistractors = 0;

data.forEach(passage => {
  (passage.translation || []).forEach(item => {
    const correct = item.options[item.correctIndex];

    // FIX 1: Long Vietnamese prompts → extract best sentence
    const viMatch = item.question.match(/"([^"]+)"/s);
    if (viMatch) {
      const viText = viMatch[1];
      if (viText.length > 120) {
        // Split into sentences and pick the best one (30-120 chars, not a header)
        const sentences = viText.split(/(?<=[.!?])\s+|(?<=\))\s+(?=[A-ZĐ])/)
          .map(s => s.replace(/^[•\-–]\s*/, "").trim())
          .filter(s => s.length >= 30 && s.length <= 150)
          .filter(s => !s.match(/^(Gửi|Từ|Đến|Ngày|Chủ đề|Tên|Email|BẢN GHI|THÔNG BÁO|PHIẾU|Danh sách)/i));

        if (sentences.length > 0) {
          // Pick the sentence that best matches the correct English answer length
          const bestSent = sentences.reduce((best, s) => {
            const lenDiff = Math.abs(s.length - correct.length * 0.8);
            const bestDiff = Math.abs(best.length - correct.length * 0.8);
            return lenDiff < bestDiff ? s : best;
          }, sentences[0]);

          item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${bestSent}"`;
          fixedPrompts++;
        }
      }
    }

    // FIX 2: Short distractors → replace with proper sentences from pool
    item.options = item.options.map((opt, i) => {
      if (i === item.correctIndex) return opt; // keep correct

      if (opt.length < 25) {
        // Find a replacement from pool that:
        // - is different from correct answer
        // - is different from other options
        // - is roughly similar length to correct answer
        const otherOpts = item.options.filter((_, j) => j !== i);
        const candidates = shuffle(
          fullPool.filter(s =>
            s !== correct &&
            !otherOpts.includes(s) &&
            s.length >= 25 &&
            Math.abs(s.length - correct.length) < correct.length * 0.8
          )
        );

        if (candidates.length > 0) {
          fixedDistractors++;
          return candidates[0];
        }
      }
      return opt;
    });

    // Re-verify correctIndex after changes
    const newIdx = item.options.indexOf(correct);
    if (newIdx >= 0) item.correctIndex = newIdx;
  });
});

// ─── Re-shuffle to balance distribution ─────────────────────────────────────
const SECS = ["vocab", "paraphrase", "translation", "context"];
const allItems = [];
data.forEach(p => {
  SECS.forEach(sec => {
    (p[sec] || []).forEach((item, i) => {
      allItems.push({ p, sec, i });
    });
  });
});
const order = shuffle(allItems.map((_, i) => i));
order.forEach((origIdx, rank) => {
  const { p, sec, i } = allItems[origIdx];
  const item = p[sec][i];
  const correct = item.options[item.correctIndex];
  const targetPos = rank % 4;
  const others = shuffle(item.options.filter((_, j) => j !== item.correctIndex));
  const newOpts = [...others];
  newOpts.splice(targetPos, 0, correct);
  item.options = newOpts;
  item.correctIndex = targetPos;
});

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");

// ─── Verify ─────────────────────────────────────────────────────────────────
let longLeft = 0, shortLeft = 0, errors = 0;
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };

data.forEach(p => {
  SECS.forEach(sec => {
    (p[sec] || []).forEach(item => {
      dist[item.correctIndex]++;
      if (item.correctIndex < 0 || item.correctIndex >= item.options.length) errors++;
    });
  });

  (p.translation || []).forEach(item => {
    const m = item.question.match(/"([^"]+)"/s);
    const vi = m ? m[1] : "";
    if (vi.length > 150) longLeft++;
    item.options.forEach((opt, i) => {
      if (i !== item.correctIndex && opt.length < 25) shortLeft++;
    });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Translation Fix Summary ===");
console.log(`Fixed: ${fixedPrompts} long prompts, ${fixedDistractors} short distractors`);
console.log(`Remaining: ${longLeft} long prompts, ${shortLeft} short distractors`);
console.log(`Distribution (${total} items): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Errors: ${errors}`);
if (errors === 0 && longLeft === 0 && shortLeft === 0) console.log("ALL CLEAN.");
else if (longLeft > 0) console.log(`${longLeft} prompts still long (may lack splittable sentences)`);
