/**
 * Fix translation exercises v3:
 * 1. Strip headers from ALL translation prompts (not just > 120 chars)
 * 2. Fix distractors too short relative to correct answer
 */
const fs = require("fs");
const FILE = "E:/toeic-dictation-master/data/reading-exercises-all.json";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ─── Strip Vietnamese memo/email headers ─────────────────────────────────────
function stripHeaders(text) {
  let result = text.trim();
  // Multi-pass: header lines can be chained
  for (let pass = 0; pass < 6; pass++) {
    const before = result;

    // Remove leading block markers: [E-mail], [BẢNG], [EMAIL], [Thông báo], etc.
    result = result.replace(/^\[[\w\s-]+\]\s*/i, "").trim();

    // Remove "PHIẾU YÊU CẦU..." style titles
    result = result.replace(/^(BẢN GHI NHỚ|MEMO|THÔNG BÁO|PHIẾU[^.!?\n]*)\s*/i, "").trim();
    result = result.replace(/^(Danh sách[^.!?\n]*)\s*/i, "").trim();

    // Remove "Key: Value" header lines (Gửi:, Từ:, Đến:, Ngày:, Chủ đề:, etc.)
    result = result.replace(/^(Gửi|Đến|Từ|Ngày|Chủ đề|Tên|Email|Người yêu cầu|Ngày Nhập|Ngày Hạn|Loại|Tóm tắt|Kính gửi|To|From|Date|Subject|Re|Requester)[:\s][^\n.!?]*[.\s,]*/i, "").trim();

    // Product listing headers like "THẢM CAO CẤP TYCHE — Bộ sưu tập..."
    result = result.replace(/^[A-ZĐÀÁẠẢÃÂẦẮẶẨẪĂẺẸẼÊỀẾỆỂỄỈỊỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ\s]{5,}[—–]\s*/u, "").trim();

    // Remove date/time stamps like "15 tháng 6" or "Ngày 30 tháng 3 5:30..."
    result = result.replace(/^(Ngày\s+)?\d{1,2}\s+tháng\s+\d{1,2}[^.!?]*[.!?]?\s*/i, "").trim();

    // Remove chat-format names: "Clay, Bạn có..." → "Bạn có..."
    // Keep if it's just a greeting like "Clay," at start
    result = result.replace(/^[A-ZÀ-Ỹa-zà-ỹ]+,\s+(?=[A-ZĐÀ-Ỹ])/u, "").trim();

    if (result === before) break;
  }
  return result;
}

