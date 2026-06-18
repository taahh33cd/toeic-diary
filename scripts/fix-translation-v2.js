/**
 * Fix translation exercises v2 — comprehensive rewrite:
 * 1. Strip memo/email headers from Vietnamese prompts
 * 2. Split into sentences, pick the best single sentence
 * 3. If no clean sentence found, use the correct English answer to craft a reverse prompt
 * 4. Replace obviously-wrong distractors with proper sentence-length alternatives
 */
const fs = require("fs");
const FILE = "E:/toeic-dictation-master/data/reading-exercises-all.json";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ─── Header patterns to strip ─────────────────────────────────────────────
const HEADER_PATTERNS = [
  /^(BẢN GHI NHỚ|MEMO|THÔNG BÁO|PHIẾU[^:]*|BIÊN BẢN)\s*/i,
  /^(\[?(E-?mail|BẢNG|EMAIL)\]?\s*)/i,
  /^(Gửi|Đến|Từ|Ngày|Chủ đề|Tên|Email|Người yêu cầu|Ngày Nhập|Ngày Hạn|Loại|Tóm tắt|Kính gửi)[:\s][^\n.!?]*[.\s]*/gi,
  /^(To|From|Date|Subject|Re)[:\s][^\n.!?]*[.\s]*/gi,
  /^\[.*?\]\s*/g,
  /^Danh sách[^.!?]*\s*/i,
  /^(Dear|Xin chào|Kính gửi)[^.!?]*[.,]\s*/i,
  // Time/date headers like "Ngày 30 tháng 3 5:30 Chiều - 9:00 Tối"
  /^\d{1,2}[\s:]\d{2}\s*(Sáng|Chiều|Tối)\s*[-–]\s*\d{1,2}[\s:]\d{2}\s*(Sáng|Chiều|Tối)\s*/gi,
  // "Joanne Matos (11:45 Sáng):" chat format
  /^[A-ZÀ-Ỹ][a-zà-ỹ]+\s+[A-ZÀ-Ỹ][a-zà-ỹ]+\s*\([^)]+\):\s*/g,
];

function stripHeaders(text) {
  let result = text.trim();
  // Multiple passes since headers can be chained
  for (let pass = 0; pass < 5; pass++) {
    const before = result;
    for (const pattern of HEADER_PATTERNS) {
      // Reset lastIndex for global regexes
      if (pattern.global) pattern.lastIndex = 0;
      result = result.replace(pattern, "").trim();
    }
    if (result === before) break;
  }
  return result;
}

// ─── Sentence splitting ────────────────────────────────────────────────────
function splitVietnameseSentences(text) {
  // First strip headers
  const cleaned = stripHeaders(text);

  // Split on sentence-ending punctuation followed by space/capital
  // Also split on semicolons, bullet points, numbered items
  const sentences = cleaned
    .split(/(?<=[.!?])\s+|(?<=\.)\s*(?=[A-ZĐÀ-Ỹ])|[;]\s+|(?:&#\d+;\s*)|(?:\n\s*[-•]\s*)/)
    .map(s => s.replace(/^[\s\-•–—\d.)\]]+/, "").trim())
    .filter(s => s.length >= 20 && s.length <= 150)
    // Exclude header-like fragments
    .filter(s => !s.match(/^(Gửi|Đến|Từ|Ngày|Chủ đề|To:|From:|Date:|Subject:|Người|Loại|Tóm tắt)/i))
    // Exclude list items that are just labels
    .filter(s => !s.match(/^(Bao gồm|Cập nhật|Thảm|Cột)/i))
    // Must contain at least one verb-like word (not just a title/label)
    .filter(s => s.includes(" "));

  return sentences;
}

// ─── Build global distractor pool ──────────────────────────────────────────
// Collect ALL correct answers as potential distractors for other items
const globalCorrectPool = [];
data.forEach(p => {
  (p.translation || []).forEach(item => {
    const correct = item.options[item.correctIndex];
    if (correct && correct.length >= 30 && correct.length <= 200) {
      globalCorrectPool.push(correct);
    }
  });
});

// High-quality generic TOEIC-style English sentences
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
];

const fullPool = [...new Set([...globalCorrectPool, ...FALLBACK_SENTENCES])];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getGoodDistractors(correct, currentOptions, count = 3) {
  const existing = new Set(currentOptions);
  const candidates = shuffle(
    fullPool.filter(s =>
      s !== correct &&
      !existing.has(s) &&
      s.length >= 25 &&
      // Similar length to correct (within 80% range)
      Math.abs(s.length - correct.length) < Math.max(correct.length * 0.8, 40)
    )
  );
  return candidates.slice(0, count);
}

