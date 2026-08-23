import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 6 — MỆNH ĐỀ QUAN HỆ & CÁCH TÁCH CÂU
// Tiếng Việt KHÔNG có mệnh đề quan hệ. Nhồi hết vào một câu bằng "mà"
// là câu nghẹt thở; nhiều trường hợp phải TÁCH thành câu riêng.
// Kỹ năng cốt lõi: xác định đúng tiền ngữ (danh từ được bổ nghĩa),
// rồi chọn một trong ba cách: bỏ "mà", dùng "mà", hoặc tách câu.
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const menhDeQuanHeLevels: TransLevel[] = [
  // ── L1 — Tìm tiền ngữ ─────────────────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "mdqh-l1-1",
        sentence: "The report that arrived this morning contains the updated figures.",
        instruction: "Bấm vào DANH TỪ mà mệnh đề quan hệ đang bổ nghĩa:",
        correctWords: ["report"],
        explanation:
          "that arrived this morning bổ nghĩa cho report. Dịch: “Bản báo cáo gửi tới sáng nay có số liệu mới nhất.” — không cần chữ “mà” nào cả.",
      },
      {
        kind: "highlight",
        id: "mdqh-l1-2",
        sentence: "We hired a consultant who specializes in supply chain management.",
        instruction: "Bấm vào DANH TỪ mà mệnh đề quan hệ đang bổ nghĩa:",
        correctWords: ["consultant"],
        explanation:
          "who specializes… bổ nghĩa cho consultant. Dịch: “Chúng tôi đã thuê một chuyên gia tư vấn chuyên về quản lý chuỗi cung ứng.”",
      },
      {
        kind: "highlight",
        id: "mdqh-l1-3",
        sentence: "The policy, which takes effect on June 1, applies to all staff.",
        instruction: "Bấm vào DANH TỪ mà mệnh đề quan hệ đang bổ nghĩa:",
        correctWords: ["policy"],
        explanation:
          "Hai dấu phẩy báo hiệu mệnh đề KHÔNG xác định — nó chỉ thêm thông tin phụ. Đây là loại nên tách thành câu riêng khi dịch.",
      },
      {
        kind: "highlight",
        id: "mdqh-l1-4",
        sentence: "Employees whose badges expire this month should visit the HR office.",
        instruction: "Bấm vào DANH TỪ mà mệnh đề quan hệ đang bổ nghĩa:",
        correctWords: ["Employees"],
        explanation:
          "whose = “của người/vật đó”. Dịch: “Nhân viên có thẻ hết hạn trong tháng này cần tới phòng Nhân sự.”",
      },
      {
        kind: "highlight",
        id: "mdqh-l1-5",
        sentence: "The warehouse where the goods are stored is being renovated.",
        instruction: "Bấm vào DANH TỪ mà mệnh đề quan hệ đang bổ nghĩa:",
        correctWords: ["warehouse"],
        explanation:
          "where thay cho “ở đó”. Dịch: “Kho chứa hàng đang được cải tạo.” — tiếng Việt gói gọn cả mệnh đề vào hai chữ “chứa hàng”.",
      },
      {
        kind: "highlight",
        id: "mdqh-l1-6",
        sentence: "The vendor missed two deadlines, which prompted a contract review.",
        instruction: "Bấm vào đại từ quan hệ đang thay cho CẢ VIỆC vừa kể (không phải một danh từ):",
        correctWords: ["which"],
        explanation:
          "which ở đây không thay cho “deadlines” mà thay cho cả chuyện “nhà cung cấp trễ hai lần”. Bắt buộc phải tách câu: “…trễ hai lần. Vì vậy công ty phải rà soát lại hợp đồng.”",
      },
      {
        kind: "highlight",
        id: "mdqh-l1-7",
        sentence: "Anyone who has not submitted the form will receive a reminder.",
        instruction: "Bấm vào DANH TỪ mà mệnh đề quan hệ đang bổ nghĩa:",
        correctWords: ["Anyone"],
        explanation:
          "Dịch: “Ai chưa nộp đơn sẽ nhận được thư nhắc.” — “Anyone who” gộp lại thành đúng một chữ “Ai”.",
      },
      {
        kind: "highlight",
        id: "mdqh-l1-8",
        sentence: "The training session that was postponed last week will be held on Friday.",
        instruction: "Bấm vào DANH TỪ mà mệnh đề quan hệ đang bổ nghĩa:",
        correctWords: ["session"],
        explanation:
          "Tiền ngữ là session, không phải training. Dịch: “Buổi đào tạo bị hoãn tuần trước sẽ diễn ra vào thứ Sáu.”",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "mdqh-l2-1",
        sentence: "The policy, which takes effect on June 1, applies to all staff.",
        options: [
          "Chính sách mà có hiệu lực vào ngày 1/6 áp dụng cho toàn bộ nhân viên.",
          "Chính sách này áp dụng cho toàn bộ nhân viên và có hiệu lực từ ngày 1/6.",
          "Chính sách áp dụng cho nhân viên nào có hiệu lực từ ngày 1/6.",
        ],
        correct: 1,
        optionNotes: [
          "Nhồi bằng “mà” — câu nghẹt, và tệ hơn là biến thông tin phụ thành điều kiện giới hạn.",
          "Đúng — mệnh đề không xác định tách thành một vế riêng nối bằng “và”.",
          "Hiểu ngược hoàn toàn: thành ra chỉ một số nhân viên mới chịu chính sách này.",
        ],
        explanation:
          "Dấu phẩy quanh mệnh đề = thông tin THÊM, không phải điều kiện lọc. Dịch bằng “mà” là vô tình biến nó thành điều kiện.",
      },
      {
        kind: "compare",
        id: "mdqh-l2-2",
        sentence: "The report that arrived this morning contains the updated figures.",
        options: [
          "Bản báo cáo mà đã đến vào sáng nay thì chứa đựng những con số được cập nhật.",
          "Bản báo cáo gửi tới sáng nay có số liệu mới nhất.",
          "Bản báo cáo có số liệu mới nhất, và nó đến vào sáng nay.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch từng thành phần một, ra câu rất nặng. Tiếng Việt không cần “mà… thì…”.",
          "Đúng — mệnh đề xác định gói gọn thành cụm bổ nghĩa đứng sau danh từ.",
          "Tách câu không cần thiết: đây là mệnh đề XÁC ĐỊNH (không có dấu phẩy), nó dùng để phân biệt báo cáo này với báo cáo khác.",
        ],
        explanation:
          "Không dấu phẩy = mệnh đề xác định = gói vào cụm, thường bỏ hẳn chữ “mà”. Có dấu phẩy = tách câu.",
      },
      {
        kind: "compare",
        id: "mdqh-l2-3",
        sentence: "The vendor missed two deadlines, which prompted a contract review.",
        options: [
          "Nhà cung cấp đã lỡ hai hạn chót mà thúc đẩy một sự xem xét hợp đồng.",
          "Nhà cung cấp lỡ hai hạn chót, những cái đã khiến hợp đồng bị xem lại.",
          "Nhà cung cấp trễ hai lần. Vì vậy công ty phải rà soát lại hợp đồng.",
        ],
        correct: 2,
        optionNotes: [
          "“mà” gắn sai: nó biến “hạn chót” thành thứ thúc đẩy việc rà soát.",
          "Vẫn cố giữ mệnh đề quan hệ nên câu lủng củng, và “những cái” là dịch máy.",
          "Đúng — which chỉ cả sự việc, nên phải tách câu và nối bằng “vì vậy”.",
        ],
        explanation:
          "which sau dấu phẩy chỉ CẢ MỆNH ĐỀ trước thì chỉ có một cách dịch đúng: chấm câu, rồi mở câu mới bằng “vì vậy / điều đó khiến”.",
      },
      {
        kind: "compare",
        id: "mdqh-l2-4",
        sentence: "Employees who work remotely must log in before 9 A.M.",
        options: [
          "Nhân viên làm việc từ xa phải đăng nhập trước 9 giờ sáng.",
          "Nhân viên, những người làm việc từ xa, phải đăng nhập trước 9 giờ sáng.",
          "Nhân viên mà làm việc ở xa thì phải đăng nhập trước 9 giờ sáng.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — mệnh đề xác định thành cụm bổ nghĩa gọn, không cần “mà”.",
          "Thêm dấu phẩy là biến thành mệnh đề không xác định — hoá ra TOÀN BỘ nhân viên đều làm từ xa. Sai nghĩa.",
          "Chữ “mà… thì” làm câu nặng không cần thiết.",
        ],
        explanation:
          "Bản dịch thêm dấu phẩy quanh “những người làm việc từ xa” minh hoạ một lỗi ít ai để ý: thêm hay bớt dấu phẩy trong bản dịch cũng đổi nghĩa như trong bản gốc.",
      },
      {
        kind: "compare",
        id: "mdqh-l2-5",
        sentence: "Mr. Duval, whose team won the sales award, will lead the new branch.",
        options: [
          "Ông Duval mà nhóm của ông ấy thắng giải bán hàng sẽ phụ trách chi nhánh mới.",
          "Ông Duval sẽ phụ trách chi nhánh mới; nhóm của ông vừa đoạt giải thưởng bán hàng.",
          "Nhóm của ông Duval thắng giải bán hàng sẽ phụ trách chi nhánh mới.",
        ],
        correct: 1,
        optionNotes: [
          "Cấu trúc “mà… của ông ấy” là dịch máy, tiếng Việt không nói vậy.",
          "Đúng — tách thành hai vế, thông tin phụ đặt sau dấu chấm phẩy.",
          "Đổi chủ ngữ: người phụ trách chi nhánh là ÔNG DUVAL, không phải cả nhóm.",
        ],
        explanation:
          "whose là chỗ dễ đảo nhầm chủ ngữ nhất. Sau khi dịch xong, kiểm lại: rốt cuộc ai làm động từ chính?",
      },
      {
        kind: "compare",
        id: "mdqh-l2-6",
        sentence: "This is the only branch that stays open on Sundays.",
        options: [
          "Đây là chi nhánh duy nhất mở cửa vào Chủ nhật.",
          "Đây là chi nhánh duy nhất, nó mở cửa vào Chủ nhật.",
          "Đây là chi nhánh duy nhất mà nó ở lại mở vào các ngày Chủ nhật.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — “duy nhất” đã hàm ý phân biệt, mệnh đề gói gọn ngay sau.",
          "Tách câu làm mất ý “duy nhất mở Chủ nhật” — thành ra chỉ có một chi nhánh trên đời.",
          "Dịch mặt chữ “stays open”.",
        ],
        explanation:
          "Sau only / the first / the best, mệnh đề quan hệ luôn là XÁC ĐỊNH — tuyệt đối không tách câu.",
      },
      {
        kind: "compare",
        id: "mdqh-l2-7",
        sentence: "The invoice you sent last week has not been processed yet.",
        options: [
          "Hoá đơn bạn gửi tuần trước vẫn chưa được xử lý.",
          "Hoá đơn mà bạn đã gửi nó tuần trước thì chưa được xử lý.",
          "Bạn đã gửi hoá đơn tuần trước mà chưa được xử lý.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — mệnh đề quan hệ đã lược “that”, tiếng Việt cũng lược luôn.",
          "Thêm cả “mà” lẫn “nó” — thừa hai lần.",
          "Đổi chủ ngữ chính từ “hoá đơn” sang “bạn”, làm mất trọng tâm câu.",
        ],
        explanation:
          "Khi that/which bị lược trong tiếng Anh (contact clause), tiếng Việt cũng chỉ cần đặt cụm ngay sau danh từ.",
      },
      {
        kind: "compare",
        id: "mdqh-l2-8",
        sentence: "We are looking for a supplier whose delivery times are more reliable.",
        options: [
          "Chúng tôi đang tìm một nhà cung cấp mà thời gian giao hàng của họ đáng tin hơn.",
          "Chúng tôi đang tìm nhà cung cấp giao hàng đúng hẹn hơn.",
          "Chúng tôi đang tìm thời gian giao hàng đáng tin của một nhà cung cấp.",
        ],
        correct: 1,
        optionNotes: [
          "Không sai nghĩa nhưng nặng nề; tiếng Việt có cách nói gọn hơn hẳn.",
          "Đúng — gói cả mệnh đề whose thành một cụm động từ bổ nghĩa.",
          "Đảo hẳn tân ngữ: cái đang tìm là NHÀ CUNG CẤP, không phải thời gian giao hàng.",
        ],
        explanation:
          "Mẹo hay dùng: chuyển whose + danh từ thành một cụm ĐỘNG TỪ trong tiếng Việt (delivery times are reliable → giao hàng đúng hẹn).",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "mdqh-l3-1",
        sentence: "The technician who repaired the printer left a note.",
        chunks: ["Kỹ thuật viên sửa máy in", "có để lại một mẩu ghi chú"],
        distractors: ["mà đã sửa cái máy in", "đã bỏ lại một ghi chú"],
        hint: "Mệnh đề xác định — không cần chữ “mà”.",
        explanation:
          "leave a note = để lại lời nhắn, không phải “bỏ lại”. Và “who repaired” gói gọn thành “sửa máy in”.",
      },
      {
        kind: "order",
        id: "mdqh-l3-2",
        sentence: "Our new office, which opened in April, already has fifty staff.",
        chunks: ["Văn phòng mới của chúng tôi,", "khai trương hồi tháng 4,", "hiện đã có năm mươi nhân viên"],
        distractors: ["mà nó mở cửa vào tháng 4,", "đã có được năm mươi con người"],
        hint: "Mệnh đề không xác định — đặt thành cụm chen giữa, đừng dùng “mà”.",
        explanation:
          "Với mệnh đề không xác định ngắn, tiếng Việt có thể chen thẳng vào giữa câu mà không cần chấm tách.",
      },
      {
        kind: "order",
        id: "mdqh-l3-3",
        sentence: "The client canceled the order, which cost us two weeks of work.",
        chunks: ["Khách hàng đã huỷ đơn,", "khiến chúng tôi mất trắng", "hai tuần làm việc"],
        distractors: ["Khách hàng đã đổi đơn,", "mà tốn của chúng tôi hai tuần lễ công việc"],
        hint: "which chỉ cả việc huỷ đơn — dùng “khiến”.",
        explanation:
          "“khiến / làm cho / vì vậy” là ba cách nối chuẩn khi which chỉ cả mệnh đề trước.",
      },
      {
        kind: "order",
        id: "mdqh-l3-4",
        sentence: "Anyone who registers before Friday will receive a discount.",
        chunks: ["Ai đăng ký trước thứ Sáu", "đều được giảm giá"],
        distractors: ["Bất cứ người nào mà đăng ký", "sẽ bị giảm giá"],
        hint: "Anyone who = Ai… (một chữ).",
        explanation:
          "Được giảm giá là việc tốt nên dùng “được”, không dùng “bị”. Và “Anyone who” chỉ cần dịch thành “Ai”.",
      },
      {
        kind: "order",
        id: "mdqh-l3-5",
        sentence: "The building where we hold our workshops will close for repairs.",
        chunks: ["Toà nhà nơi chúng tôi tổ chức các buổi workshop", "sẽ đóng cửa để sửa chữa"],
        distractors: ["mà chúng tôi giữ workshop ở đó", "sẽ bị đóng để sửa"],
        hint: "where = nơi.",
        explanation:
          "hold a workshop = tổ chức buổi workshop, không phải “giữ”. where dịch thẳng thành “nơi”.",
      },
      {
        kind: "order",
        id: "mdqh-l3-6",
        sentence: "The candidate we interviewed yesterday has accepted our offer.",
        chunks: ["Ứng viên chúng tôi phỏng vấn hôm qua", "đã nhận lời mời làm việc"],
        distractors: ["mà chúng tôi đã phỏng vấn cô ấy", "đã chấp nhận sự đề nghị của chúng tôi"],
        hint: "that bị lược trong bản gốc — bản dịch cũng lược.",
        explanation:
          "accept an offer = nhận lời mời làm việc. Đây là collocation tuyển dụng chuẩn.",
      },
      {
        kind: "order",
        id: "mdqh-l3-7",
        sentence: "Ms. Bianchi, who joined us in 2020, is now our regional director.",
        chunks: ["Bà Bianchi gia nhập công ty năm 2020", "và hiện là giám đốc khu vực"],
        distractors: ["mà bà ấy đã tham gia chúng tôi", "bây giờ đang là người chỉ đạo vùng"],
        hint: "Mệnh đề không xác định — tách thành hai vế nối bằng “và”.",
        explanation:
          "join us = gia nhập công ty. regional director = giám đốc khu vực, một chức danh cố định.",
      },
      {
        kind: "order",
        id: "mdqh-l3-8",
        sentence: "Items that are returned without a receipt cannot be refunded.",
        chunks: ["Hàng trả lại không có hoá đơn", "sẽ không được hoàn tiền"],
        distractors: ["mà bị trả lại mà không có", "thì không thể được tiền lại"],
        hint: "Mệnh đề xác định — gói thành cụm, bỏ “mà”.",
        explanation:
          "Cả mệnh đề “that are returned without a receipt” gói lại thành đúng sáu chữ tiếng Việt.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "mdqh-l4-1",
        sentence: "The supplier that we used last year has raised its prices.",
        draft: "___ đã tăng giá.",
        blanks: [
          {
            options: [
              "Nhà cung cấp chúng tôi dùng năm ngoái",
              "Nhà cung cấp mà chúng tôi đã dùng nó năm ngoái",
              "Năm ngoái nhà cung cấp của chúng tôi",
            ],
            correct: 0,
            note: "Mệnh đề xác định gói thành cụm bổ nghĩa, không cần “mà” cũng không cần “nó”.",
          },
        ],
        explanation:
          "Bản dịch mở đầu bằng “Năm ngoái…” biến mốc này thành trạng ngữ của cả câu — thành ra việc tăng giá xảy ra năm ngoái, sai thời điểm.",
      },
      {
        kind: "repair",
        id: "mdqh-l4-2",
        sentence: "Our flagship store, which opened in 1998, will be remodeled next spring.",
        draft: "Cửa hàng chính của chúng tôi ___ sẽ được cải tạo vào mùa xuân tới.",
        blanks: [
          {
            options: [
              "(khai trương từ năm 1998)",
              "mà nó đã mở cửa năm 1998",
              "nào mở cửa năm 1998",
            ],
            correct: 0,
            note: "Mệnh đề không xác định → cụm chen giữa hai dấu phẩy, giữ đúng vai trò thông tin phụ.",
          },
        ],
        explanation:
          "Bản dịch dùng chữ “nào” khiến câu thành điều kiện lọc — hoá ra công ty có nhiều cửa hàng chính, chỉ cải tạo cái mở năm 1998.",
      },
      {
        kind: "repair",
        id: "mdqh-l4-3",
        sentence: "The shipment arrived three days late, which upset several customers.",
        draft: "Lô hàng tới trễ ba ngày, ___ nhiều khách hàng không hài lòng.",
        blanks: [
          {
            options: ["khiến", "cái mà làm", "và ba ngày đó"],
            correct: 0,
            note: "which chỉ cả việc “tới trễ ba ngày” → dùng “khiến”.",
          },
        ],
        explanation:
          "Cứ thấy dấu phẩy + which là phải hỏi: nó thay cho danh từ ngay trước, hay cho cả sự việc? Ở đây là cả sự việc.",
      },
      {
        kind: "repair",
        id: "mdqh-l4-4",
        sentence: "Passengers whose flights were canceled may rebook at no charge.",
        draft: "___ có thể đổi vé ___.",
        blanks: [
          {
            options: [
              "Hành khách có chuyến bay bị huỷ",
              "Hành khách mà chuyến bay của họ bị huỷ",
              "Chuyến bay bị huỷ của hành khách",
            ],
            correct: 0,
            note: "whose + danh từ → chuyển thành cụm “có + danh từ + …” trong tiếng Việt.",
          },
          {
            options: ["miễn phí", "không tính giá", "với giá bằng không"],
            correct: 0,
            note: "at no charge = miễn phí.",
          },
        ],
        explanation:
          "Khuôn “có + X + bị/được…” là cách gọn nhất để dịch whose. So sánh: employees whose badges expire → nhân viên có thẻ hết hạn.",
      },
      {
        kind: "repair",
        id: "mdqh-l4-5",
        sentence: "This is the report that the auditor asked for.",
        draft: "Đây là ___.",
        blanks: [
          {
            options: [
              "bản báo cáo mà kiểm toán viên yêu cầu",
              "bản báo cáo kiểm toán viên đã hỏi cho",
              "báo cáo của kiểm toán viên đã yêu cầu",
            ],
            correct: 0,
            note: "Ở câu giới thiệu “Đây là…”, chữ “mà” lại hợp lý vì nó giúp tách rõ hai phần.",
          },
        ],
        explanation:
          "Không phải lúc nào cũng bỏ “mà”. Sau “Đây là / Đó là”, giữ “mà” khiến câu rõ hơn — nguyên tắc là nghe có tự nhiên không, chứ không phải cấm tuyệt đối.",
      },
      {
        kind: "repair",
        id: "mdqh-l4-6",
        sentence: "The department, which had been understaffed for months, finally hired three people.",
        draft: "Bộ phận này ___ đã tuyển được ba người.",
        blanks: [
          {
            options: [
              "thiếu người suốt mấy tháng, nay cuối cùng",
              "mà nó đã bị thiếu nhân viên hàng tháng thì",
              "sẽ thiếu người trong nhiều tháng nên",
            ],
            correct: 0,
            note: "had been understaffed for months = đã thiếu người suốt mấy tháng trước đó; finally = cuối cùng cũng.",
          },
        ],
        explanation:
          "Chữ “finally” mang cảm xúc nhẹ nhõm. Bỏ nó đi thì câu vẫn đúng thông tin nhưng mất giọng người viết.",
      },
      {
        kind: "repair",
        id: "mdqh-l4-7",
        sentence: "Guests who booked through the app receive a complimentary breakfast.",
        draft: "___ được tặng bữa sáng ___.",
        blanks: [
          {
            options: [
              "Khách đặt phòng qua ứng dụng",
              "Khách, những người đã đặt qua ứng dụng,",
              "Ai đặt phòng thì qua ứng dụng",
            ],
            correct: 0,
            note: "Mệnh đề xác định — đây là điều kiện để được ưu đãi, tuyệt đối không thêm dấu phẩy.",
          },
          {
            options: ["miễn phí", "kèm lời khen", "có tính thêm phí"],
            correct: 0,
            note: "complimentary = miễn phí, không liên quan tới “compliment” (lời khen).",
          },
        ],
        explanation:
          "Thêm dấu phẩy vào bản dịch là biến ưu đãi có điều kiện thành ưu đãi cho tất cả — sai lệch có hậu quả thật.",
      },
      {
        kind: "repair",
        id: "mdqh-l4-8",
        sentence: "We received an email from a customer who claims the product arrived damaged.",
        draft: "Chúng tôi nhận được email từ một khách hàng ___ hàng tới nơi đã hỏng.",
        blanks: [
          {
            options: ["nói rằng", "mà tuyên bố", "người đòi hỏi"],
            correct: 0,
            note: "claim ở đây là “nói rằng, khai rằng” — chưa xác minh, chứ không phải “đòi hỏi”.",
          },
        ],
        explanation:
          "claim mang sắc thái “bên kia nói vậy, chưa chắc đúng”. Dịch thành “khẳng định” hay “đòi hỏi” là đổi thái độ của người viết.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "mdqh-l5-1",
        source:
          "Employees who have not completed the safety course by June 30 will be scheduled for a make-up session.",
        model:
          "Nhân viên chưa hoàn thành khoá học an toàn trước ngày 30 tháng 6 sẽ được xếp lịch học bù.",
        focus:
          "Mệnh đề xác định — gói thành cụm bổ nghĩa, bỏ chữ “mà”. make-up session = buổi học bù.",
        keyPoints: [
          "nhân viên chưa hoàn thành khoá học an toàn",
          "trước ngày 30 tháng 6",
          "sẽ được xếp lịch học bù",
        ],
      },
      {
        kind: "free",
        id: "mdqh-l5-2",
        source:
          "Our supplier raised prices twice this year, which forced us to look for alternatives.",
        model:
          "Nhà cung cấp của chúng tôi đã tăng giá hai lần trong năm nay, khiến chúng tôi phải tìm phương án khác.",
        focus:
          "which chỉ cả việc tăng giá hai lần → dùng “khiến”, không dùng “mà”.",
        keyPoints: [
          "nhà cung cấp tăng giá hai lần trong năm nay",
          "khiến/vì vậy",
          "phải tìm nhà cung cấp/phương án khác",
        ],
      },
      {
        kind: "free",
        id: "mdqh-l5-3",
        source:
          "The Riverside branch, which has been open since 2015, will relocate to a larger space downtown.",
        model:
          "Chi nhánh Riverside, hoạt động từ năm 2015 đến nay, sẽ chuyển tới mặt bằng rộng hơn ở khu trung tâm.",
        focus:
          "Mệnh đề không xác định → cụm chen giữa hai dấu phẩy. “has been open since” là vẫn đang mở, đừng dịch thành “đã mở”.",
        keyPoints: [
          "chi nhánh Riverside",
          "hoạt động từ 2015 tới nay",
          "sẽ chuyển sang mặt bằng rộng hơn",
          "ở khu trung tâm",
        ],
      },
      {
        kind: "free",
        id: "mdqh-l5-4",
        source:
          "Customers whose warranties expired before January may still request a paid repair.",
        model:
          "Khách hàng có bảo hành hết hạn trước tháng 1 vẫn có thể yêu cầu sửa chữa có tính phí.",
        focus:
          "whose + danh từ → “có + danh từ + …”. paid repair = sửa có tính phí (khách trả tiền).",
        keyPoints: [
          "khách hàng có bảo hành hết hạn trước tháng 1",
          "vẫn có thể yêu cầu sửa chữa",
          "nhưng phải trả phí",
        ],
      },
      {
        kind: "free",
        id: "mdqh-l5-5",
        source:
          "The consultant we hired last spring, who specializes in retail logistics, has recommended closing two warehouses.",
        model:
          "Chuyên gia tư vấn chúng tôi thuê hồi mùa xuân năm ngoái là người chuyên về hậu cần bán lẻ; ông đề xuất đóng hai kho hàng.",
        focus:
          "Hai mệnh đề chồng nhau: một xác định (we hired last spring), một không xác định (who specializes…). Cái đầu gói vào cụm, cái sau tách vế.",
        keyPoints: [
          "chuyên gia tư vấn được thuê mùa xuân năm ngoái",
          "chuyên về hậu cần bán lẻ",
          "đề xuất đóng hai kho hàng",
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
        id: "mdqh-l6-1",
        source:
          "MEMO — Parking\n\nStaff who currently park in Lot B, which will be closed for resurfacing from May 4 to May 18, should use Lot D during that period. Anyone whose vehicle is left in Lot B after May 3 may be towed at the owner's expense. Employees who carpool are encouraged to register for the reserved spaces near the north entrance.",
        model:
          "THÔNG BÁO — Bãi đỗ xe\n\nBãi B sẽ đóng để trải lại mặt đường từ ngày 4 đến 18 tháng 5; nhân viên đang gửi xe ở đó xin chuyển sang bãi D trong thời gian này. Xe còn để lại ở bãi B sau ngày 3 tháng 5 có thể bị kéo đi và chủ xe phải chịu chi phí. Nhân viên đi chung xe nên đăng ký các chỗ đỗ dành riêng gần lối vào phía bắc.",
        focus:
          "Ba mệnh đề quan hệ khác loại trong ba câu liên tiếp: which không xác định (nên tách vế), whose (chuyển thành cụm), who xác định (gói gọn). Chú ý “at the owner's expense”.",
        keyPoints: [
          "bãi B đóng để trải lại mặt đường từ 4 đến 18/5",
          "nhân viên đang đỗ ở bãi B chuyển sang bãi D",
          "xe để lại sau ngày 3/5 có thể bị kéo đi, chủ xe chịu phí",
          "nhân viên đi chung xe nên đăng ký chỗ đỗ riêng gần lối vào phía bắc",
        ],
        comprehension: {
          question: "Xe còn nằm ở bãi B ngày 5 tháng 5 thì sao?",
          options: [
            "Được chuyển sang bãi D miễn phí.",
            "Có thể bị kéo đi và chủ xe phải trả tiền.",
            "Bị phạt và cấm gửi xe trong hai tuần.",
          ],
          correct: 1,
          explanation:
            "“may be towed at the owner's expense” — chi tiết mấu chốt là ai trả tiền. Part 7 rất hay hỏi đúng phần chi phí này.",
        },
      },
      {
        kind: "free",
        id: "mdqh-l6-2",
        source:
          "Dear Ms. Okafor,\n\nThank you for your inquiry about the Heritage Suite, which is our largest event space. The suite, which seats up to 200 guests, is available on the dates you mentioned except June 14. Clients who book more than sixty days in advance receive a ten percent discount, which is applied automatically at checkout.",
        model:
          "Kính gửi bà Okafor,\n\nCảm ơn bà đã hỏi về phòng Heritage Suite — đây là không gian tổ chức sự kiện lớn nhất của chúng tôi. Phòng này chứa được tối đa 200 khách và còn trống vào những ngày bà nêu, trừ ngày 14 tháng 6. Khách đặt trước hơn sáu mươi ngày sẽ được giảm mười phần trăm, và mức giảm này được áp dụng tự động khi thanh toán.",
        focus:
          "Bốn mệnh đề quan hệ liên tiếp — nếu dịch cái nào cũng bằng “mà” thì đoạn văn không đọc nổi. Phải luân phiên: tách vế, gói cụm, nối bằng “và”.",
        keyPoints: [
          "cảm ơn đã hỏi về phòng Heritage Suite, không gian sự kiện lớn nhất",
          "chứa tối đa 200 khách",
          "còn trống vào những ngày đã nêu, trừ ngày 14/6",
          "đặt trước hơn 60 ngày được giảm 10%",
          "mức giảm áp dụng tự động khi thanh toán",
        ],
        comprehension: {
          question: "Khách phải làm gì để nhận mức giảm 10%?",
          options: [
            "Đặt trước hơn sáu mươi ngày; hệ thống tự áp dụng.",
            "Nhập mã giảm giá khi thanh toán.",
            "Liên hệ trước với bộ phận kinh doanh để xin duyệt.",
          ],
          correct: 0,
          explanation:
            "Điều kiện nằm ở mệnh đề “who book more than sixty days in advance”, còn “applied automatically” trả lời phần thao tác: không cần làm gì thêm.",
        },
      },
      {
        kind: "free",
        id: "mdqh-l6-3",
        source:
          "The audit found three accounts that had not been reconciled since November. Two of these belonged to the Manila office, which changed accounting software last autumn. The transition, which was completed in December, left some records in the old format. Staff who need help converting those records should contact the finance help desk.",
        model:
          "Đợt kiểm toán phát hiện ba tài khoản chưa được đối chiếu kể từ tháng 11. Hai trong số đó thuộc văn phòng Manila — nơi đã đổi phần mềm kế toán vào mùa thu năm ngoái. Việc chuyển đổi hoàn tất trong tháng 12, nhưng một số dữ liệu vẫn còn ở định dạng cũ. Nhân viên cần hỗ trợ chuyển đổi số dữ liệu đó xin liên hệ bộ phận hỗ trợ tài chính.",
        focus:
          "Bốn mệnh đề quan hệ nối thành chuỗi nhân quả. Điểm khó là giữ được mạch: đổi phần mềm → chuyển đổi xong → dữ liệu còn định dạng cũ → nên cần hỗ trợ.",
        keyPoints: [
          "kiểm toán phát hiện ba tài khoản chưa đối chiếu từ tháng 11",
          "hai tài khoản thuộc văn phòng Manila",
          "văn phòng này đổi phần mềm kế toán mùa thu năm ngoái",
          "việc chuyển đổi xong trong tháng 12 nhưng còn dữ liệu định dạng cũ",
          "ai cần hỗ trợ thì liên hệ bộ phận hỗ trợ tài chính",
        ],
        comprehension: {
          question: "Vì sao một số dữ liệu vẫn ở định dạng cũ?",
          options: [
            "Vì việc chuyển đổi phần mềm chưa hoàn tất.",
            "Vì nhân viên chưa được đào tạo dùng phần mềm mới.",
            "Vì quá trình chuyển sang phần mềm mới để sót lại.",
          ],
          correct: 2,
          explanation:
            "Bẫy nằm ở đáp án “chuyển đổi chưa hoàn tất”: đoạn văn nói rõ việc chuyển đổi ĐÃ xong trong tháng 12, chỉ là nó để sót dữ liệu.",
        },
      },
    ],
  },
];
