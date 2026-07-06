import type { Part5Level } from "@/lib/subskills/reading/types";

export const quaKhuDonLevels: Part5Level[] = [
  // ── L1: Tense Recognition ────────────────────────────────────────────────────
  {
    level: 1,
    slug: "l1",
    name: "Nhận diện thì",
    nameEn: "Tense Recognition",
    description: "Đọc câu và xác định đây là thì gì?",
    instruction:
      "Đọc từng câu và chọn tên thì đúng. Chú ý động từ ở dạng V-ed / V2 và dấu hiệu thời gian quá khứ.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "qkd-l1-q01",
        sentence: "The company launched its new product line last spring.",
        translation: "Công ty đã ra mắt dòng sản phẩm mới vào mùa xuân năm ngoái.",
        grammarHint: "Chú ý: 'launched' (V-ed) + 'last spring' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Launched' = V-ed và 'last spring' là mốc thời gian quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "V-ed + 'last spring' (mốc quá khứ xác định) = Quá khứ đơn điển hình.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q02",
        sentence: "The board approved the annual budget yesterday.",
        translation: "Hội đồng đã phê duyệt ngân sách hàng năm vào hôm qua.",
        grammarHint: "Chú ý: 'approved' (V-ed) + 'yesterday' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Approved' = V-ed và 'yesterday' là dấu hiệu quá khứ đơn rõ ràng → Quá khứ đơn.",
        explanationVi:
          "'Yesterday' luôn đi với Quá khứ đơn, không dùng với HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q03",
        sentence: "She submitted her resignation letter two weeks ago.",
        translation: "Cô ấy đã nộp đơn xin nghỉ việc cách đây hai tuần.",
        grammarHint: "Chú ý: 'submitted' (V-ed) + 'two weeks ago' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Submitted' = V-ed và '... ago' là dấu hiệu chỉ dùng với Quá khứ đơn → Quá khứ đơn.",
        explanationVi:
          "'... ago' (cách đây ...) chỉ đi với Quá khứ đơn, không bao giờ với HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q04",
        sentence: "The negotiations ended successfully in 2019.",
        translation: "Cuộc đàm phán đã kết thúc thành công vào năm 2019.",
        grammarHint: "Chú ý: 'ended' (V-ed) + 'in 2019' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "D",
        explanation:
          "'Ended' = V-ed và 'in 2019' là mốc năm quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'In + năm quá khứ' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q05",
        sentence: "The technician repaired the malfunctioning server last night.",
        translation: "Kỹ thuật viên đã sửa máy chủ bị lỗi vào tối qua.",
        grammarHint: "Chú ý: 'repaired' (V-ed) + 'last night' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Repaired' = V-ed và 'last night' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last night' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q06",
        sentence: "We signed the partnership agreement three months ago.",
        translation: "Chúng tôi đã ký thỏa thuận hợp tác cách đây ba tháng.",
        grammarHint: "Chú ý: 'signed' (V-ed) + 'three months ago' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Signed' = V-ed và 'three months ago' là dấu hiệu Quá khứ đơn → Quá khứ đơn.",
        explanationVi:
          "'... ago' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q07",
        sentence: "The CEO announced the merger at the press conference on Monday.",
        translation: "Giám đốc điều hành đã công bố vụ sáp nhập tại buổi họp báo vào thứ Hai.",
        grammarHint: "Chú ý: 'announced' (V-ed) + 'on Monday' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Announced' = V-ed và 'on Monday' (một ngày cụ thể đã qua) → Quá khứ đơn.",
        explanationVi:
          "'On + ngày cụ thể' đã qua = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q08",
        sentence: "The auditors reviewed all the financial records last quarter.",
        translation: "Các kiểm toán viên đã xem xét toàn bộ hồ sơ tài chính vào quý trước.",
        grammarHint: "Chú ý: 'reviewed' (V-ed) + 'last quarter' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "D",
        explanation:
          "'Reviewed' = V-ed và 'last quarter' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last quarter' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q09",
        sentence: "The factory produced a record number of units last month.",
        translation: "Nhà máy đã sản xuất số lượng sản phẩm kỷ lục vào tháng trước.",
        grammarHint: "Chú ý: 'produced' (V-ed) + 'last month' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Produced' = V-ed và 'last month' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last month' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q10",
        sentence: "He founded the startup in 2015 with two colleagues.",
        translation: "Anh ấy đã thành lập công ty khởi nghiệp vào năm 2015 cùng hai đồng nghiệp.",
        grammarHint: "Chú ý: 'founded' (V-ed) + 'in 2015' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Founded' = V2 (found → founded) và 'in 2015' là mốc năm quá khứ → Quá khứ đơn.",
        explanationVi:
          "'In + năm quá khứ' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q11",
        sentence: "The shipment arrived at the warehouse yesterday morning.",
        translation: "Lô hàng đã đến kho vào sáng hôm qua.",
        grammarHint: "Chú ý: 'arrived' (V-ed) + 'yesterday morning' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Arrived' = V-ed và 'yesterday morning' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Yesterday morning' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q12",
        sentence: "The committee selected the winning proposal last Friday.",
        translation: "Ủy ban đã chọn đề xuất chiến thắng vào thứ Sáu tuần trước.",
        grammarHint: "Chú ý: 'selected' (V-ed) + 'last Friday' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "D",
        explanation:
          "'Selected' = V-ed và 'last Friday' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last + thứ trong tuần' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q13",
        sentence: "The store offered significant discounts last December.",
        translation: "Cửa hàng đã đưa ra mức chiết khấu đáng kể vào tháng 12 năm ngoái.",
        grammarHint: "Chú ý: 'offered' (V-ed) + 'last December' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Offered' = V-ed và 'last December' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last + tháng' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q14",
        sentence: "They relocated their headquarters to Singapore in 2021.",
        translation: "Họ đã chuyển trụ sở chính đến Singapore vào năm 2021.",
        grammarHint: "Chú ý: 'relocated' (V-ed) + 'in 2021' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Relocated' = V-ed và 'in 2021' là mốc năm quá khứ → Quá khứ đơn.",
        explanationVi:
          "'In + năm quá khứ' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q15",
        sentence: "The consultant presented her findings to the board last week.",
        translation: "Chuyên gia tư vấn đã trình bày các phát hiện với hội đồng vào tuần trước.",
        grammarHint: "Chú ý: 'presented' (V-ed) + 'last week' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Presented' = V-ed và 'last week' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last week' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q16",
        sentence: "The airline canceled several flights due to the storm yesterday.",
        translation: "Hãng hàng không đã hủy một số chuyến bay do cơn bão vào hôm qua.",
        grammarHint: "Chú ý: 'canceled' (V-ed) + 'yesterday' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "D",
        explanation:
          "'Canceled' = V-ed và 'yesterday' là dấu hiệu Quá khứ đơn → Quá khứ đơn.",
        explanationVi:
          "'Yesterday' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q17",
        sentence: "The manager hired three new employees last month.",
        translation: "Người quản lý đã tuyển ba nhân viên mới vào tháng trước.",
        grammarHint: "Chú ý: 'hired' (V-ed) + 'last month' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ đơn (V-ed / V2)",
          B: "Hiện tại đơn (V / V-s/es)",
          C: "Hiện tại hoàn thành (have/has + V3)",
          D: "Quá khứ tiếp diễn (was/were + V-ing)",
        },
        correct: "A",
        explanation:
          "'Hired' = V-ed và 'last month' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last month' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q18",
        sentence: "The team completed the project ahead of schedule last year.",
        translation: "Nhóm đã hoàn thành dự án trước thời hạn vào năm ngoái.",
        grammarHint: "Chú ý: 'completed' (V-ed) + 'last year' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại đơn (V / V-s/es)",
          B: "Quá khứ đơn (V-ed / V2)",
          C: "Quá khứ tiếp diễn (was/were + V-ing)",
          D: "Hiện tại hoàn thành (have/has + V3)",
        },
        correct: "B",
        explanation:
          "'Completed' = V-ed và 'last year' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last year' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q19",
        sentence: "The supplier delivered the raw materials on time last Tuesday.",
        translation: "Nhà cung cấp đã giao nguyên liệu thô đúng hạn vào thứ Ba tuần trước.",
        grammarHint: "Chú ý: 'delivered' (V-ed) + 'last Tuesday' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Hiện tại hoàn thành (have/has + V3)",
          B: "Quá khứ tiếp diễn (was/were + V-ing)",
          C: "Quá khứ đơn (V-ed / V2)",
          D: "Hiện tại đơn (V / V-s/es)",
        },
        correct: "C",
        explanation:
          "'Delivered' = V-ed và 'last Tuesday' là mốc quá khứ xác định → Quá khứ đơn.",
        explanationVi:
          "'Last Tuesday' = Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l1-q20",
        sentence: "The company reported strong earnings in the previous quarter.",
        translation: "Công ty đã báo cáo lợi nhuận mạnh trong quý trước.",
        grammarHint: "Chú ý: 'reported' (V-ed) + 'in the previous quarter' → Quá khứ đơn",
        question: "Câu trên thuộc thì nào?",
        options: {
          A: "Quá khứ tiếp diễn (was/were + V-ing)",
          B: "Hiện tại hoàn thành (have/has + V3)",
          C: "Hiện tại đơn (V / V-s/es)",
          D: "Quá khứ đơn (V-ed / V2)",
        },
        correct: "D",
        explanation:
          "'Reported' = V-ed và 'in the previous quarter' là khoảng thời gian đã qua → Quá khứ đơn.",
        explanationVi:
          "'Previous quarter' (quý trước, đã qua) = Quá khứ đơn.",
      },
    ],
  },

  // ── L2: Time Markers ─────────────────────────────────────────────────────────
  {
    level: 2,
    slug: "l2",
    name: "Dấu hiệu thời gian",
    nameEn: "Time Markers",
    description: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
    instruction:
      "Bấm vào các từ hoặc cụm từ là dấu hiệu thì. Có thể có nhiều từ trong một câu.",
    difficulty: "easy",
    passThreshold: 80,
    questions: [
      {
        kind: "highlight",
        id: "qkd-l2-q01",
        sentence: "The company relocated its main office to the business district yesterday.",
        translation: "Công ty đã chuyển văn phòng chính đến khu thương mại vào hôm qua.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["yesterday"],
        explanation:
          "'Yesterday' (hôm qua) là time marker điển hình nhất của Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q02",
        sentence: "We finalized the merger agreement last week after lengthy discussions.",
        translation: "Chúng tôi đã hoàn tất thỏa thuận sáp nhập vào tuần trước sau các cuộc thảo luận kéo dài.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["last", "week"],
        explanation:
          "'Last week' (tuần trước) là cụm time marker của Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q03",
        sentence: "The startup secured its first major investment three years ago.",
        translation: "Công ty khởi nghiệp đã nhận được khoản đầu tư lớn đầu tiên cách đây ba năm.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["three", "years", "ago"],
        explanation:
          "'... ago' (cách đây ...) chỉ đi với Quá khứ đơn — không bao giờ dùng với Hiện tại hoàn thành.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q04",
        sentence: "The current management team took control of the firm in 2018.",
        translation: "Ban quản lý hiện tại đã nắm quyền điều hành công ty vào năm 2018.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["in", "2018"],
        explanation:
          "'In + năm quá khứ' (in 2018) là dấu hiệu mốc thời gian xác định → Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q05",
        sentence: "The department heads reached a consensus on the restructuring plan then.",
        translation: "Các trưởng bộ phận đã đạt được đồng thuận về kế hoạch tái cơ cấu lúc đó.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["then"],
        explanation:
          "'Then' (lúc đó) chỉ một thời điểm cụ thể trong quá khứ → Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q06",
        sentence: "The organization employed only twelve people at that time.",
        translation: "Tổ chức chỉ tuyển dụng mười hai người vào thời điểm đó.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["at", "that", "time"],
        explanation:
          "'At that time' (vào thời điểm đó) chỉ một mốc quá khứ cụ thể → Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q07",
        sentence: "This building formerly housed the regional sales headquarters.",
        translation: "Tòa nhà này trước đây từng là trụ sở bán hàng khu vực.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["formerly"],
        explanation:
          "'Formerly' (trước đây) diễn tả tình trạng đã qua và không còn nữa → Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q08",
        sentence: "The corporation posted record earnings last month.",
        translation: "Tập đoàn đã công bố lợi nhuận kỷ lục vào tháng trước.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["last", "month"],
        explanation:
          "'Last month' (tháng trước) là cụm time marker của Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q09",
        sentence: "The company previously operated under a completely different brand name.",
        translation: "Công ty trước đây hoạt động dưới một tên thương hiệu hoàn toàn khác.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["previously"],
        explanation:
          "'Previously' (trước đây) diễn tả sự việc đã qua trong quá khứ → Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q10",
        sentence: "The maintenance crew replaced the damaged elevator yesterday.",
        translation: "Đội bảo trì đã thay thang máy hư hỏng vào hôm qua.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["yesterday"],
        explanation:
          "'Yesterday' (hôm qua) là dấu hiệu Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q11",
        sentence: "The monitoring system detected a security breach last night.",
        translation: "Hệ thống giám sát đã phát hiện một vụ xâm nhập an ninh vào tối qua.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["last", "night"],
        explanation:
          "'Last night' (tối qua) là cụm time marker của Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q12",
        sentence: "The enterprise first entered the European market in 2010.",
        translation: "Doanh nghiệp lần đầu thâm nhập thị trường châu Âu vào năm 2010.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["in", "2010"],
        explanation:
          "'In 2010' (năm quá khứ xác định) là dấu hiệu Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q13",
        sentence: "The founder handed over the leadership eight years ago.",
        translation: "Nhà sáng lập đã trao lại quyền lãnh đạo cách đây tám năm.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["eight", "years", "ago"],
        explanation:
          "'... ago' (cách đây ...) là dấu hiệu chỉ dùng với Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q14",
        sentence: "The property once served as a textile manufacturing plant.",
        translation: "Khu đất này từng là một nhà máy sản xuất dệt may.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["once"],
        explanation:
          "'Once' (đã từng, ở một thời điểm trong quá khứ) → Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q15",
        sentence: "The committee approved the expansion budget last Tuesday.",
        translation: "Ủy ban đã phê duyệt ngân sách mở rộng vào thứ Ba tuần trước.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["last", "Tuesday"],
        explanation:
          "'Last Tuesday' (thứ Ba tuần trước) là cụm time marker của Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q16",
        sentence: "The firm achieved its sales targets last year.",
        translation: "Công ty đã đạt các chỉ tiêu doanh số vào năm ngoái.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["last", "year"],
        explanation:
          "'Last year' (năm ngoái) là cụm time marker của Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q17",
        sentence: "The two executives launched the joint venture six months ago.",
        translation: "Hai giám đốc điều hành đã khởi động liên doanh cách đây sáu tháng.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["six", "months", "ago"],
        explanation:
          "'... ago' (cách đây ...) là dấu hiệu Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q18",
        sentence: "Workplace safety standards were far less strict at that time.",
        translation: "Các tiêu chuẩn an toàn lao động lỏng lẻo hơn nhiều vào thời điểm đó.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["at", "that", "time"],
        explanation:
          "'At that time' (vào thời điểm đó) chỉ một mốc quá khứ cụ thể → Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q19",
        sentence: "The corporation established its first overseas branch in 2005.",
        translation: "Tập đoàn đã thành lập chi nhánh nước ngoài đầu tiên vào năm 2005.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["in", "2005"],
        explanation:
          "'In 2005' (năm quá khứ xác định) là dấu hiệu Quá khứ đơn.",
      },
      {
        kind: "highlight",
        id: "qkd-l2-q20",
        sentence: "Overall revenue declined slightly last quarter.",
        translation: "Doanh thu tổng thể đã giảm nhẹ vào quý trước.",
        instruction: "Bấm vào từ/cụm là dấu hiệu nhận biết thì Quá khứ đơn.",
        correctWords: ["last", "quarter"],
        explanation:
          "'Last quarter' (quý trước) là cụm time marker của Quá khứ đơn.",
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
      "Đọc bản dịch tiếng Việt để hiểu ngữ cảnh, rồi chọn dạng động từ phù hợp. Phân biệt mốc thời gian xác định (Quá khứ đơn) với 'kể từ/đã từng/cho đến nay' (Hiện tại hoàn thành).",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "qkd-l3-q01",
        sentence: "The board _____ the merger proposal at yesterday's meeting.",
        translation: "Hội đồng đã phê duyệt đề xuất sáp nhập tại cuộc họp hôm qua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "approved",
          B: "has approved",
          C: "approves",
          D: "was approving",
        },
        correct: "A",
        explanation:
          "'Yesterday's meeting' = mốc quá khứ xác định → Quá khứ đơn: 'approved'.",
        explanationVi:
          "Có mốc quá khứ ('hôm qua') → Quá khứ đơn, không dùng HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q02",
        sentence: "The company _____ its new headquarters in 2019.",
        translation: "Công ty đã khánh thành trụ sở mới vào năm 2019.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "opens",
          B: "opened",
          C: "has opened",
          D: "is opening",
        },
        correct: "B",
        explanation:
          "'In 2019' = mốc năm quá khứ → Quá khứ đơn: 'opened'.",
        explanationVi:
          "'In + năm quá khứ' → Quá khứ đơn. 'Has opened' sai vì có mốc thời gian xác định.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q03",
        sentence: "She _____ the report last Friday before the deadline.",
        translation: "Cô ấy đã nộp báo cáo vào thứ Sáu tuần trước trước hạn chót.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has submitted",
          B: "submits",
          C: "submitted",
          D: "was submitting",
        },
        correct: "C",
        explanation:
          "'Last Friday' = mốc quá khứ xác định → Quá khứ đơn: 'submitted'.",
        explanationVi:
          "'Last Friday' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q04",
        sentence: "The technician _____ the broken printer two days ago.",
        translation: "Kỹ thuật viên đã sửa máy in hỏng cách đây hai ngày.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has fixed",
          B: "fixes",
          C: "is fixing",
          D: "fixed",
        },
        correct: "D",
        explanation:
          "'Two days ago' = dấu hiệu Quá khứ đơn → 'fixed'.",
        explanationVi:
          "'... ago' → Quá khứ đơn, không bao giờ dùng HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q05",
        sentence: "We _____ the contract as soon as we received the final terms.",
        translation: "Chúng tôi đã ký hợp đồng ngay khi nhận được các điều khoản cuối cùng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "signed",
          B: "have signed",
          C: "sign",
          D: "were signing",
        },
        correct: "A",
        explanation:
          "Chuỗi hành động quá khứ nối tiếp ('as soon as we received') → Quá khứ đơn: 'signed'.",
        explanationVi:
          "Hai hành động quá khứ nối tiếp nhau → cả hai dùng Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q06",
        sentence: "The company _____ its revenue significantly since it entered the Asian market.",
        translation: "Công ty đã tăng doanh thu đáng kể kể từ khi thâm nhập thị trường châu Á.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "increased",
          B: "has increased",
          C: "increases",
          D: "was increasing",
        },
        correct: "B",
        explanation:
          "'Since it entered...' + kết quả kéo dài đến hiện tại → Hiện tại hoàn thành: 'has increased'.",
        explanationVi:
          "'Since' + kết quả còn đến hiện tại → HTHT. Đây là câu bẫy phân biệt với Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q07",
        sentence: "The delegates _____ the exhibition hall shortly after the opening ceremony.",
        translation: "Các đại biểu đã rời khỏi hội trường triển lãm ngay sau lễ khai mạc.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "have left",
          B: "leave",
          C: "left",
          D: "were leaving",
        },
        correct: "C",
        explanation:
          "Hành động quá khứ hoàn tất tại thời điểm cụ thể ('after the opening ceremony') → Quá khứ đơn: 'left'.",
        explanationVi:
          "Mốc quá khứ cụ thể → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q08",
        sentence: "The auditor _____ several errors in last year's financial statements.",
        translation: "Kiểm toán viên đã phát hiện một số lỗi trong báo cáo tài chính năm ngoái.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has found",
          B: "finds",
          C: "is finding",
          D: "found",
        },
        correct: "D",
        explanation:
          "'Last year's financial statements' = mốc quá khứ xác định → Quá khứ đơn: 'found'.",
        explanationVi:
          "'Last year' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q09",
        sentence: "The negotiations _____ when both parties reached an agreement.",
        translation: "Cuộc đàm phán đã kết thúc khi cả hai bên đạt được thỏa thuận.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "ended",
          B: "have ended",
          C: "end",
          D: "were ending",
        },
        correct: "A",
        explanation:
          "'When both parties reached...' = hành động quá khứ nối tiếp → Quá khứ đơn: 'ended'.",
        explanationVi:
          "'When' + quá khứ → cả mệnh đề chính dùng Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q10",
        sentence: "The marketing team _____ a new campaign last quarter.",
        translation: "Nhóm marketing đã ra mắt một chiến dịch mới vào quý trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "launches",
          B: "launched",
          C: "has launched",
          D: "is launching",
        },
        correct: "B",
        explanation:
          "'Last quarter' = mốc quá khứ xác định → Quá khứ đơn: 'launched'.",
        explanationVi:
          "'Last quarter' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q11",
        sentence: "He _____ the company in 2012 and led it for eight years.",
        translation: "Anh ấy đã thành lập công ty vào năm 2012 và lãnh đạo nó trong tám năm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has founded",
          B: "founds",
          C: "founded",
          D: "was founding",
        },
        correct: "C",
        explanation:
          "'In 2012' = mốc năm quá khứ → Quá khứ đơn: 'founded'.",
        explanationVi:
          "'In + năm quá khứ' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q12",
        sentence: "The supplier _____ the goods three days later than promised.",
        translation: "Nhà cung cấp đã giao hàng trễ ba ngày so với cam kết.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has delivered",
          B: "delivers",
          C: "is delivering",
          D: "delivered",
        },
        correct: "D",
        explanation:
          "Sự việc đã hoàn tất trong quá khứ → Quá khứ đơn: 'delivered'.",
        explanationVi:
          "Hành động đã kết thúc trong quá khứ → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q13",
        sentence: "The employees _____ the fire drill calmly yesterday afternoon.",
        translation: "Các nhân viên đã thực hiện diễn tập chữa cháy một cách bình tĩnh vào chiều hôm qua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "completed",
          B: "have completed",
          C: "complete",
          D: "were completing",
        },
        correct: "A",
        explanation:
          "'Yesterday afternoon' = mốc quá khứ xác định → Quá khứ đơn: 'completed'.",
        explanationVi:
          "'Yesterday afternoon' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q14",
        sentence: "Our sales team _____ its annual target already this year.",
        translation: "Nhóm bán hàng của chúng tôi đã đạt chỉ tiêu năm nay rồi.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "reached",
          B: "has reached",
          C: "reaches",
          D: "was reaching",
        },
        correct: "B",
        explanation:
          "'Already' + 'this year' (khoảng thời gian chưa kết thúc) → Hiện tại hoàn thành: 'has reached'.",
        explanationVi:
          "'Already' + 'this year' (chưa xong) → HTHT. Đây là câu bẫy phân biệt với Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q15",
        sentence: "The CEO _____ the award at the ceremony last night.",
        translation: "Giám đốc điều hành đã nhận giải thưởng tại buổi lễ tối qua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has accepted",
          B: "accepts",
          C: "accepted",
          D: "was accepting",
        },
        correct: "C",
        explanation:
          "'Last night' = mốc quá khứ xác định → Quá khứ đơn: 'accepted'.",
        explanationVi:
          "'Last night' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q16",
        sentence: "The factory _____ production for two hours during the power outage.",
        translation: "Nhà máy đã ngừng sản xuất trong hai giờ khi mất điện.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has halted",
          B: "halts",
          C: "is halting",
          D: "halted",
        },
        correct: "D",
        explanation:
          "Sự việc đã xảy ra và kết thúc trong quá khứ ('during the power outage') → Quá khứ đơn: 'halted'.",
        explanationVi:
          "Sự việc đã kết thúc trong quá khứ → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q17",
        sentence: "The committee _____ the winning design after a long discussion.",
        translation: "Ủy ban đã chọn thiết kế chiến thắng sau một cuộc thảo luận dài.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "chose",
          B: "has chosen",
          C: "chooses",
          D: "was choosing",
        },
        correct: "A",
        explanation:
          "Hành động quá khứ đã hoàn tất → Quá khứ đơn: 'chose' (choose → chose).",
        explanationVi:
          "Hành động đã kết thúc → Quá khứ đơn (choose → chose).",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q18",
        sentence: "The firm _____ three new branches so far this decade.",
        translation: "Công ty đã mở ba chi nhánh mới tính đến nay trong thập kỷ này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "opened",
          B: "has opened",
          C: "opens",
          D: "was opening",
        },
        correct: "B",
        explanation:
          "'So far' (tính đến nay) → Hiện tại hoàn thành: 'has opened'.",
        explanationVi:
          "'So far' → HTHT. Đây là câu bẫy phân biệt với Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q19",
        sentence: "The customer _____ a complaint about the late shipment last week.",
        translation: "Khách hàng đã gửi khiếu nại về việc giao hàng trễ vào tuần trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has filed",
          B: "files",
          C: "filed",
          D: "was filing",
        },
        correct: "C",
        explanation:
          "'Last week' = mốc quá khứ xác định → Quá khứ đơn: 'filed'.",
        explanationVi:
          "'Last week' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l3-q20",
        sentence: "The engineers _____ the prototype during the testing phase in March.",
        translation: "Các kỹ sư đã cải tiến nguyên mẫu trong giai đoạn thử nghiệm vào tháng Ba.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "have improved",
          B: "improve",
          C: "are improving",
          D: "improved",
        },
        correct: "D",
        explanation:
          "'In March' (một tháng đã qua) = mốc quá khứ xác định → Quá khứ đơn: 'improved'.",
        explanationVi:
          "'In March' (đã qua) → Quá khứ đơn.",
      },
    ],
  },

  // ── L4: Active + Passive ──────────────────────────────────────────────────────
  {
    level: 4,
    slug: "l4",
    name: "Chia động từ",
    nameEn: "Verb Form",
    description: "Chọn dạng động từ đúng (chủ động và bị động Quá khứ đơn).",
    instruction:
      "Chú ý chủ ngữ câu: nếu chủ ngữ thực hiện hành động → Active (V-ed / V2). Nếu chủ ngữ nhận hành động → Passive (was/were + V3).",
    difficulty: "medium",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "qkd-l4-q01",
        sentence: "The two companies _____ the partnership agreement last month.",
        translation: "Hai công ty đã ký thỏa thuận hợp tác vào tháng trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "signed",
          B: "were signed",
          C: "sign",
          D: "have signed",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the two companies' tự thực hiện → Active Quá khứ đơn: 'signed'.",
        explanationVi:
          "Hai công ty TỰ ký → chủ động. 'Were signed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q02",
        sentence: "The partnership agreement _____ by the two companies last month.",
        translation: "Thỏa thuận hợp tác đã được ký bởi hai công ty vào tháng trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "signed",
          B: "was signed",
          C: "is signed",
          D: "has signed",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the agreement' (số ít) nhận hành động + 'by the two companies' → Passive Quá khứ đơn: 'was signed'.",
        explanationVi:
          "Thỏa thuận 'được ký' → bị động Quá khứ đơn: was + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q03",
        sentence: "The construction crew _____ the new terminal ahead of schedule.",
        translation: "Đội thi công đã hoàn thành nhà ga mới trước tiến độ.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "was completed",
          B: "completes",
          C: "completed",
          D: "has completed",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the construction crew' tự thực hiện → Active Quá khứ đơn: 'completed'.",
        explanationVi:
          "Đội thi công TỰ hoàn thành → chủ động. 'Was completed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q04",
        sentence: "The new terminal _____ by the construction crew ahead of schedule.",
        translation: "Nhà ga mới đã được hoàn thành bởi đội thi công trước tiến độ.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "completed",
          B: "is completed",
          C: "completes",
          D: "was completed",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the new terminal' (số ít) nhận hành động → Passive Quá khứ đơn: 'was completed'.",
        explanationVi:
          "Nhà ga 'được hoàn thành' → bị động Quá khứ đơn: was + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q05",
        sentence: "The safety officer _____ all the machines before the shift started.",
        translation: "Nhân viên an toàn đã kiểm tra tất cả máy móc trước khi ca làm bắt đầu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "inspected",
          B: "were inspected",
          C: "inspects",
          D: "has inspected",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the safety officer' tự thực hiện → Active Quá khứ đơn: 'inspected'.",
        explanationVi:
          "Nhân viên an toàn TỰ kiểm tra → chủ động.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q06",
        sentence: "All the machines _____ by the safety officer before the shift started.",
        translation: "Tất cả máy móc đã được kiểm tra bởi nhân viên an toàn trước khi ca làm bắt đầu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "inspected",
          B: "were inspected",
          C: "are inspected",
          D: "have inspected",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'all the machines' (số nhiều) nhận hành động → Passive Quá khứ đơn: 'were inspected'.",
        explanationVi:
          "Máy móc (số nhiều) 'được kiểm tra' → bị động: were + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q07",
        sentence: "The finance committee _____ the budget proposal at the last meeting.",
        translation: "Ủy ban tài chính đã phê duyệt đề xuất ngân sách tại cuộc họp trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "was approved",
          B: "approves",
          C: "approved",
          D: "has approved",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the finance committee' tự thực hiện → Active Quá khứ đơn: 'approved'.",
        explanationVi:
          "Ủy ban TỰ phê duyệt → chủ động. 'Was approved' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q08",
        sentence: "The budget proposal _____ by the finance committee at the last meeting.",
        translation: "Đề xuất ngân sách đã được phê duyệt bởi ủy ban tài chính tại cuộc họp trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "approved",
          B: "is approved",
          C: "approves",
          D: "was approved",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the budget proposal' (số ít) nhận hành động → Passive Quá khứ đơn: 'was approved'.",
        explanationVi:
          "Đề xuất 'được phê duyệt' → bị động Quá khứ đơn: was + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q09",
        sentence: "The supplier _____ the raw materials to the factory yesterday.",
        translation: "Nhà cung cấp đã giao nguyên liệu thô đến nhà máy hôm qua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "delivered",
          B: "were delivered",
          C: "delivers",
          D: "has delivered",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the supplier' tự thực hiện → Active Quá khứ đơn: 'delivered'.",
        explanationVi:
          "Nhà cung cấp TỰ giao → chủ động.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q10",
        sentence: "The raw materials _____ to the factory by the supplier yesterday.",
        translation: "Nguyên liệu thô đã được giao đến nhà máy bởi nhà cung cấp hôm qua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "delivered",
          B: "were delivered",
          C: "are delivered",
          D: "have delivered",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the raw materials' (số nhiều) nhận hành động → Passive Quá khứ đơn: 'were delivered'.",
        explanationVi:
          "Nguyên liệu (số nhiều) 'được giao' → bị động: were + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q11",
        sentence: "A famous architect _____ the company's new headquarters in 2015.",
        translation: "Một kiến trúc sư nổi tiếng đã thiết kế trụ sở mới của công ty vào năm 2015.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "was designed",
          B: "designs",
          C: "designed",
          D: "has designed",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'a famous architect' tự thực hiện → Active Quá khứ đơn: 'designed'.",
        explanationVi:
          "Kiến trúc sư TỰ thiết kế → chủ động. 'Was designed' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q12",
        sentence: "The company's new headquarters _____ by a famous architect in 2015.",
        translation: "Trụ sở mới của công ty đã được thiết kế bởi một kiến trúc sư nổi tiếng vào năm 2015.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "designed",
          B: "is designed",
          C: "designs",
          D: "was designed",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the headquarters' nhận hành động → Passive Quá khứ đơn: 'was designed'.",
        explanationVi:
          "Trụ sở 'được thiết kế' → bị động Quá khứ đơn: was + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q13",
        sentence: "The startup _____ its mobile app at a major tech event last year.",
        translation: "Công ty khởi nghiệp đã ra mắt ứng dụng di động tại một sự kiện công nghệ lớn năm ngoái.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "launched",
          B: "was launched",
          C: "launches",
          D: "has launched",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the startup' tự thực hiện → Active Quá khứ đơn: 'launched'.",
        explanationVi:
          "Công ty TỰ ra mắt → chủ động.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q14",
        sentence: "The mobile app _____ at a major tech event by the startup last year.",
        translation: "Ứng dụng di động đã được ra mắt tại một sự kiện công nghệ lớn bởi công ty khởi nghiệp năm ngoái.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "launched",
          B: "was launched",
          C: "is launched",
          D: "has launched",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the mobile app' (số ít) nhận hành động → Passive Quá khứ đơn: 'was launched'.",
        explanationVi:
          "Ứng dụng 'được ra mắt' → bị động Quá khứ đơn: was + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q15",
        sentence: "The senior manager _____ all the new recruits during the orientation week.",
        translation: "Quản lý cấp cao đã đào tạo tất cả nhân viên mới trong tuần định hướng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "was trained",
          B: "trains",
          C: "trained",
          D: "has trained",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the senior manager' tự thực hiện → Active Quá khứ đơn: 'trained'.",
        explanationVi:
          "Quản lý TỰ đào tạo → chủ động. 'Was trained' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q16",
        sentence: "All the new recruits _____ by the senior manager during the orientation week.",
        translation: "Tất cả nhân viên mới đã được đào tạo bởi quản lý cấp cao trong tuần định hướng.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "trained",
          B: "are trained",
          C: "train",
          D: "were trained",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'all the new recruits' (số nhiều) nhận hành động → Passive Quá khứ đơn: 'were trained'.",
        explanationVi:
          "Nhân viên mới (số nhiều) 'được đào tạo' → bị động: were + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q17",
        sentence: "The technicians _____ the new security cameras throughout the building last week.",
        translation: "Các kỹ thuật viên đã lắp đặt camera an ninh mới khắp tòa nhà vào tuần trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "installed",
          B: "were installed",
          C: "install",
          D: "have installed",
        },
        correct: "A",
        explanation:
          "Chủ ngữ 'the technicians' tự thực hiện → Active Quá khứ đơn: 'installed'.",
        explanationVi:
          "Kỹ thuật viên TỰ lắp đặt → chủ động.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q18",
        sentence: "The new security cameras _____ throughout the building by the technicians last week.",
        translation: "Camera an ninh mới đã được lắp đặt khắp tòa nhà bởi các kỹ thuật viên vào tuần trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "installed",
          B: "were installed",
          C: "are installed",
          D: "have installed",
        },
        correct: "B",
        explanation:
          "Chủ ngữ 'the new security cameras' (số nhiều) nhận hành động → Passive Quá khứ đơn: 'were installed'.",
        explanationVi:
          "Camera (số nhiều) 'được lắp đặt' → bị động: were + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q19",
        sentence: "The research institute _____ the survey results in a leading journal.",
        translation: "Viện nghiên cứu đã công bố kết quả khảo sát trên một tạp chí hàng đầu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "was published",
          B: "publishes",
          C: "published",
          D: "has published",
        },
        correct: "C",
        explanation:
          "Chủ ngữ 'the research institute' tự thực hiện → Active Quá khứ đơn: 'published'.",
        explanationVi:
          "Viện nghiên cứu TỰ công bố → chủ động. 'Was published' là bị động — sai.",
      },
      {
        kind: "mcq",
        id: "qkd-l4-q20",
        sentence: "The survey results _____ in a leading journal by the research institute.",
        translation: "Kết quả khảo sát đã được công bố trên một tạp chí hàng đầu bởi viện nghiên cứu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "published",
          B: "are published",
          C: "publish",
          D: "were published",
        },
        correct: "D",
        explanation:
          "Chủ ngữ 'the survey results' (số nhiều) nhận hành động → Passive Quá khứ đơn: 'were published'.",
        explanationVi:
          "Kết quả (số nhiều) 'được công bố' → bị động: were + V3.",
      },
    ],
  },

  // ── L5: Tense Discrimination ─────────────────────────────────────────────────
  {
    level: 5,
    slug: "l5",
    name: "Phân biệt 2 thì",
    nameEn: "Tense Discrimination",
    description: "Phân biệt Quá khứ đơn với Hiện tại hoàn thành (trường hợp khó).",
    instruction:
      "Chú ý: mốc thời gian xác định (yesterday, last, ago, in + năm, when + quá khứ) → Quá khứ đơn. 'since/for/already/yet/so far/over the past' + kết quả đến hiện tại → Hiện tại hoàn thành.",
    difficulty: "hard",
    passThreshold: 80,
    questions: [
      {
        kind: "mcq",
        id: "qkd-l5-q01",
        sentence: "Since the new manager arrived, productivity _____ by nearly twenty percent.",
        translation: "Kể từ khi quản lý mới đến, năng suất đã tăng gần hai mươi phần trăm.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has risen",
          B: "rose",
          C: "rises",
          D: "was rising",
        },
        correct: "A",
        explanation:
          "'Since the new manager arrived' + kết quả kéo dài đến hiện tại → Hiện tại hoàn thành: 'has risen'.",
        explanationVi:
          "'Since' + kết quả còn đến hiện tại → HTHT, không dùng Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q02",
        sentence: "The organization _____ its annual charity gala at the city hall last December.",
        translation: "Tổ chức đã tổ chức dạ tiệc từ thiện thường niên tại tòa thị chính vào tháng 12 năm ngoái.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has held",
          B: "held",
          C: "holds",
          D: "was holding",
        },
        correct: "B",
        explanation:
          "'Last December' = mốc quá khứ xác định → Quá khứ đơn: 'held' (hold → held).",
        explanationVi:
          "Mốc quá khứ cụ thể ('last December') → Quá khứ đơn, không dùng HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q03",
        sentence: "The manufacturer _____ its recall procedures three times over the past year.",
        translation: "Nhà sản xuất đã cập nhật quy trình thu hồi ba lần trong năm qua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "updated",
          B: "updates",
          C: "has updated",
          D: "was updating",
        },
        correct: "C",
        explanation:
          "'Over the past year' + số lần lặp lại tính đến hiện tại → Hiện tại hoàn thành: 'has updated'.",
        explanationVi:
          "'Over the past year' (khoảng thời gian tính đến hiện tại) → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q04",
        sentence: "The former director _____ the department for over a decade before he retired.",
        translation: "Cựu giám đốc đã điều hành bộ phận hơn một thập kỷ trước khi ông nghỉ hưu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has managed",
          B: "manages",
          C: "is managing",
          D: "managed",
        },
        correct: "D",
        explanation:
          "'Before he retired' = giai đoạn đã kết thúc trong quá khứ → Quá khứ đơn: 'managed'.",
        explanationVi:
          "'Former director' + 'before he retired' → sự việc đã kết thúc → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q05",
        sentence: "When the fire alarm rang, all the staff _____ the building immediately.",
        translation: "Khi chuông báo cháy vang lên, toàn bộ nhân viên đã rời khỏi tòa nhà ngay lập tức.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "evacuated",
          B: "have evacuated",
          C: "evacuate",
          D: "were evacuating",
        },
        correct: "A",
        explanation:
          "'When the fire alarm rang' = hai hành động quá khứ nối tiếp → Quá khứ đơn: 'evacuated'.",
        explanationVi:
          "'When' + quá khứ + hành động nối tiếp → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q06",
        sentence: "The IT department _____ the software several times, but the bug still persists.",
        translation: "Bộ phận IT đã cập nhật phần mềm nhiều lần, nhưng lỗi vẫn còn.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "patched",
          B: "has patched",
          C: "patches",
          D: "was patching",
        },
        correct: "B",
        explanation:
          "Kết quả liên quan đến hiện tại ('the bug still persists') → Hiện tại hoàn thành: 'has patched'.",
        explanationVi:
          "Hành động quá khứ có kết quả còn đến hiện tại → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q07",
        sentence: "The company _____ a significant loss during the financial crisis of 2008.",
        translation: "Công ty đã chịu một khoản lỗ đáng kể trong cuộc khủng hoảng tài chính năm 2008.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has suffered",
          B: "suffers",
          C: "suffered",
          D: "was suffering",
        },
        correct: "C",
        explanation:
          "'Of 2008' = mốc năm quá khứ xác định → Quá khứ đơn: 'suffered'.",
        explanationVi:
          "Mốc năm quá khứ ('2008') → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q08",
        sentence: "The board _____ on the proposed merger yet.",
        translation: "Hội đồng vẫn chưa quyết định về đề xuất sáp nhập.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "decided",
          B: "decides",
          C: "was deciding",
          D: "has not decided",
        },
        correct: "D",
        explanation:
          "'Yet' (trong câu phủ định) → Hiện tại hoàn thành: 'has not decided'.",
        explanationVi:
          "'Yet' (chưa) → HTHT phủ định, không dùng Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q09",
        sentence: "This is the third time the client _____ the delivery date this month.",
        translation: "Đây là lần thứ ba khách hàng thay đổi ngày giao hàng trong tháng này.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has changed",
          B: "changed",
          C: "changes",
          D: "was changing",
        },
        correct: "A",
        explanation:
          "Cấu trúc 'This is the first/second/third time + S + have/has + V3' → Hiện tại hoàn thành: 'has changed'.",
        explanationVi:
          "'This is the ... time' → luôn dùng HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q10",
        sentence: "The keynote speaker _____ the stage right after she finished her presentation.",
        translation: "Diễn giả chính đã rời sân khấu ngay sau khi kết thúc bài thuyết trình.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has left",
          B: "left",
          C: "leaves",
          D: "was leaving",
        },
        correct: "B",
        explanation:
          "'Right after she finished' = hai hành động quá khứ nối tiếp → Quá khứ đơn: 'left'.",
        explanationVi:
          "Hành động quá khứ nối tiếp ('after she finished') → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q11",
        sentence: "Online sales _____ dramatically since the pandemic began.",
        translation: "Doanh số trực tuyến đã tăng đáng kể kể từ khi đại dịch bắt đầu.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "grew",
          B: "grow",
          C: "have grown",
          D: "were growing",
        },
        correct: "C",
        explanation:
          "'Since the pandemic began' + xu hướng kéo dài đến hiện tại → Hiện tại hoàn thành: 'have grown'.",
        explanationVi:
          "'Since' + kết quả đến hiện tại → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q12",
        sentence: "The accountant _____ the discrepancy while reviewing last month's invoices.",
        translation: "Kế toán đã phát hiện sự chênh lệch khi xem xét hóa đơn của tháng trước.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has noticed",
          B: "notices",
          C: "is noticing",
          D: "noticed",
        },
        correct: "D",
        explanation:
          "'Last month's invoices' = mốc quá khứ xác định → Quá khứ đơn: 'noticed'.",
        explanationVi:
          "'Last month' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q13",
        sentence: "The firm _____ its headquarters twice in the last five years.",
        translation: "Công ty đã chuyển trụ sở hai lần trong năm năm qua.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has relocated",
          B: "relocated",
          C: "relocates",
          D: "was relocating",
        },
        correct: "A",
        explanation:
          "'In the last five years' (khoảng thời gian tính đến hiện tại) + số lần → Hiện tại hoàn thành: 'has relocated'.",
        explanationVi:
          "'In the last five years' (đến hiện tại) → HTHT. Khác với 'five years ago' (Quá khứ đơn).",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q14",
        sentence: "The negotiations _____ down after the two sides failed to agree on pricing.",
        translation: "Cuộc đàm phán đã đổ vỡ sau khi hai bên không thống nhất được về giá cả.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "have broken",
          B: "broke",
          C: "breaks",
          D: "were breaking",
        },
        correct: "B",
        explanation:
          "'After the two sides failed' = chuỗi hành động quá khứ đã kết thúc → Quá khứ đơn: 'broke' (break → broke).",
        explanationVi:
          "Hành động quá khứ nối tiếp và đã kết thúc → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q15",
        sentence: "The company _____ a new quality-control system recently to reduce defects.",
        translation: "Công ty gần đây đã áp dụng một hệ thống kiểm soát chất lượng mới để giảm lỗi.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "adopted",
          B: "adopts",
          C: "has adopted",
          D: "was adopting",
        },
        correct: "C",
        explanation:
          "'Recently' + kết quả liên quan đến hiện tại → Hiện tại hoàn thành: 'has adopted'.",
        explanationVi:
          "'Recently' (gần đây) thường đi với HTHT khi nhấn mạnh kết quả hiện tại.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q16",
        sentence: "The founder _____ the business to a larger corporation back in 2016.",
        translation: "Nhà sáng lập đã bán doanh nghiệp cho một tập đoàn lớn hơn vào năm 2016.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has sold",
          B: "sells",
          C: "is selling",
          D: "sold",
        },
        correct: "D",
        explanation:
          "'Back in 2016' = mốc năm quá khứ xác định → Quá khứ đơn: 'sold' (sell → sold).",
        explanationVi:
          "'Back in + năm' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q17",
        sentence: "Our team _____ every deadline so far this quarter without any delays.",
        translation: "Nhóm của chúng tôi đã đáp ứng mọi hạn chót tính đến nay trong quý này mà không có bất kỳ sự chậm trễ nào.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has met",
          B: "met",
          C: "meets",
          D: "was meeting",
        },
        correct: "A",
        explanation:
          "'So far this quarter' (khoảng thời gian chưa kết thúc) → Hiện tại hoàn thành: 'has met'.",
        explanationVi:
          "'So far' + 'this quarter' (chưa xong) → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q18",
        sentence: "The auditors _____ the report as soon as they collected all the necessary documents.",
        translation: "Các kiểm toán viên đã hoàn tất báo cáo ngay khi thu thập đủ tất cả tài liệu cần thiết.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "have finalized",
          B: "finalized",
          C: "finalize",
          D: "were finalizing",
        },
        correct: "B",
        explanation:
          "'As soon as they collected' = chuỗi hành động quá khứ nối tiếp → Quá khứ đơn: 'finalized'.",
        explanationVi:
          "Hai hành động quá khứ nối tiếp → cả hai Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q19",
        sentence: "The regional office _____ a profit every year since it opened.",
        translation: "Văn phòng khu vực đã có lãi mỗi năm kể từ khi mở cửa.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "reported",
          B: "reports",
          C: "has reported",
          D: "was reporting",
        },
        correct: "C",
        explanation:
          "'Since it opened' + tình trạng kéo dài đến hiện tại → Hiện tại hoàn thành: 'has reported'.",
        explanationVi:
          "'Since' + kết quả đến hiện tại → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l5-q20",
        sentence: "The previous CEO _____ the company through a difficult restructuring in the late 1990s.",
        translation: "Cựu CEO đã dẫn dắt công ty vượt qua một cuộc tái cơ cấu khó khăn vào cuối thập niên 1990.",
        question: "Chọn dạng động từ đúng:",
        options: {
          A: "has guided",
          B: "guides",
          C: "is guiding",
          D: "guided",
        },
        correct: "D",
        explanation:
          "'In the late 1990s' = mốc quá khứ xác định → Quá khứ đơn: 'guided'.",
        explanationVi:
          "'Previous CEO' + 'in the late 1990s' → Quá khứ đơn.",
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
        id: "qkd-l6-q01",
        sentence: "The committee _____ the final candidate after three rounds of interviews last week.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "selected",
          B: "has selected",
          C: "selects",
          D: "was selecting",
        },
        correct: "A",
        explanation:
          "'Last week' = mốc quá khứ xác định → Quá khứ đơn: 'selected'.",
        explanationVi:
          "'Last week' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q02",
        sentence: "Productivity _____ steadily since the company introduced flexible working hours.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "increased",
          B: "has increased",
          C: "increases",
          D: "was increasing",
        },
        correct: "B",
        explanation:
          "'Since the company introduced...' + kết quả đến hiện tại → Hiện tại hoàn thành: 'has increased'.",
        explanationVi:
          "'Since' + kết quả đến hiện tại → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q03",
        sentence: "The new employee handbook _____ to all staff members two days ago.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has distributed",
          B: "distributes",
          C: "was distributed",
          D: "is distributed",
        },
        correct: "C",
        explanation:
          "'Two days ago' + chủ ngữ nhận hành động → Passive Quá khứ đơn: 'was distributed'.",
        explanationVi:
          "Bị động Quá khứ đơn = was/were + V3. '... ago' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q04",
        sentence: "The manager _____ the quarterly figures before the board meeting yesterday.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has reviewed",
          B: "reviews",
          C: "is reviewing",
          D: "reviewed",
        },
        correct: "D",
        explanation:
          "'Yesterday' = mốc quá khứ xác định → Quá khứ đơn: 'reviewed'.",
        explanationVi:
          "'Yesterday' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q05",
        sentence: "The firm _____ its overseas operations three times over the past decade.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has expanded",
          B: "expanded",
          C: "expands",
          D: "was expanding",
        },
        correct: "A",
        explanation:
          "'Over the past decade' + số lần lặp lại tính đến hiện tại → Hiện tại hoàn thành: 'has expanded'.",
        explanationVi:
          "'Over the past decade' → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q06",
        sentence: "The technicians _____ the faulty wiring during the scheduled maintenance last night.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "have replaced",
          B: "replaced",
          C: "replace",
          D: "are replacing",
        },
        correct: "B",
        explanation:
          "'Last night' = mốc quá khứ xác định → Quá khứ đơn: 'replaced'.",
        explanationVi:
          "'Last night' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q07",
        sentence: "All the safety inspections _____ by the certified engineer before the factory reopened.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "completed",
          B: "have completed",
          C: "were completed",
          D: "are completed",
        },
        correct: "C",
        explanation:
          "Chủ ngữ số nhiều nhận hành động + 'before the factory reopened' → Passive Quá khứ đơn: 'were completed'.",
        explanationVi:
          "Bị động Quá khứ đơn số nhiều = were + V3.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q08",
        sentence: "The sales department _____ its highest revenue ever during the last holiday season.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has recorded",
          B: "records",
          C: "is recording",
          D: "recorded",
        },
        correct: "D",
        explanation:
          "'During the last holiday season' = khoảng thời gian quá khứ đã kết thúc → Quá khứ đơn: 'recorded'.",
        explanationVi:
          "'Last holiday season' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q09",
        sentence: "The organization _____ significant progress toward its sustainability goals so far.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has made",
          B: "made",
          C: "makes",
          D: "was making",
        },
        correct: "A",
        explanation:
          "'So far' (tính đến nay) → Hiện tại hoàn thành: 'has made'.",
        explanationVi:
          "'So far' → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q10",
        sentence: "The consultant _____ the recommendations at the meeting held on Monday.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has presented",
          B: "presented",
          C: "presents",
          D: "was presenting",
        },
        correct: "B",
        explanation:
          "'The meeting held on Monday' = mốc quá khứ cụ thể → Quá khứ đơn: 'presented'.",
        explanationVi:
          "'On Monday' (đã qua) → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q11",
        sentence: "The prototype _____ by the engineering team when the investors visited the lab.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "demonstrated",
          B: "has demonstrated",
          C: "was demonstrated",
          D: "is demonstrated",
        },
        correct: "C",
        explanation:
          "Chủ ngữ nhận hành động + 'when the investors visited' (mốc quá khứ) → Passive Quá khứ đơn: 'was demonstrated'.",
        explanationVi:
          "Bị động Quá khứ đơn = was + V3. 'When ... visited' → quá khứ.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q12",
        sentence: "The company _____ a strict no-refund policy until customer complaints forced a change.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has maintained",
          B: "maintains",
          C: "is maintaining",
          D: "maintained",
        },
        correct: "D",
        explanation:
          "'Until customer complaints forced a change' = giai đoạn đã kết thúc trong quá khứ → Quá khứ đơn: 'maintained'.",
        explanationVi:
          "'Until ... forced' → sự việc đã kết thúc → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q13",
        sentence: "The number of subscribers _____ by more than half since the streaming service launched.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has grown",
          B: "grew",
          C: "grows",
          D: "was growing",
        },
        correct: "A",
        explanation:
          "'Since the streaming service launched' + kết quả đến hiện tại → Hiện tại hoàn thành: 'has grown'.",
        explanationVi:
          "'Since' + kết quả đến hiện tại → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q14",
        sentence: "The board _____ the merger proposal at the annual meeting in 2020.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has rejected",
          B: "rejected",
          C: "rejects",
          D: "was rejecting",
        },
        correct: "B",
        explanation:
          "'In 2020' = mốc năm quá khứ xác định → Quá khứ đơn: 'rejected'.",
        explanationVi:
          "'In + năm quá khứ' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q15",
        sentence: "Several new regulations _____ by the government last year.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "introduced",
          B: "have introduced",
          C: "were introduced",
          D: "are introduced",
        },
        correct: "C",
        explanation:
          "Chủ ngữ số nhiều nhận hành động + 'last year' → Passive Quá khứ đơn: 'were introduced'.",
        explanationVi:
          "Bị động Quá khứ đơn số nhiều = were + V3. 'Last year' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q16",
        sentence: "The engineer _____ the technical manual as soon as the new equipment arrived.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has updated",
          B: "updates",
          C: "is updating",
          D: "updated",
        },
        correct: "D",
        explanation:
          "'As soon as the new equipment arrived' = chuỗi hành động quá khứ nối tiếp → Quá khứ đơn: 'updated'.",
        explanationVi:
          "Hành động quá khứ nối tiếp → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q17",
        sentence: "The firm _____ its accounting software only recently, so some staff are still adjusting.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has upgraded",
          B: "upgraded",
          C: "upgrades",
          D: "was upgrading",
        },
        correct: "A",
        explanation:
          "'Only recently' + kết quả liên quan hiện tại ('still adjusting') → Hiện tại hoàn thành: 'has upgraded'.",
        explanationVi:
          "'Recently' + kết quả còn đến hiện tại → HTHT.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q18",
        sentence: "The warehouse staff _____ the entire inventory during the annual stocktake last month.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "have counted",
          B: "counted",
          C: "count",
          D: "are counting",
        },
        correct: "B",
        explanation:
          "'Last month' = mốc quá khứ xác định → Quá khứ đơn: 'counted'.",
        explanationVi:
          "'Last month' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q19",
        sentence: "The award _____ to the top-performing branch at the ceremony three weeks ago.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "presented",
          B: "has presented",
          C: "was presented",
          D: "is presented",
        },
        correct: "C",
        explanation:
          "Chủ ngữ nhận hành động + 'three weeks ago' → Passive Quá khứ đơn: 'was presented'.",
        explanationVi:
          "Bị động Quá khứ đơn = was + V3. '... ago' → Quá khứ đơn.",
      },
      {
        kind: "mcq",
        id: "qkd-l6-q20",
        sentence: "The department _____ its procedures several times before it found the most efficient approach.",
        question: "Chọn đáp án đúng:",
        options: {
          A: "has revised",
          B: "revises",
          C: "is revising",
          D: "revised",
        },
        correct: "D",
        explanation:
          "'Before it found...' = chuỗi hành động quá khứ đã kết thúc → Quá khứ đơn: 'revised'.",
        explanationVi:
          "'Before it found' → chuỗi quá khứ đã kết thúc → Quá khứ đơn.",
      },
    ],
  },
];
