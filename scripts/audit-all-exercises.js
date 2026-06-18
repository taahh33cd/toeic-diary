/**
 * Comprehensive audit of all post-reading exercises.
 * Reports issues by type without modifying data.
 */
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("E:/toeic-dictation-master/data/reading-exercises-all.json", "utf8"));

const report = {
  vocab: [],
  paraphrase: [],
  translation: [],
  context: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isVN(text) {
  return /[àáạảãăắặẩẫâầấậđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/u.test(text);
}
function isEN(text) {
  // mostly ASCII letters, no Vietnamese diacritics
  return /[a-zA-Z]{3,}/.test(text) && !isVN(text);
}
function hasDuplicates(arr) {
  return new Set(arr.map(s => s.toLowerCase().trim())).size < arr.length;
}
function lengthRatio(a, b) {
  return Math.max(a.length, b.length) / Math.max(Math.min(a.length, b.length), 1);
}
function stdDev(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}

// ─── PHASE 1: VOCAB ──────────────────────────────────────────────────────────
data.forEach((p, pi) => {
  (p.vocab || []).forEach((item, ii) => {
    const correct = item.options[item.correctIndex];
    const distractors = item.options.filter((_, j) => j !== item.correctIndex);
    const issues = [];

    // Format: question should ask for meaning in Vietnamese
    if (!item.question.includes("có nghĩa là gì") && !item.question.includes("nghĩa là")) {
      issues.push("WRONG_FORMAT: question should ask 'có nghĩa là gì'");
    }

    // All options should be Vietnamese (it's a meaning quiz)
    item.options.forEach((opt, oi) => {
      if (isEN(opt) && !isVN(opt)) {
        issues.push("OPTION_IN_ENGLISH: [" + oi + "] " + opt.substring(0, 40));
      }
    });

    // Duplicate options
    if (hasDuplicates(item.options)) {
      issues.push("DUPLICATE_OPTIONS");
    }

    // Correct answer contains the word being asked (too obvious)
    const wordM = item.question.match(/['""]([^'""]{2,})['""] (có nghĩa|nghĩa)/);
    if (wordM) {
      const word = wordM[1].toLowerCase();
      if (correct.toLowerCase().includes(word)) {
        issues.push("CORRECT_ECHOES_WORD: word='" + wordM[1] + "' in correct='" + correct.substring(0,30) + "'");
      }
    }

    // Length giveaway: one option much shorter/longer than others
    const lengths = item.options.map(o => o.length);
    const sd = stdDev(lengths);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const outlier = lengths.find(l => Math.abs(l - mean) > sd * 2.5);
    if (outlier) {
      issues.push("LENGTH_OUTLIER: lengths=[" + lengths.join(",") + "]");
    }

    // Feedback should mention the word
    if (!item.feedback || item.feedback.length < 5) {
      issues.push("MISSING_FEEDBACK");
    }

    if (issues.length > 0) {
      report.vocab.push({ pi, ii, passage: p._passage.substring(0, 55), issues, q: item.question.substring(0, 70), correct: correct.substring(0, 40), allOpts: item.options.map(o => o.substring(0, 35)) });
    }
  });
});

// ─── PHASE 2: PARAPHRASE ─────────────────────────────────────────────────────
data.forEach((p, pi) => {
  (p.paraphrase || []).forEach((item, ii) => {
    const correct = item.options[item.correctIndex];
    const distractors = item.options.filter((_, j) => j !== item.correctIndex);
    const issues = [];

    // Format check
    if (!item.question.includes("diễn đạt cùng ý nghĩa") && !item.question.includes("paraphrase")) {
      issues.push("WRONG_FORMAT: missing 'diễn đạt cùng ý nghĩa'");
    }

    // Options should be in English (paraphrase = English phrase swap)
    item.options.forEach((opt, oi) => {
      if (isVN(opt)) {
        issues.push("OPTION_IN_VIETNAMESE: [" + oi + "] " + opt.substring(0, 40));
      }
    });

    // Duplicate options
    if (hasDuplicates(item.options)) {
      issues.push("DUPLICATE_OPTIONS");
    }

    // The original phrase (asked about) should NOT appear in correct answer
    const origM = item.question.match(/\"([^\"]+)\"/);
    if (origM) {
      const orig = origM[1].toLowerCase();
      if (correct.toLowerCase().includes(orig)) {
        issues.push("CORRECT_CONTAINS_ORIGINAL: '" + origM[1].substring(0, 30) + "' in correct");
      }
      // Also check if original appears in a distractor (it shouldn't - that's a giveaway)
      distractors.forEach((d, di) => {
        if (d.toLowerCase().includes(orig)) {
          issues.push("DISTRACTOR_CONTAINS_ORIGINAL: dist[" + di + "]='" + d.substring(0, 40) + "'");
        }
      });
    }

    // Options too similar length to each other (all same-length is OK, but too uniform might mean low diversity)
    const lengths = item.options.map(o => o.length);

    // Feedback format
    if (!item.feedback || item.feedback.length < 10) {
      issues.push("MISSING_FEEDBACK");
    }

    // Very short correct answer compared to distractors (length giveaway)
    const maxDist = Math.max(...distractors.map(d => d.length));
    if (correct.length < 8 && maxDist > 30) {
      issues.push("SHORT_CORRECT: correct='" + correct + "' (" + correct.length + " chars)");
    }

    if (issues.length > 0) {
      report.paraphrase.push({ pi, ii, passage: p._passage.substring(0, 55), issues, q: item.question.substring(0, 80), correct: correct.substring(0, 50), allOpts: item.options.map(o => o.substring(0, 50)) });
    }
  });
});

// ─── PHASE 3: TRANSLATION ────────────────────────────────────────────────────
data.forEach((p, pi) => {
  (p.translation || []).forEach((item, ii) => {
    const correct = item.options[item.correctIndex];
    const distractors = item.options.filter((_, j) => j !== item.correctIndex);
    const issues = [];

    // Format: must have a Vietnamese sentence in quotes
    const viM = item.question.match(/"([^"]+)"/s);
    if (!viM) {
      issues.push("NO_VI_SENTENCE");
    } else {
      const vi = viM[1];
      // VI too long
      if (vi.length > 120) issues.push("VI_TOO_LONG: " + vi.length + " chars");
      // VI too short (not a full sentence)
      if (vi.length < 20) issues.push("VI_TOO_SHORT: '" + vi + "'");
      // Still has header markers
      if (/^(Gửi|Từ|Đến|Ngày|BẢN GHI|\[|MEMO|PHIẾU)/i.test(vi.trim())) {
        issues.push("HEADER_IN_VI: '" + vi.substring(0, 50) + "'");
      }
      // VI should be in Vietnamese
      if (!isVN(vi) && vi.length > 10) issues.push("VI_NOT_VIETNAMESE");
    }

    // Correct answer should be English
    if (isVN(correct)) issues.push("CORRECT_IN_VIETNAMESE");
    if (correct.length < 15) issues.push("CORRECT_TOO_SHORT: '" + correct + "'");

    // Distractors should be English sentences
    distractors.forEach((d, di) => {
      if (isVN(d)) issues.push("DISTRACTOR_IN_VIETNAMESE: [" + di + "] " + d.substring(0, 40));
      if (d.length < 20) issues.push("SHORT_DISTRACTOR: [" + di + "] '" + d.substring(0, 40) + "'");
    });

    // Length giveaway: correct much shorter/longer than distractors
    const distLens = distractors.map(d => d.length);
    const avgDist = distLens.reduce((a, b) => a + b, 0) / distLens.length;
    if (correct.length < avgDist * 0.4 && correct.length < 30) {
      issues.push("CORRECT_SHORTER_THAN_DISTS: correct=" + correct.length + " avgDist=" + Math.round(avgDist));
    }
    if (correct.length > avgDist * 2.5 && correct.length > 60) {
      issues.push("CORRECT_LONGER_THAN_DISTS: correct=" + correct.length + " avgDist=" + Math.round(avgDist));
    }

    // Duplicates
    if (hasDuplicates(item.options)) issues.push("DUPLICATE_OPTIONS");

    if (issues.length > 0) {
      report.translation.push({ pi, ii, passage: p._passage.substring(0, 55), issues, q: item.question.substring(0, 120), correct: correct.substring(0, 80), distLens });
    }
  });
});

// ─── PHASE 4: CONTEXT ────────────────────────────────────────────────────────
data.forEach((p, pi) => {
  (p.context || []).forEach((item, ii) => {
    const correct = item.options[item.correctIndex];
    const distractors = item.options.filter((_, j) => j !== item.correctIndex);
    const issues = [];

    // Question should be in Vietnamese
    if (!isVN(item.question)) issues.push("QUESTION_NOT_VIETNAMESE");

    // Question should NOT be a generic template
    const genericPatterns = [
      "Bài đọc đề cập đến",
      "Theo bài đọc",
      "Nội dung chính",
      "Mục đích chính của bài đọc",
    ];
    if (genericPatterns.some(g => item.question.includes(g))) {
      issues.push("GENERIC_QUESTION: " + item.question.substring(0, 60));
    }

    // All options should be in Vietnamese
    item.options.forEach((opt, oi) => {
      if (isEN(opt) && !isVN(opt)) {
        issues.push("OPTION_IN_ENGLISH: [" + oi + "] " + opt.substring(0, 40));
      }
    });

    // Correct answer should NOT be trivially obvious from question
    if (correct.includes("Tất cả các đáp án đều đúng") || correct.includes("Cả hai")) {
      issues.push("TRIVIAL_CORRECT: '" + correct.substring(0, 40) + "'");
    }

    // Duplicates
    if (hasDuplicates(item.options)) issues.push("DUPLICATE_OPTIONS");

    // Distractors: should be plausible wrong answers (not absurd/too obviously wrong)
    // Check for overly short distractors
    distractors.forEach((d, di) => {
      if (d.length < 20) issues.push("SHORT_DISTRACTOR: [" + di + "] '" + d + "'");
    });

    // Feedback should explain WHY correct is right
    if (!item.feedback || item.feedback.length < 20) {
      issues.push("MISSING_FEEDBACK");
    }

    // Length outlier check
    const lengths = item.options.map(o => o.length);
    const sd = stdDev(lengths);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const extremeOutlier = lengths.find(l => Math.abs(l - mean) > sd * 3.0);
    if (extremeOutlier) {
      issues.push("EXTREME_LENGTH_OUTLIER: lengths=[" + lengths.join(",") + "]");
    }

    if (issues.length > 0) {
      report.context.push({ pi, ii, passage: p._passage.substring(0, 55), issues, q: item.question.substring(0, 80), correct: correct.substring(0, 60), allOpts: item.options.map(o => o.substring(0, 45)) });
    }
  });
});

// ─── Print report ─────────────────────────────────────────────────────────────
console.log("\n========================================");
console.log("POST-READING EXERCISE AUDIT REPORT");
console.log("========================================\n");

["vocab", "paraphrase", "translation", "context"].forEach(sec => {
  const items = report[sec];
  const total = data.reduce((s, p) => s + (p[sec] || []).length, 0);
  const byIssue = {};
  items.forEach(item => item.issues.forEach(iss => {
    const k = iss.split(":")[0];
    byIssue[k] = (byIssue[k] || 0) + 1;
  }));

  console.log("--- " + sec.toUpperCase() + " (" + items.length + " issues / " + total + " items) ---");
  Object.entries(byIssue).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log("  [" + v + "] " + k);
  });
  console.log();
});

// Detailed examples
["vocab", "paraphrase", "translation", "context"].forEach(sec => {
  if (report[sec].length === 0) return;
  console.log("\n=== " + sec.toUpperCase() + " DETAIL (first 6) ===");
  report[sec].slice(0, 6).forEach(item => {
    console.log("\n[" + item.issues.map(i => i.split(":")[0]).join("|") + "] " + item.passage);
    console.log("  Q: " + item.q);
    console.log("  Correct: " + item.correct);
    if (item.allOpts) console.log("  Opts: " + item.allOpts.join(" | "));
    if (item.distLens) console.log("  DistLens: " + item.distLens.join(", "));
    item.issues.forEach(iss => console.log("  >> " + iss));
  });
});
