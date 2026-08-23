import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 5 — BỊ ĐỘNG → ĐƯỢC / BỊ / CHỦ ĐỘNG
// "được" và "bị" mang sắc thái tốt–xấu nên KHÔNG phủ hết bị động tiếng Anh.
// Kỹ năng cốt lõi, hỏi 3 câu trước khi dịch:
//   1. Việc này tốt hay xấu với người/vật chịu tác động?
//   2. Có cần nêu người thực hiện không?
//   3. Tiếng Việt ở tình huống này có nói bị động thật không?
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const biDongLevels: TransLevel[] = [
  // ── L1 — Nhận diện cụm bị động ────────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "bd-l1-1",
        sentence: "Applicants will be notified by Friday.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["be", "notified"],
        explanation:
          "be + V3 = bị động. Ở đây “by Friday” là mốc thời gian, KHÔNG phải người thực hiện — đây là bẫy rất hay gặp.",
      },
      {
        kind: "highlight",
        id: "bd-l1-2",
        sentence: "The quarterly report was submitted last week.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["was", "submitted"],
        explanation:
          "was submitted — câu không nêu ai nộp, và tiếng Việt cũng không cần nêu: “Báo cáo quý đã được nộp tuần trước.”",
      },
      {
        kind: "highlight",
        id: "bd-l1-3",
        sentence: "All packages are inspected before shipping.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["are", "inspected"],
        explanation:
          "Bị động ở hiện tại đơn mô tả quy trình thường lệ. Tiếng Việt hay dịch chủ động: “Chúng tôi kiểm tra mọi kiện hàng trước khi gửi.”",
      },
      {
        kind: "highlight",
        id: "bd-l1-4",
        sentence: "The contract has been signed by both parties.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["has", "been", "signed"],
        explanation:
          "has been signed = bị động ở hiện tại hoàn thành. Ở câu này “by both parties” MỚI là người thực hiện thật.",
      },
      {
        kind: "highlight",
        id: "bd-l1-5",
        sentence: "Your request is being processed.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["is", "being", "processed"],
        explanation:
          "is being processed = đang được xử lý. Ba từ mới đủ một cụm — thiếu chữ “being” là mất ý đang diễn ra.",
      },
      {
        kind: "highlight",
        id: "bd-l1-6",
        sentence: "Employees are reminded to lock their computers.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["are", "reminded"],
        explanation:
          "are reminded là công thức thông báo nội bộ. Tiếng Việt nói thẳng: “Đề nghị nhân viên khoá máy tính.”",
      },
      {
        kind: "highlight",
        id: "bd-l1-7",
        sentence: "The conference room can be reserved online.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["be", "reserved"],
        explanation:
          "can be + V3 = có thể được. Dịch tự nhiên: “Có thể đặt phòng họp trực tuyến.”",
      },
      {
        kind: "highlight",
        id: "bd-l1-8",
        sentence: "Refunds will not be issued after thirty days.",
        instruction: "Bấm vào các từ tạo thành cụm ĐỘNG TỪ BỊ ĐỘNG:",
        correctWords: ["be", "issued"],
        explanation:
          "will not be issued = sẽ không hoàn. Tiếng Việt gọn hơn hẳn: “Sau ba mươi ngày, chúng tôi không hoàn tiền.”",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "bd-l2-1",
        sentence: "Applicants will be notified by Friday.",
        options: [
          "Ứng viên sẽ bị thông báo trước thứ Sáu.",
          "Chúng tôi sẽ thông báo cho ứng viên trước thứ Sáu.",
          "Ứng viên sẽ được thông báo bởi thứ Sáu.",
        ],
        correct: 1,
        optionNotes: [
          "“bị” mang sắc thái xấu — nhưng được báo kết quả là chuyện bình thường, thậm chí tốt.",
          "Đúng — chuyển sang chủ động, người thực hiện hiểu ngầm là bên tuyển dụng.",
          "Dịch “by” thành “bởi” trong khi đây là mốc thời gian, không phải tác nhân.",
        ],
        explanation:
          "Hai lỗi kinh điển trong một câu: chọn nhầm “bị”, và tưởng “by” lúc nào cũng là người thực hiện.",
      },
      {
        kind: "compare",
        id: "bd-l2-2",
        sentence: "The equipment was damaged during shipping.",
        options: [
          "Thiết bị đã được làm hỏng trong lúc vận chuyển.",
          "Thiết bị làm hỏng quá trình vận chuyển.",
          "Thiết bị bị hỏng trong quá trình vận chuyển.",
        ],
        correct: 2,
        optionNotes: [
          "“được làm hỏng” tự mâu thuẫn — hỏng là chuyện xấu, không dùng “được”.",
          "Đảo ngược vai: thiết bị thành thủ phạm.",
          "Đúng — việc xấu xảy đến với thiết bị nên dùng “bị”.",
        ],
        explanation:
          "Đây là câu duy nhất trong bài mà “bị” là lựa chọn ĐÚNG. Quy tắc: việc xấu → bị; việc tốt hoặc trung tính → được, hoặc bỏ hẳn bị động.",
      },
      {
        kind: "compare",
        id: "bd-l2-3",
        sentence: "Visitors are required to sign in at the front desk.",
        options: [
          "Khách tới liên hệ vui lòng ký tên tại quầy lễ tân.",
          "Khách được yêu cầu ký tên tại quầy lễ tân.",
          "Khách bị bắt buộc phải ký tên ở bàn phía trước.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — biển báo tiếng Việt nói thẳng bằng lời đề nghị, không dùng bị động.",
          "Không sai nghĩa nhưng là câu dịch: người Việt không viết biển báo kiểu này.",
          "“bị bắt buộc” quá nặng, và “front desk” là quầy lễ tân chứ không phải “bàn phía trước”.",
        ],
        explanation:
          "are required / are asked / are advised trong thông báo tiếng Anh tương đương “vui lòng / đề nghị” trong tiếng Việt.",
      },
      {
        kind: "compare",
        id: "bd-l2-4",
        sentence: "The proposal has been approved by the board.",
        options: [
          "Đề xuất đã bị duyệt bởi hội đồng.",
          "Hội đồng quản trị đã duyệt đề xuất.",
          "Đề xuất đã được duyệt bởi hội đồng quản trị.",
        ],
        correct: 1,
        optionNotes: [
          "“bị duyệt” sai sắc thái — được duyệt là tin vui.",
          "Đúng — đã có người thực hiện rõ ràng thì đưa họ lên làm chủ ngữ, câu gọn và tự nhiên.",
          "Không sai nghĩa, nhưng chữ “bởi” làm câu nặng; tiếng Việt ít dùng.",
        ],
        explanation:
          "Nguyên tắc: khi câu tiếng Anh nêu rõ “by + ai”, cách dịch tự nhiên nhất là ĐẢO sang chủ động.",
      },
      {
        kind: "compare",
        id: "bd-l2-5",
        sentence: "Your account will be charged on the first of each month.",
        options: [
          "Tài khoản của bạn sẽ bị sạc vào ngày đầu mỗi tháng.",
          "Tài khoản của quý khách sẽ được tính phí bởi ngày mùng một hằng tháng.",
          "Chúng tôi sẽ trừ tiền tài khoản của quý khách vào ngày mùng một hằng tháng.",
        ],
        correct: 2,
        optionNotes: [
          "charge ở đây là thu tiền, không phải sạc pin.",
          "Lại nhầm “on” thành tác nhân, và câu rất cứng.",
          "Đúng — chuyển chủ động, nêu rõ bên thu tiền là “chúng tôi”.",
        ],
        explanation:
          "Trong email dịch vụ, chuyển sang chủ động với chủ ngữ “chúng tôi” vừa tự nhiên vừa rõ trách nhiệm.",
      },
      {
        kind: "compare",
        id: "bd-l2-6",
        sentence: "Latecomers will not be admitted once the performance begins.",
        options: [
          "Khách tới muộn sẽ không được vào sau khi buổi diễn đã bắt đầu.",
          "Người đến trễ sẽ không bị thừa nhận khi buổi biểu diễn bắt đầu.",
          "Khách tới muộn sẽ không vào được một lần buổi diễn bắt đầu.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — “không được vào” là cách nói tự nhiên cho quy định này.",
          "admit ở đây là “cho vào”, không phải “thừa nhận”.",
          "Dịch “once” thành “một lần” — nó là liên từ “khi/sau khi”.",
        ],
        explanation:
          "Với quy định cấm, tiếng Việt dùng “không được + động từ” — vừa giữ bị động vừa nghe đúng giọng thông báo.",
      },
      {
        kind: "compare",
        id: "bd-l2-7",
        sentence: "The old ticketing system is being replaced this quarter.",
        options: [
          "Hệ thống bán vé cũ đang được thay thế bởi quý này.",
          "Quý này công ty đang thay hệ thống bán vé cũ.",
          "Hệ thống bán vé cũ đã thay thế trong quý này.",
        ],
        correct: 1,
        optionNotes: [
          "Lại thừa chữ “bởi” trước một mốc thời gian.",
          "Đúng — chủ động, gọn, và nêu được ai đang làm việc đó.",
          "Mất bị động nên đảo vai: hệ thống cũ thành kẻ đi thay thứ khác.",
        ],
        explanation:
          "Bản dịch bỏ mất bị động (“Hệ thống cũ đã thay thế…”) là nguy hiểm nhất: câu vẫn xuôi tai, nhưng ai làm gì đã bị đảo ngược hoàn toàn.",
      },
      {
        kind: "compare",
        id: "bd-l2-8",
        sentence: "Employees are advised to keep a copy for their records.",
        options: [
          "Nhân viên bị khuyên giữ một bản sao cho hồ sơ của họ.",
          "Nhân viên được tư vấn giữ lại bản sao cho các bản ghi.",
          "Nhân viên nên giữ lại một bản để lưu.",
        ],
        correct: 2,
        optionNotes: [
          "“bị khuyên” — tiếng Việt không nói vậy.",
          "advise ở đây không phải “tư vấn”, và “records” là hồ sơ lưu chứ không phải “bản ghi”.",
          "Đúng — are advised to = nên, gọn và đúng mức độ.",
        ],
        explanation:
          "are advised to = nên (khuyến nghị, không bắt buộc). Phân biệt với are required to = phải.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "bd-l3-1",
        sentence: "All applications must be submitted online.",
        chunks: ["Mọi hồ sơ đều phải nộp", "trực tuyến"],
        distractors: ["đều bị nộp", "bởi trên mạng"],
        hint: "Nộp hồ sơ là việc bình thường — không dùng “bị”.",
        explanation:
          "Tiếng Việt ở đây thậm chí không cần “được”: “phải nộp” đã đủ nghĩa bị động rồi.",
      },
      {
        kind: "order",
        id: "bd-l3-2",
        sentence: "Two shipments were delayed by the storm.",
        chunks: ["Hai lô hàng bị chậm", "do bão"],
        distractors: ["được chậm lại", "bởi cơn bão"],
        hint: "Chậm hàng là việc xấu; “by the storm” là nguyên nhân.",
        explanation:
          "Khi tác nhân là hiện tượng tự nhiên, tiếng Việt dùng “do/vì”, không dùng “bởi”.",
      },
      {
        kind: "order",
        id: "bd-l3-3",
        sentence: "The winner will be announced at the ceremony.",
        chunks: ["Người thắng giải sẽ được công bố", "tại buổi lễ"],
        distractors: ["sẽ bị công bố", "bởi buổi lễ"],
        hint: "Được xướng tên là việc vui.",
        explanation: "Việc tốt → “được”. Đây là trường hợp “được” dùng đúng chỗ nhất.",
      },
      {
        kind: "order",
        id: "bd-l3-4",
        sentence: "Guests are asked to keep noise to a minimum after 10 P.M.",
        chunks: ["Đề nghị quý khách giữ yên lặng", "sau 10 giờ tối"],
        distractors: ["Quý khách bị hỏi phải", "kể từ lúc 10 giờ tối"],
        hint: "are asked to trong nội quy = đề nghị.",
        explanation:
          "Nội quy khách sạn tiếng Việt luôn mở đầu bằng “Đề nghị/Vui lòng”, không bao giờ bằng bị động.",
      },
      {
        kind: "order",
        id: "bd-l3-5",
        sentence: "The invoice was issued by our accounting department.",
        chunks: ["Phòng kế toán của chúng tôi", "đã xuất hoá đơn này"],
        distractors: ["Hoá đơn đã bị xuất", "bởi phòng kế toán"],
        hint: "Có “by + ai” rõ ràng thì đảo sang chủ động.",
        explanation:
          "Đưa người thực hiện lên làm chủ ngữ là cách gọn nhất, và cũng là cách người Việt nói thật.",
      },
      {
        kind: "order",
        id: "bd-l3-6",
        sentence: "Your package could not be delivered because no one was home.",
        chunks: ["Kiện hàng của quý khách không giao được", "vì không có ai ở nhà"],
        distractors: ["đã bị giao nhầm", "bởi vì nhà trống"],
        hint: "could not be delivered = không giao được.",
        explanation:
          "“không + động từ + được” là khuôn tiếng Việt gọn nhất cho “could not be + V3”.",
      },
      {
        kind: "order",
        id: "bd-l3-7",
        sentence: "Meals are provided free of charge during the training week.",
        chunks: ["Trong tuần đào tạo", "học viên được phục vụ bữa ăn", "miễn phí"],
        distractors: ["bữa ăn bị cung cấp", "với giá không tính phí"],
        hint: "Được cho ăn miễn phí là quyền lợi.",
        explanation:
          "free of charge = miễn phí. Đưa người hưởng lợi lên làm chủ ngữ khiến câu tiếng Việt tự nhiên hơn hẳn.",
      },
      {
        kind: "order",
        id: "bd-l3-8",
        sentence: "The proposal was rejected without explanation.",
        chunks: ["Đề xuất đã bị bác", "mà không có lời giải thích nào"],
        distractors: ["đã được chấp nhận", "không cần giải thích"],
        hint: "Bị bác là việc xấu với bên đề xuất.",
        explanation:
          "Ở đây “bị” là bắt buộc: nó vừa đúng sắc thái xấu, vừa gợi được thái độ khó chịu của người viết.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "bd-l4-1",
        sentence: "Your order has been shipped and should arrive by Thursday.",
        draft: "Đơn hàng của quý khách ___ và dự kiến tới nơi ___ thứ Năm.",
        blanks: [
          {
            options: ["đã được gửi đi", "đã bị gửi đi", "đã gửi đi quý khách"],
            correct: 0,
            note: "Hàng được gửi là tin tốt → “được”.",
          },
          {
            options: ["trước", "vào đúng", "bởi"],
            correct: 0,
            note: "by Thursday = chậm nhất là thứ Năm.",
          },
        ],
        explanation:
          "Một câu, hai bẫy quen thuộc: chọn được/bị, và “by” là mốc thời gian chứ không phải tác nhân.",
      },
      {
        kind: "repair",
        id: "bd-l4-2",
        sentence: "Several files were deleted by mistake during the migration.",
        draft: "Một số tệp ___ xoá nhầm trong quá trình chuyển dữ liệu.",
        blanks: [
          {
            options: ["bị", "được", "đã tự"],
            correct: 0,
            note: "Mất dữ liệu là việc xấu → “bị”. Lưu ý “by mistake” là “do nhầm lẫn”, không phải tác nhân.",
          },
        ],
        explanation:
          "by mistake / by accident là trạng ngữ chỉ cách thức, đừng dịch thành “bởi một sai lầm”.",
      },
      {
        kind: "repair",
        id: "bd-l4-3",
        sentence: "Visitors are not permitted beyond this point without an escort.",
        draft: "Khách ___ đi quá điểm này nếu không có người đi cùng.",
        blanks: [
          {
            options: ["không được phép", "không bị cho phép", "chưa được ai cho"],
            correct: 0,
            note: "are not permitted = không được phép — khuôn chuẩn cho biển cấm.",
          },
        ],
        explanation:
          "“không được phép” vừa giữ bị động vừa đúng giọng biển báo. Đây là một trong số ít chỗ nên giữ nguyên bị động.",
      },
      {
        kind: "repair",
        id: "bd-l4-4",
        sentence: "The renovation costs will be covered by the building owner.",
        draft: "___ sẽ ___ chi phí cải tạo.",
        blanks: [
          {
            options: ["Chủ toà nhà", "Chi phí cải tạo", "Việc cải tạo"],
            correct: 0,
            note: "Có “by + người thực hiện” rõ ràng → đưa họ lên làm chủ ngữ.",
          },
          {
            options: ["chi trả", "được che phủ", "bị bao gồm"],
            correct: 0,
            note: "cover ở đây là chi trả, không phải che phủ.",
          },
        ],
        explanation:
          "Đảo sang chủ động thì phải đổi cả chủ ngữ lẫn động từ — làm nửa vời sẽ ra câu lai không đọc được.",
      },
      {
        kind: "repair",
        id: "bd-l4-5",
        sentence: "Membership fees are reviewed annually and may be adjusted.",
        draft: "Phí hội viên ___ hằng năm và ___ điều chỉnh.",
        blanks: [
          {
            options: ["được rà soát", "bị xem xét", "tự xem lại"],
            correct: 0,
            note: "Rà soát định kỳ là việc trung tính → “được”.",
          },
          {
            options: ["có thể được", "chắc chắn sẽ bị", "không thể"],
            correct: 0,
            note: "may = có thể, để ngỏ khả năng — không phải chắc chắn.",
          },
        ],
        explanation:
          "may be adjusted là câu rào đón: công ty giữ quyền tăng phí mà chưa hứa gì. Dịch thành “chắc chắn” là đọc sai ý định người viết.",
      },
      {
        kind: "repair",
        id: "bd-l4-6",
        sentence: "The seminar has been postponed until further notice.",
        draft: "Buổi hội thảo ___ hoãn ___.",
        blanks: [
          {
            options: ["đã bị", "đã được", "sẽ tự"],
            correct: 0,
            note: "Hoãn là chuyện bất lợi cho người tham dự → “bị”.",
          },
          {
            options: ["cho tới khi có thông báo mới", "đến khi được chú ý thêm", "vô thời hạn hoàn toàn"],
            correct: 0,
            note: "until further notice = cho tới khi có thông báo mới — vẫn còn tổ chức, chỉ chưa biết lúc nào.",
          },
        ],
        explanation:
          "until further notice không có nghĩa huỷ hẳn. Dịch thành “vô thời hạn” là làm tin nặng hơn thực tế.",
      },
      {
        kind: "repair",
        id: "bd-l4-7",
        sentence: "Damaged items must be reported within 48 hours of delivery.",
        draft: "___ phải ___ trong vòng 48 giờ kể từ khi nhận hàng.",
        blanks: [
          {
            options: ["Hàng bị hỏng", "Hàng được làm hỏng", "Hàng hỏng người"],
            correct: 0,
            note: "damaged items = hàng bị hỏng — việc xấu nên dùng “bị”.",
          },
          {
            options: ["báo lại cho chúng tôi", "bị báo cáo lại", "được tường trình"],
            correct: 0,
            note: "must be reported = phải báo. Người báo chính là khách, nên nói thẳng “báo lại cho chúng tôi”.",
          },
        ],
        explanation:
          "Cùng một câu có hai bị động: một cái giữ “bị” (hàng hỏng), một cái chuyển chủ động (khách báo). Không có công thức chung — phải xét từng chỗ.",
      },
      {
        kind: "repair",
        id: "bd-l4-8",
        sentence: "You will be contacted by a representative within two business days.",
        draft: "___ sẽ ___ trong vòng hai ngày làm việc.",
        blanks: [
          {
            options: ["Nhân viên của chúng tôi", "Quý khách", "Hai ngày làm việc"],
            correct: 0,
            note: "by a representative là người thực hiện thật → đưa lên làm chủ ngữ.",
          },
          {
            options: ["liên hệ với quý khách", "bị liên lạc bởi quý khách", "được quý khách gọi"],
            correct: 0,
            note: "Đảo chủ động thì chiều liên hệ cũng phải đúng: nhân viên gọi cho khách.",
          },
        ],
        explanation:
          "Khi đảo bị động sang chủ động, sai lầm hay gặp nhất là đảo luôn chiều hành động. Kiểm tra lại: ai gọi cho ai?",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "bd-l5-1",
        source:
          "All maintenance requests must be submitted through the online portal and will be reviewed within one business day.",
        model:
          "Mọi yêu cầu bảo trì đều phải gửi qua cổng trực tuyến và sẽ được xử lý trong vòng một ngày làm việc.",
        focus:
          "Hai bị động liền nhau: “must be submitted” dịch thành “phải gửi” (bỏ hẳn bị động), “will be reviewed” dịch “sẽ được xử lý”. Không cái nào dùng “bị”.",
        keyPoints: [
          "mọi yêu cầu bảo trì phải gửi qua cổng trực tuyến",
          "sẽ được xem xét/xử lý",
          "trong vòng một ngày làm việc",
        ],
      },
      {
        kind: "free",
        id: "bd-l5-2",
        source:
          "Three of the delivered cartons were found to be damaged, so a replacement shipment has been arranged.",
        model:
          "Ba thùng hàng giao tới bị hỏng, nên chúng tôi đã sắp xếp gửi lô hàng thay thế.",
        focus:
          "“were found to be damaged” → việc xấu, dùng “bị”. “has been arranged” → đảo sang chủ động với chủ ngữ “chúng tôi”.",
        keyPoints: [
          "ba thùng hàng bị hỏng",
          "nên/vì vậy",
          "đã sắp xếp gửi lô hàng thay thế",
        ],
      },
      {
        kind: "free",
        id: "bd-l5-3",
        source:
          "Parking permits are issued by the security office and may be revoked if the vehicle is left overnight.",
        model:
          "Thẻ gửi xe do phòng bảo vệ cấp, và sẽ bị thu hồi nếu xe để qua đêm.",
        focus:
          "“are issued by” có tác nhân rõ → dùng “do… cấp”. “may be revoked” là hậu quả xấu → “bị thu hồi”. Hai bị động, hai cách xử lý khác nhau.",
        keyPoints: [
          "thẻ gửi xe do phòng bảo vệ cấp",
          "có thể bị thu hồi",
          "nếu để xe qua đêm",
        ],
      },
      {
        kind: "free",
        id: "bd-l5-4",
        source:
          "Candidates who are not selected will be kept on file and may be contacted for future openings.",
        model:
          "Hồ sơ của những ứng viên chưa trúng tuyển sẽ được lưu lại, và chúng tôi có thể liên hệ khi có vị trí phù hợp trong tương lai.",
        focus:
          "“are not selected” = chưa trúng tuyển (nhẹ hơn “bị loại”). “may be contacted” đảo chủ động thành “chúng tôi có thể liên hệ” cho lịch sự.",
        keyPoints: [
          "ứng viên chưa trúng tuyển",
          "hồ sơ được lưu lại",
          "có thể được liên hệ khi có vị trí mới",
        ],
      },
      {
        kind: "free",
        id: "bd-l5-5",
        source:
          "The award was presented to Ms. Adeyemi, who was recognized for twenty years of service.",
        model:
          "Giải thưởng đã được trao cho bà Adeyemi để ghi nhận hai mươi năm cống hiến của bà.",
        focus:
          "Việc tốt → “được”. “was recognized for” đừng dịch máy thành “bị công nhận vì”, mà là “ghi nhận, tôn vinh”.",
        keyPoints: [
          "giải thưởng được trao cho bà Adeyemi",
          "ghi nhận/tôn vinh",
          "hai mươi năm cống hiến",
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
        id: "bd-l6-1",
        source:
          "NOTICE TO ALL STAFF\n\nBadge readers on the second floor will be upgraded this weekend. During the upgrade, doors on that floor will be propped open and a security guard will be stationed at the stairwell. Staff are reminded that laptops should not be left unattended while the doors are open. Normal access will be restored by Monday morning.",
        model:
          "THÔNG BÁO TỚI TOÀN THỂ NHÂN VIÊN\n\nHệ thống quẹt thẻ ở tầng 2 sẽ được nâng cấp vào cuối tuần này. Trong thời gian nâng cấp, các cửa ở tầng đó sẽ để mở và sẽ có bảo vệ túc trực ở cầu thang bộ. Đề nghị nhân viên không để máy tính xách tay không có người trông trong lúc cửa mở. Việc ra vào sẽ trở lại bình thường từ sáng thứ Hai.",
        focus:
          "Bốn bị động, mỗi cái xử lý một kiểu: will be upgraded (được nâng cấp), will be propped open (để mở), will be stationed (có bảo vệ túc trực), are reminded (đề nghị). Không cái nào dùng “bị”.",
        keyPoints: [
          "hệ thống quẹt thẻ tầng 2 được nâng cấp cuối tuần",
          "trong lúc đó cửa để mở",
          "có bảo vệ túc trực ở cầu thang",
          "đề nghị không để laptop không người trông",
          "ra vào bình thường lại từ sáng thứ Hai",
        ],
        comprehension: {
          question: "Vì sao thông báo nhắc nhân viên trông chừng máy tính?",
          options: [
            "Vì bảo vệ sẽ không có mặt trong thời gian nâng cấp.",
            "Vì cửa tầng 2 để mở nên ai cũng vào được.",
            "Vì máy tính có thể bị hỏng khi hệ thống nâng cấp.",
          ],
          correct: 1,
          explanation:
            "Nguyên nhân nằm ở chi tiết “doors will be propped open”. Bảo vệ vẫn có mặt, và việc nâng cấp không liên quan gì tới máy tính cá nhân.",
        },
      },
      {
        kind: "free",
        id: "bd-l6-2",
        source:
          "Dear Mr. Osei,\n\nYour warranty claim has been received and assigned to a technician. Unfortunately, the model you own was discontinued in 2023, and replacement screens are no longer manufactured. You will therefore be offered a store credit equal to the current value of the device. If this is acceptable, no further action is needed on your part.",
        model:
          "Kính gửi ông Osei,\n\nChúng tôi đã nhận được yêu cầu bảo hành của ông và đã chuyển cho kỹ thuật viên phụ trách. Rất tiếc, dòng máy ông đang dùng đã ngừng sản xuất từ năm 2023 và màn hình thay thế cũng không còn được sản xuất nữa. Vì vậy, chúng tôi xin đề xuất cấp cho ông một khoản tín dụng mua hàng tương đương giá trị hiện tại của thiết bị. Nếu ông đồng ý với phương án này thì không cần làm gì thêm.",
        focus:
          "Chuỗi bị động dày đặc; phần lớn nên đảo sang chủ động với “chúng tôi”. Chú ý “will be offered” là đề nghị chứ không phải áp đặt, và câu cuối là trấn an.",
        keyPoints: [
          "đã nhận yêu cầu bảo hành và giao cho kỹ thuật viên",
          "dòng máy đã ngừng sản xuất từ 2023",
          "màn hình thay thế không còn sản xuất",
          "sẽ được cấp tín dụng mua hàng bằng giá trị hiện tại của máy",
          "nếu đồng ý thì không cần làm gì thêm",
        ],
        comprehension: {
          question: "Khách hàng cần làm gì nếu chấp nhận phương án của công ty?",
          options: [
            "Gửi thiết bị về trung tâm bảo hành.",
            "Không cần làm gì cả.",
            "Xác nhận lại bằng email trong vòng 30 ngày.",
          ],
          correct: 1,
          explanation:
            "“no further action is needed on your part” — công thức bị động này luôn có nghĩa: bạn khỏi làm gì. Nhưng vì nó nằm ở câu cuối nên rất hay bị đọc lướt.",
        },
      },
      {
        kind: "free",
        id: "bd-l6-3",
        source:
          "Following last month's inspection, two of our storage units were found to be out of compliance. The issues have since been corrected and the units were re-inspected on the 14th. No penalty was assessed, but the inspector noted that our logbook had not been updated regularly. Going forward, entries must be signed by a supervisor at the end of each shift.",
        model:
          "Sau đợt kiểm tra tháng trước, hai kho chứa của chúng ta bị đánh giá là chưa đạt chuẩn. Các vấn đề đó đã được khắc phục và hai kho được kiểm tra lại vào ngày 14. Chúng ta không bị phạt, nhưng đoàn kiểm tra có lưu ý rằng sổ nhật ký chưa được cập nhật đều đặn. Từ nay, mỗi ca làm việc kết thúc thì các mục ghi chép phải có chữ ký của người giám sát.",
        focus:
          "Sáu bị động trong một đoạn ngắn. Việc xấu (out of compliance) dùng “bị”; việc đã sửa dùng “được”; “no penalty was assessed” đảo thành “không bị phạt”; câu cuối là quy định mới.",
        keyPoints: [
          "sau đợt kiểm tra tháng trước, hai kho không đạt chuẩn",
          "các vấn đề đã được khắc phục",
          "hai kho được kiểm tra lại ngày 14",
          "không bị phạt",
          "nhưng sổ nhật ký chưa được cập nhật đều",
          "từ nay mỗi ca phải có chữ ký người giám sát",
        ],
        comprehension: {
          question: "Kết quả của đợt kiểm tra là gì?",
          options: [
            "Công ty bị phạt và phải khắc phục trong 30 ngày.",
            "Không bị phạt, nhưng bị nhắc nhở về việc ghi sổ.",
            "Hai kho chứa bị đóng cửa cho tới khi đạt chuẩn.",
          ],
          correct: 1,
          explanation:
            "“No penalty was assessed, but…” — chữ “but” chia đoạn văn làm hai nửa tin. Bỏ qua nửa sau là trả lời thiếu.",
        },
      },
    ],
  },
];
