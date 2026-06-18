/**
 * Comprehensive translation exercise cleanup v4:
 * 1. Strip chat "Name (time):" prefix from VI prompts
 * 2. Clean correct answers: strip [Đoạn X]:, trim at "...", strip dialogue "->" format
 * 3. Trim long VI prompts (120-150 chars) to best sentence
 * 4. Ensure distractor lengths are proportional
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

// ─── Clean Vietnamese prompt ─────────────────────────────────────────────────
function cleanViPrompt(vi) {
  let result = vi.trim();

  // Strip chat format: "Name Name (HH:MM Sáng/Chiều): message"
  result = result.replace(/^[A-Za-zÀ-Ỹà-ỹ\s]+\(\d{1,2}:\d{2}\s*(Sáng|Chiều|Tối)\):\s*/u, "");

  // Strip "Kính gửi X," salutation at start
  result = result.replace(/^(Kính gửi|Dear)\s+[^,]+,\s*/i, "");

  // Strip company/page title headers (ALL CAPS or title case before first sentence)
  // e.g., "STAR DESIGNS Kính gửi quý khách hàng: ..."
  result = result.replace(/^[A-ZĐÀÁẠẢÃÂẦẮẶẨẪĂẺẸẼÊỀẾỆỂỄỈỊỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ\s&]{5,}\s+/u, "").trim();

  // Strip "Biên bản Cuộc họp—..." header
  result = result.replace(/^Biên bản[^.!?]{0,40}[—\-]\s*/i, "").trim();

  // Strip attendee list "Người tham dự: A, B, C ..."
  result = result.replace(/^Người tham dự:[^.!?]+[.!?]?\s*/i, "").trim();

  // Strip leading list markers
  result = result.replace(/^[•\-–—\d.)\s]+/, "").trim();

  return result;
}

