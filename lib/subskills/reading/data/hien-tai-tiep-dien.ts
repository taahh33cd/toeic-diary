import type { Part5Level } from "@/lib/subskills/reading/types";

export const hienTaiTiepDienLevels: Part5Level[] = [
  // ── L1: Tense Recognition ────────────────────────────────────────────────────
  {
    level: 1,
    slug: "l1",
    name: "Nhận diện thì",
    nameEn: "Tense Recognition",
    description: "Đọc câu và xác định đây là thì gì?",
    instruction:
      "Đọc từng câu và chọn tên thì đúng. Chú ý cấu trúc am/is/are + V-ing.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "httd-l1-q01",
        sentence: "She is preparing the quarterly report right now.",
        translation: "Cô ấy đang chuẩn bị báo cáo hàng quý ngay lúc này.",
        grammarHint: "Chú ý: is + preparing (V-ing) → Hiện tại tiếp diễn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Is preparing' = is + V-ing và 'right now' xác nhận hành động đang diễn ra → Hiện tại tiếp diễn.",
        explanationVi:
          "Cấu trúc is/are + V-ing + 'right now' = HTTD điển hình.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q02",
        sentence: "They are discussing the new project proposal at the moment.",
        translation: "Họ đang thảo luận đề xuất dự án mới vào lúc này.",
        grammarHint: "Chú ý: are + discussing (V-ing) + 'at the moment'",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Are discussing' = are + V-ing, 'at the moment' là dấu hiệu HTTD → Hiện tại tiếp diễn.",
        explanationVi:
          "'At the moment' + are + V-ing = HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q03",
        sentence: "The team is working on a new marketing strategy this week.",
        translation: "Nhóm đang làm việc trên chiến lược marketing mới trong tuần này.",
        grammarHint: "'is working' (is + V-ing) + 'this week' → tình huống tạm thời hiện tại",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Is working' = is + V-ing, 'this week' xác nhận tình huống tạm thời đang diễn ra → Hiện tại tiếp diễn.",
        explanationVi:
          "'This week' + is + V-ing = tình huống tạm thời → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q04",
        sentence: "He is attending a conference in Singapore currently.",
        translation: "Anh ấy đang tham dự một hội nghị tại Singapore hiện tại.",
        grammarHint: "'is attending' (is + V-ing) + 'currently' → đang diễn ra",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "D",
        explanation:
          "'Is attending' = is + V-ing, 'currently' xác nhận hành động đang xảy ra → Hiện tại tiếp diễn.",
        explanationVi:
          "'Currently' + is + V-ing = HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q05",
        sentence: "The manager is reviewing the budget forecast at present.",
        translation: "Người quản lý đang xem xét dự báo ngân sách hiện tại.",
        grammarHint: "'is reviewing' (is + V-ing) + 'at present'",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Is reviewing' = is + V-ing, 'at present' là dấu hiệu HTTD → Hiện tại tiếp diễn.",
        explanationVi:
          "'At present' + is + V-ing = HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q06",
        sentence: "We are developing a new app for our customers.",
        translation: "Chúng tôi đang phát triển một ứng dụng mới cho khách hàng.",
        grammarHint: "'are developing' (are + V-ing) → hành động đang trong quá trình",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Are developing' = are + V-ing diễn tả hành động đang trong quá trình thực hiện → Hiện tại tiếp diễn.",
        explanationVi:
          "are + V-ing = HTTD. 'Develops' (HTĐ) sai vì đây là dự án đang tiến hành.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q07",
        sentence: "The company is expanding its operations in Southeast Asia.",
        translation: "Công ty đang mở rộng hoạt động tại Đông Nam Á.",
        grammarHint: "'is expanding' (is + V-ing) → quá trình đang diễn ra",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Is expanding' = is + V-ing diễn tả quá trình mở rộng đang diễn ra hiện nay → Hiện tại tiếp diễn.",
        explanationVi:
          "Quá trình đang xảy ra (chưa hoàn tất) → HTTD. 'Expands' (HTĐ) sai.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q08",
        sentence: "She is training the new interns this month.",
        translation: "Cô ấy đang đào tạo các thực tập sinh mới trong tháng này.",
        grammarHint: "'is training' (is + V-ing) + 'this month' → tình huống tạm thời",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "D",
        explanation:
          "'Is training' = is + V-ing, 'this month' xác nhận tình huống tạm thời trong tháng hiện tại → Hiện tại tiếp diễn.",
        explanationVi:
          "'This month' + is + V-ing = tình huống tạm thời → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q09",
        sentence: "They are renovating the office building these days.",
        translation: "Họ đang cải tạo tòa nhà văn phòng trong thời gian này.",
        grammarHint: "'are renovating' (are + V-ing) + 'these days' → đang diễn ra",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Are renovating' = are + V-ing, 'these days' là dấu hiệu HTTD → Hiện tại tiếp diễn.",
        explanationVi:
          "'These days' + are + V-ing = HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q10",
        sentence: "He is giving a presentation to the board right now.",
        translation: "Anh ấy đang thuyết trình cho hội đồng quản trị ngay lúc này.",
        grammarHint: "'is giving' (is + V-ing) + 'right now'",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Is giving' = is + V-ing, 'right now' xác nhận hành động đang xảy ra → Hiện tại tiếp diễn.",
        explanationVi:
          "'Right now' + is + V-ing = HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q11",
        sentence: "The IT team is installing new software across all computers.",
        translation: "Nhóm IT đang cài đặt phần mềm mới trên tất cả máy tính.",
        grammarHint: "'is installing' (is + V-ing) → hành động đang tiến hành",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Is installing' = is + V-ing diễn tả quá trình đang tiến hành → Hiện tại tiếp diễn.",
        explanationVi:
          "Hành động đang tiến hành (chưa xong) dùng HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q12",
        sentence: "She is negotiating a contract with an overseas supplier.",
        translation: "Cô ấy đang đàm phán hợp đồng với nhà cung cấp nước ngoài.",
        grammarHint: "'is negotiating' (is + V-ing) → đang trong quá trình đàm phán",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "D",
        explanation:
          "'Is negotiating' = is + V-ing diễn tả quá trình đàm phán đang diễn ra → Hiện tại tiếp diễn.",
        explanationVi:
          "Quá trình đang diễn ra (chưa kết thúc) → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q13",
        sentence: "The factory is upgrading its production line this quarter.",
        translation: "Nhà máy đang nâng cấp dây chuyền sản xuất trong quý này.",
        grammarHint: "'is upgrading' (is + V-ing) + 'this quarter'",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Is upgrading' = is + V-ing, 'this quarter' xác nhận tình huống tạm thời → Hiện tại tiếp diễn.",
        explanationVi:
          "'This quarter' + is + V-ing = HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q14",
        sentence: "He is leading the task force on digital transformation.",
        translation: "Anh ấy đang dẫn đầu nhóm đặc nhiệm về chuyển đổi số.",
        grammarHint: "'is leading' (is + V-ing) → vai trò đang đảm nhiệm hiện tại",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Is leading' = is + V-ing diễn tả vai trò đang đảm nhiệm trong thời điểm hiện tại → Hiện tại tiếp diễn.",
        explanationVi:
          "Vai trò/nhiệm vụ đang thực hiện (tạm thời) dùng HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q15",
        sentence: "The sales team is targeting new markets in Asia.",
        translation: "Nhóm bán hàng đang nhắm vào các thị trường mới ở châu Á.",
        grammarHint: "'is targeting' (is + V-ing) → chiến lược đang thực hiện",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Is targeting' = is + V-ing diễn tả chiến lược đang được thực hiện hiện nay → Hiện tại tiếp diễn.",
        explanationVi:
          "Chiến lược/hoạt động đang triển khai → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q16",
        sentence: "She is compiling data for the annual report.",
        translation: "Cô ấy đang tổng hợp dữ liệu cho báo cáo thường niên.",
        grammarHint: "'is compiling' (is + V-ing) → đang trong quá trình",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "D",
        explanation:
          "'Is compiling' = is + V-ing diễn tả quá trình đang thực hiện → Hiện tại tiếp diễn.",
        explanationVi:
          "Công việc đang tiến hành → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q17",
        sentence: "The company is hiring additional staff for the busy season.",
        translation: "Công ty đang tuyển thêm nhân viên cho mùa bận rộn.",
        grammarHint: "'is hiring' (is + V-ing) → hoạt động đang diễn ra",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Is hiring' = is + V-ing diễn tả hoạt động tuyển dụng đang diễn ra → Hiện tại tiếp diễn.",
        explanationVi:
          "Hoạt động đang diễn ra (tuyển dụng) → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q18",
        sentence: "He is coordinating with all department heads this week.",
        translation: "Anh ấy đang phối hợp với tất cả trưởng bộ phận trong tuần này.",
        grammarHint: "'is coordinating' (is + V-ing) + 'this week'",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Is coordinating' = is + V-ing, 'this week' = tạm thời → Hiện tại tiếp diễn.",
        explanationVi:
          "'This week' + is + V-ing = tình huống tạm thời → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q19",
        sentence: "The research team is conducting a survey among customers.",
        translation: "Nhóm nghiên cứu đang tiến hành khảo sát với khách hàng.",
        grammarHint: "'is conducting' (is + V-ing) → nghiên cứu đang tiến hành",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Is conducting' = is + V-ing diễn tả nghiên cứu đang tiến hành → Hiện tại tiếp diễn.",
        explanationVi:
          "Nghiên cứu/khảo sát đang tiến hành dùng HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l1-q20",
        sentence: "She is overseeing the construction of the new branch.",
        translation: "Cô ấy đang giám sát việc xây dựng chi nhánh mới.",
        grammarHint: "'is overseeing' (is + V-ing) → nhiệm vụ đang thực hiện",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "D",
        explanation:
          "'Is overseeing' = is + V-ing diễn tả nhiệm vụ giám sát đang thực hiện → Hiện tại tiếp diễn.",
        explanationVi:
          "Nhiệm vụ/công việc đang thực hiện → HTTD.",
      },
    ],
  },

  // ── L2: Time Markers ─────────────────────────────────────────────────────────
  {
    level: 2,
    slug: "l2",
    name: "Dấu hiệu thời gian",
    nameEn: "Time Markers",
    description: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
    instruction:
      "Bấm vào các từ hoặc cụm từ là dấu hiệu thì. Có thể có nhiều từ trong một câu.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "highlight",
        id: "httd-l2-q01",
        sentence: "She is finalizing the budget proposal now.",
        translation: "Cô ấy đang hoàn thiện đề xuất ngân sách ngay bây giờ.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["now"],
        explanation:
          "'Now' (ngay bây giờ) là time marker điển hình của HTTD — dùng với is/are + V-ing.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q02",
        sentence: "The team is reviewing the contract documents right now.",
        translation: "Nhóm đang xem xét các tài liệu hợp đồng ngay lúc này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["right", "now"],
        explanation:
          "'Right now' (ngay lúc này) là cụm time marker nhấn mạnh hành động đang diễn ra → HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q03",
        sentence: "The company is currently restructuring its supply chain.",
        translation: "Công ty hiện đang tái cơ cấu chuỗi cung ứng của mình.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["currently"],
        explanation:
          "'Currently' (hiện tại/hiện đang) là trạng từ điển hình của HTTD — hành động đang xảy ra.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q04",
        sentence: "He is meeting with potential investors at the moment.",
        translation: "Anh ấy đang gặp các nhà đầu tư tiềm năng vào lúc này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["at", "the", "moment"],
        explanation:
          "'At the moment' (vào lúc này) là cụm time marker điển hình của HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q05",
        sentence: "The board is evaluating three merger proposals at present.",
        translation: "Hội đồng đang đánh giá ba đề xuất sáp nhập hiện tại.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["at", "present"],
        explanation:
          "'At present' (hiện tại) là cụm time marker của HTTD — hành động đang trong quá trình.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q06",
        sentence: "More employees are working remotely these days.",
        translation: "Ngày càng nhiều nhân viên đang làm việc từ xa trong thời gian này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["these", "days"],
        explanation:
          "'These days' (dạo này/những ngày này) là time marker của HTTD khi diễn tả xu hướng/tình huống tạm thời đang thay đổi.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q07",
        sentence: "She is covering for the senior manager this week.",
        translation: "Cô ấy đang làm thay cho quản lý cấp cao trong tuần này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["this", "week"],
        explanation:
          "'This week' (tuần này) là time marker của HTTD khi diễn tả tình huống tạm thời.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q08",
        sentence: "The company is offering a special discount this month.",
        translation: "Công ty đang cung cấp chiết khấu đặc biệt trong tháng này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["this", "month"],
        explanation:
          "'This month' (tháng này) là time marker của HTTD — hoạt động tạm thời trong tháng hiện tại.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q09",
        sentence: "The server is unavailable at this time due to maintenance.",
        translation: "Máy chủ không khả dụng vào lúc này do bảo trì.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["at", "this", "time"],
        explanation:
          "'At this time' (vào lúc này) là cụm time marker của HTTD — tình trạng đang xảy ra ngay lúc này.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q10",
        sentence: "She is processing the refund request now.",
        translation: "Cô ấy đang xử lý yêu cầu hoàn tiền ngay bây giờ.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["now"],
        explanation:
          "'Now' (ngay bây giờ) trước/sau động từ HTTD xác nhận hành động đang diễn ra.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q11",
        sentence: "The logistics team is tracking the shipment right now.",
        translation: "Nhóm hậu cần đang theo dõi lô hàng ngay lúc này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["right", "now"],
        explanation:
          "'Right now' nhấn mạnh hành động đang xảy ra ngay lúc nói → HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q12",
        sentence: "The marketing team is currently running a social media campaign.",
        translation: "Nhóm marketing hiện đang triển khai chiến dịch mạng xã hội.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["currently"],
        explanation:
          "'Currently' trước is/are + V-ing xác nhận hành động đang trong quá trình → HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q13",
        sentence: "I'm afraid he is unavailable — he is in a meeting at the moment.",
        translation: "Xin lỗi anh ấy không rảnh — anh ấy đang trong cuộc họp vào lúc này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["at", "the", "moment"],
        explanation:
          "'At the moment' là cụm time marker mạnh nhất của HTTD trong tiếng Anh giao tiếp và TOEIC.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q14",
        sentence: "The two companies are negotiating a partnership deal at present.",
        translation: "Hai công ty đang đàm phán thỏa thuận hợp tác hiện tại.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["at", "present"],
        explanation:
          "'At present' (hiện tại) báo hiệu quá trình đang diễn ra → HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q15",
        sentence: "Competition in the tech sector is intensifying these days.",
        translation: "Cạnh tranh trong lĩnh vực công nghệ đang ngày càng gay gắt dạo này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["these", "days"],
        explanation:
          "'These days' với xu hướng đang thay đổi → HTTD. Khác với HTĐ dùng cho sự thật cố định.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q16",
        sentence: "He is handling the client's account this week while the manager is away.",
        translation: "Anh ấy đang xử lý tài khoản của khách hàng tuần này trong khi quản lý vắng mặt.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["this", "week"],
        explanation:
          "'This week' + ngữ cảnh thay thế tạm thời → HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q17",
        sentence: "The factory is operating at reduced capacity this month due to shortages.",
        translation: "Nhà máy đang hoạt động với công suất giảm trong tháng này do thiếu hụt.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["this", "month"],
        explanation:
          "'This month' xác nhận tình huống tạm thời (không phải công suất bình thường) → HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q18",
        sentence: "Please hold — all our agents are assisting other customers at this time.",
        translation: "Vui lòng chờ — tất cả nhân viên của chúng tôi đang hỗ trợ khách hàng khác vào lúc này.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["at", "this", "time"],
        explanation:
          "'At this time' trong ngữ cảnh dịch vụ khách hàng = đang xảy ra ngay lúc này → HTTD.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q19",
        sentence: "The director is travelling to the regional offices now.",
        translation: "Giám đốc đang đi công tác đến các văn phòng khu vực ngay bây giờ.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["now"],
        explanation:
          "'Now' sau động từ HTTD cũng là dấu hiệu hành động đang xảy ra.",
      },
      {
        kind: "highlight",
        id: "httd-l2-q20",
        sentence: "The firm is piloting a four-day workweek program this year.",
        translation: "Công ty đang thí điểm chương trình làm việc 4 ngày/tuần trong năm nay.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Hiện tại tiếp diễn.",
        correctWords: ["this", "year"],
        explanation:
          "'This year' với ngữ cảnh thí điểm/tạm thời → HTTD. Khác với 'every year' của HTĐ.",
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
      "Đọc bản dịch tiếng Việt để hiểu ngữ cảnh, rồi chọn dạng động từ phù hợp. Phân biệt 'đang' (HTTD) với 'thường/luôn' (HTĐ).",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "httd-l3-q01",
        sentence: "Sorry, I can't talk now — I _____ a meeting with the regional manager.",
        translation: "Xin lỗi, tôi không thể nói chuyện ngay bây giờ — tôi đang họp với giám đốc khu vực.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "am having",
          B: "have",
          C: "have had",
          D: "was having",
        },
        correct: "A",
        explanation:
          "'Đang họp' + 'ngay bây giờ' = hành động đang diễn ra → HTTD: 'am having' (am + V-ing).",
        explanationVi:
          "'Đang' + 'ngay bây giờ' → HTTD. 'Have' (HTĐ) sai — đó là thói quen.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q02",
        sentence: "They _____ the new product line at the trade fair this week.",
        translation: "Họ đang trưng bày dòng sản phẩm mới tại hội chợ thương mại tuần này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "display",
          B: "are displaying",
          C: "have displayed",
          D: "displayed",
        },
        correct: "B",
        explanation:
          "'Đang trưng bày' + 'tuần này' = tình huống tạm thời đang diễn ra → HTTD: 'are displaying'.",
        explanationVi:
          "'Đang' + 'tuần này' → HTTD. 'Display' (HTĐ) sai — đó là thói quen thường xuyên.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q03",
        sentence: "The company _____ new offices in three cities to expand its regional presence.",
        translation: "Công ty đang mở văn phòng mới ở ba thành phố để mở rộng hiện diện khu vực.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has opened",
          B: "opened",
          C: "is opening",
          D: "opens",
        },
        correct: "C",
        explanation:
          "'Đang mở' = quá trình đang tiến hành → HTTD: 'is opening'.",
        explanationVi:
          "Quá trình đang tiến hành (chưa xong) dùng HTTD. 'Opens' (HTĐ) sai.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q04",
        sentence: "She _____ a secondment at the Singapore branch this quarter.",
        translation: "Cô ấy đang biệt phái tại chi nhánh Singapore trong quý này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "did",
          B: "does",
          C: "has done",
          D: "is doing",
        },
        correct: "D",
        explanation:
          "'Đang biệt phái' + 'quý này' = tình huống tạm thời → HTTD: 'is doing'.",
        explanationVi:
          "'Đang' + 'quý này' → HTTD. 'Does' (HTĐ) sai — đó là thói quen.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q05",
        sentence: "Listen — the CEO _____ his quarterly address to all staff.",
        translation: "Lắng nghe — Giám đốc điều hành đang phát biểu hàng quý đến toàn thể nhân viên.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is delivering",
          B: "delivers",
          C: "has delivered",
          D: "delivered",
        },
        correct: "A",
        explanation:
          "'Listen' (Lắng nghe!) + 'đang phát biểu' → hành động đang xảy ra ngay lúc nói → HTTD: 'is delivering'.",
        explanationVi:
          "'Listen/Look' + 'đang' → HTTD. 'Delivers' sai — đó là tần suất hàng quý.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q06",
        sentence: "The HR policy _____ clear guidelines on leave entitlements for all employees.",
        translation: "Chính sách nhân sự quy định rõ ràng về quyền nghỉ phép cho tất cả nhân viên.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is providing",
          B: "provides",
          C: "has provided",
          D: "provided",
        },
        correct: "B",
        explanation:
          "Nội dung chính sách cố định (không phải đang xảy ra) → HTĐ: 'provides'. 'Is providing' sai.",
        explanationVi:
          "Nội dung tài liệu/chính sách cố định → HTĐ. Đây là câu phân biệt HTĐ vs HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q07",
        sentence: "Due to high demand, the factory _____ overtime shifts this month.",
        translation: "Do nhu cầu cao, nhà máy đang tổ chức ca làm thêm giờ trong tháng này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has run",
          B: "ran",
          C: "is running",
          D: "runs",
        },
        correct: "C",
        explanation:
          "'Đang tổ chức' + 'tháng này' + lý do tạm thời → HTTD: 'is running'.",
        explanationVi:
          "Tình huống tạm thời do nguyên nhân cụ thể + 'tháng này' → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q08",
        sentence: "The two companies _____ a joint venture to enter the Asian market.",
        translation: "Hai công ty đang đàm phán một liên doanh để thâm nhập thị trường châu Á.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "have negotiated",
          B: "negotiate",
          C: "negotiated",
          D: "are negotiating",
        },
        correct: "D",
        explanation:
          "'Đang đàm phán' = quá trình chưa hoàn tất đang diễn ra → HTTD: 'are negotiating'.",
        explanationVi:
          "'Đang đàm phán' → HTTD. 'Negotiate' (HTĐ) sai — đó là thói quen.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q09",
        sentence: "The deadline is tomorrow, so the team _____ hard to finish on time.",
        translation: "Hạn chót là ngày mai, vì vậy nhóm đang làm việc chăm chỉ để hoàn thành đúng hạn.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is working",
          B: "works",
          C: "has worked",
          D: "worked",
        },
        correct: "A",
        explanation:
          "'Đang làm việc' do áp lực thời hạn = hành động đang diễn ra → HTTD: 'is working'.",
        explanationVi:
          "Hành động đang diễn ra vì mục tiêu cụ thể → HTTD. 'Works' (HTĐ) sai.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q10",
        sentence: "Several employees _____ for flexible work arrangements this year.",
        translation: "Một số nhân viên đang đăng ký sắp xếp giờ làm linh hoạt trong năm nay.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "apply",
          B: "are applying",
          C: "have applied",
          D: "applied",
        },
        correct: "B",
        explanation:
          "'Đang đăng ký' + 'năm nay' = hành động đang diễn ra → HTTD: 'are applying'.",
        explanationVi:
          "'Đang' + 'năm nay' → HTTD. 'Apply' (HTĐ) sai — đó là thói quen hàng năm.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q11",
        sentence: "The office _____ a recycling initiative as part of its green campaign at the moment.",
        translation: "Văn phòng đang thực hiện sáng kiến tái chế như một phần của chiến dịch xanh vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has launched",
          B: "launched",
          C: "is launching",
          D: "launches",
        },
        correct: "C",
        explanation:
          "'Đang thực hiện' + 'at the moment' = HTTD: 'is launching'.",
        explanationVi:
          "'At the moment' + 'đang' → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q12",
        sentence: "The consultant _____ the results of the market research this week.",
        translation: "Chuyên gia tư vấn đang phân tích kết quả nghiên cứu thị trường trong tuần này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "analyzed",
          B: "has analyzed",
          C: "analyzes",
          D: "is analyzing",
        },
        correct: "D",
        explanation:
          "'Đang phân tích' + 'tuần này' = HTTD: 'is analyzing'.",
        explanationVi:
          "'Đang' + 'tuần này' → HTTD. 'Analyzes' (HTĐ) sai.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q13",
        sentence: "Right now, the legal team _____ the terms of the acquisition agreement.",
        translation: "Ngay lúc này, nhóm pháp lý đang xem xét các điều khoản của thỏa thuận mua lại.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is reviewing",
          B: "reviews",
          C: "has reviewed",
          D: "reviewed",
        },
        correct: "A",
        explanation:
          "'Right now' + 'đang xem xét' = HTTD: 'is reviewing'.",
        explanationVi:
          "'Right now' là dấu hiệu mạnh nhất của HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q14",
        sentence: "Our logistics partner usually _____ deliveries within 48 hours of dispatch.",
        translation: "Đối tác hậu cần của chúng tôi thường hoàn tất giao hàng trong vòng 48 giờ sau khi xuất kho.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is completing",
          B: "completes",
          C: "has completed",
          D: "completed",
        },
        correct: "B",
        explanation:
          "'Usually' (thường) = trạng từ tần suất → HTĐ: 'completes' (V-s). 'Is completing' sai.",
        explanationVi:
          "'Thường' + V-s = HTĐ. Đây là câu phân biệt HTTD vs HTĐ.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q15",
        sentence: "The annual budget _____ by the finance committee at the moment.",
        translation: "Ngân sách hàng năm đang được xem xét bởi ủy ban tài chính vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has been reviewed",
          B: "reviewed",
          C: "is being reviewed",
          D: "is reviewed",
        },
        correct: "C",
        explanation:
          "'Đang được xem xét' (bị động) + 'at the moment' → HTTD bị động: 'is being reviewed'.",
        explanationVi:
          "Bị động HTTD = is/are + being + V3. 'Is reviewed' là bị động HTĐ — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q16",
        sentence: "The CEO _____ the restructuring plan with the board of directors today.",
        translation: "Giám đốc điều hành đang thảo luận kế hoạch tái cơ cấu với hội đồng quản trị hôm nay.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has discussed",
          B: "discusses",
          C: "discussed",
          D: "is discussing",
        },
        correct: "D",
        explanation:
          "'Đang thảo luận' + 'hôm nay' (tình huống cụ thể) → HTTD: 'is discussing'.",
        explanationVi:
          "'Đang' + 'hôm nay' (không phải thường xuyên) → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q17",
        sentence: "These days, many firms _____ artificial intelligence to improve efficiency.",
        translation: "Hiện nay, nhiều công ty đang áp dụng trí tuệ nhân tạo để cải thiện hiệu quả.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "are adopting",
          B: "adopt",
          C: "have adopted",
          D: "adopted",
        },
        correct: "A",
        explanation:
          "'These days' + 'đang áp dụng' = xu hướng đang thay đổi → HTTD: 'are adopting'.",
        explanationVi:
          "'These days' với xu hướng đang thay đổi → HTTD. 'Adopt' (HTĐ) sai.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q18",
        sentence: "The supervisor _____ each team member's performance every month.",
        translation: "Người giám sát đánh giá hiệu suất của từng thành viên nhóm mỗi tháng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is assessing",
          B: "assesses",
          C: "has assessed",
          D: "assessed",
        },
        correct: "B",
        explanation:
          "'Every month' (mỗi tháng) = tần suất → HTĐ: 'assesses' (V-s). 'Is assessing' sai.",
        explanationVi:
          "'Every month' → HTĐ. Không phải HTTD vì đây là thói quen định kỳ.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q19",
        sentence: "She _____ a training workshop on data privacy for new staff this week.",
        translation: "Cô ấy đang tổ chức hội thảo đào tạo về quyền riêng tư dữ liệu cho nhân viên mới trong tuần này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has run",
          B: "runs",
          C: "is running",
          D: "ran",
        },
        correct: "C",
        explanation:
          "'Đang tổ chức' + 'tuần này' → HTTD: 'is running'.",
        explanationVi:
          "'Đang' + 'tuần này' → HTTD. 'Runs' (HTĐ) sai.",
      },
      {
        kind: "mcq",
        id: "httd-l3-q20",
        sentence: "Currently, the company _____ a pilot program to test the new performance review system.",
        translation: "Hiện tại, công ty đang triển khai chương trình thí điểm để thử nghiệm hệ thống đánh giá hiệu suất mới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has piloted",
          B: "pilots",
          C: "piloted",
          D: "is piloting",
        },
        correct: "D",
        explanation:
          "'Currently' + 'đang triển khai' → HTTD: 'is piloting'.",
        explanationVi:
          "'Currently' + 'đang' → HTTD. 'Pilots' (HTĐ) sai.",
      },
    ],
  },

  // ── L4: Active + Passive ──────────────────────────────────────────────────────
  {
    level: 4,
    slug: "l4",
    name: "Chia động từ",
    nameEn: "Verb Form",
    description: "Chọn dạng động từ đúng (chủ động và bị động HTTD).",
    instruction:
      "Chú ý chủ ngữ câu: nếu chủ ngữ thực hiện hành động → Active (is/are + V-ing). Nếu chủ ngữ nhận hành động → Passive (is/are + being + V3).",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "httd-l4-q01",
        sentence: "The engineer _____ the new software on all workstations right now.",
        translation: "Kỹ sư đang cài đặt phần mềm mới trên tất cả máy tính ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is installing",
          B: "is being installed",
          C: "installs",
          D: "was installing",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the engineer' tự thực hiện → Active HTTD: 'is installing' (is + V-ing).",
        explanationVi:
          "Kỹ sư TỰ cài đặt → chủ động HTTD. 'Is being installed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q02",
        sentence: "The new software _____ on all workstations by the engineer right now.",
        translation: "Phần mềm mới đang được cài đặt trên tất cả máy tính bởi kỹ sư ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is installing",
          B: "is being installed",
          C: "installs",
          D: "was installed",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the new software' nhận hành động + 'by the engineer' → Passive HTTD: 'is being installed'.",
        explanationVi:
          "Phần mềm 'đang được cài đặt' → bị động HTTD: is being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q03",
        sentence: "The CEO _____ a keynote speech at the industry summit at the moment.",
        translation: "Giám đốc điều hành đang phát biểu chủ đề tại hội nghị ngành vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is being delivered",
          B: "has delivered",
          C: "is delivering",
          D: "delivered",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the CEO' tự thực hiện → Active HTTD: 'is delivering'.",
        explanationVi:
          "CEO TỰ phát biểu → chủ động HTTD. 'Is being delivered' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q04",
        sentence: "A keynote speech _____ by the CEO at the industry summit at the moment.",
        translation: "Một bài phát biểu chủ đề đang được thuyết trình bởi CEO tại hội nghị vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "delivers",
          B: "is delivering",
          C: "has delivered",
          D: "is being delivered",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'a keynote speech' nhận hành động → Passive HTTD: 'is being delivered'.",
        explanationVi:
          "Bài phát biểu 'đang được thuyết trình' → bị động HTTD: is being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q05",
        sentence: "The marketing team _____ the new advertising campaign this month.",
        translation: "Nhóm marketing đang thiết kế chiến dịch quảng cáo mới trong tháng này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is designing",
          B: "is being designed",
          C: "designs",
          D: "designed",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the marketing team' tự thực hiện → Active HTTD: 'is designing'.",
        explanationVi:
          "Nhóm marketing TỰ thiết kế → chủ động HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q06",
        sentence: "The new advertising campaign _____ by the marketing team this month.",
        translation: "Chiến dịch quảng cáo mới đang được thiết kế bởi nhóm marketing trong tháng này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is designing",
          B: "is being designed",
          C: "designed",
          D: "has designed",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the new advertising campaign' nhận hành động → Passive HTTD: 'is being designed'.",
        explanationVi:
          "Chiến dịch 'đang được thiết kế' → bị động HTTD: is being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q07",
        sentence: "She _____ the financial data for the quarterly review right now.",
        translation: "Cô ấy đang phân tích dữ liệu tài chính cho đánh giá hàng quý ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is being analyzed",
          B: "has analyzed",
          C: "is analyzing",
          D: "analyzed",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'she' tự phân tích → Active HTTD: 'is analyzing'.",
        explanationVi:
          "Cô ấy TỰ phân tích → chủ động HTTD. 'Is being analyzed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q08",
        sentence: "The financial data _____ by her for the quarterly review right now.",
        translation: "Dữ liệu tài chính đang được phân tích bởi cô ấy cho đánh giá hàng quý ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "analyzes",
          B: "is analyzing",
          C: "has been analyzed",
          D: "is being analyzed",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the financial data' nhận hành động → Passive HTTD: 'is being analyzed'.",
        explanationVi:
          "Dữ liệu 'đang được phân tích' → bị động HTTD: is being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q09",
        sentence: "The IT department _____ the company's cybersecurity systems these days.",
        translation: "Bộ phận IT đang nâng cấp hệ thống an ninh mạng của công ty dạo này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is upgrading",
          B: "is being upgraded",
          C: "upgrades",
          D: "upgraded",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the IT department' tự thực hiện → Active HTTD: 'is upgrading'.",
        explanationVi:
          "Bộ phận IT TỰ nâng cấp → chủ động HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q10",
        sentence: "The company's cybersecurity systems _____ by the IT department these days.",
        translation: "Hệ thống an ninh mạng của công ty đang được nâng cấp bởi bộ phận IT dạo này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "upgrades",
          B: "are being upgraded",
          C: "are upgrading",
          D: "have been upgraded",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'cybersecurity systems' (số nhiều) nhận hành động → Passive HTTD: 'are being upgraded'.",
        explanationVi:
          "Hệ thống 'đang được nâng cấp' → bị động HTTD số nhiều: are being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q11",
        sentence: "The project manager _____ the weekly progress report at the moment.",
        translation: "Quản lý dự án đang chuẩn bị báo cáo tiến độ hàng tuần vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is being prepared",
          B: "prepared",
          C: "is preparing",
          D: "prepares",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the project manager' tự thực hiện → Active HTTD: 'is preparing'.",
        explanationVi:
          "Quản lý TỰ chuẩn bị → chủ động HTTD. 'Is being prepared' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q12",
        sentence: "The weekly progress report _____ by the project manager at the moment.",
        translation: "Báo cáo tiến độ hàng tuần đang được chuẩn bị bởi quản lý dự án vào lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "prepares",
          B: "is preparing",
          C: "has prepared",
          D: "is being prepared",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the weekly progress report' nhận hành động → Passive HTTD: 'is being prepared'.",
        explanationVi:
          "Báo cáo 'đang được chuẩn bị' → bị động HTTD: is being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q13",
        sentence: "The development team _____ new features for the mobile app this sprint.",
        translation: "Nhóm phát triển đang xây dựng các tính năng mới cho ứng dụng di động trong sprint này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is building",
          B: "is being built",
          C: "builds",
          D: "built",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the development team' tự thực hiện → Active HTTD: 'is building'.",
        explanationVi:
          "Nhóm TỰ xây dựng → chủ động HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q14",
        sentence: "New features for the mobile app _____ by the development team this sprint.",
        translation: "Các tính năng mới cho ứng dụng di động đang được xây dựng bởi nhóm phát triển trong sprint này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "builds",
          B: "are being built",
          C: "is being built",
          D: "have built",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'new features' (số nhiều) nhận hành động → Passive HTTD: 'are being built'.",
        explanationVi:
          "Tính năng 'đang được xây dựng' → bị động HTTD số nhiều: are being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q15",
        sentence: "The HR manager _____ performance review forms to all departments right now.",
        translation: "Quản lý nhân sự đang gửi biểu mẫu đánh giá hiệu suất đến tất cả bộ phận ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is being sent",
          B: "sent",
          C: "is sending",
          D: "sends",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the HR manager' tự gửi → Active HTTD: 'is sending'.",
        explanationVi:
          "HR manager TỰ gửi → chủ động HTTD. 'Is being sent' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q16",
        sentence: "Performance review forms _____ to all departments by the HR manager right now.",
        translation: "Biểu mẫu đánh giá hiệu suất đang được gửi đến tất cả bộ phận bởi quản lý nhân sự ngay lúc này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "send",
          B: "is sending",
          C: "have sent",
          D: "are being sent",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'performance review forms' (số nhiều) nhận hành động → Passive HTTD: 'are being sent'.",
        explanationVi:
          "Biểu mẫu 'đang được gửi' → bị động HTTD số nhiều: are being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q17",
        sentence: "The research team _____ the customer survey data currently.",
        translation: "Nhóm nghiên cứu đang xử lý dữ liệu khảo sát khách hàng hiện tại.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is processing",
          B: "is being processed",
          C: "processes",
          D: "processed",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the research team' tự xử lý → Active HTTD: 'is processing'.",
        explanationVi:
          "Nhóm TỰ xử lý → chủ động HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q18",
        sentence: "The customer survey data _____ by the research team currently.",
        translation: "Dữ liệu khảo sát khách hàng đang được xử lý bởi nhóm nghiên cứu hiện tại.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "processes",
          B: "is being processed",
          C: "is processing",
          D: "has processed",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the customer survey data' (số ít/không đếm được) nhận hành động → Passive HTTD: 'is being processed'.",
        explanationVi:
          "Dữ liệu 'đang được xử lý' → bị động HTTD: is being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q19",
        sentence: "The operations director _____ a new supply chain strategy at present.",
        translation: "Giám đốc vận hành đang phát triển chiến lược chuỗi cung ứng mới hiện tại.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is being developed",
          B: "develops",
          C: "is developing",
          D: "developed",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the operations director' tự thực hiện → Active HTTD: 'is developing'.",
        explanationVi:
          "Giám đốc TỰ phát triển → chủ động HTTD. 'Is being developed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l4-q20",
        sentence: "A new supply chain strategy _____ by the operations director at present.",
        translation: "Một chiến lược chuỗi cung ứng mới đang được phát triển bởi giám đốc vận hành hiện tại.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "develops",
          B: "is developing",
          C: "has developed",
          D: "is being developed",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'a new supply chain strategy' nhận hành động → Passive HTTD: 'is being developed'.",
        explanationVi:
          "Chiến lược 'đang được phát triển' → bị động HTTD: is being + V3.",
      },
    ],
  },

  // ── L5: Tense Discrimination ─────────────────────────────────────────────────
  {
    level: 5,
    slug: "l5",
    name: "Phân biệt 2 thì",
    nameEn: "Tense Discrimination",
    description: "Phân biệt Hiện tại tiếp diễn với Hiện tại đơn (trường hợp khó).",
    instruction:
      "Chú ý: động từ trạng thái (know, believe, contain...) KHÔNG dùng HTTD. Tình huống tạm thời → HTTD; sự thật/thói quen cố định → HTĐ.",
    difficulty: "hard",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "httd-l5-q01",
        sentence: "The board _____ that cost-cutting measures are necessary for long-term survival.",
        translation: "Hội đồng cho rằng các biện pháp cắt giảm chi phí là cần thiết cho sự tồn tại lâu dài.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "believes",
          B: "is believing",
          C: "has believed",
          D: "believed",
        },
        correct: "A",
        explanation:
          "'Believe' là stative verb (động từ trạng thái) — không bao giờ dùng -ing → HTĐ: 'believes'.",
        explanationVi:
          "'Believe' là stative verb → chỉ dùng HTĐ, không dùng HTTD. 'Is believing' luôn sai.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q02",
        sentence: "The number of remote workers _____ rapidly as more companies adopt flexible policies.",
        translation: "Số lượng người làm việc từ xa đang tăng nhanh chóng khi nhiều công ty áp dụng chính sách linh hoạt.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "grows",
          B: "is growing",
          C: "has grown",
          D: "grew",
        },
        correct: "B",
        explanation:
          "Xu hướng đang thay đổi (không phải sự thật cố định) → HTTD: 'is growing'.",
        explanationVi:
          "Xu hướng đang phát triển/thay đổi → HTTD. 'Grows' (HTĐ) sai — đó là sự thật cố định.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q03",
        sentence: "The annual conference _____ at the Grand Hotel on the 15th of every November.",
        translation: "Hội nghị thường niên diễn ra tại Khách sạn Grand vào ngày 15 tháng 11 hàng năm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is taking place",
          B: "has taken place",
          C: "takes place",
          D: "took place",
        },
        correct: "C",
        explanation:
          "Lịch trình cố định hàng năm → HTĐ: 'takes place'. 'Is taking place' sai — đây không phải hành động đang xảy ra ngay lúc nói.",
        explanationVi:
          "Lịch trình thường niên cố định → HTĐ. HTTD chỉ dùng khi hội nghị đang diễn ra ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q04",
        sentence: "The finance department _____ in the basement while the main office is renovated.",
        translation: "Bộ phận tài chính đang làm việc ở tầng hầm trong khi văn phòng chính được cải tạo.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "works",
          B: "has worked",
          C: "worked",
          D: "is working",
        },
        correct: "D",
        explanation:
          "'While the main office is renovated' = tình huống tạm thời đang diễn ra → HTTD: 'is working'.",
        explanationVi:
          "'While...' + ngữ cảnh tạm thời → HTTD. 'Works' sai — đó là nơi làm việc cố định.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q05",
        sentence: "The sales manager _____ all the key clients by name and remembers their preferences.",
        translation: "Giám đốc bán hàng biết tất cả khách hàng chủ chốt bằng tên và nhớ sở thích của họ.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "knows",
          B: "is knowing",
          C: "has known",
          D: "knew",
        },
        correct: "A",
        explanation:
          "'Know' là stative verb — không dùng -ing → HTĐ: 'knows'.",
        explanationVi:
          "'Know' (biết) là stative verb → HTĐ. 'Is knowing' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q06",
        sentence: "She _____ a presentation to the investors next Tuesday — she's been preparing for weeks.",
        translation: "Cô ấy sẽ thuyết trình cho các nhà đầu tư vào thứ Ba tuần tới — cô ấy đã chuẩn bị nhiều tuần.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "gives",
          B: "is giving",
          C: "has given",
          D: "gave",
        },
        correct: "B",
        explanation:
          "Kế hoạch đã sắp xếp sẵn cho tương lai gần → HTTD: 'is giving'. (HTTD dùng cho kế hoạch đã định trước.)",
        explanationVi:
          "HTTD có thể dùng cho kế hoạch cụ thể đã sắp xếp trong tương lai gần. 'Gives' (HTĐ) sai.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q07",
        sentence: "In most organizations, the accounting department _____ directly to the CFO.",
        translation: "Trong hầu hết các tổ chức, bộ phận kế toán báo cáo trực tiếp lên CFO.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is reporting",
          B: "has reported",
          C: "reports",
          D: "reported",
        },
        correct: "C",
        explanation:
          "Sự thật tổng quát về cơ cấu tổ chức → HTĐ: 'reports'. 'Is reporting' sai — đây không phải tình huống tạm thời.",
        explanationVi:
          "Cơ cấu tổ chức cố định → HTĐ. HTTD chỉ dùng khi đang báo cáo ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q08",
        sentence: "The company _____ its pricing structure in response to rising production costs.",
        translation: "Công ty đang xem xét lại cơ cấu giá do chi phí sản xuất tăng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "reviews",
          B: "has reviewed",
          C: "reviewed",
          D: "is reviewing",
        },
        correct: "D",
        explanation:
          "'In response to rising costs' = phản ứng tạm thời với thay đổi → HTTD: 'is reviewing'.",
        explanationVi:
          "Phản ứng tạm thời trước thay đổi bên ngoài → HTTD. 'Reviews' sai — đó là thói quen định kỳ.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q09",
        sentence: "Each package _____ a user manual, a warranty card, and all necessary accessories.",
        translation: "Mỗi gói hàng chứa một hướng dẫn sử dụng, phiếu bảo hành, và tất cả phụ kiện cần thiết.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "contains",
          B: "is containing",
          C: "has contained",
          D: "contained",
        },
        correct: "A",
        explanation:
          "'Contain' là stative verb — không dùng -ing → HTĐ: 'contains'.",
        explanationVi:
          "'Contain' (chứa) là stative verb → HTĐ. 'Is containing' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q10",
        sentence: "The head of sales _____ the Southeast Asia region this month while the director is on leave.",
        translation: "Trưởng bộ phận bán hàng đang phụ trách khu vực Đông Nam Á trong tháng này trong khi giám đốc nghỉ phép.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "covers",
          B: "is covering",
          C: "has covered",
          D: "covered",
        },
        correct: "B",
        explanation:
          "'This month' + 'while the director is on leave' = tình huống thay thế tạm thời → HTTD: 'is covering'.",
        explanationVi:
          "Thay thế tạm thời có thời hạn rõ ràng → HTTD. 'Covers' sai — đó không phải vai trò cố định.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q11",
        sentence: "The conveyor belt _____ items at a speed of 30 units per minute under normal conditions.",
        translation: "Băng chuyền vận chuyển hàng với tốc độ 30 đơn vị mỗi phút trong điều kiện bình thường.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is moving",
          B: "has moved",
          C: "moves",
          D: "moved",
        },
        correct: "C",
        explanation:
          "Thông số kỹ thuật cố định 'under normal conditions' → HTĐ: 'moves'. 'Is moving' sai.",
        explanationVi:
          "Thông số/đặc điểm kỹ thuật cố định → HTĐ. HTTD chỉ dùng khi băng chuyền đang chạy và muốn nhấn mạnh thời điểm đó.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q12",
        sentence: "Look — the construction crew _____ the concrete foundation for the new office building.",
        translation: "Nhìn kìa — đội thi công đang đổ nền móng bê tông cho tòa văn phòng mới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "pours",
          B: "has poured",
          C: "poured",
          D: "is pouring",
        },
        correct: "D",
        explanation:
          "'Look' (Nhìn kìa!) → hành động đang diễn ra ngay trước mắt → HTTD: 'is pouring'.",
        explanationVi:
          "'Look/Listen' đầu câu báo hiệu hành động đang xảy ra ngay lúc quan sát → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q13",
        sentence: "We _____ your concern about the delay, but supply chain disruptions are unavoidable.",
        translation: "Chúng tôi hiểu mối lo ngại của bạn về sự chậm trễ, nhưng gián đoạn chuỗi cung ứng là không thể tránh khỏi.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "understand",
          B: "are understanding",
          C: "have understood",
          D: "understood",
        },
        correct: "A",
        explanation:
          "'Understand' là stative verb — không dùng -ing → HTĐ: 'understand'.",
        explanationVi:
          "'Understand' (hiểu) là stative verb → HTĐ. 'Are understanding' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q14",
        sentence: "The retail industry _____ significantly as consumers shift from in-store to online shopping.",
        translation: "Ngành bán lẻ đang thay đổi đáng kể khi người tiêu dùng chuyển từ mua sắm tại cửa hàng sang trực tuyến.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "changes",
          B: "is changing",
          C: "has changed",
          D: "changed",
        },
        correct: "B",
        explanation:
          "Ngành đang chuyển đổi (quá trình đang xảy ra, không phải sự thật cố định) → HTTD: 'is changing'.",
        explanationVi:
          "Sự biến đổi đang diễn ra trong ngành → HTTD. 'Changes' sai — đó là sự thật cố định.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q15",
        sentence: "Most executives _____ face-to-face meetings for major contract negotiations.",
        translation: "Hầu hết các giám đốc điều hành thích gặp mặt trực tiếp hơn cho các cuộc đàm phán hợp đồng lớn.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "are preferring",
          B: "have preferred",
          C: "prefer",
          D: "preferred",
        },
        correct: "C",
        explanation:
          "'Prefer' là stative verb — không dùng -ing → HTĐ: 'prefer'.",
        explanationVi:
          "'Prefer' (thích hơn) là stative verb → HTĐ. 'Are preferring' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q16",
        sentence: "The accountant _____ the year-end financial statements and won't be available until next week.",
        translation: "Kế toán đang hoàn thiện báo cáo tài chính cuối năm và sẽ không rảnh đến tuần sau.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "finalizes",
          B: "has finalized",
          C: "finalized",
          D: "is finalizing",
        },
        correct: "D",
        explanation:
          "Hành động đang bận ngay lúc nói (và lý do không rảnh) → HTTD: 'is finalizing'.",
        explanationVi:
          "Lý do không rảnh = đang làm gì đó ngay lúc này → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q17",
        sentence: "This product _____ of three components that must be assembled before use.",
        translation: "Sản phẩm này bao gồm ba thành phần phải được lắp ráp trước khi sử dụng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "consists",
          B: "is consisting",
          C: "has consisted",
          D: "consisted",
        },
        correct: "A",
        explanation:
          "'Consist of' là stative verb — không dùng -ing → HTĐ: 'consists'.",
        explanationVi:
          "'Consist of' (bao gồm) là stative verb → HTĐ. 'Is consisting' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q18",
        sentence: "The CEO _____ the company's five-year plan at the annual investor day next week.",
        translation: "Giám đốc điều hành sẽ trình bày kế hoạch 5 năm của công ty tại ngày nhà đầu tư thường niên tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "presents",
          B: "is presenting",
          C: "has presented",
          D: "presented",
        },
        correct: "B",
        explanation:
          "Kế hoạch đã sắp xếp cụ thể cho tương lai gần → HTTD: 'is presenting'. (Khác với lịch trình cố định dùng HTĐ.)",
        explanationVi:
          "Kế hoạch cá nhân đã được lên lịch → HTTD. 'Presents' (HTĐ lịch trình) cũng đúng nhưng HTTD phổ biến hơn cho kế hoạch của người.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q19",
        sentence: "The supply ship _____ at the port every Tuesday morning according to the timetable.",
        translation: "Tàu vận chuyển hàng đến cảng mỗi sáng thứ Ba theo lịch trình.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is arriving",
          B: "has arrived",
          C: "arrives",
          D: "arrived",
        },
        correct: "C",
        explanation:
          "'Every Tuesday morning according to the timetable' = lịch trình cố định → HTĐ: 'arrives'. 'Is arriving' sai.",
        explanationVi:
          "Lịch trình phương tiện vận tải (timetable) → HTĐ. 'Is arriving' sai trừ khi tàu đang đến ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "httd-l5-q20",
        sentence: "She _____ calls right now, but she'll be free after 3 p.m.",
        translation: "Cô ấy đang nhận cuộc gọi ngay bây giờ, nhưng cô ấy sẽ rảnh sau 3 giờ chiều.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "takes",
          B: "has taken",
          C: "took",
          D: "is taking",
        },
        correct: "D",
        explanation:
          "'Right now' + hành động đang bận → HTTD: 'is taking'.",
        explanationVi:
          "'Right now' = HTTD điển hình. 'Takes' (HTĐ) sai — đó là thói quen.",
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
        id: "httd-l6-q01",
        sentence: "Everyone in the department _____ exactly what their responsibilities are.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "knows",
          B: "is knowing",
          C: "has known",
          D: "knew",
        },
        correct: "A",
        explanation:
          "'Know' là stative verb — không dùng -ing → HTĐ: 'knows'.",
        explanationVi:
          "'Know' là stative verb → HTĐ. 'Is knowing' luôn sai trong TOEIC.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q02",
        sentence: "The company _____ its product line to include eco-friendly packaging options.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "expands",
          B: "is expanding",
          C: "has expanded",
          D: "expanded",
        },
        correct: "B",
        explanation:
          "Quá trình mở rộng đang diễn ra (không phải sự thật cố định) → HTTD: 'is expanding'.",
        explanationVi:
          "Quá trình đang tiến hành → HTTD. 'Expands' sai — đó là đặc điểm cố định.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q03",
        sentence: "The board of directors _____ quarterly, with the next session scheduled for March.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is meeting",
          B: "has met",
          C: "meets",
          D: "met",
        },
        correct: "C",
        explanation:
          "'Quarterly' = tần suất cố định → HTĐ: 'meets'. 'Is meeting' sai — hội đồng không phải đang họp ngay lúc nói.",
        explanationVi:
          "Tần suất cố định (quarterly) → HTĐ.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q04",
        sentence: "The new safety protocols _____ by all employees across all departments this month.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "implement",
          B: "have implemented",
          C: "are implemented",
          D: "are being implemented",
        },
        correct: "D",
        explanation:
          "'This month' + bị động đang diễn ra → Passive HTTD: 'are being implemented'.",
        explanationVi:
          "Bị động HTTD = are being + V3. 'Are implemented' là bị động HTĐ — sai.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q05",
        sentence: "The consulting firm _____ a comprehensive review of our IT infrastructure currently.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is conducting",
          B: "conducts",
          C: "has conducted",
          D: "conducted",
        },
        correct: "A",
        explanation:
          "'Currently' + đang tiến hành → HTTD: 'is conducting'.",
        explanationVi:
          "'Currently' + active HTTD = is + V-ing.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q06",
        sentence: "This equipment _____ to the R&D department and is not available for general use.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is belonging",
          B: "belongs",
          C: "has belonged",
          D: "belonged",
        },
        correct: "B",
        explanation:
          "'Belong' là stative verb — không dùng -ing → HTĐ: 'belongs'.",
        explanationVi:
          "'Belong' (thuộc về) là stative verb → HTĐ. 'Is belonging' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q07",
        sentence: "More businesses _____ cloud-based solutions for data management these days.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "adopt",
          B: "have adopted",
          C: "are adopting",
          D: "adopted",
        },
        correct: "C",
        explanation:
          "'These days' + xu hướng đang thay đổi → HTTD: 'are adopting'.",
        explanationVi:
          "'These days' + trend đang thay đổi → HTTD. 'Adopt' sai — đó là sự thật cố định.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q08",
        sentence: "The international trade show _____ every two years in Geneva.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is being held",
          B: "is holding",
          C: "has been held",
          D: "is held",
        },
        correct: "D",
        explanation:
          "'Every two years' = tần suất cố định → Passive HTĐ: 'is held'. 'Is being held' là HTTD bị động — sai.",
        explanationVi:
          "Lịch trình định kỳ bị động → is held (HTĐ bị động). 'Is being held' chỉ đúng khi hội chợ đang diễn ra ngay lúc nói.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q09",
        sentence: "At this moment, senior management _____ a strategic review of all operational expenses.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is conducting",
          B: "conducts",
          C: "has conducted",
          D: "conducted",
        },
        correct: "A",
        explanation:
          "'At this moment' + hành động đang diễn ra → HTTD: 'is conducting'.",
        explanationVi:
          "'At this moment' là dấu hiệu mạnh của HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q10",
        sentence: "The position _____ at least five years of relevant industry experience.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is requiring",
          B: "requires",
          C: "has required",
          D: "required",
        },
        correct: "B",
        explanation:
          "'Require' là stative verb trong ngữ cảnh này (yêu cầu cố định của vị trí) → HTĐ: 'requires'.",
        explanationVi:
          "Yêu cầu cố định của vị trí → HTĐ. 'Is requiring' sai.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q11",
        sentence: "The company's IT systems _____ by the technical team to improve performance right now.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "upgraded",
          B: "are upgrading",
          C: "are being upgraded",
          D: "upgrade",
        },
        correct: "C",
        explanation:
          "'Right now' + bị động đang xảy ra → Passive HTTD: 'are being upgraded'.",
        explanationVi:
          "Bị động HTTD số nhiều = are being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q12",
        sentence: "Our company _____ all employees with health insurance and other non-cash benefits.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is providing",
          B: "has provided",
          C: "provided",
          D: "provides",
        },
        correct: "D",
        explanation:
          "Chính sách phúc lợi cố định của công ty → HTĐ: 'provides'. 'Is providing' sai.",
        explanationVi:
          "Phúc lợi/chính sách cố định → HTĐ.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q13",
        sentence: "Currently, the legal team _____ the acquisition agreement for any potential issues.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is reviewing",
          B: "reviews",
          C: "has reviewed",
          D: "reviewed",
        },
        correct: "A",
        explanation:
          "'Currently' + đang xem xét → HTTD: 'is reviewing'.",
        explanationVi:
          "'Currently' + active HTTD = is + V-ing.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q14",
        sentence: "The project _____ additional funding before it can move to the next phase.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is needing",
          B: "needs",
          C: "has needed",
          D: "needed",
        },
        correct: "B",
        explanation:
          "'Need' là stative verb — không dùng -ing → HTĐ: 'needs'.",
        explanationVi:
          "'Need' (cần) là stative verb → HTĐ. 'Is needing' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q15",
        sentence: "The committee _____ applications from qualified candidates at present.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has accepted",
          B: "accepted",
          C: "is accepting",
          D: "accepts",
        },
        correct: "C",
        explanation:
          "'At present' + đang tiếp nhận → HTTD: 'is accepting'.",
        explanationVi:
          "'At present' + active HTTD = is + V-ing.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q16",
        sentence: "Rising raw material costs generally _____ profit margins in the manufacturing sector.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "are reducing",
          B: "are reduced",
          C: "have reduced",
          D: "reduce",
        },
        correct: "D",
        explanation:
          "'Generally' + sự thật tổng quát → HTĐ: 'reduce'. 'Are reducing' sai — đây là quy luật, không phải đang xảy ra.",
        explanationVi:
          "'Generally' + sự thật chung → HTĐ.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q17",
        sentence: "New production equipment _____ for delivery to the main facility this month.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is being prepared",
          B: "has been prepared",
          C: "prepares",
          D: "was prepared",
        },
        correct: "A",
        explanation:
          "'This month' + bị động đang xảy ra → Passive HTTD: 'is being prepared'.",
        explanationVi:
          "Bị động HTTD = is being + V3.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q18",
        sentence: "The appendix _____ all the supporting data and calculations referenced in the report.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is containing",
          B: "contains",
          C: "has contained",
          D: "contained",
        },
        correct: "B",
        explanation:
          "'Contain' là stative verb — không dùng -ing → HTĐ: 'contains'.",
        explanationVi:
          "'Contain' là stative verb → HTĐ. 'Is containing' sai ngữ pháp.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q19",
        sentence: "The company _____ more aggressively into the European market this year.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "expands",
          B: "has expanded",
          C: "is expanding",
          D: "expanded",
        },
        correct: "C",
        explanation:
          "'This year' + chiến lược đang triển khai → HTTD: 'is expanding'.",
        explanationVi:
          "'This year' + hoạt động đang tiến hành → HTTD.",
      },
      {
        kind: "mcq",
        id: "httd-l6-q20",
        sentence: "The company always _____ a thorough background check before making any hiring decision.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is conducting",
          B: "is conducted",
          C: "has conducted",
          D: "conducts",
        },
        correct: "D",
        explanation:
          "'Always' + quy trình tuyển dụng cố định → HTĐ: 'conducts'. 'Is conducting' sai — đây không phải đang làm ngay lúc nói.",
        explanationVi:
          "'Always' + thủ tục cố định → HTĐ.",
      },
    ],
  },
];