// ─── Split into good single sentences ────────────────────────────────────────
function bestSentence(text) {
  const cleaned = stripHeaders(text);

  const sentences = cleaned
    .split(/(?<=[.!?])\s+|(?<=\.)\s*(?=[A-ZĐÀ-Ỹ])/u)
    .map(s => s.replace(/^[\s\-•–—\d.)]+/, "").trim())
    .filter(s => s.length >= 20 && s.length <= 150)
    .filter(s => !s.match(/^(Gửi|Đến|Từ|Ngày|Chủ đề|BẢN GHI|MEMO|PHIẾU|\[)/i))
    .filter(s => s.includes(" "));

  if (sentences.length === 0) {
    // Return stripped header text truncated to first clause
    const fallback = cleaned.replace(/[,;]\s+.*$/, "").trim();
    return fallback.length >= 20 ? fallback : null;
  }

  // Score: prefer 40-110 char, has verb, ends with punctuation
  const scored = sentences.map(s => {
    let score = 0;
    if (s.length >= 40 && s.length <= 110) score += 10;
    if (s.match(/(sẽ|đã|đang|phải|cần|có thể|nên|hãy|xin|vui lòng|được|bị)/i)) score += 5;
    if (s.match(/[.!?]$/)) score += 3;
    if (!s.match(/^(và|hoặc|nhưng|tuy nhiên|vì vậy)/i)) score += 2; // starts clean
    return { s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].s;
}

// ─── Build distractor pool ────────────────────────────────────────────────────
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
  "The supervisor requested that all reports be submitted before the meeting.",
  "Guests are advised to make reservations at least one week in advance.",
  "The warranty covers all manufacturing defects for a period of two years.",
  "Applicants should include a cover letter along with their resume.",
  "The training session will be held in the main conference room on the second floor.",
  "Employees who wish to participate must sign up by the end of the week.",
  "The company has experienced significant growth in international markets this year.",
  "All visitors must check in at the front desk upon arrival.",
  "The proposed changes will be reviewed by the board of directors next month.",
  "Maintenance workers will begin repairing the elevator on Monday morning.",
  // Shorter sentences for when correct answer is short
  "Free parking is available for all guests.",
  "The event is open to the public.",
  "No experience is required to apply.",
  "Admission is free for all attendees.",
  "Seating is limited; reserve yours today.",
  "The offer expires at the end of this month.",
  "Please bring a valid photo ID to the event.",
  "Light refreshments will be served at the reception.",
  "The discount applies to all items in stock.",
  "Participants must register online in advance.",
  "The workshop begins promptly at nine in the morning.",
  "All sessions are recorded for future reference.",
  "Applications must be submitted by the posted deadline.",
  "The position is available immediately.",
  "Interviews will be conducted the following week.",
];

const correctPool = [];
data.forEach(p => {
  (p.translation || []).forEach(item => {
    const c = item.options[item.correctIndex];
    if (c && c.length >= 20) correctPool.push(c);
  });
});

const fullPool = [...new Set([...correctPool, ...FALLBACK_SENTENCES])];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDistractors(correct, currentOpts, count = 3) {
  const existing = new Set(currentOpts);
  const candidates = shuffle(
    fullPool.filter(s => {
      if (s === correct || existing.has(s)) return false;
      // Similar length: within 2x range
      const lo = correct.length * 0.4;
      const hi = correct.length * 2.5;
      return s.length >= Math.max(lo, 20) && s.length <= Math.max(hi, 80);
    })
  );
  return candidates.slice(0, count);
}

// ─── Apply fixes ──────────────────────────────────────────────────────────────
let fixedHeaders = 0, fixedDistractors = 0;

const HEADER_REGEX = /^(BẢN GHI|MEMO|THÔNG BÁO|PHIẾU|Gửi:|Đến:|Từ:|Ngày:|Danh sách|\[|THẢM)/i;

data.forEach(passage => {
  (passage.translation || []).forEach(item => {
    const correct = item.options[item.correctIndex];
    const viMatch = item.question.match(/"([^"]+)"/s);
    if (!viMatch) return;
    const viText = viMatch[1];

    // FIX 1: Strip headers from any prompt that starts with header pattern
    if (HEADER_REGEX.test(viText.trim())) {
      const best = bestSentence(viText);
      if (best && best.length >= 20) {
        item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${best}"`;
        fixedHeaders++;
      }
    }

    // FIX 2: Distractors too short relative to correct answer
    const correctLen = correct.length;
    const minDistLen = Math.max(20, correctLen * 0.4);
    let needsFix = false;
    item.options.forEach((opt, i) => {
      if (i !== item.correctIndex && opt.length < minDistLen) needsFix = true;
    });

    if (needsFix) {
      const goodDist = getDistractors(correct, [correct], 3);
      if (goodDist.length >= 2) {
        let distIdx = 0;
        item.options = item.options.map((opt, i) => {
          if (i === item.correctIndex) return opt;
          if (opt.length < minDistLen) {
            fixedDistractors++;
            return goodDist[distIdx++ % goodDist.length];
          }
          return opt;
        });
        const newIdx = item.options.indexOf(correct);
        if (newIdx >= 0) item.correctIndex = newIdx;
      }
    }
  });
});

// ─── Re-balance correct answer distribution ───────────────────────────────────
const SECS = ["vocab", "paraphrase", "translation", "context"];
const allItems = [];
data.forEach(p => {
  SECS.forEach(sec => {
    (p[sec] || []).forEach((item, i) => allItems.push({ p, sec, i }));
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

// ─── Verify ───────────────────────────────────────────────────────────────────
let headerLeft = 0, shortRelativeLeft = 0, errors = 0;
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
    if (HEADER_REGEX.test(vi.trim())) headerLeft++;
    const correct = item.options[item.correctIndex];
    const minLen = Math.max(20, correct.length * 0.4);
    item.options.forEach((opt, i) => {
      if (i !== item.correctIndex && opt.length < minLen) shortRelativeLeft++;
    });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Translation Fix v3 Summary ===");
console.log(`Fixed: ${fixedHeaders} header prompts, ${fixedDistractors} short distractors`);
console.log(`Remaining: ${headerLeft} header prompts, ${shortRelativeLeft} short distractors`);
console.log(`Distribution (${total}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Errors: ${errors}`);
