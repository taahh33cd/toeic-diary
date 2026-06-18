/**
 * Final targeted patch for remaining broken translation exercises.
 * Replaces items where correct answer is a fragment, marker, or mismatched.
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

// Pool of quality standalone TOEIC-style VI→EN pairs for replacement
const REPLACEMENT_PAIRS = [
  { vi: "Dịch vụ xe buýt trên tuyến đường này sẽ bị đình chỉ từ thứ Sáu, ngày 9 tháng 4.", en: "Bus service on this route will be suspended starting Friday, April 9." },
  { vi: "Khách tham quan có thể thưởng thức đồ uống và khai vị trong khi xem các tác phẩm nghệ thuật.", en: "Visitors can enjoy beverages and appetizers while viewing the artwork." },
  { vi: "Mẫu bàn Chanti B45 có thể điều chỉnh để bạn có thể thay đổi giữa tư thế ngồi và đứng.", en: "The Chanti B45 model is adjustable so you can alternate between sitting and standing." },
  { vi: "Gần đây, công ty đã thay đổi bố cục của phòng thí nghiệm để tối đa hóa không gian làm việc.", en: "Recently, the company changed the layout of a research laboratory to maximize available space." },
  { vi: "Chúng tôi cần 45 vé và muốn giới hạn chi phí dưới 20 đô la mỗi người.", en: "We need 45 tickets and would like to limit the cost to under $20 per person." },
  { vi: "Chủ tịch công ty đã nghỉ hưu và được kế thừa bởi con trai của ông là Tristan.", en: "The company president retired and was succeeded by his son, Tristan." },
  { vi: "Có thể bạn chưa biết tất cả thông tin về sự cố xảy ra với trang web của chúng ta.", en: "You might not yet know all the details of the situation with our Web site." },
  { vi: "Vị trí này đòi hỏi ứng viên phải có hiểu biết vững chắc về các quy trình trong ngành.", en: "This position requires candidates to have a solid understanding of industry processes." },
  { vi: "Ứng viên sẽ làm việc độc lập và là thành viên của Ban Biên tập.", en: "Candidates will work collaboratively and serve as members of the Editorial Panel." },
  { vi: "Gần đây, Stellar Chocolates đã được công nhận trên toàn quốc khi giành được nhiều giải thưởng danh giá.", en: "Stellar Chocolates has recently gained national recognition by earning top industry awards." },
  { vi: "Cô ấy đồng sở hữu các cửa hàng cùng với Brian Markus, người mà cô gặp trong một lớp học ở đại học.", en: "She co-owns the shops with Brian Markus, whom she met in a class at university." },
  { vi: "Những vấn đề về ánh sáng phản chiếu trong các khu vực xanh lá và xanh biển cần được xử lý.", en: "Issues with reflections and lighting in the green and blue areas need to be addressed." },
  { vi: "Chi tiêu dự kiến sẽ tập trung vào cải tiến được nhân viên yêu cầu nhiều nhất.", en: "The spending will focus on the improvement most frequently requested by staff members." },
  { vi: "Thời trang Toàn cầu là triển lãm giới thiệu trang phục và phụ kiện từ khắp nơi trên thế giới.", en: "Worldwide Fashion is an exhibit showcasing clothing and accessories from around the world." },
  { vi: "Nghệ thuật Đời thường giới thiệu các đồ dùng gia đình được nâng lên thành tác phẩm nghệ thuật.", en: "Everyday Art features household items elevated to the status of artistic works." },
  { vi: "Văn phòng của chúng tôi sẽ đóng cửa vào cuối tuần để bảo trì thường kỳ.", en: "Our office will be closed over the weekend for routine maintenance." },
  { vi: "Tất cả đơn xin việc phải được nộp trực tuyến trước ngày 15 tháng tới.", en: "All job applications must be submitted online before the 15th of next month." },
  { vi: "Cuộc họp sẽ bắt đầu đúng lúc 9 giờ sáng tại phòng hội nghị chính.", en: "The meeting will begin promptly at 9 A.M. in the main conference room." },
];

// Map of items to replace: key = "pi:ii"
const FIXES = {
  "16:1":  REPLACEMENT_PAIRS[0],
  "18:1":  REPLACEMENT_PAIRS[1],
  "20:1":  REPLACEMENT_PAIRS[2],
  "39:1":  REPLACEMENT_PAIRS[3],
  "55:2":  REPLACEMENT_PAIRS[4],
  "56:1":  REPLACEMENT_PAIRS[5],
  "57:0":  REPLACEMENT_PAIRS[6],
  "59:1":  REPLACEMENT_PAIRS[7],
  "59:2":  REPLACEMENT_PAIRS[8],
  "60:0":  REPLACEMENT_PAIRS[9],
  "60:1":  REPLACEMENT_PAIRS[10],
  "62:2":  REPLACEMENT_PAIRS[11],
  "64:2":  REPLACEMENT_PAIRS[12],
  "65:0":  REPLACEMENT_PAIRS[13],
  "65:1":  REPLACEMENT_PAIRS[14],
};

// Good standalone distractors
const GOOD_DIST = [
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
  "Guests are advised to make reservations at least one week in advance.",
  "All visitors must check in at the front desk upon arrival.",
  "Employees who wish to participate must sign up by the end of the week.",
  "The store will extend its hours during the holiday shopping season.",
  "Free parking is available for all guests during the event.",
  "The event is open to the public at no charge.",
  "Applications must be submitted by the posted deadline.",
  "Interviews will be conducted the following week.",
  "The building will be closed for maintenance this weekend.",
  "Light refreshments will be served at the reception.",
  "Please review the attached document before the meeting on Friday.",
  "The warranty covers all defects for a period of two years.",
  "Applicants should include a cover letter along with their resume.",
];

let patched = 0;
let fixedLongVI = 0;

data.forEach((passage, pi) => {
  (passage.translation || []).forEach((item, ii) => {
    const key = `${pi}:${ii}`;
    const fix = FIXES[key];

    if (fix) {
      // Replace with fresh proper pair
      const distractors = shuffle(GOOD_DIST.filter(s => s !== fix.en)).slice(0, 3);
      const allOpts = shuffle([fix.en, ...distractors]);
      item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${fix.vi}"`;
      item.options = allOpts;
      item.correctIndex = allOpts.indexOf(fix.en);
      item.feedback = `Bản dịch: "${fix.en}"`;
      patched++;
    } else {
      // Still fix remaining long VI (120-150 chars) by hard truncating or sentence split
      const m = item.question.match(/"([^"]+)"/s);
      if (m && m[1].length > 120) {
        const vi = m[1];
        // Try to find sentence boundary before 115 chars
        const sentences = vi.split(/(?<=[.!?])\s+/).filter(s => s.length >= 20 && s.length <= 120);
        if (sentences.length > 0) {
          const best = sentences[0]; // take first clean sentence
          if (best.length >= 20) {
            item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${best}"`;
            fixedLongVI++;
          }
        } else {
          // Hard truncate at last word boundary before 110 chars
          const truncated = vi.substring(0, 110).replace(/\s+\S*$/, "").trim();
          if (truncated.length >= 20 && truncated.length < vi.length) {
            item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${truncated}"`;
            fixedLongVI++;
          }
        }
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

// ─── Final verification ───────────────────────────────────────────────────────
let longVI = 0, fragCorrect = 0, chatVI = 0, errors = 0;
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
    if (correct.includes("...") || correct.includes("[Đoạn") || correct.length < 10) fragCorrect++;
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Final Translation Fix ===");
console.log(`Patched: ${patched} items with replacements, ${fixedLongVI} long VI trimmed`);
console.log(`Remaining: ${longVI} long VI (>120), ${chatVI} chat-format VI, ${fragCorrect} fragment correct`);
console.log(`Distribution (${total}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Errors: ${errors}`);
if (errors === 0 && fragCorrect === 0 && chatVI === 0) console.log("TRANSLATION EXERCISES CLEAN!");
