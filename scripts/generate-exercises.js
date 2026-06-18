/**
 * generate-exercises.js
 * Auto-generate post-reading exercises from explanation JSON data.
 *
 * Usage:
 *   node scripts/generate-exercises.js <phase>
 *   node scripts/generate-exercises.js 1   → single passages 11-30
 *   node scripts/generate-exercises.js 2   → single passages 31-51
 *   node scripts/generate-exercises.js 3   → double passages 1-15
 *   node scripts/generate-exercises.js 4   → triple passages 1-15
 */

const fs   = require("fs");
const path = require("path");

// ── Phase config ────────────────────────────────────────────────────────────
const PHASES = {
  1: { file: "D:/Part 7/data_single.js",  varName: "rawExamDataSingle", type: "single", start: 10, end: 30  }, // 0-indexed: 10..29
  2: { file: "D:/Part 7/data_single.js",  varName: "rawExamDataSingle", type: "single", start: 30, end: 51  }, // 30..50
  3: { file: "D:/Part 7/data_double.js",  varName: "rawExamData",       type: "double", start: 0,  end: 15  },
  4: { file: "D:/Part 7/data_triple.js",  varName: "rawExamData",       type: "triple", start: 0,  end: 15  },
};

const phase = parseInt(process.argv[2], 10);
if (!PHASES[phase]) {
  console.error("Usage: node generate-exercises.js <1|2|3|4>");
  process.exit(1);
}

const cfg = PHASES[phase];
const OUT  = path.join("E:/toeic-dictation-master/data", `exercises_phase${phase}.json`);

// ── Load data ────────────────────────────────────────────────────────────────
const code = fs.readFileSync(cfg.file, "utf8");
const fn   = new Function(`${code}\n; return typeof rawExamDataSingle!=="undefined"?rawExamDataSingle:rawExamData;`);
const allPassages = fn();
const passages = allPassages.slice(cfg.start, cfg.end);
console.log(`Phase ${phase}: ${passages.length} passages (${cfg.type} ${cfg.start + 1}–${cfg.end})`);

// ── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Place correct answer at targetPos; shuffle the rest around it. */
function placeCorrect(options, correctIdx, targetPos) {
  const correct   = options[correctIdx];
  const others    = shuffle(options.filter((_, i) => i !== correctIdx));
  const newOpts   = [...others];
  newOpts.splice(targetPos, 0, correct);
  return { options: newOpts, correctIndex: targetPos };
}

function makeOptions(correct, pool, targetPos) {
  const unique = [...new Set(pool.filter(s => s && s !== correct && s.trim().length > 0))];
  if (unique.length < 1) return null;
  const shuffled = shuffle(unique);
  const distractors = [];
  for (let i = 0; distractors.length < 3; i++) {
    distractors.push(shuffled[i % shuffled.length]);
  }
  const raw = [correct, ...distractors];
  return placeCorrect(raw, 0, targetPos);
}

function splitSentences(text, minLen = 25) {
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length >= minLen);
}

