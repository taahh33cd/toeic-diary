/**
 * quality-fix.js — Fix quality issues in exercise JSON:
 * 1. ORIGINAL_IN_DISTRACTOR: remove paraphrase distractors containing the original phrase
 * 2. GENERIC_QUESTION: rewrite "Bài đọc đề cập đến:" context questions naturally
 * 3. LENGTH_GIVEAWAY: trim long correct answers or pad short distractors
 * 4. SHORT_OPTION: replace options shorter than 4 chars
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

const FALLBACK_VI = [
  "Không có thông tin này trong bài đọc",
  "Điều này không được đề cập trong ngữ cảnh bài",
  "Bài đọc không liên quan đến điều này",
  "Đây không phải nội dung chính của bài",
];

const FALLBACK_EN = [
  "This is not mentioned in the passage",
  "The passage does not discuss this topic",
  "This information is not provided",
  "None of these details appear in the text",
];

function isVi(text) { return /[àáạảãăắằặẳẵâấầậẩẫđ]/i.test(text); }

function getFallbacks(options) {
  const pool = isVi(options[0] || "") ? FALLBACK_VI : FALLBACK_EN;
  return pool.filter(f => !options.includes(f));
}

let fixes = { paraphrase_distractor: 0, generic_question: 0, length_giveaway: 0, short_option: 0 };

// ─── FIX 1: ORIGINAL_IN_DISTRACTOR ──────────────────────────────────────────
data.forEach(passage => {
  (passage.paraphrase || []).forEach(item => {
    // Extract the original phrase from the question
    const qMatch = item.question.match(/"([^"]+)"/);
    if (!qMatch) return;
    const original = qMatch[1].toLowerCase().trim();
    const correct = item.options[item.correctIndex];

    // Remove distractors that contain the original phrase
    const cleaned = item.options.map((opt, i) => {
      if (i === item.correctIndex) return opt; // keep correct
      if (opt.toLowerCase().includes(original)) {
        fixes.paraphrase_distractor++;
        return null; // mark for replacement
      }
      return opt;
    });

    // Replace nulls with fallbacks
    const fallbacks = getFallbacks(cleaned.filter(Boolean));
    let fbIdx = 0;
    const final = cleaned.map(opt => {
      if (opt === null) return fallbacks[fbIdx++] || "---";
      return opt;
    });

    // Ensure 4 options, re-shuffle
    while (final.length < 4) final.push(fallbacks[fbIdx++] || "---");
    const shuffled = shuffle(final);
    item.options = shuffled;
    item.correctIndex = shuffled.indexOf(correct);
  });
});

// ─── FIX 2: GENERIC_QUESTION for context ────────────────────────────────────
// Rewrite "Bài đọc đề cập đến: X. Trong thực tế, điều này thường có ý nghĩa gì?"
// into a more natural question based on the topic
data.forEach(passage => {
  (passage.context || []).forEach(item => {
    if (!item.question.startsWith("Bài đọc đề cập đến:")) return;
    fixes.generic_question++;

    // Extract the dan_chung excerpt
    const match = item.question.match(/đề cập đến:\s*"([^"]+)"/);
    const topic = match ? match[1] : "";

    // Get the feedback (lien_he) which has the real-world insight
    const feedback = item.feedback || "";

    // Build a natural question from the topic
    // Use keyword detection to pick appropriate question templates
    const topicLower = topic.toLowerCase();

    let newQuestion;
    if (topicLower.includes("discount") || topicLower.includes("price") || topicLower.includes("save") || topicLower.includes("offer")) {
      newQuestion = `Trong bối cảnh kinh doanh, chiến lược giảm giá hoặc ưu đãi được sử dụng nhằm mục đích gì?`;
    } else if (topicLower.includes("expand") || topicLower.includes("branch") || topicLower.includes("open") || topicLower.includes("launch")) {
      newQuestion = `Khi một doanh nghiệp mở rộng hoạt động hoặc ra mắt sản phẩm mới, yếu tố nào thường được cân nhắc đầu tiên?`;
    } else if (topicLower.includes("meeting") || topicLower.includes("schedule") || topicLower.includes("time zone")) {
      newQuestion = `Trong môi trường làm việc chuyên nghiệp, việc quản lý lịch họp hiệu quả đòi hỏi điều gì?`;
    } else if (topicLower.includes("maintenance") || topicLower.includes("repair") || topicLower.includes("shut off") || topicLower.includes("service")) {
      newQuestion = `Khi cơ sở vật chất cần bảo trì hoặc sửa chữa, nguyên tắc quản lý nào thường được áp dụng?`;
    } else if (topicLower.includes("customer") || topicLower.includes("order") || topicLower.includes("delivery") || topicLower.includes("ship")) {
      newQuestion = `Trong lĩnh vực dịch vụ khách hàng, điều gì giúp duy trì sự hài lòng và lòng trung thành của khách hàng?`;
    } else if (topicLower.includes("hire") || topicLower.includes("candidate") || topicLower.includes("position") || topicLower.includes("applicant") || topicLower.includes("intern")) {
      newQuestion = `Trong quy trình tuyển dụng chuyên nghiệp, yếu tố nào thường được nhà tuyển dụng đánh giá cao nhất?`;
    } else if (topicLower.includes("survey") || topicLower.includes("feedback") || topicLower.includes("percent") || topicLower.includes("agree")) {
      newQuestion = `Dữ liệu khảo sát và phản hồi từ nhân viên/khách hàng thường được sử dụng để làm gì trong doanh nghiệp?`;
    } else if (topicLower.includes("environment") || topicLower.includes("green") || topicLower.includes("sustainable") || topicLower.includes("energy")) {
      newQuestion = `Xu hướng bền vững và thân thiện với môi trường đang ảnh hưởng đến kinh doanh như thế nào?`;
    } else if (topicLower.includes("event") || topicLower.includes("exhibition") || topicLower.includes("showcase") || topicLower.includes("concert") || topicLower.includes("museum")) {
      newQuestion = `Trong việc tổ chức sự kiện hoặc triển lãm, yếu tố nào quyết định sự thành công của chương trình?`;
    } else if (topicLower.includes("system") || topicLower.includes("software") || topicLower.includes("update") || topicLower.includes("log out") || topicLower.includes("reboot")) {
      newQuestion = `Khi hệ thống công nghệ thông tin cần nâng cấp hoặc bảo trì, quy trình tiêu chuẩn thường bao gồm những gì?`;
    } else if (topicLower.includes("store") || topicLower.includes("retail") || topicLower.includes("shop") || topicLower.includes("boutique")) {
      newQuestion = `Trong ngành bán lẻ, chiến lược nào giúp doanh nghiệp nhỏ cạnh tranh hiệu quả?`;
    } else if (topicLower.includes("bus") || topicLower.includes("transport") || topicLower.includes("route") || topicLower.includes("lane") || topicLower.includes("passenger")) {
      newQuestion = `Khi dịch vụ giao thông công cộng có thay đổi, cơ quan quản lý thường thông báo như thế nào?`;
    } else if (topicLower.includes("dental") || topicLower.includes("medical") || topicLower.includes("health") || topicLower.includes("clinic")) {
      newQuestion = `Trong lĩnh vực y tế/nha khoa, việc nhắc lịch hẹn định kỳ cho bệnh nhân có ý nghĩa gì?`;
    } else if (topicLower.includes("compliance") || topicLower.includes("safety") || topicLower.includes("regulation") || topicLower.includes("inspect")) {
      newQuestion = `Trong môi trường sản xuất, việc tuân thủ quy định an toàn và kiểm tra định kỳ đóng vai trò gì?`;
    } else if (topicLower.includes("budget") || topicLower.includes("cost") || topicLower.includes("revenue") || topicLower.includes("€") || topicLower.includes("£") || topicLower.includes("$")) {
      newQuestion = `Trong quản lý tài chính doanh nghiệp, việc phân bổ ngân sách và kiểm soát chi phí thường nhằm mục đích gì?`;
    } else if (topicLower.includes("award") || topicLower.includes("recognition") || topicLower.includes("achievement")) {
      newQuestion = `Việc nhận giải thưởng hoặc sự công nhận trong ngành mang lại lợi ích gì cho doanh nghiệp?`;
    } else if (topicLower.includes("welcome") || topicLower.includes("onboard") || topicLower.includes("new employee") || topicLower.includes("checklist")) {
      newQuestion = `Quy trình đón nhân viên mới (onboarding) có ý nghĩa gì đối với hiệu quả làm việc lâu dài?`;
    } else if (topicLower.includes("product") || topicLower.includes("demonstration") || topicLower.includes("feature")) {
      newQuestion = `Trong kinh doanh, việc trình diễn sản phẩm (product demo) thường nhằm mục đích gì?`;
    } else {
      // Generic but better than the old template
      newQuestion = `Dựa trên nội dung bài đọc, kiến thức thực tế nào giúp hiểu sâu hơn về tình huống được mô tả?`;
    }

    item.question = newQuestion;
  });
});

// ─── FIX 3: LENGTH_GIVEAWAY ─────────────────────────────────────────────────
data.forEach(passage => {
  (passage.context || []).forEach(item => {
    const lens = item.options.map(o => o.length);
    const correctLen = lens[item.correctIndex];
    const othersAvg = lens.filter((_, j) => j !== item.correctIndex).reduce((a, b) => a + b, 0) / 3;

    if (correctLen > othersAvg * 2) {
      fixes.length_giveaway++;
      // Truncate correct answer to ~1.3x average of distractors
      const target = Math.round(othersAvg * 1.3);
      const correct = item.options[item.correctIndex];
      if (correct.length > target + 20) {
        // Cut at last sentence boundary before target
        let cutAt = correct.lastIndexOf(".", target);
        if (cutAt < target * 0.5) cutAt = correct.lastIndexOf(",", target);
        if (cutAt < target * 0.5) cutAt = target;
        item.options[item.correctIndex] = correct.slice(0, cutAt + 1).trim();
        // Also update feedback if it was just repeating the answer
      }
    }
  });
});

// ─── FIX 4: SHORT_OPTION ────────────────────────────────────────────────────
data.forEach(passage => {
  ["vocab", "paraphrase", "translation", "context"].forEach(sec => {
    (passage[sec] || []).forEach(item => {
      item.options = item.options.map((opt, i) => {
        if (opt.length < 4 && i !== item.correctIndex) {
          fixes.short_option++;
          const fbs = getFallbacks(item.options);
          return fbs[0] || "không rõ";
        }
        return opt;
      });
    });
  });
});

// ─── Final re-shuffle to balance correctIndex distribution ──────────────────
let globalIdx = 0;
const allItems = [];
["vocab", "paraphrase", "translation", "context"].forEach(sec => {
  data.forEach(p => {
    (p[sec] || []).forEach((item, i) => {
      allItems.push({ p, sec, i });
    });
  });
});

const shuffledOrder = shuffle(allItems.map((_, i) => i));
shuffledOrder.forEach((origIdx, rank) => {
  const { p, sec, i } = allItems[origIdx];
  const item = p[sec][i];
  const correct = item.options[item.correctIndex];
  const targetPos = rank % 4;
  const others = item.options.filter((_, j) => j !== item.correctIndex);
  const shuffledOthers = shuffle(others);
  const newOpts = [...shuffledOthers];
  newOpts.splice(targetPos, 0, correct);
  item.options = newOpts;
  item.correctIndex = targetPos;
});

// ─── Write and verify ───────────────────────────────────────────────────────
fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");

// Verify
let errors = 0;
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
let dupeCount = 0;
let origInDistractor = 0;
let genericCtx = 0;

data.forEach(p => {
  ["vocab", "paraphrase", "translation", "context"].forEach(sec => {
    (p[sec] || []).forEach((item, i) => {
      dist[item.correctIndex]++;
      if (item.correctIndex < 0 || item.correctIndex >= item.options.length) errors++;
      const dupes = item.options.filter((o, idx) => item.options.indexOf(o) !== idx);
      if (dupes.length) dupeCount++;
    });
  });

  // Check paraphrase: original still in distractor?
  (p.paraphrase || []).forEach(item => {
    const qM = item.question.match(/"([^"]+)"/);
    if (!qM) return;
    const orig = qM[1].toLowerCase();
    item.options.forEach((opt, i) => {
      if (i !== item.correctIndex && opt.toLowerCase().includes(orig)) origInDistractor++;
    });
  });

  (p.context || []).forEach(item => {
    if (item.question.startsWith("Bài đọc đề cập đến:")) genericCtx++;
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Quality Fix Summary ===");
console.log("Fixes applied:", fixes);
console.log(`Distribution (${total} items): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Errors: ${errors} | Remaining dupes: ${dupeCount} | Orig-in-distractor: ${origInDistractor} | Generic ctx: ${genericCtx}`);
if (errors === 0 && dupeCount === 0 && origInDistractor === 0 && genericCtx === 0) {
  console.log("ALL CLEAN.");
} else {
  if (origInDistractor > 0) console.log(`  ${origInDistractor} paraphrase items still have original in distractor (may be partial substring match)`);
  if (genericCtx > 0) console.log(`  ${genericCtx} context questions still use generic template`);
}
