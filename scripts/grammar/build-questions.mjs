// Gộp data Part 5 từ Google Docs vào bank /grammar, chấm độ khó từng câu rồi
// sắp lại thứ tự TRONG từng test (dễ -> khó).
//
// Luôn dựng lại từ hai nguồn gốc nên chạy bao nhiêu lần cũng ra cùng kết quả:
//   scripts/data/grammar-docs/base-questions.json  (3.025 câu có sẵn trước khi import)
//   scripts/data/grammar-docs/parsed.json          (966 câu parse từ Docs)
//
//   node scripts/grammar/build-questions.mjs           # chỉ xuất báo cáo, không ghi
//   node scripts/grammar/build-questions.mjs --write   # ghi lib/grammar/questions.ts
//
// Thứ tự mảng xuất ra chính là thứ tự test: lib/grammar/topics.ts cắt test bằng
// getTestSlice theo testSizes, nên topic nào cũng phải xếp đủ test 1, test 2, …

import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "scripts/data/grammar-docs");
const QUESTIONS_TS = path.join(process.cwd(), "lib/grammar/questions.ts");
const TOPICS_TS = path.join(process.cwd(), "lib/grammar/topics.ts");
const WRITE = process.argv.includes("--write");

/* ------------------------------------------------------------------ rubric */

/**
 * Dạng ngữ pháp con, dò theo từ khoá trong phần giải thích. Lấy mốc CAO NHẤT
 * khớp được: một câu nhắc cả "quá khứ đơn" và "đảo ngữ" thì tính theo đảo ngữ.
 */
const GRAMMAR_TIERS = [
  [2, ["hiện tại đơn", "quá khứ đơn", "số ít", "số nhiều", "danh từ số", "tính từ bổ nghĩa", "trạng từ chỉ"]],
  [4, ["tương lai đơn", "hiện tại tiếp diễn", "quá khứ tiếp diễn", "giới từ", "liên từ", "đại từ", "so sánh hơn", "hậu tố", "từ loại"]],
  [6, ["hiện tại hoàn thành", "bị động", "v-ing", "to v", "nguyên mẫu", "nguyên thể", "mệnh đề quan hệ", "danh động từ", "khuyết thiếu", "so sánh nhất", "liên từ phụ thuộc"]],
  [8, ["quá khứ hoàn thành", "hoàn thành tiếp diễn", "điều kiện", "mệnh đề danh ngữ", "phân từ", "rút gọn", "sai khiến", "giả định", "hoà hợp", "hòa hợp", "tương lai hoàn thành"]],
  [10, ["đảo ngữ", "giả định cách", "so sánh kép", "loại 3", "loại hỗn hợp", "câu chẻ", "cấu trúc đặc biệt"]],
];

/** Từ hay gặp — dùng để đo "từ lạ", không phải từ điển. */
const COMMON = new Set(
  `a about above after again against all almost already also although always am an and another any are around as at
  back be because been before being below best better between both business but by
  call called can cannot come company could customer
  day department did do does doing done down during
  each early employee end enough even ever every except
  far few first for from further
  get give given go going good got great group
  had has have having he her here hers herself him himself his how however
  i if in including information into is it its itself
  just
  keep know known
  last late later least less let like little long look
  made make manager many may me meeting might more most much must my
  near need never new next no none nor not now number
  of off office often on once one only or order other others our out over own
  part people per place please policy position possible price product program project provide
  rather really receive recent report required right
  said same say see service several she should since so some staff still such sure
  take team than that the their them themselves then there these they this those though through time to today together too
  under until up upon us use used
  very
  want was way we week well were what when where whether which while who whom whose why will with within without work would
  year yes yet you your yours`
    .split(/\s+/)
    .filter(Boolean)
);

const CLAUSE_MARKERS = /\b(that|which|who|whom|whose|because|although|though|if|unless|when|while|after|before|since|until|whereas|so that|in order that|as soon as|even though|now that)\b/gi;

