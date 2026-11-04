// Parse the "BÀI TẬP NGỮ PHÁP" Google Docs export (6 tabs) into GrammarQuestion records.
//
// Nguồn: scripts/data/grammar-docs/*.txt — bản export ?format=txt của từng thẻ (tab).
// Doc có hai format câu hỏi lẫn nhau, xem scripts/grammar/README.md.
//
//   node scripts/grammar/parse-docs.mjs
//     -> scripts/data/grammar-docs/parsed.json
//        scripts/data/grammar-docs/parse-report.txt

import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "scripts/data/grammar-docs");
const OUT_JSON = path.join(DIR, "parsed.json");
const OUT_REPORT = path.join(DIR, "parse-report.txt");

/** Mỗi thẻ trong Docs -> một topic ở /grammar. */
const TABS = [
  { file: "01-part5-tong-hop-1.txt", topic: "Part 5 tổng hợp", group: "SUBMARINE 2024" },
  { file: "02-part5-tong-hop-2.txt", topic: "Part 5 tổng hợp", group: "SUBMARINE 2026" },
  { file: "03-dong-tu-khuyet-thieu.txt", topic: "Động từ khuyết thiếu", group: null },
  { file: "04-danh-dong-tu-nguyen-the.txt", topic: "Danh động từ & Nguyên thể", group: null },
  { file: "05-menh-de-danh-ngu.txt", topic: "Mệnh đề danh ngữ", group: null },
  { file: "06-so-sanh.txt", topic: "So sánh", group: null },
];

const RE_LESSON = /^Lesson\s*(\d+)\s*$/i;
const RE_TEST = /^Test\s*(\d+)\s*:?\.?\s*$/i;
const RE_Q_START = /^(?:\d+\s*\.\s*Câu hỏi|Câu\s*\d+)\s*:\s*(.*)$/;
const RE_Q_BLOCK = /^Câu\s*\d+\s*$/;
const RE_CATEGORY = /^Phân loại câu hỏi\s*:\s*(.*)$/;
const RE_OPTION = /^([A-D])\s*[.)]\s*(.+)$/;
const RE_ANSWER = /^Đáp án(?:\s*đúng)?\s*:\s*(.*)$/;
const RE_EXPLAIN = /^Giải thích[^:]*:\s*(.*)$/;
const RE_TRANS = /^Dịch nghĩa\s*:\s*(.*)$/;
const RE_VOCAB = /^Từ vựng[^:]*:\s*(.*)$/;
const RE_BULLET = /^[*•\-–]\s*(.+)$/;

/** "_____" / "-------" trong Docs -> "______" như data /grammar đang dùng. */
function normalizeBlank(s) {
  return s.replace(/[_]{2,}/g, "______").replace(/[-–—]{3,}/g, "______");
}

/** Tách "sentence A. x B. y C. z D. w" trên một dòng. */
function splitInline(text) {
  const marks = [];
  for (const letter of ["A", "B", "C", "D"]) {
    const re = new RegExp(`(?:^|[\\s(])${letter}\\s*[.)]\\s`, "g");
    let found = -1;
    let m;
    while ((m = re.exec(text))) {
      // Lấy mốc đầu tiên nằm sau mốc của đáp án trước đó.
      const at = m.index + (/^[\s(]/.test(m[0]) ? 1 : 0);
      if (at > (marks.length ? marks[marks.length - 1].at : -1)) {
        found = at;
        break;
      }
    }
    if (found < 0) return null;
    marks.push({ letter, at: found });
  }
  const question = text.slice(0, marks[0].at).trim();
  const options = {};
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].at : text.length;
    const raw = text.slice(marks[i].at, end).trim();
    options[marks[i].letter] = raw.replace(RE_OPTION, "$2").trim().replace(/[.;]$/, "");
  }
  return { question, options };
}

