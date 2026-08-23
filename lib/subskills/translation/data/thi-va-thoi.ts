import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 4 — THÌ & DẤU THỜI GIAN TIẾNG VIỆT
// Tiếng Việt không chia động từ; thông tin thời gian hoặc bị bỏ rơi,
// hoặc bị nhét thừa "đã/đang" ở mọi câu.
// Kỹ năng cốt lõi: xác định mốc thời gian TRƯỚC, rồi mới chọn
// đã / đang / sẽ / vừa / rồi / từ… đến giờ — hoặc không cần gì cả.
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const thiVaThoiLevels: TransLevel[] = [
  // ── L1 — Nhận diện mốc thời gian ──────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "tvt-l1-1",
        sentence: "She has worked here since 2019.",
        instruction: "Bấm vào phần cho biết MỐC THỜI GIAN của hành động:",
        correctWords: ["since", "2019"],
        explanation:
          "since + mốc = từ lúc đó tới hiện tại, việc vẫn còn tiếp diễn. Tiếng Việt phải nói rõ “đến giờ”, nếu không người đọc tưởng cô ấy đã nghỉ.",
      },
      {
        kind: "highlight",
        id: "tvt-l1-2",
        sentence: "The shipment will have arrived by Friday.",
        instruction: "Bấm vào phần cho biết MỐC THỜI GIAN:",
        correctWords: ["by", "Friday"],
        explanation:
          "by + mốc = chậm nhất là lúc đó, có thể sớm hơn. Tiếng Việt: “trước thứ Sáu”, không phải “vào thứ Sáu”.",
      },
      {
        kind: "highlight",
        id: "tvt-l1-3",
        sentence: "We have already submitted the quarterly report.",
        instruction: "Bấm vào từ báo hiệu việc đã hoàn tất:",
        correctWords: ["already"],
        explanation:
          "already trong hiện tại hoàn thành = xong rồi, sớm hơn dự kiến. Tiếng Việt dịch bằng chữ “rồi” ở cuối câu.",
      },
      {
        kind: "highlight",
        id: "tvt-l1-4",
        sentence: "The office has been closed for two weeks.",
        instruction: "Bấm vào phần cho biết KHOẢNG THỜI GIAN:",
        correctWords: ["for", "two", "weeks"],
        explanation:
          "for + khoảng thời gian = kéo dài bấy lâu và vẫn đang như vậy. Dịch: “Văn phòng đóng cửa hai tuần nay rồi.”",
      },
      {
        kind: "highlight",
        id: "tvt-l1-5",
        sentence: "I was reviewing the contract when the client called.",
        instruction: "Bấm vào từ nối hai hành động theo trục thời gian:",
        correctWords: ["when"],
        explanation:
          "when nối một việc đang diễn ra (reviewing) với một việc cắt ngang (called). Dịch: “Tôi đang xem hợp đồng thì khách gọi tới.”",
      },
      {
        kind: "highlight",
        id: "tvt-l1-6",
        sentence: "Our manager left just before the meeting started.",
        instruction: "Bấm vào phần cho biết TRẬT TỰ hai sự việc:",
        correctWords: ["just", "before"],
        explanation:
          "just before = ngay trước khi. Bỏ mất chữ “just” là mất thông tin về khoảng cách rất sát giữa hai việc.",
      },
      {
        kind: "highlight",
        id: "tvt-l1-7",
        sentence: "By the time you read this, the deadline will have passed.",
        instruction: "Bấm vào cụm đặt mốc cho câu:",
        correctWords: ["By", "the", "time"],
        explanation:
          "By the time + mệnh đề = đến lúc… thì. Vế sau ở tương lai hoàn thành: tới lúc đó việc kia đã xong.",
      },
      {
        kind: "highlight",
        id: "tvt-l1-8",
        sentence: "The store opens at 9 A.M. every day.",
        instruction: "Bấm vào phần cho biết đây là việc LẶP LẠI:",
        correctWords: ["every", "day"],
        explanation:
          "every day báo đây là thói quen/lịch cố định. Tiếng Việt không cần “đang” hay “sẽ”: “Cửa hàng mở cửa lúc 9 giờ sáng hằng ngày.”",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "tvt-l2-1",
        sentence: "She has worked here since 2019.",
        options: [
          "Cô ấy đã làm việc ở đây từ năm 2019.",
          "Cô ấy làm ở đây từ năm 2019 đến giờ.",
          "Cô ấy đang làm việc ở đây kể từ năm 2019.",
        ],
        correct: 1,
        optionNotes: [
          "Chữ “đã” khiến người đọc hiểu là cô ấy đã nghỉ — ngược hẳn ý câu gốc.",
          "Đúng — “đến giờ” giữ được ý việc vẫn đang tiếp tục.",
          "“đang… kể từ” là cấu trúc dịch máy, tiếng Việt không nói vậy.",
        ],
        explanation:
          "Hiện tại hoàn thành là thì bị dịch sai nhiều nhất. Mẹo: thêm “đến giờ / tới nay / được… rồi”, đừng thêm “đã”.",
      },
      {
        kind: "compare",
        id: "tvt-l2-2",
        sentence: "I worked at that company for three years.",
        options: [
          "Tôi làm ở công ty đó ba năm nay rồi.",
          "Tôi đang làm ở công ty đó được ba năm.",
          "Tôi từng làm ở công ty đó ba năm.",
        ],
        correct: 2,
        optionNotes: [
          "“ba năm nay rồi” = vẫn đang làm — đó là hiện tại hoàn thành, không phải câu này.",
          "Sai hẳn thì: câu gốc ở quá khứ đơn, việc đã kết thúc.",
          "Đúng — “từng” báo rõ chuyện đã qua và đã chấm dứt.",
        ],
        explanation:
          "So với câu trước: has worked = còn làm; worked = đã nghỉ. Tiếng Việt phân biệt bằng “đến giờ” vs “từng”.",
      },
      {
        kind: "compare",
        id: "tvt-l2-3",
        sentence: "The train leaves at 6 A.M. tomorrow.",
        options: [
          "Tàu chạy lúc 6 giờ sáng mai.",
          "Tàu đang rời đi lúc 6 giờ sáng mai.",
          "Tàu đã khởi hành lúc 6 giờ sáng ngày mai.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — lịch trình cố định thì tiếng Việt không cần thêm dấu thì nào cả.",
          "“đang” mâu thuẫn với “sáng mai”.",
          "“đã” mâu thuẫn thẳng với “ngày mai”.",
        ],
        explanation:
          "Hiện tại đơn của lịch tàu/bay/họp mang nghĩa tương lai. Đây cũng là lúc tiếng Việt tự nhiên nhất khi KHÔNG thêm gì.",
      },
      {
        kind: "compare",
        id: "tvt-l2-4",
        sentence: "By the time the technician arrived, the system had already restarted.",
        options: [
          "Sau khi kỹ thuật viên tới, hệ thống mới khởi động lại.",
          "Đến lúc kỹ thuật viên tới nơi, hệ thống đang khởi động lại.",
          "Lúc kỹ thuật viên tới nơi thì hệ thống đã tự khởi động lại rồi.",
        ],
        correct: 2,
        optionNotes: [
          "Đảo ngược trật tự thời gian — hệ thống khởi động TRƯỚC khi anh ta tới.",
          "Mất quá khứ hoàn thành: việc đã xong chứ không phải đang diễn ra.",
          "Đúng — “đã… rồi” đánh dấu việc xảy ra trước mốc quá khứ kia.",
        ],
        explanation:
          "Quá khứ hoàn thành (had + V3) luôn nói về việc xảy ra TRƯỚC một mốc quá khứ khác. Dịch sai là đảo lộn diễn biến.",
      },
      {
        kind: "compare",
        id: "tvt-l2-5",
        sentence: "We have been waiting for your reply since Monday.",
        options: [
          "Chúng tôi chờ phản hồi của quý vị từ thứ Hai đến giờ.",
          "Chúng tôi đã chờ phản hồi của quý vị vào thứ Hai.",
          "Chúng tôi sẽ chờ phản hồi của quý vị từ thứ Hai.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — vẫn đang chờ, và câu mang hàm ý nhắc khéo.",
          "“vào thứ Hai” biến khoảng kéo dài thành một điểm — mất luôn ý nhắc nhở.",
          "Sai thì hoàn toàn.",
        ],
        explanation:
          "Hiện tại hoàn thành tiếp diễn trong email thường mang hàm ý trách nhẹ: “chờ mãi mà chưa thấy trả lời”. Dịch đúng thì phải giữ được sức nặng đó.",
      },
      {
        kind: "compare",
        id: "tvt-l2-6",
        sentence: "Next month, the policy will have been in place for a year.",
        options: [
          "Chính sách sẽ được áp dụng trong một năm kể từ tháng sau.",
          "Tới tháng sau là chính sách này áp dụng được tròn một năm.",
          "Chính sách đã có hiệu lực một năm từ tháng sau.",
        ],
        correct: 1,
        optionNotes: [
          "Hiểu thành chính sách chỉ kéo dài một năm rồi hết — sai hẳn.",
          "Đúng — mốc tương lai (tháng sau) nhìn ngược lại quãng đã qua.",
          "“đã… từ tháng sau” tự mâu thuẫn.",
        ],
        explanation:
          "Tương lai hoàn thành = đứng ở mốc tương lai nhìn lại. Tiếng Việt diễn bằng “tới lúc đó là… được tròn…”.",
      },
      {
        kind: "compare",
        id: "tvt-l2-7",
        sentence: "He is always complaining about the new schedule.",
        options: [
          "Anh ấy đang luôn luôn phàn nàn về lịch mới.",
          "Anh ấy luôn phàn nàn về lịch mới.",
          "Anh ta lúc nào cũng ca cẩm về cái lịch mới.",
        ],
        correct: 2,
        optionNotes: [
          "“đang luôn luôn” là câu dịch máy, tiếng Việt không nói vậy.",
          "Đúng nghĩa nhưng mất sắc thái — câu gốc có ý bực mình.",
          "Đúng — always + tiếp diễn mang sắc thái khó chịu, “lúc nào cũng… ca cẩm” giữ được điều đó.",
        ],
        explanation:
          "always + thì tiếp diễn KHÔNG phải thói quen trung tính, mà là lời phàn nàn. Đây là chỗ dịch đúng chữ vẫn mất ý.",
      },
      {
        kind: "compare",
        id: "tvt-l2-8",
        sentence: "Ms. Ito had been managing the branch before she was promoted.",
        options: [
          "Bà Ito quản lý chi nhánh một thời gian trước khi được thăng chức.",
          "Bà Ito đã đang quản lý chi nhánh trước khi bà được thăng chức.",
          "Bà Ito quản lý chi nhánh sau khi được thăng chức.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — “một thời gian” giữ được ý kéo dài, “trước khi” giữ đúng trật tự.",
          "“đã đang” là chồng hai dấu thì, tiếng Việt không dùng.",
          "Đảo ngược trật tự trước–sau.",
        ],
        explanation:
          "Đừng cố dịch từng thành phần had + been + V-ing. Tiếng Việt gói cả cụm đó vào một chữ như “một thời gian”, “bấy lâu”.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "tvt-l3-1",
        sentence: "Mr. Aziz has been with the company for eight years.",
        chunks: ["Ông Aziz gắn bó với công ty", "được tám năm rồi"],
        distractors: ["đã từng ở công ty", "trong tám năm"],
        hint: "for + khoảng thời gian, và việc vẫn còn tiếp tục.",
        explanation:
          "“được… rồi” giữ ý còn đang làm; “đã từng” thì lại thành đã nghỉ.",
      },
      {
        kind: "order",
        id: "tvt-l3-2",
        sentence: "The renovation will be finished by the end of March.",
        chunks: ["Việc cải tạo sẽ xong", "trước cuối tháng 3"],
        distractors: ["đã hoàn tất", "vào đúng cuối tháng 3"],
        hint: "by = chậm nhất là, có thể sớm hơn.",
        explanation:
          "by the end of March = trước khi hết tháng 3, không phải đúng ngày cuối tháng.",
      },
      {
        kind: "order",
        id: "tvt-l3-3",
        sentence: "We were still reviewing the applications when the deadline passed.",
        chunks: ["Chúng tôi vẫn đang xét hồ sơ", "thì tới hạn chót"],
        distractors: ["đã xét xong hồ sơ", "sau khi hết hạn"],
        hint: "still + tiếp diễn = việc chưa xong tại thời điểm đó.",
        explanation:
          "“vẫn đang… thì…” là khuôn tiếng Việt chuẩn cho một việc bị mốc thời gian cắt ngang.",
      },
      {
        kind: "order",
        id: "tvt-l3-4",
        sentence: "Our records show that the invoice was paid last Thursday.",
        chunks: ["Theo hồ sơ của chúng tôi", "hoá đơn đã được thanh toán", "hôm thứ Năm tuần trước"],
        distractors: ["hoá đơn sẽ được thanh toán", "vào thứ Năm tới"],
        hint: "last Thursday là mốc quá khứ đã xác định.",
        explanation:
          "Khi đã có mốc quá khứ rõ ràng (last Thursday), chữ “đã” là cần thiết chứ không thừa.",
      },
      {
        kind: "order",
        id: "tvt-l3-5",
        sentence: "The seminar starts at 2 P.M. and runs until 5.",
        chunks: ["Buổi hội thảo bắt đầu lúc 2 giờ chiều", "và kéo dài tới 5 giờ"],
        distractors: ["đang bắt đầu lúc 2 giờ chiều", "và đã chạy tới 5 giờ"],
        hint: "Lịch trình cố định — không cần dấu thì nào.",
        explanation:
          "Với lịch chương trình, tiếng Việt để động từ trần là tự nhiên nhất. Thêm “đang/đã” chỉ làm câu lạ tai.",
      },
      {
        kind: "order",
        id: "tvt-l3-6",
        sentence: "I have just sent you the updated file.",
        chunks: ["Tôi vừa gửi cho anh", "bản cập nhật", "xong"],
        distractors: ["sẽ gửi cho anh", "từ lâu rồi"],
        hint: "just trong hiện tại hoàn thành = vừa mới.",
        explanation:
          "just = vừa mới, nhấn vào chuyện việc mới xảy ra tức thì. Bỏ chữ “vừa” là mất thông tin.",
      },
      {
        kind: "order",
        id: "tvt-l3-7",
        sentence: "By the time the guests arrive, the room will have been cleaned.",
        chunks: ["Đến lúc khách tới", "thì phòng đã được dọn xong"],
        distractors: ["sau khi khách tới", "phòng mới được dọn"],
        hint: "Tương lai hoàn thành: việc xong TRƯỚC mốc kia.",
        explanation:
          "Khuôn “Đến lúc… thì đã…” là cách gọn nhất để diễn tương lai hoàn thành trong tiếng Việt.",
      },
      {
        kind: "order",
        id: "tvt-l3-8",
        sentence: "The department had already approved the budget before the director resigned.",
        chunks: ["Phòng ban đã duyệt ngân sách", "từ trước khi", "giám đốc từ chức"],
        distractors: ["đang duyệt ngân sách", "ngay sau khi"],
        hint: "had + V3 = việc xảy ra trước mốc quá khứ.",
        explanation:
          "“từ trước khi” làm rõ thứ tự hai việc — đây chính là chức năng duy nhất của quá khứ hoàn thành.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "tvt-l4-1",
        sentence: "Our branch in Hue has been open since March.",
        draft: "Chi nhánh Huế của chúng tôi mở cửa ___ tháng 3 ___.",
        blanks: [
          { options: ["từ", "vào", "trước"], correct: 0, note: "since + mốc = từ lúc đó." },
          {
            options: ["đến giờ", "rồi thôi", "và đã đóng"],
            correct: 0,
            note: "Hiện tại hoàn thành = vẫn còn mở tới hiện tại. Thiếu “đến giờ” là câu bị hiểu thành đã đóng.",
          },
        ],
        explanation:
          "Khuôn “từ… đến giờ” là cách dịch an toàn nhất cho since + hiện tại hoàn thành.",
      },
      {
        kind: "repair",
        id: "tvt-l4-2",
        sentence: "The equipment was delivered yesterday afternoon.",
        draft: "Thiết bị ___ giao vào chiều hôm qua.",
        blanks: [
          {
            options: ["đã được", "sẽ được", "đang được"],
            correct: 0,
            note: "Mốc quá khứ rõ ràng (chiều hôm qua) nên “đã” là bắt buộc, không thừa.",
          },
        ],
        explanation:
          "Nguyên tắc: có mốc quá khứ cụ thể thì dùng “đã”; không có mốc mà việc còn tiếp diễn thì đừng dùng.",
      },
      {
        kind: "repair",
        id: "tvt-l4-3",
        sentence: "Applications close on June 15, so submit yours before then.",
        draft: "Hạn nộp hồ sơ ___ ngày 15 tháng 6, nên hãy nộp ___ đó.",
        blanks: [
          {
            options: ["là", "đã là", "sẽ đang là"],
            correct: 0,
            note: "Thông báo lịch — tiếng Việt để trần, không cần dấu thì.",
          },
          {
            options: ["trước ngày", "vào đúng ngày", "sau ngày"],
            correct: 0,
            note: "before then = trước mốc đó.",
          },
        ],
        explanation:
          "Câu thông báo hạn chót gần như luôn dùng hiện tại đơn trong tiếng Anh và động từ trần trong tiếng Việt.",
      },
      {
        kind: "repair",
        id: "tvt-l4-4",
        sentence: "I had already left the office when your message came in.",
        draft: "Tôi ___ rời văn phòng ___ tin nhắn của anh tới.",
        blanks: [
          {
            options: ["đã", "đang", "sắp"],
            correct: 0,
            note: "had left = việc xảy ra trước mốc quá khứ kia.",
          },
          {
            options: ["từ trước khi", "ngay sau khi", "đúng lúc"],
            correct: 0,
            note: "Quá khứ hoàn thành đặt việc này TRƯỚC việc kia.",
          },
        ],
        explanation:
          "Hai chỗ trống cùng phục vụ một việc: đánh dấu thứ tự. Sai một trong hai là đảo lộn diễn biến.",
      },
      {
        kind: "repair",
        id: "tvt-l4-5",
        sentence: "We are launching the new app next Tuesday.",
        draft: "Chúng tôi ___ ra mắt ứng dụng mới vào thứ Ba tuần tới.",
        blanks: [
          {
            options: ["sẽ", "đang", "đã"],
            correct: 0,
            note: "Hiện tại tiếp diễn + mốc tương lai = kế hoạch đã chốt, tiếng Việt dùng “sẽ”.",
          },
        ],
        explanation:
          "Đây là bẫy hay gặp: thấy “are + V-ing” là dịch “đang”. Nhưng khi có mốc tương lai thì nó là kế hoạch, không phải việc đang diễn ra.",
      },
      {
        kind: "repair",
        id: "tvt-l4-6",
        sentence: "The supplier has not responded to our inquiry yet.",
        draft: "Nhà cung cấp ___ trả lời thư hỏi của chúng tôi.",
        blanks: [
          {
            options: ["vẫn chưa", "đã không", "sẽ không"],
            correct: 0,
            note: "not… yet = chưa, và vẫn còn khả năng sẽ trả lời. “đã không” là phủ định dứt khoát, sai sắc thái.",
          },
        ],
        explanation:
          "yet là chữ nhỏ nhưng đổi hẳn thái độ: “chưa” còn chờ đợi, “không” là đóng cửa.",
      },
      {
        kind: "repair",
        id: "tvt-l4-7",
        sentence: "Ms. Farah will have retired by the time the merger is complete.",
        draft: "___ thương vụ sáp nhập hoàn tất ___ bà Farah đã nghỉ hưu.",
        blanks: [
          {
            options: ["Đến lúc", "Ngay sau khi", "Trước khi"],
            correct: 0,
            note: "by the time = đến lúc mà.",
          },
          {
            options: ["thì", "và", "nhưng"],
            correct: 0,
            note: "Khuôn “Đến lúc… thì…” là cặp cố định trong tiếng Việt.",
          },
        ],
        explanation:
          "Tương lai hoàn thành nghe phức tạp nhưng chỉ cần một khuôn duy nhất: “Đến lúc X thì Y đã xong”.",
      },
      {
        kind: "repair",
        id: "tvt-l4-8",
        sentence: "Sales have been declining for three consecutive quarters.",
        draft: "Doanh số ___ giảm ___ ba quý liên tiếp.",
        blanks: [
          {
            options: ["liên tục", "đã từng", "sắp"],
            correct: 0,
            note: "Hiện tại hoàn thành tiếp diễn = kéo dài tới hiện tại và còn đang tiếp tục.",
          },
          {
            options: ["suốt", "vào", "kể từ sau"],
            correct: 0,
            note: "for + khoảng thời gian = suốt bấy lâu.",
          },
        ],
        explanation:
          "Câu này là tin xấu đang tiếp diễn. Dịch thành “đã từng giảm” là biến nó thành chuyện đã qua — sai hẳn mức độ nghiêm trọng.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "tvt-l5-1",
        source:
          "Ms. Nakamura has led the design team since the Osaka office opened in 2021.",
        model:
          "Bà Nakamura phụ trách nhóm thiết kế từ khi văn phòng Osaka mở cửa năm 2021 đến nay.",
        focus:
          "since + hiện tại hoàn thành: việc vẫn tiếp diễn. Tránh chữ “đã” vì nó gợi ý bà ấy đã thôi phụ trách.",
        keyPoints: [
          "bà Nakamura phụ trách/dẫn dắt nhóm thiết kế",
          "từ khi văn phòng Osaka mở cửa",
          "năm 2021",
          "và vẫn đang phụ trách (đến nay/tới giờ)",
        ],
      },
      {
        kind: "free",
        id: "tvt-l5-2",
        source:
          "By the time you receive this letter, your replacement card will have been mailed.",
        model:
          "Đến lúc quý khách nhận được thư này thì thẻ thay thế đã được gửi đi rồi.",
        focus:
          "By the time + tương lai hoàn thành. Khuôn tiếng Việt: “Đến lúc… thì… đã… rồi”.",
        keyPoints: [
          "đến lúc quý khách nhận được thư này",
          "thẻ thay thế",
          "đã được gửi đi rồi",
        ],
      },
      {
        kind: "free",
        id: "tvt-l5-3",
        source:
          "We had already ordered the replacement part when the manufacturer announced the recall.",
        model:
          "Chúng tôi đã đặt linh kiện thay thế từ trước khi nhà sản xuất công bố lệnh thu hồi.",
        focus:
          "Quá khứ hoàn thành đánh dấu thứ tự: đặt hàng TRƯỚC, công bố thu hồi SAU. Dịch sai thứ tự là hỏng cả tình huống.",
        keyPoints: [
          "đã đặt linh kiện thay thế",
          "từ trước khi",
          "nhà sản xuất công bố thu hồi",
        ],
      },
      {
        kind: "free",
        id: "tvt-l5-4",
        source:
          "The maintenance crew is arriving at 7 A.M. tomorrow, so please clear your desk tonight.",
        model:
          "Sáng mai đội bảo trì sẽ tới lúc 7 giờ, nên tối nay mọi người dọn bàn làm việc giúp nhé.",
        focus:
          "“is arriving” + mốc tương lai = kế hoạch đã chốt, dịch là “sẽ”, KHÔNG dịch là “đang”.",
        keyPoints: [
          "đội bảo trì sẽ tới lúc 7 giờ sáng mai",
          "nên/vì vậy",
          "dọn bàn làm việc tối nay",
        ],
      },
      {
        kind: "free",
        id: "tvt-l5-5",
        source:
          "Customers have been reporting login problems since the update was released last week.",
        model:
          "Từ khi bản cập nhật ra mắt tuần trước, khách hàng liên tục báo lỗi đăng nhập.",
        focus:
          "Hiện tại hoàn thành tiếp diễn = vẫn đang xảy ra, và “liên tục” diễn được mức độ lặp lại. Đừng dịch thành “đã báo”.",
        keyPoints: [
          "từ khi bản cập nhật ra mắt tuần trước",
          "khách hàng liên tục/vẫn đang báo",
          "lỗi đăng nhập",
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
        id: "tvt-l6-1",
        source:
          "Dear Ms. Kowalski,\n\nWe have been trying to reach you regarding your account since March 3. Our records show that the annual fee has not been paid yet. If we do not hear from you by March 20, the account will be suspended. Once suspended, an account can be reactivated, but a small processing charge applies.",
        model:
          "Kính gửi bà Kowalski,\n\nChúng tôi đã liên hệ với bà về tài khoản từ ngày 3 tháng 3 tới nay mà chưa được. Theo hồ sơ của chúng tôi, phí thường niên vẫn chưa được thanh toán. Nếu tới ngày 20 tháng 3 mà vẫn chưa nhận được phản hồi của bà, tài khoản sẽ bị tạm khoá. Tài khoản đã bị khoá vẫn mở lại được, nhưng sẽ phải trả một khoản phí xử lý nhỏ.",
        focus:
          "“have been trying… since” (kéo dài tới giờ, hàm ý sốt ruột), “has not been paid yet” (chưa, chứ không phải không), “by March 20” (chậm nhất là), và câu cuối là trấn an chứ không phải doạ.",
        keyPoints: [
          "đã liên hệ từ 3/3 tới nay mà chưa được",
          "phí thường niên vẫn chưa thanh toán",
          "nếu tới 20/3 không có phản hồi thì tài khoản bị tạm khoá",
          "khoá rồi vẫn mở lại được nhưng mất phí xử lý",
        ],
        comprehension: {
          question: "Tài khoản bị tạm khoá rồi thì sao?",
          options: [
            "Mất vĩnh viễn, phải mở tài khoản mới.",
            "Mở lại được nhưng phải trả thêm một khoản phí.",
            "Tự động mở lại khi đóng phí thường niên.",
          ],
          correct: 1,
          explanation:
            "“can be reactivated, but a small processing charge applies” — chữ “but” là bản lề. Đọc lướt qua nó là mất nửa thông tin.",
        },
      },
      {
        kind: "free",
        id: "tvt-l6-2",
        source:
          "NOTICE: Cafeteria Renovation\n\nThe cafeteria has been closed since Monday for floor repairs. Work was originally expected to finish this Friday, but the contractor has run into a supply delay. We now expect to reopen on Wednesday of next week. Until then, the vending area on the third floor is open twenty-four hours.",
        model:
          "THÔNG BÁO: Cải tạo căng tin\n\nCăng tin đóng cửa từ thứ Hai tới nay để sửa sàn. Ban đầu công việc dự kiến xong vào thứ Sáu tuần này, nhưng nhà thầu gặp chậm trễ về vật tư. Hiện chúng tôi dự kiến mở lại vào thứ Tư tuần sau. Từ giờ tới lúc đó, khu máy bán hàng tự động ở tầng 3 mở suốt 24 giờ.",
        focus:
          "“has been closed since” (vẫn đang đóng), “was originally expected” (dự kiến ban đầu — nay đã đổi), “now expect” (mốc mới). Ba mốc thời gian chồng nhau: kế hoạch cũ, thực tế, kế hoạch mới.",
        keyPoints: [
          "căng tin đóng cửa từ thứ Hai để sửa sàn",
          "ban đầu dự kiến xong thứ Sáu tuần này",
          "nhưng nhà thầu chậm vật tư",
          "nay dự kiến mở lại thứ Tư tuần sau",
          "trong lúc đó dùng khu máy bán hàng tầng 3, mở 24 giờ",
        ],
        comprehension: {
          question: "Căng tin dự kiến mở lại khi nào?",
          options: [
            "Thứ Sáu tuần này, đúng kế hoạch ban đầu.",
            "Thứ Tư tuần sau.",
            "Thứ Hai tuần sau, tròn hai tuần đóng cửa.",
          ],
          correct: 1,
          explanation:
            "Đoạn văn cố tình nêu mốc cũ (thứ Sáu) trước mốc mới (thứ Tư tuần sau). Part 7 rất hay bẫy bằng mốc đã bị thay thế.",
        },
      },
      {
        kind: "free",
        id: "tvt-l6-3",
        source:
          "Hi Tomas,\n\nI had been planning to present the Q3 figures at Thursday's meeting, but Marcus tells me the finance team will not have closed the books until Friday. Rather than show incomplete numbers, I would like to move my slot to the following week. I will have the full deck ready by then.",
        model:
          "Chào Tomas,\n\nTôi vốn định trình bày số liệu quý 3 trong cuộc họp thứ Năm, nhưng Marcus nói tới thứ Sáu bộ phận tài chính mới chốt sổ xong. Thay vì đưa ra số liệu chưa đầy đủ, tôi muốn dời phần của mình sang tuần kế tiếp. Tới lúc đó tôi sẽ chuẩn bị xong toàn bộ bài trình bày.",
        focus:
          "“had been planning” (định từ trước, nay đổi ý), “will not have closed… until Friday” (tới thứ Sáu mới xong), “by then” (tới lúc đó). Cả ba đều là mốc tương đối, không có ngày cụ thể.",
        keyPoints: [
          "vốn định trình bày số liệu quý 3 ở cuộc họp thứ Năm",
          "nhưng tới thứ Sáu tài chính mới chốt sổ xong",
          "không muốn đưa số liệu chưa đầy đủ",
          "muốn dời sang tuần kế tiếp",
          "tới lúc đó sẽ có đủ bài trình bày",
        ],
        comprehension: {
          question: "Vì sao người viết muốn dời phần trình bày?",
          options: [
            "Vì cuộc họp thứ Năm đã bị huỷ.",
            "Vì số liệu tài chính chưa được chốt trước cuộc họp.",
            "Vì Marcus muốn trình bày trước.",
          ],
          correct: 1,
          explanation:
            "Nguyên nhân nằm ở mốc thời gian: sổ sách chốt vào thứ Sáu, mà họp lại là thứ Năm. Phải nối được hai mốc mới ra câu trả lời.",
        },
      },
    ],
  },
];
