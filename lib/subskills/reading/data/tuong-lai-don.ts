import type { Part5Level } from "@/lib/subskills/reading/types";

export const tuongLaiDonLevels: Part5Level[] = [
  // ── L1: Tense Recognition ────────────────────────────────────────────────────
  {
    level: 1,
    slug: "l1",
    name: "Nhận diện thì",
    nameEn: "Tense Recognition",
    description: "Đọc câu và xác định đây là thì gì?",
    instruction:
      "Đọc từng câu và chọn tên thì đúng. Chú ý cấu trúc will + V (nguyên mẫu) và dấu hiệu thời gian tương lai.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "tld-l1-q01",
        sentence: "The company will launch its new product line next spring.",
        translation: "Công ty sẽ ra mắt dòng sản phẩm mới vào mùa xuân tới.",
        grammarHint: "Chú ý: 'will launch' (will + V) + 'next spring' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai đơn (will + V)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "A",
        explanation:
          "'Will launch' = will + động từ nguyên mẫu và 'next spring' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "will + V (nguyên mẫu) + 'next spring' = Tương lai đơn điển hình.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q02",
        sentence: "The board will approve the annual budget tomorrow.",
        translation: "Hội đồng sẽ phê duyệt ngân sách hàng năm vào ngày mai.",
        grammarHint: "Chú ý: 'will approve' (will + V) + 'tomorrow' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Tương lai đơn (will + V)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "B",
        explanation:
          "'Will approve' = will + V và 'tomorrow' là dấu hiệu tương lai → Tương lai đơn.",
        explanationVi:
          "'Tomorrow' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q03",
        sentence: "She will submit the final report next Friday.",
        translation: "Cô ấy sẽ nộp báo cáo cuối cùng vào thứ Sáu tới.",
        grammarHint: "Chú ý: 'will submit' (will + V) + 'next Friday' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Tương lai tiếp diễn (will be + V-ing)",
          C: "Tương lai đơn (will + V)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Will submit' = will + V và 'next Friday' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next Friday' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q04",
        sentence: "The negotiations will resume in two weeks.",
        translation: "Cuộc đàm phán sẽ được nối lại sau hai tuần nữa.",
        grammarHint: "Chú ý: 'will resume' (will + V) + 'in two weeks' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai tiếp diễn (will be + V-ing)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Tương lai đơn (will + V)",
        },
        correct: "D",
        explanation:
          "'Will resume' = will + V và 'in two weeks' (sau hai tuần nữa) là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'In + khoảng thời gian' (tương lai) + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q05",
        sentence: "The technician will repair the server this evening.",
        translation: "Kỹ thuật viên sẽ sửa máy chủ vào tối nay.",
        grammarHint: "Chú ý: 'will repair' (will + V) + 'this evening' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai đơn (will + V)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "A",
        explanation:
          "'Will repair' = will + V và 'this evening' (sắp tới) là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "will + V + mốc tương lai = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q06",
        sentence: "We will sign the partnership agreement next month.",
        translation: "Chúng tôi sẽ ký thỏa thuận hợp tác vào tháng tới.",
        grammarHint: "Chú ý: 'will sign' (will + V) + 'next month' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Tương lai đơn (will + V)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "B",
        explanation:
          "'Will sign' = will + V và 'next month' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next month' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q07",
        sentence: "The CEO will announce the results at the conference.",
        translation: "Giám đốc điều hành sẽ công bố kết quả tại hội nghị.",
        grammarHint: "Chú ý: 'will announce' (will + V) → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Tương lai tiếp diễn (will be + V-ing)",
          C: "Tương lai đơn (will + V)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Will announce' = will + động từ nguyên mẫu → Tương lai đơn.",
        explanationVi:
          "will + V (nguyên mẫu) = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q08",
        sentence: "The auditors will review the financial records next quarter.",
        translation: "Các kiểm toán viên sẽ xem xét hồ sơ tài chính vào quý tới.",
        grammarHint: "Chú ý: 'will review' (will + V) + 'next quarter' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai tiếp diễn (will be + V-ing)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Tương lai đơn (will + V)",
        },
        correct: "D",
        explanation:
          "'Will review' = will + V và 'next quarter' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next quarter' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q09",
        sentence: "The factory will increase production next year.",
        translation: "Nhà máy sẽ tăng sản lượng vào năm tới.",
        grammarHint: "Chú ý: 'will increase' (will + V) + 'next year' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai đơn (will + V)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "A",
        explanation:
          "'Will increase' = will + V và 'next year' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next year' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q10",
        sentence: "He will establish a new startup soon.",
        translation: "Anh ấy sẽ thành lập một công ty khởi nghiệp mới trong thời gian tới.",
        grammarHint: "Chú ý: 'will establish' (will + V) + 'soon' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Tương lai đơn (will + V)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "B",
        explanation:
          "'Will establish' = will + V và 'soon' là dấu hiệu tương lai → Tương lai đơn.",
        explanationVi:
          "'Soon' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q11",
        sentence: "The shipment will arrive at the warehouse tomorrow morning.",
        translation: "Lô hàng sẽ đến kho vào sáng mai.",
        grammarHint: "Chú ý: 'will arrive' (will + V) + 'tomorrow morning' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Tương lai tiếp diễn (will be + V-ing)",
          C: "Tương lai đơn (will + V)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Will arrive' = will + V và 'tomorrow morning' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Tomorrow morning' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q12",
        sentence: "The committee will select the winning proposal next week.",
        translation: "Ủy ban sẽ chọn đề xuất chiến thắng vào tuần tới.",
        grammarHint: "Chú ý: 'will select' (will + V) + 'next week' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai tiếp diễn (will be + V-ing)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Tương lai đơn (will + V)",
        },
        correct: "D",
        explanation:
          "'Will select' = will + V và 'next week' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next week' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q13",
        sentence: "The store will offer special discounts next December.",
        translation: "Cửa hàng sẽ đưa ra các mức chiết khấu đặc biệt vào tháng 12 tới.",
        grammarHint: "Chú ý: 'will offer' (will + V) + 'next December' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai đơn (will + V)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "A",
        explanation:
          "'Will offer' = will + V và 'next December' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next December' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q14",
        sentence: "They will relocate their headquarters to Singapore next year.",
        translation: "Họ sẽ chuyển trụ sở chính đến Singapore vào năm tới.",
        grammarHint: "Chú ý: 'will relocate' (will + V) + 'next year' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Tương lai đơn (will + V)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "B",
        explanation:
          "'Will relocate' = will + V và 'next year' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next year' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q15",
        sentence: "The consultant will present her findings to the board soon.",
        translation: "Chuyên gia tư vấn sẽ trình bày các phát hiện với hội đồng trong thời gian tới.",
        grammarHint: "Chú ý: 'will present' (will + V) + 'soon' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Tương lai tiếp diễn (will be + V-ing)",
          C: "Tương lai đơn (will + V)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Will present' = will + V và 'soon' là dấu hiệu tương lai → Tương lai đơn.",
        explanationVi:
          "'Soon' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q16",
        sentence: "The airline will add several new routes next summer.",
        translation: "Hãng hàng không sẽ bổ sung một số tuyến bay mới vào mùa hè tới.",
        grammarHint: "Chú ý: 'will add' (will + V) + 'next summer' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai tiếp diễn (will be + V-ing)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Tương lai đơn (will + V)",
        },
        correct: "D",
        explanation:
          "'Will add' = will + V và 'next summer' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next summer' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q17",
        sentence: "The manager will hire three new employees next month.",
        translation: "Người quản lý sẽ tuyển ba nhân viên mới vào tháng tới.",
        grammarHint: "Chú ý: 'will hire' (will + V) + 'next month' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai đơn (will + V)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "A",
        explanation:
          "'Will hire' = will + V và 'next month' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next month' + will + V = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q18",
        sentence: "The team will complete the project ahead of schedule.",
        translation: "Nhóm sẽ hoàn thành dự án trước thời hạn.",
        grammarHint: "Chú ý: 'will complete' (will + V) → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Tương lai đơn (will + V)",
          C: "Tương lai tiếp diễn (will be + V-ing)",
          D: "Hiện tại tiếp diễn (am/is/are + V-ing)",
        },
        correct: "B",
        explanation:
          "'Will complete' = will + động từ nguyên mẫu → Tương lai đơn.",
        explanationVi:
          "will + V (nguyên mẫu) = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q19",
        sentence: "The supplier will deliver the raw materials on time.",
        translation: "Nhà cung cấp sẽ giao nguyên liệu thô đúng hạn.",
        grammarHint: "Chú ý: 'will deliver' (will + V) → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          B: "Tương lai tiếp diễn (will be + V-ing)",
          C: "Tương lai đơn (will + V)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Will deliver' = will + động từ nguyên mẫu → Tương lai đơn.",
        explanationVi:
          "will + V (nguyên mẫu) = Tương lai đơn.",
      },
      {
        kind: "mcq",
        id: "tld-l1-q20",
        sentence: "The company will report its earnings next week.",
        translation: "Công ty sẽ báo cáo lợi nhuận vào tuần tới.",
        grammarHint: "Chú ý: 'will report' (will + V) + 'next week' → Tương lai đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Tương lai tiếp diễn (will be + V-ing)",
          B: "Hiện tại tiếp diễn (am/is/are + V-ing)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Tương lai đơn (will + V)",
        },
        correct: "D",
        explanation:
          "'Will report' = will + V và 'next week' là mốc tương lai → Tương lai đơn.",
        explanationVi:
          "'Next week' + will + V = Tương lai đơn.",
      },
    ],
  },

  // ── L2: Time Markers ─────────────────────────────────────────────────────────
  {
    level: 2,
    slug: "l2",
    name: "Dấu hiệu thời gian",
    nameEn: "Time Markers",
    description: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
    instruction:
      "Bấm vào các từ hoặc cụm từ là dấu hiệu thì. Có thể có nhiều từ trong một câu.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "highlight",
        id: "tld-l2-q01",
        sentence: "The delivery team will arrive at the main warehouse tomorrow.",
        translation: "Đội giao hàng sẽ đến kho chính vào ngày mai.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["tomorrow"],
        explanation:
          "'Tomorrow' (ngày mai) là time marker điển hình của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q02",
        sentence: "The company will open its new flagship store next week.",
        translation: "Công ty sẽ khai trương cửa hàng chủ lực mới vào tuần tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["next", "week"],
        explanation:
          "'Next week' (tuần tới) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q03",
        sentence: "The technician will call you back soon.",
        translation: "Kỹ thuật viên sẽ gọi lại cho bạn sớm thôi.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["soon"],
        explanation:
          "'Soon' (sớm, chẳng bao lâu nữa) là trạng từ chỉ tương lai gần → Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q04",
        sentence: "Renewable energy will dominate global markets in the future.",
        translation: "Năng lượng tái tạo sẽ thống trị các thị trường toàn cầu trong tương lai.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["in", "the", "future"],
        explanation:
          "'In the future' (trong tương lai) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q05",
        sentence: "The firm will launch its updated app next month.",
        translation: "Công ty sẽ ra mắt ứng dụng cập nhật vào tháng tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["next", "month"],
        explanation:
          "'Next month' (tháng tới) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q06",
        sentence: "Our representative will contact you shortly.",
        translation: "Đại diện của chúng tôi sẽ liên hệ với bạn trong chốc lát.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["shortly"],
        explanation:
          "'Shortly' (chẳng mấy chốc, ngay sau đây) chỉ tương lai gần → Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q07",
        sentence: "The construction will be finished in two days.",
        translation: "Việc xây dựng sẽ hoàn tất sau hai ngày nữa.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["in", "two", "days"],
        explanation:
          "'In two days' (sau hai ngày nữa) là cụm chỉ mốc tương lai → Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q08",
        sentence: "The organization will relocate its headquarters next year.",
        translation: "Tổ chức sẽ chuyển trụ sở chính vào năm tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["next", "year"],
        explanation:
          "'Next year' (năm tới) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q09",
        sentence: "The board will announce the decision tomorrow.",
        translation: "Hội đồng sẽ công bố quyết định vào ngày mai.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["tomorrow"],
        explanation:
          "'Tomorrow' (ngày mai) là dấu hiệu Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q10",
        sentence: "The workshop will take place next Monday.",
        translation: "Buổi hội thảo sẽ diễn ra vào thứ Hai tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["next", "Monday"],
        explanation:
          "'Next Monday' (thứ Hai tới) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q11",
        sentence: "The prototype will be ready in three weeks.",
        translation: "Nguyên mẫu sẽ sẵn sàng sau ba tuần nữa.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["in", "three", "weeks"],
        explanation:
          "'In three weeks' (sau ba tuần nữa) là cụm chỉ mốc tương lai → Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q12",
        sentence: "The support team will respond to your request soon.",
        translation: "Nhóm hỗ trợ sẽ phản hồi yêu cầu của bạn sớm thôi.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["soon"],
        explanation:
          "'Soon' (sớm thôi) chỉ tương lai gần → Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q13",
        sentence: "The firm will review its pricing next quarter.",
        translation: "Công ty sẽ xem xét lại chính sách giá vào quý tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["next", "quarter"],
        explanation:
          "'Next quarter' (quý tới) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q14",
        sentence: "A replacement will be dispatched shortly.",
        translation: "Một sản phẩm thay thế sẽ được gửi đi trong chốc lát.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["shortly"],
        explanation:
          "'Shortly' (ngay sau đây) chỉ tương lai gần → Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q15",
        sentence: "The keynote speaker will present her research tomorrow afternoon.",
        translation: "Diễn giả chính sẽ trình bày nghiên cứu của mình vào chiều mai.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["tomorrow"],
        explanation:
          "'Tomorrow' (trong 'tomorrow afternoon') là dấu hiệu Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q16",
        sentence: "The committee will publish the results next Friday.",
        translation: "Ủy ban sẽ công bố kết quả vào thứ Sáu tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["next", "Friday"],
        explanation:
          "'Next Friday' (thứ Sáu tới) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q17",
        sentence: "Automation will transform manufacturing in the future.",
        translation: "Tự động hóa sẽ chuyển đổi ngành sản xuất trong tương lai.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["in", "the", "future"],
        explanation:
          "'In the future' (trong tương lai) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q18",
        sentence: "The merger will be finalized in six months.",
        translation: "Vụ sáp nhập sẽ được hoàn tất sau sáu tháng nữa.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["in", "six", "months"],
        explanation:
          "'In six months' (sau sáu tháng nữa) là cụm chỉ mốc tương lai → Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q19",
        sentence: "The company will unveil its rebranding campaign next week.",
        translation: "Công ty sẽ công bố chiến dịch tái định vị thương hiệu vào tuần tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["next", "week"],
        explanation:
          "'Next week' (tuần tới) là cụm time marker của Tương lai đơn.",
      },
      {
        kind: "highlight",
        id: "tld-l2-q20",
        sentence: "The updated guidelines will take effect soon.",
        translation: "Các hướng dẫn cập nhật sẽ có hiệu lực trong thời gian tới.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Tương lai đơn.",
        correctWords: ["soon"],
        explanation:
          "'Soon' (sớm, trong thời gian tới) chỉ tương lai gần → Tương lai đơn.",
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
      "Đọc bản dịch tiếng Việt để hiểu ngữ cảnh, rồi chọn dạng động từ phù hợp. LƯU Ý: sau 'when / as soon as / before / until / after' dùng HIỆN TẠI ĐƠN, không dùng 'will'.",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "tld-l3-q01",
        sentence: "The delivery _____ at the warehouse tomorrow morning.",
        translation: "Lô hàng sẽ đến kho vào sáng mai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will arrive",
          B: "arrives",
          C: "is arriving",
          D: "arrived",
        },
        correct: "A",
        explanation:
          "'Sẽ đến' + 'tomorrow morning' = tương lai → Tương lai đơn: 'will arrive'.",
        explanationVi:
          "'Sẽ' + mốc tương lai → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q02",
        sentence: "We _____ the new branch next month.",
        translation: "Chúng tôi sẽ khai trương chi nhánh mới vào tháng tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "open",
          B: "will open",
          C: "are opening",
          D: "opened",
        },
        correct: "B",
        explanation:
          "'Sẽ khai trương' + 'next month' = tương lai → Tương lai đơn: 'will open'.",
        explanationVi:
          "'Sẽ' + 'next month' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q03",
        sentence: "The manager _____ you the details soon.",
        translation: "Người quản lý sẽ gửi bạn chi tiết sớm thôi.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "sends",
          B: "is sending",
          C: "will send",
          D: "sent",
        },
        correct: "C",
        explanation:
          "'Sẽ gửi' + 'soon' = tương lai → Tương lai đơn: 'will send'.",
        explanationVi:
          "'Sẽ' + 'soon' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q04",
        sentence: "I think the project _____ successful.",
        translation: "Tôi nghĩ dự án sẽ thành công.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "is",
          B: "has been",
          C: "was",
          D: "will be",
        },
        correct: "D",
        explanation:
          "'I think ...' + dự đoán về tương lai → Tương lai đơn: 'will be'.",
        explanationVi:
          "'I think/believe' + dự đoán → will + V. Đây là dự đoán, không phải sự thật hiện tại.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q05",
        sentence: "The company _____ its annual report next week.",
        translation: "Công ty sẽ công bố báo cáo thường niên vào tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will release",
          B: "releases",
          C: "is releasing",
          D: "released",
        },
        correct: "A",
        explanation:
          "'Sẽ công bố' + 'next week' = tương lai → Tương lai đơn: 'will release'.",
        explanationVi:
          "'Sẽ' + 'next week' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q06",
        sentence: "We will start the meeting as soon as everyone _____.",
        translation: "Chúng tôi sẽ bắt đầu cuộc họp ngay khi mọi người đến.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will arrive",
          B: "arrives",
          C: "is arriving",
          D: "arrived",
        },
        correct: "B",
        explanation:
          "Sau 'as soon as' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'arrives'. KHÔNG dùng 'will' trong mệnh đề thời gian.",
        explanationVi:
          "Mệnh đề 'as soon as ...' chỉ tương lai → hiện tại đơn. Đây là câu bẫy TOEIC quan trọng.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q07",
        sentence: "The technician _____ the issue shortly.",
        translation: "Kỹ thuật viên sẽ khắc phục sự cố trong chốc lát.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "fixes",
          B: "is fixing",
          C: "will fix",
          D: "fixed",
        },
        correct: "C",
        explanation:
          "'Sẽ khắc phục' + 'shortly' = tương lai → Tương lai đơn: 'will fix'.",
        explanationVi:
          "'Sẽ' + 'shortly' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q08",
        sentence: "The board _____ the proposal at the next meeting.",
        translation: "Hội đồng sẽ xem xét đề xuất tại cuộc họp tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "reviews",
          B: "is reviewing",
          C: "reviewed",
          D: "will review",
        },
        correct: "D",
        explanation:
          "'Sẽ xem xét' + 'at the next meeting' = tương lai → Tương lai đơn: 'will review'.",
        explanationVi:
          "'Sẽ' + 'next meeting' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q09",
        sentence: "Prices _____ next year due to inflation.",
        translation: "Giá cả sẽ tăng vào năm tới do lạm phát.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will rise",
          B: "rise",
          C: "are rising",
          D: "rose",
        },
        correct: "A",
        explanation:
          "'Sẽ tăng' + 'next year' = dự đoán tương lai → Tương lai đơn: 'will rise'.",
        explanationVi:
          "'Sẽ' + 'next year' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q10",
        sentence: "She _____ the training session tomorrow.",
        translation: "Cô ấy sẽ dẫn dắt buổi đào tạo vào ngày mai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "leads",
          B: "will lead",
          C: "is leading",
          D: "led",
        },
        correct: "B",
        explanation:
          "'Sẽ dẫn dắt' + 'tomorrow' = tương lai → Tương lai đơn: 'will lead'.",
        explanationVi:
          "'Sẽ' + 'tomorrow' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q11",
        sentence: "The supplier _____ the goods by Friday.",
        translation: "Nhà cung cấp sẽ giao hàng trước thứ Sáu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "delivers",
          B: "is delivering",
          C: "will deliver",
          D: "delivered",
        },
        correct: "C",
        explanation:
          "'Sẽ giao' + 'by Friday' (trước thứ Sáu, tương lai) → Tương lai đơn: 'will deliver'.",
        explanationVi:
          "'Sẽ' + 'by + mốc tương lai' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q12",
        sentence: "Our team _____ the target this quarter, I'm sure.",
        translation: "Tôi chắc chắn nhóm chúng tôi sẽ đạt chỉ tiêu quý này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "meets",
          B: "is meeting",
          C: "met",
          D: "will meet",
        },
        correct: "D",
        explanation:
          "'I'm sure ...' + dự đoán chắc chắn về tương lai → Tương lai đơn: 'will meet'.",
        explanationVi:
          "'I'm sure' + dự đoán → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q13",
        sentence: "The CEO _____ a speech at the ceremony next Friday.",
        translation: "Giám đốc điều hành sẽ phát biểu tại buổi lễ vào thứ Sáu tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will give",
          B: "gives",
          C: "is giving",
          D: "gave",
        },
        correct: "A",
        explanation:
          "'Sẽ phát biểu' + 'next Friday' = tương lai → Tương lai đơn: 'will give'.",
        explanationVi:
          "'Sẽ' + 'next Friday' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q14",
        sentence: "Please call me when the shipment _____.",
        translation: "Hãy gọi cho tôi khi lô hàng đến.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will arrive",
          B: "arrives",
          C: "is arriving",
          D: "arrived",
        },
        correct: "B",
        explanation:
          "Sau 'when' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'arrives'. KHÔNG dùng 'will' trong mệnh đề thời gian.",
        explanationVi:
          "Mệnh đề 'when ...' chỉ tương lai → hiện tại đơn. Đây là câu bẫy TOEIC quan trọng.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q15",
        sentence: "The firm _____ new staff in the coming weeks.",
        translation: "Công ty sẽ tuyển nhân viên mới trong những tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "hires",
          B: "is hiring",
          C: "will hire",
          D: "hired",
        },
        correct: "C",
        explanation:
          "'Sẽ tuyển' + 'in the coming weeks' = tương lai → Tương lai đơn: 'will hire'.",
        explanationVi:
          "'Sẽ' + 'the coming weeks' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q16",
        sentence: "The new policy _____ into effect next quarter.",
        translation: "Chính sách mới sẽ có hiệu lực vào quý tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "comes",
          B: "is coming",
          C: "came",
          D: "will come",
        },
        correct: "D",
        explanation:
          "'Sẽ có hiệu lực' + 'next quarter' = tương lai → Tương lai đơn: 'will come'.",
        explanationVi:
          "'Sẽ' + 'next quarter' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q17",
        sentence: "We _____ you a confirmation email shortly.",
        translation: "Chúng tôi sẽ gửi bạn email xác nhận trong giây lát.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will send",
          B: "send",
          C: "are sending",
          D: "sent",
        },
        correct: "A",
        explanation:
          "'Sẽ gửi' + 'shortly' = tương lai → Tương lai đơn: 'will send'.",
        explanationVi:
          "'Sẽ' + 'shortly' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q18",
        sentence: "The staff will be notified before the system _____ down for maintenance.",
        translation: "Nhân viên sẽ được thông báo trước khi hệ thống ngừng hoạt động để bảo trì.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will go",
          B: "goes",
          C: "is going",
          D: "went",
        },
        correct: "B",
        explanation:
          "Sau 'before' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'goes'. KHÔNG dùng 'will' trong mệnh đề thời gian.",
        explanationVi:
          "Mệnh đề 'before ...' chỉ tương lai → hiện tại đơn. Đây là câu bẫy TOEIC quan trọng.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q19",
        sentence: "The exhibition _____ visitors from around the world next spring.",
        translation: "Triển lãm sẽ thu hút du khách từ khắp nơi trên thế giới vào mùa xuân tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "attracts",
          B: "is attracting",
          C: "will attract",
          D: "attracted",
        },
        correct: "C",
        explanation:
          "'Sẽ thu hút' + 'next spring' = tương lai → Tương lai đơn: 'will attract'.",
        explanationVi:
          "'Sẽ' + 'next spring' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l3-q20",
        sentence: "Management _____ the results with all employees soon.",
        translation: "Ban quản lý sẽ chia sẻ kết quả với toàn thể nhân viên sớm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "shares",
          B: "is sharing",
          C: "shared",
          D: "will share",
        },
        correct: "D",
        explanation:
          "'Sẽ chia sẻ' + 'soon' = tương lai → Tương lai đơn: 'will share'.",
        explanationVi:
          "'Sẽ' + 'soon' → will + V.",
      },
    ],
  },

  // ── L4: Active + Passive ──────────────────────────────────────────────────────
  {
    level: 4,
    slug: "l4",
    name: "Chia động từ",
    nameEn: "Verb Form",
    description: "Chọn dạng động từ đúng (chủ động và bị động Tương lai đơn).",
    instruction:
      "Chú ý chủ ngữ câu: nếu chủ ngữ thực hiện hành động → Active (will + V). Nếu chủ ngữ nhận hành động → Passive (will be + V3).",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "tld-l4-q01",
        sentence: "The CEO _____ the merger at the press conference next week.",
        translation: "Giám đốc điều hành sẽ công bố vụ sáp nhập tại buổi họp báo vào tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will announce",
          B: "will be announced",
          C: "announces",
          D: "has announced",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the CEO' tự thực hiện → Active Tương lai đơn: 'will announce'.",
        explanationVi:
          "CEO TỰ công bố → chủ động. 'Will be announced' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q02",
        sentence: "The merger _____ at the press conference by the CEO next week.",
        translation: "Vụ sáp nhập sẽ được công bố tại buổi họp báo bởi giám đốc điều hành vào tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will announce",
          B: "will be announced",
          C: "is announced",
          D: "announces",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the merger' nhận hành động + 'by the CEO' → Passive Tương lai đơn: 'will be announced'.",
        explanationVi:
          "Vụ sáp nhập 'được công bố' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q03",
        sentence: "The technicians _____ the new equipment next Monday.",
        translation: "Các kỹ thuật viên sẽ lắp đặt thiết bị mới vào thứ Hai tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be installed",
          B: "install",
          C: "will install",
          D: "are installing",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the technicians' tự thực hiện → Active Tương lai đơn: 'will install'.",
        explanationVi:
          "Kỹ thuật viên TỰ lắp đặt → chủ động. 'Will be installed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q04",
        sentence: "The new equipment _____ by the technicians next Monday.",
        translation: "Thiết bị mới sẽ được lắp đặt bởi các kỹ thuật viên vào thứ Hai tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "install",
          B: "is installed",
          C: "installs",
          D: "will be installed",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the new equipment' nhận hành động → Passive Tương lai đơn: 'will be installed'.",
        explanationVi:
          "Thiết bị 'được lắp đặt' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q05",
        sentence: "The committee _____ all the applications tomorrow.",
        translation: "Ủy ban sẽ xem xét tất cả hồ sơ vào ngày mai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will review",
          B: "will be reviewed",
          C: "reviews",
          D: "reviewed",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the committee' tự thực hiện → Active Tương lai đơn: 'will review'.",
        explanationVi:
          "Ủy ban TỰ xem xét → chủ động.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q06",
        sentence: "All the applications _____ by the committee tomorrow.",
        translation: "Tất cả hồ sơ sẽ được xem xét bởi ủy ban vào ngày mai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will review",
          B: "will be reviewed",
          C: "are reviewed",
          D: "review",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'all the applications' nhận hành động → Passive Tương lai đơn: 'will be reviewed'.",
        explanationVi:
          "Bị động Tương lai đơn = will be + V3 (không đổi theo số ít/nhiều).",
      },
      {
        kind: "mcq",
        id: "tld-l4-q07",
        sentence: "The company _____ its new product line next quarter.",
        translation: "Công ty sẽ ra mắt dòng sản phẩm mới vào quý tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be launched",
          B: "launches",
          C: "will launch",
          D: "is launching",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the company' tự thực hiện → Active Tương lai đơn: 'will launch'.",
        explanationVi:
          "Công ty TỰ ra mắt → chủ động. 'Will be launched' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q08",
        sentence: "The new product line _____ by the company next quarter.",
        translation: "Dòng sản phẩm mới sẽ được ra mắt bởi công ty vào quý tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "launches",
          B: "is launched",
          C: "launch",
          D: "will be launched",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the new product line' nhận hành động → Passive Tương lai đơn: 'will be launched'.",
        explanationVi:
          "Dòng sản phẩm 'được ra mắt' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q09",
        sentence: "The supplier _____ the materials to the site tomorrow.",
        translation: "Nhà cung cấp sẽ giao vật liệu đến công trường vào ngày mai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will deliver",
          B: "will be delivered",
          C: "delivers",
          D: "delivered",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the supplier' tự thực hiện → Active Tương lai đơn: 'will deliver'.",
        explanationVi:
          "Nhà cung cấp TỰ giao → chủ động.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q10",
        sentence: "The materials _____ to the site by the supplier tomorrow.",
        translation: "Vật liệu sẽ được giao đến công trường bởi nhà cung cấp vào ngày mai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will deliver",
          B: "will be delivered",
          C: "are delivered",
          D: "deliver",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the materials' nhận hành động → Passive Tương lai đơn: 'will be delivered'.",
        explanationVi:
          "Vật liệu 'được giao' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q11",
        sentence: "Both parties _____ the agreement at next week's meeting.",
        translation: "Cả hai bên sẽ ký thỏa thuận tại cuộc họp tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be signed",
          B: "sign",
          C: "will sign",
          D: "are signing",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'both parties' tự thực hiện → Active Tương lai đơn: 'will sign'.",
        explanationVi:
          "Hai bên TỰ ký → chủ động. 'Will be signed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q12",
        sentence: "The agreement _____ by both parties at next week's meeting.",
        translation: "Thỏa thuận sẽ được ký bởi cả hai bên tại cuộc họp tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "signs",
          B: "is signed",
          C: "sign",
          D: "will be signed",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the agreement' nhận hành động → Passive Tương lai đơn: 'will be signed'.",
        explanationVi:
          "Thỏa thuận 'được ký' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q13",
        sentence: "The construction crew _____ the new wing by December.",
        translation: "Đội thi công sẽ hoàn thành khu nhà mới trước tháng 12.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will complete",
          B: "will be completed",
          C: "completes",
          D: "completed",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the construction crew' tự thực hiện → Active Tương lai đơn: 'will complete'.",
        explanationVi:
          "Đội thi công TỰ hoàn thành → chủ động.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q14",
        sentence: "The new wing _____ by December.",
        translation: "Khu nhà mới sẽ được hoàn thành trước tháng 12.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will complete",
          B: "will be completed",
          C: "is completed",
          D: "completes",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the new wing' nhận hành động → Passive Tương lai đơn: 'will be completed'.",
        explanationVi:
          "Khu nhà 'được hoàn thành' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q15",
        sentence: "The HR department _____ the offer letters next Friday.",
        translation: "Bộ phận nhân sự sẽ gửi thư mời làm việc vào thứ Sáu tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be sent",
          B: "sends",
          C: "will send",
          D: "is sending",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the HR department' tự thực hiện → Active Tương lai đơn: 'will send'.",
        explanationVi:
          "Bộ phận nhân sự TỰ gửi → chủ động. 'Will be sent' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q16",
        sentence: "The offer letters _____ by the HR department next Friday.",
        translation: "Thư mời làm việc sẽ được gửi bởi bộ phận nhân sự vào thứ Sáu tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "send",
          B: "are sent",
          C: "sends",
          D: "will be sent",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the offer letters' nhận hành động → Passive Tương lai đơn: 'will be sent'.",
        explanationVi:
          "Thư mời 'được gửi' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q17",
        sentence: "The consultant _____ the findings at the seminar soon.",
        translation: "Chuyên gia tư vấn sẽ trình bày các phát hiện tại hội thảo trong thời gian tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will present",
          B: "will be presented",
          C: "presents",
          D: "presented",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the consultant' tự thực hiện → Active Tương lai đơn: 'will present'.",
        explanationVi:
          "Chuyên gia TỰ trình bày → chủ động.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q18",
        sentence: "The findings _____ at the seminar by the consultant soon.",
        translation: "Các phát hiện sẽ được trình bày tại hội thảo bởi chuyên gia tư vấn trong thời gian tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will present",
          B: "will be presented",
          C: "are presented",
          D: "present",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the findings' nhận hành động → Passive Tương lai đơn: 'will be presented'.",
        explanationVi:
          "Các phát hiện 'được trình bày' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q19",
        sentence: "The safety officer _____ the facility next week.",
        translation: "Nhân viên an toàn sẽ kiểm tra cơ sở vào tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be inspected",
          B: "inspects",
          C: "will inspect",
          D: "is inspecting",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the safety officer' tự thực hiện → Active Tương lai đơn: 'will inspect'.",
        explanationVi:
          "Nhân viên an toàn TỰ kiểm tra → chủ động. 'Will be inspected' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "tld-l4-q20",
        sentence: "The facility _____ by the safety officer next week.",
        translation: "Cơ sở sẽ được kiểm tra bởi nhân viên an toàn vào tuần tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "inspects",
          B: "is inspected",
          C: "inspect",
          D: "will be inspected",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the facility' nhận hành động → Passive Tương lai đơn: 'will be inspected'.",
        explanationVi:
          "Cơ sở 'được kiểm tra' → bị động Tương lai đơn: will be + V3.",
      },
    ],
  },

  // ── L5: Tense Discrimination ─────────────────────────────────────────────────
  {
    level: 5,
    slug: "l5",
    name: "Phân biệt 2 thì",
    nameEn: "Tense Discrimination",
    description: "Phân biệt Tương lai đơn với Tương lai tiếp diễn (trường hợp khó).",
    instruction:
      "Chú ý: will + V = hành động trọn vẹn/dự đoán/quyết định. will be + V-ing = đang diễn ra tại một thời điểm tương lai. Sau 'when/as soon as/before/until/after/if' dùng HIỆN TẠI ĐƠN.",
    difficulty: "hard",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "tld-l5-q01",
        sentence: "This time next week, I _____ on the beach in Hawaii.",
        translation: "Vào giờ này tuần sau, tôi sẽ đang nghỉ ngơi trên bãi biển ở Hawaii.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be relaxing",
          B: "will relax",
          C: "relax",
          D: "am relaxing",
        },
        correct: "A",
        explanation:
          "'This time next week' + hành động đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be relaxing'.",
        explanationVi:
          "'This time next week' + đang diễn ra → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q02",
        sentence: "The manager _____ a final decision by the end of the day.",
        translation: "Người quản lý sẽ đưa ra quyết định cuối cùng vào cuối ngày.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be making",
          B: "will make",
          C: "makes",
          D: "is making",
        },
        correct: "B",
        explanation:
          "Hành động trọn vẹn sẽ xảy ra (không nhấn mạnh đang diễn ra) → Tương lai đơn: 'will make'.",
        explanationVi:
          "Hành động dứt điểm trong tương lai → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q03",
        sentence: "I will email you the report as soon as I _____ it.",
        translation: "Tôi sẽ gửi email báo cáo cho bạn ngay khi tôi hoàn thành nó.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will finish",
          B: "will be finishing",
          C: "finish",
          D: "finished",
        },
        correct: "C",
        explanation:
          "Sau 'as soon as' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'finish'.",
        explanationVi:
          "Mệnh đề 'as soon as ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q04",
        sentence: "Don't call at 3 p.m.; the team _____ a client presentation then.",
        translation: "Đừng gọi lúc 3 giờ chiều; nhóm sẽ đang thuyết trình cho khách hàng lúc đó.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will give",
          B: "gives",
          C: "is giving",
          D: "will be giving",
        },
        correct: "D",
        explanation:
          "'At 3 p.m. ... then' + hành động đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be giving'.",
        explanationVi:
          "Đang diễn ra tại một thời điểm cụ thể trong tương lai → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q05",
        sentence: "If demand increases, the factory _____ a second production line.",
        translation: "Nếu nhu cầu tăng, nhà máy sẽ bổ sung dây chuyền sản xuất thứ hai.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will add",
          B: "will be adding",
          C: "adds",
          D: "added",
        },
        correct: "A",
        explanation:
          "Mệnh đề chính của câu điều kiện loại 1 → Tương lai đơn: 'will add'. (Mệnh đề 'if' dùng hiện tại: 'increases'.)",
        explanationVi:
          "Câu điều kiện loại 1: If + hiện tại, ... will + V. Mệnh đề chính → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q06",
        sentence: "At this time tomorrow, the delegates _____ the new facility.",
        translation: "Vào giờ này ngày mai, các đại biểu sẽ đang tham quan cơ sở mới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will tour",
          B: "will be touring",
          C: "tour",
          D: "are touring",
        },
        correct: "B",
        explanation:
          "'At this time tomorrow' + hành động đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be touring'.",
        explanationVi:
          "'At this time tomorrow' → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q07",
        sentence: "The company _____ the results to shareholders next Thursday.",
        translation: "Công ty sẽ công bố kết quả cho cổ đông vào thứ Năm tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be announcing",
          B: "announces",
          C: "will announce",
          D: "announced",
        },
        correct: "C",
        explanation:
          "Hành động trọn vẹn sẽ xảy ra tại một thời điểm tương lai (không nhấn mạnh tiến trình) → Tương lai đơn: 'will announce'.",
        explanationVi:
          "Hành động dứt điểm trong tương lai → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q08",
        sentence: "Please turn off the lights before you _____ the office tonight.",
        translation: "Hãy tắt đèn trước khi bạn rời văn phòng tối nay.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will leave",
          B: "will be leaving",
          C: "are leaving",
          D: "leave",
        },
        correct: "D",
        explanation:
          "Sau 'before' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'leave'.",
        explanationVi:
          "Mệnh đề 'before ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q09",
        sentence: "When you arrive at the airport, our driver _____ for you near the exit.",
        translation: "Khi bạn đến sân bay, tài xế của chúng tôi sẽ đang đợi bạn gần lối ra.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be waiting",
          B: "will wait",
          C: "waits",
          D: "is waiting",
        },
        correct: "A",
        explanation:
          "Hành động đang diễn ra tại thời điểm bạn đến (tương lai) → Tương lai tiếp diễn: 'will be waiting'. (Mệnh đề 'when you arrive' dùng hiện tại đơn.)",
        explanationVi:
          "Đang diễn ra tại một thời điểm tương lai → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q10",
        sentence: "I promise I _____ you as soon as I have any news.",
        translation: "Tôi hứa sẽ thông báo cho bạn ngay khi có tin tức.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be informing",
          B: "will inform",
          C: "inform",
          D: "informed",
        },
        correct: "B",
        explanation:
          "Lời hứa → Tương lai đơn: 'will inform'. (Mệnh đề 'as soon as I have' dùng hiện tại đơn.)",
        explanationVi:
          "Lời hứa → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q11",
        sentence: "The new regulations _____ into effect on the first of January.",
        translation: "Các quy định mới sẽ có hiệu lực vào ngày 1 tháng 1.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be coming",
          B: "come",
          C: "will come",
          D: "came",
        },
        correct: "C",
        explanation:
          "Hành động trọn vẹn xảy ra tại một mốc tương lai → Tương lai đơn: 'will come'.",
        explanationVi:
          "Hành động dứt điểm trong tương lai → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q12",
        sentence: "This time next month, the company _____ its products in five new countries.",
        translation: "Vào giờ này tháng sau, công ty sẽ đang bán sản phẩm của mình tại năm quốc gia mới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will sell",
          B: "sells",
          C: "is selling",
          D: "will be selling",
        },
        correct: "D",
        explanation:
          "'This time next month' + hành động đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be selling'.",
        explanationVi:
          "'This time next month' → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q13",
        sentence: "The workers will not stop until they _____ the project.",
        translation: "Công nhân sẽ không dừng lại cho đến khi họ hoàn thành dự án.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "complete",
          B: "will complete",
          C: "will be completing",
          D: "completed",
        },
        correct: "A",
        explanation:
          "Sau 'until' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'complete'.",
        explanationVi:
          "Mệnh đề 'until ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q14",
        sentence: "Analysts believe the stock _____ significantly next year.",
        translation: "Các nhà phân tích tin rằng cổ phiếu sẽ tăng đáng kể vào năm tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be rising",
          B: "will rise",
          C: "rises",
          D: "rose",
        },
        correct: "B",
        explanation:
          "'Analysts believe ...' + dự đoán về tương lai → Tương lai đơn: 'will rise'.",
        explanationVi:
          "'Believe/think' + dự đoán → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q15",
        sentence: "Please be quiet after nine; the guests _____ by then.",
        translation: "Hãy giữ yên lặng sau 9 giờ; khách sẽ đang ngủ vào lúc đó.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will sleep",
          B: "sleep",
          C: "will be sleeping",
          D: "are sleeping",
        },
        correct: "C",
        explanation:
          "'By then' (sau 9 giờ) + hành động đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be sleeping'.",
        explanationVi:
          "Đang diễn ra tại một thời điểm tương lai → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q16",
        sentence: "The consultant _____ her recommendations in the final report.",
        translation: "Chuyên gia tư vấn sẽ trình bày các khuyến nghị trong báo cáo cuối cùng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be including",
          B: "includes",
          C: "included",
          D: "will include",
        },
        correct: "D",
        explanation:
          "Hành động trọn vẹn sẽ xảy ra → Tương lai đơn: 'will include'.",
        explanationVi:
          "Hành động dứt điểm trong tương lai → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q17",
        sentence: "If the weather is bad, the outdoor event _____ to the main hall.",
        translation: "Nếu thời tiết xấu, sự kiện ngoài trời sẽ được chuyển vào hội trường chính.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be moved",
          B: "moves",
          C: "is moving",
          D: "moved",
        },
        correct: "A",
        explanation:
          "Mệnh đề chính câu điều kiện loại 1, dạng bị động → Passive Tương lai đơn: 'will be moved'. (Mệnh đề 'if' dùng hiện tại: 'is'.)",
        explanationVi:
          "If + hiện tại, ... will be + V3 (bị động tương lai).",
      },
      {
        kind: "mcq",
        id: "tld-l5-q18",
        sentence: "Between 2 and 4 p.m. tomorrow, the auditors _____ the accounts.",
        translation: "Từ 2 đến 4 giờ chiều ngày mai, các kiểm toán viên sẽ đang kiểm tra sổ sách.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will examine",
          B: "will be examining",
          C: "examine",
          D: "examined",
        },
        correct: "B",
        explanation:
          "Khoảng thời gian cụ thể trong tương lai ('between 2 and 4 p.m. tomorrow') + đang diễn ra → Tương lai tiếp diễn: 'will be examining'.",
        explanationVi:
          "Đang diễn ra trong một khoảng thời gian tương lai → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q19",
        sentence: "We will send the invoice after the goods _____ the destination.",
        translation: "Chúng tôi sẽ gửi hóa đơn sau khi hàng hóa đến điểm đích.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will reach",
          B: "will be reaching",
          C: "reach",
          D: "reached",
        },
        correct: "C",
        explanation:
          "Sau 'after' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'reach'.",
        explanationVi:
          "Mệnh đề 'after ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l5-q20",
        sentence: "The organization _____ a charity event to raise funds next month.",
        translation: "Tổ chức sẽ tổ chức một sự kiện từ thiện để gây quỹ vào tháng tới.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "will be hosting",
          B: "hosts",
          C: "hosted",
          D: "will host",
        },
        correct: "D",
        explanation:
          "Hành động trọn vẹn sẽ xảy ra tại một mốc tương lai → Tương lai đơn: 'will host'.",
        explanationVi:
          "Hành động dứt điểm trong tương lai → will + V.",
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
        id: "tld-l6-q01",
        sentence: "The board _____ the annual budget at its meeting next Tuesday.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will approve",
          B: "approves",
          C: "is approving",
          D: "approved",
        },
        correct: "A",
        explanation:
          "'Next Tuesday' + hành động trọn vẹn → Tương lai đơn: 'will approve'.",
        explanationVi:
          "'Next Tuesday' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q02",
        sentence: "The shipment will be dispatched as soon as the payment _____ confirmed.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will be",
          B: "is",
          C: "will have been",
          D: "was",
        },
        correct: "B",
        explanation:
          "Sau 'as soon as' chỉ tương lai → dùng hiện tại đơn (bị động): 'is confirmed'.",
        explanationVi:
          "Mệnh đề 'as soon as ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q03",
        sentence: "The new software _____ on all computers next weekend.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "installs",
          B: "is installing",
          C: "will be installed",
          D: "has installed",
        },
        correct: "C",
        explanation:
          "'Next weekend' + chủ ngữ nhận hành động → Passive Tương lai đơn: 'will be installed'.",
        explanationVi:
          "Bị động Tương lai đơn = will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q04",
        sentence: "At this time next week, the delegates _____ the international trade summit.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will attend",
          B: "attend",
          C: "are attending",
          D: "will be attending",
        },
        correct: "D",
        explanation:
          "'At this time next week' + đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be attending'.",
        explanationVi:
          "'At this time next week' → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q05",
        sentence: "Industry experts predict that oil prices _____ sharply in the coming months.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will increase",
          B: "increase",
          C: "are increasing",
          D: "increased",
        },
        correct: "A",
        explanation:
          "'Predict that ...' + dự đoán tương lai → Tương lai đơn: 'will increase'.",
        explanationVi:
          "'Predict' + dự đoán → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q06",
        sentence: "The manager _____ the new interns to their departments tomorrow morning.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is assigning",
          B: "will assign",
          C: "assigns",
          D: "assigned",
        },
        correct: "B",
        explanation:
          "'Tomorrow morning' + hành động trọn vẹn → Tương lai đơn: 'will assign'.",
        explanationVi:
          "'Tomorrow morning' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q07",
        sentence: "Employees will receive a bonus once the company _____ its quarterly target.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will meet",
          B: "will be meeting",
          C: "meets",
          D: "met",
        },
        correct: "C",
        explanation:
          "Sau 'once' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'meets'.",
        explanationVi:
          "Mệnh đề 'once ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q08",
        sentence: "All visitors _____ a security badge upon arrival next week.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "issue",
          B: "are issued",
          C: "will issue",
          D: "will be issued",
        },
        correct: "D",
        explanation:
          "'Next week' + chủ ngữ 'all visitors' nhận thẻ (bị động) → Passive Tương lai đơn: 'will be issued'.",
        explanationVi:
          "Khách 'được cấp' thẻ → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q09",
        sentence: "Please do not disturb the team after lunch; they _____ a critical system upgrade then.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will be performing",
          B: "will perform",
          C: "perform",
          D: "are performing",
        },
        correct: "A",
        explanation:
          "'After lunch ... then' + đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be performing'.",
        explanationVi:
          "Đang diễn ra tại một thời điểm tương lai → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q10",
        sentence: "The company _____ its expansion plans at the shareholders' meeting next month.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "reveals",
          B: "will reveal",
          C: "is revealing",
          D: "revealed",
        },
        correct: "B",
        explanation:
          "'Next month' + hành động trọn vẹn → Tương lai đơn: 'will reveal'.",
        explanationVi:
          "'Next month' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q11",
        sentence: "If the proposal is accepted, the project _____ in the second quarter.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "begins",
          B: "is beginning",
          C: "will begin",
          D: "began",
        },
        correct: "C",
        explanation:
          "Mệnh đề chính của câu điều kiện loại 1 → Tương lai đơn: 'will begin'. (Mệnh đề 'if' dùng hiện tại: 'is accepted'.)",
        explanationVi:
          "If + hiện tại, ... will + V. Mệnh đề chính → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q12",
        sentence: "The conference room _____ for the training session tomorrow afternoon.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "reserves",
          B: "is reserving",
          C: "reserved",
          D: "will be reserved",
        },
        correct: "D",
        explanation:
          "'Tomorrow afternoon' + chủ ngữ nhận hành động → Passive Tương lai đơn: 'will be reserved'.",
        explanationVi:
          "Phòng họp 'được đặt trước' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q13",
        sentence: "The technician assures us that the network _____ fully operational by Monday.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will be",
          B: "is being",
          C: "has been",
          D: "was",
        },
        correct: "A",
        explanation:
          "'By Monday' + dự đoán/cam kết về trạng thái tương lai → Tương lai đơn: 'will be'.",
        explanationVi:
          "'By + mốc tương lai' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q14",
        sentence: "We will notify all customers before the store _____ its doors for renovation.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will close",
          B: "closes",
          C: "will be closing",
          D: "closed",
        },
        correct: "B",
        explanation:
          "Sau 'before' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'closes'.",
        explanationVi:
          "Mệnh đề 'before ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q15",
        sentence: "Between nine and eleven tomorrow, the staff _____ the annual inventory count.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will conduct",
          B: "conduct",
          C: "will be conducting",
          D: "conducted",
        },
        correct: "C",
        explanation:
          "Khoảng thời gian cụ thể trong tương lai ('between nine and eleven tomorrow') + đang diễn ra → Tương lai tiếp diễn: 'will be conducting'.",
        explanationVi:
          "Đang diễn ra trong một khoảng thời gian tương lai → will be + V-ing.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q16",
        sentence: "Management _____ the new work-from-home policy starting next quarter.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is implementing",
          B: "implements",
          C: "implemented",
          D: "will implement",
        },
        correct: "D",
        explanation:
          "'Starting next quarter' + hành động trọn vẹn → Tương lai đơn: 'will implement'.",
        explanationVi:
          "'Next quarter' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q17",
        sentence: "The final results _____ to all participants by email next week.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will be sent",
          B: "send",
          C: "are sending",
          D: "sent",
        },
        correct: "A",
        explanation:
          "'Next week' + chủ ngữ nhận hành động → Passive Tương lai đơn: 'will be sent'.",
        explanationVi:
          "Kết quả 'được gửi' → bị động Tương lai đơn: will be + V3.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q18",
        sentence: "The organization _____ a job fair for recent graduates in the coming weeks.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "is hosting",
          B: "will host",
          C: "hosts",
          D: "hosted",
        },
        correct: "B",
        explanation:
          "'In the coming weeks' + hành động trọn vẹn → Tương lai đơn: 'will host'.",
        explanationVi:
          "'The coming weeks' → will + V.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q19",
        sentence: "The system will remain offline until the maintenance team _____ the necessary updates.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will complete",
          B: "will be completing",
          C: "completes",
          D: "completed",
        },
        correct: "C",
        explanation:
          "Sau 'until' chỉ tương lai → dùng HIỆN TẠI ĐƠN: 'completes'.",
        explanationVi:
          "Mệnh đề 'until ...' → hiện tại đơn, không dùng 'will'.",
      },
      {
        kind: "mcq",
        id: "tld-l6-q20",
        sentence: "This time tomorrow, the negotiators _____ the terms of the new contract.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "will discuss",
          B: "discuss",
          C: "are discussing",
          D: "will be discussing",
        },
        correct: "D",
        explanation:
          "'This time tomorrow' + đang diễn ra tại thời điểm tương lai → Tương lai tiếp diễn: 'will be discussing'.",
        explanationVi:
          "'This time tomorrow' → will be + V-ing.",
      },
    ],
  },
];
