import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 8 — ĐẠI TỪ HỒI CHỈ & THAM CHIẾU
// it / they / this / that / such / the former — xác định sai là hiểu lệch cả đoạn,
// và mất thẳng điểm câu hỏi "The word 'it' in line 3 refers to..." của Part 7.
// Kỹ năng cốt lõi: mỗi đại từ phải chỉ ra được MỘT thứ cụ thể đã nhắc trước đó.
// Tiếng Việt thường lặp lại danh từ thay vì dùng đại từ.
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const thamChieuLevels: TransLevel[] = [
  // ── L1 — Truy ngược tham chiếu ────────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "tc-l1-1",
        sentence: "The projector in Room 4 is broken. A technician will repair it tomorrow.",
        instruction: "Bấm vào DANH TỪ mà chữ “it” đang thay thế:",
        correctWords: ["projector"],
        explanation:
          "it thay cho projector, không phải Room 4 — thứ được sửa là máy chiếu. Dịch: “Máy chiếu ở phòng 4 bị hỏng. Mai kỹ thuật viên sẽ tới sửa.”",
      },
      {
        kind: "highlight",
        id: "tc-l1-2",
        sentence: "We received your résumé and your cover letter, but it was incomplete.",
        instruction: "Bấm vào DANH TỪ mà chữ “it” đang thay thế (số ít — chỉ một trong hai):",
        correctWords: ["letter"],
        explanation:
          "“it” là số ít nên không thể thay cho cả hai giấy tờ. Theo nguyên tắc gần nhất, nó chỉ cover letter. Tiếng Việt phải nói rõ “thư xin việc chưa đầy đủ”, không được dịch trống là “nó”.",
      },
      {
        kind: "highlight",
        id: "tc-l1-3",
        sentence: "Two suppliers submitted bids. They will be reviewed on Monday.",
        instruction: "Bấm vào DANH TỪ mà chữ “They” đang thay thế:",
        correctWords: ["bids"],
        explanation:
          "They thay cho “bids” (hồ sơ thầu), không phải “suppliers” — vì thứ được xem xét là hồ sơ. Dịch: “Các hồ sơ thầu sẽ được xem xét vào thứ Hai.”",
      },
      {
        kind: "highlight",
        id: "tc-l1-4",
        sentence: "The vendor missed two deadlines. This prompted a contract review.",
        instruction: "Bấm vào ĐỘNG TỪ của sự việc mà chữ “This” đang thay thế:",
        correctWords: ["missed"],
        explanation:
          "This không thay cho một danh từ nào mà thay cho cả việc “nhà cung cấp trễ hai hạn”. Tiếng Việt dịch bằng “Vì vậy” hoặc “Việc đó”.",
      },
      {
        kind: "highlight",
        id: "tc-l1-5",
        sentence: "Ms. Rahman spoke with the client's lawyer, and she agreed to extend the deadline.",
        instruction: "Bấm vào TÊN người mà chữ “she” nhiều khả năng đang thay thế:",
        correctWords: ["lawyer"],
        explanation:
          "Câu này mơ hồ ngay trong tiếng Anh — “she” có thể là ai cũng được. Theo nguyên tắc gần nhất thì là lawyer. Khi dịch phải nói rõ tên, nếu không người đọc tiếng Việt sẽ hiểu sai.",
      },
      {
        kind: "highlight",
        id: "tc-l1-6",
        sentence: "Applicants may submit a portfolio or a writing sample. The latter is preferred.",
        instruction: "Bấm vào thứ mà “The latter” đang chỉ tới:",
        correctWords: ["sample"],
        explanation:
          "the former = cái đầu (portfolio); the latter = cái sau (writing sample). Tiếng Việt phải gọi thẳng tên: “Chúng tôi ưu tiên bài viết mẫu.”",
      },
      {
        kind: "highlight",
        id: "tc-l1-7",
        sentence: "The company offers flexible hours and remote work. Such benefits attract younger staff.",
        instruction: "Bấm vào HAI danh từ mà “Such benefits” đang gom lại:",
        correctWords: ["hours", "work"],
        explanation:
          "such + danh từ gom lại những thứ vừa kể. Tiếng Việt: “Những chế độ như vậy thu hút nhân sự trẻ.”",
      },
      {
        kind: "highlight",
        id: "tc-l1-8",
        sentence: "Sales rose in Da Nang but fell in Hue. That is why we are reallocating the budget.",
        instruction: "Bấm vào HAI động từ tạo nên sự việc mà “That” đang chỉ tới:",
        correctWords: ["rose", "fell"],
        explanation:
          "That gom cả hai vế trái ngược. Dịch: “Chính vì chênh lệch đó mà chúng tôi phân bổ lại ngân sách.”",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "tc-l2-1",
        sentence: "Two suppliers submitted bids. They will be reviewed on Monday.",
        options: [
          "Hai nhà cung cấp đã nộp hồ sơ thầu. Họ sẽ được xem xét vào thứ Hai.",
          "Hai nhà cung cấp đã nộp hồ sơ thầu. Các hồ sơ sẽ được xem xét vào thứ Hai.",
          "Hai nhà cung cấp đã nộp hồ sơ thầu. Nó sẽ được duyệt vào thứ Hai.",
        ],
        correct: 1,
        optionNotes: [
          "“Họ” khiến người đọc hiểu là hai nhà cung cấp bị đem ra xem xét.",
          "Đúng — lặp lại danh từ để chỉ rõ thứ được xem xét là hồ sơ.",
          "“Nó” vừa mơ hồ vừa sai số ít/số nhiều.",
        ],
        explanation:
          "Tiếng Anh dùng đại từ vì ngữ pháp bắt buộc; tiếng Việt tự do hơn nên cứ LẶP LẠI DANH TỪ khi có nguy cơ hiểu nhầm.",
      },
      {
        kind: "compare",
        id: "tc-l2-2",
        sentence: "The vendor missed two deadlines. This prompted a contract review.",
        options: [
          "Nhà cung cấp trễ hai hạn. Điều này đã thúc đẩy một sự xem xét hợp đồng.",
          "Nhà cung cấp trễ hai hạn. Cái đó khiến hợp đồng bị xem lại.",
          "Nhà cung cấp trễ hai lần. Vì vậy công ty phải rà soát lại hợp đồng.",
        ],
        correct: 2,
        optionNotes: [
          "“Điều này thúc đẩy một sự xem xét” là câu dịch máy, và danh từ hoá chưa trả về động từ.",
          "“Cái đó” quá suồng sã cho văn bản công việc.",
          "Đúng — “Vì vậy” thay cho This, và nêu rõ chủ thể là công ty.",
        ],
        explanation:
          "This/That đầu câu chỉ cả sự việc trước đó thì dịch thành “Vì vậy / Do đó / Chính vì thế”, chứ không dịch thành một đại từ.",
      },
      {
        kind: "compare",
        id: "tc-l2-3",
        sentence: "Applicants may submit a portfolio or a writing sample. The latter is preferred.",
        options: [
          "Ứng viên có thể nộp portfolio hoặc bài viết mẫu. Cái sau được ưa thích hơn.",
          "Ứng viên có thể nộp portfolio hoặc bài viết mẫu. Chúng tôi ưu tiên bài viết mẫu.",
          "Ứng viên có thể nộp portfolio hoặc bài viết mẫu. Cái cuối cùng là tốt nhất.",
        ],
        correct: 1,
        optionNotes: [
          "“Cái sau” đúng nghĩa nhưng bắt người đọc phải đếm ngược — không cần thiết.",
          "Đúng — gọi thẳng tên, người đọc hiểu ngay.",
          "“latter” là cái thứ hai trong hai, không phải “cuối cùng” trong một danh sách dài.",
        ],
        explanation:
          "the former / the latter là công thức tiết kiệm chữ của tiếng Anh. Tiếng Việt không có thói quen đó — cứ nhắc lại tên.",
      },
      {
        kind: "compare",
        id: "tc-l2-4",
        sentence: "We received your résumé and cover letter, but the latter was incomplete.",
        options: [
          "Chúng tôi đã nhận được hồ sơ và thư xin việc của bạn, nhưng chúng chưa đầy đủ.",
          "Chúng tôi đã nhận được hồ sơ và thư xin việc, nhưng thư xin việc chưa đầy đủ.",
          "Chúng tôi đã nhận hồ sơ và thư xin việc, nhưng hồ sơ còn thiếu.",
        ],
        correct: 1,
        optionNotes: [
          "“chúng” gộp cả hai — thành ra cả hai đều thiếu, sai sự thật.",
          "Đúng — the latter chỉ cover letter, nói rõ ra.",
          "Nhầm the latter thành cái đầu tiên.",
        ],
        explanation:
          "Dịch sai tham chiếu ở đây có hậu quả thật: ứng viên sẽ đi bổ sung nhầm giấy tờ.",
      },
      {
        kind: "compare",
        id: "tc-l2-5",
        sentence: "The manager told the technician that his access badge had expired.",
        options: [
          "Quản lý nói với kỹ thuật viên rằng thẻ ra vào của anh ấy đã hết hạn.",
          "Quản lý nói với kỹ thuật viên rằng thẻ ra vào của kỹ thuật viên đã hết hạn.",
          "Quản lý nói với kỹ thuật viên rằng thẻ ra vào của mình đã hết hạn.",
        ],
        correct: 1,
        optionNotes: [
          "“anh ấy” mơ hồ y như bản gốc — người đọc không biết thẻ của ai.",
          "Đúng — trong ngữ cảnh báo tin thì hợp lý nhất là thẻ của người nghe; nói rõ ra thì hết mơ hồ.",
          "“của mình” trong tiếng Việt lại quy về chủ ngữ, tức là thẻ của quản lý — đảo ngược.",
        ],
        explanation:
          "Khi bản gốc đã mơ hồ, người dịch buộc phải chọn. Chọn theo ngữ cảnh và nói rõ, đừng bê nguyên sự mơ hồ sang.",
      },
      {
        kind: "compare",
        id: "tc-l2-6",
        sentence: "The company offers flexible hours and remote work. Such benefits attract younger staff.",
        options: [
          "Công ty có giờ giấc linh hoạt và làm việc từ xa. Những chế độ như vậy thu hút nhân sự trẻ.",
          "Công ty có giờ linh hoạt và làm từ xa. Các lợi ích như thế thu hút những nhân viên trẻ hơn.",
          "Công ty có giờ linh hoạt và làm từ xa. Chúng thu hút nhân viên trẻ.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — “chế độ” là từ đúng cho benefits trong ngữ cảnh nhân sự.",
          "“lợi ích” chung chung, và “trẻ hơn” dịch máy từ younger (ở đây chỉ là “trẻ”).",
          "“Chúng” mơ hồ, và mất chữ “such” vốn có ý gom nhóm.",
        ],
        explanation:
          "So sánh hơn trong tiếng Anh nhiều khi chỉ là cách nói chung chung: younger staff = nhân sự trẻ, không phải “trẻ hơn ai đó”.",
      },
      {
        kind: "compare",
        id: "tc-l2-7",
        sentence: "Our Hanoi and Da Nang offices both grew last year, though the former grew faster.",
        options: [
          "Cả hai văn phòng Hà Nội và Đà Nẵng đều tăng trưởng năm ngoái, nhưng cái trước nhanh hơn.",
          "Cả hai văn phòng Hà Nội và Đà Nẵng đều tăng trưởng năm ngoái, trong đó Hà Nội nhanh hơn.",
          "Cả hai văn phòng đều tăng trưởng năm ngoái, nhưng Đà Nẵng nhanh hơn.",
        ],
        correct: 1,
        optionNotes: [
          "“cái trước” bắt người đọc đếm ngược, và nghe không tự nhiên khi nói về văn phòng.",
          "Đúng — the former là cái được nhắc trước, tức Hà Nội.",
          "Nhầm the former thành cái thứ hai.",
        ],
        explanation:
          "Mẹo nhớ: FORMER đứng trước trong bảng chữ cái so với LATTER, và cũng đứng trước trong câu.",
      },
      {
        kind: "compare",
        id: "tc-l2-8",
        sentence: "The report mentions three risks, but it does not rank them.",
        options: [
          "Bản báo cáo nêu ba rủi ro, nhưng nó không xếp hạng chúng.",
          "Bản báo cáo nêu ba rủi ro nhưng không xếp thứ tự mức độ nghiêm trọng.",
          "Ba rủi ro được nêu trong báo cáo, nhưng chúng không được xếp hạng bởi nó.",
        ],
        correct: 1,
        optionNotes: [
          "Hai đại từ “nó/chúng” liền nhau khiến câu rối, dù không sai nghĩa.",
          "Đúng — bỏ cả hai đại từ, câu vẫn đủ ý và gọn hơn hẳn.",
          "Câu bị động chồng đại từ, rất nặng.",
        ],
        explanation:
          "Khi chủ ngữ của hai vế là một, tiếng Việt bỏ hẳn đại từ ở vế sau. Đây là điểm khác biệt lớn với tiếng Anh.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "tc-l3-1",
        sentence: "The shipment arrived without an invoice, so we cannot process it.",
        chunks: ["Lô hàng tới nơi mà không có hoá đơn", "nên chúng tôi chưa xử lý được", "lô hàng này"],
        distractors: ["nên chúng tôi không thể xử lý nó", "vì vậy hoá đơn bị bỏ qua"],
        hint: "“it” chỉ lô hàng — nhắc lại cho rõ.",
        explanation:
          "Nhắc lại “lô hàng này” loại bỏ mơ hồ: người đọc không phải đoán xem “nó” là hàng hay hoá đơn.",
      },
      {
        kind: "order",
        id: "tc-l3-2",
        sentence: "Both candidates are qualified, but the latter has more experience abroad.",
        chunks: ["Cả hai ứng viên đều đạt yêu cầu", "nhưng người thứ hai", "có nhiều kinh nghiệm ở nước ngoài hơn"],
        distractors: ["nhưng cái sau cùng", "có kinh nghiệm nước ngoài nhiều nhất"],
        hint: "the latter = người được nhắc sau.",
        explanation:
          "Với người thì dịch “người thứ hai / người sau”, không dùng “cái”. Và “more” là hơn, không phải “nhất”.",
      },
      {
        kind: "order",
        id: "tc-l3-3",
        sentence: "Attendance has dropped for three months. That is why we changed the venue.",
        chunks: ["Số người tham dự giảm suốt ba tháng,", "chính vì vậy chúng tôi đã đổi địa điểm"],
        distractors: ["Số người tham dự tăng suốt ba tháng,", "điều đó là lý do tại sao chúng tôi đã thay đổi nơi chốn"],
        hint: "That is why = chính vì vậy.",
        explanation:
          "“That is why” không dịch thành “điều đó là lý do tại sao” — tiếng Việt gói lại thành “chính vì vậy”.",
      },
      {
        kind: "order",
        id: "tc-l3-4",
        sentence: "We ordered ten units, but only six of them arrived.",
        chunks: ["Chúng tôi đặt mười chiếc", "nhưng chỉ nhận được sáu"],
        distractors: ["nhưng chỉ sáu cái của chúng đã tới", "chúng tôi đã ra lệnh mười đơn vị"],
        hint: "“them” đã rõ trong ngữ cảnh — tiếng Việt lược đi.",
        explanation:
          "order ở đây là “đặt hàng”, không phải “ra lệnh”. Và “six of them” chỉ cần dịch “sáu”.",
      },
      {
        kind: "order",
        id: "tc-l3-5",
        sentence: "The new policy affects part-time staff. It takes effect in January.",
        chunks: ["Chính sách mới ảnh hưởng tới nhân viên bán thời gian", "và có hiệu lực từ tháng 1"],
        distractors: ["nó lấy hiệu lực vào tháng 1", "tác động đến những nhân viên nửa thời gian"],
        hint: "“It” chỉ chính sách — gộp hai câu làm một, bỏ đại từ.",
        explanation:
          "Khi hai câu tiếng Anh cùng chủ ngữ, tiếng Việt thường gộp lại bằng “và” và bỏ hẳn đại từ ở vế sau.",
      },
      {
        kind: "order",
        id: "tc-l3-6",
        sentence: "Please forward this to your team and ask them to confirm.",
        chunks: ["Nhờ anh chuyển thông tin này cho nhóm của anh", "và đề nghị mọi người xác nhận lại"],
        distractors: ["chuyển cái này tới đội của anh", "và hỏi họ để mà xác nhận"],
        hint: "“this” và “them” đều cần được gọi rõ.",
        explanation:
          "Hai đại từ trống trong một câu ngắn. Gọi rõ “thông tin này” và “mọi người” thì câu vừa lịch sự vừa hết mơ hồ.",
      },
      {
        kind: "order",
        id: "tc-l3-7",
        sentence: "Our supplier raised prices and shortened the warranty. Neither change was announced.",
        chunks: ["Nhà cung cấp tăng giá và rút ngắn thời gian bảo hành;", "cả hai thay đổi này", "đều không được báo trước"],
        distractors: ["Nhà cung cấp giữ nguyên giá và thời gian bảo hành;", "không cái nào trong số đó đã được thông báo bởi họ"],
        hint: "Neither = cả hai đều không.",
        explanation:
          "Tiếng Việt diễn “neither” bằng “cả hai… đều không”, chứ không nói “không cái nào trong số đó”.",
      },
      {
        kind: "order",
        id: "tc-l3-8",
        sentence: "The technician replaced the battery, but that did not fix the problem.",
        chunks: ["Kỹ thuật viên đã thay pin", "nhưng vẫn không khắc phục được sự cố"],
        distractors: ["nhưng cái đó đã không sửa chữa", "vấn đề vẫn còn nguyên bởi vì nó"],
        hint: "“that” chỉ việc thay pin — tiếng Việt lược đi được.",
        explanation:
          "Chữ “vẫn” đã hàm chứa ý “dù đã thay pin”, nên không cần dịch “that” thành một đại từ riêng.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "tc-l4-1",
        sentence: "We sent the contract and the invoice yesterday. Please sign it and return it today.",
        draft: "Hôm qua chúng tôi đã gửi hợp đồng và hoá đơn. Xin ___ và gửi lại trong hôm nay.",
        blanks: [
          {
            options: ["ký hợp đồng", "ký cả hai", "ký hoá đơn"],
            correct: 0,
            note: "Chỉ hợp đồng mới cần ký; “it” số ít nên không thể là cả hai.",
          },
        ],
        explanation:
          "Khi có hai danh từ đứng trước mà đại từ ở số ít, dùng LOGIC để chọn: người ta ký hợp đồng, không ký hoá đơn.",
      },
      {
        kind: "repair",
        id: "tc-l4-2",
        sentence: "Sales in the north rose while those in the south declined.",
        draft: "Doanh số miền Bắc tăng, còn ___ thì giảm.",
        blanks: [
          {
            options: ["doanh số miền Nam", "những cái ở miền Nam", "miền Nam của chúng"],
            correct: 0,
            note: "those thay cho “sales” — tiếng Việt nhắc lại danh từ.",
          },
        ],
        explanation:
          "those/that dùng để tránh lặp trong tiếng Anh. Tiếng Việt thì ngược lại: lặp lại mới là cách tự nhiên.",
      },
      {
        kind: "repair",
        id: "tc-l4-3",
        sentence: "The workshop was canceled and the venue was double-booked. Both issues have been resolved.",
        draft: "Buổi workshop bị huỷ và địa điểm bị đặt trùng. ___ đã được xử lý.",
        blanks: [
          {
            options: ["Cả hai vấn đề này", "Chúng cả hai", "Vấn đề đó"],
            correct: 0,
            note: "Both issues gom hai chuyện vừa kể — tiếng Việt: “cả hai vấn đề này”.",
          },
        ],
        explanation:
          "Khi tác giả tự gom bằng “both issues / these problems”, người dịch chỉ cần bám theo con số họ đưa ra.",
      },
      {
        kind: "repair",
        id: "tc-l4-4",
        sentence: "Ms. Farid met with the client and her assistant took notes.",
        draft: "Bà Farid gặp khách hàng, còn ___ ghi biên bản.",
        blanks: [
          {
            options: ["trợ lý của bà", "trợ lý của khách hàng", "cô ấy và trợ lý"],
            correct: 0,
            note: "“her” hợp lý nhất là quy về bà Farid — người là chủ ngữ chính của câu.",
          },
        ],
        explanation:
          "Bản gốc mơ hồ nhưng chủ ngữ chính thường là mốc quy chiếu mặc định. Dịch xong nên chọn một cách rõ ràng.",
      },
      {
        kind: "repair",
        id: "tc-l4-5",
        sentence: "The device overheats after an hour. This has been reported by several customers.",
        draft: "Thiết bị nóng lên sau khoảng một tiếng sử dụng. ___ nhiều khách hàng phản ánh.",
        blanks: [
          {
            options: ["Đây là lỗi đã được", "Điều này đã được bởi", "Cái này thì bị"],
            correct: 0,
            note: "This chỉ cả hiện tượng vừa mô tả — gọi tên nó là “lỗi” cho rõ.",
          },
        ],
        explanation:
          "Đặt tên cho thứ mà This/That đang chỉ (lỗi, hiện tượng, tình trạng…) là cách dịch tự nhiên nhất trong tiếng Việt.",
      },
      {
        kind: "repair",
        id: "tc-l4-6",
        sentence: "We offer a basic plan and a premium plan. The former costs $9 a month.",
        draft: "Chúng tôi có gói cơ bản và gói cao cấp. ___ giá 9 đô một tháng.",
        blanks: [
          {
            options: ["Gói cơ bản", "Gói cao cấp", "Gói sau"],
            correct: 0,
            note: "the former = cái được nhắc TRƯỚC, tức gói cơ bản.",
          },
        ],
        explanation:
          "Kiểm tra bằng logic giá: 9 đô là mức rẻ, hợp với gói cơ bản. Logic thường giúp xác nhận lựa chọn tham chiếu.",
      },
      {
        kind: "repair",
        id: "tc-l4-7",
        sentence: "Employees who use the parking garage must display a permit. Those without one will be ticketed.",
        draft: "Nhân viên dùng bãi đỗ xe phải dán thẻ. ___ sẽ bị phạt.",
        blanks: [
          {
            options: ["Xe không có thẻ", "Những cái mà không có một cái", "Người không có bãi đỗ"],
            correct: 0,
            note: "Those without one = những người/xe không có thẻ. “one” thay cho “a permit”.",
          },
        ],
        explanation:
          "Ở đây có hai tham chiếu lồng nhau: “those” chỉ nhân viên/xe, còn “one” chỉ tấm thẻ. Phải gỡ cả hai.",
      },
      {
        kind: "repair",
        id: "tc-l4-8",
        sentence: "The proposal was rejected, which no one expected.",
        draft: "Đề xuất đã bị bác — ___ không ai ngờ tới.",
        blanks: [
          {
            options: ["điều mà", "cái nào", "người mà"],
            correct: 0,
            note: "which ở đây chỉ cả việc bị bác. “điều mà” là cách nối tự nhiên trong tiếng Việt.",
          },
        ],
        explanation:
          "Đây là trường hợp tiếng Việt CÓ dùng đại từ được: “điều mà không ai ngờ tới” nghe rất tự nhiên. Nguyên tắc là nghe thuận tai hay không, không phải cấm tuyệt đối.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "tc-l5-1",
        source:
          "We reviewed both the Kingsley and the Aldridge proposals; the latter was stronger on cost but weaker on timeline.",
        model:
          "Chúng tôi đã xem cả đề xuất của Kingsley lẫn của Aldridge; đề xuất của Aldridge có lợi thế về chi phí nhưng kém hơn về tiến độ.",
        focus:
          "the latter = Aldridge (nhắc sau). Gọi thẳng tên thay vì dịch “cái sau”. Chú ý cặp stronger/weaker đối nhau.",
        keyPoints: [
          "đã xem cả hai đề xuất Kingsley và Aldridge",
          "đề xuất Aldridge tốt hơn về chi phí",
          "nhưng kém hơn về tiến độ/thời gian",
        ],
      },
      {
        kind: "free",
        id: "tc-l5-2",
        source:
          "The delivery van broke down twice this month, and that has cost us three days of service.",
        model:
          "Tháng này xe tải giao hàng hỏng hai lần, khiến chúng tôi mất ba ngày không phục vụ được khách.",
        focus:
          "“that” chỉ cả việc xe hỏng hai lần → dịch bằng “khiến”, không dịch thành “cái đó”.",
        keyPoints: [
          "xe giao hàng hỏng hai lần trong tháng",
          "khiến/vì vậy",
          "mất ba ngày không phục vụ được",
        ],
      },
      {
        kind: "free",
        id: "tc-l5-3",
        source:
          "Guests may request a late checkout or an early check-in, but the hotel cannot guarantee either.",
        model:
          "Khách có thể xin trả phòng muộn hoặc nhận phòng sớm, nhưng khách sạn không cam kết được cả hai yêu cầu này.",
        focus:
          "“either” trong câu phủ định = cả hai đều không. Đừng dịch thành “một trong hai”.",
        keyPoints: [
          "khách có thể xin trả phòng muộn hoặc nhận phòng sớm",
          "nhưng khách sạn không đảm bảo",
          "cả hai yêu cầu",
        ],
      },
      {
        kind: "free",
        id: "tc-l5-4",
        source:
          "The technician inspected the compressor and the thermostat; he replaced the latter but found no fault with the former.",
        model:
          "Kỹ thuật viên đã kiểm tra máy nén và bộ điều nhiệt; anh thay bộ điều nhiệt, còn máy nén thì không thấy hỏng hóc gì.",
        focus:
          "Cặp former/latter trong cùng một câu — dễ đảo nhầm. the latter = thermostat (nhắc sau), the former = compressor.",
        keyPoints: [
          "kiểm tra máy nén và bộ điều nhiệt",
          "thay bộ điều nhiệt",
          "máy nén không có lỗi",
        ],
      },
      {
        kind: "free",
        id: "tc-l5-5",
        source:
          "Several employees asked about the new dress code, and their questions suggest the memo was not clear enough.",
        model:
          "Nhiều nhân viên đã hỏi về quy định trang phục mới, và chính những câu hỏi đó cho thấy thông báo trước đây chưa đủ rõ ràng.",
        focus:
          "“their questions” quy về nhân viên; câu mang hàm ý tự nhận thông báo cũ viết chưa tốt. Giữ được sắc thái thừa nhận đó.",
        keyPoints: [
          "nhiều nhân viên hỏi về quy định trang phục mới",
          "những câu hỏi đó cho thấy",
          "thông báo chưa đủ rõ",
        ],
      },
    ],
  },

  // ── L6 — Dịch đoạn Part 7 (AI chấm) ───────────────────────────────────────
  {
    ...meta[5],
    questions: [
      {
        kind: "free",
        id: "tc-l6-1",
        source:
          "Dear Mr. Villanueva,\n\nWe have received both your warranty registration and your repair request. Unfortunately, the latter was submitted after the coverage period ended. Because the former was filed on time, however, we can offer you a discounted repair rate. This applies only to labor, not to parts.",
        model:
          "Kính gửi ông Villanueva,\n\nChúng tôi đã nhận được cả phiếu đăng ký bảo hành lẫn yêu cầu sửa chữa của ông. Rất tiếc, yêu cầu sửa chữa gửi tới sau khi thời hạn bảo hành kết thúc. Tuy nhiên, do phiếu đăng ký nộp đúng hạn nên chúng tôi có thể áp dụng mức giá sửa chữa ưu đãi cho ông. Mức ưu đãi này chỉ áp dụng cho tiền công, không áp dụng cho linh kiện.",
        focus:
          "Ba tham chiếu liên tiếp: the latter (yêu cầu sửa chữa), the former (phiếu đăng ký), This (mức giá ưu đãi). Đảo nhầm một cái là sai cả tình huống.",
        keyPoints: [
          "đã nhận cả phiếu đăng ký bảo hành lẫn yêu cầu sửa chữa",
          "yêu cầu sửa chữa gửi muộn, sau khi hết hạn bảo hành",
          "nhưng phiếu đăng ký nộp đúng hạn",
          "nên được mức giá sửa chữa ưu đãi",
          "ưu đãi chỉ cho tiền công, không cho linh kiện",
        ],
        comprehension: {
          question: "Mức giá ưu đãi áp dụng cho phần nào?",
          options: [
            "Cả tiền công lẫn linh kiện.",
            "Chỉ tiền công.",
            "Chỉ linh kiện.",
          ],
          correct: 1,
          explanation:
            "“This applies only to labor, not to parts” — chữ “This” chỉ mức ưu đãi vừa nêu. Xác định sai nó là trả lời sai câu hỏi.",
        },
      },
      {
        kind: "free",
        id: "tc-l6-2",
        source:
          "MEMO\n\nThe finance team and the procurement team both submitted budget requests last week. The former asked for two additional analysts; the latter asked for new inventory software. We can fund only one of these this quarter. Because the software purchase would reduce ongoing costs, that is the request we will approve.",
        model:
          "THÔNG BÁO\n\nTuần trước, cả phòng Tài chính lẫn phòng Mua hàng đều gửi đề nghị ngân sách. Phòng Tài chính xin thêm hai chuyên viên phân tích; phòng Mua hàng xin phần mềm quản lý kho mới. Quý này chúng ta chỉ duyệt được một trong hai. Vì mua phần mềm sẽ giúp giảm chi phí về lâu dài, nên đề nghị được duyệt là của phòng Mua hàng.",
        focus:
          "the former = finance, the latter = procurement, “these” = hai đề nghị, “that” = đề nghị mua phần mềm. Bốn tham chiếu móc xích, câu cuối mới chốt ai được duyệt.",
        keyPoints: [
          "hai phòng cùng gửi đề nghị ngân sách",
          "phòng Tài chính xin thêm hai chuyên viên phân tích",
          "phòng Mua hàng xin phần mềm quản lý kho",
          "quý này chỉ duyệt được một",
          "duyệt đề nghị phần mềm vì giảm chi phí lâu dài",
        ],
        comprehension: {
          question: "Đề nghị của phòng nào được duyệt?",
          options: [
            "Phòng Tài chính, vì cần thêm nhân sự.",
            "Phòng Mua hàng, vì phần mềm giúp giảm chi phí.",
            "Cả hai, nhưng chia làm hai quý.",
          ],
          correct: 1,
          explanation:
            "Câu cuối không nhắc tên phòng nào — nó chỉ nói “the software purchase”. Người đọc phải nhớ phần mềm là đề nghị của phòng Mua hàng.",
        },
      },
      {
        kind: "free",
        id: "tc-l6-3",
        source:
          "Two complaints came in about the Riverton branch this week. One concerned the wait time at the counter; the other concerned a billing error. We have addressed the second issue directly with the customer. The first will require a staffing review, which the regional manager has agreed to conduct next month.",
        model:
          "Tuần này có hai khiếu nại về chi nhánh Riverton. Một khiếu nại về thời gian chờ ở quầy, khiếu nại còn lại về lỗi tính tiền. Chúng tôi đã trực tiếp làm việc với khách hàng để xử lý lỗi tính tiền. Còn chuyện thời gian chờ thì cần rà soát lại nhân sự, và giám đốc khu vực đã đồng ý thực hiện việc này trong tháng tới.",
        focus:
          "Chuỗi tham chiếu đổi cách gọi liên tục: One / the other / the second issue / The first. Phải theo dõi cái nào là cái nào — dịch thì gọi thẳng tên cho người đọc đỡ phải đếm.",
        keyPoints: [
          "tuần này có hai khiếu nại về chi nhánh Riverton",
          "một về thời gian chờ ở quầy",
          "một về lỗi tính tiền",
          "lỗi tính tiền đã xử lý trực tiếp với khách",
          "thời gian chờ cần rà soát nhân sự, giám đốc khu vực làm tháng tới",
        ],
        comprehension: {
          question: "Vấn đề nào vẫn chưa được giải quyết?",
          options: [
            "Lỗi tính tiền.",
            "Thời gian chờ ở quầy.",
            "Cả hai đều đã xong.",
          ],
          correct: 1,
          explanation:
            "“the second issue” = lỗi tính tiền (đã xử lý); “The first” = thời gian chờ (còn phải rà soát). Đoạn văn cố tình đảo thứ tự để thử người đọc.",
        },
      },
    ],
  },
];