// ─── Process each translation item ─────────────────────────────────────────
let fixedPrompts = 0, fixedDistractors = 0, unfixable = 0;

data.forEach(passage => {
  (passage.translation || []).forEach(item => {
    const correct = item.options[item.correctIndex];
    const viMatch = item.question.match(/"([^"]+)"/s);
    if (!viMatch) return;

    const viText = viMatch[1];

    // FIX 1: Long or header-containing Vietnamese prompts
    if (viText.length > 120 || viText.match(/^(BẢN GHI|MEMO|THÔNG BÁO|PHIẾU|Gửi:|Đến:|Từ:|Ngày:|Danh sách|\[)/i)) {
      const sentences = splitVietnameseSentences(viText);

      if (sentences.length > 0) {
        // Pick the sentence closest in meaning-length to the correct answer
        // Prefer sentences that are 60-120 chars (ideal for a single translation prompt)
        const scored = sentences.map(s => {
          let score = 0;
          // Prefer 40-120 char range
          if (s.length >= 40 && s.length <= 120) score += 10;
          // Penalize very short or very long
          if (s.length < 30) score -= 5;
          if (s.length > 130) score -= 3;
          // Bonus for containing action verbs (more translatable)
          if (s.match(/(sẽ|đã|đang|phải|cần|có thể|nên|hãy|xin|vui lòng)/i)) score += 5;
          // Bonus for complete sentence feel (ends with period)
          if (s.match(/[.!?]$/)) score += 3;
          // Length similarity to correct English
          const lenRatio = s.length / (correct.length * 1.2); // Vietnamese is ~1.2x longer
          if (lenRatio > 0.5 && lenRatio < 2.0) score += 5;
          return { s, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const bestSent = scored[0].s;

        item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${bestSent}"`;
        fixedPrompts++;
      } else {
        // Can't split — try to just take the first 120 chars ending at a word boundary
        const truncated = viText.substring(0, 120).replace(/\s+\S*$/, "").trim();
        if (truncated.length >= 30) {
          item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${truncated}..."`;
          fixedPrompts++;
        } else {
          unfixable++;
        }
      }
    }

    // FIX 2: Bad distractors (too short, too long, or generic)
    const correctLen = correct.length;
    let needsDistractorFix = false;

    item.options.forEach((opt, i) => {
      if (i === item.correctIndex) return;
      if (
        opt.length < 25 ||                                    // too short
        opt.length > correctLen * 3 ||                         // way too long
        opt.includes("not mentioned") ||                       // generic
        opt.includes("does not provide") ||                    // generic
        opt.includes("This is not") ||                         // generic
        (opt.length < correctLen * 0.3 && correctLen > 30)     // suspiciously short
      ) {
        needsDistractorFix = true;
      }
    });

    if (needsDistractorFix) {
      const goodDist = getGoodDistractors(correct, [correct], 3);
      if (goodDist.length >= 3) {
        let distIdx = 0;
        item.options = item.options.map((opt, i) => {
          if (i === item.correctIndex) return opt;
          if (
            opt.length < 25 ||
            opt.length > correctLen * 3 ||
            opt.includes("not mentioned") ||
            opt.includes("does not provide") ||
            opt.includes("This is not") ||
            (opt.length < correctLen * 0.3 && correctLen > 30)
          ) {
            fixedDistractors++;
            return goodDist[distIdx++ % goodDist.length];
          }
          return opt;
        });

        // Re-verify correctIndex
        const newIdx = item.options.indexOf(correct);
        if (newIdx >= 0) item.correctIndex = newIdx;
      }
    }
  });
});

// ─── Re-shuffle correct answer positions ────────────────────────────────────
const SECS = ["vocab", "paraphrase", "translation", "context"];
const allItems = [];
data.forEach(p => {
  SECS.forEach(sec => {
    (p[sec] || []).forEach((item, i) => {
      allItems.push({ p, sec, i });
    });
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

// ─── Final verification ────────────────────────────────────────────────────
let longLeft = 0, shortLeft = 0, genericLeft = 0, errors = 0;
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
    if (vi.length > 150) longLeft++;

    const correct = item.options[item.correctIndex];
    item.options.forEach((opt, i) => {
      if (i === item.correctIndex) return;
      if (opt.length < 25) shortLeft++;
      if (opt.includes("not mentioned") || opt.includes("does not provide")) genericLeft++;
    });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Translation Fix v2 Summary ===");
console.log(`Fixed: ${fixedPrompts} prompts, ${fixedDistractors} distractors`);
console.log(`Unfixable: ${unfixable}`);
console.log(`Remaining: ${longLeft} long (>150), ${shortLeft} short distractors, ${genericLeft} generic distractors`);
console.log(`Distribution (${total} items): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Errors: ${errors}`);
