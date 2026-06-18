/**
 * Comprehensive fix for all 3 exercise types:
 * 1. PARAPHRASE: Replace generic distractors with phrases from same passage
 * 2. TRANSLATION: Delete 3 broken items + fix 5 remaining issues
 * 3. VOCAB: Replace 12 "This is not mentioned" English distractors with VN meanings
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

// ─── PHASE 1: PARAPHRASE — same-passage phrase distractors ───────────────────
let paraFixed = 0;

data.forEach((passage) => {
  if (!passage.paraphrase || passage.paraphrase.length === 0) return;

  // Build phrase pool from this passage
  const pool = [];

  // 1. All paraphrase originals and corrects from this passage
  passage.paraphrase.forEach((item) => {
    const m = item.question.match(/"([^"]+)"/);
    if (m) pool.push(m[1].trim());
    pool.push(item.options[item.correctIndex].trim());
  });

  // 2. English vocabulary words from vocab items
  (passage.vocab || []).forEach((item) => {
    const m = item.question.match(/['"]([^'"]{2,30})['"] (có nghĩa|nghĩa)/);
    if (m) pool.push(m[1].trim());
  });

  // 3. Short key phrases from translation correct answers (≤50 chars)
  (passage.translation || []).forEach((item) => {
    const c = item.options[item.correctIndex];
    if (c && c.length <= 50 && !/[àáạảãăắặẩẫâầấậđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/u.test(c)) {
      pool.push(c.trim());
    }
  });

  // Fix each paraphrase item that has generic distractors
  passage.paraphrase.forEach((item) => {
    const origM = item.question.match(/"([^"]+)"/);
    const orig = origM ? origM[1].trim() : "";
    const correct = item.options[item.correctIndex];

    // Check if has generic distractors
    const hasGeneric = item.options.some((o, i) =>
      i !== item.correctIndex &&
      (o.includes("not mentioned") || o.includes("does not provide") || o.includes("passage"))
    );
    if (!hasGeneric) return;

    // Build candidate pool: exclude current original and correct
    const candidates = [...new Set(pool)].filter(
      (s) =>
        s !== orig &&
        s !== correct &&
        s.trim().length > 1 &&
        !s.includes("not mentioned") &&
        !s.includes("does not provide")
    );

    // Replace generic distractors with candidates
    let candIdx = 0;
    item.options = item.options.map((opt, i) => {
      if (i === item.correctIndex) return opt;
      if (opt.includes("not mentioned") || opt.includes("does not provide") || opt.includes("passage")) {
        if (candIdx < candidates.length) {
          paraFixed++;
          return candidates[candIdx++];
        }
      }
      return opt;
    });

    // Update feedback
    if (!item.feedback || item.feedback.length < 5) {
      item.feedback = `"${orig}" = "${correct}"`;
    }
  });
});

// ─── PHASE 2: TRANSLATION — delete 3 broken + fix 5 issues ──────────────────
let transDeleted = 0, transFixed = 0;

// Items to DELETE (by pi:ii, sorted descending so splice doesn't shift indices)
// pi:44 ii:0, pi:43 ii:1, pi:42 ii:0
const toDelete = [
  { pi: 44, ii: 0 },  // "Chào buổi sáng."
  { pi: 43, ii: 1 },  // "Tôi tới nơi rồi."
  { pi: 42, ii: 0 },  // "Chào mọi người."
];
toDelete.forEach(({ pi, ii }) => {
  if (data[pi] && data[pi].translation && data[pi].translation[ii]) {
    data[pi].translation.splice(ii, 1);
    transDeleted++;
  }
});

// Manual patches for 5 remaining issues
const GOOD_DISTS = [
  "The company will announce the changes at the next quarterly meeting.",
  "All employees must complete the training by the end of the month.",
  "Please contact our customer service department for further assistance.",
  "The renovation project is expected to be completed by the end of June.",
  "We are pleased to announce the opening of our new branch office.",
  "The conference will feature presentations from industry experts.",
  "Registration is required for all participants before the deadline.",
  "All staff members are encouraged to attend the annual team-building event.",
  "The building will be closed for maintenance this weekend.",
  "Guests are advised to make reservations at least one week in advance.",
  "Applications must be submitted by the posted deadline.",
  "Interviews will be conducted the following week.",
];

// pi:23 ii:0 (Bài 24) — duplicate options
{
  const item = data[23].translation[0];
  if (item) {
    const correct = item.options[item.correctIndex];
    const unique = [...new Set(item.options.filter(o => o !== correct))];
    while (unique.length < 3) {
      const replacement = GOOD_DISTS.find(s => !unique.includes(s) && s !== correct);
      if (replacement) unique.push(replacement);
      else break;
    }
    const newOpts = shuffle([correct, ...unique.slice(0, 3)]);
    item.options = newOpts;
    item.correctIndex = newOpts.indexOf(correct);
    transFixed++;
  }
}

// pi:26 ii:0 (Bài 27) — D2 is Vietnamese (feedback text leaked in)
{
  const item = data[26].translation[0];
  if (item) {
    const correct = item.options[item.correctIndex];
    item.options = item.options.map((opt, i) => {
      if (i === item.correctIndex) return opt;
      if (/[àáạảãăắặẩẫâầấậđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/u.test(opt)) {
        const replacement = GOOD_DISTS.find(s => !item.options.includes(s) && s !== correct);
        transFixed++;
        return replacement || "The company will implement a new eco-friendly policy next quarter.";
      }
      return opt;
    });
  }
}

// pi:28 ii:0 (Bài 29) — header in VI "Gửi những người hàng xóm thân mến..."
{
  const item = data[28].translation[0];
  if (item) {
    const viM = item.question.match(/"([^"]+)"/s);
    if (viM && viM[1].startsWith("Gửi")) {
      const cleaned = viM[1].replace(/^Gửi[^,]+,\s*/i, "").trim();
      item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${cleaned}"`;
      transFixed++;
    }
  }
}

