// Sinh dữ liệu bài tập subskill Part 3 / Part 4 từ question-bank.json.
//
// Mọi dạng bài đều quy về một khuôn duy nhất: câu hỏi trắc nghiệm, kèm tuỳ chọn
// audio và tuỳ chọn khối ngữ cảnh. Nhờ vậy UI chỉ cần một trình chạy chung.
//
// Chạy: node scripts/part34/build-drills.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BANK = join(ROOT, "scripts", "data", "part34", "question-bank.json");
const OUT_DIR = join(ROOT, "lib", "subskills", "part3", "data");

const { groups } = JSON.parse(readFileSync(BANK, "utf8"));

// ─────────────────────────────────────
// Tiện ích — random có seed để build lặp lại ra kết quả giống nhau
// ─────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260809);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

/** Trộn phương án, trả về { options, correct } */
function mixOptions(correctText, distractors) {
  const options = shuffle([correctText, ...distractors]);
  return { options, correct: options.indexOf(correctText) };
}

// ─────────────────────────────────────
// Nhãn
// ─────────────────────────────────────

const LABEL_VI = {
  place_business: "Nơi chốn / loại hình công ty",
  identity: "Danh tính / nghề nghiệp",
  purpose: "Mục đích / chủ đề",
  problem: "Vấn đề / lo ngại",
  detail: "Chi tiết cụ thể",
  implication: "Hàm ý câu nói",
  next_action: "Hành động tiếp theo / yêu cầu",
  graphic: "Nhìn bảng biểu",
};

const LABEL_HINT = {
  place_business: "Dấu hiệu: mở đầu bằng Where, hoặc hỏi What kind of business/company/industry.",
  identity: "Dấu hiệu: mở đầu bằng Who, hoặc hỏi job / profession / department.",
  purpose: "Dấu hiệu: hỏi purpose, topic, focus, why is the speaker calling, what are the speakers discussing.",
  problem: "Dấu hiệu: có từ problem, concerned, worried, issue.",
  detail: "Dấu hiệu: hỏi một thông tin lẻ — According to..., What does X say about..., When / How much / How many.",
  implication: "Dấu hiệu: What does X mean when he says..., Why does X say...",
  next_action: "Dấu hiệu: will ... do next, suggest, recommend, ask, offer, listeners should.",
  graphic: "Dấu hiệu: câu bắt đầu bằng Look at the graphic.",
};

const POSITION_VI = { first: "Câu 1 (câu đầu)", middle: "Câu 2 (câu giữa)", last: "Câu 3 (câu cuối)" };

// Xác suất thật, đo trên 230 bộ EST 2026 — dùng làm lời giải thích.
const POSITION_FACT = {
  first:
    "Câu đầu đoán được ~60%: nơi chốn 29% + nghề nghiệp 18% + mục đích 14%. " +
    "Còn lại 30% là hỏi chi tiết thường, nên đây là xu hướng chứ không phải luật.",
  middle:
    "Câu giữa gần như không đoán được: chi tiết 44%, hành động 17%, bảng biểu 13%, hàm ý 13%. " +
    "Đừng phí sức đoán câu giữa — dồn sức nghe.",
  last:
    "Câu cuối là hành động tiếp theo / yêu cầu trong 47% số bộ (Part 3: 54%, Part 4: 39%). " +
    "Đây là vị trí đoán được tốt thứ nhì sau câu đầu.",
};

// ─────────────────────────────────────
// Trích dòng transcript làm bằng chứng cho đáp án
// ─────────────────────────────────────

