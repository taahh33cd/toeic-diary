import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 2 — TỪ ĐA NGHĨA & NGHĨA THEO NGỮ CẢNH
// Học sinh nhớ nghĩa số 1 trong từ điển rồi áp vào mọi câu.
// Kỹ năng cốt lõi: nhìn TỪ ĐI KÈM (tân ngữ, giới từ, chủ ngữ) để chốt nghĩa.
// Mỗi từ được cho gặp lại ít nhất 2 lần với 2 nghĩa khác nhau.
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const tuDaNghiaLevels: TransLevel[] = [
  // ── L1 — Bấm vào từ quyết định nghĩa ──────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "tdn-l1-1",
        sentence: "We will address the issue at the next meeting.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “address”:",
        correctWords: ["issue"],
        explanation:
          "Tân ngữ là “issue” (vấn đề) → address = giải quyết, xử lý. Địa chỉ không liên quan gì ở đây.",
      },
      {
        kind: "highlight",
        id: "tdn-l1-2",
        sentence: "Please address the package to our Seoul branch.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “address”:",
        correctWords: ["package"],
        explanation:
          "Tân ngữ là “package” (kiện hàng) → address = ghi địa chỉ lên. Cùng một từ, tân ngữ đổi thì nghĩa đổi.",
      },
      {
        kind: "highlight",
        id: "tdn-l1-3",
        sentence: "The hotel charges a small fee for late checkout.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “charges”:",
        correctWords: ["fee"],
        explanation: "Đi với “fee” → charge = thu phí, tính tiền.",
      },
      {
        kind: "highlight",
        id: "tdn-l1-4",
        sentence: "Make sure the battery is fully charged before the trip.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “charged”:",
        correctWords: ["battery"],
        explanation: "Chủ ngữ là “battery” → charge = sạc điện. Không dính gì tới tiền nong.",
      },
      {
        kind: "highlight",
        id: "tdn-l1-5",
        sentence: "Ms. Tran will run the Hanoi office starting in May.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “run”:",
        correctWords: ["office"],
        explanation: "run + một tổ chức/nơi làm việc → điều hành, quản lý.",
      },
      {
        kind: "highlight",
        id: "tdn-l1-6",
        sentence: "The shuttle buses run every fifteen minutes.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “run”:",
        correctWords: ["buses"],
        explanation:
          "Chủ ngữ là phương tiện → run = chạy theo lịch trình, có chuyến. Dịch: “xe buýt đưa đón chạy 15 phút một chuyến”.",
      },
      {
        kind: "highlight",
        id: "tdn-l1-7",
        sentence: "Our warranty does not cover accidental damage.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “cover”:",
        correctWords: ["warranty"],
        explanation: "Chủ ngữ là “warranty” → cover = bao gồm trong phạm vi bảo hành, chi trả cho.",
      },
      {
        kind: "highlight",
        id: "tdn-l1-8",
        sentence: "Ms. Reyes will cover the front desk this afternoon.",
        instruction: "Bấm vào TỪ ĐI KÈM giúp bạn chốt nghĩa của “cover”:",
        correctWords: ["desk"],
        explanation:
          "Người + cover + vị trí làm việc → trực thay, làm thay. Dịch: “Bà Reyes sẽ trực quầy lễ tân chiều nay”.",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "tdn-l2-1",
        sentence: "We will address the issue at the next meeting.",
        options: [
          "Chúng tôi sẽ gửi vấn đề này tới cuộc họp tới.",
          "Chúng tôi sẽ giải quyết vấn đề này trong cuộc họp tới.",
          "Chúng tôi sẽ phát biểu về vấn đề này ở cuộc họp tới.",
        ],
        correct: 1,
        optionNotes: [
          "Lấy nghĩa “gửi tới địa chỉ” — sai vì tân ngữ là một vấn đề, không phải bưu kiện.",
          "Đúng — address + issue/problem/concern = giải quyết, xử lý.",
          "Nghĩa “phát biểu trước đám đông” là address + an audience, không phải address + an issue.",
        ],
        explanation:
          "Ba nghĩa của address đều có thật. Cái quyết định là TÂN NGỮ: issue → giải quyết; package/letter → ghi địa chỉ; the audience → phát biểu.",
      },
      {
        kind: "compare",
        id: "tdn-l2-2",
        sentence: "Please settle the outstanding balance by June 30.",
        options: [
          "Vui lòng thanh toán số tiền còn nợ trước ngày 30 tháng 6.",
          "Vui lòng ổn định số dư nổi bật trước ngày 30 tháng 6.",
          "Vui lòng giải quyết sự cân bằng xuất sắc trước ngày 30 tháng 6.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — settle = thanh toán; outstanding = còn tồn/chưa trả; balance = số dư nợ.",
          "Sai cả “outstanding” lẫn “settle” — outstanding ở đây không phải “nổi bật”.",
          "Sai ba từ liền: balance là số dư tài khoản, không phải “sự cân bằng”.",
        ],
        explanation:
          "Trong ngữ cảnh hoá đơn, cả cụm settle / outstanding / balance đều chuyển sang nghĩa tài chính cùng lúc. Nhận ra ngữ cảnh là nhận ra cả chùm.",
      },
      {
        kind: "compare",
        id: "tdn-l2-3",
        sentence: "The board will meet on Thursday to review the proposal.",
        options: [
          "Tấm bảng sẽ được đặt vào thứ Năm để xem lại bản kế hoạch.",
          "Hội đồng quản trị sẽ họp vào thứ Năm để xem xét đề xuất.",
          "Ban lãnh đạo sẽ đáp ứng vào thứ Năm để đánh giá lời cầu hôn.",
        ],
        correct: 1,
        optionNotes: [
          "board không phải tấm bảng khi nó là chủ ngữ của một cuộc họp.",
          "Đúng — board = hội đồng; meet = họp; proposal = đề xuất/kiến nghị.",
          "meet ở đây là “họp”, không phải “đáp ứng”; proposal trong công sở không phải lời cầu hôn.",
        ],
        explanation:
          "Một câu ngắn mà có ba từ đa nghĩa. Chốt được ngữ cảnh “cuộc họp công ty” thì cả ba nghĩa tự rơi vào đúng chỗ.",
      },
      {
        kind: "compare",
        id: "tdn-l2-4",
        sentence: "The new policy covers all part-time employees.",
        options: [
          "Chính sách mới che phủ toàn bộ nhân viên bán thời gian.",
          "Chính sách mới đưa tin về toàn bộ nhân viên bán thời gian.",
          "Chính sách mới áp dụng cho cả nhân viên bán thời gian.",
        ],
        correct: 2,
        optionNotes: [
          "Nghĩa đen “che phủ” — không dùng được với chính sách.",
          "cover = đưa tin chỉ đúng khi chủ ngữ là báo chí/phóng viên.",
          "Đúng — chính sách/bảo hiểm + cover = áp dụng cho, bao gồm.",
        ],
        explanation:
          "cover đổi nghĩa theo CHỦ NGỮ: chính sách → áp dụng cho; báo chí → đưa tin; người → trực thay; tiền → đủ chi trả.",
      },
      {
        kind: "compare",
        id: "tdn-l2-5",
        sentence: "Mr. Silva will run the training session in my absence.",
        options: [
          "Ông Silva sẽ chạy buổi đào tạo khi tôi vắng mặt.",
          "Ông Silva sẽ đứng lớp buổi đào tạo thay tôi.",
          "Ông Silva sẽ vận hành buổi đào tạo trong sự vắng mặt của tôi.",
        ],
        correct: 1,
        optionNotes: [
          "Nghĩa “chạy” — vô nghĩa với một buổi đào tạo.",
          "Đúng — run + sự kiện/buổi học = đứng ra tổ chức, chủ trì.",
          "“Vận hành” dùng cho máy móc; “trong sự vắng mặt của tôi” là câu dịch máy.",
        ],
        explanation:
          "Bản dịch “vận hành buổi đào tạo trong sự vắng mặt của tôi” cho thấy một lỗi khác: chọn được nghĩa gần đúng nhưng vẫn giữ nguyên khung câu tiếng Anh nên nghe rất cứng.",
      },
      {
        kind: "compare",
        id: "tdn-l2-6",
        sentence: "Please note that the terms of the contract have changed.",
        options: [
          "Xin ghi chú rằng các thuật ngữ của hợp đồng đã thay đổi.",
          "Xin lưu ý rằng các kỳ hạn hợp đồng đã được đổi.",
          "Xin lưu ý rằng các điều khoản của hợp đồng đã thay đổi.",
        ],
        correct: 2,
        optionNotes: [
          "terms trong hợp đồng là điều khoản, không phải thuật ngữ.",
          "term có nghĩa “kỳ hạn”, nhưng số nhiều “the terms of a contract” là điều khoản.",
          "Đúng — note = lưu ý; terms = điều khoản.",
        ],
        explanation:
          "Mẹo: term số ít thường là kỳ hạn/nhiệm kỳ/thuật ngữ; terms số nhiều trong văn bản pháp lý gần như luôn là điều khoản.",
      },
      {
        kind: "compare",
        id: "tdn-l2-7",
        sentence: "The figures in the quarterly report do not match.",
        options: [
          "Các con số trong báo cáo quý không khớp nhau.",
          "Các nhân vật trong báo cáo quý không hợp nhau.",
          "Các hình vẽ trong báo cáo quý không tương xứng.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — trong báo cáo tài chính, figures = số liệu.",
          "figure = nhân vật chỉ đúng trong ngữ cảnh lịch sử/xã hội (a public figure).",
          "figure = hình vẽ chỉ đúng trong sách giáo khoa (see Figure 2).",
        ],
        explanation:
          "Cùng một từ, ba loại văn bản, ba nghĩa. Hỏi “đây là loại văn bản gì” trước khi tra từ.",
      },
      {
        kind: "compare",
        id: "tdn-l2-8",
        sentence: "Interest on the loan will be charged monthly.",
        options: [
          "Sự quan tâm tới khoản vay sẽ bị tính phí hằng tháng.",
          "Lãi của khoản vay sẽ được tính theo từng tháng.",
          "Lợi ích của khoản vay sẽ được thu hằng tháng.",
        ],
        correct: 1,
        optionNotes: [
          "interest = sự quan tâm là nghĩa số 1 trong từ điển, nhưng đi với “loan” thì là tiền lãi.",
          "Đúng — interest = lãi; charge = tính (tiền).",
          "“Lợi ích” cũng là một nghĩa của interest nhưng không dùng với khoản vay.",
        ],
        explanation:
          "Nhìn từ đi kèm: loan, account, rate → interest chắc chắn là lãi suất.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự (có mảnh mồi nhử dịch sai nghĩa) ─────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "tdn-l3-1",
        sentence: "The manager will address your complaint within two business days.",
        chunks: ["Quản lý sẽ", "xử lý khiếu nại của quý khách", "trong vòng hai ngày làm việc"],
        distractors: ["gửi tới địa chỉ", "trong vòng hai ngày kinh doanh"],
        hint: "address + complaint, và “business days” là cụm cố định.",
        explanation:
          "business days = ngày làm việc (không tính cuối tuần), không phải “ngày kinh doanh”.",
      },
      {
        kind: "order",
        id: "tdn-l3-2",
        sentence: "Your membership does not cover access to the fitness center.",
        chunks: ["Thẻ hội viên của quý khách", "không bao gồm", "quyền sử dụng phòng tập"],
        distractors: ["không che phủ", "sự truy cập vào trung tâm thể hình"],
        hint: "cover đi với membership; access ở đây là quyền dùng, không phải “truy cập”.",
        explanation:
          "“access” trong ngữ cảnh cơ sở vật chất là quyền ra vào / quyền sử dụng, chỉ là “truy cập” khi nói về hệ thống máy tính.",
      },
      {
        kind: "order",
        id: "tdn-l3-3",
        sentence: "The board approved the budget for the coming fiscal year.",
        chunks: ["Hội đồng quản trị đã thông qua", "ngân sách", "cho năm tài chính sắp tới"],
        distractors: ["tấm bảng đã chấp thuận", "cho năm tài khoá đang đến gần"],
        hint: "board + approve → hội đồng.",
        explanation:
          "board là “hội đồng” khi nó thực hiện hành động của một tập thể có quyền: approve, meet, decide.",
      },
      {
        kind: "order",
        id: "tdn-l3-4",
        sentence: "We are running a promotion on all office supplies this week.",
        chunks: ["Tuần này chúng tôi đang chạy", "chương trình khuyến mãi", "cho toàn bộ văn phòng phẩm"],
        distractors: ["đang vận hành một sự thăng chức", "cho toàn bộ nguồn cung văn phòng"],
        hint: "promotion có hai nghĩa: khuyến mãi và thăng chức.",
        explanation:
          "run a promotion = chạy chương trình khuyến mãi. Nếu là thăng chức thì phải là “get/receive a promotion”.",
      },
      {
        kind: "order",
        id: "tdn-l3-5",
        sentence: "Please charge the amount to the company account.",
        chunks: ["Vui lòng ghi khoản này", "vào tài khoản", "của công ty"],
        distractors: ["Vui lòng sạc số tiền", "vào bản tường trình"],
        hint: "charge ... to an account là cụm cố định trong thanh toán.",
        explanation:
          "charge sth to an account = ghi nợ vào tài khoản. account cũng có nghĩa “bản tường thuật”, nhưng không dùng ở đây.",
      },
      {
        kind: "order",
        id: "tdn-l3-6",
        sentence: "The article covers recent changes in local labor regulations.",
        chunks: ["Bài báo đề cập tới", "những thay đổi gần đây", "trong quy định lao động ở địa phương"],
        distractors: ["Điều khoản che phủ", "trong các quy tắc lao động của người bản xứ"],
        hint: "article + cover → bài báo viết về.",
        explanation:
          "Khi chủ ngữ là bài viết/báo chí, cover = đề cập, đưa tin. article cũng có nghĩa “điều khoản”, nhưng không đi với “recent changes”.",
      },
      {
        kind: "order",
        id: "tdn-l3-7",
        sentence: "Interest rates are expected to remain stable through the third quarter.",
        chunks: ["Lãi suất", "dự kiến sẽ giữ ổn định", "cho tới hết quý ba"],
        distractors: ["Tỷ lệ quan tâm", "trong suốt phần tư thứ ba"],
        hint: "interest rate và quarter đều là thuật ngữ tài chính.",
        explanation:
          "quarter = quý (3 tháng) trong báo cáo doanh nghiệp, không phải “một phần tư” hay “khu phố”.",
      },
      {
        kind: "order",
        id: "tdn-l3-8",
        sentence: "The store will honor the original price listed in the catalog.",
        chunks: ["Cửa hàng sẽ giữ đúng", "mức giá gốc", "ghi trong catalogue"],
        distractors: ["sẽ vinh danh", "mức giá độc đáo"],
        hint: "honor + price/warranty/coupon là cụm thương mại.",
        explanation:
          "honor a price = chấp nhận bán đúng mức giá đã niêm yết. original = gốc/ban đầu, không phải “độc đáo”.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "tdn-l4-1",
        sentence: "Our technician will look into the issue and charge you only for parts.",
        draft: "Kỹ thuật viên sẽ ___ sự cố và chỉ ___ tiền linh kiện.",
        blanks: [
          {
            options: ["kiểm tra tìm nguyên nhân", "nhìn vào bên trong", "tra cứu"],
            correct: 0,
            note: "look into = tìm hiểu, điều tra nguyên nhân — không phải nhìn vào bên trong theo nghĩa đen.",
          },
          {
            options: ["thu", "sạc", "buộc tội"],
            correct: 0,
            note: "charge + tiền = thu, tính phí. Ba nghĩa sạc / buộc tội / thu phí đều có thật, chọn theo tân ngữ.",
          },
        ],
        explanation:
          "Một câu chứa hai từ đa nghĩa. Với mỗi từ, hỏi “tân ngữ là gì” rồi mới chọn nghĩa.",
      },
      {
        kind: "repair",
        id: "tdn-l4-2",
        sentence: "The current issue of the magazine features an article on remote work.",
        draft: "___ của tạp chí có một ___ về làm việc từ xa.",
        blanks: [
          {
            options: ["Số mới nhất", "Vấn đề hiện tại", "Dòng điện"],
            correct: 0,
            note: "issue + magazine/newspaper = số phát hành. current = mới nhất, hiện hành.",
          },
          {
            options: ["bài viết", "điều khoản", "mạo từ"],
            correct: 0,
            note: "article trong tạp chí = bài viết.",
          },
        ],
        explanation:
          "Cùng từ “issue” nhưng ở bài trước là “sự cố”, ở đây là “số báo”. Ngữ cảnh — chứ không phải từ điển — quyết định.",
      },
      {
        kind: "repair",
        id: "tdn-l4-3",
        sentence: "Employees who transfer to another branch may keep their current benefits.",
        draft: "Nhân viên ___ sang chi nhánh khác vẫn được giữ ___ hiện tại.",
        blanks: [
          {
            options: ["chuyển công tác", "chuyển khoản", "phiên dịch"],
            correct: 0,
            note: "transfer + người + to a branch = điều chuyển công tác.",
          },
          {
            options: ["các chế độ đãi ngộ", "các lợi ích tài chính", "những điều tốt đẹp"],
            correct: 0,
            note: "benefits trong ngữ cảnh nhân sự = phúc lợi, chế độ (bảo hiểm, nghỉ phép…).",
          },
        ],
        explanation:
          "benefits là một trong những từ bị dịch nhầm nhiều nhất: trong hợp đồng lao động nó là PHÚC LỢI, không phải “lợi ích” chung chung.",
      },
      {
        kind: "repair",
        id: "tdn-l4-4",
        sentence: "The supplier could not meet our delivery deadline last month.",
        draft: "Tháng trước nhà cung cấp đã không ___ hạn giao hàng của chúng tôi.",
        blanks: [
          {
            options: ["kịp", "gặp", "làm quen với"],
            correct: 0,
            note: "meet + deadline/requirement/standard = đáp ứng, đạt được. Đi với deadline thì tiếng Việt tự nhiên nhất là “kịp hạn”.",
          },
        ],
        explanation:
          "meet là từ đa nghĩa nguy hiểm vì nghĩa “gặp” quá quen: meet a deadline (kịp hạn), meet a requirement (đáp ứng yêu cầu), meet expectations (đạt kỳ vọng).",
      },
      {
        kind: "repair",
        id: "tdn-l4-5",
        sentence: "Please hold your questions until the end of the presentation.",
        draft: "Vui lòng ___ câu hỏi tới cuối buổi thuyết trình.",
        blanks: [
          {
            options: ["để dành", "cầm chắc", "tổ chức"],
            correct: 0,
            note: "hold + questions = giữ lại, để dành đến sau. Khác với hold a meeting (tổ chức) hay hold the line (giữ máy).",
          },
        ],
        explanation:
          "Cùng động từ hold: hold a meeting = tổ chức; hold the line = giữ máy; hold your questions = để dành câu hỏi.",
      },
      {
        kind: "repair",
        id: "tdn-l4-6",
        sentence: "The company has decided to close the downtown location this fall.",
        draft: "Công ty đã quyết định ___ ___ ở khu trung tâm vào mùa thu này.",
        blanks: [
          {
            options: ["đóng cửa", "khép lại", "kết thúc"],
            correct: 0,
            note: "close + một cửa hàng/chi nhánh = đóng cửa, ngừng hoạt động.",
          },
          {
            options: ["cơ sở", "vị trí địa lý", "địa điểm quay phim"],
            correct: 0,
            note: "location trong kinh doanh = cơ sở, điểm bán — một chi nhánh cụ thể, không phải toạ độ.",
          },
        ],
        explanation:
          "“location” là một trong những từ TOEIC hay dùng nhất theo nghĩa “cơ sở/chi nhánh”: our three locations = ba cơ sở của chúng tôi.",
      },
      {
        kind: "repair",
        id: "tdn-l4-7",
        sentence: "All returns must be accompanied by the original receipt.",
        draft: "Mọi ___ đều phải kèm theo ___ gốc.",
        blanks: [
          {
            options: ["hàng trả lại", "lợi nhuận", "sự quay về"],
            correct: 0,
            note: "returns trong chính sách cửa hàng = việc trả hàng / hàng hoàn trả.",
          },
          {
            options: ["hoá đơn mua hàng", "biên nhận công văn", "công thức"],
            correct: 0,
            note: "receipt = hoá đơn, biên lai mua hàng. Đừng nhầm với recipe (công thức nấu ăn).",
          },
        ],
        explanation:
          "returns cũng có nghĩa “lợi nhuận” (returns on investment) — lại là một ví dụ nữa cho thấy phải đọc loại văn bản trước.",
      },
      {
        kind: "repair",
        id: "tdn-l4-8",
        sentence: "We appreciate that some guests may find the new check-in process confusing.",
        draft: "Chúng tôi ___ rằng quy trình nhận phòng mới có thể khiến một số khách thấy khó hiểu.",
        blanks: [
          {
            options: ["hiểu và thông cảm", "đánh giá cao", "biết ơn"],
            correct: 0,
            note: "appreciate + that + mệnh đề = nhận thức được, hiểu và thông cảm. Chỉ khi appreciate + danh từ (your patience) mới là cảm ơn.",
          },
        ],
        explanation:
          "Đây là bẫy tinh vi: appreciate đi với mệnh đề “that…” thì KHÔNG phải cảm ơn mà là “chúng tôi hiểu rằng…”. Dịch nhầm là câu xin lỗi biến thành câu khen.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "tdn-l5-1",
        source:
          "If the balance is not settled by the due date, interest will be charged at the standard rate.",
        model:
          "Nếu số tiền còn nợ không được thanh toán trước hạn, chúng tôi sẽ tính lãi theo mức thông thường.",
        focus:
          "Bốn từ đa nghĩa cùng chuyển sang nghĩa tài chính: balance (số dư nợ), settle (thanh toán), interest (lãi), rate (mức/lãi suất).",
        keyPoints: [
          "nếu chưa thanh toán trước hạn",
          "số tiền còn nợ / số dư",
          "sẽ bị tính lãi",
          "theo mức/lãi suất thông thường",
        ],
      },
      {
        kind: "free",
        id: "tdn-l5-2",
        source:
          "Ms. Alvarez will cover the reception desk while we address the scheduling issue.",
        model:
          "Bà Alvarez sẽ trực quầy lễ tân trong lúc chúng tôi xử lý vấn đề lịch làm việc.",
        focus:
          "cover = trực thay (người + vị trí làm việc); address = xử lý (đi với issue); issue = vấn đề, không phải số báo.",
        keyPoints: [
          "bà Alvarez trực thay/làm thay ở quầy lễ tân",
          "trong lúc / trong khi",
          "xử lý vấn đề về lịch",
        ],
      },
      {
        kind: "free",
        id: "tdn-l5-3",
        source:
          "The board will not meet this month, so the proposal will be held until December.",
        model:
          "Hội đồng quản trị sẽ không họp trong tháng này, nên đề xuất sẽ được để lại tới tháng 12.",
        focus:
          "board = hội đồng; meet = họp; proposal = đề xuất; hold = tạm giữ lại, hoãn (không phải “cầm”).",
        keyPoints: [
          "hội đồng không họp tháng này",
          "nên/vì vậy",
          "đề xuất bị hoãn/để lại",
          "tới tháng 12",
        ],
      },
      {
        kind: "free",
        id: "tdn-l5-4",
        source:
          "We appreciate that the current policy does not cover part-time staff, and we are reviewing it.",
        model:
          "Chúng tôi hiểu rằng chính sách hiện hành chưa áp dụng cho nhân viên bán thời gian, và chúng tôi đang xem xét lại.",
        focus:
          "appreciate + that = hiểu/nhận thức được, KHÔNG phải cảm ơn. cover = áp dụng cho. current = hiện hành. review = xem xét lại.",
        keyPoints: [
          "chúng tôi hiểu/nhận thấy",
          "chính sách hiện tại chưa áp dụng cho nhân viên bán thời gian",
          "đang xem xét lại",
        ],
      },
      {
        kind: "free",
        id: "tdn-l5-5",
        source:
          "Our Da Nang location will run extended hours during the holiday season to meet customer demand.",
        model:
          "Cơ sở Đà Nẵng của chúng tôi sẽ mở cửa thêm giờ trong mùa lễ để đáp ứng nhu cầu của khách hàng.",
        focus:
          "location = cơ sở/chi nhánh; run + hours = hoạt động theo khung giờ; meet + demand = đáp ứng nhu cầu.",
        keyPoints: [
          "cơ sở/chi nhánh Đà Nẵng",
          "mở cửa thêm giờ / kéo dài giờ hoạt động",
          "trong mùa lễ",
          "để đáp ứng nhu cầu khách hàng",
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
        id: "tdn-l6-1",
        source:
          "Dear Mr. Pham,\n\nThank you for your recent order. Unfortunately, two of the items you selected are currently out of stock. We can either hold your entire order until they arrive in about three weeks, or ship the available items now and charge you no additional delivery fee for the rest. Please let us know which option you prefer.",
        model:
          "Kính gửi ông Phạm,\n\nCảm ơn ông đã đặt hàng. Rất tiếc, hai sản phẩm ông chọn hiện đang hết hàng. Chúng tôi có thể giữ lại toàn bộ đơn hàng cho tới khi có hàng, khoảng ba tuần nữa; hoặc gửi trước những sản phẩm còn hàng và không thu thêm phí giao hàng cho phần còn lại. Ông vui lòng cho biết muốn chọn phương án nào.",
        focus:
          "order (đơn hàng), hold (giữ lại), stock (hàng tồn), charge (thu phí), ship (gửi hàng) — năm từ đa nghĩa trong một email. Chú ý “charge you no additional fee” là KHÔNG thu thêm.",
        keyPoints: [
          "cảm ơn đã đặt hàng",
          "hai sản phẩm hết hàng",
          "phương án 1: giữ cả đơn khoảng ba tuần",
          "phương án 2: gửi trước phần có hàng, không thu thêm phí giao",
          "đề nghị khách chọn",
        ],
        comprehension: {
          question: "Nếu khách chọn nhận trước phần hàng có sẵn, họ phải trả thêm gì?",
          options: [
            "Phí giao hàng cho lần giao thứ hai.",
            "Không phải trả thêm gì cả.",
            "Một khoản phí giữ hàng trong ba tuần.",
          ],
          correct: 1,
          explanation:
            "“charge you no additional delivery fee” — chữ “no” nằm giữa câu rất dễ bị đọc lướt qua, và khi đó nghĩa đảo ngược hoàn toàn.",
        },
      },
      {
        kind: "free",
        id: "tdn-l6-2",
        source:
          "MEMO — To all department heads\n\nThe board has approved a modest increase in next year's training budget. Each department may now cover the cost of one external certification course per employee. Note that this does not extend to conference travel, which remains subject to the existing approval process.",
        model:
          "THÔNG BÁO — Gửi các trưởng bộ phận\n\nHội đồng quản trị đã duyệt mức tăng nhẹ cho ngân sách đào tạo năm tới. Từ nay mỗi bộ phận có thể chi trả cho mỗi nhân viên một khoá học lấy chứng chỉ bên ngoài. Lưu ý rằng khoản này không áp dụng cho chi phí đi hội thảo — phần đó vẫn phải xin duyệt theo quy trình cũ.",
        focus:
          "board (hội đồng), modest (nhẹ, khiêm tốn — không phải “khiêm nhường”), cover (chi trả), extend to (áp dụng cho), subject to (phải theo/chịu sự chi phối của).",
        keyPoints: [
          "hội đồng duyệt tăng nhẹ ngân sách đào tạo năm tới",
          "mỗi bộ phận được chi trả một khoá chứng chỉ bên ngoài cho mỗi nhân viên",
          "không áp dụng cho chi phí đi hội thảo",
          "đi hội thảo vẫn theo quy trình duyệt cũ",
        ],
        comprehension: {
          question: "Chi phí đi dự hội thảo được xử lý thế nào?",
          options: [
            "Cũng được lấy từ ngân sách đào tạo mới.",
            "Vẫn phải xin duyệt như trước, không thuộc khoản mới.",
            "Không còn được công ty chi trả nữa.",
          ],
          correct: 1,
          explanation:
            "“does not extend to … which remains subject to the existing approval process” — vẫn được chi trả, chỉ là qua đường cũ. Rất dễ nhầm thành “bị cắt”.",
        },
      },
      {
        kind: "free",
        id: "tdn-l6-3",
        source:
          "Notice to residents\n\nThe elevator in Building C will be out of service from 8 A.M. to 4 P.M. on Tuesday while technicians address a recurring fault. Residents on upper floors who require assistance should contact the front desk in advance; staff will be on hand to help with deliveries and heavy items during that window.",
        model:
          "Thông báo tới cư dân\n\nThang máy toà nhà C sẽ ngừng hoạt động từ 8 giờ sáng đến 4 giờ chiều thứ Ba để kỹ thuật viên khắc phục một lỗi lặp đi lặp lại. Cư dân ở các tầng trên nếu cần hỗ trợ, vui lòng báo trước cho quầy lễ tân; trong khoảng thời gian đó sẽ có nhân viên trực để giúp nhận hàng và mang đồ nặng.",
        focus:
          "service (hoạt động — out of service = ngừng hoạt động), address (khắc phục), fault (lỗi kỹ thuật), on hand (có mặt sẵn), window (khoảng thời gian).",
        keyPoints: [
          "thang máy toà C ngừng hoạt động 8h–16h thứ Ba",
          "để khắc phục lỗi lặp lại",
          "cư dân tầng trên cần hỗ trợ thì báo trước quầy lễ tân",
          "có nhân viên trực giúp nhận hàng và mang đồ nặng",
        ],
        comprehension: {
          question: "Cư dân tầng trên cần hỗ trợ phải làm gì?",
          options: [
            "Chờ nhân viên tới từng căn hộ hỏi thăm.",
            "Báo trước cho quầy lễ tân.",
            "Tự sắp xếp nhận hàng sau 4 giờ chiều.",
          ],
          correct: 1,
          explanation:
            "“should contact the front desk in advance” — “in advance” là chi tiết quyết định, và cũng là kiểu chi tiết Part 7 hay hỏi.",
        },
      },
    ],
  },
];