/** "Settle (v): giải quyết; Disagreement (n): sự bất đồng" hoặc bullet "Organizer: người tổ chức". */
function parseVocab(parts) {
  const out = [];
  for (const part of parts) {
    for (const chunk of part.split(/;(?![^(]*\))/)) {
      const s = chunk.trim().replace(/[.;]$/, "");
      if (!s) continue;
      const typed = s.match(/^(.+?)\s*\(([^)]{1,12})\)\s*:\s*(.+)$/);
      if (typed) {
        const type = normalizeType(typed[2]);
        // "Information technology (IT): …" — ngoặc là viết tắt, không phải từ loại.
        if (type) {
          out.push({ word: typed[1].trim(), type, meaning: typed[3].trim() });
          continue;
        }
      }
      const plain = s.match(/^(.+?)\s*:\s*(.+)$/);
      if (plain) out.push({ word: plain[1].trim(), type: "", meaning: plain[2].trim() });
    }
  }
  return out;
}

/** Chỉ nhận từ loại trong danh sách; ngoặc khác (viết tắt, ghi chú) thì bỏ qua. */
const TYPES = new Set(["n", "v", "adj", "adv", "prep", "conj", "phr", "pron", "pronoun", "phr. v", "phr v"]);

function normalizeType(t) {
  const s = t.trim().toLowerCase().replace(/\.$/, "");
  if (TYPES.has(s)) return s === "pronoun" ? "pron." : `${s.replace(/\s+/g, " ")}.`;
  // "adj/n", "v/n", "prep/conj" — ghi nhiều từ loại cùng lúc.
  const parts = s.split("/").map((x) => x.trim());
  if (parts.length > 1 && parts.every((x) => TYPES.has(x))) return `${parts.join("/")}.`;
  return "";
}

function parseTab(tab) {
  const lines = fs
    .readFileSync(path.join(DIR, tab.file), "utf8")
    .replace(/^﻿/, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim());

  const questions = [];
  const warnings = [];
  let lesson = null;
  let test = null;
  let cur = null;
  let field = null;

  const flush = () => {
    if (!cur) return;
    questions.push(cur);
    cur = null;
    field = null;
  };

  for (const raw of lines) {
    if (!raw) continue;
    // Có test gắn bullet trước cả nhãn trường ("* Đáp án:", "* * Giải thích:", "* Câu 3: …").
    const unbulleted = raw.replace(/^(?:[*•]\s*)+/, "");
    const line =
      unbulleted !== raw &&
      (RE_Q_START.test(unbulleted) ||
        RE_CATEGORY.test(unbulleted) ||
        RE_ANSWER.test(unbulleted) ||
        RE_EXPLAIN.test(unbulleted) ||
        RE_TRANS.test(unbulleted) ||
        RE_VOCAB.test(unbulleted))
        ? unbulleted
        : raw;

    if (RE_LESSON.test(line)) {
      flush();
      lesson = Number(line.match(RE_LESSON)[1]);
      test = null;
      continue;
    }
    if (RE_TEST.test(line)) {
      flush();
      test = Number(line.match(RE_TEST)[1]);
      continue;
    }

    const start = line.match(RE_Q_START);
    if (start) {
      flush();
      const stem = normalizeBlank(start[1].trim());
      const split = stem ? splitInline(stem) : null;
      if (split) {
        // "N. Câu hỏi: <câu> A. x B. y C. z D. w" — tất cả trên một dòng.
        cur = newQuestion(tab, lesson, test, split.question, split.options);
        field = null;
      } else {
        // "Câu N: <câu>" rồi A/B/C/D ở các dòng sau.
        cur = newQuestion(tab, lesson, test, stem, {});
        field = "stem";
      }
      continue;
    }
    if (RE_Q_BLOCK.test(line)) {
      flush();
      cur = newQuestion(tab, lesson, test, "", {});
      field = "stem";
      continue;
    }
    if (!cur) continue;

    const category = line.match(RE_CATEGORY);
    if (category) {
      cur.docs_category = category[1].trim();
      field = "category";
      continue;
    }
    const answer = line.match(RE_ANSWER);
    if (answer) {
      const letter = answer[1].trim().match(/^([A-D])\b/);
      if (letter) cur.correct_answer = letter[1];
      else warnings.push(`${tab.file} | ${cur.source} | đáp án không đọc được: ${answer[1].slice(0, 40)}`);
      field = "answer";
      continue;
    }
    const explain = line.match(RE_EXPLAIN);
    if (explain) {
      field = "explain";
      if (explain[1].trim()) cur._explain.push(explain[1].trim());
      continue;
    }
    const trans = line.match(RE_TRANS);
    if (trans) {
      field = "trans";
      if (trans[1].trim()) cur.translation = trans[1].trim();
      continue;
    }
    const vocab = line.match(RE_VOCAB);
    if (vocab) {
      field = "vocab";
      if (vocab[1].trim()) cur._vocab.push(vocab[1].trim());
      continue;
    }

    const opt = line.match(RE_OPTION);
    if (opt && field === "stem" && !cur.options[opt[1]]) {
      cur.options[opt[1]] = opt[2].trim().replace(/[.;]$/, "");
      continue;
    }

    const bullet = line.match(RE_BULLET);
    const body = bullet ? bullet[1].trim() : line;
    if (field === "stem") cur.question = normalizeBlank((cur.question ? `${cur.question} ` : "") + line).trim();
    else if (field === "explain") cur._explain.push(body);
    else if (field === "trans") cur.translation = `${cur.translation} ${body}`.trim();
    else if (field === "vocab") cur._vocab.push(body);
  }
  flush();

  for (const q of questions) {
    q.explanation_reason = q._explain.join(" ").replace(/\s+/g, " ").trim();
    q.core_vocabulary = parseVocab(q._vocab);
    delete q._explain;
    delete q._vocab;

    const missing = [];
    if (Object.keys(q.options).length !== 4) missing.push("đủ 4 đáp án");
    if (!q.correct_answer) missing.push("đáp án");
    else if (!q.options[q.correct_answer]) missing.push(`đáp án ${q.correct_answer} không có trong A-D`);
    if (!q.explanation_reason) missing.push("giải thích");
    if (!q.translation) missing.push("dịch nghĩa");
    if (!q.core_vocabulary.length) missing.push("từ vựng");
    if (missing.length) {
      warnings.push(`${q.source} | thiếu: ${missing.join(", ")} | ${q.question.slice(0, 70)}`);
    }
  }
  return { questions, warnings };
}