const QUOTE_RE = /["“”]([^"“”]{4,120})["“”]/g;

function isEnglish(s) {
  return /^[\x20-\x7E'’\-]+$/.test(s) && /[a-zA-Z]/.test(s) && !/[àáảãạăâđêôơưèéẹìíòóùúýỳ]/i.test(s);
}

function transcriptLines(group) {
  return (group.transcript || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length >= 25);
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with",
  "is", "are", "was", "were", "be", "been", "will", "would", "can", "could", "should",
  "i", "you", "he", "she", "it", "we", "they", "this", "that", "there", "have", "has",
  "had", "do", "does", "did", "not", "from", "your", "our", "my", "his", "her", "their",
]);

function contentWords(s) {
  return (s.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length >= 4 && !STOP.has(w));
}

/**
 * Tìm dòng transcript làm bằng chứng cho đáp án đúng.
 * 1. Ưu tiên trích dẫn tiếng Anh trong phần giải thích — chính xác nhất.
 * 2. Nếu không có, chọn dòng trùng nhiều từ nội dung nhất với đáp án đúng.
 * Trả về null khi không đủ tin cậy.
 */
function findEvidence(group, question) {
  const lines = transcriptLines(group);
  if (lines.length < 4) return null;

  const quotes = [...(question.reasoning || "").matchAll(QUOTE_RE)]
    .map((m) => m[1].trim())
    .filter(isEnglish);

  for (const q of quotes) {
    const hit = lines.find((l) => l.toLowerCase().includes(q.toLowerCase()));
    if (hit) return { line: hit, quote: q, source: "quote" };
  }

  const answerText = question.options?.[question.answer];
  if (!answerText) return null;
  const want = contentWords(answerText);
  if (want.length === 0) return null;

  let bestLine = null;
  let bestScore = 0;
  for (const l of lines) {
    const have = new Set(contentWords(l));
    const score = want.filter((w) => have.has(w)).length / want.length;
    if (score > bestScore) {
      bestScore = score;
      bestLine = l;
    }
  }
  // Cần trùng quá nửa số từ nội dung mới coi là đáng tin
  return bestScore >= 0.5 ? { line: bestLine, quote: null, source: "overlap" } : null;
}

/** Bỏ nhãn người nói ("W: ", "M: ") cho gọn khi hiển thị */
function stripSpeaker(line) {
  return line.replace(/^[A-Z]{1,2}\d?:\s*/, "");
}

/** Vài phần giải thích trong đề gốc mở đầu bằng gạch đầu dòng thừa */
function cleanReasoning(s) {
  return (s || "").replace(/^[\s\-–—•*]+/, "").trim();
}

// ─────────────────────────────────────
// Gom nguyên liệu
// ─────────────────────────────────────

const allQuestions = groups.flatMap((g) => g.questions.map((q) => ({ group: g, q })));
const highConf = allQuestions.filter(({ q }) => q.confidence === "high");
const byLabel = {};
for (const item of highConf) (byLabel[item.q.label] ??= []).push(item);

const evidencePool = [];
for (const { group, q } of allQuestions) {
  const ev = findEvidence(group, q);
  if (ev) evidencePool.push({ group, q, ev });
}

// ─────────────────────────────────────
// Sinh từng dạng bài
// ─────────────────────────────────────

/** Phân loại chức năng câu hỏi — không cần audio */
function drillClassify(labels, count, id, title) {
  const pool = shuffle(labels.flatMap((l) => (byLabel[l] ?? []).map((x) => ({ ...x, label: l }))));
  const seen = new Set();
  const items = [];

  for (const { q, label } of pool) {
    if (items.length >= count) break;
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);

    const distractors = pick(labels.filter((l) => l !== label), 3).map((l) => LABEL_VI[l]);
    if (distractors.length < 3) continue;
    const { options, correct } = mixOptions(LABEL_VI[label], distractors);

    items.push({
      id: `classify-${items.length}`,
      question: "Câu hỏi này thuộc nhóm nào?",
      context: q.prompt,
      options,
      correct,
      explanation: LABEL_HINT[label],
    });
  }

  return { id, kind: "classify", title, instruction: "Đọc câu hỏi rồi chọn nhóm chức năng của nó. Không cần nghe.", items };
}