function scoreGrammar(q) {
  const hay = `${q.explanation_grammar} ${q.docs_category ?? ""} ${q.explanation_reason}`.toLowerCase();
  let best = 0;
  for (const [tier, keys] of GRAMMAR_TIERS) {
    if (keys.some((k) => hay.includes(k))) best = tier;
  }
  return best || 5;
}

function rawSentence(q) {
  const text = q.question.replace(/_{2,}/g, " ");
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w)).length;
  const clauses = (text.match(CLAUSE_MARKERS) || []).length;
  const commas = (text.match(/,/g) || []).length;
  return words + clauses * 3 + commas;
}

function rawVocab(q) {
  const tokens = q.question
    .toLowerCase()
    .replace(/_{2,}/g, " ")
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return 0;
  const rare = tokens.filter((t) => t.length >= 6 && !COMMON.has(t));
  const extra = rare.reduce((a, w) => a + Math.max(0, w.length - 7), 0) / tokens.length;
  return rare.length / tokens.length + extra * 0.5;
}

/** Tỉ lệ tiền tố chung — 4 đáp án cùng gốc từ (settle/settling/settled) thì cao. */
function prefixRatio(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i / Math.max(a.length, b.length, 1);
}

function rawDistractor(q) {
  const opts = Object.values(q.options).map((o) => String(o).toLowerCase().trim());
  if (opts.length < 2) return 0.5;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < opts.length; i++) {
    for (let j = i + 1; j < opts.length; j++) {
      sum += prefixRatio(opts[i], opts[j]);
      pairs++;
    }
  }
  const sim = pairs ? sum / pairs : 0;
  // Ít giống nhau = 4 từ vựng khác hẳn nhau = phải hiểu nghĩa, khó hơn đoán hậu tố.
  return 1 - sim + (opts.some((o) => o.includes(" ")) ? 0.15 : 0);
}

const WEIGHTS = { grammar: 0.35, distractor: 0.25, sentence: 0.2, vocab: 0.2 };

const RAW = {
  grammar: scoreGrammar,
  sentence: rawSentence,
  vocab: rawVocab,
  distractor: rawDistractor,
};

/**
 * Bốn tiêu chí có đơn vị khác nhau (bậc 2-10, số từ, tỉ lệ, độ giống) nên
 * không cộng thẳng được. Quy mỗi tiêu chí về phân vị 0-10 TRÊN TOÀN BANK rồi
 * mới cộng theo trọng số — như vậy tiêu chí nào cũng phân biệt được như nhau,
 * không có cái bị đụng trần.
 */
function buildScorer(questions) {
  const tables = {};
  for (const key of Object.keys(RAW)) {
    const values = questions.map(RAW[key]).sort((a, b) => a - b);
    tables[key] = values;
  }
  const pct = (key, v) => {
    const arr = tables[key];
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    let hiEnd = lo;
    while (hiEnd < arr.length && arr[hiEnd] === v) hiEnd++;
    const rank = (lo + hiEnd - 1) / 2;
    return arr.length > 1 ? (10 * rank) / (arr.length - 1) : 5;
  };
  return (q) => {
    const parts = {};
    let total = 0;
    for (const key of Object.keys(RAW)) {
      const v = pct(key, RAW[key](q));
      parts[key] = Math.round(v * 10) / 10;
      total += v * WEIGHTS[key];
    }
    return { parts, total: Math.round(total * 100) / 100 };
  };
}

/* -------------------------------------------------------------- nạp dữ liệu */

const base = JSON.parse(fs.readFileSync(path.join(DATA, "base-questions.json"), "utf8"));
const docs = JSON.parse(fs.readFileSync(path.join(DATA, "parsed.json"), "utf8"));

/* ------------------------------------------------- điền loại từ còn thiếu */

/**
 * Phần SUBMARINE 2026 và 4 thẻ chủ điểm trong Docs ghi từ vựng không kèm loại từ
 * ("Organizer: người tổ chức"), nên màn glossary của những đề đó thiếu (n.)/(v.)
 * so với đề cũ. Điền lại theo thứ tự tin cậy giảm dần, chỗ nào không chắc thì để
 * trống hơn là gán bừa — nhãn sai còn hại hơn không có nhãn.
 */
