/**
 * Per-passage exercise audit.
 * Usage:
 *   node scripts/audit-passage.js 5          → audit Bài 6 (index 5)
 *   node scripts/audit-passage.js 0 10       → audit passages 0–9
 *   node scripts/audit-passage.js all        → full scan, show only passages with issues
 *   node scripts/audit-passage.js all --show → full scan, show ALL passages
 *   node scripts/audit-passage.js 5 --show   → audit and always show content
 */
const fs = require("fs");
const FILE = "E:/toeic-dictation-master/data/reading-exercises-all.json";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

const args = process.argv.slice(2);
const showAll = args.includes("--show");
const filteredArgs = args.filter((a) => a !== "--show");

let piStart = 0;
let piEnd = data.length;
let singlePassage = false;

if (filteredArgs[0] === "all" || filteredArgs.length === 0) {
  // full scan
} else if (filteredArgs.length === 1) {
  piStart = parseInt(filteredArgs[0]);
  piEnd = piStart + 1;
  singlePassage = true;
} else {
  piStart = parseInt(filteredArgs[0]);
  piEnd = parseInt(filteredArgs[1]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isVN(s) {
  // Use distinctly Vietnamese chars — excludes é/è/ê/ô common in French/English (e.g. résumé)
  return /[đăơưắặẩẫầấậệểễềếịỉĩọỏồốộổỗờớợởỡụủũừứựửữỵỷỹ]/u.test(s);
}
function isGoodPhrase(s) {
  if (!s) return false;
  return s.includes(" ") && !s.endsWith("...") && !s.includes("[") && !isVN(s) && s.trim().length >= 4;
}
const META_RE = /Đây là câu hỏi|Đọc hiểu kết nối|Liên kết thông tin|Câu hỏi mục đích|Kỹ năng Đọc hiểu|Dạng câu hỏi/;

function auditPassage(p, pi) {
  const issues = [];

  // ── VOCAB ──────────────────────────────────────────────────────────────────
  (p.vocab || []).forEach((item, ii) => {
    const correct = item.options[item.correctIndex];
    const distractors = item.options.filter((_, j) => j !== item.correctIndex);

    // Options should be Vietnamese
    // Flag only clearly English text: must have ≥4 consecutive all-ASCII words (avoids
    // false positives like "doanh thu", "theo mùa" which are Vietnamese without diacritics)
    item.options.forEach((opt, oi) => {
      if (oi === item.correctIndex) return;
      if (isVN(opt)) return; // has Vietnamese chars → fine
      const asciiWords = opt.split(/\s+/).filter((w) => /^[a-zA-Z'-]+$/.test(w));
      if (asciiWords.length >= 4) {
        issues.push({ sec: "vocab", ii, oi, type: "OPTION_IN_ENGLISH", detail: opt.substring(0, 50) });
      }
    });

    // Duplicate options
    const lower = item.options.map((o) => o.toLowerCase().trim());
    if (new Set(lower).size < lower.length) {
      issues.push({ sec: "vocab", ii, type: "DUPLICATE_OPTIONS" });
    }

    // Missing or very short feedback
    if (!item.feedback || item.feedback.length < 5) {
      issues.push({ sec: "vocab", ii, type: "MISSING_FEEDBACK" });
    }
  });

  // ── PARAPHRASE ─────────────────────────────────────────────────────────────
  const originals = new Set(
    (p.paraphrase || []).map((item) => {
      const m = item.question.match(/"([^"]+)"/);
      return m ? m[1].trim() : "";
    })
  );
  originals.forEach((o) => { if (o.endsWith("...")) originals.add(o.slice(0, -3)); });

  (p.paraphrase || []).forEach((item, ii) => {
    const correct = item.options[item.correctIndex];
    const origM = item.question.match(/"([^"]+)"/);
    const orig = origM ? origM[1].trim() : "";

    item.options.forEach((opt, oi) => {
      if (oi === item.correctIndex) return;

      // Single word distractor
      if (!opt.includes(" ")) {
        issues.push({ sec: "paraphrase", ii, oi, type: "SINGLE_WORD_DIST", detail: opt });
      }

      // Ellipsis distractor (truncated original from another item)
      if (opt.endsWith("...")) {
        issues.push({ sec: "paraphrase", ii, oi, type: "ELLIPSIS_DIST", detail: opt.substring(0, 50) });
      }

      // Original of another item used as distractor
      if (originals.has(opt) || originals.has(opt.replace(/\.\.\.$/,""))) {
        issues.push({ sec: "paraphrase", ii, oi, type: "ORIG_AS_DIST", detail: opt.substring(0, 50) });
      }

      // Vietnamese distractor
      if (isVN(opt)) {
        issues.push({ sec: "paraphrase", ii, oi, type: "VN_DIST", detail: opt.substring(0, 50) });
      }
    });

    // Correct answer appears in distractor (near-duplicate)
    const correctLower = correct.toLowerCase().trim();
    item.options.forEach((opt, oi) => {
      if (oi === item.correctIndex) return;
      if (opt.toLowerCase().replace(/\.\.\.$/,"").includes(correctLower) ||
          correctLower.includes(opt.toLowerCase().replace(/\.\.\.$/,""))) {
        if (opt.length > 5 && correct.length > 5) {
          issues.push({ sec: "paraphrase", ii, oi, type: "CORRECT_IN_DIST", detail: opt.substring(0, 50) });
        }
      }
    });

    // Duplicate options
    const lower = item.options.map((o) => o.toLowerCase().trim());
    if (new Set(lower).size < lower.length) {
      issues.push({ sec: "paraphrase", ii, type: "DUPLICATE_OPTIONS" });
    }
  });

  // ── TRANSLATION ────────────────────────────────────────────────────────────
  // Build paraphrase phrase set for this passage
  const paraSet = new Set(
    (p.paraphrase || []).flatMap((item) => {
      const m = item.question.match(/"([^"]+)"/);
      return [...item.options, m ? m[1].trim() : ""];
    })
  );

  (p.translation || []).forEach((item, ii) => {
    const correct = item.options[item.correctIndex];
    const viM = item.question.match(/"([^"]+)"/s);
    const vi = viM ? viM[1] : "";

    // VI too long
    if (vi.length > 120) {
      issues.push({ sec: "translation", ii, type: "VI_TOO_LONG", detail: vi.length + " chars" });
    }

    // VI too short
    if (vi.length < 15) {
      issues.push({ sec: "translation", ii, type: "VI_TOO_SHORT", detail: JSON.stringify(vi) });
    }

    // VI still has a header
    if (/^(Gửi|Từ|Đến|Ngày|BẢN GHI|MEMO|PHIẾU|\[)/i.test(vi.trim())) {
      issues.push({ sec: "translation", ii, type: "HEADER_IN_VI", detail: vi.substring(0, 40) });
    }

    // Correct is Vietnamese
    if (isVN(correct)) {
      issues.push({ sec: "translation", ii, type: "CORRECT_IS_VN", detail: correct.substring(0, 50) });
    }

    // Correct is a paraphrase phrase (leaked)
    if (paraSet.has(correct)) {
      issues.push({ sec: "translation", ii, type: "CORRECT_IS_PARA_PHRASE", detail: correct.substring(0, 50) });
    }

    // Correct too short
    if (correct.length < 15) {
      issues.push({ sec: "translation", ii, type: "CORRECT_TOO_SHORT", detail: correct });
    }

    // Distractors: Vietnamese, or paraphrase phrases
    item.options.forEach((opt, oi) => {
      if (oi === item.correctIndex) return;
      if (isVN(opt)) {
        issues.push({ sec: "translation", ii, oi, type: "VN_DIST", detail: opt.substring(0, 50) });
      }
      if (paraSet.has(opt)) {
        issues.push({ sec: "translation", ii, oi, type: "PARA_PHRASE_AS_DIST", detail: opt.substring(0, 50) });
      }
    });

    // Duplicate options
    const lower = item.options.map((o) => o.toLowerCase().trim());
    if (new Set(lower).size < lower.length) {
      issues.push({ sec: "translation", ii, type: "DUPLICATE_OPTIONS" });
    }

    // Correct much shorter than average distractor (length giveaway)
    const distLens = item.options
      .filter((_, j) => j !== item.correctIndex)
      .map((o) => o.length);
    const avgDist = distLens.reduce((a, b) => a + b, 0) / distLens.length;
    if (correct.length < avgDist * 0.35 && correct.length < 25) {
      issues.push({ sec: "translation", ii, type: "CORRECT_TOO_SHORT_VS_DISTS", detail: `correct=${correct.length} avgDist=${Math.round(avgDist)}` });
    }
  });

  // ── CONTEXT ────────────────────────────────────────────────────────────────
  (p.context || []).forEach((item, ii) => {
    // Meta-text options
    item.options.forEach((opt, oi) => {
      if (META_RE.test(opt)) {
        const isCorrect = oi === item.correctIndex;
        issues.push({
          sec: "context", ii, oi,
          type: isCorrect ? "META_TEXT_IN_CORRECT" : "META_TEXT_IN_DIST",
          detail: opt.substring(0, 70),
        });
      }
    });

    // Duplicate options
    const lower = item.options.map((o) => o.toLowerCase().trim());
    if (new Set(lower).size < lower.length) {
      issues.push({ sec: "context", ii, type: "DUPLICATE_OPTIONS" });
    }

    // Options in English (should be Vietnamese) — require ≥4 ASCII-only words
    item.options.forEach((opt, oi) => {
      if (isVN(opt)) return;
      const asciiWords = opt.split(/\s+/).filter((w) => /^[a-zA-Z'-]+$/.test(w));
      if (asciiWords.length >= 4) {
        issues.push({ sec: "context", ii, oi, type: "OPTION_IN_ENGLISH", detail: opt.substring(0, 50) });
      }
    });
  });

  return issues;
}

// ─── Print functions ─────────────────────────────────────────────────────────
function printPassage(p, pi, issues, forceShow) {
  const header = `\n${"─".repeat(60)}\n[pi:${pi}] ${p._passage.substring(0, 70)}`;
  if (issues.length === 0 && !forceShow) return;

  console.log(header);
  if (issues.length === 0) {
    console.log("  ✓ No issues found.");
    if (forceShow) printContent(p);
    return;
  }

  // Group by section
  const bySec = {};
  issues.forEach((iss) => {
    (bySec[iss.sec] = bySec[iss.sec] || []).push(iss);
  });

  ["vocab", "paraphrase", "translation", "context"].forEach((sec) => {
    const secIssues = bySec[sec] || [];
    if (secIssues.length === 0) return;
    const counts = {};
    secIssues.forEach((i) => (counts[i.type] = (counts[i.type] || 0) + 1));
    console.log(`\n  [${sec.toUpperCase()}] ${secIssues.length} issue(s):`);
    Object.entries(counts).forEach(([t, c]) => console.log(`    ✗ [${c}] ${t}`));
  });

  if (forceShow || singlePassage) {
    printContent(p);
    console.log("\n  ISSUE DETAIL:");
    issues.forEach((iss) => {
      const loc = `${iss.sec}[${iss.ii}]` + (iss.oi !== undefined ? `[${iss.oi}]` : "");
      console.log(`    >> ${loc} ${iss.type}${iss.detail ? ": " + iss.detail : ""}`);
    });
  }
}

function printContent(p) {
  const SECS = ["vocab", "paraphrase", "translation", "context"];
  SECS.forEach((sec) => {
    if (!p[sec] || p[sec].length === 0) return;
    console.log(`\n  ── ${sec.toUpperCase()} ──`);
    p[sec].forEach((item, ii) => {
      const qSnip = item.question.replace(/\n/g, " ").substring(0, 80);
      console.log(`  [${ii}] Q: ${qSnip}`);
      item.options.forEach((opt, oi) => {
        const mark = oi === item.correctIndex ? "*" : " ";
        console.log(`       [${mark}${oi}] ${opt.substring(0, 80)}`);
      });
    });
  });
}

// ─── Run audit ────────────────────────────────────────────────────────────────
let totalIssues = 0;
let passagesWithIssues = 0;

console.log(`\nAuditing passages ${piStart}–${piEnd - 1} (total: ${piEnd - piStart})`);

for (let pi = piStart; pi < piEnd; pi++) {
  const p = data[pi];
  if (!p) { console.log(`[pi:${pi}] NOT FOUND`); continue; }
  const issues = auditPassage(p, pi);
  totalIssues += issues.length;
  if (issues.length > 0) passagesWithIssues++;
  printPassage(p, pi, issues, showAll || singlePassage);
}

// Summary
console.log(`\n${"═".repeat(60)}`);
console.log(`AUDIT COMPLETE`);
console.log(`Passages checked: ${piEnd - piStart}`);
console.log(`Passages with issues: ${passagesWithIssues}`);
console.log(`Total issues: ${totalIssues}`);

// Distribution check
if (filteredArgs[0] === "all" || filteredArgs.length === 0) {
  const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const SECS = ["vocab", "paraphrase", "translation", "context"];
  data.forEach((p) => SECS.forEach((sec) => (p[sec] || []).forEach((item) => dist[item.correctIndex]++)));
  const tot = Object.values(dist).reduce((a, b) => a + b, 0);
  console.log(`Distribution (${tot}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
  if (totalIssues === 0) console.log("✓ ALL PASSAGES CLEAN — safe to deploy.");
}