function extractPairs(hamY) {
  const RE = /↳\s*<i>'([^']+)'<\/i>[^=\n]*=\s*<i>'([^']+)'<\/i>/g;
  const pairs = [];
  let m;
  while ((m = RE.exec(hamY))) {
    pairs.push({ original: m[1].trim(), paraphrase: m[2].trim() });
  }
  return pairs;
}

function isRich(exp) {
  if (typeof exp !== "object" || exp === null) return false;
  return "dan_chung" in exp;
}

// Shared pools across all passages in this phase (for cross-passage distractors)
function buildContextDistractorPool(passages) {
  const pool = [];
  for (const p of passages) {
    for (const q of p.questions) {
      if (isRich(q.explanation) && q.explanation.lien_he) {
        const plain = stripHtml(q.explanation.lien_he);
        const sent  = plain.split(/[.!?]/).find(s => s.trim().length > 30);
        if (sent) pool.push(sent.trim());
      }
    }
  }
  return [...new Set(pool)];
}

// ── Exercise generators ──────────────────────────────────────────────────────

let globalCounter = 0; // used to assign target positions evenly

function nextTarget() {
  return (globalCounter++) % 4;
}

// VOCAB -----------------------------------------------------------------------
function genVocab(questions) {
  const allVocab = questions.flatMap(q =>
    isRich(q.explanation) ? (q.explanation.tu_vung || []) : []
  );
  const unique = [...new Map(allVocab.map(v => [v.tu, v])).values()];
  if (unique.length < 2) return [];

  const nghiaPool = unique.map(v => v.nghia);
  const selected  = shuffle(unique).slice(0, 5);

  return selected.flatMap(v => {
    const result = makeOptions(v.nghia, nghiaPool.filter(n => n !== v.nghia), nextTarget());
    if (!result) return [];
    return [{
      question:     `Từ "${v.tu}" có nghĩa là gì?`,
      options:      result.options,
      correctIndex: result.correctIndex,
      feedback:     `"${v.tu}" = ${v.nghia}`,
    }];
  });
}

// PARAPHRASE ------------------------------------------------------------------
function genParaphrase(questions) {
  const allPairs = questions.flatMap(q =>
    isRich(q.explanation) ? extractPairs(q.explanation.ham_y) : []
  );
  if (allPairs.length < 1) return [];

  const paraphrasePool = allPairs.map(p => p.paraphrase);
  const originalPool   = allPairs.map(p => p.original);
  const fullPool       = [...paraphrasePool, ...originalPool];

  return allPairs.slice(0, 4).flatMap(pair => {
    const result = makeOptions(
      pair.paraphrase,
      fullPool.filter(s => s !== pair.paraphrase),
      nextTarget()
    );
    if (!result) return [];
    return [{
      question:     `Cụm nào diễn đạt cùng ý nghĩa với:\n"${pair.original}"`,
      options:      result.options,
      correctIndex: result.correctIndex,
      feedback:     `"${pair.original}" = "${pair.paraphrase}"`,
    }];
  });
}

// TRANSLATION -----------------------------------------------------------------
function genTranslation(questions) {
  if (!questions.some(q => isRich(q.explanation))) return [];

  const richQs = questions.filter(q => isRich(q.explanation));
  if (richQs.length < 1) return [];

  const dich_bai    = richQs[0].explanation.dich_bai;
  const viSentences = splitSentences(stripHtml(dich_bai));
  if (viSentences.length < 1) return [];

  const danChungPool = richQs.map(q => stripHtml(q.explanation.dan_chung)).filter(Boolean);
  const wrongOptsPool = questions.flatMap(q =>
    ["A", "B", "C", "D"].filter(k => k !== q.correct).map(k => q.options[k])
  );

  const items = [];
  const limit = Math.min(richQs.length, viSentences.length, 3);

  for (let i = 0; i < limit; i++) {
    const q       = richQs[i];
    const correct = stripHtml(q.explanation.dan_chung);
    const viSent  = viSentences[i];
    if (!correct || correct.length < 5 || !viSent) continue;

    const distractorPool = [
      ...danChungPool.filter(d => d !== correct),
      ...wrongOptsPool,
    ];

    const result = makeOptions(correct, distractorPool, nextTarget());
    if (!result) continue;

    items.push({
      question:     `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${viSent}"`,
      options:      result.options,
      correctIndex: result.correctIndex,
      feedback:     `Bản dịch: "${correct}"`,
    });
  }
  return items;
}

// CONTEXT (Kiến thức mở rộng) -------------------------------------------------
function genContext(questions, ctxDistractorPool) {
  // Use lien_he from the first rich question to build a context question
  const richQ = questions.find(q => isRich(q.explanation) && q.explanation.lien_he);
  if (!richQ) return [];

  const lienHe  = stripHtml(richQ.explanation.lien_he);
  const hamY    = stripHtml(richQ.explanation.ham_y);
  const q0Text  = richQ.text;

  // Build the correct answer: first meaningful sentence from lien_he
  const correctSent = lienHe.split(/[.!?]/).find(s => s.trim().length > 30);
  if (!correctSent) return [];

  const correct = correctSent.trim();

  // Build question: "Trong thực tế, tại sao / khi nào / điều gì thường xảy ra..."
  // Use dan_chung topic as prompt
  const danChung = stripHtml(richQ.explanation.dan_chung).split(".")[0].trim();
  const question = `Bài đọc đề cập đến: "${danChung}". Trong thực tế, điều này thường có ý nghĩa gì?`;

  // Distractors from lien_he pool of OTHER passages
  const distractors = ctxDistractorPool.filter(s => s !== correct);
  const result = makeOptions(correct, distractors, nextTarget());
  if (!result) return [];

  return [{
    question:     question,
    options:      result.options,
    correctIndex: result.correctIndex,
    feedback:     lienHe.slice(0, 200) + (lienHe.length > 200 ? "..." : ""),
  }];
}

// ── Main ─────────────────────────────────────────────────────────────────────
const ctxPool = buildContextDistractorPool(passages);

const output = passages.map((p, idx) => {
  const orderIndex  = cfg.start + idx + 1;
  const questions   = p.questions;
  const hasRich     = questions.some(q => isRich(q.explanation));

  const entry = {
    _passage:   `Bài ${orderIndex} — ${p.category ?? cfg.type} — ${stripHtml(p.texts[0]).slice(0, 60)}`,
    orderIndex,
    type:       cfg.type,
    category:   p.category ?? null,
    approved:   false,
    _hasRichData: hasRich,
    vocab:       hasRich ? genVocab(questions)                  : [],
    paraphrase:  hasRich ? genParaphrase(questions)             : [],
    translation: hasRich ? genTranslation(questions)            : [],
    context:     hasRich ? genContext(questions, ctxPool)       : [],
  };

  if (!hasRich) {
    entry._note = "No rich explanation data — exercises require manual crafting.";
  }

  return entry;
});

fs.writeFileSync(OUT, JSON.stringify(output, null, 2), "utf8");
console.log(`Written to ${OUT}`);

// ── Audit 1: Structure validation ────────────────────────────────────────────
console.log("\n=== AUDIT 1: Structure Validation ===");
let errors = 0, warnings = 0;
const SECTIONS = ["vocab", "paraphrase", "translation", "context"];

output.forEach((entry, i) => {
  const bai = `Bài ${entry.orderIndex}`;

  SECTIONS.forEach(sec => {
    (entry[sec] || []).forEach((item, ii) => {
      // correctIndex in range
      if (item.correctIndex < 0 || item.correctIndex >= item.options.length) {
        console.error(`  ERROR ${bai} ${sec}[${ii}]: correctIndex=${item.correctIndex} out of range (${item.options.length} options)`);
        errors++;
      }
      // minimum 3 options
      if (item.options.length < 3) {
        console.warn(`  WARN  ${bai} ${sec}[${ii}]: only ${item.options.length} options`);
        warnings++;
      }
      // no duplicate options
      const dupes = item.options.filter((o, idx) => item.options.indexOf(o) !== idx);
      if (dupes.length > 0) {
        console.warn(`  WARN  ${bai} ${sec}[${ii}]: duplicate options: ${dupes.join(", ")}`);
        warnings++;
      }
      // question not empty
      if (!item.question || item.question.trim().length < 10) {
        console.error(`  ERROR ${bai} ${sec}[${ii}]: empty/short question`);
        errors++;
      }
    });
  });

  // Check section counts
  if (entry._hasRichData) {
    if (entry.vocab.length === 0)       { console.warn(`  WARN  ${bai}: no vocab exercises`);       warnings++; }
    if (entry.paraphrase.length === 0)  { console.warn(`  WARN  ${bai}: no paraphrase exercises`);  warnings++; }
    if (entry.translation.length === 0) { console.warn(`  WARN  ${bai}: no translation exercises`); warnings++; }
    if (entry.context.length === 0)     { console.warn(`  WARN  ${bai}: no context exercises`);     warnings++; }
  }
});

// Distribution check
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
output.forEach(entry =>
  SECTIONS.forEach(sec =>
    (entry[sec] || []).forEach(item => { if (dist[item.correctIndex] !== undefined) dist[item.correctIndex]++; })
  )
);
const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log(`\ncorrectIndex distribution (total ${total} items):`);
console.log(`  A(0): ${dist[0]}  B(1): ${dist[1]}  C(2): ${dist[2]}  D(3): ${dist[3]}`);

// Items per section
const counts = {};
SECTIONS.forEach(sec => {
  counts[sec] = output.reduce((n, e) => n + (e[sec]?.length ?? 0), 0);
});
console.log(`\nItems per section: vocab=${counts.vocab} para=${counts.paraphrase} trans=${counts.translation} ctx=${counts.context}`);

console.log(`\nAudit 1 complete: ${errors} error(s), ${warnings} warning(s).`);
if (errors > 0) console.log("Fix errors before proceeding to Audit 2.");
else console.log("No errors found. Ready for Audit 2 (manual review of content).");