const WORD_TYPE = (() => {
  const norm = (w) => w.toLowerCase().trim().replace(/[.,;:]+$/, "");

  // Từ điển dựng từ chính data này: mọi mục đã có sẵn loại từ do người soạn ghi.
  const lex = new Map();
  for (const q of [...base, ...docs])
    for (const v of q.core_vocabulary ?? []) {
      if (!v.type) continue;
      const k = norm(v.word);
      if (!k) continue;
      if (!lex.has(k)) lex.set(k, new Map());
      const m = lex.get(k);
      m.set(v.type, (m.get(v.type) || 0) + 1);
    }

  // Từ vừa là danh từ vừa là động từ (record, delay, increase) thì bỏ qua, trừ
  // khi một loại áp đảo hẳn.
  const pick = (m) => {
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    const [top, n] = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    return n / total >= 0.8 ? top : "";
  };

  const ADV_BLOCK = new Set(
    "apply reply supply multiply comply imply rely assembly family only early likely friendly costly monthly weekly daily yearly timely orderly lovely ugly silly fly ally rally bully july italy anomaly jolly".split(" ")
  );
  const ADJ_BLOCK = new Set("enable disable table cable vegetable syllable".split(" "));
  // Chỉ giữ hậu tố gần như không có ngoại lệ. Đã bỏ -ist (assist/exist), -ure
  // (sure/measure), -age (manage/damage), -ive (drive/initiative), -ic
  // (traffic/music), -ance/-ence (advance/commence) vì lẫn cả động từ lẫn danh từ.
  const SUFFIX = [
    [/(tion|sion|ment|ness|ity|ship|hood|ism)$/, "n."],
    [/(ize|ise|ify)$/, "v."],
    [/(able|ible|ous|ful|less)$/, "adj."],
  ];

  return (word) => {
    const k = norm(word);
    if (!k) return "";
    const m = lex.get(k);
    if (m) {
      const p = pick(m);
      if (p) return p;
    }
    if (k.includes(" ")) return "phr.";
    if (k.includes("-")) return ""; // members-only, do-it-yourself — đoán sai nhiều
    if (k.length >= 5 && /ly$/.test(k) && !ADV_BLOCK.has(k)) return "adv.";
    if (k.length >= 6 && !ADJ_BLOCK.has(k)) for (const [re, t] of SUFFIX) if (re.test(k)) return t;
    return "";
  };
})();

const wordTypeStats = { missing: 0, filled: 0 };
for (const q of [...base, ...docs])
  for (const v of q.core_vocabulary ?? []) {
    if (v.type) continue;
    wordTypeStats.missing++;
    const t = WORD_TYPE(v.word);
    if (t) {
      v.type = t;
      wordTypeStats.filled++;
    }
  }

/** Câu thiếu A/B/C/D hoặc đáp án không nằm trong A-D thì không đưa lên web. */
const dropped = [];
const usableDocs = docs.filter((q) => {
  const ok = Object.keys(q.options).length === 4 && q.correct_answer && q.options[q.correct_answer];
  if (!ok) dropped.push(q);
  return ok;
});

/** testSizes hiện tại trong topics.ts — nguồn duy nhất quyết định biên test. */
function readTopics() {
  const src = fs.readFileSync(TOPICS_TS, "utf8");
  const block = src
    .slice(src.indexOf("export const TOPICS"), src.indexOf("export function getTopicBySlug"))
    // Bỏ comment để regex dưới đây không bị chặn giữa name: và testSizes:.
    .replace(/^\s*\/\/.*$/gm, "");
  const out = [];
  const re = /id:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*testSizes:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(block))) {
    out.push({
      id: m[1],
      slug: m[2],
      name: m[3],
      testSizes: m[4]
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
    });
  }
  return out;
}

const topics = readTopics();

