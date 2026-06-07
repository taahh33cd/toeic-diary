/**
 * Comprehensive exercise fix v2:
 * 1. PARAPHRASE: Rebuild distractors — no single words, no originals, no ellipsis
 * 2. TRANSLATION: Fix 13 items where correct answer is a paraphrase phrase (leaked)
 * 3. CONTEXT: Replace meta-text options (reading strategy tips from other passages)
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
function isVN(s) {
  return /[àáạảãăắặẩẫâầấậđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/u.test(s);
}
function isGoodPhrase(s) {
  if (!s) return false;
  const trimmed = s.trim();
  if (trimmed.length < 4) return false;            // too short
  if (!trimmed.includes(" ")) return false;         // single word
  if (trimmed.endsWith("...")) return false;        // ellipsis/truncated
  if (trimmed.includes("[")) return false;          // bracket markers
  if (isVN(trimmed)) return false;                  // Vietnamese
  return true;
}

// ─── PHASE 1: PARAPHRASE — clean distractor pool ─────────────────────────────
// Global cross-passage pool from ALL paraphrase corrects
const globalParaPool = shuffle([...new Set(
  data.flatMap((p) =>
    (p.paraphrase || []).map((item) => item.options[item.correctIndex])
  ).filter(isGoodPhrase)
)]);

let paraFixed = 0;

data.forEach((passage) => {
  if (!passage.paraphrase || passage.paraphrase.length === 0) return;

  // All originals in this passage (to exclude from distractors)
  const originals = new Set(
    passage.paraphrase.map((item) => {
      const m = item.question.match(/"([^"]+)"/);
      return m ? m[1].trim() : "";
    })
  );
  // Strip ellipsis variants too
  originals.forEach((o) => { if (o.endsWith("...")) originals.add(o.slice(0, -3)); });

  // All corrects in this passage
  const passageCorrects = passage.paraphrase.map((item) => item.options[item.correctIndex]);

  passage.paraphrase.forEach((item, ii) => {
    const orig = [...originals][ii] || "";
    const correct = item.options[item.correctIndex];

    // Check: are there any bad distractors (single word / ellipsis / orig-as-dist)?
    const hasBad = item.options.some((opt, oi) => {
      if (oi === item.correctIndex) return false;
      return !isGoodPhrase(opt) || originals.has(opt) || opt === orig;
    });
    if (!hasBad) return;

    // Build candidate pool:
    // 1. Corrects of OTHER items in this passage
    const samePassageCands = passageCorrects.filter(
      (c) => c !== correct && !originals.has(c) && isGoodPhrase(c)
    );

    // 2. Global cross-passage pool (excluding anything from THIS passage)
    const allPassageStrings = new Set([...originals, ...passageCorrects]);
    const globalCands = globalParaPool.filter(
      (s) => !allPassageStrings.has(s) && s !== correct && s !== orig && isGoodPhrase(s)
    );

    // Combine: prefer same-passage, then global
    const combined = [...samePassageCands, ...globalCands];
    const used = new Set([orig, correct, ...originals]);

    // Keep existing good distractors first
    const goodExisting = item.options.filter((opt, oi) => {
      if (oi === item.correctIndex) return false;
      return isGoodPhrase(opt) && !originals.has(opt) && !used.has(opt);
    });
    goodExisting.forEach((g) => used.add(g));

    const newDists = [...goodExisting];
    for (const c of combined) {
      if (newDists.length >= 3) break;
      if (!used.has(c)) {
        newDists.push(c);
        used.add(c);
        paraFixed++;
      }
    }

    if (newDists.length < 3) return; // skip if can't fill (shouldn't happen)

    item.options = shuffle([correct, ...newDists.slice(0, 3)]);
    item.correctIndex = item.options.indexOf(correct);
  });
});

// ─── PHASE 2: TRANSLATION — fix 13 leaked correct answers ────────────────────
const TRANS_FIXES = {
  "10:1": {
    vi: "Theo hồ sơ của chúng tôi, ông đã nhận chiếc xe thuê của mình vào ngày 1 tháng 3 năm ngoái.",
    en: "According to our records, you picked up your rental car on March 1 of last year.",
  },
  "11:1": {
    vi: "Tôi có bằng quản trị kinh doanh và xin đính kèm sơ yếu lý lịch vì tôi nghĩ mình rất phù hợp với nhu cầu của ông.",
    en: "I have a degree in business administration and am enclosing my résumé, as I believe I am an excellent fit for your needs.",
  },
  "31:0": {
    vi: "Cô Li đã được bổ nhiệm làm giám đốc lâm thời của Nhà hát Itami.",
    en: "Ms. Li has been appointed as the interim director of Itami Theatre.",
  },
  "33:0": {
    vi: "Hãy tận dụng đợt xả hàng mùa xuân của chúng tôi!",
    en: "Take advantage of our spring clearance sale!",
  },
  "39:2": {
    vi: "Đồ nội thất phòng thí nghiệm của chúng tôi có sẵn với nhiều kích thước và cấu hình đa dạng để phù hợp với nhu cầu của bạn.",
    en: "Our laboratory furniture is available in a wide variety of sizes and configurations to suit your needs.",
  },
  "44:0": {
    vi: "Tôi đang trên đường đi nhưng bị muộn do đóng một làn đường trên Đại lộ Roseway.",
    en: "I am on my way, but I am running late due to a lane closure on Roseway Boulevard.",
  },
  "50:1": {
    vi: "Cô báo cáo rằng dòng sản phẩm trà thảo mộc mới của chúng ta sẽ sớm có mặt trên kệ các cửa hàng địa phương.",
    en: "She reported that our new herbal tea product line will soon be available on the shelves of local stores.",
  },
  "56:2": {
    vi: "Ứng viên nên gửi email thư bày tỏ nguyện vọng và sơ yếu lý lịch đến pip@hjp.co.uk trước ngày 31 tháng 3.",
    en: "Candidates should e-mail a statement of interest and résumé to pip@hjp.co.uk by 31 March.",
  },
  "58:0": {
    vi: "Hoàn thành và gửi biểu mẫu này để tạo số phiếu hỗ trợ.",
    en: "Complete and submit this form to create a support ticket.",
  },
  "58:1": {
    vi: "Chúng tôi sẽ gửi email trả lời bạn trong vòng 24 giờ.",
    en: "We will reply to you by e-mail within 24 hours.",
  },
  "59:0": {
    vi: "Vos Communications, Inc. đang tìm kiếm các ứng viên có trình độ cho một số vị trí đang tuyển dụng.",
    en: "Vos Communications, Inc. is currently seeking qualified candidates for several open positions.",
  },
  "62:1": {
    vi: "Trong các phiên bản trước của trò chơi, việc tạo ra sự phản chiếu và ánh sáng chuẩn xác ở các khu vực màu xanh lá cây và xanh biển là rất khó.",
    en: "In previous versions of the game, creating accurate reflections and lighting in the green and blue areas was very challenging.",
  },
  "63:0": {
    vi: "Công ty luật Thompson and Groves đang tìm kiếm một trợ lý tận tụy để gia nhập nhóm tranh tụng môi trường của họ.",
    en: "Thompson and Groves Law Firm is seeking a dedicated assistant to join their environmental litigation team.",
  },
};

const GOOD_TRANS_DISTS = [
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
  "Candidates are encouraged to submit their applications as soon as possible.",
  "The office will be open for extended hours during the holiday season.",
  "Please review the attached document and provide your feedback by Wednesday.",
  "The warranty covers all manufacturing defects for a period of two years.",
  "Applicants should include a cover letter along with their résumé.",
  "Free parking will be available for all attendees during the event.",
  "The management team has approved the proposed budget for next year.",
  "Participants must register online in advance to secure a place.",
];

let transFixed = 0;
Object.entries(TRANS_FIXES).forEach(([key, { vi, en }]) => {
  const [pi, ii] = key.split(":").map(Number);
  const item = data[pi] && data[pi].translation && data[pi].translation[ii];
  if (!item) { console.warn("MISSING:", key); return; }

  const dists = shuffle(GOOD_TRANS_DISTS.filter((s) => s !== en)).slice(0, 3);
  const newOpts = shuffle([en, ...dists]);
  item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${vi}"`;
  item.options = newOpts;
  item.correctIndex = newOpts.indexOf(en);
  item.feedback = `Bản dịch: "${en}"`;
  transFixed++;
});

// ─── PHASE 3: CONTEXT — replace meta-text options ────────────────────────────
// Meta-text patterns (reading strategy tips that don't belong as answers)
const META_RE = /Đây là câu hỏi|Đọc hiểu|Liên kết thông tin|Câu hỏi mục đích|Kỹ năng Đọc hiểu|Dạng câu hỏi/;

// Good generic wrong answers for context items (Vietnamese, plausible but wrong)
const CONTEXT_FALLBACKS = [
  "Điều này không ảnh hưởng đến kết quả trong bối cảnh được mô tả.",
  "Chỉ có các chuyên gia được đào tạo chuyên sâu mới có thể áp dụng kiến thức này.",
  "Kinh nghiệm thực tế ít quan trọng hơn kiến thức lý thuyết trong lĩnh vực này.",
  "Điều này phụ thuộc hoàn toàn vào từng cá nhân và không có quy tắc chung nào áp dụng được.",
  "Phương pháp truyền thống vẫn hiệu quả hơn so với các tiếp cận hiện đại trong trường hợp này.",
  "Chi phí triển khai thường là yếu tố quyết định duy nhất trong tình huống này.",
  "Việc áp dụng công nghệ mới thường tạo ra nhiều vấn đề hơn là giải quyết chúng.",
  "Ưu tiên hàng đầu là giảm thiểu chi phí ngắn hạn, bất kể tác động dài hạn.",
  "Mối quan hệ cá nhân không đóng vai trò quan trọng trong môi trường kinh doanh chuyên nghiệp.",
  "Sự thay đổi chính sách thường không được thông báo trước cho các bên liên quan.",
];

// Special full reconstruction for pi:56 ii:0 (all options are meta-text)
{
  const item = data[56].context[0];
  item.question = "Trong lĩnh vực tuyển dụng thực tập sinh kỹ thuật, điều nào sau đây thường được nhà tuyển dụng đánh giá cao nhất?";
  item.options = [
    "Bằng cấp từ trường đại học danh tiếng quan trọng hơn kinh nghiệm thực tế hoặc kỹ năng mềm.",
    "Việc liên hệ trực tiếp với nhà tuyển dụng qua điện thoại sẽ tạo ấn tượng tốt hơn nộp đơn trực tuyến.",
    "Nhà tuyển dụng chỉ xét đơn từ ứng viên đã có kinh nghiệm làm việc trước đó trong ngành.",
    "Hồ sơ rõ ràng, nộp đúng hạn và thể hiện sự quan tâm thực sự đến lĩnh vực của công ty.",
  ];
  item.correctIndex = 3;
  item.feedback = "Nhà tuyển dụng thực tập luôn đánh giá cao hồ sơ đầy đủ, đúng hạn và thể hiện sự tìm hiểu về công ty.";
}

// For pi:17 ii:0 — correct answer itself is meta-text; reconstruct
{
  const item = data[17].context[0];
  // passage is Bài 18 — NOTICE/MEMO about financial results
  item.question = "Khi một công ty thông báo kết quả tài chính tốt nhất trong nhiều năm, điều này thường cho thấy điều gì?";
  item.options = [
    "Công ty đã cắt giảm nhân sự đáng kể để đạt được lợi nhuận cao hơn.",
    "Kết quả này là nhờ may mắn và không phản ánh hiệu quả hoạt động thực sự.",
    "Công ty đang trên đà phát triển ổn định và có thể đang mở rộng quy mô hoặc ra mắt sản phẩm mới.",
    "Các con số tài chính tốt luôn kéo theo sự gia tăng đột biến về số lượng nhân viên.",
  ];
  item.correctIndex = 2;
  item.feedback = "Kết quả tài chính tốt nhất trong nhiều năm thường phản ánh chiến lược kinh doanh hiệu quả và tăng trưởng bền vững.";
}

let ctxFixed = 0;
data.forEach((passage, pi) => {
  (passage.context || []).forEach((item) => {
    const used = new Set(item.options.map((o) => o.trim()));
    item.options = item.options.map((opt, oi) => {
      if (!META_RE.test(opt)) return opt;
      // Find a fallback not already used
      const replacement = CONTEXT_FALLBACKS.find((f) => !used.has(f));
      if (!replacement) return opt;
      used.delete(opt);
      used.add(replacement);
      ctxFixed++;
      return replacement;
    });
  });
});

// ─── Re-balance correctIndex ──────────────────────────────────────────────────
const SECS = ["vocab", "paraphrase", "translation", "context"];
const allItems = [];
data.forEach((p) => SECS.forEach((sec) => (p[sec] || []).forEach((it, i) => allItems.push({ p, sec, i }))));
const order = shuffle(allItems.map((_, i) => i));
order.forEach((origIdx, rank) => {
  const { p, sec, i } = allItems[origIdx];
  const item = p[sec][i];
  if (!item || !item.options) return;
  const correct = item.options[item.correctIndex];
  if (!correct) return;
  const targetPos = rank % 4;
  const others = shuffle(item.options.filter((_, j) => j !== item.correctIndex));
  if (others.length < 3) return;
  const newOpts = [...others];
  newOpts.splice(targetPos, 0, correct);
  item.options = newOpts;
  item.correctIndex = targetPos;
});

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");

// ─── Verification ─────────────────────────────────────────────────────────────
const META_PATTERNS = ["Đây là câu hỏi", "Đọc hiểu kết nối", "Liên kết thông tin", "Câu hỏi mục đích", "Kỹ năng Đọc hiểu", "Dạng câu hỏi"];
let singleWord = 0, origAsDist = 0, transLeak = 0, metaLeft = 0, errors = 0;
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };

data.forEach((p, pi) => {
  SECS.forEach((sec) => {
    (p[sec] || []).forEach((item) => {
      if (!item.options || item.correctIndex === undefined) { errors++; return; }
      dist[item.correctIndex]++;
      if (item.correctIndex < 0 || item.correctIndex >= item.options.length) errors++;
    });
  });

  const originals = new Set(
    (p.paraphrase || []).map((item) => {
      const m = item.question.match(/"([^"]+)"/);
      return m ? m[1].trim() : "";
    })
  );
  originals.forEach((o) => { if (o.endsWith("...")) originals.add(o.slice(0, -3)); });

  (p.paraphrase || []).forEach((item) => {
    item.options.forEach((o, oi) => {
      if (oi === item.correctIndex) return;
      if (!o.includes(" ")) singleWord++;
      if (originals.has(o)) origAsDist++;
    });
  });

  const paraSet = new Set(
    (p.paraphrase || []).flatMap((item) => {
      const m = item.question.match(/"([^"]+)"/);
      return [...item.options, m ? m[1].trim() : ""];
    })
  );
  (p.translation || []).forEach((item) => {
    if (paraSet.has(item.options[item.correctIndex])) transLeak++;
  });

  (p.context || []).forEach((item) => {
    item.options.forEach((o) => {
      if (META_PATTERNS.some((mp) => o.includes(mp))) metaLeft++;
    });
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Fix v2 Summary ===");
console.log(`Paraphrase: fixed ${paraFixed} bad distractors`);
console.log(`Translation: fixed ${transFixed} leaked correct answers`);
console.log(`Context: fixed ${ctxFixed} meta-text options`);
console.log();
console.log(`Remaining — singleWord: ${singleWord}, origAsDist: ${origAsDist}, transLeak: ${transLeak}, metaLeft: ${metaLeft}, errors: ${errors}`);
console.log(`Distribution (${total}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
if (singleWord === 0 && origAsDist === 0 && transLeak === 0 && metaLeft === 0 && errors === 0) {
  console.log("ALL CLEAN.");
}