/** Đoán vị trí câu hỏi trong bộ 3 câu */
function drillPosition(count, id, title, { binary = false, onlyPredictive = true } = {}) {
  const predictive = { first: ["place_business", "identity", "purpose"], last: ["next_action"] };

  let pool = highConf.filter(({ q }) =>
    onlyPredictive
      ? (q.position === "first" && predictive.first.includes(q.label)) ||
        (q.position === "last" && predictive.last.includes(q.label))
      : true
  );
  if (!binary) pool = pool.filter(({ q }) => q.position !== "middle" || !onlyPredictive);

  const items = [];
  const seen = new Set();

  for (const { q } of shuffle(pool)) {
    if (items.length >= count) break;
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);

    if (binary) {
      const correctText = q.position === "first" ? "Câu đầu" : "Không phải câu đầu";
      const options = ["Câu đầu", "Không phải câu đầu"];
      items.push({
        id: `position-${items.length}`,
        question: "Câu hỏi này nhiều khả năng nằm ở đâu trong bộ 3 câu?",
        context: q.prompt,
        options,
        correct: options.indexOf(correctText),
        explanation: `${LABEL_VI[q.label]} — ${POSITION_FACT[q.position]}`,
      });
    } else {
      const options = ["Câu 1 (câu đầu)", "Câu 2 (câu giữa)", "Câu 3 (câu cuối)"];
      items.push({
        id: `position-${items.length}`,
        question: "Câu hỏi này nhiều khả năng nằm ở đâu trong bộ 3 câu?",
        context: q.prompt,
        options,
        correct: options.indexOf(POSITION_VI[q.position]),
        explanation: `${LABEL_VI[q.label]} — ${POSITION_FACT[q.position]}`,
      });
    }
  }

  return {
    id,
    kind: "position",
    title,
    instruction: binary
      ? "Chọn xem câu hỏi có phải câu mở đầu của bộ 3 câu không."
      : "Chọn vị trí câu hỏi trong bộ 3 câu. Lời giải cho biết xác suất thật đo trên 230 bộ đề.",
    items,
  };
}

/** Nghe (hoặc đọc) câu mở đầu, chọn bộ 3 câu hỏi khớp */
function drillPredictSet(count, id, title, { withAudio }) {
  const usable = groups.filter((g) => transcriptLines(g).length >= 3);
  const items = [];

  for (const g of shuffle(usable)) {
    if (items.length >= count) break;

    const summarize = (grp) => grp.questions.map((q, i) => `${i + 1}. ${q.prompt}`).join("\n");
    const others = pick(usable.filter((x) => x.groupId !== g.groupId), 2).map(summarize);
    if (others.length < 2) continue;

    const { options, correct } = mixOptions(summarize(g), others);
    const opener = stripSpeaker(transcriptLines(g)[0]);

    items.push({
      id: `predict-set-${items.length}`,
      question: withAudio
        ? "Nghe 5 giây đầu. Bộ 3 câu hỏi nào đi kèm đoạn này?"
        : "Đây là câu mở đầu đoạn. Bộ 3 câu hỏi nào đi kèm đoạn này?",
      context: withAudio ? null : opener,
      audioUrl: g.audioUrl,
      audioPreviewSeconds: withAudio ? 8 : null,
      transcript: g.transcript,
      options,
      correct,
      explanation:
        `Câu mở đầu: "${opener}" — nội dung này khoá lại bối cảnh, ` +
        `nên bộ câu hỏi phải xoay quanh cùng chủ đề.`,
      part: g.part,
    });
  }

  return {
    id,
    kind: "predict-set",
    title,
    instruction: withAudio
      ? "Chỉ nghe được phần mở đầu. Dựa vào đó chọn bộ câu hỏi khớp."
      : "Đọc câu mở đầu rồi chọn bộ câu hỏi khớp. Đây là kỹ năng bù cho 3 giây ít ỏi khi thi trên máy.",
    items,
  };
}