// pi:30 ii:1 (Bài 31) — correct answer is Vietnamese
{
  const item = data[30].translation[1];
  if (item && /[àáạảãăắặẩẫâầấậđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/u.test(item.options[item.correctIndex])) {
    const newCorrect = "The building has remained empty since the Marigold furniture factory moved to a new location.";
    const newDists = shuffle(GOOD_DISTS.filter(s => s !== newCorrect)).slice(0, 3);
    const newOpts = shuffle([newCorrect, ...newDists]);
    item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Tòa nhà này đã bỏ trống kể từ khi nhà máy nội thất Marigold chuyển sang cơ sở mới."`;
    item.options = newOpts;
    item.correctIndex = newOpts.indexOf(newCorrect);
    item.feedback = `Bản dịch: "${newCorrect}"`;
    transFixed++;
  }
}

// pi:64 ii:1 (Bài 14 double) — D2 is Vietnamese (shipping weight text)
{
  const item = data[64].translation[1];
  if (item) {
    const correct = item.options[item.correctIndex];
    item.options = item.options.map((opt, i) => {
      if (i === item.correctIndex) return opt;
      if (/[àáạảãăắặẩẫâầấậđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/u.test(opt) || opt.includes("[")) {
        const replacement = GOOD_DISTS.find(s => !item.options.includes(s) && s !== correct);
        transFixed++;
        return replacement || "The management team has approved the proposed budget for next year.";
      }
      return opt;
    });
  }
}

// pi:13 ii:0 (Bài 14) — VI is greeting, correct is unrelated fragment
{
  const item = data[13].translation[0];
  const newCorrect = "Welcome to the Harrod Automobile Manufacturing Plant!";
  if (item && item.options[item.correctIndex] !== newCorrect) {
    const newDists = shuffle(GOOD_DISTS.filter(s => s !== newCorrect)).slice(0, 3);
    const newOpts = shuffle([newCorrect, ...newDists]);
    item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Chào mừng đến với Nhà máy Sản xuất Ô tô Harrod!"`;
    item.options = newOpts;
    item.correctIndex = newOpts.indexOf(newCorrect);
    item.feedback = `Bản dịch: "${newCorrect}"`;
    transFixed++;
  }
}

// ─── PHASE 3: VOCAB — replace "This is not mentioned" with VN meanings ───────
let vocabFixed = 0;

const VOCAB_REPLACEMENTS = {
  "established":          "đã thay đổi hoàn toàn",
  "interim":              "chính thức, vĩnh viễn",
  "take advantage of":    "cẩn thận, tránh né",
  "reboot":               "tắt máy hoàn toàn",
  "overnight":            "ngắn hạn, tạm thời",
  "requester":            "kết quả, thành phẩm",
  "projected cost estimates": "danh sách tham dự họp",
  "outreach":             "ngân sách dự phòng",
  "agenda":               "kết quả đạt được",
  "on-site":              "từ xa, qua internet",
  "eligible":             "bắt buộc, yêu cầu tham gia",
  "workforce":            "khách hàng, người dùng cuối",
};

data.forEach((passage) => {
  (passage.vocab || []).forEach((item) => {
    const wordM = item.question.match(/['"]([^'"]{2,30})['"] (có nghĩa|nghĩa)/);
    if (!wordM) return;
    const word = wordM[1].toLowerCase().trim();

    item.options = item.options.map((opt, i) => {
      if (i === item.correctIndex) return opt;
      if (
        opt === "This is not mentioned in the passage." ||
        opt === "This is not mentioned in the passage"
      ) {
        // First try: use mapping
        const replacement = VOCAB_REPLACEMENTS[word];
        if (replacement && !item.options.includes(replacement)) {
          vocabFixed++;
          return replacement;
        }
        // Fallback: use a plausible VN meaning not already in options
        const fallbacks = [
          "đã ngừng hoạt động",
          "không chắc chắn",
          "liên quan đến tài chính",
          "thuộc về bên ngoài",
          "chưa được xác nhận",
          "đang trong quá trình xem xét",
          "liên quan đến nhân sự",
          "phụ thuộc vào điều kiện",
        ];
        const fb = fallbacks.find(f => !item.options.includes(f));
        if (fb) { vocabFixed++; return fb; }
      }
      return opt;
    });
  });
});

// Fix vocab format issue: Bài 7 (pi:6) — "gần nghĩa" format
{
  const p = data[6];
  if (p && p.vocab) {
    p.vocab.forEach((item) => {
      if (item.question.includes("gần nghĩa với gì")) {
        const m = item.question.match(/['"']([^'"']+)['"']/);
        if (m) {
          item.question = `Cụm "${m[1]}" có nghĩa là gì?`;
          vocabFixed++;
        }
      }
    });
  }
}

// ─── Re-balance correct answer distribution ───────────────────────────────────
const SECS = ["vocab", "paraphrase", "translation", "context"];
const allItems = [];
data.forEach((p) => {
  SECS.forEach((sec) => {
    (p[sec] || []).forEach((item, i) => allItems.push({ p, sec, i }));
  });
});
const order = shuffle(allItems.map((_, i) => i));
order.forEach((origIdx, rank) => {
  const { p, sec, i } = allItems[origIdx];
  const item = p[sec][i];
  if (!item) return;
  const correct = item.options[item.correctIndex];
  if (!correct) return;
  const targetPos = rank % 4;
  const others = shuffle(item.options.filter((_, j) => j !== item.correctIndex));
  const newOpts = [...others];
  newOpts.splice(targetPos, 0, correct);
  item.options = newOpts;
  item.correctIndex = targetPos;
});

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");

// ─── Verification ────────────────────────────────────────────────────────────
let genericLeft = 0, engVocabLeft = 0, errors = 0;
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };

data.forEach((p) => {
  SECS.forEach((sec) => {
    (p[sec] || []).forEach((item) => {
      if (!item.options || item.correctIndex === undefined) { errors++; return; }
      dist[item.correctIndex]++;
      if (item.correctIndex < 0 || item.correctIndex >= item.options.length) errors++;
    });
  });
  (p.paraphrase || []).forEach((item) => {
    item.options.forEach((o, i) => {
      if (i !== item.correctIndex && (o.includes("not mentioned") || o.includes("does not provide"))) {
        genericLeft++;
      }
    });
  });
  (p.vocab || []).forEach((item) => {
    item.options.forEach((o, i) => {
      if (i !== item.correctIndex && o === "This is not mentioned in the passage.") engVocabLeft++;
    });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Fix Summary ===");
console.log(`Paraphrase: fixed ${paraFixed} generic distractors`);
console.log(`Translation: deleted ${transDeleted} items, fixed ${transFixed}`);
console.log(`Vocab: fixed ${vocabFixed} items`);
console.log();
console.log(`Remaining generic paraphrase distractors: ${genericLeft}`);
console.log(`Remaining English vocab distractors: ${engVocabLeft}`);
console.log(`Errors: ${errors}`);
console.log(`Distribution (${total}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
if (genericLeft === 0 && engVocabLeft === 0 && errors === 0) {
  console.log("ALL CLEAN.");
}
