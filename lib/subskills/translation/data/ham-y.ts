import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 11 — HÀM Ý & ĐỌC GIỮA DÒNG
// Câu chữ lịch sự che một hành động khác: từ chối, phàn nàn, nhắc nợ, giục.
// Đây đúng là chỗ mất điểm câu suy luận Part 7 ("What is implied…",
// "What will the writer most likely do next?").
// Kỹ năng cốt lõi: dịch xong rồi hỏi thêm — NGƯỜI VIẾT THỰC RA ĐANG LÀM GÌ?
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const hamYLevels: TransLevel[] = [
  // ── L1 — Nhận diện tín hiệu hàm ý ─────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "hy-l1-1",
        sentence: "We are unable to process your request at this time.",
        instruction: "Bấm vào cụm cho thấy đây thực chất là một lời TỪ CHỐI:",
        correctWords: ["unable", "to"],
        explanation:
          "“are unable to” là công thức từ chối lịch sự. Cụm “at this time” để ngỏ khả năng sau này — nhưng hiện tại thì vẫn là không.",
      },
      {
        kind: "highlight",
        id: "hy-l1-2",
        sentence: "Our records indicate that the balance remains unpaid.",
        instruction: "Bấm vào từ cho thấy đây là lời NHẮC NỢ:",
        correctWords: ["unpaid"],
        explanation:
          "Không có chữ nào là “xin hãy trả tiền”, nhưng “remains unpaid” chính là lời nhắc. Người viết cố ý nói vòng cho lịch sự.",
      },
      {
        kind: "highlight",
        id: "hy-l1-3",
        sentence: "This is the third time we have raised this issue with your team.",
        instruction: "Bấm vào cụm cho thấy người viết đang PHÀN NÀN:",
        correctWords: ["third", "time"],
        explanation:
          "Nêu số lần lặp lại là cách phàn nàn mà không cần dùng từ nặng nào. Dịch bỏ mất “lần thứ ba” là mất hẳn thái độ.",
      },
      {
        kind: "highlight",
        id: "hy-l1-4",
        sentence: "I trust the report will be on my desk by Monday morning.",
        instruction: "Bấm vào từ khiến câu này thành một lời GIỤC, không phải lời tin tưởng:",
        correctWords: ["trust"],
        explanation:
          "“I trust…” nghe như tin tưởng nhưng thực chất là đặt kỳ vọng bắt buộc. Dịch: “Tôi mong sáng thứ Hai là có báo cáo trên bàn.”",
      },
      {
        kind: "highlight",
        id: "hy-l1-5",
        sentence: "While the design is interesting, it does not match our brand guidelines.",
        instruction: "Bấm vào từ báo trước rằng lời khen chỉ là mở đầu cho lời CHÊ:",
        correctWords: ["While"],
        explanation:
          "Vế mở đầu bằng While/Although luôn là lời khen xã giao; đánh giá thật nằm ở vế sau.",
      },
      {
        kind: "highlight",
        id: "hy-l1-6",
        sentence: "We have decided to move forward with another candidate.",
        instruction: "Bấm vào cụm cho thấy ứng viên này KHÔNG được nhận:",
        correctWords: ["another", "candidate"],
        explanation:
          "Không câu nào nói “bạn bị loại”, nhưng chọn người khác nghĩa là vậy. Đây là công thức thư từ chối chuẩn.",
      },
      {
        kind: "highlight",
        id: "hy-l1-7",
        sentence: "Perhaps we could revisit this proposal next quarter.",
        instruction: "Bấm vào từ khiến câu này thành lời HOÃN VÔ THỜI HẠN:",
        correctWords: ["Perhaps"],
        explanation:
          "“Perhaps… next quarter” là cách nói giảm của “không phải bây giờ, và chưa chắc bao giờ”. Rất hay gặp trong biên bản họp.",
      },
      {
        kind: "highlight",
        id: "hy-l1-8",
        sentence: "As mentioned in my previous email, the invoice was due on the 15th.",
        instruction: "Bấm vào cụm cho thấy người viết đang khó chịu vì phải nhắc lại:",
        correctWords: ["As", "mentioned"],
        explanation:
          "“As mentioned in my previous email” là cách nhắc rằng bên kia đã bỏ qua thư trước — lịch sự về chữ nhưng gay gắt về ý.",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "hy-l2-1",
        sentence: "We are unable to process your request at this time.",
        options: [
          "Chúng tôi không có khả năng xử lý yêu cầu của bạn tại thời điểm này.",
          "Rất tiếc, hiện tại chúng tôi chưa thể xử lý yêu cầu của quý khách.",
          "Chúng tôi sẽ xử lý yêu cầu của quý khách sau.",
        ],
        correct: 1,
        optionNotes: [
          "“không có khả năng” nghe như bất lực về năng lực — sai sắc thái, và câu rất cứng.",
          "Đúng — giữ được cả lời từ chối lẫn giọng lịch sự, và chữ “hiện tại” để ngỏ tương lai.",
          "Biến lời từ chối thành lời hứa — người đọc sẽ ngồi chờ vô ích.",
        ],
        explanation:
          "Đây là câu từ chối. Dịch thành lời hứa “sẽ xử lý sau” là loại lỗi gây hậu quả thật nhất trong cả nhóm này.",
      },
      {
        kind: "compare",
        id: "hy-l2-2",
        sentence: "This is the third time we have raised this issue with your team.",
        options: [
          "Đây là lần thứ ba chúng tôi nêu vấn đề này với bên anh.",
          "Chúng tôi có nêu vấn đề này với nhóm của anh vài lần.",
          "Đây là lần thứ ba nhóm của anh nêu vấn đề này.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — giữ nguyên con số, và chính con số đó mang toàn bộ sức nặng của lời phàn nàn.",
          "Làm mờ con số thành “vài lần” — lời phàn nàn nhẹ hẳn đi.",
          "Đảo vai người phàn nàn và người bị phàn nàn.",
        ],
        explanation:
          "Trong văn bản khiếu nại, CON SỐ chính là bằng chứng. Làm tròn hay làm mờ nó là làm yếu lập luận của người viết.",
      },
      {
        kind: "compare",
        id: "hy-l2-3",
        sentence: "While the design is interesting, it does not match our brand guidelines.",
        options: [
          "Thiết kế thú vị và nó không khớp với bộ nhận diện của chúng tôi.",
          "Thiết kế khá thú vị, nhưng chưa bám đúng bộ nhận diện thương hiệu của chúng tôi.",
          "Vì thiết kế thú vị nên nó không hợp bộ nhận diện của chúng tôi.",
        ],
        correct: 1,
        optionNotes: [
          "Thay “nhưng” bằng “và” — mất hẳn sự đối lập, đọc lên thấy vô lý.",
          "Đúng — giữ lời khen xã giao ở vế đầu, đánh giá thật ở vế sau.",
          "Bịa ra quan hệ nhân quả.",
        ],
        explanation:
          "Khuôn “khen trước, chê sau” là cách phản hồi tiêu chuẩn. Trọng tâm luôn nằm ở vế sau chữ “but/while”.",
      },
      {
        kind: "compare",
        id: "hy-l2-4",
        sentence: "I trust the revised figures will reach me before the board meeting.",
        options: [
          "Tôi tin tưởng các con số sửa lại sẽ đến với tôi trước cuộc họp hội đồng.",
          "Tôi mong nhận được số liệu đã sửa trước cuộc họp hội đồng.",
          "Tôi hy vọng anh có thể gửi số liệu nếu kịp trước cuộc họp.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ “trust”, câu nghe ngây thơ trong khi bản gốc là lời giục.",
          "Đúng — “mong” giữ được vừa lịch sự vừa có sức ép.",
          "“nếu kịp” làm mềm quá, biến yêu cầu thành chuyện tuỳ hoàn cảnh.",
        ],
        explanation:
          "“I trust…” trong email cấp trên gửi cấp dưới gần như luôn là một yêu cầu có hạn chót, không phải lời khen ngợi sự đáng tin.",
      },
      {
        kind: "compare",
        id: "hy-l2-5",
        sentence: "Our records indicate that your account remains past due.",
        options: [
          "Hồ sơ của chúng tôi chỉ ra rằng tài khoản của bạn vẫn quá hạn.",
          "Theo ghi nhận của chúng tôi, quý khách vẫn chưa thanh toán khoản đến hạn.",
          "Tài khoản của quý khách đã bị khoá do quá hạn thanh toán.",
        ],
        correct: 1,
        optionNotes: [
          "Không sai nghĩa, nhưng giọng cứng và “chỉ ra rằng” là dịch máy của indicate.",
          "Đúng — nói rõ đây là chuyện chưa trả tiền, giọng vẫn nhã nhặn.",
          "Thêm thông tin không có: đoạn văn không nói tài khoản bị khoá.",
        ],
        explanation:
          "Bản dịch thêm chi tiết “tài khoản đã bị khoá” là lỗi hay gặp khi học sinh suy luận quá đà: hàm ý phải đọc ra, nhưng không được bịa thêm sự kiện.",
      },
      {
        kind: "compare",
        id: "hy-l2-6",
        sentence: "We have decided to move forward with another candidate for this role.",
        options: [
          "Chúng tôi đã quyết định tiến về phía trước với một ứng viên khác cho vai trò này.",
          "Chúng tôi rất tiếc phải báo rằng vị trí này đã chọn được ứng viên khác.",
          "Chúng tôi sẽ xem xét bạn cho một vị trí khác trong tương lai.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ “move forward”, câu vô nghĩa trong tiếng Việt.",
          "Đúng — nói rõ đây là thư từ chối, giữ giọng lịch sự.",
          "Bịa thêm lời hứa về vị trí khác — câu gốc không hề nói vậy.",
        ],
        explanation:
          "move forward with another candidate = thư từ chối. Người đọc cần hiểu ngay mình không được nhận, đừng để họ hiểu lơ lửng.",
      },
      {
        kind: "compare",
        id: "hy-l2-7",
        sentence: "Perhaps we could revisit this proposal in the next fiscal year.",
        options: [
          "Có lẽ chúng ta sẽ xem lại đề xuất này trong năm tài chính tới.",
          "Chúng ta chắc chắn sẽ triển khai đề xuất này vào năm tài chính tới.",
          "Đề xuất này tạm gác lại, có thể năm tài chính sau sẽ tính tiếp.",
        ],
        correct: 2,
        optionNotes: [
          "Sát chữ nhưng không cho người đọc thấy đây thực chất là lời gác lại.",
          "Biến lời hoãn thành cam kết — sai hoàn toàn.",
          "Đúng — nói rõ hiện tại là gác lại, phần tương lai vẫn để ngỏ đúng như bản gốc.",
        ],
        explanation:
          "“Perhaps… next year” trong biên bản họp là cách nói giảm của “không duyệt”. Dịch quá lạc quan là làm người đọc hiểu sai kết quả cuộc họp.",
      },
      {
        kind: "compare",
        id: "hy-l2-8",
        sentence: "As I mentioned in my email last Tuesday, the deposit was due on the 10th.",
        options: [
          "Như tôi đã nói trong email hôm thứ Ba tuần trước, tiền đặt cọc đến hạn ngày mùng 10.",
          "Tôi có đề cập trong một email nào đó rằng tiền cọc đến hạn ngày mùng 10.",
          "Tiền đặt cọc đến hạn vào ngày mùng 10 theo email của tôi.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — giữ nguyên mốc cụ thể “thứ Ba tuần trước”, chính chi tiết đó tạo sức ép.",
          "Làm mờ thành “một email nào đó” — mất hẳn sự nhấn mạnh.",
          "Bỏ cả cấu trúc “Như tôi đã nói”, mất luôn ý trách móc.",
        ],
        explanation:
          "Nhắc lại chính xác ngày gửi thư trước là cách gây sức ép mà vẫn lịch sự. Người dịch phải giữ đúng chi tiết đó.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "hy-l3-1",
        sentence: "Unfortunately, the position has already been filled.",
        chunks: ["Rất tiếc,", "vị trí này đã tuyển được người"],
        distractors: ["Thật không may mắn,", "đã được lấp đầy hoàn toàn"],
        hint: "Đây là thư từ chối — nói rõ là đã có người.",
        explanation:
          "has been filled = đã tuyển được người. “Lấp đầy” là dịch mặt chữ của fill, không dùng cho vị trí công việc.",
      },
      {
        kind: "order",
        id: "hy-l3-2",
        sentence: "We would need to see a significant improvement before renewing the contract.",
        chunks: ["Phải thấy cải thiện rõ rệt,", "chúng tôi mới gia hạn hợp đồng"],
        distractors: ["Chúng tôi sẽ gia hạn hợp đồng,", "rồi mới cần thấy cải thiện"],
        hint: "Đây là lời cảnh báo có điều kiện, không phải lời hứa.",
        explanation:
          "Khuôn “Phải… mới…” của tiếng Việt giữ đúng điều kiện tiên quyết mà câu gốc đặt ra.",
      },
      {
        kind: "order",
        id: "hy-l3-3",
        sentence: "I notice the report has not been uploaded yet.",
        chunks: ["Tôi thấy báo cáo", "vẫn chưa được tải lên"],
        distractors: ["Tôi để ý rằng anh lười", "đã bị xoá mất rồi"],
        hint: "Câu nhắc nhở nhẹ nhàng, không kết tội.",
        explanation:
          "“I notice…” là cách nhắc gián tiếp: nêu sự thật để bên kia tự hiểu phải làm gì. Dịch thêm lời trách là quá tay.",
      },
      {
        kind: "order",
        id: "hy-l3-4",
        sentence: "We appreciate your interest, but the workshop is limited to current members.",
        chunks: ["Cảm ơn bạn đã quan tâm,", "nhưng buổi workshop chỉ dành cho", "hội viên hiện tại"],
        distractors: ["chúng tôi đánh giá cao sự thích thú,", "mở cho tất cả mọi người"],
        hint: "Cảm ơn trước, từ chối sau.",
        explanation:
          "“We appreciate your interest, but…” là khuôn từ chối chuẩn: nửa đầu xã giao, nửa sau mới là nội dung.",
      },
      {
        kind: "order",
        id: "hy-l3-5",
        sentence: "It might be worth checking with Finance before you commit to that budget.",
        chunks: ["Anh nên hỏi bên Tài chính", "trước khi chốt ngân sách đó", "thì hơn"],
        distractors: ["Anh bắt buộc phải xin phép", "sau khi đã chốt xong"],
        hint: "Lời khuyên nhẹ, hàm ý cảnh báo có rủi ro.",
        explanation:
          "“It might be worth…” là cách nhắc khéo rằng có rủi ro, mà không nói thẳng là bạn đang sắp làm sai.",
      },
      {
        kind: "order",
        id: "hy-l3-6",
        sentence: "Several attendees have asked whether the session will start on time.",
        chunks: ["Đã có mấy người tham dự hỏi", "buổi này có bắt đầu đúng giờ không"],
        distractors: ["Không ai quan tâm tới việc", "buổi họp đã bắt đầu muộn"],
        hint: "Nêu câu hỏi của người khác cũng là một cách nhắc.",
        explanation:
          "Người viết mượn lời người khác để nhắc — đây là cách phàn nàn gián tiếp rất phổ biến trong email công việc.",
      },
      {
        kind: "order",
        id: "hy-l3-7",
        sentence: "The quality of the last two shipments has not been what we expected.",
        chunks: ["Chất lượng hai lô hàng gần đây", "chưa đạt như chúng tôi mong đợi"],
        distractors: ["hoàn toàn không thể chấp nhận", "vượt xa mong đợi của chúng tôi"],
        hint: "Phàn nàn nhưng vẫn giữ giọng nhã nhặn.",
        explanation:
          "“has not been what we expected” là lời chê nhẹ. Dịch thành “không thể chấp nhận” là leo thang, sai giọng người viết.",
      },
      {
        kind: "order",
        id: "hy-l3-8",
        sentence: "We will keep your application on file should a suitable role arise.",
        chunks: ["Chúng tôi sẽ lưu hồ sơ của bạn", "nếu có vị trí phù hợp", "sẽ liên hệ lại"],
        distractors: ["chúng tôi cam kết sẽ tuyển bạn", "trong đợt tuyển tiếp theo"],
        hint: "Câu an ủi cuối thư từ chối — không phải lời hứa chắc chắn.",
        explanation:
          "“should a suitable role arise” là điều kiện rất mở. Dịch thành cam kết là cho ứng viên hy vọng sai.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "hy-l4-1",
        sentence: "Thank you for your submission. We will not be pursuing it further.",
        draft: "Cảm ơn bạn đã gửi bài. ___.",
        blanks: [
          {
            options: [
              "Rất tiếc chúng tôi sẽ không chọn bài này",
              "Chúng tôi sẽ không theo đuổi nó xa hơn",
              "Chúng tôi sẽ liên hệ khi có kết quả",
            ],
            correct: 0,
            note: "will not be pursuing it further = quyết định không chọn. Đây là câu chốt của một lời từ chối.",
          },
        ],
        explanation:
          "Bản dịch “sẽ liên hệ khi có kết quả” biến kết quả đã có thành chuyện còn đang chờ — người gửi bài sẽ ngồi đợi một thư không bao giờ tới.",
      },
      {
        kind: "repair",
        id: "hy-l4-2",
        sentence: "I had expected the draft by last Friday.",
        draft: "Tôi ___ nhận được bản thảo ___.",
        blanks: [
          {
            options: ["vốn nghĩ là sẽ", "chắc chắn sẽ", "hy vọng sắp"],
            correct: 0,
            note: "had expected (quá khứ hoàn thành) hàm ý: đã kỳ vọng nhưng thực tế không xảy ra.",
          },
          {
            options: ["từ thứ Sáu tuần trước", "vào thứ Sáu tuần này", "trước cuối tháng"],
            correct: 0,
            note: "by last Friday = chậm nhất là thứ Sáu tuần trước — tức là đã trễ rồi.",
          },
        ],
        explanation:
          "Thì quá khứ hoàn thành ở đây chính là lời trách: “tôi tưởng đã phải có rồi”. Dịch thành thì tương lai là xoá sạch hàm ý.",
      },
      {
        kind: "repair",
        id: "hy-l4-3",
        sentence: "Some of the numbers in section 3 may need another look.",
        draft: "Vài số liệu ở mục 3 ___.",
        blanks: [
          {
            options: [
              "có lẽ nên kiểm tra lại",
              "chắc chắn đã bị tính sai",
              "trông rất đẹp",
            ],
            correct: 0,
            note: "may need another look là cách nói giảm: người viết nghi có lỗi nhưng không muốn quy kết.",
          },
        ],
        explanation:
          "Đây là lời góp ý tế nhị. Dịch thành “chắc chắn sai” là biến một lời nhắc nhẹ thành lời buộc tội.",
      },
      {
        kind: "repair",
        id: "hy-l4-4",
        sentence: "We had hoped to finalize this during today's call.",
        draft: "Chúng tôi ___ chốt được việc này ngay trong buổi gọi hôm nay.",
        blanks: [
          {
            options: ["vốn mong", "chắc chắn sẽ", "không hề muốn"],
            correct: 0,
            note: "had hoped = đã mong nhưng không thành. Câu này ngụ ý thất vọng nhẹ.",
          },
        ],
        explanation:
          "“We had hoped…” gần như luôn kéo theo một chữ “nhưng” ngầm. Người dịch phải để lại dấu vết của sự hụt hẫng đó.",
      },
      {
        kind: "repair",
        id: "hy-l4-5",
        sentence: "Please let me know if you need any help meeting the deadline.",
        draft: "Nếu cần hỗ trợ để ___ thì anh cứ nói nhé.",
        blanks: [
          {
            options: ["kịp hạn", "hoàn thành sớm hơn", "gặp gỡ hạn chót"],
            correct: 0,
            note: "meet the deadline = kịp hạn.",
          },
        ],
        explanation:
          "Câu này nghe là lời đề nghị giúp đỡ, nhưng trong ngữ cảnh sắp trễ hạn thì nó cũng là một lời nhắc rất khéo.",
      },
      {
        kind: "repair",
        id: "hy-l4-6",
        sentence: "The client mentioned that our competitor offers same-day delivery.",
        draft: "Khách có nhắc rằng ___ giao hàng trong ngày.",
        blanks: [
          {
            options: [
              "bên đối thủ của chúng ta có dịch vụ",
              "chúng ta đã hứa sẽ",
              "khách muốn tự đi lấy hàng nên cần",
            ],
            correct: 0,
            note: "Câu chỉ nêu sự thật về đối thủ — nhưng hàm ý là ta đang thua ở điểm đó.",
          },
        ],
        explanation:
          "Nêu một sự thật trung tính để gợi ra sức ép là kiểu hàm ý phổ biến nhất. Dịch đúng chữ là đủ, miễn đừng bịa thêm.",
      },
      {
        kind: "repair",
        id: "hy-l4-7",
        sentence: "We would be happy to discuss this once the outstanding invoice is settled.",
        draft: "Chúng tôi rất sẵn lòng trao đổi tiếp ___ hoá đơn còn nợ ___.",
        blanks: [
          {
            options: ["sau khi", "ngay cả khi", "bất kể"],
            correct: 0,
            note: "once = sau khi, đây là điều kiện tiên quyết.",
          },
          {
            options: ["được thanh toán", "được xoá bỏ", "được gia hạn"],
            correct: 0,
            note: "settled = đã thanh toán xong.",
          },
        ],
        explanation:
          "Câu nghe rất thiện chí nhưng thực chất là điều kiện: chưa trả tiền thì chưa bàn tiếp. Đây là cách đòi nợ lịch sự nhất.",
      },
      {
        kind: "repair",
        id: "hy-l4-8",
        sentence: "That is certainly one approach.",
        draft: "___.",
        blanks: [
          {
            options: [
              "Đó cũng là một hướng, tuy nhiên",
              "Đó chắc chắn là cách tiếp cận đúng đắn",
              "Đó là cách duy nhất khả thi",
            ],
            correct: 0,
            note: "“certainly one approach” là cách nói giảm để tỏ ý không đồng tình — nghe như khen nhưng không phải khen.",
          },
        ],
        explanation:
          "Chữ “one” mới là chìa khoá: “một trong nhiều cách”, tức là chưa hẳn là cách hay. Đây là kiểu phản đối rất tế nhị.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "hy-l5-1",
        source:
          "We appreciate the effort your team has put in, but the current version still does not meet the brief.",
        model:
          "Chúng tôi ghi nhận công sức của nhóm anh, nhưng bản hiện tại vẫn chưa đáp ứng đúng yêu cầu đề ra.",
        focus:
          "Khuôn khen–chê: nửa đầu là xã giao, nửa sau mới là nội dung. Chữ “still” hàm ý đây không phải lần đầu chưa đạt.",
        keyPoints: [
          "ghi nhận công sức của nhóm",
          "nhưng bản hiện tại vẫn chưa đạt",
          "chưa đúng yêu cầu/đề bài",
        ],
      },
      {
        kind: "free",
        id: "hy-l5-2",
        source:
          "This is the second reminder regarding invoice 4471, which was due three weeks ago.",
        model:
          "Đây là lần thứ hai chúng tôi nhắc về hoá đơn 4471 — hoá đơn này đã quá hạn ba tuần.",
        focus:
          "Hai con số (lần thứ hai, ba tuần) chính là sức nặng của lời nhắc nợ. Giữ nguyên, đừng làm mờ.",
        keyPoints: [
          "đây là lần nhắc thứ hai",
          "về hoá đơn 4471",
          "đã quá hạn ba tuần",
        ],
      },
      {
        kind: "free",
        id: "hy-l5-3",
        source:
          "We will keep your résumé on file and contact you should a suitable opening arise.",
        model:
          "Chúng tôi sẽ lưu hồ sơ của bạn và sẽ liên hệ nếu có vị trí phù hợp.",
        focus:
          "Đây là câu an ủi cuối thư từ chối. “should… arise” là điều kiện rất mở — không được dịch thành lời hứa chắc chắn.",
        keyPoints: [
          "sẽ lưu hồ sơ",
          "sẽ liên hệ",
          "nếu/khi có vị trí phù hợp (không chắc chắn)",
        ],
      },
      {
        kind: "free",
        id: "hy-l5-4",
        source:
          "I notice the shared folder still shows last month's figures. Could you confirm which version is current?",
        model:
          "Tôi thấy thư mục dùng chung vẫn đang là số liệu tháng trước. Anh xác nhận giúp bản nào mới nhất được không?",
        focus:
          "Hình thức là câu hỏi, thực chất là lời nhắc cập nhật. Chữ “still” mang ý đáng lẽ phải xong rồi.",
        keyPoints: [
          "thư mục chung vẫn là số liệu tháng trước",
          "đề nghị xác nhận",
          "bản nào là bản mới nhất",
        ],
      },
      {
        kind: "free",
        id: "hy-l5-5",
        source:
          "Given the volume of feedback we received, we have decided to postpone the launch indefinitely.",
        model:
          "Trước lượng phản hồi nhận được, chúng tôi quyết định hoãn buổi ra mắt vô thời hạn.",
        focus:
          "“volume of feedback” nghe trung tính nhưng ở đây hàm ý phản hồi tiêu cực. “indefinitely” là vô thời hạn — nặng hơn hoãn thường.",
        keyPoints: [
          "trước lượng phản hồi nhận được",
          "quyết định hoãn buổi ra mắt",
          "vô thời hạn",
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
        id: "hy-l6-1",
        source:
          "Dear Ms. Solano,\n\nThank you for sending the revised quotation. While the pricing is now closer to our budget, we note that the delivery window has grown from four weeks to seven. Our project schedule was built around the original timeline. Before we proceed, we would need confirmation that the four-week window can still be met.",
        model:
          "Kính gửi bà Solano,\n\nCảm ơn bà đã gửi báo giá đã sửa. Mức giá lần này đã gần với ngân sách của chúng tôi hơn, tuy nhiên chúng tôi thấy thời gian giao hàng đã kéo từ bốn tuần lên bảy tuần. Tiến độ dự án của chúng tôi được xây dựng theo mốc bốn tuần ban đầu. Trước khi tiếp tục, chúng tôi cần bà xác nhận là vẫn giữ được thời hạn bốn tuần.",
        focus:
          "Thư nghe lịch sự nhưng thực chất là ra điều kiện: không giữ được bốn tuần thì không ký. “Before we proceed” là bản lề.",
        keyPoints: [
          "cảm ơn đã gửi báo giá sửa",
          "giá đã gần ngân sách hơn",
          "nhưng thời gian giao tăng từ 4 lên 7 tuần",
          "tiến độ dự án dựa trên mốc 4 tuần",
          "cần xác nhận giữ được 4 tuần thì mới tiếp tục",
        ],
        comprehension: {
          question: "Người viết thực chất đang làm gì?",
          options: [
            "Chấp nhận báo giá mới và xác nhận đơn hàng.",
            "Ra điều kiện: phải giữ được thời hạn bốn tuần thì mới tiếp tục.",
            "Huỷ hợp tác vì thời gian giao hàng quá lâu.",
          ],
          correct: 1,
          explanation:
            "“Before we proceed, we would need confirmation…” — chưa huỷ, cũng chưa đồng ý. Đây là điều kiện tiên quyết.",
        },
      },
      {
        kind: "free",
        id: "hy-l6-2",
        source:
          "Hi team,\n\nI have looked at the draft agenda for Thursday. It is thorough. I do wonder whether nine topics can realistically fit into ninety minutes, especially as items 4 and 7 tend to generate discussion. Perhaps a few could move to the following week. I will leave that to Marco.",
        model:
          "Chào cả nhóm,\n\nTôi đã xem chương trình dự kiến cho thứ Năm. Nội dung khá đầy đủ. Có điều tôi không chắc chín chủ đề có gói gọn được trong chín mươi phút hay không, nhất là mục 4 và mục 7 vốn hay kéo dài tranh luận. Có lẽ nên đẩy bớt vài mục sang tuần sau. Việc đó tôi để Marco quyết.",
        focus:
          "Toàn bộ đoạn là lời chê được gói trong giọng nhẹ nhàng: “It is thorough” (khen xã giao), “I do wonder whether” (nghi ngờ lịch sự), “Perhaps” (đề xuất cắt bớt). Người viết đang nói: chương trình quá tải.",
        keyPoints: [
          "đã xem chương trình thứ Năm, nội dung đầy đủ",
          "nghi ngờ chín chủ đề có vừa 90 phút không",
          "mục 4 và 7 hay kéo dài tranh luận",
          "có lẽ nên chuyển bớt sang tuần sau",
          "để Marco quyết",
        ],
        comprehension: {
          question: "Người viết đánh giá thế nào về chương trình họp?",
          options: [
            "Hài lòng, không cần chỉnh gì.",
            "Cho rằng quá nhiều nội dung so với thời gian.",
            "Cho rằng thiếu nội dung quan trọng.",
          ],
          correct: 1,
          explanation:
            "Không câu nào nói thẳng “quá tải”, nhưng “nine topics… into ninety minutes” cộng với đề xuất dời bớt đã nói hết. Đây đúng kiểu câu hỏi “What does the writer imply”.",
        },
      },
      {
        kind: "free",
        id: "hy-l6-3",
        source:
          "Dear Mr. Whitfield,\n\nThank you for your continued interest in the Grantham property. As you know, we have now received two other offers, both above the asking price. We are, of course, happy to give your client until Friday to respond. After that, we will need to advise the seller to consider the other parties.",
        model:
          "Kính gửi ông Whitfield,\n\nCảm ơn ông vẫn quan tâm tới bất động sản Grantham. Như ông đã biết, hiện chúng tôi đã nhận thêm hai đề nghị mua khác, cả hai đều cao hơn giá chào bán. Tất nhiên chúng tôi sẵn sàng chờ khách của ông trả lời tới hết thứ Sáu. Sau thời điểm đó, chúng tôi sẽ phải khuyên bên bán cân nhắc các bên còn lại.",
        focus:
          "Giọng cực kỳ lịch sự nhưng nội dung là tối hậu thư: có người trả cao hơn, hạn chót là thứ Sáu. “happy to give… until Friday” chính là cách gây sức ép.",
        keyPoints: [
          "cảm ơn vẫn quan tâm tới bất động sản Grantham",
          "đã có hai đề nghị khác, đều cao hơn giá chào",
          "sẵn sàng chờ tới hết thứ Sáu",
          "sau đó sẽ khuyên bên bán xem xét các bên khác",
        ],
        comprehension: {
          question: "Người viết muốn ông Whitfield hiểu điều gì?",
          options: [
            "Cần trả lời trước thứ Sáu, nếu không sẽ mất cơ hội mua.",
            "Bất động sản đã được bán cho người khác.",
            "Giá chào bán sẽ được giảm vào thứ Sáu.",
          ],
          correct: 0,
          explanation:
            "Không câu nào nói “nhanh lên kẻo mất”, nhưng nêu hai đề nghị cao hơn cộng hạn chót thứ Sáu là đủ. Đây là sức ép được gói trong lời lịch sự.",
        },
      },
    ],
  },
];