/** Nghe đoạn rồi trả lời đúng câu hỏi thật trong đề */
function drillListen(count, id, title, { positions, parts, labels }) {
  const items = [];

  for (const g of shuffle(groups)) {
    if (items.length >= count) break;
    if (parts && !parts.includes(g.part)) continue;
    if (!g.audioUrl) continue;

    const cand = g.questions.filter(
      (q) => (!positions || positions.includes(q.position)) && (!labels || labels.includes(q.label))
    );
    if (cand.length === 0) continue;

    const q = cand[Math.floor(rand() * cand.length)];
    const keys = Object.keys(q.options);
    const options = keys.map((k) => q.options[k]);

    items.push({
      id: `listen-${items.length}`,
      question: q.prompt,
      context: null,
      audioUrl: g.audioUrl,
      image: g.image,
      transcript: g.transcript,
      options,
      correct: keys.indexOf(q.answer),
      explanation: cleanReasoning(q.reasoning),
      part: g.part,
      label: q.label,
      labelVi: LABEL_VI[q.label],
      position: q.position,
    });
  }

  return { id, kind: "listen-mcq", title, instruction: "Nghe đoạn rồi chọn đáp án đúng.", items };
}

/** Nghe trọn bộ 3 câu liên tiếp — mô phỏng đúng nhịp thi thật */
function drillFullSet(count, id, title, { parts } = {}) {
  const items = [];

  for (const g of shuffle(groups)) {
    if (items.length >= count) break;
    if (parts && !parts.includes(g.part)) continue;
    if (!g.audioUrl) continue;

    for (const q of g.questions) {
      const keys = Object.keys(q.options);
      items.push({
        id: `set-${items.length}`,
        groupId: g.groupId,
        question: q.prompt,
        context: null,
        audioUrl: g.audioUrl,
        image: g.image,
        transcript: g.transcript,
        options: keys.map((k) => q.options[k]),
        correct: keys.indexOf(q.answer),
        explanation: cleanReasoning(q.reasoning),
        part: g.part,
        label: q.label,
        labelVi: LABEL_VI[q.label],
        position: q.position,
      });
    }
  }

  return {
    id,
    kind: "full-set",
    title,
    instruction: "Nghe hết đoạn rồi trả lời liên tiếp 3 câu, đúng nhịp đề thi thật.",
    items,
  };
}

/** Truy ngược: đáp án đúng sinh ra từ câu nào trong bài nghe */
function drillEvidence(count, id, title) {
  const items = [];

  for (const { group, q, ev } of shuffle(evidencePool)) {
    if (items.length >= count) break;
    // Câu hỏi hàm ý trích nguyên văn lời thoại ngay trong đề ⇒ lộ đáp án.
    if (q.label === "implication" || QUOTE_RE.test(q.prompt)) {
      QUOTE_RE.lastIndex = 0;
      continue;
    }
    QUOTE_RE.lastIndex = 0;

    const lines = transcriptLines(group).map(stripSpeaker);
    const correctLine = stripSpeaker(ev.line);
    const others = pick(lines.filter((l) => l !== correctLine), 3);
    if (others.length < 3) continue;

    const { options, correct } = mixOptions(correctLine, others);
    const answerText = q.options[q.answer];

    items.push({
      id: `evidence-${items.length}`,
      question: `Câu hỏi: ${q.prompt}\nĐáp án đúng: ${answerText}`,
      context: null,
      audioUrl: group.audioUrl,
      options,
      correct,
      explanation:
        cleanReasoning(q.reasoning) +
        "\n\nĐáp án gần như không bao giờ dùng lại nguyên từ trong bài — luôn là cách diễn đạt lại.",
      part: group.part,
    });
  }

  return {
    id,
    kind: "evidence",
    title,
    instruction:
      "Cho sẵn đáp án đúng. Chọn câu trong bài nghe đã sinh ra đáp án đó. " +
      "Đây là bài tập trực diện cho bẫy paraphrase.",
    items,
  };
}

