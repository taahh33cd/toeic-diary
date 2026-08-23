import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 7 — DANH TỪ HOÁ → ĐỘNG TỪ HOÁ
// Văn phong công sở tiếng Anh dồn hành động vào DANH TỪ trừu tượng
// (implementation, cancellation, submission…). Giữ nguyên khi dịch
// là ra câu Việt khô cứng kiểu "sự thực thi của...".
// Kỹ năng cốt lõi: trả danh từ trừu tượng về ĐỘNG TỪ, dùng "việc/khi/sau khi".
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const danhTuHoaLevels: TransLevel[] = [
  // ── L1 — Nhận diện danh từ trừu tượng ─────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "dth-l1-1",
        sentence: "The implementation of the new system caused a two-day delay.",
        instruction: "Bấm vào DANH TỪ đang chứa một hành động (cần trả về động từ khi dịch):",
        correctWords: ["implementation"],
        explanation:
          "implementation chứa hành động “triển khai”. Dịch: “Việc triển khai hệ thống mới làm chậm hai ngày.”",
      },
      {
        kind: "highlight",
        id: "dth-l1-2",
        sentence: "Cancellation of the order requires written notice.",
        instruction: "Bấm vào DANH TỪ đang chứa một hành động:",
        correctWords: ["Cancellation"],
        explanation:
          "Cancellation → huỷ. Dịch: “Muốn huỷ đơn hàng thì phải báo bằng văn bản.”",
      },
      {
        kind: "highlight",
        id: "dth-l1-3",
        sentence: "Submission of receipts is required for reimbursement.",
        instruction: "Bấm vào HAI danh từ đang chứa hành động:",
        correctWords: ["Submission", "reimbursement"],
        explanation:
          "Cả hai đều là hành động: nộp và hoàn ứng. Dịch: “Muốn được hoàn tiền thì phải nộp hoá đơn.”",
      },
      {
        kind: "highlight",
        id: "dth-l1-4",
        sentence: "Completion of the renovation is expected in March.",
        instruction: "Bấm vào DANH TỪ đang chứa một hành động:",
        correctWords: ["Completion"],
        explanation:
          "Completion → hoàn thành. Dịch: “Dự kiến việc cải tạo sẽ xong vào tháng 3.”",
      },
      {
        kind: "highlight",
        id: "dth-l1-5",
        sentence: "The expansion into Southeast Asia began after board approval.",
        instruction: "Bấm vào HAI danh từ đang chứa hành động:",
        correctWords: ["expansion", "approval"],
        explanation:
          "expansion → mở rộng; approval → phê duyệt. Dịch: “Sau khi hội đồng phê duyệt, công ty bắt đầu mở rộng sang Đông Nam Á.”",
      },
      {
        kind: "highlight",
        id: "dth-l1-6",
        sentence: "Installation of the software takes about thirty minutes.",
        instruction: "Bấm vào DANH TỪ đang chứa một hành động:",
        correctWords: ["Installation"],
        explanation: "Installation → cài đặt. Dịch: “Cài phần mềm này mất khoảng ba mươi phút.”",
      },
      {
        kind: "highlight",
        id: "dth-l1-7",
        sentence: "A reduction in shipping costs led to an increase in profit.",
        instruction: "Bấm vào HAI danh từ đang chứa hành động:",
        correctWords: ["reduction", "increase"],
        explanation:
          "Hai danh từ hoá trong một câu. Dịch: “Chi phí vận chuyển giảm nên lợi nhuận tăng.”",
      },
      {
        kind: "highlight",
        id: "dth-l1-8",
        sentence: "Verification of your identity is needed before activation.",
        instruction: "Bấm vào HAI danh từ đang chứa hành động:",
        correctWords: ["Verification", "activation"],
        explanation:
          "Dịch: “Quý khách phải xác minh danh tính trước khi kích hoạt.” — hai danh từ thành hai động từ.",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "dth-l2-1",
        sentence: "The implementation of the new system caused a two-day delay.",
        options: [
          "Sự thực thi của hệ thống mới đã gây ra một sự trì hoãn hai ngày.",
          "Việc triển khai hệ thống mới làm chậm tiến độ hai ngày.",
          "Hệ thống mới đã thực thi và gây trì hoãn trong hai ngày.",
        ],
        correct: 1,
        optionNotes: [
          "Ba lần “sự/của” trong một câu — đây chính là giọng dịch máy.",
          "Đúng — danh từ hoá trả về động từ, “việc” thay cho “sự… của…”.",
          "Đảo vai: hệ thống thành chủ thể thực thi, trong khi thực ra người ta triển khai nó.",
        ],
        explanation:
          "Quy tắc gọn: “the X of Y” với X là hành động thì dịch thành “việc + động từ + Y”, đừng dịch thành “sự X của Y”.",
      },
      {
        kind: "compare",
        id: "dth-l2-2",
        sentence: "Cancellation of the reservation requires forty-eight hours' notice.",
        options: [
          "Sự huỷ bỏ của đặt chỗ đòi hỏi một thông báo bốn mươi tám giờ.",
          "Việc đặt chỗ bị huỷ cần báo trước bốn mươi tám giờ.",
          "Muốn huỷ đặt chỗ, quý khách phải báo trước bốn mươi tám giờ.",
        ],
        correct: 2,
        optionNotes: [
          "Câu dịch máy điển hình.",
          "Đảo vai: thành ra khách sạn huỷ chứ không phải khách huỷ.",
          "Đúng — chuyển thành câu có chủ ngữ rõ ràng, giọng đúng kiểu điều khoản dịch vụ.",
        ],
        explanation:
          "Với điều khoản, khuôn “Muốn + động từ, thì phải…” vừa gọn vừa nói rõ ai làm gì — điều mà danh từ hoá cố tình giấu đi.",
      },
      {
        kind: "compare",
        id: "dth-l2-3",
        sentence: "Approval from the department head is required prior to purchase.",
        options: [
          "Sự phê duyệt từ trưởng bộ phận là được yêu cầu trước sự mua hàng.",
          "Phải có trưởng bộ phận duyệt trước khi mua.",
          "Trưởng bộ phận được yêu cầu phê duyệt trước khi mua hàng.",
        ],
        correct: 1,
        optionNotes: [
          "Giữ nguyên cả ba danh từ hoá — câu không đọc được.",
          "Đúng — gọn, rõ ai duyệt, rõ thứ tự trước sau.",
          "Đảo vai: thành ra trưởng bộ phận là người bị yêu cầu, trong khi thực ra người mua mới là bên phải đi xin duyệt.",
        ],
        explanation:
          "Danh từ hoá hay giấu chủ thể. Khi dịch, việc đầu tiên là hỏi: AI làm hành động này? Trả lời sai là đảo vai, biến trưởng bộ phận thành người bị yêu cầu.",
      },
      {
        kind: "compare",
        id: "dth-l2-4",
        sentence: "The decline in attendance prompted a review of the schedule.",
        options: [
          "Sự suy giảm trong tham dự đã thúc đẩy một sự xem xét của lịch trình.",
          "Số người tham dự giảm nên công ty phải xem lại lịch.",
          "Việc xem lại lịch đã làm giảm số người tham dự.",
        ],
        correct: 1,
        optionNotes: [
          "Bốn danh từ hoá giữ nguyên — không ai nói tiếng Việt như vậy.",
          "Đúng — hai danh từ hoá thành hai vế câu, nối bằng “nên” để giữ quan hệ nhân quả.",
          "Đảo ngược nhân quả hoàn toàn.",
        ],
        explanation:
          "Khi có hai danh từ hoá nối bằng prompted/led to/resulted in, tiếng Việt tách thành hai vế và nối bằng “nên / khiến / dẫn tới”.",
      },
      {
        kind: "compare",
        id: "dth-l2-5",
        sentence: "Upon receipt of your payment, we will begin processing the order.",
        options: [
          "Trên sự nhận của thanh toán, chúng tôi sẽ bắt đầu sự xử lý đơn hàng.",
          "Ngay khi nhận được thanh toán, chúng tôi sẽ bắt đầu xử lý đơn hàng.",
          "Chúng tôi sẽ nhận thanh toán rồi xử lý đơn hàng.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ “upon” thành “trên”.",
          "Đúng — “Upon + danh từ hoá” chuyển thành “Ngay khi + động từ”.",
          "Mất chữ “ngay” nên mất luôn ý cam kết xử lý nhanh.",
        ],
        explanation:
          "Upon / On + danh từ hoá là công thức trang trọng rất hay gặp: Upon receipt (khi nhận được), Upon arrival (khi tới nơi), Upon approval (sau khi được duyệt).",
      },
      {
        kind: "compare",
        id: "dth-l2-6",
        sentence: "There has been a significant improvement in delivery times.",
        options: [
          "Đã có một sự cải thiện đáng kể trong các thời gian giao hàng.",
          "Thời gian giao hàng đã cải thiện đáng kể.",
          "Đã có một sự giao hàng đáng kể được cải thiện.",
        ],
        correct: 1,
        optionNotes: [
          "“Đã có một sự…” là dấu hiệu rõ nhất của câu dịch máy.",
          "Đúng — bỏ hẳn “there has been”, cho danh từ hoá làm động từ chính.",
          "Câu vỡ nghĩa.",
        ],
        explanation:
          "“There has been a/an + danh từ hoá” gần như luôn dịch được thành một câu đơn giản: chủ ngữ + động từ.",
      },
      {
        kind: "compare",
        id: "dth-l2-7",
        sentence: "Failure to return the equipment may result in a replacement charge.",
        options: [
          "Sự thất bại trong việc trả lại thiết bị có thể dẫn tới một khoản phí thay thế.",
          "Nếu không trả lại thiết bị, quý khách có thể phải trả phí mua mới.",
          "Thiết bị hỏng không trả được sẽ bị tính phí thay thế.",
        ],
        correct: 1,
        optionNotes: [
          "“Sự thất bại trong việc” là cách dịch failure to sai hẳn sắc thái — đây không phải chuyện thất bại.",
          "Đúng — Failure to + V = Nếu không + V.",
          "Thêm chi tiết không có trong câu gốc (thiết bị hỏng).",
        ],
        explanation:
          "Failure to + động từ là công thức pháp lý = “nếu không…”. Đây là một trong những chỗ dịch sai gây hiểu lầm nặng nhất.",
      },
      {
        kind: "compare",
        id: "dth-l2-8",
        sentence: "The board's decision to postpone the merger surprised many analysts.",
        options: [
          "Quyết định của hội đồng về sự trì hoãn của vụ sáp nhập đã làm ngạc nhiên nhiều nhà phân tích.",
          "Việc hội đồng quyết định hoãn vụ sáp nhập khiến nhiều nhà phân tích bất ngờ.",
          "Hội đồng bất ngờ khi nhiều nhà phân tích hoãn vụ sáp nhập.",
        ],
        correct: 1,
        optionNotes: [
          "Ba tầng “của” chồng nhau.",
          "Đúng — “decision to + V” trả về thành “quyết định + động từ”, và cả cụm thành một vế.",
          "Đảo vai hoàn toàn: ai hoãn, ai bất ngờ đều bị đổi chỗ.",
        ],
        explanation:
          "Danh từ hoá kèm sở hữu cách (the board's decision) là chỗ hay đảo vai nhất. Kiểm lại: chủ thể của hành động là hội đồng.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "dth-l3-1",
        sentence: "Installation of the new server took less than an hour.",
        chunks: ["Việc lắp đặt máy chủ mới", "mất chưa tới một tiếng"],
        distractors: ["Sự cài đặt của máy chủ", "đã lấy ít hơn một giờ"],
        hint: "Installation → lắp đặt (động từ).",
        explanation: "took less than an hour = mất chưa tới một tiếng, không phải “lấy ít hơn”.",
      },
      {
        kind: "order",
        id: "dth-l3-2",
        sentence: "Upon completion of the training, participants receive a certificate.",
        chunks: ["Sau khi hoàn thành khoá đào tạo,", "học viên được cấp chứng chỉ"],
        distractors: ["Trên sự hoàn thành của,", "người tham gia nhận một sự chứng nhận"],
        hint: "Upon completion of = Sau khi hoàn thành.",
        explanation:
          "certificate là tờ chứng chỉ (vật), khác certification là việc cấp chứng chỉ (hành động).",
      },
      {
        kind: "order",
        id: "dth-l3-3",
        sentence: "A reduction in staff turnover has saved the company money.",
        chunks: ["Tỷ lệ nhân viên nghỉ việc giảm", "đã giúp công ty tiết kiệm chi phí"],
        distractors: ["Một sự giảm trong sự luân chuyển nhân sự", "đã cứu tiền của công ty"],
        hint: "staff turnover = tỷ lệ nhân viên nghỉ việc.",
        explanation:
          "save money ở đây là tiết kiệm chi phí, không phải “cứu tiền”. turnover trong nhân sự là tỷ lệ nghỉ việc, không phải doanh thu.",
      },
      {
        kind: "order",
        id: "dth-l3-4",
        sentence: "Failure to attend the orientation will delay your start date.",
        chunks: ["Nếu không dự buổi định hướng,", "ngày bắt đầu làm việc của bạn", "sẽ bị lùi lại"],
        distractors: ["Sự thất bại tham dự,", "sẽ bị trì hoãn một cách chậm trễ"],
        hint: "Failure to + V = Nếu không + V.",
        explanation:
          "start date trong tuyển dụng là ngày bắt đầu đi làm — một cụm cố định của hợp đồng lao động.",
      },
      {
        kind: "order",
        id: "dth-l3-5",
        sentence: "The expansion of our delivery area begins next quarter.",
        chunks: ["Từ quý sau,", "chúng tôi bắt đầu mở rộng", "phạm vi giao hàng"],
        distractors: ["Sự mở rộng của khu vực,", "sẽ được bắt đầu bởi quý sau"],
        hint: "expansion → mở rộng, và cần một chủ ngữ rõ ràng.",
        explanation:
          "Danh từ hoá giấu chủ thể; tiếng Việt thêm “chúng tôi” vào cho câu có người thực hiện.",
      },
      {
        kind: "order",
        id: "dth-l3-6",
        sentence: "Verification of employment may take up to five days.",
        chunks: ["Việc xác minh thông tin việc làm", "có thể mất tới năm ngày"],
        distractors: ["Sự thẩm tra của sự tuyển dụng", "sẽ lấy lên tới năm ngày"],
        hint: "Verification → xác minh; take up to = mất tối đa.",
        explanation:
          "up to five days = tối đa năm ngày, có thể ít hơn — đừng dịch thành “tận năm ngày”.",
      },
      {
        kind: "order",
        id: "dth-l3-7",
        sentence: "Submission of the final report is due on the 15th.",
        chunks: ["Hạn nộp báo cáo cuối kỳ", "là ngày 15"],
        distractors: ["Sự đệ trình của bản báo cáo", "đến hạn vào ngày thứ 15"],
        hint: "Submission… is due → gộp thành “hạn nộp”.",
        explanation:
          "“the 15th” là ngày 15 trong tháng, không phải “ngày thứ 15” tính từ đâu đó.",
      },
      {
        kind: "order",
        id: "dth-l3-8",
        sentence: "Their refusal to sign the agreement ended the negotiation.",
        chunks: ["Việc họ từ chối ký thoả thuận", "đã chấm dứt cuộc đàm phán"],
        distractors: ["Sự khước từ của họ đối với", "đã kết liễu sự thương lượng"],
        hint: "refusal to + V → “việc… từ chối + V”.",
        explanation:
          "Danh từ hoá kèm sở hữu (their refusal) chuyển thành “việc họ + động từ” — giữ được cả chủ thể lẫn hành động.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "dth-l4-1",
        sentence: "The introduction of the loyalty program increased repeat purchases by 18%.",
        draft: "___ đã làm tăng 18% lượng khách mua lại.",
        blanks: [
          {
            options: [
              "Việc ra mắt chương trình khách hàng thân thiết",
              "Sự giới thiệu của chương trình lòng trung thành",
              "Chương trình đã tự giới thiệu bản thân",
            ],
            correct: 0,
            note: "introduction ở đây là “ra mắt, triển khai”, và loyalty program là cụm cố định = chương trình khách hàng thân thiết.",
          },
        ],
        explanation:
          "Hai bẫy chồng nhau: danh từ hoá cần trả về động từ, và loyalty program là thuật ngữ chứ không dịch từng chữ.",
      },
      {
        kind: "repair",
        id: "dth-l4-2",
        sentence: "Modification of the contract requires written consent from both parties.",
        draft: "___ hợp đồng thì phải có ___ của cả hai bên.",
        blanks: [
          {
            options: ["Muốn sửa đổi", "Sự sửa đổi của", "Được sửa đổi"],
            correct: 0,
            note: "Điều khoản hợp đồng: khuôn “Muốn + động từ… thì phải…” là tự nhiên nhất.",
          },
          {
            options: ["văn bản đồng ý", "sự cho phép bằng chữ", "lời nói đồng thuận"],
            correct: 0,
            note: "written consent = sự đồng ý bằng văn bản — nhấn mạnh phải có giấy tờ.",
          },
        ],
        explanation:
          "Chữ “written” quan trọng về pháp lý: đồng ý miệng không có giá trị. Bỏ mất nó là mất điều kiện then chốt.",
      },
      {
        kind: "repair",
        id: "dth-l4-3",
        sentence: "There was no explanation for the sudden change in policy.",
        draft: "Không ai ___ vì sao chính sách ___.",
        blanks: [
          {
            options: ["giải thích", "có một sự giải thích", "được giải thích"],
            correct: 0,
            note: "“There was no explanation” → “không ai giải thích” là cách nói tự nhiên của tiếng Việt.",
          },
          {
            options: ["đột ngột thay đổi", "có một sự thay đổi đột ngột", "bị thay đổi bởi đột ngột"],
            correct: 0,
            note: "the sudden change in policy → “chính sách đột ngột thay đổi”.",
          },
        ],
        explanation:
          "Hai danh từ hoá trong một câu ngắn. Trả cả hai về động từ thì câu tiếng Việt còn đúng một dòng.",
      },
      {
        kind: "repair",
        id: "dth-l4-4",
        sentence: "Enrollment in the health plan closes at the end of this month.",
        draft: "___ bảo hiểm sức khoẻ ___ cuối tháng này.",
        blanks: [
          {
            options: ["Việc đăng ký", "Sự ghi danh của", "Số người tham gia"],
            correct: 0,
            note: "Enrollment → đăng ký (hành động), không phải số lượng người.",
          },
          {
            options: ["sẽ kết thúc vào", "sẽ đóng lại bởi", "bị khoá tại"],
            correct: 0,
            note: "closes ở đây là hết hạn đăng ký.",
          },
        ],
        explanation:
          "Cùng chữ enrollment nhưng “enrollment is low” lại là số lượng người ghi danh. Ngữ cảnh quyết định.",
      },
      {
        kind: "repair",
        id: "dth-l4-5",
        sentence: "Repeated cancellation of appointments may result in a fee.",
        draft: "___ có thể ___ phí.",
        blanks: [
          {
            options: [
              "Huỷ lịch hẹn nhiều lần",
              "Sự huỷ bỏ lặp lại của các cuộc hẹn",
              "Lịch hẹn bị huỷ lặp đi lặp lại",
            ],
            correct: 0,
            note: "Repeated cancellation → “huỷ… nhiều lần”, tính từ repeated thành trạng ngữ.",
          },
          {
            options: ["bị tính", "dẫn tới một kết quả của", "được nhận"],
            correct: 0,
            note: "may result in a fee = có thể bị tính phí.",
          },
        ],
        explanation:
          "Tính từ đứng trước danh từ hoá (repeated, significant, sudden) thường thành TRẠNG NGỮ khi danh từ đó trở lại làm động từ.",
      },
      {
        kind: "repair",
        id: "dth-l4-6",
        sentence: "Our recommendation is a gradual rollout across three regions.",
        draft: "Chúng tôi ___ triển khai ___ ở ba khu vực.",
        blanks: [
          {
            options: ["đề xuất", "có một sự đề xuất là", "được đề xuất"],
            correct: 0,
            note: "“Our recommendation is…” → “Chúng tôi đề xuất…”.",
          },
          {
            options: ["từng bước", "một cách dần dần của", "chậm rãi hoá"],
            correct: 0,
            note: "gradual rollout = triển khai theo từng bước/từng giai đoạn.",
          },
        ],
        explanation:
          "Câu “Our + danh từ hoá + is…” trong báo cáo tư vấn gần như luôn dịch được thành “Chúng tôi + động từ…”.",
      },
      {
        kind: "repair",
        id: "dth-l4-7",
        sentence: "Delivery of oversized items requires advance arrangement with the carrier.",
        draft: "___ hàng quá khổ thì phải ___ với đơn vị vận chuyển.",
        blanks: [
          {
            options: ["Muốn giao", "Sự giao hàng của", "Được giao"],
            correct: 0,
            note: "Delivery → giao (động từ); khuôn “Muốn… thì phải…”.",
          },
          {
            options: ["thu xếp trước", "sắp đặt tiến bộ", "có một sự chuẩn bị"],
            correct: 0,
            note: "advance arrangement = thu xếp/hẹn trước. advance ở đây là “trước”, không phải “tiên tiến”.",
          },
        ],
        explanation:
          "advance là từ đa nghĩa: in advance (trước), advance payment (trả trước), advanced course (nâng cao). Chú ý cả chữ “-d”.",
      },
      {
        kind: "repair",
        id: "dth-l4-8",
        sentence: "The absence of a signature invalidates the form.",
        draft: "___ chữ ký thì ___.",
        blanks: [
          {
            options: ["Thiếu", "Sự vắng mặt của", "Không có sự tồn tại của"],
            correct: 0,
            note: "The absence of → “thiếu / không có”.",
          },
          {
            options: ["biểu mẫu không có giá trị", "biểu mẫu bị làm sai", "biểu mẫu bị mất hiệu quả"],
            correct: 0,
            note: "invalidate = làm mất hiệu lực, tức là tờ đơn không có giá trị.",
          },
        ],
        explanation:
          "“The absence of X” là công thức trang trọng, tiếng Việt chỉ cần một chữ “thiếu” là đủ và tự nhiên hơn hẳn.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "dth-l5-1",
        source:
          "The postponement of the product launch was due to a delay in component delivery.",
        model:
          "Buổi ra mắt sản phẩm bị hoãn vì linh kiện giao chậm.",
        focus:
          "Hai danh từ hoá (postponement, delay) trả về động từ. Câu tiếng Việt ngắn hơn bản gốc rất nhiều — đó là dấu hiệu dịch đúng.",
        keyPoints: ["buổi ra mắt sản phẩm bị hoãn", "vì/do", "linh kiện giao chậm"],
      },
      {
        kind: "free",
        id: "dth-l5-2",
        source:
          "Upon approval of your application, you will receive confirmation by email within two days.",
        model:
          "Sau khi hồ sơ của quý vị được duyệt, chúng tôi sẽ gửi email xác nhận trong vòng hai ngày.",
        focus:
          "Upon approval of → “Sau khi… được duyệt”. confirmation trả về động từ “xác nhận”. Đổi luôn sang chủ động cho tự nhiên.",
        keyPoints: [
          "sau khi hồ sơ được duyệt",
          "sẽ nhận được email xác nhận",
          "trong vòng hai ngày",
        ],
      },
      {
        kind: "free",
        id: "dth-l5-3",
        source:
          "Failure to provide proof of purchase will result in denial of the warranty claim.",
        model:
          "Nếu không xuất trình được chứng từ mua hàng, yêu cầu bảo hành sẽ bị từ chối.",
        focus:
          "Failure to + V = Nếu không + V. denial trả về động từ “từ chối”. Đây là giọng điều khoản, phải giữ được sự dứt khoát.",
        keyPoints: [
          "nếu không xuất trình chứng từ mua hàng",
          "yêu cầu bảo hành",
          "sẽ bị từ chối",
        ],
      },
      {
        kind: "free",
        id: "dth-l5-4",
        source:
          "Management's decision to consolidate the two warehouses resulted in a significant reduction in operating costs.",
        model:
          "Ban lãnh đạo quyết định gộp hai kho hàng, nhờ đó chi phí vận hành giảm đáng kể.",
        focus:
          "Ba danh từ hoá liên tiếp (decision, reduction) cộng sở hữu cách. Trả hết về động từ và tách thành hai vế nhân quả.",
        keyPoints: [
          "ban lãnh đạo quyết định gộp hai kho hàng",
          "nhờ đó/kết quả là",
          "chi phí vận hành giảm đáng kể",
        ],
      },
      {
        kind: "free",
        id: "dth-l5-5",
        source:
          "There has been no improvement in response times since the implementation of the new ticketing system.",
        model:
          "Từ khi triển khai hệ thống tiếp nhận yêu cầu mới, thời gian phản hồi vẫn chưa cải thiện.",
        focus:
          "“There has been no improvement” → “vẫn chưa cải thiện”. implementation → triển khai. Câu mang giọng phàn nàn, phải giữ được.",
        keyPoints: [
          "từ khi triển khai hệ thống mới",
          "thời gian phản hồi",
          "vẫn chưa cải thiện",
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
        id: "dth-l6-1",
        source:
          "POLICY UPDATE — Expense Reimbursement\n\nEffective July 1, submission of expense reports must occur within thirty days of the expenditure. Late submission will require approval from a department head. The reduction of this window from sixty to thirty days follows a recommendation from our auditors and is intended to improve the accuracy of quarterly reporting.",
        model:
          "CẬP NHẬT QUY ĐỊNH — Hoàn ứng chi phí\n\nTừ ngày 1 tháng 7, nhân viên phải nộp báo cáo chi phí trong vòng ba mươi ngày kể từ khi phát sinh khoản chi. Nộp muộn thì phải xin trưởng bộ phận duyệt. Thời hạn này rút từ sáu mươi ngày xuống ba mươi ngày theo khuyến nghị của đơn vị kiểm toán, nhằm giúp số liệu báo cáo quý chính xác hơn.",
        focus:
          "Năm danh từ hoá: submission, expenditure, approval, reduction, recommendation. Trả hết về động từ và thêm chủ thể (“nhân viên”) cho câu đầu.",
        keyPoints: [
          "từ 1/7 phải nộp báo cáo chi phí trong vòng 30 ngày kể từ khi chi",
          "nộp muộn phải xin trưởng bộ phận duyệt",
          "thời hạn rút từ 60 xuống 30 ngày",
          "theo khuyến nghị của kiểm toán",
          "nhằm tăng độ chính xác của báo cáo quý",
        ],
        comprehension: {
          question: "Thời hạn nộp báo cáo chi phí trước đây là bao lâu?",
          options: ["Ba mươi ngày.", "Sáu mươi ngày.", "Một quý."],
          correct: 1,
          explanation:
            "“The reduction of this window from sixty to thirty days” — chữ “from” chỉ mốc cũ, “to” chỉ mốc mới. Đọc lướt là lấy nhầm số.",
        },
      },
      {
        kind: "free",
        id: "dth-l6-2",
        source:
          "Dear Mr. Lindqvist,\n\nThank you for your inquiry regarding installation of our security system. Installation typically requires two visits: an initial assessment of the premises and, after your confirmation of the quote, the actual setup. Cancellation less than twenty-four hours before a scheduled visit incurs a small fee.",
        model:
          "Kính gửi ông Lindqvist,\n\nCảm ơn ông đã hỏi về việc lắp đặt hệ thống an ninh của chúng tôi. Thông thường phải qua hai lần tới nhà: lần đầu để khảo sát mặt bằng, và sau khi ông xác nhận báo giá thì mới lắp đặt thực tế. Nếu huỷ lịch hẹn muộn hơn hai mươi bốn giờ trước giờ hẹn, ông sẽ phải trả một khoản phí nhỏ.",
        focus:
          "installation, assessment, confirmation, cancellation — bốn danh từ hoá. Câu cuối cần thêm chủ ngữ để rõ ai trả phí.",
        keyPoints: [
          "cảm ơn đã hỏi về việc lắp đặt hệ thống an ninh",
          "thường cần hai lần tới nhà",
          "lần đầu khảo sát mặt bằng",
          "sau khi khách xác nhận báo giá mới lắp đặt",
          "huỷ trong vòng 24 giờ trước hẹn thì bị tính phí nhỏ",
        ],
        comprehension: {
          question: "Việc lắp đặt thực tế diễn ra khi nào?",
          options: [
            "Ngay trong lần tới khảo sát đầu tiên.",
            "Sau khi khách xác nhận báo giá.",
            "Sau khi khách thanh toán toàn bộ chi phí.",
          ],
          correct: 1,
          explanation:
            "Điều kiện nằm gọn trong cụm “after your confirmation of the quote” — một danh từ hoá đóng vai mốc thời gian.",
        },
      },
      {
        kind: "free",
        id: "dth-l6-3",
        source:
          "The consultants' analysis of our supply chain identified two weaknesses. The first is our dependence on a single freight provider; the second is the absence of a formal review process for vendor performance. Their recommendation is the addition of a second provider by year-end and the introduction of quarterly vendor scorecards.",
        model:
          "Nhóm tư vấn phân tích chuỗi cung ứng của chúng ta và chỉ ra hai điểm yếu. Thứ nhất, chúng ta phụ thuộc vào một đơn vị vận chuyển duy nhất. Thứ hai, chúng ta chưa có quy trình chính thức để đánh giá nhà cung cấp. Họ đề xuất bổ sung thêm một đơn vị vận chuyển thứ hai trước cuối năm, đồng thời áp dụng phiếu chấm điểm nhà cung cấp theo quý.",
        focus:
          "Sáu danh từ hoá: analysis, dependence, absence, recommendation, addition, introduction. Đây là đoạn dày đặc nhất — dịch xong câu tiếng Việt phải ngắn hơn hẳn bản gốc.",
        keyPoints: [
          "nhóm tư vấn phân tích chuỗi cung ứng và chỉ ra hai điểm yếu",
          "điểm yếu 1: phụ thuộc một đơn vị vận chuyển duy nhất",
          "điểm yếu 2: chưa có quy trình đánh giá nhà cung cấp",
          "đề xuất: bổ sung đơn vị vận chuyển thứ hai trước cuối năm",
          "đề xuất: áp dụng phiếu chấm điểm nhà cung cấp theo quý",
        ],
        comprehension: {
          question: "Nhóm tư vấn đề xuất mấy việc?",
          options: [
            "Một việc: tìm thêm đơn vị vận chuyển.",
            "Hai việc: thêm đơn vị vận chuyển và chấm điểm nhà cung cấp theo quý.",
            "Ba việc, tương ứng ba điểm yếu đã nêu.",
          ],
          correct: 1,
          explanation:
            "Câu cuối gói hai đề xuất vào hai danh từ hoá nối bằng “and”. Vì chúng không nằm ở hai câu riêng nên rất dễ đếm sót.",
        },
      },
    ],
  },
];
