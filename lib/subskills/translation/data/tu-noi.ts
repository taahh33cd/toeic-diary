import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 9 — TỪ NỐI & QUAN HỆ LOGIC
// Dịch nhầm một từ nối là đảo ngược ý cả đoạn.
// Kỹ năng cốt lõi: trước khi dịch, hỏi từ nối này chỉ hướng nào —
// cùng chiều (thêm vào), ngược chiều (nhượng bộ/tương phản),
// nhân quả, điều kiện, hay thay thế?
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const tuNoiLevels: TransLevel[] = [
  // ── L1 — Nhận diện từ nối ─────────────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "tn-l1-1",
        sentence: "The venue is small; nevertheless, we will proceed as planned.",
        instruction: "Bấm vào từ nối cho biết hai vế NGƯỢC CHIỀU nhau:",
        correctWords: ["nevertheless"],
        explanation:
          "nevertheless = tuy vậy, dù vậy. Vế sau đi ngược lại điều vế trước gợi ra. Dịch: “Địa điểm hơi nhỏ, nhưng chúng tôi vẫn tổ chức đúng kế hoạch.”",
      },
      {
        kind: "highlight",
        id: "tn-l1-2",
        sentence: "Sales rose in the north, whereas they fell in the south.",
        instruction: "Bấm vào từ nối cho biết đây là sự ĐỐI CHIẾU hai bên:",
        correctWords: ["whereas"],
        explanation:
          "whereas đặt hai sự việc song song để so sánh, không phải để phản bác. Dịch: “Doanh số miền Bắc tăng, còn miền Nam lại giảm.”",
      },
      {
        kind: "highlight",
        id: "tn-l1-3",
        sentence: "Please submit the form by Friday; otherwise, your slot will be released.",
        instruction: "Bấm vào từ nối nêu HẬU QUẢ nếu không làm theo:",
        correctWords: ["otherwise"],
        explanation:
          "otherwise = nếu không thì. Dịch: “Vui lòng nộp đơn trước thứ Sáu, nếu không chỗ của bạn sẽ bị nhường lại.”",
      },
      {
        kind: "highlight",
        id: "tn-l1-4",
        sentence: "The device is compact; moreover, it uses very little power.",
        instruction: "Bấm vào từ nối cho biết vế sau THÊM một điểm cùng chiều:",
        correctWords: ["moreover"],
        explanation:
          "moreover = hơn nữa. Cả hai vế đều là điểm tốt, không có tương phản nào.",
      },
      {
        kind: "highlight",
        id: "tn-l1-5",
        sentence: "Although the deadline was tight, the team finished early.",
        instruction: "Bấm vào từ nối mở đầu vế NHƯỢNG BỘ:",
        correctWords: ["Although"],
        explanation:
          "Although mở vế nhượng bộ (điều bất lợi), vế chính mới là thông tin trọng tâm. Dịch: “Dù hạn rất gấp, nhóm vẫn xong sớm.”",
      },
      {
        kind: "highlight",
        id: "tn-l1-6",
        sentence: "We hired two more drivers; consequently, delivery times improved.",
        instruction: "Bấm vào từ nối chỉ quan hệ NHÂN QUẢ:",
        correctWords: ["consequently"],
        explanation: "consequently = kết quả là, nhờ đó. Vế trước là nguyên nhân, vế sau là kết quả.",
      },
      {
        kind: "highlight",
        id: "tn-l1-7",
        sentence: "The store will close early on Friday due to inventory counting.",
        instruction: "Bấm vào cụm nêu LÝ DO:",
        correctWords: ["due", "to"],
        explanation:
          "due to = vì, do. Khác with regard to (về việc) — hai cụm nhìn giông giống nhưng khác hẳn chức năng.",
      },
      {
        kind: "highlight",
        id: "tn-l1-8",
        sentence: "Instead of hiring a new manager, the company promoted from within.",
        instruction: "Bấm vào cụm cho biết đây là phương án THAY THẾ:",
        correctWords: ["Instead", "of"],
        explanation:
          "instead of = thay vì. Nó báo rằng phương án đầu KHÔNG được chọn — bỏ sót là hiểu ngược.",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "tn-l2-1",
        sentence: "The proposal is promising; however, the timeline is unrealistic.",
        options: [
          "Bản đề xuất có triển vọng và tiến độ thì không thực tế.",
          "Bản đề xuất có triển vọng, nhưng tiến độ thì không khả thi.",
          "Bản đề xuất có triển vọng bởi vì tiến độ không thực tế.",
        ],
        correct: 1,
        optionNotes: [
          "Thay tương phản bằng “và” — mất hẳn ý chê.",
          "Đúng — however là tương phản, dịch “nhưng”.",
          "Biến tương phản thành nhân quả — sai hoàn toàn.",
        ],
        explanation:
          "Trong nhận xét công việc, từ nối tương phản báo hiệu phần đánh giá thật nằm ở vế sau. Bỏ nó là mất thông điệp chính.",
      },
      {
        kind: "compare",
        id: "tn-l2-2",
        sentence: "Although the branch is profitable, we plan to relocate it.",
        options: [
          "Chi nhánh này có lãi nên chúng tôi định chuyển địa điểm.",
          "Vì chi nhánh có lãi, chúng tôi sẽ chuyển nó đi.",
          "Dù chi nhánh này đang có lãi, chúng tôi vẫn định chuyển địa điểm.",
        ],
        correct: 2,
        optionNotes: [
          "“nên” biến nhượng bộ thành nhân quả.",
          "Cũng là nhân quả — sai hướng logic.",
          "Đúng — “Dù… vẫn…” là cặp chuẩn cho Although.",
        ],
        explanation:
          "Although luôn đi với “Dù/Mặc dù… vẫn…”. Chữ “vẫn” ở vế sau là thứ giữ được sự nghịch lý của câu.",
      },
      {
        kind: "compare",
        id: "tn-l2-3",
        sentence: "Sales rose in Da Nang, whereas they fell in Can Tho.",
        options: [
          "Doanh số Đà Nẵng tăng, mặc dù ở Cần Thơ thì giảm.",
          "Doanh số Đà Nẵng tăng, còn Cần Thơ lại giảm.",
          "Doanh số Đà Nẵng tăng vì Cần Thơ giảm.",
        ],
        correct: 1,
        optionNotes: [
          "“mặc dù” là nhượng bộ; whereas chỉ là đối chiếu song song, nhẹ hơn.",
          "Đúng — “còn… lại…” là cặp chuẩn cho whereas/while.",
          "Bịa ra quan hệ nhân quả không có trong câu gốc.",
        ],
        explanation:
          "Phân biệt hai sắc thái: however/although mang ý nghịch lý; whereas/while chỉ đặt hai bên cạnh nhau để so.",
      },
      {
        kind: "compare",
        id: "tn-l2-4",
        sentence: "Confirm your attendance by Wednesday; otherwise, we will give your seat to someone else.",
        options: [
          "Hãy xác nhận trước thứ Tư, nếu không chúng tôi sẽ nhường chỗ cho người khác.",
          "Hãy xác nhận trước thứ Tư, mặt khác chúng tôi sẽ đưa chỗ cho người khác.",
          "Hãy xác nhận trước thứ Tư và chúng tôi sẽ giữ chỗ cho người khác.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — otherwise = nếu không thì, nêu hậu quả.",
          "“mặt khác” là on the other hand, hoàn toàn khác nghĩa.",
          "Đổi thành “và” là biến lời cảnh báo thành lời hứa — ngược nghĩa.",
        ],
        explanation:
          "otherwise là từ nối có hậu quả thực tế nhất: dịch sai thì học viên hiểu nhầm mình không cần làm gì.",
      },
      {
        kind: "compare",
        id: "tn-l2-5",
        sentence: "The shipment was delayed. Meanwhile, we sourced a temporary replacement.",
        options: [
          "Lô hàng bị chậm. Tuy nhiên, chúng tôi đã tìm hàng thay thế tạm.",
          "Lô hàng bị chậm. Trong lúc chờ, chúng tôi đã tìm hàng thay thế tạm.",
          "Lô hàng bị chậm. Sau đó chúng tôi đã tìm hàng thay thế tạm.",
        ],
        correct: 1,
        optionNotes: [
          "meanwhile không phải tương phản.",
          "Đúng — meanwhile = trong khoảng thời gian đó, trong lúc chờ.",
          "“Sau đó” là trình tự nối tiếp; meanwhile là song song, cùng lúc.",
        ],
        explanation:
          "meanwhile hay bị nhầm thành however vì cùng đứng đầu câu. Nhưng nó chỉ thời gian, không chỉ tương phản.",
      },
      {
        kind: "compare",
        id: "tn-l2-6",
        sentence: "In addition to the base salary, the position offers a quarterly bonus.",
        options: [
          "Thêm vào lương cơ bản, vị trí này đưa ra một tiền thưởng hàng quý.",
          "Ngoài lương cơ bản, vị trí này còn có thưởng theo quý.",
          "Thay cho lương cơ bản, vị trí này trả thưởng theo quý.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ, câu cứng.",
          "Đúng — “Ngoài… còn…” là cặp chuẩn cho In addition to.",
          "Biến “thêm” thành “thay thế” — mất hẳn khoản lương cơ bản.",
        ],
        explanation:
          "Bản dịch “Thay cho lương cơ bản…” minh hoạ hậu quả rất thật: ứng viên tưởng công việc chỉ trả thưởng chứ không có lương cứng.",
      },
      {
        kind: "compare",
        id: "tn-l2-7",
        sentence: "The software is expensive. That said, it pays for itself within a year.",
        options: [
          "Phần mềm khá đắt. Đã nói vậy, nó tự trả tiền trong một năm.",
          "Phần mềm khá đắt. Nói vậy chứ chỉ trong một năm là thu hồi được vốn.",
          "Phần mềm khá đắt vì nó tự hoàn vốn trong vòng một năm.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ “That said”, và “tự trả tiền” là dịch máy của pay for itself.",
          "Đúng — That said = nói vậy chứ, một cách nhượng bộ nhẹ; pay for itself = hoàn vốn.",
          "Bịa quan hệ nhân quả.",
        ],
        explanation:
          "That said / Having said that là từ nối kiểu hội thoại, nghĩa gần “tuy nhiên” nhưng giọng mềm hơn.",
      },
      {
        kind: "compare",
        id: "tn-l2-8",
        sentence: "We chose the local supplier rather than the overseas one.",
        options: [
          "Chúng tôi chọn nhà cung cấp trong nước chứ không chọn bên nước ngoài.",
          "Chúng tôi chọn nhà cung cấp trong nước hơn là bên nước ngoài.",
          "Chúng tôi chọn cả nhà cung cấp trong nước lẫn nước ngoài.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — rather than = chứ không phải, loại trừ hẳn phương án kia.",
          "“hơn là” nghe như vẫn còn cân nhắc, trong khi quyết định đã dứt khoát.",
          "Hiểu ngược hoàn toàn.",
        ],
        explanation:
          "rather than / instead of đều báo phương án kia bị LOẠI. Dịch nước đôi là làm mờ một quyết định đã chốt.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "tn-l3-1",
        sentence: "Despite the heavy rain, the outdoor event went ahead.",
        chunks: ["Dù trời mưa to,", "sự kiện ngoài trời vẫn diễn ra"],
        distractors: ["Vì trời mưa to,", "sự kiện đã bị dời vào trong"],
        hint: "Despite = dù, và vế sau cần chữ “vẫn”.",
        explanation:
          "go ahead = vẫn tiến hành như dự định. Bỏ chữ “vẫn” là câu mất hẳn ý nghịch lý.",
      },
      {
        kind: "order",
        id: "tn-l3-2",
        sentence: "The machine is old; therefore, repairs are becoming more frequent.",
        chunks: ["Máy đã cũ,", "nên phải sửa ngày càng thường xuyên"],
        distractors: ["Máy vẫn còn mới,", "nhưng ít khi phải sửa"],
        hint: "therefore = nên, chỉ kết quả.",
        explanation:
          "more frequent = ngày càng thường xuyên — chú ý so sánh hơn ở đây chỉ xu hướng tăng dần.",
      },
      {
        kind: "order",
        id: "tn-l3-3",
        sentence: "You may pay by card; alternatively, we accept bank transfer.",
        chunks: ["Quý khách có thể thanh toán bằng thẻ,", "hoặc chuyển khoản ngân hàng cũng được"],
        distractors: ["Quý khách bắt buộc thanh toán bằng thẻ,", "tuy nhiên chúng tôi từ chối chuyển khoản"],
        hint: "alternatively = hoặc, nêu lựa chọn thứ hai.",
        explanation:
          "alternatively mở ra một lựa chọn ngang hàng, không phải bắt buộc cũng không phải tương phản.",
      },
      {
        kind: "order",
        id: "tn-l3-4",
        sentence: "The report was late; as a result, the meeting had to be rescheduled.",
        chunks: ["Báo cáo nộp muộn,", "nên cuộc họp phải dời lịch"],
        distractors: ["Báo cáo nộp đúng hạn,", "tuy nhiên cuộc họp vẫn phải dời"],
        hint: "as a result = kết quả là.",
        explanation:
          "reschedule = dời lịch sang thời điểm khác, không phải huỷ. Đây là chi tiết Part 7 hay hỏi.",
      },
      {
        kind: "order",
        id: "tn-l3-5",
        sentence: "While the new layout looks better, staff find it harder to navigate.",
        chunks: ["Bố cục mới trông đẹp hơn,", "nhưng nhân viên lại thấy khó tìm đường hơn"],
        distractors: ["Trong khi nhân viên đang tìm đường,", "ai cũng thấy bố cục mới dễ dùng hơn"],
        hint: "While đầu câu ở đây là tương phản, không phải “trong khi” chỉ thời gian.",
        explanation:
          "While có hai nghĩa: chỉ thời gian (trong khi) và chỉ tương phản (dù/nhưng). Ở đầu câu với hai mệnh đề đối nhau thì là tương phản.",
      },
      {
        kind: "order",
        id: "tn-l3-6",
        sentence: "Given the budget cuts, we will postpone all non-essential purchases.",
        chunks: ["Trước tình hình cắt giảm ngân sách,", "chúng tôi sẽ hoãn mọi khoản mua không thiết yếu"],
        distractors: ["Được cho ngân sách bị cắt,", "sẽ mua thêm những thứ cần thiết"],
        hint: "Given + danh từ = xét thấy, trước tình hình.",
        explanation:
          "Given ở đầu câu không phải quá khứ phân từ của “give” mà là giới từ nghĩa “xét đến”.",
      },
      {
        kind: "order",
        id: "tn-l3-7",
        sentence: "The candidate has strong technical skills; on the other hand, she lacks management experience.",
        chunks: ["Ứng viên có chuyên môn kỹ thuật vững,", "mặt khác lại thiếu kinh nghiệm quản lý"],
        distractors: ["Ứng viên thiếu chuyên môn kỹ thuật,", "vì vậy cô ấy rất hợp vị trí quản lý"],
        hint: "on the other hand = mặt khác, nêu mặt còn lại.",
        explanation:
          "on the other hand đặt hai mặt của cùng một đối tượng cạnh nhau — khác otherwise (nếu không thì).",
      },
      {
        kind: "order",
        id: "tn-l3-8",
        sentence: "Rather than replace the whole unit, the technician repaired the faulty valve.",
        chunks: ["Thay vì thay cả cụm thiết bị,", "kỹ thuật viên chỉ sửa cái van bị hỏng"],
        distractors: ["Hơn là việc thay thế,", "đã thay luôn cả cụm thiết bị"],
        hint: "Rather than = thay vì; phương án đầu bị loại.",
        explanation:
          "Chữ “chỉ” trong bản dịch giữ được ý tiết kiệm mà câu gốc ngụ ý qua cấu trúc rather than.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "tn-l4-1",
        sentence: "The hotel is fully booked; nevertheless, we can add your name to the waiting list.",
        draft: "Khách sạn đã kín phòng, ___ chúng tôi có thể ghi tên quý khách vào danh sách chờ.",
        blanks: [
          {
            options: ["nhưng", "vì vậy", "hơn nữa"],
            correct: 0,
            note: "nevertheless là tương phản: dù hết phòng nhưng vẫn còn cách.",
          },
        ],
        explanation:
          "Ba từ nối trong ba hướng khác nhau. Chọn sai là đổi hẳn thông điệp: từ “vẫn còn hy vọng” thành “vì hết phòng nên…”.",
      },
      {
        kind: "repair",
        id: "tn-l4-2",
        sentence: "Register before May 1; otherwise, the early-bird rate no longer applies.",
        draft: "Hãy đăng ký trước ngày 1 tháng 5, ___ mức giá ưu đãi sớm ___.",
        blanks: [
          {
            options: ["nếu không", "ngoài ra", "vì thế"],
            correct: 0,
            note: "otherwise nêu hậu quả của việc KHÔNG làm.",
          },
          {
            options: ["sẽ không còn", "sẽ được giữ nguyên", "vẫn áp dụng"],
            correct: 0,
            note: "no longer applies = không còn áp dụng nữa.",
          },
        ],
        explanation:
          "early-bird rate = giá ưu đãi cho người đăng ký sớm — một thuật ngữ cố định trong quảng cáo sự kiện.",
      },
      {
        kind: "repair",
        id: "tn-l4-3",
        sentence: "Our costs rose sharply. Even so, we kept prices unchanged.",
        draft: "Chi phí của chúng tôi tăng mạnh. ___, chúng tôi ___ giữ nguyên giá bán.",
        blanks: [
          {
            options: ["Dù vậy", "Nhờ vậy", "Ngoài ra"],
            correct: 0,
            note: "Even so = dù vậy, nhượng bộ.",
          },
          {
            options: ["vẫn", "đã buộc phải", "sẽ không"],
            correct: 0,
            note: "Vế sau của nhượng bộ cần chữ “vẫn” để giữ ý nghịch lý.",
          },
        ],
        explanation:
          "Cặp “Dù vậy… vẫn…” phải đi cùng nhau. Thiếu chữ “vẫn” thì câu mất đi phần đáng khen của quyết định.",
      },
      {
        kind: "repair",
        id: "tn-l4-4",
        sentence: "The trial version is free, whereas the full license costs $200 per year.",
        draft: "Bản dùng thử miễn phí, ___ bản đầy đủ có giá 200 đô một năm.",
        blanks: [
          {
            options: ["còn", "vì", "cho nên"],
            correct: 0,
            note: "whereas là đối chiếu song song — tiếng Việt dùng “còn”.",
          },
        ],
        explanation:
          "“còn” là từ nối đối chiếu nhẹ nhàng nhất của tiếng Việt, hợp với whereas/while hơn hẳn “nhưng”.",
      },
      {
        kind: "repair",
        id: "tn-l4-5",
        sentence: "In light of recent feedback, we have simplified the checkout process.",
        draft: "___ những phản hồi gần đây, chúng tôi đã ___ quy trình thanh toán.",
        blanks: [
          {
            options: ["Sau khi tiếp thu", "Dưới ánh sáng của", "Bất chấp"],
            correct: 0,
            note: "In light of = xét đến, căn cứ vào — không dịch mặt chữ thành “ánh sáng”.",
          },
          {
            options: ["đơn giản hoá", "phức tạp hoá", "huỷ bỏ"],
            correct: 0,
            note: "simplify = làm đơn giản đi.",
          },
        ],
        explanation:
          "In light of là cụm trang trọng rất hay gặp trong thông báo doanh nghiệp, nghĩa gần “căn cứ vào / trước tình hình”.",
      },
      {
        kind: "repair",
        id: "tn-l4-6",
        sentence: "Both machines are reliable; that said, the newer model is quieter.",
        draft: "Cả hai máy đều bền, ___ máy đời mới chạy êm hơn.",
        blanks: [
          {
            options: ["nói vậy chứ", "vì vậy", "ngoài ra"],
            correct: 0,
            note: "that said là nhượng bộ nhẹ: công nhận vế trước nhưng vẫn thêm một ý điều chỉnh.",
          },
        ],
        explanation:
          "“ngoài ra” cũng thêm ý nhưng là cùng chiều; that said mang sắc thái “tuy nhiên cần nói thêm là…”.",
      },
      {
        kind: "repair",
        id: "tn-l4-7",
        sentence: "We could hire a contractor. Alternatively, we could train existing staff.",
        draft: "Chúng ta có thể thuê nhà thầu ngoài. ___ đào tạo lại nhân viên hiện có.",
        blanks: [
          {
            options: ["Hoặc là", "Sau đó", "Tuy nhiên"],
            correct: 0,
            note: "Alternatively mở phương án hai ngang hàng với phương án một.",
          },
        ],
        explanation:
          "Trong biên bản họp, alternatively luôn báo hiệu một lựa chọn thay thế đang được cân nhắc — không phải bước tiếp theo.",
      },
      {
        kind: "repair",
        id: "tn-l4-8",
        sentence: "The store closed early owing to a power outage.",
        draft: "Cửa hàng đóng cửa sớm ___ mất điện.",
        blanks: [
          {
            options: ["do", "mặc dù", "để"],
            correct: 0,
            note: "owing to = do, vì. Cùng nghĩa với due to và because of.",
          },
        ],
        explanation:
          "owing to / due to / because of / on account of — bốn cách nói cùng một quan hệ nguyên nhân. TOEIC đổi qua đổi lại giữa chúng.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "tn-l5-1",
        source:
          "Although the renovation finished ahead of schedule, the total cost exceeded the original estimate by 12%.",
        model:
          "Dù việc cải tạo hoàn thành sớm hơn dự kiến, tổng chi phí vẫn vượt dự toán ban đầu 12%.",
        focus:
          "Cặp “Dù… vẫn…”. Vế chính là tin xấu (vượt chi phí) — đó mới là trọng tâm câu, đừng để nó chìm.",
        keyPoints: [
          "dù cải tạo xong sớm hơn dự kiến",
          "tổng chi phí vẫn vượt dự toán ban đầu",
          "vượt 12%",
        ],
      },
      {
        kind: "free",
        id: "tn-l5-2",
        source:
          "Please confirm your booking within 24 hours; otherwise the room will be released to other guests.",
        model:
          "Quý khách vui lòng xác nhận đặt phòng trong vòng 24 giờ, nếu không phòng sẽ được nhường lại cho khách khác.",
        focus:
          "otherwise = nếu không thì. Đây là lời cảnh báo có hậu quả — dịch nhầm thành “ngoài ra” là mất hẳn tính khẩn.",
        keyPoints: [
          "xác nhận đặt phòng trong vòng 24 giờ",
          "nếu không",
          "phòng sẽ được nhường cho khách khác",
        ],
      },
      {
        kind: "free",
        id: "tn-l5-3",
        source:
          "Revenue grew in all three regions; however, profit margins narrowed because of higher shipping costs.",
        model:
          "Doanh thu tăng ở cả ba khu vực, nhưng biên lợi nhuận lại thu hẹp do chi phí vận chuyển tăng.",
        focus:
          "Hai từ nối khác hướng trong một câu: however (tương phản) và because of (nguyên nhân). Phải giữ đúng cả hai.",
        keyPoints: [
          "doanh thu tăng ở cả ba khu vực",
          "nhưng biên lợi nhuận thu hẹp",
          "do chi phí vận chuyển tăng",
        ],
      },
      {
        kind: "free",
        id: "tn-l5-4",
        source:
          "Rather than extending the current contract, the committee decided to open a new round of bidding.",
        model:
          "Thay vì gia hạn hợp đồng hiện tại, hội đồng quyết định mở một vòng đấu thầu mới.",
        focus:
          "Rather than = thay vì, phương án đầu bị loại. Chú ý extend a contract = gia hạn hợp đồng.",
        keyPoints: [
          "thay vì gia hạn hợp đồng hiện tại",
          "hội đồng quyết định",
          "mở vòng đấu thầu mới",
        ],
      },
      {
        kind: "free",
        id: "tn-l5-5",
        source:
          "In light of the supplier's repeated delays, we are reviewing alternatives; meanwhile, orders will continue as usual.",
        model:
          "Trước tình trạng nhà cung cấp liên tục giao chậm, chúng tôi đang tìm phương án khác; trong lúc đó, việc đặt hàng vẫn tiến hành như bình thường.",
        focus:
          "In light of = trước tình hình; meanwhile = trong lúc đó (song song, không phải tương phản cũng không phải nối tiếp).",
        keyPoints: [
          "trước việc nhà cung cấp liên tục giao chậm",
          "đang xem xét phương án khác",
          "trong lúc đó việc đặt hàng vẫn bình thường",
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
        id: "tn-l6-1",
        source:
          "Dear Ms. Bergström,\n\nThank you for your interest in the Marketing Coordinator role. Your background in event planning is impressive; however, the position requires at least three years of digital advertising experience. That said, we are opening a junior role next quarter that may suit you better. If you would like us to keep your file on record, simply reply to this message; otherwise, we will remove your details after ninety days.",
        model:
          "Kính gửi bà Bergström,\n\nCảm ơn bà đã quan tâm tới vị trí Điều phối viên Marketing. Kinh nghiệm tổ chức sự kiện của bà rất ấn tượng, tuy nhiên vị trí này đòi hỏi ít nhất ba năm kinh nghiệm quảng cáo số. Nói vậy chứ, quý sau chúng tôi sẽ mở một vị trí junior có thể phù hợp với bà hơn. Nếu bà muốn chúng tôi lưu lại hồ sơ, xin chỉ cần trả lời thư này; nếu không, chúng tôi sẽ xoá thông tin của bà sau chín mươi ngày.",
        focus:
          "Bốn từ nối đổi hướng liên tục: however (từ chối), That said (mở lại hy vọng), If (điều kiện), otherwise (hậu quả). Đây đúng là kiểu thư từ chối lịch sự của Part 7.",
        keyPoints: [
          "cảm ơn đã quan tâm vị trí Điều phối viên Marketing",
          "kinh nghiệm tổ chức sự kiện ấn tượng",
          "nhưng vị trí này cần ít nhất 3 năm kinh nghiệm quảng cáo số",
          "quý sau có vị trí junior có thể phù hợp hơn",
          "muốn lưu hồ sơ thì trả lời thư; nếu không sẽ bị xoá sau 90 ngày",
        ],
        comprehension: {
          question: "Ứng viên phải làm gì để hồ sơ được giữ lại?",
          options: [
            "Nộp lại hồ sơ cho vị trí junior quý sau.",
            "Trả lời email này.",
            "Không cần làm gì, hồ sơ tự động được lưu.",
          ],
          correct: 1,
          explanation:
            "“simply reply to this message; otherwise, we will remove your details” — cặp if/otherwise chia đôi hai kết cục. Không làm gì tức là bị xoá.",
        },
      },
      {
        kind: "free",
        id: "tn-l6-2",
        source:
          "PRODUCT UPDATE\n\nVersion 4.2 improves battery life by roughly 20%. In addition, the redesigned casing is more durable. On the other hand, the new model is 40 grams heavier, and some users may notice this during extended handheld use. Despite the added weight, early reviews have been positive overall.",
        model:
          "CẬP NHẬT SẢN PHẨM\n\nPhiên bản 4.2 tăng thời lượng pin khoảng 20%. Ngoài ra, phần vỏ được thiết kế lại nên bền hơn. Mặt khác, máy mới nặng thêm 40 gram, và một số người dùng có thể cảm thấy điều đó khi cầm tay lâu. Dù nặng hơn, các đánh giá ban đầu nhìn chung vẫn tích cực.",
        focus:
          "Bốn từ nối lần lượt: In addition (thêm, cùng chiều), On the other hand (mặt trái), Despite (nhượng bộ), overall (tổng kết). Dịch đúng thì người đọc thấy rõ đâu là ưu, đâu là nhược.",
        keyPoints: [
          "phiên bản 4.2 tăng thời lượng pin khoảng 20%",
          "ngoài ra vỏ thiết kế lại bền hơn",
          "mặt khác máy nặng thêm 40 gram",
          "người dùng có thể thấy khi cầm tay lâu",
          "dù nặng hơn, đánh giá ban đầu vẫn tích cực",
        ],
        comprehension: {
          question: "Nhược điểm của phiên bản 4.2 là gì?",
          options: [
            "Thời lượng pin ngắn hơn bản cũ.",
            "Máy nặng hơn 40 gram.",
            "Vỏ máy kém bền hơn.",
          ],
          correct: 1,
          explanation:
            "“On the other hand” là bản lề chia ưu và nhược. Mọi thứ trước nó là điểm cộng, ngay sau nó mới là điểm trừ duy nhất.",
        },
      },
      {
        kind: "free",
        id: "tn-l6-3",
        source:
          "MEMO — Office Supplies\n\nOwing to a change of vendor, our usual paper brand will be unavailable until August. In the meantime, please use the substitute stock in the third-floor cabinet. Note that this paper is slightly thinner; consequently, the large copier may jam if you load more than 300 sheets at once. Should this happen, contact facilities rather than attempting to clear the jam yourself.",
        model:
          "THÔNG BÁO — Văn phòng phẩm\n\nDo đổi nhà cung cấp, loại giấy quen thuộc của chúng ta sẽ không có hàng cho tới tháng 8. Trong thời gian này, mọi người dùng tạm số giấy thay thế trong tủ ở tầng 3. Lưu ý loại giấy này hơi mỏng hơn, vì vậy máy photo lớn có thể bị kẹt nếu nạp quá 300 tờ một lần. Nếu bị kẹt giấy, xin liên hệ bộ phận cơ sở vật chất thay vì tự gỡ.",
        focus:
          "Năm từ nối: Owing to (nguyên nhân), In the meantime (thời gian), consequently (kết quả), Should this happen (điều kiện đảo ngữ), rather than (loại trừ). Câu cuối là đảo ngữ điều kiện — dễ đọc sót.",
        keyPoints: [
          "do đổi nhà cung cấp nên hết loại giấy quen thuộc tới tháng 8",
          "trong thời gian đó dùng giấy thay thế ở tủ tầng 3",
          "giấy này mỏng hơn",
          "nên máy photo lớn có thể kẹt nếu nạp quá 300 tờ",
          "nếu kẹt thì gọi bộ phận cơ sở vật chất, đừng tự gỡ",
        ],
        comprehension: {
          question: "Nếu máy photo bị kẹt giấy thì nên làm gì?",
          options: [
            "Tự gỡ giấy kẹt rồi báo lại sau.",
            "Gọi bộ phận cơ sở vật chất, không tự gỡ.",
            "Chuyển sang dùng máy photo nhỏ hơn.",
          ],
          correct: 1,
          explanation:
            "“rather than attempting to clear the jam yourself” — cụm rather than ở cuối câu chính là phần cấm. Bỏ qua nó là làm sai hướng dẫn.",
        },
      },
    ],
  },
];