/** Điền từ khoá bị khuyết trong câu chứa đáp án */
function drillFillBlank(count, id, title) {
  const items = [];

  for (const { group, q, ev } of shuffle(evidencePool)) {
    if (items.length >= count) break;

    const line = stripSpeaker(ev.line);
    const words = contentWords(line);
    if (words.length < 3) continue;

    // Chọn từ nội dung dài nhất — thường là từ mang nghĩa chính
    const target = [...words].sort((a, b) => b.length - a.length)[0];
    const re = new RegExp(`\\b${target}\\b`, "i");
    if (!re.test(line)) continue;

    const others = pick(
      [...new Set(evidencePool.flatMap((e) => contentWords(e.ev.line)))].filter(
        (w) => w !== target && Math.abs(w.length - target.length) <= 3
      ),
      3
    );
    if (others.length < 3) continue;

    const { options, correct } = mixOptions(target, others);

    items.push({
      id: `fill-${items.length}`,
      question: "Nghe rồi chọn từ đúng cho chỗ trống.",
      context: line.replace(re, "______"),
      audioUrl: group.audioUrl,
      transcript: group.transcript,
      options,
      correct,
      explanation: `Câu đầy đủ: "${line}"`,
      part: group.part,
    });
  }

  return { id, kind: "fill-blank", title, instruction: "Nghe đoạn rồi chọn từ điền vào chỗ trống.", items };
}

// ─────────────────────────────────────
// 5 cấp độ
// ─────────────────────────────────────

