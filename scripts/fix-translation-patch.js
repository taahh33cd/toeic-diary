/**
 * Surgical patch for the 14 remaining problematic translation exercises.
 * Sets proper Vietnamese sentences and cleans up malformed correct answers.
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

function setQ(pi, ii, newVi, newCorrect) {
  const item = data[pi].translation[ii];
  if (!item) { console.error(`Missing: pi=${pi} ii=${ii}`); return; }

  // Update the VI question prompt
  item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${newVi}"`;

  // Update correct answer text in options if provided
  if (newCorrect) {
    item.options[item.correctIndex] = newCorrect;
  }

  // Update feedback
  const correct = item.options[item.correctIndex];
  item.feedback = `Bản dịch: "${correct}"`;
}

// ─── Patch each of the 14 remaining cases ────────────────────────────────────

// pi:17 — Bài 18 — Sunlight Sugar memo
// correct: "following our strongest quarter in over three years" (fragment — clean it up)
setQ(17, 0,
  "Sau quý kinh doanh mạnh mẽ nhất trong hơn ba năm qua, chúng ta đã được xếp hạng là nhà phân phối đường lớn thứ hai trong khu vực.",
  "Following our strongest quarter in over three years, we have been ranked the second-largest sugar distributor in the region."
);

// pi:19 — Bài 20 — South Street Bank memo
// correct has "..." artifact — clean up
setQ(19, 0,
  "Ngân hàng chúng ta đang mở rộng và sẽ khai trương một chi nhánh tại Leesburg trong năm nay.",
  "Our bank is expanding and will therefore be opening a branch in Leesburg this year."
);

// pi:20 — Bài 21 — Standing desks memo
// correct has "..." artifact — clean up
setQ(20, 0,
  "Năm chiếc bàn làm việc đứng sẽ có sẵn để dùng thử — xin hãy thoải mái trải nghiệm chúng.",
  "Five standing desks will be available on a trial basis — please feel free to test them out."
);

// pi:21 — Bài 22 — Building 3 maintenance memo
// correct has "[3]" markers — clean up
setQ(21, 0,
  "Điều này sẽ giảm thiểu sự gián đoạn cho những nhân viên có văn phòng ở phía tây tòa nhà.",
  "This should minimize the disruption for those of you with offices on the west side of the building."
);

// pi:37 — Bài 38 — IT system update
// correct is a good sentence — just need a proper VI
setQ(37, 0,
  "Bạn phải lưu toàn bộ công việc và đăng xuất khỏi hệ thống trước khi rời đi vào cuối ngày.",
  null // keep existing correct
);

// pi:48 — Bài 49 — Welcome email checklist
// correct has "..." and HTML entities — replace entirely
setQ(48, 0,
  "Email chào mừng nhân viên mới cần bao gồm lời chào ấm áp, lịch đào tạo hằng ngày và tên của người hướng dẫn.",
  "A welcome e-mail checklist should include a warm greeting for new staff, the daily training schedule, and the name of their mentor."
);

// pi:52 — Bài 2 double — Management meeting email
// correct has "Mai Tran... wants to update everyone... She should" — clean up
setQ(52, 0,
  "Xin lưu ý rằng tôi đã bổ sung thêm một nội dung vào chương trình họp ban đầu.",
  "Please note that I have added an item to the original meeting agenda."
);

// pi:55 — Bài 5 double — Baseball evening email
// correct "Would you please set this up for June 28?" — good, need VI
setQ(55, 0,
  "Liệu bạn có thể sắp xếp sự kiện này vào ngày 28 tháng 6 không?",
  null // keep existing correct
);

// pi:56 — Bài 6 double — HJP Transport internship
// correct is a good sentence — need proper VI
setQ(56, 0,
  "Công ty đang tìm kiếm sinh viên đại học để điền vào mười vị trí thực tập trong chương trình thực tập Powell.",
  null // keep existing correct
);

// pi:61 — Bài 11 double — Work order voicemail
// correct is a good sentence — need proper VI
setQ(61, 0,
  "Tôi muốn yêu cầu gỡ bỏ các lớp bảo mật mới trên hộp thư thoại của tôi trong hệ thống điện thoại mới.",
  null // keep existing correct
);

// pi:62 — Bài 12 double — Lighting email
// correct "Project Manager" is completely wrong — replace with full-sentence pair
// Options: "He is a new employee at Rimerko Games.", "Project Manager", "It is Rimerko's most challenging game.", "She won an award for game design."
// These options are all from wrong passages, so we need to rebuild this item entirely.
// Replace with a proper standalone exercise.
{
  const item = data[62].translation[0];
  const newVI = "Tôi muốn kiểm tra về vấn đề ánh sáng mà chúng ta đã thảo luận trong khu vực mới của tòa nhà.";
  const newCorrect = "I wanted to check in about the lighting issue we discussed in the new section of the building.";
  const goodDistr = [
    "I am writing to confirm your appointment at our office next Thursday afternoon.",
    "Please let me know if you need any additional information before the meeting.",
    "We have reviewed your request and will process it within the next three business days.",
  ];
  const allOpts = shuffle([newCorrect, ...goodDistr]);
  item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${newVI}"`;
  item.options = allOpts;
  item.correctIndex = allOpts.indexOf(newCorrect);
  item.feedback = `Bản dịch: "${newCorrect}"`;
}

// pi:64 — Bài 14 double — Kildare Recreation Centre
// correct has "..." artifact — clean up
setQ(64, 0,
  "Khoản thu nhập thêm 5.000 euro sẽ được dùng để chi trả chi phí thay thế đường chạy ngoài trời.",
  "This will bring in an extra €5,000, which we will use toward the cost of replacing our outdoor running track."
);

// pi:66 ii:0 — Bài 1 triple — Tyche Carpets table
// correct is in Vietnamese (wrong!) — replace entirely
{
  const item = data[66].translation[0];
  const newVI = "Thảm Artemis và Hera vẫn còn hàng, trong khi mẫu Janus hiện đang hết hàng.";
  const newCorrect = "The Artemis and Hera carpets are still in stock, while the Janus model is currently out of stock.";
  const goodDistr = [
    "All carpet models in the Pleiades collection are available for immediate shipment.",
    "Customers must place orders at least two weeks in advance to guarantee delivery.",
    "The shipping weight for the selected carpet exceeds the standard courier limit.",
  ];
  const allOpts = shuffle([newCorrect, ...goodDistr]);
  item.question = `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${newVI}"`;
  item.options = allOpts;
  item.correctIndex = allOpts.indexOf(newCorrect);
  item.feedback = `Bản dịch: "${newCorrect}"`;
}

// pi:66 ii:1 — Bài 1 triple — Tyche Carpets email
// correct has "[Đoạn 2]:" markers — clean up
setQ(66, 1,
  "Nhà cung cấp thông báo rằng mẫu thảm đã chọn sẽ không có sẵn cho đến sau ngày khai trương dự kiến của khách sạn.",
  "The supplier informed us that our chosen carpet pattern will not be available until well after the hotel's anticipated opening date."
);

// ─── Re-balance correct answer positions ─────────────────────────────────────
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
const HEADER_REGEX = /^(BẢN GHI|MEMO|THÔNG BÁO|PHIẾU|Gửi:|Đến:|Từ:|Ngày:|Danh sách|\[|THẢM)/i;
let headerLeft = 0, errors = 0;
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
  });
});

const total = Object.values(dist).reduce((a, b) => a + b, 0);
console.log("=== Patch Summary ===");
console.log(`Remaining header prompts: ${headerLeft}`);
console.log(`Distribution (${total}): A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
console.log(`Errors: ${errors}`);
if (headerLeft === 0 && errors === 0) console.log("ALL CLEAN.");