/** Nhóm câu Docs theo (topic, test) đúng thứ tự xuất hiện. */
const docTests = new Map(); // topic -> [{ label, questions }]
for (const q of usableDocs) {
  if (!docTests.has(q.grammar_type)) docTests.set(q.grammar_type, []);
  const list = docTests.get(q.grammar_type);
  let slot = list[list.length - 1];
  if (!slot || slot.label !== q.source) {
    slot = { label: q.source, questions: [] };
    list.push(slot);
  }
  slot.questions.push(q);
}

/* -------------------------------------------------------- dựng test từng topic */

/** [{ topicId, topicName, testNumber, label, questions }] theo thứ tự xuất file. */
const allTests = [];
const unknownTopics = [];

for (const topic of topics) {
  const existing = base.filter((q) => q.grammar_type === topic.id);
  let cursor = 0;
  let testNumber = 0;

  // Test cũ: cắt theo testSizes như getTestSlice đang làm.
  for (const size of topic.testSizes) {
    const slice = existing.slice(cursor, cursor + size);
    if (!slice.length) break;
    cursor += size;
    testNumber++;
    allTests.push({ topicId: topic.id, topicName: topic.name, testNumber, label: `(bank cũ) Test ${testNumber}`, questions: slice });
  }
  if (cursor < existing.length) {
    const rest = existing.slice(cursor);
    testNumber++;
    allTests.push({ topicId: topic.id, topicName: topic.name, testNumber, label: `(bank cũ) dư ${rest.length} câu`, questions: rest });
  }

  // Test mới từ Docs nối vào sau.
  for (const slot of docTests.get(topic.id) ?? []) {
    testNumber++;
    allTests.push({ topicId: topic.id, topicName: topic.name, testNumber, label: slot.label, questions: slot.questions });
  }
  docTests.delete(topic.id);
}

// Topic trong Docs mà topics.ts chưa khai báo -> in snippet để dán vào topics.ts.
for (const [topicId, slots] of docTests) {
  unknownTopics.push({ topicId, sizes: slots.map((s) => s.questions.length) });
  let testNumber = 0;
  for (const slot of slots) {
    testNumber++;
    allTests.push({ topicId, topicName: topicId, testNumber, label: slot.label, questions: slot.questions });
  }
}

/* ------------------------------------------- chấm điểm, sắp xếp, gán nhãn */

const everyQuestion = allTests.flatMap((t) => t.questions);
const difficultyOf = buildScorer(everyQuestion);
const scored = [];
for (const test of allTests) {
  for (const q of test.questions) scored.push({ q, ...difficultyOf(q) });
}

// Ngưỡng Dễ/TB/Khó lấy theo phân vị TOÀN bank, không theo từng test: để nhãn
// "Khó" ở test nào cũng có nghĩa như nhau.
const sortedTotals = scored.map((s) => s.total).sort((a, b) => a - b);
const p = (f) => sortedTotals[Math.floor(f * (sortedTotals.length - 1))];
const T_EASY = p(1 / 3);
const T_HARD = p(2 / 3);
const bandOf = (total) => (total <= T_EASY ? "easy" : total <= T_HARD ? "medium" : "hard");

const scoreById = new Map(scored.map((s) => [s.q, s]));
const csv = ["topic,test,thu_tu_cu,thu_tu_moi,id,diem,bac,ngu_phap,cau,tu_vung,gay_nhieu,cau_hoi"];
const output = [];

