import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 10 — TÌNH THÁI & LỊCH SỰ CÔNG SỞ
// may / should / must / would appreciate / please be advised mang mức độ
// khác nhau. Dịch phẳng thành "sẽ, có thể" là mất thái độ người viết.
// Kỹ năng cốt lõi: dịch HÀNH ĐỘNG LỜI NÓI, không dịch mặt chữ —
// đây là đề nghị, nhắc nhở, cho phép, hay bắt buộc?
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const sacThaiLevels: TransLevel[] = [
  // ── L1 — Nhận diện mức độ ─────────────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "st-l1-1",
        sentence: "All staff must complete the safety training before June 1.",
        instruction: "Bấm vào từ cho biết đây là điều BẮT BUỘC:",
        correctWords: ["must"],
        explanation:
          "must = bắt buộc, không có ngoại lệ. Dịch: “Toàn bộ nhân viên phải hoàn thành khoá an toàn trước ngày 1/6.”",
      },
      {
        kind: "highlight",
        id: "st-l1-2",
        sentence: "Employees should review the handbook at least once a year.",
        instruction: "Bấm vào từ cho biết đây là KHUYẾN NGHỊ, không bắt buộc:",
        correctWords: ["should"],
        explanation:
          "should = nên. Nhẹ hơn must hẳn một bậc. Dịch “phải” là làm nặng hơn ý người viết.",
      },
      {
        kind: "highlight",
        id: "st-l1-3",
        sentence: "Visitors may use the guest network during business hours.",
        instruction: "Bấm vào từ cho biết đây là CHO PHÉP:",
        correctWords: ["may"],
        explanation:
          "may ở đây là được phép, không phải “có lẽ”. Dịch: “Khách được dùng mạng dành cho khách trong giờ làm việc.”",
      },
      {
        kind: "highlight",
        id: "st-l1-4",
        sentence: "The shipment may arrive later than expected.",
        instruction: "Bấm vào từ cho biết đây chỉ là KHẢ NĂNG, chưa chắc chắn:",
        correctWords: ["may"],
        explanation:
          "Cùng chữ may nhưng ở đây là khả năng xảy ra. Phân biệt bằng chủ ngữ: người → cho phép; sự việc → khả năng.",
      },
      {
        kind: "highlight",
        id: "st-l1-5",
        sentence: "We would appreciate it if you could confirm by Thursday.",
        instruction: "Bấm vào cụm tạo nên giọng LỊCH SỰ, nhẹ nhàng của lời đề nghị:",
        correctWords: ["would", "appreciate"],
        explanation:
          "would appreciate it if là công thức đề nghị lịch sự. Dịch: “Mong quý vị xác nhận giúp trước thứ Năm.”",
      },
      {
        kind: "highlight",
        id: "st-l1-6",
        sentence: "Please be advised that the office will close at noon on Friday.",
        instruction: "Bấm vào cụm báo hiệu đây là THÔNG BÁO trang trọng:",
        correctWords: ["be", "advised"],
        explanation:
          "Please be advised that = Xin thông báo rằng. Không dịch thành “xin hãy được khuyên”.",
      },
      {
        kind: "highlight",
        id: "st-l1-7",
        sentence: "You are required to present photo identification at check-in.",
        instruction: "Bấm vào cụm cho biết đây là YÊU CẦU BẮT BUỘC:",
        correctWords: ["are", "required"],
        explanation:
          "are required to = bắt buộc phải. Mạnh ngang must, chỉ khác ở giọng trang trọng hơn.",
      },
      {
        kind: "highlight",
        id: "st-l1-8",
        sentence: "You might want to book early, as seats fill up quickly.",
        instruction: "Bấm vào cụm tạo nên giọng GỢI Ý nhẹ nhàng:",
        correctWords: ["might", "want"],
        explanation:
          "might want to = có lẽ nên. Đây là lời khuyên rất nhẹ, không hề bắt buộc. Dịch: “Anh nên đặt sớm, vì chỗ hết nhanh lắm.”",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "st-l2-1",
        sentence: "We would appreciate it if you could confirm your attendance by Thursday.",
        options: [
          "Chúng tôi sẽ đánh giá cao nếu bạn có thể xác nhận tham dự trước thứ Năm.",
          "Mong quý vị xác nhận tham dự giúp trước thứ Năm.",
          "Quý vị phải xác nhận tham dự trước thứ Năm.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ appreciate — câu nghe như máy dịch, và “bạn” quá suồng sã cho thư mời.",
          "Đúng — giữ đúng mức độ đề nghị lịch sự, giọng tự nhiên.",
          "Biến lời đề nghị thành mệnh lệnh — nặng hơn hẳn ý người viết.",
        ],
        explanation:
          "would appreciate it if you could là mức lịch sự cao nhất trong email công việc. Tiếng Việt tương đương là “Mong quý vị… giúp”.",
      },
      {
        kind: "compare",
        id: "st-l2-2",
        sentence: "Employees should submit expense reports within thirty days.",
        options: [
          "Nhân viên phải nộp báo cáo chi phí trong vòng ba mươi ngày.",
          "Nhân viên nên nộp báo cáo chi phí trong vòng ba mươi ngày.",
          "Nhân viên có thể nộp báo cáo chi phí trong vòng ba mươi ngày.",
        ],
        correct: 1,
        optionNotes: [
          "should không mạnh bằng must — dịch “phải” là nâng cấp mức độ.",
          "Đúng — “nên” giữ đúng mức khuyến nghị.",
          "“có thể” lại hạ xuống thành tuỳ ý — nhẹ quá.",
        ],
        explanation:
          "Ba mức rõ rệt: may (được phép) < should (nên) < must/are required to (phải). Dịch lệch một bậc là đổi hẳn tính ràng buộc.",
      },
      {
        kind: "compare",
        id: "st-l2-3",
        sentence: "Guests may leave luggage at the front desk until 6 P.M.",
        options: [
          "Khách có lẽ để hành lý ở quầy lễ tân tới 6 giờ chiều.",
          "Khách phải để hành lý ở quầy lễ tân tới 6 giờ chiều.",
          "Khách có thể gửi hành lý ở quầy lễ tân tới 6 giờ chiều.",
        ],
        correct: 2,
        optionNotes: [
          "“có lẽ” là nghĩa khả năng — sai hẳn, vì đây là quy định cho phép.",
          "Biến quyền lợi thành nghĩa vụ.",
          "Đúng — may = được phép, và “gửi hành lý” là cách nói đúng của dịch vụ khách sạn.",
        ],
        explanation:
          "may với chủ ngữ là người trong văn bản quy định gần như luôn là “được phép”, không phải “có lẽ”.",
      },
      {
        kind: "compare",
        id: "st-l2-4",
        sentence: "Please be advised that parking fees will increase on April 1.",
        options: [
          "Xin hãy được khuyên rằng phí gửi xe sẽ tăng vào ngày 1 tháng 4.",
          "Xin thông báo phí gửi xe sẽ tăng từ ngày 1 tháng 4.",
          "Chúng tôi khuyên quý vị nên tăng phí gửi xe từ ngày 1 tháng 4.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ “be advised” — câu vô nghĩa.",
          "Đúng — đây là công thức mở đầu thông báo, tương đương “Xin thông báo”.",
          "Đảo vai hoàn toàn: người nhận thư thành người đi tăng phí.",
        ],
        explanation:
          "Please be advised that / Please note that / Kindly note that đều là một: “Xin lưu ý / Xin thông báo”.",
      },
      {
        kind: "compare",
        id: "st-l2-5",
        sentence: "I am afraid we cannot accommodate your request on that date.",
        options: [
          "Tôi sợ rằng chúng tôi không thể đáp ứng yêu cầu của bạn vào ngày đó.",
          "Rất tiếc, ngày đó chúng tôi không thể đáp ứng yêu cầu của quý khách.",
          "Tôi lo lắng chúng tôi sẽ không sắp xếp được cho bạn vào ngày đó.",
        ],
        correct: 1,
        optionNotes: [
          "“Tôi sợ rằng” là dịch mặt chữ; I am afraid ở đây không phải nỗi sợ.",
          "Đúng — I am afraid = Rất tiếc, công thức mở đầu lời từ chối lịch sự.",
          "Cũng dịch nhầm thành cảm xúc lo lắng.",
        ],
        explanation:
          "I am afraid là tín hiệu báo trước một tin xấu. Nó không mô tả cảm xúc mà làm mềm lời từ chối.",
      },
      {
        kind: "compare",
        id: "st-l2-6",
        sentence: "You might want to double-check the figures before the meeting.",
        options: [
          "Bạn có thể muốn kiểm tra lại các con số trước cuộc họp.",
          "Bạn phải kiểm tra lại các con số trước cuộc họp.",
          "Anh nên rà lại số liệu trước cuộc họp thì hơn.",
        ],
        correct: 2,
        optionNotes: [
          "“có thể muốn” là dịch mặt chữ, tiếng Việt không nói vậy.",
          "Quá nặng — might want to là lời khuyên rất nhẹ.",
          "Đúng — “nên… thì hơn” giữ được sự tế nhị của lời nhắc.",
        ],
        explanation:
          "might want to là cách nhắc khéo, thường dùng khi người nói không có quyền ra lệnh. Dịch thành “phải” là làm hỏng quan hệ giữa hai bên.",
      },
      {
        kind: "compare",
        id: "st-l2-7",
        sentence: "Kindly return the signed form at your earliest convenience.",
        options: [
          "Vui lòng gửi lại biểu mẫu đã ký sớm nhất khi thuận tiện.",
          "Hãy trả lại mẫu đơn đã ký tại sự tiện lợi sớm nhất của bạn.",
          "Bạn phải gửi ngay lập tức biểu mẫu đã ký cho chúng tôi.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — at your earliest convenience = sớm nhất có thể, nhưng vẫn để bên kia chủ động.",
          "Dịch mặt chữ “convenience”.",
          "“ngay lập tức” là nâng cấp thành khẩn cấp — không đúng giọng câu gốc.",
        ],
        explanation:
          "at your earliest convenience nghe thì lịch sự nhưng vẫn là lời giục. Dịch quá nhẹ thì mất giục, quá nặng thì mất lịch sự.",
      },
      {
        kind: "compare",
        id: "st-l2-8",
        sentence: "Applicants are strongly encouraged to attend the information session.",
        options: [
          "Ứng viên bắt buộc phải dự buổi giới thiệu thông tin.",
          "Ứng viên được khuyến khích mạnh mẽ tham dự buổi giới thiệu.",
          "Chúng tôi rất mong ứng viên tới dự buổi giới thiệu thông tin.",
        ],
        correct: 2,
        optionNotes: [
          "are encouraged không phải bắt buộc, dù có chữ “strongly”.",
          "“khuyến khích mạnh mẽ” là dịch từng chữ, nghe rất cứng.",
          "Đúng — “rất mong” giữ được cả sự nhấn mạnh lẫn tính không bắt buộc.",
        ],
        explanation:
          "strongly encouraged là vùng xám: không bắt buộc nhưng gần như nên đi. Tiếng Việt “rất mong / khuyến khích” là vừa mức.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "st-l3-1",
        sentence: "Could you possibly send the revised draft by tomorrow?",
        chunks: ["Anh gửi giúp tôi bản sửa", "trước ngày mai", "được không ạ"],
        distractors: ["Anh phải gửi bản sửa", "ngay lập tức"],
        hint: "Could you possibly là mức đề nghị rất lịch sự.",
        explanation:
          "“được không ạ” ở cuối câu là cách tiếng Việt diễn mức lịch sự mà “Could you possibly” tạo ra.",
      },
      {
        kind: "order",
        id: "st-l3-2",
        sentence: "Please note that refunds must be requested within fourteen days.",
        chunks: ["Xin lưu ý", "yêu cầu hoàn tiền phải được gửi", "trong vòng mười bốn ngày"],
        distractors: ["Xin hãy ghi chú rằng", "nên được gửi khi tiện"],
        hint: "must = bắt buộc, không phải “nên”.",
        explanation:
          "Please note that mở đầu một quy định. Vì có must nên vế sau phải giữ chữ “phải”.",
      },
      {
        kind: "order",
        id: "st-l3-3",
        sentence: "We regret to inform you that the position has been filled.",
        chunks: ["Chúng tôi rất tiếc phải báo rằng", "vị trí này đã có người nhận"],
        distractors: ["Chúng tôi hối tiếc thông tin bạn", "vị trí đã được lấp đầy"],
        hint: "We regret to inform you là công thức mở đầu tin xấu.",
        explanation:
          "has been filled = đã tuyển được người. Dịch “lấp đầy” là dịch mặt chữ của fill.",
      },
      {
        kind: "order",
        id: "st-l3-4",
        sentence: "Attendees are asked to silence their phones during the presentation.",
        chunks: ["Đề nghị người tham dự", "tắt chuông điện thoại", "trong lúc thuyết trình"],
        distractors: ["Người tham dự bị hỏi", "phải tắt hẳn máy"],
        hint: "are asked to = đề nghị; silence ≠ tắt máy.",
        explanation:
          "silence a phone là để chế độ im lặng, không phải tắt nguồn. Chi tiết nhỏ nhưng khác hẳn hành động.",
      },
      {
        kind: "order",
        id: "st-l3-5",
        sentence: "You are welcome to bring a guest to the reception.",
        chunks: ["Quý vị có thể đưa thêm một khách", "tới dự tiệc chiêu đãi"],
        distractors: ["Quý vị được chào đón để mà mang", "bắt buộc đi cùng một người"],
        hint: "be welcome to = được phép, thoải mái làm.",
        explanation:
          "You are welcome to là lời mời rộng rãi, không phải “được chào đón” theo nghĩa đen.",
      },
      {
        kind: "order",
        id: "st-l3-6",
        sentence: "I would suggest reviewing the contract with your legal team first.",
        chunks: ["Tôi nghĩ anh nên", "rà lại hợp đồng cùng bộ phận pháp chế", "trước đã"],
        distractors: ["Tôi sẽ gợi ý việc", "sau khi ký xong"],
        hint: "I would suggest là gợi ý mềm, không phải chỉ đạo.",
        explanation:
          "“I would suggest” dùng would để làm mềm. Tiếng Việt diễn bằng “Tôi nghĩ anh nên…”.",
      },
      {
        kind: "order",
        id: "st-l3-7",
        sentence: "Under no circumstances should the emergency exit be blocked.",
        chunks: ["Tuyệt đối không được", "để vật cản", "trước lối thoát hiểm"],
        distractors: ["Trong vài trường hợp thì", "có thể để tạm đồ"],
        hint: "Under no circumstances = tuyệt đối không, mức cấm mạnh nhất.",
        explanation:
          "Đây là đảo ngữ nhấn mạnh. Mức độ mạnh hơn cả “must not” — tiếng Việt dùng “tuyệt đối không”.",
      },
      {
        kind: "order",
        id: "st-l3-8",
        sentence: "Should you have any questions, please do not hesitate to contact me.",
        chunks: ["Nếu quý vị có thắc mắc gì,", "xin cứ liên hệ với tôi"],
        distractors: ["Quý vị nên có câu hỏi,", "đừng do dự một cách ngần ngại"],
        hint: "Should you… = Nếu quý vị… (đảo ngữ trang trọng).",
        explanation:
          "do not hesitate to contact me = xin cứ liên hệ. Dịch “đừng do dự” là dịch mặt chữ, nghe rất Tây.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "st-l4-1",
        sentence: "Staff must wear identification badges at all times; visitors should sign in at reception.",
        draft: "Nhân viên ___ đeo thẻ mọi lúc; khách ___ ký tên tại quầy lễ tân.",
        blanks: [
          { options: ["bắt buộc phải", "nên", "có thể"], correct: 0, note: "must = bắt buộc." },
          { options: ["nên", "bắt buộc phải", "được quyền"], correct: 0, note: "should = nên, nhẹ hơn must." },
        ],
        explanation:
          "Một câu dùng hai mức khác nhau có chủ đích: nhân viên bị ràng buộc chặt, khách thì nhẹ hơn. Dịch cào bằng là xoá mất sự phân biệt đó.",
      },
      {
        kind: "repair",
        id: "st-l4-2",
        sentence: "We are unable to offer a refund, but we would be happy to issue store credit.",
        draft: "Chúng tôi ___ hoàn tiền, nhưng ___ cấp phiếu mua hàng cho quý khách.",
        blanks: [
          {
            options: ["rất tiếc không thể", "sẽ không bao giờ", "chưa muốn"],
            correct: 0,
            note: "are unable to là lời từ chối lịch sự — cần chữ “rất tiếc” để giữ giọng.",
          },
          {
            options: ["rất sẵn lòng", "buộc phải", "có lẽ sẽ"],
            correct: 0,
            note: "would be happy to = rất sẵn lòng, thể hiện thiện chí bù đắp.",
          },
        ],
        explanation:
          "Cấu trúc “không thể X, nhưng sẵn lòng Y” là khuôn từ chối chuẩn. Hai nửa phải giữ đúng hai giọng: tiếc nuối và thiện chí.",
      },
      {
        kind: "repair",
        id: "st-l4-3",
        sentence: "Applicants must submit references; a portfolio may also be included.",
        draft: "Ứng viên ___ nộp thư giới thiệu; ngoài ra ___ gửi kèm portfolio.",
        blanks: [
          { options: ["phải", "nên", "được phép"], correct: 0, note: "must = bắt buộc." },
          {
            options: ["có thể", "bắt buộc", "không được"],
            correct: 0,
            note: "may = được phép, tuỳ chọn — đây là phần không bắt buộc.",
          },
        ],
        explanation:
          "Nhận ra đâu là mục bắt buộc, đâu là mục tuỳ chọn chính là thứ quyết định ứng viên chuẩn bị hồ sơ đúng hay thiếu.",
      },
      {
        kind: "repair",
        id: "st-l4-4",
        sentence: "I was wondering whether you might have time for a short call this week.",
        draft: "___ tuần này anh có ___ dành ít phút gọi điện trao đổi không ạ?",
        blanks: [
          {
            options: ["Không biết", "Tôi đã tự hỏi rằng", "Tôi muốn biết là"],
            correct: 0,
            note: "I was wondering whether là công thức mở lời rất lịch sự, tương đương “Không biết… có… không ạ”.",
          },
          {
            options: ["rảnh", "bắt buộc", "nhất định phải"],
            correct: 0,
            note: "might have time = có rảnh không, hoàn toàn để ngỏ.",
          },
        ],
        explanation:
          "Thì quá khứ “was wondering” ở đây không chỉ thời gian mà để làm mềm lời đề nghị — một đặc điểm rất Anh.",
      },
      {
        kind: "repair",
        id: "st-l4-5",
        sentence: "Guests are reminded that the pool closes at 9 P.M.",
        draft: "___ quý khách rằng hồ bơi đóng cửa lúc 9 giờ tối.",
        blanks: [
          {
            options: ["Xin nhắc", "Quý khách bị nhắc nhở", "Chúng tôi cảnh cáo"],
            correct: 0,
            note: "are reminded that = xin nhắc. Không phải cảnh cáo, cũng không dùng “bị”.",
          },
        ],
        explanation:
          "Bị động + reminded là công thức thông báo trung tính. Dịch thành “cảnh cáo” là làm khách sạn nghe như đang doạ khách.",
      },
      {
        kind: "repair",
        id: "st-l4-6",
        sentence: "It would be helpful if you could send the file in PDF format.",
        draft: "___ anh gửi file dạng PDF ___.",
        blanks: [
          {
            options: ["Nếu được", "Nó sẽ hữu ích nếu", "Anh bắt buộc phải"],
            correct: 0,
            note: "It would be helpful if là đề nghị mềm, tiếng Việt mở bằng “Nếu được”.",
          },
          {
            options: ["thì tốt quá", "thì mới nhận", "ngay bây giờ"],
            correct: 0,
            note: "Vế sau cần giữ giọng mong muốn nhẹ nhàng.",
          },
        ],
        explanation:
          "Khuôn “Nếu được… thì tốt quá” là cách tiếng Việt diễn đúng mức của It would be helpful if you could.",
      },
      {
        kind: "repair",
        id: "st-l4-7",
        sentence: "Payment is due upon receipt; late payments are subject to a 2% fee.",
        draft: "Thanh toán ___ khi nhận hoá đơn; thanh toán muộn ___ phí 2%.",
        blanks: [
          {
            options: ["phải thực hiện ngay", "có thể thực hiện", "nên được cân nhắc"],
            correct: 0,
            note: "due upon receipt = đến hạn ngay khi nhận, không có thời gian ân hạn.",
          },
          {
            options: ["sẽ bị tính thêm", "được miễn", "có lẽ phải chịu"],
            correct: 0,
            note: "are subject to = phải chịu, chắc chắn áp dụng chứ không phải có lẽ.",
          },
        ],
        explanation:
          "be subject to nghe mềm nhưng là điều khoản chắc chắn. Dịch thành “có lẽ” là làm khách hiểu nhầm mình có thể thoát phí.",
      },
      {
        kind: "repair",
        id: "st-l4-8",
        sentence: "Feel free to reach out if anything is unclear.",
        draft: "Có gì chưa rõ ___ nhé.",
        blanks: [
          {
            options: ["cứ nhắn tôi", "bạn được tự do vươn ra", "hãy cảm thấy tự do liên lạc"],
            correct: 0,
            note: "Feel free to reach out = cứ liên hệ thoải mái. Không dịch mặt chữ “free”.",
          },
        ],
        explanation:
          "Feel free to là câu kết thân thiện. Dịch mặt chữ sẽ ra câu buồn cười — mà đây lại là câu xuất hiện gần như trong mọi email.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "st-l5-1",
        source:
          "We would be grateful if you could forward the signed agreement at your earliest convenience.",
        model:
          "Mong quý vị chuyển giúp bản thoả thuận đã ký sớm nhất có thể.",
        focus:
          "would be grateful if = mức lịch sự cao; at your earliest convenience = sớm nhất có thể nhưng vẫn nhã nhặn. Đừng dịch thành mệnh lệnh.",
        keyPoints: ["mong/nhờ quý vị", "gửi bản thoả thuận đã ký", "sớm nhất có thể"],
      },
      {
        kind: "free",
        id: "st-l5-2",
        source:
          "Employees must record overtime hours daily; supervisors should verify the entries each week.",
        model:
          "Nhân viên phải ghi giờ làm thêm hằng ngày; người giám sát nên kiểm tra lại các mục ghi mỗi tuần.",
        focus:
          "Hai mức khác nhau trong một câu: must (bắt buộc) với nhân viên, should (nên) với giám sát. Phải giữ đúng khoảng cách giữa hai mức.",
        keyPoints: [
          "nhân viên phải ghi giờ làm thêm hằng ngày",
          "người giám sát nên kiểm tra lại",
          "mỗi tuần",
        ],
      },
      {
        kind: "free",
        id: "st-l5-3",
        source:
          "I am afraid we will not be able to meet the original deadline, though we should finish within an extra week.",
        model:
          "Rất tiếc, chúng tôi không kịp hạn ban đầu, nhưng chắc là chỉ cần thêm một tuần nữa là xong.",
        focus:
          "I am afraid = rất tiếc (báo tin xấu). “should finish” ở đây là dự đoán khá chắc, không phải “nên hoàn thành”.",
        keyPoints: [
          "rất tiếc không kịp hạn ban đầu",
          "nhưng dự kiến/chắc là",
          "thêm khoảng một tuần nữa là xong",
        ],
      },
      {
        kind: "free",
        id: "st-l5-4",
        source:
          "Under no circumstances may confidential files be stored on personal devices.",
        model:
          "Tuyệt đối không được lưu tài liệu mật trên thiết bị cá nhân.",
        focus:
          "Đảo ngữ Under no circumstances là mức cấm mạnh nhất. Chữ “may” ở đây là được phép, và cả câu là phủ định tuyệt đối.",
        keyPoints: ["tuyệt đối không được", "lưu tài liệu mật", "trên thiết bị cá nhân"],
      },
      {
        kind: "free",
        id: "st-l5-5",
        source:
          "You might want to arrive fifteen minutes early, as seating is limited and cannot be reserved.",
        model:
          "Anh nên tới sớm khoảng mười lăm phút, vì chỗ ngồi có hạn mà lại không đặt trước được.",
        focus:
          "might want to = lời khuyên nhẹ, không phải bắt buộc. Vế sau giải thích lý do nên giữ giọng thân thiện, không phải giọng quy định.",
        keyPoints: [
          "nên tới sớm khoảng 15 phút",
          "vì chỗ ngồi có hạn",
          "và không đặt trước được",
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
        id: "st-l6-1",
        source:
          "Dear Mr. Achebe,\n\nThank you for your patience. I am afraid the part you ordered is on back order and may not arrive until late June. You are of course welcome to cancel for a full refund. Alternatively, we would be happy to substitute a comparable model at no extra cost. Please let us know which you would prefer; if we do not hear from you within ten days, we will hold the order as is.",
        model:
          "Kính gửi ông Achebe,\n\nCảm ơn ông đã kiên nhẫn chờ. Rất tiếc, linh kiện ông đặt hiện đang hết hàng và có thể phải tới cuối tháng 6 mới về. Tất nhiên ông hoàn toàn có thể huỷ đơn và nhận lại đủ tiền. Hoặc nếu ông muốn, chúng tôi rất sẵn lòng đổi sang một mẫu tương đương mà không tính thêm phí. Xin ông cho biết muốn chọn phương án nào; nếu trong mười ngày không nhận được phản hồi, chúng tôi sẽ giữ nguyên đơn hàng.",
        focus:
          "Bốn mức tình thái nối nhau: I am afraid (báo tin xấu), may not (khả năng), are welcome to (được phép), would be happy to (sẵn lòng). Giữ đúng giọng thì thư mới ra vẻ dịch vụ tốt.",
        keyPoints: [
          "cảm ơn đã kiên nhẫn",
          "linh kiện hết hàng, có thể tới cuối tháng 6 mới về",
          "khách có thể huỷ và nhận đủ tiền",
          "hoặc đổi sang mẫu tương đương không mất thêm phí",
          "không phản hồi trong 10 ngày thì giữ nguyên đơn",
        ],
        comprehension: {
          question: "Nếu khách không trả lời trong mười ngày thì sao?",
          options: [
            "Đơn hàng bị huỷ và hoàn tiền.",
            "Đơn hàng được giữ nguyên, tiếp tục chờ linh kiện.",
            "Công ty tự đổi sang mẫu tương đương.",
          ],
          correct: 1,
          explanation:
            "“we will hold the order as is” — giữ nguyên, tức là vẫn chờ. Hai phương án kia đều cần khách chủ động chọn.",
        },
      },
      {
        kind: "free",
        id: "st-l6-2",
        source:
          "NOTICE — Building Access\n\nAll employees must carry their access badge while on the premises. Contractors should check in at the security desk each morning and are asked to return visitor passes before leaving. Under no circumstances should badges be shared. Anyone who loses a badge is advised to report it immediately; replacement badges may take up to three days.",
        model:
          "THÔNG BÁO — Ra vào toà nhà\n\nToàn bộ nhân viên bắt buộc phải mang theo thẻ ra vào khi ở trong khuôn viên. Nhà thầu nên đăng ký tại quầy bảo vệ vào mỗi buổi sáng, và xin trả lại thẻ khách trước khi ra về. Tuyệt đối không được cho người khác mượn thẻ. Ai làm mất thẻ nên báo ngay; thẻ cấp lại có thể mất tới ba ngày.",
        focus:
          "Năm mức khác nhau trong một thông báo: must (bắt buộc), should (nên), are asked to (đề nghị), Under no circumstances (tuyệt đối cấm), is advised to (nên). Dịch cào bằng thành “phải” hết là hỏng.",
        keyPoints: [
          "nhân viên bắt buộc mang thẻ khi ở trong khuôn viên",
          "nhà thầu nên đăng ký ở quầy bảo vệ mỗi sáng",
          "đề nghị trả thẻ khách trước khi về",
          "tuyệt đối không cho mượn thẻ",
          "mất thẻ nên báo ngay, cấp lại mất tới ba ngày",
        ],
        comprehension: {
          question: "Quy định nào trong thông báo là NGHIÊM NGẶT nhất?",
          options: [
            "Nhà thầu đăng ký ở quầy bảo vệ mỗi sáng.",
            "Không được cho người khác mượn thẻ.",
            "Báo ngay khi mất thẻ.",
          ],
          correct: 1,
          explanation:
            "“Under no circumstances” là mức cấm mạnh nhất trong tiếng Anh, trên cả must. Hai quy định kia chỉ ở mức should/is advised to.",
        },
      },
      {
        kind: "free",
        id: "st-l6-3",
        source:
          "Hello Priya,\n\nI was wondering whether you might be able to take on the Tavares account. I know your plate is already full, so please do not feel obliged. That said, you would be the ideal person for it, and I would be glad to move one of your current projects to Daniel if that helps. Let me know either way by Friday.",
        model:
          "Chào Priya,\n\nKhông biết chị có nhận thêm được khách hàng Tavares không. Tôi biết chị đang rất kín việc nên chị đừng thấy khó xử nhé. Nói vậy chứ chị đúng là người phù hợp nhất, và nếu cần thì tôi rất sẵn lòng chuyển một dự án hiện tại của chị sang cho Daniel. Nhận hay không chị cứ báo tôi trước thứ Sáu.",
        focus:
          "Đây là lời nhờ vả tế nhị giữa đồng nghiệp: I was wondering whether (mở lời rất nhẹ), do not feel obliged (không ép), That said (nhưng vẫn muốn), I would be glad to (đề nghị bù đắp). Sai giọng là thành ra ép người ta.",
        keyPoints: [
          "hỏi xem Priya có nhận thêm khách hàng Tavares được không",
          "biết chị đang kín việc nên đừng thấy bị ép",
          "nhưng chị là người phù hợp nhất",
          "sẵn sàng chuyển một dự án hiện tại sang cho Daniel",
          "báo lại trước thứ Sáu, nhận hay không cũng được",
        ],
        comprehension: {
          question: "Người viết muốn gì ở Priya?",
          options: [
            "Bắt buộc chị nhận thêm khách hàng mới.",
            "Mong chị nhận, nhưng để chị tự quyết và sẵn sàng san bớt việc.",
            "Chỉ thông báo rằng chị đã được phân công khách hàng này.",
          ],
          correct: 1,
          explanation:
            "“please do not feel obliged” và “That said, you would be the ideal person” đứng cạnh nhau: vừa để ngỏ vừa bày tỏ mong muốn. Dịch mất một trong hai vế là đọc sai quan hệ đồng nghiệp.",
        },
      },
    ],
  },
];