const LEVELS = [
  {
    level: "l1",
    band: "100-300",
    title: "Nền móng",
    goal:
      "Nhận mặt 4 nhóm câu hỏi hay gặp và biết câu nào thường mở đầu một bộ. " +
      "Toàn bộ bài ở mức nghe chậm, luôn có transcript.",
    passThreshold: 70,
    config: { playbackRate: 0.8, transcriptPolicy: "always", replayLimit: null },
    drills: [
      drillClassify(["place_business", "identity", "purpose", "next_action"], 12, "classify", "Nhận mặt 4 nhóm câu hỏi"),
      drillPosition(12, "position", "Câu này có phải câu mở đầu?", { binary: true }),
      drillListen(10, "listen", "Nghe và trả lời câu mở đầu", {
        positions: ["first"],
        labels: ["place_business", "identity"],
      }),
      drillFillBlank(10, "fill", "Điền từ khoá nghe được"),
    ],
  },
  {
    level: "l2",
    band: "300-500",
    title: "Bắt tín hiệu",
    goal:
      "Phân biệt đủ 8 nhóm câu hỏi, đoán vị trí trong bộ 3 câu, và tập dự đoán nội dung " +
      "từ câu mở đầu — kỹ năng bù cho 3 giây ít ỏi khi thi trên máy.",
    passThreshold: 70,
    config: { playbackRate: 0.9, transcriptPolicy: "after-2", replayLimit: null },
    drills: [
      drillClassify(
        ["place_business", "identity", "purpose", "problem", "detail", "implication", "next_action", "graphic"],
        14,
        "classify",
        "Phân loại đủ 8 nhóm câu hỏi"
      ),
      drillPosition(12, "position", "Đoán vị trí trong bộ 3 câu", { binary: false }),
      drillPredictSet(8, "predict", "Đọc câu mở đầu, đoán bộ câu hỏi", { withAudio: false }),
      drillListen(12, "listen", "Nghe và trả lời câu đầu / câu cuối", { positions: ["first", "last"] }),
    ],
  },
  {
    level: "l3",
    band: "500-700",
    title: "Paraphrase",
    goal:
      "Bẫy lớn nhất của Part 3/4 không phải nghe không kịp, mà là đáp án luôn diễn đạt lại " +
      "chứ không lặp từ trong bài. Cấp này đánh thẳng vào đó.",
    passThreshold: 70,
    config: { playbackRate: 1, transcriptPolicy: "after-submit", replayLimit: null },
    drills: [
      drillEvidence(14, "evidence", "Truy ngược câu sinh ra đáp án"),
      drillPredictSet(8, "predict", "Nghe 8 giây đầu, đoán bộ câu hỏi", { withAudio: true }),
      drillFullSet(8, "fullset", "Nghe trọn bộ, trả lời 3 câu"),
      drillPosition(12, "position-all", "Đoán vị trí — cả câu khó", { binary: false, onlyPredictive: false }),
    ],
  },
  {
    level: "l4",
    band: "700-900",
    title: "Tốc độ & bẫy",
    goal:
      "Hai nhóm câu khó nhất là hàm ý câu nói và nhìn bảng biểu — cả hai gần như không bao giờ " +
      "rơi vào câu đầu (1.7% và 0.4%), nên biết trước là chúng chờ ở câu 2 và câu 3.",
    passThreshold: 70,
    config: { playbackRate: 1.05, transcriptPolicy: "after-submit", replayLimit: 2 },
    drills: [
      drillListen(12, "implication", "Câu hỏi hàm ý", { labels: ["implication"] }),
      drillListen(10, "graphic", "Câu hỏi nhìn bảng biểu", { labels: ["graphic"] }),
      drillFullSet(9, "fullset", "Nghe trọn bộ — Part 4", { parts: [4] }),
      drillEvidence(12, "evidence", "Truy ngược câu sinh ra đáp án"),
    ],
  },
  {
    level: "l5",
    band: "900+",
    title: "Chống nhiễu",
    goal:
      "Mô phỏng đúng điều kiện thi trên máy: nghe một lần, không tua, không transcript, " +
      "tốc độ nhanh hơn đề thật. Qua được cấp này là qua được phòng thi.",
    passThreshold: 85,
    config: { playbackRate: 1.15, transcriptPolicy: "never", replayLimit: 1 },
    drills: [
      drillFullSet(12, "fullset-p3", "Nghe một lần — Part 3", { parts: [3] }),
      drillFullSet(12, "fullset-p4", "Nghe một lần — Part 4", { parts: [4] }),
      drillListen(12, "mixed", "Trộn mọi dạng câu hỏi", {}),
      drillEvidence(12, "evidence", "Truy ngược không nghe lại"),
    ],
  },
];

// ─────────────────────────────────────
// Ghi file + kiểm tra
// ─────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

let bad = 0;
for (const lv of LEVELS) {
  for (const d of lv.drills) {
    if (d.items.length === 0) {
      console.error(`! ${lv.level}/${d.id}: 0 câu`);
      bad++;
    }
    for (const it of d.items) {
      const n = it.options.length;
      if (n < 2 || it.correct < 0 || it.correct >= n) {
        console.error(`! ${lv.level}/${d.id}/${it.id}: correct=${it.correct} trong ${n} phương án`);
        bad++;
      }
      if (new Set(it.options).size !== n) {
        console.error(`! ${lv.level}/${d.id}/${it.id}: phương án trùng nhau`);
        bad++;
      }
    }
  }
  writeFileSync(join(OUT_DIR, `${lv.level}.json`), JSON.stringify(lv, null, 1), "utf8");
  const total = lv.drills.reduce((s, d) => s + d.items.length, 0);
  console.log(
    `${lv.level} ${lv.band.padEnd(8)} ${String(total).padStart(3)} câu — ` +
      lv.drills.map((d) => `${d.id} ${d.items.length}`).join(", ")
  );
}

console.log(`\nBằng chứng transcript dựng được: ${evidencePool.length}/${allQuestions.length} câu`);
console.log(bad === 0 ? "Kiểm tra: OK" : `Kiểm tra: ${bad} lỗi`);
if (bad > 0) process.exit(1);