for (const test of allTests) {
  const withOrder = test.questions.map((q, i) => ({ q, oldIdx: i + 1, ...scoreById.get(q) }));
  const ordered = [...withOrder].sort((a, b) => a.total - b.total || a.oldIdx - b.oldIdx);

  ordered.forEach((item, i) => {
    const band = bandOf(item.total);
    // Chỉ `difficulty` đi lên web. Điểm chi tiết và nhãn gốc từ Docs nằm ở
    // difficulty-report.csv và parsed.json, không nhồi vào bundle.
    const out = { ...item.q, difficulty: band };
    delete out.source;
    delete out.docs_category;
    delete out.options_from_override;
    delete out._group;
    delete out._lesson;
    delete out._test;
    output.push(out);

    csv.push(
      [
        test.topicName,
        `Test ${test.testNumber} ${test.label}`,
        item.oldIdx,
        i + 1,
        item.q.id,
        item.total,
        band,
        item.parts.grammar,
        item.parts.sentence,
        Math.round(item.parts.vocab * 10) / 10,
        Math.round(item.parts.distractor * 10) / 10,
        item.q.question.replace(/\s+/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  });
}

/* ------------------------------------------------------------------ báo cáo */

const lines = [];
lines.push(`Bank cũ: ${base.length} câu · Docs dùng được: ${usableDocs.length} câu · bỏ: ${dropped.length} câu`);
lines.push(`Tổng sau khi gộp: ${output.length} câu / ${allTests.length} test`);
lines.push(
  `Loại từ: ${wordTypeStats.missing} mục thiếu -> điền ${wordTypeStats.filled}, còn trống ${wordTypeStats.missing - wordTypeStats.filled}`
);
lines.push(`Ngưỡng nhãn (phân vị toàn bank): Dễ <= ${T_EASY} < TB <= ${T_HARD} < Khó`);
const bands = { easy: 0, medium: 0, hard: 0 };
for (const q of output) bands[q.difficulty]++;
lines.push(`  Dễ ${bands.easy} · TB ${bands.medium} · Khó ${bands.hard}`);
lines.push("");

lines.push("--- Số test & số câu mỗi topic (dùng để cập nhật testSizes) ---");
const byTopic = new Map();
for (const t of allTests) {
  if (!byTopic.has(t.topicId)) byTopic.set(t.topicId, []);
  byTopic.get(t.topicId).push(t.questions.length);
}
for (const [topicId, sizes] of byTopic) {
  lines.push(`  ${topicId}: ${sizes.length} test, ${sizes.reduce((a, b) => a + b, 0)} câu`);
  lines.push(`    testSizes: [${sizes.join(", ")}],`);
}

if (unknownTopics.length) {
  lines.push("");
  lines.push("--- CHƯA CÓ TRONG topics.ts, cần thêm ---");
  for (const u of unknownTopics) lines.push(`  "${u.topicId}": testSizes: [${u.sizes.join(", ")}],`);
}

// topics.ts khai thiếu một test là test đó biến mất khỏi web mà không báo gì,
// nên đối chiếu ngay ở đây.
const mismatches = [];
for (const topic of topics) {
  const actual = byTopic.get(topic.id) ?? [];
  const declared = topic.testSizes.slice(0, actual.length);
  if (declared.join(",") !== actual.join(",")) {
    mismatches.push(`  ${topic.id}: topics.ts [${declared.join(", ")}] vs thực tế [${actual.join(", ")}]`);
  }
}
if (mismatches.length || unknownTopics.length) {
  lines.push("");
  lines.push("--- LỆCH testSizes, phải sửa topics.ts ---");
  lines.push(...mismatches);
}

if (dropped.length) {
  lines.push("");
  lines.push("--- Câu bị bỏ (Docs thiếu A/B/C/D) ---");
  for (const q of dropped) lines.push(`  ${q.id} | ${q.source} | ${q.question.slice(0, 90)}`);
}

const report = lines.join("\n");
fs.writeFileSync(path.join(DATA, "build-report.txt"), report, "utf8");
fs.writeFileSync(path.join(DATA, "difficulty-report.csv"), `﻿${csv.join("\n")}`, "utf8");
console.log(report);

if (WRITE) {
  const header =
    "﻿import type { GrammarQuestion } from './types';\n\n" +
    "// prettier-ignore\n" +
    "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n";
  fs.writeFileSync(
    QUESTIONS_TS,
    `${header}export const grammarQuestions = ${JSON.stringify(output, null, 2)} as any[] as GrammarQuestion[];\n`,
    "utf8"
  );
  console.log(`\n-> đã ghi ${QUESTIONS_TS}`);
} else {
  console.log("\n(chạy lại với --write để ghi lib/grammar/questions.ts)");
}
console.log(`-> ${path.join(DATA, "difficulty-report.csv")}`);
