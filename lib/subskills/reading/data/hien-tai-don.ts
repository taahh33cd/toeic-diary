import type { Part5Level } from "@/lib/subskills/reading/types";

export const hienTaiDonLevels: Part5Level[] = [
  // ── L1: Tense Recognition ────────────────────────────────────────────────────
  {
    level: 1,
    slug: "l1",
    name: "Nhận diện thì",
    nameEn: "Tense Recognition",
    description: "Đọc câu và xác định đây là thì gì?",
    instruction:
      "Đọc từng câu và chọn tên thì đúng. Chú ý động từ chính và các từ chỉ tần suất.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "htd-l1-q01",
        sentence: "She works at a marketing firm downtown.",
        translation: "Cô ấy làm việc tại một công ty marketing ở trung tâm thành phố.",
        grammarHint: "Chú ý động từ chính: works (V-s) → thì Hiện tại đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "A",
        explanation:
          "'Works' là dạng V-s của động từ 'work'. Không có 'is working', 'has worked', hay 'worked' → đây là Hiện tại đơn.",
        explanationVi:
          "Động từ 'works' (V-s) diễn tả công việc thường xuyên/thói quen → Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q02",
        sentence: "The sun rises in the east every morning.",
        translation: "Mặt trời mọc ở phía đông mỗi buổi sáng.",
        grammarHint: "'rises' (V-s) + 'every morning' → sự thật hiển nhiên",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Rises' = V-s, 'every morning' xác nhận đây là sự thật tự nhiên luôn đúng → Hiện tại đơn.",
        explanationVi:
          "Sự thật tự nhiên/khoa học luôn dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q03",
        sentence: "He drinks coffee before every meeting.",
        translation: "Anh ấy uống cà phê trước mỗi cuộc họp.",
        grammarHint: "'drinks' (V-s) + 'before every meeting' → thói quen cá nhân",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "C",
        explanation:
          "'Drinks' = V-s diễn tả thói quen thường xuyên. 'Before every meeting' xác nhận hành động lặp đi lặp lại → Hiện tại đơn.",
        explanationVi:
          "Thói quen/hành động thường xuyên dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q04",
        sentence: "The company delivers packages to over 50 countries.",
        translation: "Công ty giao hàng đến hơn 50 quốc gia.",
        grammarHint: "'delivers' (V-s) → hoạt động đặc trưng thường xuyên của công ty",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "D",
        explanation:
          "'Delivers' = V-s diễn tả hoạt động thường xuyên, đặc trưng của công ty → Hiện tại đơn.",
        explanationVi:
          "Sự thật/đặc trưng thường xuyên của tổ chức dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q05",
        sentence: "They hold weekly meetings on Mondays.",
        translation: "Họ tổ chức các cuộc họp hàng tuần vào thứ Hai.",
        grammarHint: "'hold' (V nguyên thể, chủ ngữ they) + 'weekly' → lịch trình cố định",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "A",
        explanation:
          "'Hold' = V nguyên thể (chủ ngữ they số nhiều). 'Weekly meetings on Mondays' là lịch trình cố định → Hiện tại đơn.",
        explanationVi:
          "Lịch trình cố định/thường xuyên dùng Hiện tại đơn. Chủ ngữ số nhiều không thêm -s.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q06",
        sentence: "Water boils at 100 degrees Celsius.",
        translation: "Nước sôi ở 100 độ C.",
        grammarHint: "Đây là sự thật khoa học — luôn luôn đúng ở mọi thời điểm",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Boils' = V-s diễn tả sự thật khoa học luôn đúng → Hiện tại đơn.",
        explanationVi:
          "Sự thật khoa học/tự nhiên luôn dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q07",
        sentence: "The store opens at 9 a.m. on weekdays.",
        translation: "Cửa hàng mở cửa lúc 9 giờ sáng vào các ngày trong tuần.",
        grammarHint: "'opens' (V-s) + lịch trình cụ thể → HTĐ cho lịch trình",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "C",
        explanation:
          "'Opens' = V-s diễn tả lịch trình cố định của cửa hàng → Hiện tại đơn.",
        explanationVi:
          "HTĐ dùng để diễn tả lịch trình, thời khóa biểu cố định.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q08",
        sentence: "She always checks her email first thing in the morning.",
        translation: "Cô ấy luôn kiểm tra email ngay khi bắt đầu buổi sáng.",
        grammarHint: "'always' + 'checks' (V-s) → thói quen với trạng từ tần suất",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "D",
        explanation:
          "'Always' là dấu hiệu điển hình của HTĐ. 'Checks' = V-s xác nhận đây là thói quen → Hiện tại đơn.",
        explanationVi:
          "Từ 'always' kết hợp V-s = thói quen thường xuyên → Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q09",
        sentence: "The manager approves all purchase orders.",
        translation: "Người quản lý phê duyệt tất cả các đơn đặt hàng.",
        grammarHint: "'approves' (V-s) → quy trình/chức năng cố định",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "A",
        explanation:
          "'Approves' = V-s mô tả quy trình làm việc cố định/thường xuyên → Hiện tại đơn.",
        explanationVi:
          "Quy trình/chức năng trong công việc dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q10",
        sentence: "He rarely takes a lunch break.",
        translation: "Anh ấy hiếm khi nghỉ ăn trưa.",
        grammarHint: "'rarely' (hiếm khi) + 'takes' (V-s) → trạng từ tần suất",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Rarely' là trạng từ tần suất điển hình của HTĐ. 'Takes' = V-s → Hiện tại đơn.",
        explanationVi:
          "Trạng từ tần suất (rarely, seldom) + V-s = Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q11",
        sentence: "The factory produces 500 units per day.",
        translation: "Nhà máy sản xuất 500 đơn vị mỗi ngày.",
        grammarHint: "'produces' (V-s) + 'per day' → công suất/năng lực cố định",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "C",
        explanation:
          "'Produces' = V-s diễn tả công suất/năng lực hoạt động thường ngày của nhà máy → Hiện tại đơn.",
        explanationVi:
          "Thực tế thường xuyên/công suất cố định của tổ chức dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q12",
        sentence: "She usually travels to the branch office once a month.",
        translation: "Cô ấy thường đi đến chi nhánh mỗi tháng một lần.",
        grammarHint: "'usually' + 'travels' (V-s) + 'once a month' → thói quen định kỳ",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "D",
        explanation:
          "'Usually' (thường) là trạng từ tần suất của HTĐ. 'Travels' = V-s, 'once a month' = tần suất → Hiện tại đơn.",
        explanationVi:
          "'Usually' + V-s + biểu thức tần suất = Hiện tại đơn điển hình.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q13",
        sentence: "The software updates automatically every night.",
        translation: "Phần mềm tự động cập nhật mỗi đêm.",
        grammarHint: "'updates' (V-s) + 'every night' → hành động lặp lại định kỳ",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "A",
        explanation:
          "'Updates' = V-s, 'every night' = tần suất cố định → Hiện tại đơn.",
        explanationVi:
          "Hành động xảy ra đều đặn (every night) dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q14",
        sentence: "He generally handles all client complaints.",
        translation: "Anh ấy thường xuyên xử lý tất cả các khiếu nại của khách hàng.",
        grammarHint: "'generally' + 'handles' (V-s) → trách nhiệm/vai trò thường xuyên",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Generally' là trạng từ tần suất của HTĐ. 'Handles' = V-s diễn tả vai trò/trách nhiệm thường xuyên → Hiện tại đơn.",
        explanationVi:
          "'Generally' + V-s = Hiện tại đơn mô tả trách nhiệm cố định.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q15",
        sentence: "The company follows strict quality control standards.",
        translation: "Công ty tuân theo các tiêu chuẩn kiểm soát chất lượng nghiêm ngặt.",
        grammarHint: "'follows' (V-s) → chính sách/tiêu chuẩn cố định của công ty",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "C",
        explanation:
          "'Follows' = V-s mô tả chính sách/quy tắc cố định của công ty → Hiện tại đơn.",
        explanationVi:
          "Chính sách/tiêu chuẩn của tổ chức (luôn áp dụng) dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q16",
        sentence: "She takes the bus to work every day.",
        translation: "Cô ấy đi xe buýt đến nơi làm việc mỗi ngày.",
        grammarHint: "'takes' (V-s) + 'every day' → thói quen hàng ngày",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "D",
        explanation:
          "'Takes' = V-s, 'every day' = tần suất hàng ngày → thói quen điển hình của Hiện tại đơn.",
        explanationVi:
          "'Every day' + V-s = Hiện tại đơn diễn tả thói quen hàng ngày.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q17",
        sentence: "The director makes all final decisions.",
        translation: "Giám đốc đưa ra tất cả các quyết định cuối cùng.",
        grammarHint: "'makes' (V-s) → vai trò/quyền hạn cố định",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "A",
        explanation:
          "'Makes' = V-s diễn tả quyền hạn/vai trò cố định của giám đốc → Hiện tại đơn.",
        explanationVi:
          "Vai trò/quyền hạn trong tổ chức (luôn luôn đúng) dùng Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q18",
        sentence: "They process orders on a daily basis.",
        translation: "Họ xử lý đơn hàng hàng ngày.",
        grammarHint: "'process' (V nguyên thể, số nhiều) + 'on a daily basis' → quy trình định kỳ",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Process' = V nguyên thể (chủ ngữ they). 'On a daily basis' là time marker của HTĐ → Hiện tại đơn.",
        explanationVi:
          "'On a daily basis' là dấu hiệu điển hình của Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q19",
        sentence: "He never misses a deadline.",
        translation: "Anh ấy không bao giờ bỏ lỡ thời hạn.",
        grammarHint: "'never' + 'misses' (V-s) → trạng từ tần suất 0%",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "C",
        explanation:
          "'Never' là trạng từ tần suất 0% của HTĐ. 'Misses' = V-s → Hiện tại đơn.",
        explanationVi:
          "'Never' + V-s diễn tả điều không bao giờ xảy ra → Hiện tại đơn.",
      },
      {
        kind: "mcq",
        id: "htd-l1-q20",
        sentence: "The branch manager reports to the regional director.",
        translation: "Giám đốc chi nhánh báo cáo lên giám đốc khu vực.",
        grammarHint: "'reports' (V-s) → quan hệ cấp bậc/cơ cấu tổ chức cố định",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "D",
        explanation:
          "'Reports' = V-s mô tả cơ cấu tổ chức, quan hệ cấp bậc cố định → Hiện tại đơn.",
        explanationVi:
          "Cơ cấu tổ chức/quan hệ cấp bậc (luôn luôn đúng) dùng Hiện tại đơn.",
      },
    ],
  },

  // ── L2: Time Markers ─────────────────────────────────────────────────────────
  {
    level: 2,
    slug: "l2",
    name: "Dấu hiệu thời gian",
    nameEn: "Time Markers",
    description: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
    instruction:
      "Bấm vào các từ hoặc cụm từ là dấu hiệu thì (time markers). Có thể có nhiều từ trong một câu.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "highlight",
        id: "htd-l2-q01",
        sentence: "She always arrives at the office before 8 a.m.",
        translation: "Cô ấy luôn đến văn phòng trước 8 giờ sáng.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["always"],
        explanation:
          "'Always' là trạng từ tần suất 100% — dấu hiệu điển hình của Hiện tại đơn, đứng trước động từ chính.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q02",
        sentence: "The team always reviews the report before submission.",
        translation: "Nhóm luôn xem xét báo cáo trước khi nộp.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["always"],
        explanation:
          "'Always' trước động từ 'reviews' xác nhận đây là hành động thường xuyên không có ngoại lệ → Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q03",
        sentence: "He usually sends a summary email after each meeting.",
        translation: "Anh ấy thường gửi email tóm tắt sau mỗi cuộc họp.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["usually"],
        explanation:
          "'Usually' (thường, khoảng 80%) là trạng từ tần suất điển hình của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q04",
        sentence: "The receptionist usually greets visitors with a smile.",
        translation: "Lễ tân thường chào đón khách với nụ cười.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["usually"],
        explanation:
          "'Usually' trước 'greets' — hành động thường xuyên, điển hình của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q05",
        sentence: "The sales team often meets with clients in the afternoon.",
        translation: "Nhóm bán hàng thường gặp khách hàng vào buổi chiều.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["often"],
        explanation:
          "'Often' (thường xuyên, khoảng 60%) là trạng từ tần suất của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q06",
        sentence: "She often works overtime to meet project deadlines.",
        translation: "Cô ấy thường làm thêm giờ để kịp thời hạn dự án.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["often"],
        explanation:
          "'Often' trước 'works' xác nhận thói quen thường xuyên → Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q07",
        sentence: "He sometimes attends the morning briefing remotely.",
        translation: "Anh ấy đôi khi tham dự cuộc họp sáng từ xa.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["sometimes"],
        explanation:
          "'Sometimes' (đôi khi, khoảng 40%) là trạng từ tần suất điển hình của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q08",
        sentence: "The department sometimes adjusts its budget mid-year.",
        translation: "Bộ phận đôi khi điều chỉnh ngân sách vào giữa năm.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["sometimes"],
        explanation:
          "'Sometimes' trước 'adjusts' → hành động không thường xuyên nhưng lặp lại → Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q09",
        sentence: "The CEO rarely attends staff-level meetings.",
        translation: "Giám đốc điều hành hiếm khi tham dự các cuộc họp cấp nhân viên.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["rarely"],
        explanation:
          "'Rarely' (hiếm khi, khoảng 10–20%) là trạng từ tần suất của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q10",
        sentence: "She rarely makes errors in her financial reports.",
        translation: "Cô ấy hiếm khi mắc lỗi trong báo cáo tài chính của mình.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["rarely"],
        explanation:
          "'Rarely' trước 'makes' → tần suất rất thấp nhưng vẫn là thói quen → Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q11",
        sentence: "The system never shuts down during business hours.",
        translation: "Hệ thống không bao giờ tắt trong giờ làm việc.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["never"],
        explanation:
          "'Never' (không bao giờ, tần suất 0%) là trạng từ tần suất điển hình của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q12",
        sentence: "He never submits a report without double-checking the figures.",
        translation: "Anh ấy không bao giờ nộp báo cáo mà không kiểm tra lại các con số.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["never"],
        explanation:
          "'Never' trước 'submits' → điều không bao giờ xảy ra → Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q13",
        sentence: "The team holds a strategy session every quarter.",
        translation: "Nhóm tổ chức phiên họp chiến lược mỗi quý.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["every", "quarter"],
        explanation:
          "'Every quarter' là biểu thức tần suất điển hình của Hiện tại đơn — diễn tả hành động lặp lại đều đặn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q14",
        sentence: "She backs up her work files every day.",
        translation: "Cô ấy sao lưu các tập tin làm việc mỗi ngày.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["every", "day"],
        explanation:
          "'Every day' là time marker điển hình của Hiện tại đơn — hành động lặp lại hàng ngày.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q15",
        sentence: "The company generally pays bonuses in December.",
        translation: "Công ty thường trả thưởng vào tháng 12.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["generally"],
        explanation:
          "'Generally' (thường thường, nhìn chung) là trạng từ tần suất điển hình của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q16",
        sentence: "He generally prefers email over phone calls for business communication.",
        translation:
          "Anh ấy thường thích email hơn điện thoại trong giao tiếp kinh doanh.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["generally"],
        explanation:
          "'Generally' trước 'prefers' → thói quen/sở thích thường xuyên → Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q17",
        sentence: "The maintenance crew regularly inspects the equipment.",
        translation: "Đội bảo trì thường xuyên kiểm tra thiết bị.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["regularly"],
        explanation:
          "'Regularly' (thường xuyên, đều đặn) là trạng từ tần suất điển hình của Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q18",
        sentence: "She regularly updates her professional skills through online courses.",
        translation:
          "Cô ấy thường xuyên cập nhật kỹ năng chuyên môn qua các khóa học trực tuyến.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["regularly"],
        explanation:
          "'Regularly' trước 'updates' → hành động lặp lại có tính đều đặn → Hiện tại đơn.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q19",
        sentence: "The team processes customer feedback on a daily basis.",
        translation: "Nhóm xử lý phản hồi của khách hàng hàng ngày.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["on", "a", "daily", "basis"],
        explanation:
          "'On a daily basis' (hàng ngày) là cụm time marker của Hiện tại đơn — tương đương 'every day'.",
      },
      {
        kind: "highlight",
        id: "htd-l2-q20",
        sentence: "As a rule, the supervisor signs off on all expense reports.",
        translation: "Theo nguyên tắc, người giám sát phê duyệt tất cả báo cáo chi phí.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại đơn.",
        correctWords: ["As", "a", "rule"],
        explanation:
          "'As a rule' (theo nguyên tắc/thông lệ) là cụm trạng từ của Hiện tại đơn — diễn tả quy tắc/thông lệ thường xuyên.",
      },
    ],
  },

  // ── L3: Vietnamese → English ──────────────────────────────────────────────────
  {
    level: 3,
    slug: "l3",
    name: "Kết nối Việt–Anh",
    nameEn: "Vietnamese → English",
    description: "Câu tiếng Việt → chọn dạng động từ đúng bằng tiếng Anh.",
    instruction:
      "Đọc bản dịch tiếng Việt, hiểu ý nghĩa thời gian, rồi chọn dạng động từ phù hợp. Phân biệt thói quen (HTĐ) và hành động đang xảy ra (HTTD).",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "htd-l3-q01",
        sentence: "The head office _____ final authority over all major contracts.",
        translation:
          "Trụ sở chính có quyền quyết định cuối cùng đối với tất cả hợp đồng lớn. (sự thật cơ cấu)",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "holds",
          B: "is holding",
          C: "has held",
          D: "held",
        },
        correct: "A",
        explanation:
          "Sự thật về cơ cấu tổ chức (luôn luôn đúng) → Hiện tại đơn: 'holds' (V-s).",
        explanationVi:
          "Quyền hạn/cơ cấu cố định dùng HTĐ. 'Is holding' sai vì không phải hành động đang xảy ra.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q02",
        sentence: "Please lower your voice — the board _____ in the conference room.",
        translation:
          "Xin hãy nói nhỏ lại — hội đồng đang họp trong phòng họp. (hành động đang xảy ra)",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "meets",
          B: "is meeting",
          C: "has met",
          D: "met",
        },
        correct: "B",
        explanation:
          "Tiếng Việt 'đang họp' = hành động đang xảy ra ngay lúc nói → Hiện tại tiếp diễn: 'is meeting'.",
        explanationVi:
          "'Đang' + hành động ngay lúc nói → HTTD (is/are + V-ing), không phải HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q03",
        sentence: "Our procurement team _____ all suppliers at least twice a year.",
        translation:
          "Nhóm mua sắm của chúng tôi thường đánh giá tất cả nhà cung cấp ít nhất hai lần một năm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has evaluated",
          B: "is evaluating",
          C: "evaluates",
          D: "evaluated",
        },
        correct: "C",
        explanation:
          "'At least twice a year' (ít nhất hai lần một năm) là tần suất định kỳ → Hiện tại đơn: 'evaluates' (V-s).",
        explanationVi:
          "Tần suất định kỳ (at least twice a year) → HTĐ. 'Thường đánh giá' xác nhận thói quen.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q04",
        sentence: "The training manual clearly _____ the safety procedures for all staff.",
        translation:
          "Tài liệu hướng dẫn đào tạo quy định rõ ràng các quy trình an toàn cho tất cả nhân viên. (nội dung tài liệu)",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is outlining",
          B: "has outlined",
          C: "outlined",
          D: "outlines",
        },
        correct: "D",
        explanation:
          "Nội dung cố định trong tài liệu (luôn luôn đúng) → Hiện tại đơn: 'outlines' (V-s).",
        explanationVi:
          "Nội dung tài liệu/quy định cố định dùng HTĐ. 'Is outlining' sai vì tài liệu không phải đang viết.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q05",
        sentence: "The marketing department _____ a new campaign every six months.",
        translation:
          "Bộ phận marketing khởi chạy một chiến dịch mới mỗi sáu tháng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "launches",
          B: "is launching",
          C: "has launched",
          D: "launched",
        },
        correct: "A",
        explanation:
          "'Every six months' (mỗi sáu tháng) = tần suất định kỳ → Hiện tại đơn: 'launches' (V-s).",
        explanationVi:
          "'Mỗi sáu tháng' = tần suất cố định → HTĐ. 'Is launching' chỉ dùng khi đang làm ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q06",
        sentence: "Sorry, he cannot take your call — he _____ a presentation to the board right now.",
        translation:
          "Xin lỗi, anh ấy không thể nghe máy — anh ấy đang thuyết trình cho hội đồng ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "gives",
          B: "is giving",
          C: "has given",
          D: "gave",
        },
        correct: "B",
        explanation:
          "'Right now' (ngay lúc này) + 'đang thuyết trình' → hành động đang diễn ra → Hiện tại tiếp diễn: 'is giving'.",
        explanationVi:
          "'Right now' + 'đang' → HTTD. 'Gives' sai vì đó là thói quen, không phải hành động đang xảy ra.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q07",
        sentence: "The legal team _____ every contract before it is signed.",
        translation:
          "Bộ phận pháp lý luôn xem xét mỗi hợp đồng trước khi ký.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has reviewed",
          B: "is reviewing",
          C: "reviews",
          D: "reviewed",
        },
        correct: "C",
        explanation:
          "'Luôn xem xét mỗi hợp đồng' = thói quen thường xuyên → Hiện tại đơn: 'reviews' (V-s).",
        explanationVi:
          "'Luôn' + 'mỗi hợp đồng' = thói quen cố định → HTĐ. 'Is reviewing' chỉ dùng khi đang xem xét ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q08",
        sentence: "The front desk staff _____ all incoming calls during business hours.",
        translation:
          "Nhân viên lễ tân thường xử lý tất cả cuộc gọi đến trong giờ làm việc.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is handling",
          B: "has handled",
          C: "handled",
          D: "handles",
        },
        correct: "D",
        explanation:
          "'Thường xử lý' (during business hours = thường xuyên) → Hiện tại đơn: 'handles' (V-s).",
        explanationVi:
          "Trách nhiệm thường xuyên trong giờ làm → HTĐ. 'Is handling' chỉ đúng khi đang làm ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q09",
        sentence: "The company _____ that customer satisfaction is its top priority.",
        translation:
          "Công ty tin rằng sự hài lòng của khách hàng là ưu tiên hàng đầu. (động từ nhận thức)",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "believes",
          B: "is believing",
          C: "has believed",
          D: "believed",
        },
        correct: "A",
        explanation:
          "'Believe' là động từ trạng thái (stative verb) — không dùng dạng -ing. → Hiện tại đơn: 'believes'.",
        explanationVi:
          "Động từ trạng thái như 'believe, know, think (ý kiến), understand' KHÔNG dùng -ing → HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q10",
        sentence: "Look — customers _____ outside the store already.",
        translation:
          "Nhìn kìa — khách hàng đang xếp hàng bên ngoài cửa hàng rồi.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "line up",
          B: "are lining up",
          C: "have lined up",
          D: "lined up",
        },
        correct: "B",
        explanation:
          "'Look' (nhìn kìa) + 'đang xếp hàng' → hành động đang diễn ra ngay trước mắt → Hiện tại tiếp diễn: 'are lining up'.",
        explanationVi:
          "'Look/Listen' ở đầu câu thường báo hiệu HTTD — hành động đang xảy ra ngay lúc quan sát.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q11",
        sentence: "This agreement _____ that all disputes shall be resolved through arbitration.",
        translation:
          "Thỏa thuận này quy định rằng mọi tranh chấp phải được giải quyết qua trọng tài. (nội dung hợp đồng)",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is specifying",
          B: "has specified",
          C: "specifies",
          D: "specified",
        },
        correct: "C",
        explanation:
          "Nội dung hợp đồng/thỏa thuận cố định → Hiện tại đơn: 'specifies' (V-s).",
        explanationVi:
          "Tài liệu pháp lý/hợp đồng dùng HTĐ để diễn tả nội dung cố định. 'Is specifying' sai.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q12",
        sentence: "The warehouse team _____ incoming shipments on a daily basis.",
        translation:
          "Nhóm kho hàng kiểm tra các lô hàng đến hàng ngày.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is inspecting",
          B: "has inspected",
          C: "inspected",
          D: "inspects",
        },
        correct: "D",
        explanation:
          "'On a daily basis' (hàng ngày) = tần suất cố định → Hiện tại đơn: 'inspects' (V-s).",
        explanationVi:
          "'On a daily basis' là time marker điển hình của HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q13",
        sentence: "The branch manager _____ her team's performance every quarter.",
        translation:
          "Giám đốc chi nhánh đánh giá hiệu suất của nhóm mình mỗi quý.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "assesses",
          B: "is assessing",
          C: "has assessed",
          D: "assessed",
        },
        correct: "A",
        explanation:
          "'Every quarter' (mỗi quý) = tần suất định kỳ → Hiện tại đơn: 'assesses' (V-s).",
        explanationVi:
          "'Every quarter' = tần suất 4 lần/năm → HTĐ. Không phải đang đánh giá ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q14",
        sentence: "I'm afraid Ms. Park is unavailable — she _____ a client at the moment.",
        translation:
          "Tiếc là cô Park không rảnh — cô ấy đang tiếp khách hàng vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "assists",
          B: "is assisting",
          C: "has assisted",
          D: "assisted",
        },
        correct: "B",
        explanation:
          "'At the moment' (vào lúc này) + 'đang tiếp' → hành động đang diễn ra → Hiện tại tiếp diễn: 'is assisting'.",
        explanationVi:
          "'At the moment' là dấu hiệu điển hình của HTTD, không phải HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q15",
        sentence: "The technical team _____ system backups every night to prevent data loss.",
        translation:
          "Nhóm kỹ thuật thực hiện sao lưu hệ thống mỗi đêm để phòng tránh mất dữ liệu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has performed",
          B: "is performing",
          C: "performs",
          D: "performed",
        },
        correct: "C",
        explanation:
          "'Every night' (mỗi đêm) = tần suất hàng ngày → Hiện tại đơn: 'performs' (V-s).",
        explanationVi:
          "'Every night' = thói quen hàng ngày → HTĐ. 'Is performing' sai vì không phải đang làm ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q16",
        sentence: "Our company _____ free training to all new hires during their first month.",
        translation:
          "Công ty chúng tôi cung cấp đào tạo miễn phí cho nhân viên mới trong tháng đầu tiên. (chính sách)",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is providing",
          B: "has provided",
          C: "provided",
          D: "provides",
        },
        correct: "D",
        explanation:
          "Chính sách công ty (luôn luôn áp dụng) → Hiện tại đơn: 'provides' (V-s).",
        explanationVi:
          "Chính sách/cam kết của tổ chức dùng HTĐ. 'Is providing' sai vì không phải tình huống tạm thời.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q17",
        sentence: "The CEO _____ a town hall meeting with employees once a quarter.",
        translation:
          "Giám đốc điều hành tổ chức một cuộc họp toàn thể với nhân viên mỗi quý một lần.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "holds",
          B: "is holding",
          C: "has held",
          D: "held",
        },
        correct: "A",
        explanation:
          "'Once a quarter' (mỗi quý một lần) = tần suất định kỳ → Hiện tại đơn: 'holds' (V-s).",
        explanationVi:
          "Tần suất định kỳ (once a quarter) → HTĐ. 'Is holding' chỉ dùng khi đang tổ chức ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q18",
        sentence: "Could you be quiet? The candidate _____ her final interview next door.",
        translation:
          "Bạn có thể im lặng không? Ứng viên đang trải qua buổi phỏng vấn cuối cùng bên cạnh.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "takes",
          B: "is taking",
          C: "has taken",
          D: "took",
        },
        correct: "B",
        explanation:
          "'Đang trải qua' → hành động đang diễn ra ngay lúc nói → Hiện tại tiếp diễn: 'is taking'.",
        explanationVi:
          "'Đang' + hành động diễn ra ngay bây giờ → HTTD (is/are + V-ing).",
      },
      {
        kind: "mcq",
        id: "htd-l3-q19",
        sentence: "The regulation _____ that all imports must pass customs inspection.",
        translation:
          "Quy định yêu cầu tất cả hàng nhập khẩu phải qua kiểm tra hải quan. (quy định pháp luật)",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has required",
          B: "is requiring",
          C: "requires",
          D: "required",
        },
        correct: "C",
        explanation:
          "Quy định pháp luật (luôn luôn áp dụng) → Hiện tại đơn: 'requires' (V-s).",
        explanationVi:
          "Luật/quy định cố định dùng HTĐ. 'Is requiring' sai — động từ trong quy định không phải hành động tạm thời.",
      },
      {
        kind: "mcq",
        id: "htd-l3-q20",
        sentence: "Employees generally _____ flexible work schedules in our company.",
        translation:
          "Nhân viên thường được hưởng lịch làm việc linh hoạt trong công ty chúng tôi.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "are enjoying",
          B: "have enjoyed",
          C: "enjoyed",
          D: "enjoy",
        },
        correct: "D",
        explanation:
          "'Generally' (thường) = trạng từ tần suất → Hiện tại đơn: 'enjoy' (V nguyên thể, chủ ngữ số nhiều).",
        explanationVi:
          "'Generally' + V nguyên thể (số nhiều) = HTĐ. 'Are enjoying' sai — đây là chính sách, không phải tình huống tạm thời.",
      },
    ],
  },

  // ── L4: Active + Passive ──────────────────────────────────────────────────────
  {
    level: 4,
    slug: "l4",
    name: "Chia động từ",
    nameEn: "Verb Form",
    description: "Chọn dạng động từ đúng để hoàn thành câu (active + passive).",
    instruction:
      "Chú ý chủ ngữ câu: nếu chủ ngữ thực hiện hành động → Active (V/V-s). Nếu chủ ngữ nhận hành động → Passive (am/is/are + V3).",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "htd-l4-q01",
        sentence: "The receptionist _____ all incoming calls during working hours.",
        translation: "Lễ tân trả lời tất cả cuộc gọi đến trong giờ làm việc.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "answers",
          B: "is answered",
          C: "is answering",
          D: "was answered",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the receptionist' là người thực hiện hành động → Active: 'answers' (V-s).",
        explanationVi:
          "Lễ tân TỰ trả lời → chủ động (active). Không phải 'is answered' vì lễ tân không 'bị trả lời'.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q02",
        sentence: "All incoming calls _____ by the receptionist during working hours.",
        translation: "Tất cả cuộc gọi đến được trả lời bởi lễ tân trong giờ làm việc.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "answer",
          B: "are answered",
          C: "have answered",
          D: "are answering",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'all incoming calls' nhận hành động → Passive: 'are answered' (are + V3).",
        explanationVi:
          "Cuộc gọi 'bị/được trả lời' → bị động (passive). Dấu hiệu: 'by the receptionist' sau động từ.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q03",
        sentence: "The accounting team _____ all invoices before payment is made.",
        translation: "Nhóm kế toán xác minh tất cả hóa đơn trước khi thanh toán.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is verified",
          B: "was verified",
          C: "verifies",
          D: "is verifying",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the accounting team' tự thực hiện việc xác minh → Active: 'verifies' (V-s).",
        explanationVi:
          "Nhóm kế toán TỰ xác minh → chủ động. 'Is verified' sai vì nhóm không bị xác minh.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q04",
        sentence: "All invoices _____ by the accounting team before payment is made.",
        translation: "Tất cả hóa đơn được xác minh bởi nhóm kế toán trước khi thanh toán.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "verify",
          B: "are verifying",
          C: "have been verified",
          D: "are verified",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'all invoices' nhận hành động xác minh → Passive: 'are verified' (are + V3).",
        explanationVi:
          "Hóa đơn 'được xác minh' → bị động. 'By the accounting team' xác nhận người thực hiện ở nơi khác.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q05",
        sentence: "The HR department _____ employee performance reviews annually.",
        translation: "Bộ phận nhân sự thực hiện đánh giá hiệu suất nhân viên hàng năm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "conducts",
          B: "is conducted",
          C: "was conducted",
          D: "is conducting",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the HR department' tự thực hiện đánh giá → Active: 'conducts' (V-s).",
        explanationVi:
          "Bộ phận nhân sự TỰ thực hiện đánh giá → chủ động. 'Is conducted' sai — HR không bị thực hiện.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q06",
        sentence: "Employee performance reviews _____ by the HR department annually.",
        translation: "Đánh giá hiệu suất nhân viên được thực hiện bởi bộ phận nhân sự hàng năm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "conduct",
          B: "are conducted",
          C: "is conducted",
          D: "have conducted",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'employee performance reviews' (số nhiều) nhận hành động → Passive: 'are conducted'.",
        explanationVi:
          "Đánh giá 'được thực hiện' → bị động số nhiều: are + V3. 'Is conducted' sai vì chủ ngữ số nhiều.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q07",
        sentence: "The logistics team _____ all shipments to ensure timely delivery.",
        translation: "Nhóm hậu cần theo dõi tất cả lô hàng để đảm bảo giao đúng hạn.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "are tracked",
          B: "have tracked",
          C: "tracks",
          D: "was tracked",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the logistics team' là người thực hiện theo dõi → Active: 'tracks' (V-s).",
        explanationVi:
          "Nhóm hậu cần TỰ theo dõi → chủ động. 'Are tracked' sai vì nhóm không bị theo dõi.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q08",
        sentence: "All shipments _____ by the logistics team to ensure timely delivery.",
        translation: "Tất cả lô hàng được theo dõi bởi nhóm hậu cần để đảm bảo giao đúng hạn.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "track",
          B: "is tracking",
          C: "has tracked",
          D: "are tracked",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'all shipments' (số nhiều) nhận hành động → Passive: 'are tracked' (are + V3).",
        explanationVi:
          "Lô hàng 'được theo dõi' → bị động số nhiều: are tracked.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q09",
        sentence: "Our legal team _____ every contract before it is signed.",
        translation: "Nhóm pháp lý của chúng tôi xem xét mỗi hợp đồng trước khi ký.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "reviews",
          B: "is reviewed",
          C: "was reviewed",
          D: "are reviewed",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'our legal team' tự xem xét → Active: 'reviews' (V-s).",
        explanationVi:
          "Nhóm pháp lý TỰ xem xét → chủ động. 'Is reviewed' sai vì nhóm không bị xem xét.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q10",
        sentence: "Every contract _____ by our legal team before it is signed.",
        translation: "Mỗi hợp đồng được xem xét bởi nhóm pháp lý của chúng tôi trước khi ký.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "review",
          B: "is reviewed",
          C: "has reviewed",
          D: "is reviewing",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'every contract' (số ít) nhận hành động → Passive: 'is reviewed' (is + V3).",
        explanationVi:
          "Hợp đồng 'được xem xét' → bị động số ít: is reviewed.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q11",
        sentence: "The factory _____ approximately 1,000 units of this product each day.",
        translation: "Nhà máy sản xuất khoảng 1.000 đơn vị sản phẩm này mỗi ngày.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is produced",
          B: "was produced",
          C: "produces",
          D: "are produced",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the factory' tự sản xuất → Active: 'produces' (V-s).",
        explanationVi:
          "Nhà máy TỰ sản xuất → chủ động. 'Is produced' sai vì nhà máy không bị sản xuất.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q12",
        sentence:
          "Approximately 1,000 units of this product _____ by the factory each day.",
        translation: "Khoảng 1.000 đơn vị sản phẩm này được sản xuất bởi nhà máy mỗi ngày.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "produce",
          B: "is produced",
          C: "has produced",
          D: "are produced",
        },
        correct: "D",
        explanation:
          "Chủ ngữ '1,000 units' (số nhiều) nhận hành động → Passive: 'are produced' (are + V3).",
        explanationVi:
          "Đơn vị sản phẩm 'được sản xuất' → bị động số nhiều: are produced.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q13",
        sentence: "The warehouse manager _____ stock levels every morning.",
        translation: "Quản lý kho kiểm tra mức tồn kho mỗi buổi sáng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "checks",
          B: "is checked",
          C: "was checked",
          D: "are checked",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the warehouse manager' tự kiểm tra → Active: 'checks' (V-s).",
        explanationVi:
          "Quản lý kho TỰ kiểm tra → chủ động. 'Is checked' sai vì quản lý không bị kiểm tra.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q14",
        sentence: "Stock levels _____ by the warehouse manager every morning.",
        translation: "Mức tồn kho được kiểm tra bởi quản lý kho mỗi buổi sáng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "check",
          B: "are checked",
          C: "is checked",
          D: "have been checked",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'stock levels' (số nhiều) nhận hành động → Passive: 'are checked' (are + V3).",
        explanationVi:
          "Mức tồn kho 'được kiểm tra' → bị động số nhiều: are checked.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q15",
        sentence:
          "The marketing team _____ promotional emails to all registered customers monthly.",
        translation: "Nhóm marketing gửi email khuyến mãi đến tất cả khách hàng đã đăng ký hàng tháng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is sent",
          B: "has sent",
          C: "sends",
          D: "was sent",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the marketing team' tự gửi email → Active: 'sends' (V-s).",
        explanationVi:
          "Nhóm marketing TỰ gửi → chủ động. 'Is sent' sai vì nhóm không bị gửi.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q16",
        sentence:
          "Promotional emails _____ to all registered customers by the marketing team monthly.",
        translation: "Email khuyến mãi được gửi đến tất cả khách hàng đã đăng ký bởi nhóm marketing hàng tháng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "send",
          B: "is sending",
          C: "have sent",
          D: "are sent",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'promotional emails' (số nhiều) nhận hành động → Passive: 'are sent' (are + V3).",
        explanationVi:
          "Email 'được gửi' → bị động số nhiều: are sent.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q17",
        sentence:
          "The quality control inspector _____ each product before it leaves the facility.",
        translation: "Thanh tra kiểm soát chất lượng kiểm tra mỗi sản phẩm trước khi xuất xưởng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "examines",
          B: "is examined",
          C: "was examined",
          D: "are examined",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the quality control inspector' tự kiểm tra → Active: 'examines' (V-s).",
        explanationVi:
          "Thanh tra TỰ kiểm tra sản phẩm → chủ động. 'Is examined' sai.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q18",
        sentence: "Each product _____ by the quality control inspector before it leaves the facility.",
        translation: "Mỗi sản phẩm được kiểm tra bởi thanh tra kiểm soát chất lượng trước khi xuất xưởng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "examine",
          B: "is examined",
          C: "are examined",
          D: "was examined",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'each product' (số ít) nhận hành động → Passive: 'is examined' (is + V3).",
        explanationVi:
          "Sản phẩm 'được kiểm tra' → bị động số ít: is examined. 'Are examined' sai vì 'each product' là số ít.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q19",
        sentence: "The board _____ key strategic decisions for the company.",
        translation: "Hội đồng quản trị đưa ra các quyết định chiến lược quan trọng cho công ty.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is made",
          B: "was made",
          C: "makes",
          D: "are made",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the board' tự đưa ra quyết định → Active: 'makes' (V-s).",
        explanationVi:
          "Hội đồng TỰ đưa ra quyết định → chủ động. 'Is made/are made' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "htd-l4-q20",
        sentence: "Key strategic decisions _____ by the board.",
        translation: "Các quyết định chiến lược quan trọng được đưa ra bởi hội đồng quản trị.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "make",
          B: "is made",
          C: "is making",
          D: "are made",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'key strategic decisions' (số nhiều) nhận hành động → Passive: 'are made' (are + V3).",
        explanationVi:
          "Quyết định 'được đưa ra' → bị động số nhiều: are made. 'Is made' sai vì chủ ngữ số nhiều.",
      },
    ],
  },

  // ── L5: Tense Discrimination ─────────────────────────────────────────────────
  {
    level: 5,
    slug: "l5",
    name: "Phân biệt 2 thì",
    nameEn: "Tense Discrimination",
    description: "Phân biệt Hiện tại đơn với Hiện tại tiếp diễn (trường hợp khó).",
    instruction:
      "Phân biệt thói quen/sự thật cố định (HTĐ) với hành động đang xảy ra/tình huống tạm thời (HTTD). Chú ý động từ trạng thái không dùng -ing.",
    difficulty: "hard",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "htd-l5-q01",
        sentence: "As a rule, the board _____ all major investments before approval.",
        translation:
          "Theo nguyên tắc, hội đồng phân tích tất cả các khoản đầu tư lớn trước khi phê duyệt.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "analyzes",
          B: "is analyzing",
          C: "has analyzed",
          D: "analyzed",
        },
        correct: "A",
        explanation:
          "'As a rule' (theo nguyên tắc) = quy tắc cố định → Hiện tại đơn: 'analyzes'. Không phải HTTD vì đây không phải hành động đang xảy ra ngay lúc nói.",
        explanationVi:
          "'As a rule' là dấu hiệu điển hình của HTĐ — quy tắc/thông lệ cố định.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q02",
        sentence:
          "I appreciate that you're here, but the CEO _____ a critical call right now.",
        translation:
          "Tôi trân trọng sự có mặt của bạn, nhưng CEO đang nghe một cuộc gọi quan trọng ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "takes",
          B: "is taking",
          C: "has taken",
          D: "took",
        },
        correct: "B",
        explanation:
          "'Right now' + 'đang nghe' = hành động đang diễn ra → Hiện tại tiếp diễn: 'is taking'.",
        explanationVi:
          "'Right now' là dấu hiệu điển hình của HTTD. 'Takes' sai — đó là thói quen, không phải hành động ngay lúc này.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q03",
        sentence: "The clause _____ that liability is limited to the contract value.",
        translation:
          "Điều khoản quy định rằng trách nhiệm pháp lý bị giới hạn ở giá trị hợp đồng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is stating",
          B: "has stated",
          C: "states",
          D: "stated",
        },
        correct: "C",
        explanation:
          "Nội dung điều khoản hợp đồng (luôn đúng) → Hiện tại đơn: 'states'. 'Is stating' sai — điều khoản không phải đang viết ra ngay lúc nói.",
        explanationVi:
          "Nội dung văn bản pháp lý/hợp đồng dùng HTĐ, không dùng HTTD.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q04",
        sentence:
          "Due to the restructuring, the marketing team _____ from the fifth floor these days.",
        translation:
          "Do tái cơ cấu, nhóm marketing đang làm việc từ tầng năm trong thời gian này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "works",
          B: "has worked",
          C: "worked",
          D: "is working",
        },
        correct: "D",
        explanation:
          "'These days' (thời gian này) + 'due to restructuring' = tình huống tạm thời đang diễn ra → Hiện tại tiếp diễn: 'is working'.",
        explanationVi:
          "'These days' với ngữ cảnh thay đổi tạm thời → HTTD. 'Works' sai — đó là nơi làm việc cố định, không phải tạm thời.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q05",
        sentence: "Most employees _____ the new flexible schedule is a significant improvement.",
        translation:
          "Hầu hết nhân viên cho rằng lịch linh hoạt mới là một cải tiến đáng kể.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "think",
          B: "are thinking",
          C: "have thought",
          D: "thought",
        },
        correct: "A",
        explanation:
          "'Think' (mang ý kiến/quan điểm) là động từ trạng thái → KHÔNG dùng -ing. → Hiện tại đơn: 'think'.",
        explanationVi:
          "Khi 'think' mang nghĩa 'cho rằng/có ý kiến', đây là stative verb → HTĐ. 'Are thinking' sai.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q06",
        sentence:
          "She can't speak to you right now — she _____ the new sales figures for tomorrow's meeting.",
        translation:
          "Cô ấy không thể nói chuyện với bạn ngay bây giờ — cô ấy đang phân tích số liệu bán hàng mới cho cuộc họp ngày mai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "analyzes",
          B: "is analyzing",
          C: "has analyzed",
          D: "analyzed",
        },
        correct: "B",
        explanation:
          "'Right now' + 'can't speak' = hành động đang bận ngay lúc nói → Hiện tại tiếp diễn: 'is analyzing'.",
        explanationVi:
          "Khi diễn đạt lý do không thể làm gì đó ngay lúc nói → HTTD. 'Analyzes' sai.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q07",
        sentence: "The annual shareholders' meeting _____ on the last Friday of every April.",
        translation:
          "Cuộc họp cổ đông thường niên diễn ra vào thứ Sáu cuối tháng Tư hàng năm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is taking place",
          B: "has taken place",
          C: "takes place",
          D: "took place",
        },
        correct: "C",
        explanation:
          "Lịch trình cố định hàng năm → Hiện tại đơn: 'takes place'. 'Is taking place' sai — đây là lịch trình cố định, không phải hành động đang xảy ra.",
        explanationVi:
          "Lịch trình cố định/thường niên dùng HTĐ. 'Is taking place' chỉ dùng khi đang diễn ra ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q08",
        sentence:
          "The company _____ its operations to adapt to the new market conditions.",
        translation:
          "Công ty đang điều chỉnh hoạt động để thích nghi với điều kiện thị trường mới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "adjusts",
          B: "has adjusted",
          C: "adjusted",
          D: "is adjusting",
        },
        correct: "D",
        explanation:
          "'Đang điều chỉnh' + 'to adapt to new conditions' = thay đổi tạm thời đang diễn ra → Hiện tại tiếp diễn: 'is adjusting'.",
        explanationVi:
          "Thay đổi để thích nghi với điều kiện mới = tình huống tạm thời đang xảy ra → HTTD.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q09",
        sentence:
          "The train _____ at platform 3 at 8:15 every morning, so you should arrive by 8:10.",
        translation:
          "Tàu khởi hành từ sân ga 3 lúc 8:15 mỗi sáng, vì vậy bạn nên đến trước 8:10.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "departs",
          B: "is departing",
          C: "has departed",
          D: "departed",
        },
        correct: "A",
        explanation:
          "'Every morning' + lịch trình cố định → Hiện tại đơn: 'departs'. 'Is departing' sai — câu nói về lịch trình, không phải tàu đang đi ngay lúc nói.",
        explanationVi:
          "HTĐ dùng cho lịch trình cố định (xe buýt, tàu, máy bay). 'Is departing' chỉ dùng khi tàu đang rời ga ngay bây giờ.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q10",
        sentence:
          "Currently, the head office _____ from its temporary location while the building is renovated.",
        translation:
          "Hiện tại, trụ sở đang hoạt động từ địa điểm tạm thời trong khi tòa nhà được cải tạo.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "operates",
          B: "is operating",
          C: "has operated",
          D: "operated",
        },
        correct: "B",
        explanation:
          "'Currently' + 'while the building is renovated' = tình huống tạm thời đang diễn ra → Hiện tại tiếp diễn: 'is operating'.",
        explanationVi:
          "'Currently' + 'while...' (trong khi...) xác nhận tình huống tạm thời → HTTD. 'Operates' sai — đây không phải nơi làm việc cố định.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q11",
        sentence:
          "Steel _____ when exposed to high temperatures, making protective equipment essential.",
        translation:
          "Thép giãn nở khi tiếp xúc với nhiệt độ cao, điều này khiến thiết bị bảo hộ trở nên thiết yếu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is expanding",
          B: "has expanded",
          C: "expands",
          D: "expanded",
        },
        correct: "C",
        explanation:
          "Sự thật khoa học về tính chất vật liệu → Hiện tại đơn: 'expands'. 'Is expanding' sai — đây là quy luật tự nhiên, không phải hành động đang xảy ra.",
        explanationVi:
          "Sự thật khoa học/tính chất vật lý luôn dùng HTĐ, không bao giờ dùng HTTD.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q12",
        sentence: "She _____ for the senior manager while he's on vacation this week.",
        translation:
          "Cô ấy đang làm việc thay cho quản lý cấp cao trong khi anh ấy nghỉ phép tuần này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "covers",
          B: "has covered",
          C: "covered",
          D: "is covering",
        },
        correct: "D",
        explanation:
          "'This week' + 'while he's on vacation' = tình huống tạm thời → Hiện tại tiếp diễn: 'is covering'.",
        explanationVi:
          "'This week' kèm ngữ cảnh thay thế tạm thời → HTTD. 'Covers' sai — đây không phải vai trò cố định của cô ấy.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q13",
        sentence:
          "The quality assurance department _____ all products before they leave the facility.",
        translation:
          "Bộ phận đảm bảo chất lượng luôn chứng nhận tất cả sản phẩm trước khi xuất xưởng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "certifies",
          B: "is certifying",
          C: "has certified",
          D: "certified",
        },
        correct: "A",
        explanation:
          "'Luôn' + quy trình cố định → Hiện tại đơn: 'certifies'. 'Is certifying' sai — đây là thủ tục thường xuyên, không phải hành động đang xảy ra.",
        explanationVi:
          "Thủ tục/quy trình bắt buộc thường xuyên dùng HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q14",
        sentence:
          "Don't interrupt — the trainer _____ the safety procedures to the new recruits at this moment.",
        translation:
          "Đừng làm phiền — người hướng dẫn đang giải thích quy trình an toàn cho nhân viên mới vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "explains",
          B: "is explaining",
          C: "has explained",
          D: "explained",
        },
        correct: "B",
        explanation:
          "'At this moment' (vào lúc này) + 'don't interrupt' = hành động đang diễn ra → Hiện tại tiếp diễn: 'is explaining'.",
        explanationVi:
          "'At this moment' là dấu hiệu HTTD điển hình. 'Explains' sai — đó là thói quen, không phải hành động đang xảy ra.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q15",
        sentence: "The management team _____ that open communication leads to better outcomes.",
        translation:
          "Nhóm quản lý tin rằng giao tiếp cởi mở dẫn đến kết quả tốt hơn.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is believing",
          B: "has believed",
          C: "believes",
          D: "believed",
        },
        correct: "C",
        explanation:
          "'Believe' là động từ trạng thái (stative verb) — không bao giờ dùng -ing. → Hiện tại đơn: 'believes'.",
        explanationVi:
          "'Believe' (tin rằng) là stative verb → chỉ dùng HTĐ, không dùng HTTD. 'Is believing' sai.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q16",
        sentence: "The IT team _____ the server, so please save your work and log out.",
        translation:
          "Nhóm IT đang nâng cấp máy chủ, vì vậy hãy lưu công việc và đăng xuất.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "upgrades",
          B: "has upgraded",
          C: "upgraded",
          D: "is upgrading",
        },
        correct: "D",
        explanation:
          "Hành động đang diễn ra ngay lúc nói (và có yêu cầu save/log out) → Hiện tại tiếp diễn: 'is upgrading'.",
        explanationVi:
          "Hành động bảo trì đang xảy ra ngay bây giờ → HTTD. 'Upgrades' sai — đó là thói quen, không phải hành động đang diễn ra.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q17",
        sentence:
          "This material _____ well in humid conditions, making it ideal for tropical climates.",
        translation:
          "Vật liệu này hoạt động tốt trong điều kiện ẩm ướt, khiến nó lý tưởng cho khí hậu nhiệt đới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "performs",
          B: "is performing",
          C: "has performed",
          D: "performed",
        },
        correct: "A",
        explanation:
          "Sự thật về tính chất sản phẩm (luôn luôn đúng) → Hiện tại đơn: 'performs'. 'Is performing' sai.",
        explanationVi:
          "Tính chất/đặc điểm cố định của vật liệu/sản phẩm dùng HTĐ, không dùng HTTD.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q18",
        sentence:
          "The development team _____ the new features requested by the client this sprint.",
        translation:
          "Nhóm phát triển đang triển khai các tính năng mới theo yêu cầu của khách hàng trong sprint này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "implements",
          B: "is implementing",
          C: "has implemented",
          D: "implemented",
        },
        correct: "B",
        explanation:
          "'This sprint' = khoảng thời gian hiện tại + 'đang triển khai' = hành động đang xảy ra → Hiện tại tiếp diễn: 'is implementing'.",
        explanationVi:
          "'This sprint' (sprint này) + ngữ cảnh đang làm → HTTD. 'Implements' sai — đó là thói quen cố định.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q19",
        sentence:
          "Our refund policy _____ that requests must be made within 30 days of purchase.",
        translation:
          "Chính sách hoàn tiền của chúng tôi quy định rằng yêu cầu phải được thực hiện trong vòng 30 ngày kể từ khi mua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is requiring",
          B: "has required",
          C: "requires",
          D: "required",
        },
        correct: "C",
        explanation:
          "Nội dung chính sách cố định → Hiện tại đơn: 'requires'. 'Is requiring' sai — chính sách không phải đang yêu cầu ngay lúc nói.",
        explanationVi:
          "Chính sách/quy định của tổ chức (cố định) dùng HTĐ. Không dùng HTTD cho nội dung tài liệu.",
      },
      {
        kind: "mcq",
        id: "htd-l5-q20",
        sentence:
          "More employees _____ remote work options since the new policy was introduced.",
        translation:
          "Ngày càng nhiều nhân viên đang chọn hình thức làm việc từ xa kể từ khi chính sách mới được đưa ra.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "choose",
          B: "have chosen",
          C: "chose",
          D: "are choosing",
        },
        correct: "D",
        explanation:
          "'More and more' + 'since the new policy was introduced' = xu hướng đang thay đổi ngay bây giờ → Hiện tại tiếp diễn: 'are choosing'.",
        explanationVi:
          "Xu hướng đang thay đổi/phát triển (không phải thói quen cố định) dùng HTTD. 'Choose' sai.",
      },
    ],
  },

  // ── L6: TOEIC Part 5 ─────────────────────────────────────────────────────────
  {
    level: 6,
    slug: "l6",
    name: "TOEIC Part 5",
    nameEn: "Exam Style",
    description: "Câu hoàn chỉnh đúng định dạng Part 5 — không có gợi ý tiếng Việt.",
    instruction:
      "Làm bài như trong phòng thi TOEIC thật. Không có bản dịch. Chọn đáp án đúng nhất.",
    difficulty: "hard",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "htd-l6-q01",
        sentence:
          "The personnel department _____ all employment contracts at the end of each fiscal year.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "renews",
          B: "is renewing",
          C: "has renewed",
          D: "renewed",
        },
        correct: "A",
        explanation:
          "'At the end of each fiscal year' = tần suất hàng năm → Hiện tại đơn: 'renews' (V-s).",
        explanationVi:
          "Tần suất định kỳ hàng năm → HTĐ. 'Is renewing' sai — đây không phải hành động đang xảy ra.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q02",
        sentence: "Our online store _____ orders 24 hours a day, 7 days a week.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is accepting",
          B: "accepts",
          C: "has accepted",
          D: "accepted",
        },
        correct: "B",
        explanation:
          "'24 hours a day, 7 days a week' = thực tế cố định → Hiện tại đơn: 'accepts' (V-s).",
        explanationVi:
          "Đặc điểm cố định của dịch vụ/hệ thống dùng HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q03",
        sentence:
          "The financial report clearly _____ that profits rose by 12% last quarter.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is indicating",
          B: "has indicated",
          C: "indicates",
          D: "indicated",
        },
        correct: "C",
        explanation:
          "Nội dung báo cáo (văn bản tĩnh) → Hiện tại đơn: 'indicates'. 'Is indicating' sai — báo cáo không phải đang chỉ ra ngay lúc nói.",
        explanationVi:
          "Nội dung tài liệu/báo cáo dùng HTĐ. Đây là quy tắc quan trọng trong TOEIC.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q04",
        sentence: "The shuttle bus _____ at the main entrance every 30 minutes on weekdays.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "was departing",
          B: "is departing",
          C: "has departed",
          D: "departs",
        },
        correct: "D",
        explanation:
          "'Every 30 minutes on weekdays' = lịch trình cố định → Hiện tại đơn: 'departs'.",
        explanationVi:
          "Lịch trình phương tiện đi lại dùng HTĐ trong TOEIC.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q05",
        sentence:
          "The head of logistics _____ responsibility for all incoming and outgoing shipments.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "bears",
          B: "is bearing",
          C: "has borne",
          D: "bore",
        },
        correct: "A",
        explanation:
          "Trách nhiệm cố định trong tổ chức → Hiện tại đơn: 'bears' (V-s). 'Is bearing' sai — đây là vai trò thường xuyên.",
        explanationVi:
          "Vai trò/trách nhiệm trong tổ chức (cố định) dùng HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q06",
        sentence: "Typically, the contract _____ the terms of payment and delivery schedule.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is specifying",
          B: "specifies",
          C: "has specified",
          D: "specified",
        },
        correct: "B",
        explanation:
          "'Typically' (thông thường) = thông lệ + nội dung hợp đồng → Hiện tại đơn: 'specifies'.",
        explanationVi:
          "'Typically' + nội dung tài liệu → HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q07",
        sentence:
          "As part of its quality commitment, the company _____ all products to rigorous testing.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is subjecting",
          B: "has subjected",
          C: "subjects",
          D: "subjected",
        },
        correct: "C",
        explanation:
          "Cam kết/chính sách chất lượng cố định → Hiện tại đơn: 'subjects' (V-s).",
        explanationVi:
          "Cam kết chất lượng thường xuyên của công ty dùng HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q08",
        sentence:
          "The new branch _____ at 9 a.m. sharp on the first of next month.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "was opening",
          B: "has opened",
          C: "is opening",
          D: "opens",
        },
        correct: "D",
        explanation:
          "Sự kiện trong tương lai được lên lịch cố định → Hiện tại đơn: 'opens'. (HTĐ dùng cho kế hoạch đã định trước theo lịch trình.)",
        explanationVi:
          "Kế hoạch/sự kiện đã lên lịch cố định trong tương lai có thể dùng HTĐ trong TOEIC.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q09",
        sentence:
          "The CEO _____ that transparency is the foundation of good corporate governance.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "believes",
          B: "is believing",
          C: "has believed",
          D: "believed",
        },
        correct: "A",
        explanation:
          "'Believe' là stative verb (động từ trạng thái) → không dùng -ing → Hiện tại đơn: 'believes'.",
        explanationVi:
          "'Believe' KHÔNG dùng dạng -ing. Đây là lỗi thường gặp trong TOEIC.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q10",
        sentence:
          "The terms of the lease agreement _____ that the tenant is responsible for minor repairs.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "are stating",
          B: "state",
          C: "have stated",
          D: "stated",
        },
        correct: "B",
        explanation:
          "Nội dung hợp đồng thuê (văn bản tĩnh, chủ ngữ số nhiều 'the terms') → Hiện tại đơn: 'state' (V nguyên thể, số nhiều).",
        explanationVi:
          "Nội dung hợp đồng dùng HTĐ. Chủ ngữ 'the terms' (số nhiều) → 'state', không phải 'states'.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q11",
        sentence: "Each department _____ quarterly reports to the executive committee.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is submitting",
          B: "has submitted",
          C: "submits",
          D: "submitted",
        },
        correct: "C",
        explanation:
          "'Quarterly' (hàng quý) = tần suất định kỳ → Hiện tại đơn: 'submits' (V-s).",
        explanationVi:
          "Tần suất hàng quý → HTĐ. 'Is submitting' sai vì không phải đang nộp ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q12",
        sentence:
          "Errors in financial statements _____ considerable reputational damage to any organization.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "are causing",
          B: "have caused",
          C: "caused",
          D: "cause",
        },
        correct: "D",
        explanation:
          "Sự thật tổng quát về hậu quả → Hiện tại đơn: 'cause' (V nguyên thể, chủ ngữ số nhiều).",
        explanationVi:
          "Sự thật/quy luật chung dùng HTĐ. 'Are causing' sai — đây là quy luật, không phải hành động đang xảy ra.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q13",
        sentence:
          "Our customer service team _____ a satisfaction guarantee on all products and services.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "offers",
          B: "is offering",
          C: "has offered",
          D: "offered",
        },
        correct: "A",
        explanation:
          "Chính sách/cam kết của bộ phận dịch vụ (luôn luôn) → Hiện tại đơn: 'offers' (V-s).",
        explanationVi:
          "Cam kết/dịch vụ cố định dùng HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q14",
        sentence:
          "The warranty _____ that all defective products will be replaced free of charge.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is guaranteeing",
          B: "guarantees",
          C: "has guaranteed",
          D: "guaranteed",
        },
        correct: "B",
        explanation:
          "Nội dung bảo hành (văn bản) → Hiện tại đơn: 'guarantees' (V-s). 'Is guaranteeing' sai.",
        explanationVi:
          "Nội dung phiếu bảo hành dùng HTĐ. Đây là dạng câu TOEIC điển hình.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q15",
        sentence:
          "According to the regulations, all contractors _____ valid insurance at all times.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "are maintaining",
          B: "have maintained",
          C: "maintain",
          D: "maintained",
        },
        correct: "C",
        explanation:
          "'According to the regulations' + 'at all times' = quy định bắt buộc cố định → Hiện tại đơn: 'maintain' (V nguyên thể, số nhiều).",
        explanationVi:
          "Quy định pháp lý dùng HTĐ. 'Are maintaining' sai — đây không phải hành động đang xảy ra.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q16",
        sentence:
          "The company _____ all employees based on merit, regardless of background.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is promoting",
          B: "has promoted",
          C: "promoted",
          D: "promotes",
        },
        correct: "D",
        explanation:
          "Chính sách thăng tiến của công ty (luôn áp dụng) → Hiện tại đơn: 'promotes' (V-s).",
        explanationVi:
          "Chính sách nhân sự cố định dùng HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q17",
        sentence:
          "Our firm _____ full confidentiality for all client information shared during consultations.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "guarantees",
          B: "is guaranteeing",
          C: "has guaranteed",
          D: "guaranteed",
        },
        correct: "A",
        explanation:
          "Cam kết bảo mật cố định của công ty → Hiện tại đơn: 'guarantees' (V-s).",
        explanationVi:
          "Cam kết dịch vụ/bảo mật cố định dùng HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q18",
        sentence: "The employee handbook _____ the procedures for requesting time off.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is outlining",
          B: "outlines",
          C: "has outlined",
          D: "outlined",
        },
        correct: "B",
        explanation:
          "Nội dung sổ tay nhân viên (văn bản tĩnh) → Hiện tại đơn: 'outlines' (V-s).",
        explanationVi:
          "Nội dung tài liệu/sổ tay dùng HTĐ. 'Is outlining' sai — tài liệu không phải đang viết ngay.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q19",
        sentence:
          "A well-functioning team always _____ open channels of communication among its members.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is maintaining",
          B: "has maintained",
          C: "maintains",
          D: "maintained",
        },
        correct: "C",
        explanation:
          "'Always' + sự thật chung về đặc điểm → Hiện tại đơn: 'maintains' (V-s).",
        explanationVi:
          "'Always' + sự thật tổng quát → HTĐ.",
      },
      {
        kind: "mcq",
        id: "htd-l6-q20",
        sentence:
          "The training program _____ participants with the skills needed to advance in their careers.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is equipping",
          B: "has equipped",
          C: "equipped",
          D: "equips",
        },
        correct: "D",
        explanation:
          "Đặc điểm/mục tiêu cố định của chương trình đào tạo → Hiện tại đơn: 'equips' (V-s).",
        explanationVi:
          "Mục tiêu/đặc điểm cố định của chương trình dùng HTĐ.",
      },
    ],
  },
];
