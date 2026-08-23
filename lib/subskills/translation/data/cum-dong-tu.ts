import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 3 — PHRASAL VERB & COLLOCATION CÔNG SỞ
// Nghĩa của cụm KHÔNG cộng dồn từ các thành phần: call + off ≠ gọi + tắt.
// Kỹ năng cốt lõi: nhận ra ranh giới cụm TRƯỚC khi tra từ.
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const cumDongTuLevels: TransLevel[] = [
  // ── L1 — Khoanh vùng cụm ──────────────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "cdgt-l1-1",
        sentence: "The workshop has been called off due to low enrollment.",
        instruction: "Bấm vào CẢ HAI từ tạo thành cụm động từ (động từ + tiểu từ):",
        correctWords: ["called", "off"],
        explanation:
          "call off = huỷ. Tách ra tra từng từ thì “gọi” + “tắt” chẳng ra nghĩa gì. Dịch: “Buổi workshop đã bị huỷ vì quá ít người đăng ký.”",
      },
      {
        kind: "highlight",
        id: "cdgt-l1-2",
        sentence: "Our legal team will look into the matter this week.",
        instruction: "Bấm vào CẢ HAI từ tạo thành cụm động từ:",
        correctWords: ["look", "into"],
        explanation:
          "look into = tìm hiểu, điều tra. Không phải “nhìn vào trong”. Dịch: “Bộ phận pháp chế sẽ xem xét vụ việc này trong tuần.”",
      },
      {
        kind: "highlight",
        id: "cdgt-l1-3",
        sentence: "Please fill out the registration form before Friday.",
        instruction: "Bấm vào CẢ HAI từ tạo thành cụm động từ:",
        correctWords: ["fill", "out"],
        explanation: "fill out = điền (vào biểu mẫu). Ở Anh–Anh còn dùng fill in với nghĩa y hệt.",
      },
      {
        kind: "highlight",
        id: "cdgt-l1-4",
        sentence: "Ms. Okoye will take over the project next month.",
        instruction: "Bấm vào CẢ HAI từ tạo thành cụm động từ:",
        correctWords: ["take", "over"],
        explanation:
          "take over = tiếp quản, nhận bàn giao. Dịch: “Bà Okoye sẽ tiếp quản dự án từ tháng sau.”",
      },
      {
        kind: "highlight",
        id: "cdgt-l1-5",
        sentence: "We had to put off the launch until the software was stable.",
        instruction: "Bấm vào CẢ HAI từ tạo thành cụm động từ:",
        correctWords: ["put", "off"],
        explanation:
          "put off = hoãn lại. Phân biệt với call off = huỷ hẳn: hoãn thì vẫn còn làm, huỷ thì thôi luôn.",
      },
      {
        kind: "highlight",
        id: "cdgt-l1-6",
        sentence: "I will follow up on your request by Tuesday.",
        instruction: "Bấm vào CẢ BA từ tạo thành cụm động từ:",
        correctWords: ["follow", "up", "on"],
        explanation:
          "follow up on = theo sát, xử lý tiếp việc còn dở. Đây là cụm ba từ — rất hay gặp trong email công việc.",
      },
      {
        kind: "highlight",
        id: "cdgt-l1-7",
        sentence: "The company is cutting back on travel expenses this quarter.",
        instruction: "Bấm vào CẢ BA từ tạo thành cụm động từ:",
        correctWords: ["cutting", "back", "on"],
        explanation: "cut back on = cắt giảm. Dịch: “Công ty đang cắt giảm chi phí đi lại trong quý này.”",
      },
      {
        kind: "highlight",
        id: "cdgt-l1-8",
        sentence: "Several employees have signed up for the certification course.",
        instruction: "Bấm vào CẢ BA từ tạo thành cụm động từ:",
        correctWords: ["signed", "up", "for"],
        explanation:
          "sign up for = đăng ký tham gia. Đừng nhầm với sign in (đăng nhập) hay sign off (duyệt/ký chốt).",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "cdgt-l2-1",
        sentence: "The board turned down our budget request.",
        options: [
          "Hội đồng đã quay xuống đề nghị ngân sách của chúng tôi.",
          "Hội đồng đã bác đề nghị ngân sách của chúng tôi.",
          "Hội đồng đã giảm bớt đề nghị ngân sách của chúng tôi.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch tách rời turn + down — vô nghĩa.",
          "Đúng — turn down + đề nghị/lời mời = từ chối, bác bỏ.",
          "turn down đúng là “vặn nhỏ” khi tân ngữ là âm lượng/nhiệt độ, nhưng không phải với một đề nghị.",
        ],
        explanation:
          "Một cụm động từ có thể có nhiều nghĩa, và TÂN NGỮ chọn nghĩa: turn down the volume (vặn nhỏ) vs turn down an offer (từ chối).",
      },
      {
        kind: "compare",
        id: "cdgt-l2-2",
        sentence: "We ran out of printer paper again.",
        options: [
          "Chúng tôi lại chạy ra ngoài lấy giấy in.",
          "Chúng tôi lại hết giấy in rồi.",
          "Chúng tôi lại bỏ chạy khỏi chỗ giấy in.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch tách rời run + out of.",
          "Đúng — run out of = dùng hết, cạn.",
          "Cũng là dịch mặt chữ.",
        ],
        explanation:
          "run out of thuộc nhóm cụm mà không từ thành phần nào gợi được nghĩa cuối cùng — buộc phải học cả cụm.",
      },
      {
        kind: "compare",
        id: "cdgt-l2-3",
        sentence: "Could you go over the contract before we sign it?",
        options: [
          "Anh đi qua chỗ hợp đồng trước khi mình ký được không?",
          "Anh vượt qua hợp đồng trước khi mình ký nhé?",
          "Anh rà lại hợp đồng một lượt trước khi mình ký nhé?",
        ],
        correct: 2,
        optionNotes: [
          "Dịch mặt chữ go + over.",
          "Cũng là dịch mặt chữ, và sai hẳn nghĩa.",
          "Đúng — go over = xem lại kỹ, rà soát từ đầu đến cuối.",
        ],
        explanation:
          "go over gần nghĩa review nhưng nhấn vào việc đi hết một lượt. Trong TOEIC hay gặp ở email trước cuộc họp.",
      },
      {
        kind: "compare",
        id: "cdgt-l2-4",
        sentence: "Please hand in your timesheet by 5 P.M.",
        options: [
          "Vui lòng nộp bảng chấm công trước 5 giờ chiều.",
          "Vui lòng đưa tay vào bảng chấm công trước 5 giờ chiều.",
          "Vui lòng ký tay lên bảng chấm công trước 5 giờ chiều.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — hand in = nộp (bài, đơn, báo cáo). Đồng nghĩa turn in, submit.",
          "Dịch mặt chữ hand + in.",
          "Suy diễn từ chữ “hand” — không có nghĩa này.",
        ],
        explanation:
          "Ba cách nói cùng một việc: hand in / turn in / submit. Đề TOEIC đổi qua đổi lại để thử xem thí sinh có nắm được không.",
      },
      {
        kind: "compare",
        id: "cdgt-l2-5",
        sentence: "The new safety regulations take effect on July 1.",
        options: [
          "Các quy định an toàn mới lấy hiệu quả vào ngày 1 tháng 7.",
          "Các quy định an toàn mới có hiệu lực từ ngày 1 tháng 7.",
          "Các quy định an toàn mới gây ảnh hưởng vào ngày 1 tháng 7.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch tách rời take + effect.",
          "Đúng — take effect = có hiệu lực (đồng nghĩa come into effect, go into effect).",
          "Nhầm effect (hiệu lực) với affect/impact (ảnh hưởng).",
        ],
        explanation:
          "take effect là collocation cố định, không phải phrasal verb — nhưng cùng một nguyên tắc: học cả cụm, đừng tra từng từ.",
      },
      {
        kind: "compare",
        id: "cdgt-l2-6",
        sentence: "I will get back to you once I hear from the supplier.",
        options: [
          "Tôi sẽ quay lại chỗ anh khi nào nghe từ nhà cung cấp.",
          "Tôi sẽ lấy lại cho anh ngay khi nhà cung cấp lên tiếng.",
          "Tôi sẽ phản hồi lại anh ngay khi có tin từ nhà cung cấp.",
        ],
        correct: 2,
        optionNotes: [
          "Dịch mặt chữ get + back to.",
          "Sai hẳn nghĩa cụm.",
          "Đúng — get back to sb = liên hệ lại, trả lời sau; hear from = nhận được tin từ.",
        ],
        explanation:
          "Một câu email ngắn chứa hai cụm: get back to và hear from. Cả hai đều là công thức lặp đi lặp lại trong Part 7.",
      },
      {
        kind: "compare",
        id: "cdgt-l2-7",
        sentence: "The two sides finally reached an agreement.",
        options: [
          "Hai bên cuối cùng đã đạt được thoả thuận.",
          "Hai bên cuối cùng đã với tới một sự đồng ý.",
          "Hai bên cuối cùng đã tiếp cận một thoả thuận.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — reach an agreement = đi tới thoả thuận. Tiếng Việt nói “đạt được”, không nói “với tới”.",
          "Dịch mặt chữ reach.",
          "“Tiếp cận” là mới đến gần, chưa xong việc — sai mức độ.",
        ],
        explanation:
          "Collocation quyết định động từ tiếng Việt: reach an agreement = đạt thoả thuận, nhưng reach a decision = đi đến quyết định.",
      },
      {
        kind: "compare",
        id: "cdgt-l2-8",
        sentence: "We are counting on your team to meet the deadline.",
        options: [
          "Chúng tôi đang đếm trên nhóm của anh để gặp hạn chót.",
          "Chúng tôi tin tưởng nhóm của anh sẽ kịp hạn.",
          "Chúng tôi đang tính toán xem nhóm anh có kịp hạn không.",
        ],
        correct: 1,
        optionNotes: [
          "Dịch mặt chữ cả count on lẫn meet.",
          "Đúng — count on = trông cậy vào; meet the deadline = kịp hạn.",
          "Hiểu count thành “tính toán” — làm mất hẳn sắc thái tin tưởng, giao phó.",
        ],
        explanation:
          "Bản dịch “đang tính toán xem nhóm anh có kịp không” là kiểu sai nguy hiểm nhất: câu vẫn đọc trôi, nhưng thái độ người viết bị đảo từ tin tưởng sang nghi ngờ.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "cdgt-l3-1",
        sentence: "The manager called off the meeting at the last minute.",
        chunks: ["Quản lý đã huỷ cuộc họp", "vào phút chót"],
        distractors: ["đã gọi tắt cuộc họp", "vào phút cuối cùng của giờ"],
        hint: "call off = huỷ.",
        explanation: "at the last minute = vào phút chót, một cụm cố định chỉ sự gấp gáp.",
      },
      {
        kind: "order",
        id: "cdgt-l3-2",
        sentence: "Please drop off the samples at the front desk.",
        chunks: ["Vui lòng gửi mẫu hàng", "tại quầy lễ tân"],
        distractors: ["thả rơi mẫu hàng", "ở bàn phía trước"],
        hint: "drop off = mang tới để lại; front desk = quầy lễ tân.",
        explanation:
          "drop off là để lại đồ/người ở đâu đó rồi đi tiếp. Ngược lại là pick up (ghé lấy).",
      },
      {
        kind: "order",
        id: "cdgt-l3-3",
        sentence: "Our supplier came up with a cheaper alternative.",
        chunks: ["Nhà cung cấp đã nghĩ ra", "một phương án thay thế", "rẻ hơn"],
        distractors: ["đã đi lên cùng với", "một sự luân phiên"],
        hint: "come up with = nghĩ ra, đưa ra được.",
        explanation:
          "alternative ở đây là danh từ “phương án thay thế”, không phải “sự luân phiên”.",
      },
      {
        kind: "order",
        id: "cdgt-l3-4",
        sentence: "Please keep me posted on the shipment status.",
        chunks: ["Vui lòng cập nhật cho tôi", "về tình trạng lô hàng"],
        distractors: ["giữ tôi được đăng lên", "về trạng thái sự vận chuyển"],
        hint: "keep sb posted = báo tin thường xuyên.",
        explanation:
          "keep me posted / keep me informed / keep me in the loop — ba cách nói cùng một việc: cho tôi biết tin.",
      },
      {
        kind: "order",
        id: "cdgt-l3-5",
        sentence: "We had to put off the renovation until spring.",
        chunks: ["Chúng tôi đành hoãn việc cải tạo", "tới mùa xuân"],
        distractors: ["đành đặt xuống việc cải tạo", "cho đến khi mùa xuân"],
        hint: "put off = hoãn.",
        explanation:
          "“had to” mang sắc thái miễn cưỡng — tiếng Việt diễn bằng “đành”, không chỉ là “phải”.",
      },
      {
        kind: "order",
        id: "cdgt-l3-6",
        sentence: "The store will issue a refund within five business days.",
        chunks: ["Cửa hàng sẽ hoàn tiền", "trong vòng năm ngày làm việc"],
        distractors: ["sẽ phát hành một vấn đề", "trong năm ngày kinh doanh"],
        hint: "issue a refund là collocation; business days = ngày làm việc.",
        explanation:
          "issue ở đây là động từ “cấp/phát”, không phải danh từ “vấn đề”: issue a refund, issue a permit, issue a statement.",
      },
      {
        kind: "order",
        id: "cdgt-l3-7",
        sentence: "Mr. Haddad will fill in for Ms. Cruz while she is on leave.",
        chunks: ["Ông Haddad sẽ làm thay bà Cruz", "trong thời gian bà nghỉ phép"],
        distractors: ["sẽ điền vào cho bà Cruz", "trong lúc bà ấy rời đi"],
        hint: "fill in for sb = làm thay; on leave = đang nghỉ phép.",
        explanation:
          "Chú ý fill in for sb (làm thay người) khác fill in a form (điền biểu mẫu). Cùng cụm, khác giới từ, khác nghĩa.",
      },
      {
        kind: "order",
        id: "cdgt-l3-8",
        sentence: "Please look over the attached invoice and let us know if anything is missing.",
        chunks: [
          "Vui lòng xem qua hoá đơn đính kèm",
          "và báo lại cho chúng tôi",
          "nếu thiếu thứ gì",
        ],
        distractors: ["nhìn vượt qua hoá đơn", "nếu có gì bị mất tích"],
        hint: "look over = xem qua; let sb know = báo cho ai biết.",
        explanation:
          "look over là xem lướt để kiểm tra, nhẹ hơn go over (rà kỹ từng phần). Sắc thái khác nhau nên tiếng Việt cũng khác.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "cdgt-l4-1",
        sentence: "The IT department will set up your workstation before Monday.",
        draft: "Phòng IT sẽ ___ chỗ làm việc của bạn trước thứ Hai.",
        blanks: [
          {
            options: ["lắp đặt xong", "đặt lên trên", "dựng đứng"],
            correct: 0,
            note: "set up = lắp đặt, thiết lập sẵn sàng để dùng.",
          },
        ],
        explanation:
          "set up là một trong những cụm gặp nhiều nhất ở TOEIC: set up an account, set up a meeting, set up equipment.",
      },
      {
        kind: "repair",
        id: "cdgt-l4-2",
        sentence: "If we run into any delays, I will let you know right away.",
        draft: "Nếu chúng tôi ___ chậm trễ, tôi sẽ ___ ngay.",
        blanks: [
          {
            options: ["gặp phải", "chạy vào trong", "va vào"],
            correct: 0,
            note: "run into = gặp phải (vấn đề, khó khăn) — cũng có nghĩa “tình cờ gặp ai”.",
          },
          {
            options: ["báo anh biết", "cho phép anh biết", "để anh tự biết"],
            correct: 0,
            note: "let sb know = báo cho ai biết, không phải “cho phép biết”.",
          },
        ],
        explanation:
          "“let you know” bị dịch sai rất nhiều vì chữ “let”. Đây là công thức cố định, nghĩa đơn giản là báo tin.",
      },
      {
        kind: "repair",
        id: "cdgt-l4-3",
        sentence: "The new hires will be brought up to speed during orientation week.",
        draft: "Nhân viên mới sẽ được ___ trong tuần định hướng.",
        blanks: [
          {
            options: [
              "hướng dẫn cho nắm kịp công việc",
              "nâng lên tốc độ cao",
              "đưa lên đúng vận tốc",
            ],
            correct: 0,
            note: "bring sb up to speed = giúp ai nắm bắt kịp tình hình, cập nhật đủ để bắt tay vào việc.",
          },
        ],
        explanation:
          "Đây là thành ngữ công sở. Dịch mặt chữ ra “tốc độ” là sai hoàn toàn — nó không liên quan gì tới nhanh chậm.",
      },
      {
        kind: "repair",
        id: "cdgt-l4-4",
        sentence: "Please hold off on ordering supplies until the budget is approved.",
        draft: "Vui lòng ___ việc đặt vật tư cho tới khi ngân sách ___.",
        blanks: [
          {
            options: ["tạm dừng", "giữ chặt", "bỏ hẳn"],
            correct: 0,
            note: "hold off on = khoan đã, tạm chưa làm. Khác với huỷ hẳn.",
          },
          {
            options: ["được duyệt", "chấp thuận", "tự phê duyệt"],
            correct: 0,
            note: "be approved = được duyệt — tiếng Việt cần chữ “được” vì đây là việc có lợi.",
          },
        ],
        explanation:
          "hold off ≠ call off. Một bên là chờ thêm, một bên là bỏ luôn — nhầm chỗ này là sai hẳn tình huống.",
      },
      {
        kind: "repair",
        id: "cdgt-l4-5",
        sentence: "The convention center can accommodate up to 500 guests.",
        draft: "Trung tâm hội nghị có thể ___ tối đa 500 khách.",
        blanks: [
          {
            options: ["chứa được", "thích nghi với", "ưu ái"],
            correct: 0,
            note: "accommodate + số người = chứa được, đủ chỗ cho. Nghĩa “đáp ứng nguyện vọng” chỉ đúng khi tân ngữ là yêu cầu.",
          },
        ],
        explanation:
          "accommodate a request = đáp ứng yêu cầu; accommodate 500 guests = chứa được 500 khách. Lại là tân ngữ quyết định.",
      },
      {
        kind: "repair",
        id: "cdgt-l4-6",
        sentence: "We would like to extend an offer to Ms. Baptiste.",
        draft: "Chúng tôi muốn ___ cho bà Baptiste.",
        blanks: [
          {
            options: ["gửi lời mời nhận việc", "gia hạn lời đề nghị", "kéo dài một ưu đãi"],
            correct: 0,
            note: "extend an offer = chính thức đưa ra lời mời (thường là mời làm việc). Không phải “gia hạn”.",
          },
        ],
        explanation:
          "extend có nghĩa “gia hạn” (extend a deadline) nhưng cũng có nghĩa “đưa ra, trao” (extend an offer, extend an invitation).",
      },
      {
        kind: "repair",
        id: "cdgt-l4-7",
        sentence: "The airline agreed to waive the change fee for affected passengers.",
        draft: "Hãng bay đồng ý ___ phí đổi vé cho hành khách bị ảnh hưởng.",
        blanks: [
          {
            options: ["miễn", "vẫy tay bỏ qua", "hoãn thu"],
            correct: 0,
            note: "waive a fee = miễn phí đó, không thu nữa. Không phải hoãn thu.",
          },
        ],
        explanation:
          "waive là từ TOEIC rất hay dùng: waive a fee (miễn phí), waive a requirement (bỏ qua điều kiện).",
      },
      {
        kind: "repair",
        id: "cdgt-l4-8",
        sentence: "Our team is looking forward to working with you.",
        draft: "Nhóm chúng tôi ___ được hợp tác cùng quý vị.",
        blanks: [
          {
            options: ["rất mong", "đang nhìn về phía trước để", "đang trông chờ để mà"],
            correct: 0,
            note: "look forward to + V-ing = mong chờ. Tiếng Việt gọn lại thành “rất mong”.",
          },
        ],
        explanation:
          "Đây là câu kết email chuẩn mực. Dịch dài dòng theo mặt chữ sẽ làm câu mất hẳn vẻ lịch sự tự nhiên.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "cdgt-l5-1",
        source:
          "We had to call off the site visit because the contractor ran into permit issues.",
        model:
          "Chúng tôi buộc phải huỷ buổi khảo sát công trường vì nhà thầu gặp vướng mắc về giấy phép.",
        focus:
          "call off = huỷ (không phải hoãn); run into = gặp phải; permit issues = vướng mắc giấy phép.",
        keyPoints: [
          "phải huỷ buổi khảo sát/tham quan công trường",
          "vì/do",
          "nhà thầu gặp vấn đề về giấy phép",
        ],
      },
      {
        kind: "free",
        id: "cdgt-l5-2",
        source:
          "Please go over the attached proposal and get back to me with any concerns by Thursday.",
        model:
          "Anh/chị vui lòng rà lại bản đề xuất đính kèm và phản hồi cho tôi những điểm còn băn khoăn trước thứ Năm.",
        focus:
          "go over = rà soát kỹ; get back to sb = phản hồi lại; concerns = điểm băn khoăn, không phải “sự quan tâm”.",
        keyPoints: [
          "xem/rà lại bản đề xuất đính kèm",
          "phản hồi lại cho tôi",
          "những điểm băn khoăn/thắc mắc",
          "trước thứ Năm",
        ],
      },
      {
        kind: "free",
        id: "cdgt-l5-3",
        source:
          "The airline agreed to waive the rebooking fee, but only for passengers who checked in on time.",
        model:
          "Hãng bay đồng ý miễn phí đổi vé, nhưng chỉ áp dụng cho những hành khách đã làm thủ tục đúng giờ.",
        focus:
          "waive a fee = miễn phí; check in = làm thủ tục; “but only for” là mệnh đề giới hạn điều kiện, phải giữ nguyên sức nặng.",
        keyPoints: [
          "hãng bay đồng ý miễn phí đổi vé",
          "nhưng chỉ dành cho",
          "hành khách đã làm thủ tục đúng giờ",
        ],
      },
      {
        kind: "free",
        id: "cdgt-l5-4",
        source:
          "Ms. Delgado will fill in for the department head while he attends the conference abroad.",
        model:
          "Bà Delgado sẽ đảm nhiệm thay trưởng phòng trong thời gian ông đi dự hội thảo ở nước ngoài.",
        focus:
          "fill in for sb = làm thay tạm thời; attend a conference = dự hội thảo; abroad = ở nước ngoài.",
        keyPoints: [
          "bà Delgado làm thay/đảm nhiệm thay trưởng phòng",
          "trong thời gian ông ấy",
          "đi dự hội thảo ở nước ngoài",
        ],
      },
      {
        kind: "free",
        id: "cdgt-l5-5",
        source:
          "Since we are cutting back on printing costs, please hold off on ordering new toner until next quarter.",
        model:
          "Do đang cắt giảm chi phí in ấn, mong mọi người tạm chưa đặt mua mực in cho tới quý sau.",
        focus:
          "cut back on = cắt giảm; hold off on = tạm chưa làm (không phải huỷ); “Since” đầu câu là “vì/do”, không phải “kể từ khi”.",
        keyPoints: [
          "vì/do đang cắt giảm chi phí in ấn",
          "tạm chưa đặt mua mực in",
          "cho tới quý sau",
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
        id: "cdgt-l6-1",
        source:
          "From: Priya Raman, Operations\nSubject: Warehouse audit\n\nThe audit originally scheduled for March 12 has been pushed back to March 26. Please hold off on reorganizing the storage racks until then, since the auditors need to see the current layout. If you have already started, just leave things as they are and let me know — no need to undo any work.",
        model:
          "Từ: Priya Raman, phòng Vận hành\nChủ đề: Kiểm toán kho\n\nĐợt kiểm tra dự kiến ngày 12/3 đã được lùi sang ngày 26/3. Từ giờ tới lúc đó, mọi người tạm chưa sắp xếp lại các giá kho, vì đoàn kiểm tra cần nhìn đúng cách bố trí hiện tại. Ai đã bắt đầu làm rồi thì cứ để nguyên như vậy và báo lại cho tôi — không cần tháo ra làm lại.",
        focus:
          "push back = lùi lịch; hold off on = tạm chưa làm; leave things as they are = để nguyên; undo = tháo ra làm lại. Chú ý câu cuối trấn an chứ không phải ra lệnh.",
        keyPoints: [
          "đợt kiểm tra lùi từ 12/3 sang 26/3",
          "tạm chưa sắp xếp lại giá kho",
          "vì đoàn kiểm tra cần thấy bố trí hiện tại",
          "ai đã làm rồi thì để nguyên và báo lại",
          "không cần làm lại",
        ],
        comprehension: {
          question: "Người đã bắt đầu sắp xếp lại giá kho nên làm gì?",
          options: [
            "Khôi phục lại nguyên trạng như trước khi làm.",
            "Dừng ở đó, để nguyên hiện trạng và báo cho người gửi.",
            "Làm cho xong trước ngày 26 tháng 3.",
          ],
          correct: 1,
          explanation:
            "“leave things as they are … no need to undo any work” — để nguyên chứ KHÔNG khôi phục. Đáp án “khôi phục lại nguyên trạng” là bẫy dành cho người đọc lướt qua chữ “undo”.",
        },
      },
      {
        kind: "free",
        id: "cdgt-l6-2",
        source:
          "Thank you for signing up for our Premium membership. Your first billing cycle starts today. If you decide the plan is not right for you, you may cancel within thirty days and we will issue a full refund — no questions asked. After that window, cancellations take effect at the end of the current billing cycle.",
        model:
          "Cảm ơn quý khách đã đăng ký gói hội viên Premium. Kỳ thanh toán đầu tiên bắt đầu từ hôm nay. Nếu thấy gói này không phù hợp, quý khách có thể huỷ trong vòng ba mươi ngày và chúng tôi sẽ hoàn lại toàn bộ tiền, không hỏi lý do. Sau thời hạn đó, việc huỷ sẽ chỉ có hiệu lực vào cuối kỳ thanh toán đang dùng.",
        focus:
          "sign up for = đăng ký; issue a refund = hoàn tiền; take effect = có hiệu lực; “no questions asked” là thành ngữ = không cần giải thích lý do.",
        keyPoints: [
          "cảm ơn đã đăng ký gói Premium",
          "kỳ thanh toán đầu bắt đầu hôm nay",
          "huỷ trong 30 ngày thì được hoàn toàn bộ tiền",
          "sau 30 ngày, việc huỷ chỉ có hiệu lực cuối kỳ thanh toán",
        ],
        comprehension: {
          question: "Khách huỷ gói vào ngày thứ 40 thì điều gì xảy ra?",
          options: [
            "Được hoàn toàn bộ tiền như trong 30 ngày đầu.",
            "Không huỷ được cho tới kỳ thanh toán sau.",
            "Vẫn dùng tiếp tới hết kỳ thanh toán hiện tại rồi mới dừng.",
          ],
          correct: 2,
          explanation:
            "“cancellations take effect at the end of the current billing cycle” — huỷ được ngay, nhưng hiệu lực rơi vào cuối kỳ. Không phải là không huỷ được.",
        },
      },
      {
        kind: "free",
        id: "cdgt-l6-3",
        source:
          "Team,\n\nI have looked into the shipping delays we ran into last week. It turns out our forwarder was short-staffed over the holiday. They have brought on two additional drivers and expect to catch up on the backlog by Friday. I will keep you posted if anything changes.",
        model:
          "Gửi cả nhóm,\n\nTôi đã tìm hiểu nguyên nhân của mấy đợt giao hàng chậm mà chúng ta gặp phải tuần trước. Hoá ra bên vận chuyển bị thiếu người trong dịp lễ. Họ đã tuyển thêm hai tài xế và dự kiến giải quyết xong phần hàng tồn trước thứ Sáu. Có gì thay đổi tôi sẽ báo lại ngay.",
        focus:
          "look into = tìm hiểu; run into = gặp phải; it turns out = hoá ra; bring on = tuyển thêm; catch up on = làm bù cho kịp; backlog = phần việc/hàng còn tồn; keep sb posted = báo tin.",
        keyPoints: [
          "đã tìm hiểu nguyên nhân giao hàng chậm tuần trước",
          "hoá ra bên vận chuyển thiếu người dịp lễ",
          "họ đã tuyển thêm hai tài xế",
          "dự kiến xử lý xong hàng tồn trước thứ Sáu",
          "sẽ báo lại nếu có thay đổi",
        ],
        comprehension: {
          question: "Vì sao hàng bị giao chậm?",
          options: [
            "Bên vận chuyển không đủ nhân sự trong kỳ nghỉ lễ.",
            "Công ty đặt hàng muộn hơn thường lệ.",
            "Hai tài xế của bên vận chuyển đã nghỉ việc.",
          ],
          correct: 0,
          explanation:
            "“short-staffed over the holiday” là nguyên nhân. Đáp án nói “hai tài xế đã nghỉ việc” lấy đúng chi tiết nhưng đảo ngược nó — họ được TUYỂN THÊM.",
        },
      },
    ],
  },
];