// ─── Split to best single sentence ───────────────────────────────────────────
function bestSingleSentence(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 20 && s.length <= 130)
    .filter(s => !s.match(/^(Gửi|Đến|Từ|Ngày|Chủ đề|BẢN GHI|MEMO|PHIẾU|\[|và -)/i))
    .filter(s => s.includes(" "));

  if (sentences.length === 0) return null;

  const scored = sentences.map(s => {
    let score = 0;
    if (s.length >= 35 && s.length <= 110) score += 10;
    if (s.match(/(sẽ|đã|đang|phải|cần|có thể|nên|hãy|xin|vui lòng|được)/i)) score += 5;
    if (s.match(/[.!?]$/)) score += 3;
    if (!s.match(/^(và|hoặc|nhưng|tuy nhiên)/i)) score += 2;
    return { s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].s;
}

// ─── Clean English correct answer ────────────────────────────────────────────
function cleanCorrect(correct) {
  if (!correct) return correct;
  let c = correct.trim();

  // Strip "[Đoạn X]:" prefix
  c = c.replace(/^\[(Đoạn|Section|Para)\s*\d+\][:.]?\s*/gi, "");
  // Strip "[X]" annotation patterns like "[3] text [3]"
  c = c.replace(/\[\d+\]\s*/g, "");
  // Strip "Name: text -> Name2: text" dialogue — take only the first person's text
  c = c.replace(/\s*->\s*.+$/, "").trim();
  // Remove trailing "..."
  c = c.replace(/\.\.\.$/, "").trim();
  // Remove leading "..."
  c = c.replace(/^\.{2,}\s*/, "").trim();
  // Trim at "..." mid-sentence and close it
  if (c.includes("...")) {
    const beforeEllipsis = c.split("...")[0].trim();
    if (beforeEllipsis.length >= 20) c = beforeEllipsis;
  }
  // Remove speaker attribution "Stanley: text" format
  c = c.replace(/^[A-Z][a-z]+:\s+/, "");

  return c.trim();
}

// ─── Distractor pool ──────────────────────────────────────────────────────────
const FALLBACK = [
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
  "All staff members are encouraged to attend the annual team-building event.",
  "The updated schedule will be posted on the company intranet by Friday.",
  "Please review the attached document and provide your feedback by Wednesday.",
  "Guests are advised to make reservations at least one week in advance.",
  "The warranty covers all manufacturing defects for a period of two years.",
  "Applicants should include a cover letter along with their resume.",
  "The training session will be held in the main conference room.",
  "All visitors must check in at the front desk upon arrival.",
  "Maintenance workers will begin repairing the elevator on Monday morning.",
  "Free parking is available for all guests during the event.",
  "The event is open to the public at no charge.",
  "No experience is required to apply for this position.",
  "Light refreshments will be served at the reception.",
  "The discount applies to all items currently in stock.",
  "Participants must register online in advance to secure a spot.",
  "Applications must be submitted by the posted deadline.",
  "Interviews will be conducted the following week.",
  "The building will be closed for maintenance this weekend.",
  "Employees who wish to participate must sign up by Friday.",
  "The store will extend its hours during the holiday season.",
];

function getDistractors(correct, existing, count = 3) {
  const pool = [...new Set([...data.flatMap(p =>
    (p.translation || []).map(it => it.options[it.correctIndex]).filter(s => s && s.length >= 20 && !s.includes("...") && !s.includes("["))
  ), ...FALLBACK])];
  const taken = new Set([correct, ...existing]);
  const cLen = correct.length;
  const candidates = shuffle(pool.filter(s => {
    if (taken.has(s)) return false;
    const lo = Math.max(20, cLen * 0.35);
    const hi = Math.max(80, cLen * 2.5);
    return s.length >= lo && s.length <= hi;
  }));
  return candidates.slice(0, count);
}

// ─── Apply all fixes ─────────────────────────────────────────────────────────
let fixedVI = 0, fixedEN = 0, fixedDist = 0;

data.forEach(passage => {
  (passage.translation || []).forEach(item => {
    const viMatch = item.question.match(/"([^"]+)"/s);
    if (!viMatch) return;
    const viRaw = viMatch[1];

    // Fix VI prompt
    let viCleaned = cleanViPrompt(viRaw);
    if (viCleaned.length > 120) {
      const best = bestSingleSentence(viCleaned);
      if (best) viCleaned = best;
      else viCleaned = viCleaned.substring(0, 115).replace(/\s+\S*$/, "").trim();
    }
    if (viCleaned !== viRaw && viCleaned.length >= 15) {
      item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${viCleaned}"`;
      fixedVI++;
    }

    // Fix correct answer
    const oldCorrect = item.options[item.correctIndex];
    const newCorrect = cleanCorrect(oldCorrect);
    if (newCorrect !== oldCorrect && newCorrect.length >= 10) {
      item.options[item.correctIndex] = newCorrect;
      item.feedback = `Bản dịch: "${newCorrect}"`;
      fixedEN++;
    }

    // Fix distractors: replace any that are obviously bad
    const correct = item.options[item.correctIndex];
    const minLen = Math.max(18, correct.length * 0.35);
    let needsDist = false;
    item.options.forEach((opt, i) => {
      if (i === item.correctIndex) return;
      if (opt.length < minLen || opt.includes("...") || opt.includes("[Đoạn") || opt.includes("->") || opt.match(/^\[/) || opt.startsWith("[") || opt.length > correct.length * 3) {
        needsDist = true;
      }
    });
    if (needsDist) {
      const good = getDistractors(correct, [correct], 3);
      if (good.length >= 2) {
        let di = 0;
        item.options = item.options.map((opt, i) => {
          if (i === item.correctIndex) return opt;
          if (opt.length < minLen || opt.includes("...") || opt.includes("[Đoạn") || opt.includes("->") || opt.match(/^\[/) || opt.length > correct.length * 3) {
            fixedDist++;
            return good[di++ % good.length];
          }
          return opt;
        });
        const newIdx = item.options.indexOf(correct);
        if (newIdx >= 0) item.correctIndex = newIdx;
      }
    }
  });
});

// ─── Re-balance ───────────────────────────────────────────────────────────────
const SECS = ["vocab", "paraphrase", "translation", "context"];
const allItems = [];
data.forEach(p => SECS.forEach(sec => (p[sec] || []).forEach((it, i) => allItems.push({ p, sec, i }))));
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

// ─── Final audit ──────────────────────────────────────────────────────────────
let longVI = 0, fragCorrect = 0, chatVI = 0, shortDist = 0, errors = 0;
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
    if (vi.length > 120) longVI++;
    if (vi.match(/^[A-Za-zÀ-Ỹà-ỹ\s]+\(\d{1,2}:\d{2}/u)) chatVI++;
    const correct = item.options[item.correctIndex];
    if (correct.includes("...") || correct.includes("[Đoạn") || correct.includes("->")) fragCorrect++;
    const minLen = Math.max(18, correct.length * 0.35);
    item.options.forEach((opt, i) => { if (i !== item.correctIndex && opt.length < minLen) shortDist++; });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Translation Fix v4 ===");
console.log(`Fixed: ${fixedVI} VI prompts, ${fixedEN} correct answers, ${fixedDist} distractors`);
console.log(`Remaining: ${longVI} long VI, ${chatVI} chat-header VI, ${fragCorrect} fragment correct, ${shortDist} short dist`);
console.log(`Distribution (${total}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Errors: ${errors}`);
