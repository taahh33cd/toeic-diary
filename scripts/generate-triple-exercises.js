/**
 * Generate post-reading exercises for triple passages p2-p15.
 * All content hand-crafted from actual passage texts.
 * Run: node scripts/generate-triple-exercises.js
 */
const fs = require("fs");
const FILE = "E:/toeic-dictation-master/data/reading-exercises-all.json";

// ─── Exercise data ────────────────────────────────────────────────────────────
// Format per item: { question, options:[4], correctIndex, feedback }
// Paraphrase question must contain original phrase in double-quotes.
// All paraphrase options: English multi-word phrases, none is the original phrase.
// Vocab options: all Vietnamese.
// Translation question in Vietnamese, options all English.
// Context: all Vietnamese options.

const EXERCISES = {

  // ─── PASSAGE 2 ── Kapoor job-search emails ───────────────────────────────
  2: {
    vocab: [
      {
        question: 'Từ "referral" trong bài có nghĩa là gì?',
        options: ["Lời giới thiệu, sự tiến cử", "Thư từ chối ứng viên", "Hợp đồng thử việc", "Thông báo tuyển dụng"],
        correctIndex: 0,
        feedback: '"Referral" = lời giới thiệu (từ người quen) để ứng tuyển một vị trí.',
      },
      {
        question: 'Từ "criteria" trong bài có nghĩa là gì?',
        options: ["Kết quả đánh giá cuối năm", "Tiêu chí, điều kiện tuyển dụng", "Danh sách ứng viên lọt vòng", "Thời gian thử việc quy định"],
        correctIndex: 1,
        feedback: '"Criteria" = tiêu chí, điều kiện (số ít: criterion).',
      },
      {
        question: 'Từ "mentor" trong bài có nghĩa là gì?',
        options: ["Người quản lý trực tiếp", "Khách hàng trọng điểm", "Người cố vấn, người hướng dẫn", "Nhân viên mới được phân công"],
        correctIndex: 2,
        feedback: '"Mentor" = người cố vấn, hướng dẫn và hỗ trợ sự phát triển nghề nghiệp.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"turned down for a position"',
        options: ["offered a higher salary package", "assigned to a different department", "rejected for a job opening", "promoted ahead of schedule"],
        correctIndex: 2,
        feedback: '"Turned down" = bị từ chối; "rejected for a job opening" diễn đạt cùng ý.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"I was impressed with the knowledge you displayed"',
        options: ["I was pleased with the expertise you demonstrated", "I was concerned about your lack of experience", "I was uncertain whether you met our requirements", "I was surprised by your educational credentials"],
        correctIndex: 0,
        feedback: '"Impressed with knowledge displayed" = "pleased with expertise demonstrated" — đều thể hiện ấn tượng tích cực.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"Your experience will be of tremendous value to our team"',
        options: ["Your background requires some improvement before joining", "Your skills may need further assessment by management", "Your experience will greatly benefit our team", "Your qualifications still need to be fully verified"],
        correctIndex: 2,
        feedback: '"Of tremendous value" = "greatly benefit" — đều chỉ lợi ích lớn.',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Cô ấy không đáp ứng được tiêu chí cho công việc đó."',
        options: ["She was not available for the scheduled interview.", "She failed to submit her application before the deadline.", "She did not meet the criteria for the job.", "She decided to withdraw from the hiring process."],
        correctIndex: 2,
        feedback: 'Bản dịch: "She did not meet the criteria for the job."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Giám đốc mời tôi nhận vị trí ngay trong buổi phỏng vấn."',
        options: ["I received a written job offer from the director the following week.", "The director asked me to reapply after completing additional training.", "I was informed of my acceptance through an official letter.", "The director offered me the position during our interview."],
        correctIndex: 3,
        feedback: 'Bản dịch: "The director offered me the position during our interview."',
      },
    ],
    context: [
      {
        question: "Trong tuyển dụng, mục đích chính của 'referral' (lời giới thiệu từ nội bộ) là gì?",
        options: ["Giúp ứng viên được xem xét ưu tiên hơn nhờ sự tin tưởng từ người trong công ty", "Thay thế hoàn toàn cho vòng phỏng vấn chính thức", "Đảm bảo ứng viên nhận được mức lương cao hơn mức thị trường", "Yêu cầu ứng viên bỏ qua bước nộp hồ sơ trực tuyến"],
        correctIndex: 0,
        feedback: "Referral giúp ứng viên được chú ý sớm hơn, nhưng vẫn phải trải qua quy trình tuyển dụng đầy đủ.",
      },
    ],
  },

  // ─── PASSAGE 3 ── Focus group / beverage emails ──────────────────────────
  3: {
    vocab: [
      {
        question: 'Từ "beverage" trong bài có nghĩa là gì?',
        options: ["Thực phẩm đóng gói", "Đồ uống", "Hương liệu thực phẩm", "Nguyên liệu chế biến"],
        correctIndex: 1,
        feedback: '"Beverage" = đồ uống (nước giải khát, nước trái cây, v.v.).',
      },
      {
        question: 'Từ "questionnaire" trong bài có nghĩa là gì?',
        options: ["Buổi thảo luận nhóm", "Báo cáo kết quả thí nghiệm", "Bảng câu hỏi, phiếu khảo sát", "Hợp đồng tham gia nghiên cứu"],
        correctIndex: 2,
        feedback: '"Questionnaire" = bảng câu hỏi dùng để thu thập ý kiến hoặc dữ liệu.',
      },
      {
        question: 'Từ "incorporate" trong bài có nghĩa là gì?',
        options: ["Loại bỏ khỏi", "Tóm tắt lại", "Trình bày trước đám đông", "Đưa vào, kết hợp vào"],
        correctIndex: 3,
        feedback: '"Incorporate" = đưa vào, tích hợp vào một thứ khác.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"design a questionnaire to collect the participants\' feedback"',
        options: ["create a survey form to gather attendees\' opinions", "compile a report based on existing research data", "schedule interviews with each focus group member", "distribute promotional materials to potential customers"],
        correctIndex: 0,
        feedback: '"Design a questionnaire to collect feedback" = "create a survey form to gather opinions".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"incorporate this information into my monthly report"',
        options: ["forward this data to the research department for review", "include this data in my regular monthly summary", "present these findings at the next team meeting", "remove outdated entries from last month\'s report"],
        correctIndex: 1,
        feedback: '"Incorporate information into a report" = "include data in a summary".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"only while supplies last"',
        options: ["available until items sell out", "free of charge for all customers", "subject to terms and conditions", "limited to online purchases only"],
        correctIndex: 0,
        feedback: '"Only while supplies last" = "available until items sell out" — đều chỉ số lượng có hạn.',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"25 trong số 30 người đăng ký đã tham gia thử nghiệm hương vị."',
        options: ["All 30 registered participants completed the taste test successfully.", "25 of the 30 registered participants took the taste test.", "Fewer than half of the participants showed up for the event.", "The taste test attracted 25 new customers to the focus group."],
        correctIndex: 1,
        feedback: 'Bản dịch: "25 of the 30 registered participants took the taste test."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Tôi cần đưa thông tin này vào báo cáo hàng tháng của mình."',
        options: ["I will share this information with the rest of the team.", "I need to present this data at our upcoming meeting.", "I need to incorporate this information into my monthly report.", "I have already submitted the completed report to management."],
        correctIndex: 2,
        feedback: 'Bản dịch: "I need to incorporate this information into my monthly report."',
      },
    ],
    context: [
      {
        question: "Trong nghiên cứu thị trường, 'focus group' (nhóm tập trung) thường được sử dụng để làm gì?",
        options: ["Kiểm tra chất lượng sản phẩm trong nhà máy trước khi xuất xưởng", "Thu thập phản hồi và ý kiến của người tiêu dùng về sản phẩm hoặc dịch vụ", "Huấn luyện nhân viên bán hàng về kỹ năng thuyết phục khách hàng", "Xác định mức giá niêm yết dựa trên chi phí sản xuất"],
        correctIndex: 1,
        feedback: "Focus group là phương pháp nghiên cứu định tính: tập hợp nhóm nhỏ người dùng để thảo luận và đánh giá sản phẩm.",
      },
    ],
  },

  // ─── PASSAGE 4 ── Software training schedule ─────────────────────────────
  4: {
    vocab: [
      {
        question: 'Từ "mandatory" trong bài có nghĩa là gì?',
        options: ["Tự nguyện, không bắt buộc", "Bắt buộc, bắt buộc phải thực hiện", "Tạm thời, có thể thay đổi", "Nâng cao, dành cho chuyên gia"],
        correctIndex: 1,
        feedback: '"Mandatory" = bắt buộc (mọi người đều phải thực hiện).',
      },
      {
        question: 'Từ "upgrade" trong bài có nghĩa là gì?',
        options: ["Sự cố kỹ thuật nghiêm trọng", "Phiên bản phần mềm cũ", "Nâng cấp, cải tiến phiên bản mới hơn", "Quá trình gỡ cài đặt phần mềm"],
        correctIndex: 2,
        feedback: '"Upgrade" = nâng cấp lên phiên bản hoặc tính năng mới hơn.',
      },
      {
        question: 'Cụm "reschedule" trong bài có nghĩa là gì?',
        options: ["Hủy bỏ hoàn toàn một sự kiện", "Tham gia muộn hơn so với kế hoạch", "Thêm một buổi học mới vào lịch trình", "Sắp xếp lại lịch trình vào thời gian khác"],
        correctIndex: 3,
        feedback: '"Reschedule" = dời lịch, sắp xếp lại sang thời điểm khác.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"mandatory training sessions"',
        options: ["optional workshops for interested employees", "required training classes for all staff", "advanced seminars for senior managers only", "informal meetings to discuss software updates"],
        correctIndex: 1,
        feedback: '"Mandatory training sessions" = "required training classes" — đều chỉ đào tạo bắt buộc.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"major upgrades have been made to the software"',
        options: ["the software license has been renewed for another year", "significant improvements were implemented in the program", "a technical issue was identified and reported to IT", "the software has been replaced with a newer product"],
        correctIndex: 1,
        feedback: '"Major upgrades were made" = "significant improvements were implemented".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"I must attend an all-day client meeting on November 22"',
        options: ["I am free on November 22 and can join any session", "I plan to reschedule my client appointment to a later date", "I have a full-day meeting with a client that cannot be moved", "I will be attending the training session remotely that day"],
        correctIndex: 2,
        feedback: '"Must attend an all-day client meeting" = "have a full-day meeting with a client that cannot be moved".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Các buổi đào tạo phần mềm Abacus đều được tổ chức trực tuyến."',
        options: ["The Abacus training sessions were cancelled due to technical issues.", "All Abacus Deepthink training sessions are held online.", "Employees must travel to Building C for the Abacus training.", "The Abacus software training is only available to senior staff."],
        correctIndex: 1,
        feedback: 'Bản dịch: "All Abacus Deepthink training sessions are held online."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Tôi cần tham dự cả hai khóa đào tạo phần mềm."',
        options: ["I have already completed one of the two required training courses.", "I would like to be exempted from the software training requirement.", "I need to attend both software trainings.", "I am only required to complete the Optisafe training this month."],
        correctIndex: 2,
        feedback: 'Bản dịch: "I need to attend both software trainings."',
      },
    ],
    context: [
      {
        question: "Trong công ty, vì sao đào tạo phần mềm nội bộ thường được yêu cầu bắt buộc?",
        options: ["Để nhân viên có thêm bằng cấp chứng nhận từ tổ chức bên ngoài", "Để đảm bảo toàn bộ nhân viên sử dụng thành thạo các công cụ cần thiết cho công việc", "Để thay thế cho các buổi họp nhóm hàng tháng", "Để giúp công ty tiết kiệm chi phí thuê chuyên gia tư vấn"],
        correctIndex: 1,
        feedback: "Đào tạo phần mềm bắt buộc giúp đồng bộ năng lực kỹ thuật và tăng hiệu quả vận hành toàn công ty.",
      },
    ],
  },

  // ─── PASSAGE 5 ── Business Alliance meeting + agenda ─────────────────────
  5: {
    vocab: [
      {
        question: 'Từ "alliance" trong bài có nghĩa là gì?',
        options: ["Chính sách kinh doanh", "Liên minh, tổ chức liên kết", "Chiến dịch quảng cáo", "Hội đồng quản trị"],
        correctIndex: 1,
        feedback: '"Alliance" = liên minh, liên kết giữa các bên cùng chung lợi ích.',
      },
      {
        question: 'Cụm "mission statement" trong bài có nghĩa là gì?',
        options: ["Bản báo cáo tài chính định kỳ", "Tuyên bố sứ mệnh, mục tiêu của tổ chức", "Biên bản họp được lưu trữ chính thức", "Danh sách thành viên đã đăng ký tham gia"],
        correctIndex: 1,
        feedback: '"Mission statement" = tuyên bố sứ mệnh — mô tả mục đích và định hướng của tổ chức.',
      },
      {
        question: 'Từ "initiative" trong bài có nghĩa là gì?',
        options: ["Quy trình phê duyệt nội bộ", "Sáng kiến, kế hoạch hành động mới", "Khoản tài trợ từ chính phủ", "Điều khoản trong hợp đồng"],
        correctIndex: 1,
        feedback: '"Initiative" = sáng kiến hoặc kế hoạch hành động được đề xuất chủ động.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"news about the creation of our Business Alliance is generating interest"',
        options: ["our organization\'s launch is attracting attention from the local community", "the alliance has already secured funding from local businesses", "members have begun promoting the alliance on social media", "the upcoming meeting has been covered by local news outlets"],
        correctIndex: 0,
        feedback: '"Generating interest" = "attracting attention" — đều chỉ sự quan tâm từ cộng đồng.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"save meeting time by doing it beforehand"',
        options: ["schedule a follow-up meeting for a later date", "reduce the duration of the meeting by completing the task in advance", "assign additional staff to help prepare the agenda", "move the item to the end of the meeting agenda"],
        correctIndex: 1,
        feedback: '"Save meeting time by doing it beforehand" = "reduce meeting duration by completing the task in advance".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"We have confirmed the workshop for June 28"',
        options: ["We are still finalizing the arrangements for the June workshop", "We have officially arranged the session for that date", "We plan to hold the workshop sometime in late June", "We are waiting for approval before booking the event space"],
        correctIndex: 1,
        feedback: '"Confirmed the workshop" = "officially arranged the session" — đều nói về việc xác nhận chính thức.',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Nhờ phản hồi của mọi người, lịch trình cuối cùng đã được hoàn thiện."',
        options: ["The meeting was postponed due to a lack of responses from members.", "The final agenda was approved by the committee without changes.", "Thanks to everyone\'s feedback, the final agenda has been completed.", "All members submitted their proposals before the original deadline."],
        correctIndex: 2,
        feedback: 'Bản dịch: "Thanks to everyone\'s feedback, the final agenda has been completed."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Thư viện mở cửa từ 9 giờ sáng và có chỗ để xe miễn phí."',
        options: ["The library charges a small fee for parking on weekdays.", "The library is open from 9 A.M. and has free parking available.", "Parking near the library is limited and must be reserved in advance.", "The library opens at noon and closes by early evening."],
        correctIndex: 1,
        feedback: 'Bản dịch: "The library is open from 9 A.M. and has free parking available."',
      },
    ],
    context: [
      {
        question: "Trong một tổ chức hoặc doanh nghiệp, 'mission statement' (tuyên bố sứ mệnh) thường mô tả điều gì?",
        options: ["Danh sách chi tiết các mục tiêu tài chính trong năm tới", "Mục đích tồn tại, giá trị cốt lõi và định hướng hoạt động của tổ chức", "Quy trình xử lý khiếu nại và phản hồi từ khách hàng", "Kế hoạch marketing và chiến lược truyền thông xã hội"],
        correctIndex: 1,
        feedback: "Mission statement trả lời câu hỏi: tổ chức này tồn tại để làm gì và phục vụ ai.",
      },
    ],
  },

  // ─── PASSAGE 6 ── Elvinna's venue booking ────────────────────────────────
  6: {
    vocab: [
      {
        question: 'Từ "venue" trong bài có nghĩa là gì?',
        options: ["Địa điểm tổ chức sự kiện", "Danh sách khách mời", "Thực đơn tiệc", "Ban tổ chức sự kiện"],
        correctIndex: 0,
        feedback: '"Venue" = địa điểm tổ chức sự kiện (tiệc, hội nghị, đám cưới, v.v.).',
      },
      {
        question: 'Từ "catering" trong bài có nghĩa là gì?',
        options: ["Dịch vụ vệ sinh, dọn dẹp sau tiệc", "Dịch vụ trang trí không gian sự kiện", "Dịch vụ cung cấp thức ăn và đồ uống cho sự kiện", "Dịch vụ âm thanh ánh sáng chuyên nghiệp"],
        correctIndex: 2,
        feedback: '"Catering" = dịch vụ phục vụ ẩm thực (thức ăn & đồ uống) cho sự kiện.',
      },
      {
        question: 'Từ "capacity" trong ngữ cảnh đặt tiệc có nghĩa là gì?',
        options: ["Chi phí thuê địa điểm tính theo giờ", "Số lượng nhân viên phục vụ cần thiết", "Diện tích sàn tính bằng mét vuông", "Sức chứa tối đa của địa điểm"],
        correctIndex: 3,
        feedback: '"Capacity" = sức chứa — số người tối đa mà phòng/địa điểm có thể chứa.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"the ideal venue for your reception or business meeting"',
        options: ["the most affordable option for large corporate events", "a perfect location for hosting gatherings and professional events", "the only facility available near the city centre", "a popular tourist attraction in the Bahamas"],
        correctIndex: 1,
        feedback: '"Ideal venue for reception or business meeting" = "perfect location for hosting gatherings and professional events".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"we need to make a decision quickly"',
        options: ["we should postpone the booking until next quarter", "we must act promptly before the opportunity is gone", "we need to gather more information before committing", "we are still reviewing several alternative locations"],
        correctIndex: 1,
        feedback: '"Make a decision quickly" = "act promptly before the opportunity is gone".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"take advantage of that discount date"',
        options: ["pay the full price to guarantee the reservation", "book on a date that offers a reduced rate", "request a refund for an earlier booking", "ask for a customized pricing package"],
        correctIndex: 1,
        feedback: '"Take advantage of that discount date" = "book on a date that offers a reduced rate".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Thực đơn của họ sẽ phù hợp với sở thích đa dạng của khách mời."',
        options: ["Their catering staff is available for events throughout the year.", "Their menu will suit the various preferences of our expected guests.", "Their venue offers customizable decoration packages for all events.", "Their pricing is competitive compared to other locations in Nassau."],
        correctIndex: 1,
        feedback: 'Bản dịch: "Their menu will suit the various preferences of our expected guests."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Chúng ta cần quyết định nhanh trước khi các nhóm khác đặt trước ngày đó."',
        options: ["We should contact the venue to ask about their cancellation policy.", "We need to make a decision quickly before other parties reserve those dates.", "We must confirm the guest list before finalizing the booking.", "We have already reserved the date and paid the deposit."],
        correctIndex: 1,
        feedback: 'Bản dịch: "We need to make a decision quickly before other parties reserve those dates."',
      },
    ],
    context: [
      {
        question: "Khi đặt địa điểm tổ chức sự kiện lớn, điều nào sau đây thường được ưu tiên xác nhận đầu tiên?",
        options: ["Thiết kế menu thực đơn và lựa chọn nhà thầu trang trí", "Ngày tổ chức và sức chứa của địa điểm", "Danh sách diễn giả và chương trình biểu diễn", "Phương án dự phòng nếu thời tiết xấu"],
        correctIndex: 1,
        feedback: "Ngày tổ chức và sức chứa là hai yếu tố quyết định trước — tất cả chi tiết khác phụ thuộc vào hai yếu tố này.",
      },
    ],
  },

  // ─── PASSAGE 7 ── Train ticket / cardiology conference ────────────────────
  7: {
    vocab: [
      {
        question: 'Cụm "advance purchase" trên vé tàu có nghĩa là gì?',
        options: ["Vé có thể hoàn tiền trong vòng 24 giờ", "Mua vé trước, thường với giá ưu đãi", "Vé hạng nhất với đầy đủ tiện nghi", "Vé không cần đặt chỗ ngồi"],
        correctIndex: 1,
        feedback: '"Advance purchase" = mua trước — thường được giá tốt hơn nhưng có thể không đổi/hoàn được.',
      },
      {
        question: 'Từ "departure" trong bảng lịch tàu có nghĩa là gì?',
        options: ["Điểm đến cuối hành trình", "Số hiệu chuyến tàu", "Thời gian khởi hành", "Thời gian dự kiến đến nơi"],
        correctIndex: 2,
        feedback: '"Departure" = thời điểm khởi hành (tàu/máy bay/xe buýt rời bến).',
      },
      {
        question: 'Từ "duration" trong bảng lịch tàu có nghĩa là gì?',
        options: ["Khoảng cách giữa hai ga tính bằng km", "Thời lượng hành trình từ điểm đi đến điểm đến", "Số lần dừng trung gian trên tuyến đường", "Mức giá áp dụng vào giờ cao điểm"],
        correctIndex: 1,
        feedback: '"Duration" = thời lượng — khoảng thời gian một hành trình kéo dài.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"Return Trip: NOT INCLUDED"',
        options: ["the ticket covers both the outbound and inbound journeys", "the passenger may upgrade to a return ticket at the station", "the fare includes only the one-way journey", "the ticket is valid for multiple trips within one week"],
        correctIndex: 2,
        feedback: '"Return trip not included" = "fare includes only the one-way journey" — chỉ vé một chiều.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"Seat Number: NONE ASSIGNED"',
        options: ["the passenger has a guaranteed reserved seat on the train", "the passenger must purchase a seat upgrade at the platform", "no specific seat has been reserved for this passenger", "the passenger is not permitted to sit in first class"],
        correctIndex: 2,
        feedback: '"None assigned" = "no specific seat has been reserved" — chỗ ngồi tự chọn.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"I am looking forward to the conference"',
        options: ["I am concerned about the schedule of the upcoming event", "I have not yet decided whether to attend the conference", "I am eagerly anticipating the upcoming event", "I plan to present my research findings at the conference"],
        correctIndex: 2,
        feedback: '"Looking forward to" = "eagerly anticipating" — đều thể hiện sự mong chờ.',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Cô ấy có thể tự do chọn chỗ ngồi trên tàu vì không có chỗ nào được chỉ định sẵn."',
        options: ["She must sit in her assigned seat throughout the journey.", "She is not allowed to change seats once the train departs.", "She may freely choose her seat as none has been assigned.", "She needs to confirm her seat selection at the ticket counter."],
        correctIndex: 2,
        feedback: 'Bản dịch: "She may freely choose her seat as none has been assigned."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Tất cả các chuyến tàu trong lịch trình đều đến cùng một điểm đến."',
        options: ["The trains on the schedule depart from different stations.", "All trains listed on the schedule arrive at the same destination.", "Some trains on the schedule make additional stops along the route.", "The schedule only shows trains available on weekdays."],
        correctIndex: 1,
        feedback: 'Bản dịch: "All trains listed on the schedule arrive at the same destination."',
      },
    ],
    context: [
      {
        question: "Trong vé tàu hoặc máy bay, 'ADVANCE PURCHASE fare' thường có đặc điểm gì?",
        options: ["Giá cao hơn vì đảm bảo chỗ ngồi ưu tiên", "Giá rẻ hơn nhưng thường không đổi/hoàn được", "Giá cố định áp dụng cho mọi loại hành khách", "Giá chỉ áp dụng cho vé mua tại quầy trực tiếp"],
        correctIndex: 1,
        feedback: "Advance purchase = mua sớm với giá ưu đãi, đổi lấy tính linh hoạt thấp hơn (khó hoàn/đổi vé).",
      },
    ],
  },

  // ─── PASSAGE 8 ── Office supplies order modification ─────────────────────
  8: {
    vocab: [
      {
        question: 'Cụm "standing order" trong bài có nghĩa là gì?',
        options: ["Đơn đặt hàng khẩn cấp cần giao ngay", "Đơn đặt hàng định kỳ, tự động lặp lại", "Danh sách sản phẩm cần kiểm tra chất lượng", "Yêu cầu hoàn trả hàng hóa không đạt chuẩn"],
        correctIndex: 1,
        feedback: '"Standing order" = đơn hàng định kỳ được thiết lập sẵn và tự động thực hiện theo chu kỳ.',
      },
      {
        question: 'Từ "letterhead" trong bài có nghĩa là gì?',
        options: ["Thư gửi tới giám đốc điều hành", "Bao thư in logo công ty", "Giấy tiêu đề có in logo và thông tin công ty", "Nhãn dán trên hồ sơ tài liệu"],
        correctIndex: 2,
        feedback: '"Letterhead" = giấy tiêu đề công ty — giấy in sẵn logo, địa chỉ và thông tin liên hệ.',
      },
      {
        question: 'Cụm "out of stock" trong bài có nghĩa là gì?',
        options: ["Sản phẩm không còn được sản xuất", "Sản phẩm cần được đặt hàng đặc biệt", "Hết hàng, không còn trong kho", "Sản phẩm đang chờ kiểm tra chất lượng"],
        correctIndex: 2,
        feedback: '"Out of stock" = hết hàng — sản phẩm tạm thời không có sẵn trong kho.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"we would like to modify our usual order"',
        options: ["we want to cancel all future orders with your company", "we are requesting a refund for our most recent delivery", "we would like to make changes to our regular purchase", "we need to delay the delivery date for our next shipment"],
        correctIndex: 2,
        feedback: '"Modify our usual order" = "make changes to our regular purchase".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"we are currently out of the Witeglow whiteboards"',
        options: ["the Witeglow model has been permanently discontinued", "we do not currently have the Witeglow whiteboards in stock", "the Witeglow product is only available in limited quantities", "we are waiting for a price adjustment on the Witeglow boards"],
        correctIndex: 1,
        feedback: '"Currently out of" = "do not currently have in stock" — hết hàng tạm thời.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"we recently hired new attorneys and are preparing additional office spaces"',
        options: ["the firm is relocating its main offices to a new building", "we have taken on new legal staff and are expanding our workspace", "our company has undergone a major management restructuring", "we are renovating the existing offices to improve working conditions"],
        correctIndex: 1,
        feedback: '"Hired new attorneys, preparing additional office spaces" = "taken on new legal staff, expanding our workspace".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Chúng tôi rất vui được đáp ứng các yêu cầu của anh theo đơn đặt hàng."',
        options: ["We are unable to process your order due to a system error.", "We would be happy to accommodate your requests as outlined on your order form.", "We have forwarded your order to our warehouse for immediate processing.", "We need additional information before we can confirm your order."],
        correctIndex: 1,
        feedback: 'Bản dịch: "We would be happy to accommodate your requests as outlined on your order form."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Chúng tôi sẽ cung cấp bảng thay thế với cùng mức giá với sản phẩm Witeglow."',
        options: ["We will offer a full refund for the unavailable Witeglow product.", "We can provide the replacement board at a discounted price.", "We will supply the substitute board at the same price as the Witeglow.", "We will place a back order and ship the Witeglow when it becomes available."],
        correctIndex: 2,
        feedback: 'Bản dịch: "We will supply the substitute board at the same price as the Witeglow."',
      },
    ],
    context: [
      {
        question: "Trong quan hệ B2B (doanh nghiệp với doanh nghiệp), 'standing order' giúp ích cho công ty theo dõi mua hàng như thế nào?",
        options: ["Cho phép công ty thương lượng giá tốt hơn mỗi lần đặt hàng", "Giảm công việc hành chính bằng cách tự động hóa các đơn hàng định kỳ", "Đảm bảo công ty luôn được giao hàng trước các khách hàng khác", "Cho phép trả tiền sau khi đã kiểm tra toàn bộ hàng hóa"],
        correctIndex: 1,
        feedback: "Standing order tự động hóa quy trình — tiết kiệm thời gian và tránh quên đặt hàng cho các nhu cầu thường xuyên.",
      },
    ],
  },

  // ─── PASSAGE 9 ── Office supply sale / return request ────────────────────
  9: {
    vocab: [
      {
        question: 'Cụm "purchasing manager" trong bài có nghĩa là gì?',
        options: ["Nhân viên phụ trách giao hàng", "Giám đốc/quản lý phụ trách mua hàng", "Trưởng phòng chăm sóc khách hàng", "Kế toán trưởng phụ trách thanh toán"],
        correctIndex: 1,
        feedback: '"Purchasing manager" = người quản lý bộ phận mua hàng/thu mua của công ty.',
      },
      {
        question: 'Cụm "bulk discount" trong bài có nghĩa là gì?',
        options: ["Giảm giá áp dụng cho thành viên VIP", "Giảm giá khi mua hàng với số lượng lớn", "Giảm giá trong các đợt khuyến mãi theo mùa", "Giảm giá dành riêng cho khách hàng mới"],
        correctIndex: 1,
        feedback: '"Bulk discount" = chiết khấu khi mua số lượng lớn (thường áp dụng từ một ngưỡng số lượng nhất định).',
      },
      {
        question: 'Cụm "business account" trong bài có nghĩa là gì?',
        options: ["Tài khoản ngân hàng của doanh nghiệp", "Trang mạng xã hội của công ty", "Tài khoản khách hàng doanh nghiệp tại nhà cung cấp", "Hồ sơ đăng ký kinh doanh chính thức"],
        correctIndex: 2,
        feedback: '"Business account" = tài khoản khách hàng doanh nghiệp, thường đi kèm ưu đãi đặc biệt.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"50% off select printers"',
        options: ["printers are free with any qualifying purchase", "half price on certain printer models", "a 50-dollar rebate on all printer purchases", "a free upgrade to a newer printer model"],
        correctIndex: 1,
        feedback: '"50% off" = "half price" — giảm một nửa giá niêm yết.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"you automatically receive a 20 percent discount"',
        options: ["you may apply for a discount by contacting customer service", "a 20 percent reduction is applied to your account without any extra steps", "you will receive a coupon code valid for your next purchase", "you are eligible for a refund of 20 percent of your total order"],
        correctIndex: 1,
        feedback: '"Automatically receive a discount" = "reduction applied without any extra steps".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"only items purchased during the sale qualify for an exchange"',
        options: ["customers may return any product within 30 days of purchase", "products bought at full price are not eligible for a price adjustment", "only sale-period purchases are eligible for the exchange policy", "exchanges are processed within five business days of the request"],
        correctIndex: 2,
        feedback: '"Only items purchased during the sale qualify for an exchange" = "only sale-period purchases are eligible".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Chỉ những mặt hàng mua trong thời gian khuyến mãi mới đủ điều kiện đổi trả."',
        options: ["Customers may return all items regardless of when they were purchased.", "Exchanges are only accepted at the original store of purchase.", "Only items purchased during the sale are eligible for an exchange.", "All sale items are final and cannot be returned or exchanged."],
        correctIndex: 2,
        feedback: 'Bản dịch: "Only items purchased during the sale are eligible for an exchange."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Cô ấy muốn trả hàng, sau đó mua lại chúng vào đợt giảm giá."',
        options: ["She would like to exchange her items for a different product.", "She wants to return the items so she can repurchase them at the sale price.", "She requested a full refund for all items in her recent order.", "She asked to defer her payment until the sale begins."],
        correctIndex: 1,
        feedback: 'Bản dịch: "She wants to return the items so she can repurchase them at the sale price."',
      },
    ],
    context: [
      {
        question: "Trong thương mại B2B, tại sao khách hàng doanh nghiệp thường được hưởng chiết khấu cao hơn khách hàng cá nhân?",
        options: ["Vì doanh nghiệp thường có uy tín tín dụng tốt hơn", "Vì doanh nghiệp mua với số lượng lớn, thường xuyên và ổn định hơn", "Vì doanh nghiệp không chịu thuế tiêu thụ đặc biệt", "Vì các nhà cung cấp muốn thu hút khách hàng doanh nghiệp bằng giá thấp"],
        correctIndex: 1,
        feedback: "Doanh nghiệp thường mua số lượng lớn và đặt hàng định kỳ — đây là lý do chính để nhận chiết khấu ưu đãi.",
      },
    ],
  },

  // ─── PASSAGE 10 ── Creative Tech Conference ──────────────────────────────
  10: {
    vocab: [
      {
        question: 'Từ "keynote address" trong bài có nghĩa là gì?',
        options: ["Bài thuyết trình kỹ thuật chi tiết về một sản phẩm", "Bài phát biểu chính, thường do diễn giả nổi bật nhất trình bày", "Phần giới thiệu ngắn gọn về chương trình hội nghị", "Bài phỏng vấn trực tiếp với người tổ chức hội nghị"],
        correctIndex: 1,
        feedback: '"Keynote address/speech" = bài phát biểu chủ đạo, do nhân vật nổi bật nhất trình bày.',
      },
      {
        question: 'Từ "attendee" trong bài có nghĩa là gì?',
        options: ["Nhà tài trợ của sự kiện", "Người tham dự sự kiện", "Diễn giả được mời", "Ban tổ chức chương trình"],
        correctIndex: 1,
        feedback: '"Attendee" = người tham dự (tham gia) sự kiện, hội nghị.',
      },
      {
        question: 'Từ "entrepreneur" trong bài có nghĩa là gì?',
        options: ["Nhà nghiên cứu học thuật", "Chuyên gia tư vấn công nghệ", "Doanh nhân, người khởi nghiệp", "Nhà đầu tư tài chính"],
        correctIndex: 2,
        feedback: '"Entrepreneur" = doanh nhân khởi nghiệp, người tạo dựng doanh nghiệp từ ý tưởng mới.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"get the name of your business out to our 500+ attendees"',
        options: ["reach out to attendees directly through email marketing", "increase your company\'s visibility among over 500 participants", "distribute your business cards to all conference speakers", "place printed advertisements in the conference programme"],
        correctIndex: 1,
        feedback: '"Get your name out to attendees" = "increase your company\'s visibility among participants".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"a great way to network and stay informed"',
        options: ["a useful opportunity to connect professionally and keep up with industry developments", "the only method available to learn about new technologies in the field", "an exclusive event restricted to registered members of the organization", "a formal requirement for all employees in technology-related roles"],
        correctIndex: 0,
        feedback: '"Network and stay informed" = "connect professionally and keep up with industry developments".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"culminating with a keynote address by Ayana Gonzalez"',
        options: ["starting the day with a welcome speech from the conference founder", "concluding the event with a featured speech by Ayana Gonzalez", "introducing all sponsors before the main presentations begin", "scheduling Ayana Gonzalez as the first speaker of the day"],
        correctIndex: 1,
        feedback: '"Culminating with a keynote address" = "concluding the event with a featured speech".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Đây là cách tuyệt vời để kết nối chuyên môn và cập nhật xu hướng ngành."',
        options: ["This event is mandatory for all employees in technical departments.", "It is a great way to network professionally and stay informed about industry trends.", "This conference is the largest technology event held in the region.", "Attending this event will earn participants a professional certification."],
        correctIndex: 1,
        feedback: 'Bản dịch: "It is a great way to network professionally and stay informed about industry trends."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Nhân viên của công ty nhận được giảm giá cho vé vào cửa."',
        options: ["Employees are required to purchase tickets in advance for the conference.", "All company staff can attend the conference free of charge.", "Our employees receive a discount on tickets to the conference.", "The company will cover the full cost of conference registration."],
        correctIndex: 2,
        feedback: 'Bản dịch: "Our employees receive a discount on tickets to the conference."',
      },
    ],
    context: [
      {
        question: "Trong hội nghị chuyên ngành, lợi ích chính của việc tài trợ (sponsorship) là gì?",
        options: ["Được toàn quyền kiểm soát nội dung chương trình hội nghị", "Tăng độ nhận diện thương hiệu trước đông đảo người tham dự trong ngành", "Miễn phí vé VIP cho toàn bộ nhân viên công ty tài trợ", "Được ưu tiên trình bày sản phẩm trước tất cả các diễn giả khác"],
        correctIndex: 1,
        feedback: "Tài trợ hội nghị giúp thương hiệu tiếp cận trực tiếp với đông đảo khán giả mục tiêu — chuyên gia và doanh nhân trong ngành.",
      },
    ],
  },

  // ─── PASSAGE 11 ── Radio station schedule + job ad ───────────────────────
  11: {
    vocab: [
      {
        question: 'Từ "broadcast" trong bài có nghĩa là gì?',
        options: ["Lịch phát sóng, chương trình truyền thông", "Thu âm trong phòng studio chuyên nghiệp", "Phỏng vấn trực tiếp với khách mời", "Tổng hợp bình luận từ người nghe đài"],
        correctIndex: 0,
        feedback: '"Broadcast" = phát sóng / lịch phát sóng (chương trình được truyền qua đài phát thanh hoặc truyền hình).',
      },
      {
        question: 'Cụm "entry-level position" trong bài có nghĩa là gì?',
        options: ["Vị trí dành cho chuyên gia nhiều năm kinh nghiệm", "Vị trí tạm thời không có hợp đồng dài hạn", "Vị trí đầu vào, phù hợp với người mới bắt đầu sự nghiệp", "Vị trí quản lý cấp thấp nhất trong tổ chức"],
        correctIndex: 2,
        feedback: '"Entry-level" = cấp thấp nhất, phù hợp với người mới ra trường hoặc ít kinh nghiệm.',
      },
      {
        question: 'Từ "interviewee" trong bài có nghĩa là gì?',
        options: ["Người thực hiện phỏng vấn", "Người được phỏng vấn", "Nhà sản xuất chương trình phỏng vấn", "Chuyên gia tư vấn xuất hiện trong chương trình"],
        correctIndex: 1,
        feedback: '"Interviewee" = người được phỏng vấn (ngược với "interviewer" = người phỏng vấn).',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"I turned the dial and the car was filled with music"',
        options: ["I purchased a new car stereo system for better sound quality", "I switched the channel and music immediately played throughout the car", "I turned up the volume to hear the broadcast more clearly", "I connected my phone to the car\'s audio system via Bluetooth"],
        correctIndex: 1,
        feedback: '"Turned the dial" = switched the channel; "filled with music" = music played throughout.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"conducting background research on interviewees"',
        options: ["scheduling appointments with upcoming show guests", "gathering preliminary information about program guests", "editing recorded interviews before they are broadcast", "reviewing listener feedback about recent episodes"],
        correctIndex: 1,
        feedback: '"Conducting background research on interviewees" = "gathering preliminary information about program guests".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"the programming assistant reports to the director of programming"',
        options: ["the assistant manages a team of junior broadcasting staff", "the programming assistant is supervised by the director of programming", "the assistant is responsible for hiring new on-air talent", "the role requires direct communication with radio listeners"],
        correctIndex: 1,
        feedback: '"Reports to" = "is supervised by" — cùng chỉ quan hệ cấp bậc quản lý.',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Đây là vị trí bán thời gian cấp thấp, báo cáo trực tiếp cho giám đốc lập trình."',
        options: ["This is a senior full-time role responsible for managing the programming team.", "This is an entry-level, part-time position that reports to the director of programming.", "This role requires prior experience in radio broadcasting and journalism.", "The successful candidate will be promoted to a full-time position after six months."],
        correctIndex: 1,
        feedback: 'Bản dịch: "This is an entry-level, part-time position that reports to the director of programming."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Tôi vô tình bắt gặp chương trình của các bạn và hoàn toàn bị cuốn hút."',
        options: ["I have been listening to your station for several years and always enjoy it.", "I accidentally came across your program and was completely captivated.", "I heard about your station through a recommendation from a colleague.", "I tuned in to your broadcast while searching for a news update."],
        correctIndex: 1,
        feedback: 'Bản dịch: "I accidentally came across your program and was completely captivated."',
      },
    ],
    context: [
      {
        question: "Trong tuyển dụng, 'entry-level position' (vị trí đầu vào) thường yêu cầu ứng viên có những gì?",
        options: ["Bằng tiến sĩ và ít nhất 10 năm kinh nghiệm trong ngành", "Bằng đại học liên quan và kỹ năng cơ bản phù hợp với công việc", "Kinh nghiệm quản lý nhóm và kỹ năng lãnh đạo", "Chứng chỉ chuyên ngành quốc tế được công nhận toàn cầu"],
        correctIndex: 1,
        feedback: "Entry-level yêu cầu bằng đại học và kỹ năng cơ bản — không đòi hỏi kinh nghiệm dày dặn.",
      },
    ],
  },

  // ─── PASSAGE 12 ── City records request ──────────────────────────────────
  12: {
    vocab: [
      {
        question: 'Từ "portal" trong bài có nghĩa là gì?',
        options: ["Cổng vào tòa nhà hành chính", "Cổng thông tin điện tử, trang web dịch vụ công", "Phần mềm quản lý hồ sơ nội bộ", "Bộ phận tiếp nhận yêu cầu qua điện thoại"],
        correctIndex: 1,
        feedback: '"Portal" (web portal) = cổng thông tin điện tử — nơi người dùng đăng nhập để truy cập dịch vụ.',
      },
      {
        question: 'Cụm "prior to" trong bài có nghĩa là gì?',
        options: ["Ngay sau khi", "Trước khi", "Trong khoảng thời gian", "Thay vì"],
        correctIndex: 1,
        feedback: '"Prior to" = trước khi (mang nghĩa chính thức, trang trọng hơn "before").',
      },
      {
        question: 'Cụm "itemized statement" trong bài có nghĩa là gì?',
        options: ["Hóa đơn tổng hợp không chi tiết theo từng mục", "Bảng kê chi tiết từng khoản mục và số tiền tương ứng", "Thư thông báo phí xử lý yêu cầu", "Biên lai thanh toán đã hoàn tất"],
        correctIndex: 1,
        feedback: '"Itemized statement" = bảng kê chi tiết — liệt kê từng khoản mục cùng số lượng và giá cụ thể.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"all requests must be made through the portal"',
        options: ["visitors may submit requests in person at the front desk", "the online system is the only accepted channel for submitting requests", "requests can be sent by mail or dropped off at the office", "applicants should contact the records department by telephone"],
        correctIndex: 1,
        feedback: '"All requests must be made through the portal" = "the online system is the only accepted channel".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"visitors must sign in prior to entering the building"',
        options: ["guests should wait in the lobby until an escort arrives", "all building visitors are required to register before gaining access", "employees must show their ID badge at all entry points", "visitors need to schedule an appointment at least one day in advance"],
        correctIndex: 1,
        feedback: '"Sign in prior to entering" = "required to register before gaining access".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"inform our firm\'s current work advising the city"',
        options: ["replace the services currently provided by city consultants", "support our company\'s ongoing advisory projects for the city", "publish public findings about city infrastructure planning", "assist residents in filing official complaints with the city"],
        correctIndex: 1,
        feedback: '"Inform our firm\'s work advising the city" = "support our advisory projects for the city".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Tất cả các yêu cầu phải được nộp qua cổng thông tin điện tử."',
        options: ["Requests may be submitted in person or through the online portal.", "The records office accepts requests by mail, phone, or in person.", "All requests must be made through the portal.", "Applicants should email their requests to the records department."],
        correctIndex: 2,
        feedback: 'Bản dịch: "All requests must be made through the portal."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Khách thăm quan phải ký tên vào sổ trước khi vào tòa nhà."',
        options: ["Visitors are encouraged to check in at the front desk upon arrival.", "Visitors must sign in prior to entering this facility.", "All guests must present a valid photo ID to security personnel.", "Building access is restricted to employees and pre-approved visitors only."],
        correctIndex: 1,
        feedback: 'Bản dịch: "Visitors must sign in prior to entering this facility."',
      },
    ],
    context: [
      {
        question: "Tại các cơ quan nhà nước Mỹ, 'public records' (hồ sơ công cộng) theo luật thường bao gồm những loại tài liệu nào?",
        options: ["Hồ sơ y tế cá nhân và thông tin thuế của công dân", "Bản đồ quy hoạch, biên bản họp hội đồng thành phố, giấy phép xây dựng", "Tài liệu mật của các cơ quan an ninh quốc gia", "Hợp đồng nội bộ giữa các phòng ban chính phủ"],
        correctIndex: 1,
        feedback: "Public records là tài liệu do cơ quan nhà nước lập và lưu trữ — công dân có quyền tiếp cận theo Luật Tự do Thông tin.",
      },
    ],
  },

  // ─── PASSAGE 13 ── Actor autobiography / journalist interview ─────────────
  13: {
    vocab: [
      {
        question: 'Từ "autobiography" trong bài có nghĩa là gì?',
        options: ["Tiểu sử do người khác viết về một nhân vật nổi tiếng", "Tự truyện do chính tác giả viết về cuộc đời mình", "Bài phê bình văn học đăng trên tạp chí", "Bộ phim tài liệu về sự nghiệp của một diễn viên"],
        correctIndex: 1,
        feedback: '"Autobiography" = tự truyện — sách do chính tác giả viết kể về cuộc đời của mình.',
      },
      {
        question: 'Cụm "storied career" trong bài có nghĩa là gì?',
        options: ["Sự nghiệp ngắn ngủi nhưng đáng nhớ", "Sự nghiệp gắn liền với nhiều vụ bê bối", "Sự nghiệp lâu dài và rực rỡ, đầy thành tích đáng kể", "Sự nghiệp chưa được công nhận rộng rãi"],
        correctIndex: 2,
        feedback: '"Storied career" = sự nghiệp nổi tiếng, đầy chuyện đáng kể và thành tích đáng nhớ.',
      },
      {
        question: 'Từ "coincidence" trong bài có nghĩa là gì?',
        options: ["Kế hoạch được lên trước có chủ đích", "Sự trùng hợp ngẫu nhiên", "Sự kiện đã được dự báo trước", "Quyết định đơn phương của một bên"],
        correctIndex: 1,
        feedback: '"Coincidence" = sự trùng hợp ngẫu nhiên (không có chủ đích).',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"a storied career as an actor"',
        options: ["a brief but memorable period working in film", "a distinguished and well-known history in acting", "an unusual path from stage to screen performance", "a career that relied heavily on critical recognition"],
        correctIndex: 1,
        feedback: '"Storied career" = "distinguished and well-known history" — đều chỉ sự nghiệp nổi bật.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"I will be visiting his home country to address a journalists\' convention"',
        options: ["I will travel to his birthplace to interview him at his private residence", "I plan to attend a local theatre performance during my upcoming trip", "I am going to his native country to speak at a media conference", "I will be conducting research for a book about Scandinavian cinema"],
        correctIndex: 2,
        feedback: '"Address a journalists\' convention" = "speak at a media conference".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"we need to finalize a few details before the interview"',
        options: ["we are still deciding whether to proceed with the interview", "we want to confirm the remaining arrangements before the meeting", "we will need to reschedule the interview to a later date", "we require additional background information about the journalist"],
        correctIndex: 1,
        feedback: '"Finalize a few details" = "confirm the remaining arrangements".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Cuốn sách cung cấp cái nhìn sâu sắc về sự nghiệp của ông, bắt đầu từ những vai diễn đầu tiên."',
        options: ["The book focuses primarily on the actor\'s personal life and family background.", "The book provides wonderful insight into his career, starting with his first roles.", "The author shares his opinions on the state of modern cinema worldwide.", "The book discusses the challenges of working in the international film industry."],
        correctIndex: 1,
        feedback: 'Bản dịch: "The book provides wonderful insight into his career, starting with his first roles."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Ông ấy rất thích đọc tất cả các bài viết của cô trên tờ Top News U.K."',
        options: ["He is familiar with her work but has not read her recent articles.", "He has agreed to be interviewed exclusively by Top News U.K.", "He enjoys all of her writing for Top News U.K.", "He was introduced to her articles through a mutual colleague."],
        correctIndex: 2,
        feedback: 'Bản dịch: "He enjoys all of her writing for Top News U.K."',
      },
    ],
    context: [
      {
        question: "Trong báo chí, sự khác biệt chính giữa 'autobiography' (tự truyện) và 'biography' (tiểu sử) là gì?",
        options: ["Tự truyện chỉ viết về người nổi tiếng; tiểu sử viết về người thường", "Tự truyện do chính nhân vật viết; tiểu sử do người khác viết về nhân vật đó", "Tự truyện chỉ tập trung vào thành tích nghề nghiệp; tiểu sử kể toàn bộ cuộc đời", "Tự truyện được xuất bản sau khi tác giả qua đời; tiểu sử được viết khi còn sống"],
        correctIndex: 1,
        feedback: "Sự khác biệt cốt lõi: tự truyện = tự mình viết; tiểu sử = người khác viết về mình.",
      },
    ],
  },

  // ─── PASSAGE 14 ── Industrial designer job application ────────────────────
  14: {
    vocab: [
      {
        question: 'Cụm "industrial designer" trong bài có nghĩa là gì?',
        options: ["Kỹ sư vận hành dây chuyền sản xuất công nghiệp", "Nhà thiết kế sản phẩm công nghiệp và tiêu dùng", "Chuyên gia phân tích quy trình sản xuất", "Kiến trúc sư thiết kế nhà xưởng và cơ sở hạ tầng"],
        correctIndex: 1,
        feedback: '"Industrial designer" = nhà thiết kế công nghiệp — thiết kế hình dáng, chức năng và trải nghiệm người dùng của sản phẩm.',
      },
      {
        question: 'Từ "qualification" trong bài có nghĩa là gì?',
        options: ["Kết quả phỏng vấn chính thức", "Thư giới thiệu từ nhà tuyển dụng trước", "Tiêu chuẩn, điều kiện ứng tuyển cần đáp ứng", "Mức lương đề xuất cho vị trí tuyển dụng"],
        correctIndex: 2,
        feedback: '"Qualification" = tiêu chuẩn hoặc điều kiện mà ứng viên cần đáp ứng để được xem xét.',
      },
      {
        question: 'Từ "portfolio" trong ngữ cảnh tuyển dụng thiết kế có nghĩa là gì?',
        options: ["Hồ sơ xin việc bao gồm CV và thư giới thiệu", "Bộ sưu tập tác phẩm minh chứng năng lực thiết kế", "Bản mô tả chi tiết về kinh nghiệm làm việc", "Chứng chỉ hành nghề được cấp bởi hiệp hội thiết kế"],
        correctIndex: 1,
        feedback: '"Portfolio" = hồ sơ tác phẩm — tập hợp các thiết kế đã thực hiện để chứng minh năng lực.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"our hiring committee has reviewed your application"',
        options: ["our recruitment team has examined your submitted documents", "we have forwarded your application to the department manager", "your application has been added to our candidate database", "we have contacted your references for background verification"],
        correctIndex: 0,
        feedback: '"Hiring committee reviewed your application" = "recruitment team examined your submitted documents".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"you meet the qualifications for this position"',
        options: ["your application has been shortlisted for further review", "you fulfil the required criteria for this role", "your background requires additional training before starting", "you are one of several finalists being considered for the job"],
        correctIndex: 1,
        feedback: '"Meet the qualifications" = "fulfil the required criteria" — đều chỉ việc đáp ứng tiêu chuẩn.',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"interviews will be held on-site during the first two weeks of December"',
        options: ["all candidates will be interviewed via video call throughout December", "in-person interviews will take place at our offices in early December", "the interview schedule will be confirmed after the application deadline", "interviews have been postponed to January due to staffing changes"],
        correctIndex: 1,
        feedback: '"Held on-site" = "in-person at our offices"; "first two weeks of December" = "early December".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Ủy ban tuyển dụng đã xem xét hồ sơ của anh và xác nhận anh đáp ứng đủ tiêu chuẩn."',
        options: ["Your application has been placed on a waiting list pending further review.", "Our hiring committee has reviewed your application and determined that you meet the qualifications.", "We regret to inform you that your application was not successful at this time.", "Your application is currently being assessed by our human resources department."],
        correctIndex: 1,
        feedback: 'Bản dịch: "Our hiring committee has reviewed your application and determined that you meet the qualifications."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Vòng phỏng vấn đầu tiên sẽ được tổ chức tại văn phòng trong hai tuần đầu tháng 12."',
        options: ["The first round of interviews will be conducted remotely via video conference.", "First-round interviews will be held on-site during the first two weeks of December.", "Candidates will be notified of their interview schedule by the end of November.", "All interviews will take place over a single day at the company\'s headquarters."],
        correctIndex: 1,
        feedback: 'Bản dịch: "First-round interviews will be held on-site during the first two weeks of December."',
      },
    ],
    context: [
      {
        question: "Trong quy trình tuyển dụng, tại sao nhà tuyển dụng thường yêu cầu nhà thiết kế nộp 'portfolio' (hồ sơ tác phẩm)?",
        options: ["Để kiểm tra ứng viên có tuân thủ bản quyền sở hữu trí tuệ không", "Để đánh giá trực tiếp chất lượng và phong cách thiết kế thực tế của ứng viên", "Để xác minh ứng viên đã hoàn thành chương trình đào tạo chính thức", "Để so sánh giá thành dịch vụ thiết kế với các nhà cung cấp khác"],
        correctIndex: 1,
        feedback: "Portfolio cho thấy năng lực thực tế — quan trọng hơn bằng cấp vì thiết kế là nghề thực hành.",
      },
    ],
  },

  // ─── PASSAGE 15 ── Roofing company / installation schedule ───────────────
  15: {
    vocab: [
      {
        question: 'Từ "shingle" trong bài có nghĩa là gì?',
        options: ["Loại sơn chống thấm dùng cho tường ngoài", "Tấm lợp mái (ngói/tấm lợp hình chữ nhật)", "Vật liệu cách nhiệt dùng bên trong tường", "Hệ thống máng xối thu nước mưa"],
        correctIndex: 1,
        feedback: '"Shingle" = tấm lợp mái — vật liệu lợp mái nhà (thường làm từ nhựa đường, gỗ, hoặc đá phiến).',
      },
      {
        question: 'Từ "deposit" trong bài có nghĩa là gì?',
        options: ["Số tiền còn lại cần thanh toán sau khi hoàn thành công việc", "Tiền đặt cọc thanh toán trước để xác nhận hợp đồng", "Khoản bồi thường trong trường hợp vi phạm hợp đồng", "Phí bảo hiểm công trình bắt buộc phải đóng"],
        correctIndex: 1,
        feedback: '"Deposit" = tiền đặt cọc — khoản thanh toán trước để xác nhận cam kết thực hiện hợp đồng.',
      },
      {
        question: 'Từ "exclusive" trong bài có nghĩa là gì?',
        options: ["Đắt tiền hơn so với các sản phẩm tương đương", "Được cung cấp bởi nhiều nhà thầu trên thị trường", "Độc quyền, chỉ được cung cấp bởi một đơn vị duy nhất", "Mới nhất trên thị trường, chưa được thử nghiệm rộng rãi"],
        correctIndex: 2,
        feedback: '"Exclusive" = độc quyền — chỉ có thể mua hoặc sử dụng qua một nguồn duy nhất.',
      },
    ],
    paraphrase: [
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"this letter is to confirm our agreement to replace your roof"',
        options: ["we are writing to request your approval before starting the project", "this letter serves to verify the terms of our roofing contract", "we would like to provide you with a quote for the roofing work", "this is a reminder to schedule your roof inspection appointment"],
        correctIndex: 1,
        feedback: '"Confirm our agreement" = "verify the terms of our contract".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"guaranteed to keep your house dry"',
        options: ["helps improve the energy efficiency of your home", "ensures protection against water damage and leaks", "provides a decorative finish in a range of color options", "reduces the need for routine maintenance and repairs"],
        correctIndex: 1,
        feedback: '"Keep your house dry" = "ensures protection against water damage and leaks".',
      },
      {
        question: 'Cụm nào diễn đạt cùng ý nghĩa với:\n"be sure to confirm the job location and required materials"',
        options: ["double-check the work site details and the necessary supplies", "contact the client to ask about any last-minute changes", "review the color options with the homeowner before starting", "complete the installation before the scheduled date if possible"],
        correctIndex: 0,
        feedback: '"Confirm job location and required materials" = "double-check the work site and necessary supplies".',
      },
    ],
    translation: [
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Chúng tôi xác nhận thỏa thuận thay thế mái nhà của bạn vào ngày 4 tháng 8."',
        options: ["We are writing to provide a revised estimate for the roofing project.", "We would like to reschedule the roof installation to a date in August.", "This is to confirm our agreement to replace your roof on August 4.", "We confirm that the roofing materials have been ordered and will arrive soon."],
        correctIndex: 2,
        feedback: 'Bản dịch: "This is to confirm our agreement to replace your roof on August 4."',
      },
      {
        question: 'Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"Tôi đã nhận được tiền đặt cọc và hợp đồng đã ký của bạn."',
        options: ["I have reviewed the contract and will send it for your signature.", "I have received your deposit and signed contract.", "I am writing to request the remaining balance for the project.", "I have confirmed the delivery of materials for your roofing project."],
        correctIndex: 1,
        feedback: 'Bản dịch: "I have received your deposit and signed contract."',
      },
    ],
    context: [
      {
        question: "Trong hợp đồng xây dựng hoặc sửa chữa nhà, 'deposit' (tiền đặt cọc) thường có mục đích gì?",
        options: ["Trang trải toàn bộ chi phí vật liệu trước khi bắt đầu công việc", "Đảm bảo cam kết của cả hai bên và hỗ trợ nhà thầu chuẩn bị vật liệu ban đầu", "Thay thế cho việc ký hợp đồng khi hai bên đã tin tưởng nhau", "Được hoàn trả toàn bộ nếu công trình hoàn thành đúng hạn"],
        correctIndex: 1,
        feedback: "Tiền đặt cọc = cam kết hai chiều: khách hàng xác nhận thuê, nhà thầu xác nhận nhận việc và bắt đầu chuẩn bị.",
      },
    ],
  },
};

// ─── Write to reading-exercises-all.json ─────────────────────────────────────
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

let updated = 0;
for (const [oi, exSet] of Object.entries(EXERCISES)) {
  const orderIndex = parseInt(oi);
  const idx = data.findIndex(e => e.type === "triple" && e.orderIndex === orderIndex);
  if (idx === -1) { console.warn(`Not found: triple oi:${oi}`); continue; }
  data[idx].vocab       = exSet.vocab;
  data[idx].paraphrase  = exSet.paraphrase;
  data[idx].translation = exSet.translation;
  data[idx].context     = exSet.context;
  data[idx].approved    = true;
  updated++;
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
console.log(`Updated ${updated} passages in reading-exercises-all.json`);

// Quick stats
const SECS = ["vocab","paraphrase","translation","context"];
const dist = { 0:0, 1:0, 2:0, 3:0 };
data.forEach(p => SECS.forEach(s => (p[s]||[]).forEach(it => dist[it.correctIndex]++)));
const tot = Object.values(dist).reduce((a,b)=>a+b,0);
console.log(`Total items: ${tot} | A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