function newQuestion(tab, lesson, test, question, options) {
  const label = [tab.group, lesson ? `Lesson ${lesson}` : null, `Test ${test ?? "?"}`].filter(Boolean).join(" / ");
  return {
    question,
    options,
    correct_answer: "",
    grammar_type: tab.topic,
    explanation_reason: "",
    explanation_grammar: tab.topic,
    translation: "",
    core_vocabulary: [],
    docs_category: "",
    source: label,
    _group: tab.group,
    _lesson: lesson,
    _test: test,
    _explain: [],
    _vocab: [],
  };
}

const all = [];
const report = [];
for (const tab of TABS) {
  const { questions, warnings } = parseTab(tab);
  const perTest = new Map();
  for (const q of questions) perTest.set(q.source, (perTest.get(q.source) || 0) + 1);
  report.push(`=== ${tab.file}  ${questions.length} câu / ${perTest.size} test  (${warnings.length} cảnh báo)`);
  for (const [src, n] of perTest) report.push(`    ${String(n).padStart(3)} câu | ${src}`);
  report.push(...warnings.map((w) => `    ! ${w}`));
  all.push(...questions);
}

// id ổn định theo thứ tự xuất hiện trong Docs: d0001, d0002, …
all.forEach((q, i) => {
  q.id = `d${String(i + 1).padStart(4, "0")}`;
});

report.push("", `TỔNG: ${all.length} câu`);
const byTopic = {};
for (const q of all) byTopic[q.grammar_type] = (byTopic[q.grammar_type] || 0) + 1;
for (const [k, v] of Object.entries(byTopic)) report.push(`  ${String(v).padStart(4)} | ${k}`);

fs.writeFileSync(OUT_JSON, JSON.stringify(all, null, 2), "utf8");
fs.writeFileSync(OUT_REPORT, report.join("\n"), "utf8");
console.log(report.join("\n"));
console.log(`\n-> ${OUT_JSON}\n-> ${OUT_REPORT}`);
