const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("E:/toeic-dictation-master/data/reading-exercises-review.json", "utf8")
);

const contextExercises = [
  // Bài 1 — Notice to All Staff
  [
    {
      question:
        "Tại sao nhiều công ty hiện đại chuyển việc đặt văn phòng phẩm từ biểu mẫu giấy sang cổng trực tuyến?",
      options: [
        "Để giảm chi phí in ấn, tăng tốc xử lý và dễ theo dõi / kiểm soát đơn hàng hơn",
        "Vì biểu mẫu giấy đã bị cấm trong các văn phòng hiện đại theo quy định pháp luật",
        "Vì nhà cung cấp văn phòng phẩm không còn chấp nhận đơn hàng bằng giấy nữa",
        "Để bộ phận IT có thêm nhiệm vụ và lý do tồn tại trong cơ cấu công ty",
      ],
      correctIndex: 0,
      feedback:
        'Số hóa quy trình (digitization) giúp doanh nghiệp tiết kiệm chi phí vận hành, rút ngắn thời gian xử lý và có dữ liệu minh bạch — đây là xu hướng phổ biến trong quản trị văn phòng hiện đại (paperless office).',
    },
  ],
  // Bài 2 — The Green Garden
  [
    {
      question:
        'Xu hướng "farm-to-table" phản ánh điều gì về thói quen tiêu dùng hiện đại?',
      options: [
        "Người tiêu dùng ngày càng coi trọng nguồn gốc thực phẩm và sự minh bạch của chuỗi cung ứng",
        "Khách hàng không còn quan tâm đến giá cả mà chỉ quan tâm đến hình thức trình bày",
        "Xu hướng này chỉ phổ biến ở các quốc gia phát triển có nền nông nghiệp mạnh",
        "Nhà nước bắt buộc các nhà hàng phải mua thực phẩm trực tiếp từ nông trại địa phương",
      ],
      correctIndex: 0,
      feedback:
        "Phong trào farm-to-table xuất hiện vì người tiêu dùng ngày càng quan tâm đến an toàn thực phẩm, tác động môi trường và muốn biết rõ thực phẩm đến từ đâu — phản ánh sự thay đổi giá trị tiêu dùng toàn cầu hướng đến sự bền vững.",
    },
  ],
  // Bài 3 — Delayed Shipment
  [
    {
      question:
        'Việc chủ động "cộng $10 vào tài khoản khách hàng" khi đơn hàng bị trễ phản ánh chiến lược kinh doanh gì?',
      options: [
        "Giữ chân khách hàng bằng cách bồi thường chủ động, duy trì lòng tin và giảm tỷ lệ khiếu nại",
        "Công ty bị bắt buộc bồi thường theo luật bảo vệ người tiêu dùng trong mọi trường hợp trễ hàng",
        "Đây là chiến thuật marketing để khuyến khích khách hàng mua thêm trong lần tiếp theo",
        "Công ty muốn tránh phải đền bù số tiền lớn hơn bằng cách bồi thường nhanh một khoản nhỏ",
      ],
      correctIndex: 0,
      feedback:
        'Trong kinh doanh, việc chủ động bồi thường khi xảy ra sự cố được gọi là "service recovery" — nghiên cứu cho thấy khách hàng được xử lý tốt sau sự cố thường trung thành hơn cả khách chưa từng gặp vấn đề.',
    },
  ],
  // Bài 4 — Apex Electronics
  [
    {
      question:
        "Khi một công ty bán lẻ mở rộng sang khu vực trung tâm thành phố lớn, mục tiêu chiến lược thường là gì?",
      options: [
        "Tiếp cận tệp khách hàng đông đúc hơn, tăng độ nhận diện thương hiệu và cạnh tranh vị trí địa lý",
        "Tránh cạnh tranh với các đối thủ đang hoạt động mạnh ở vùng ngoại ô",
        "Thực hiện yêu cầu từ chính quyền địa phương về phát triển thương mại trung tâm",
        "Giảm chi phí thuê mặt bằng so với các khu vực ngoại ô thường đắt hơn",
      ],
      correctIndex: 0,
      feedback:
        "Mở rộng vào metropolitan areas giúp thương hiệu tiếp cận lượng người tiêu dùng lớn, đặc biệt nhóm có thu nhập trung-cao — đây là chiến lược tăng trưởng (growth strategy) phổ biến trong bán lẻ hiện đại.",
    },
  ],
  // Bài 5 — Graphic Designer
  [
    {
      question:
        "Tại sao các công ty sáng tạo thường yêu cầu portfolio thay vì chỉ xem bằng cấp khi tuyển dụng?",
      options: [
        "Bằng cấp chứng minh kiến thức lý thuyết, còn portfolio chứng minh khả năng thực tế và phong cách sáng tạo riêng",
        "Vì bằng cấp thiết kế đồ họa không được công nhận chính thức ở hầu hết các quốc gia",
        "Portfolio nhanh và rẻ hơn để đánh giá so với việc xác minh bằng cấp qua các trường đại học",
        "Luật lao động bắt buộc tất cả vị trí sáng tạo phải nộp portfolio để được tuyển dụng hợp lệ",
      ],
      correctIndex: 0,
      feedback:
        "Trong các ngành sáng tạo, portfolio là bằng chứng trực tiếp về năng lực — tương tự như nguyên tắc \"show, don't tell\". Bằng cấp cho thấy bạn học gì, portfolio cho thấy bạn làm được gì.",
    },
  ],
  // Bài 6 — City Art Museum
  [
    {
      question:
        "Khi một bảo tàng thông báo đóng cửa một khu vực để cải tạo, khách tham quan nên làm gì để có trải nghiệm tốt nhất?",
      options: [
        "Kiểm tra trước thông tin các khu vực mở cửa, điều chỉnh kỳ vọng và lên kế hoạch tham quan phù hợp",
        "Chờ đến khi toàn bộ bảo tàng mở cửa trở lại mới tham quan để có trải nghiệm đầy đủ",
        "Yêu cầu hoàn tiền vé nếu khu vực yêu thích bị đóng cửa trong thời gian cải tạo",
        "Tham quan vào ngày cuối tuần vì bảo tàng thường mở toàn bộ khu vực vào cuối tuần",
      ],
      correctIndex: 0,
      feedback:
        "Trong du lịch và văn hóa, việc tìm hiểu thông tin trước (check schedules, read notices) giúp tránh thất vọng. Renovation thường là dấu hiệu tích cực — bảo tàng đang đầu tư nâng cấp trải nghiệm cho tương lai.",
    },
  ],
  // Bài 7 — Parking Repaving
  [
    {
      question:
        "Việc ban quản lý tòa nhà thông báo trước về việc lát lại bãi đậu xe thể hiện nguyên tắc quản lý nào?",
      options: [
        "Truyền thông chủ động (proactive communication) — giúp người thuê có thời gian sắp xếp và giảm phàn nàn",
        "Đây là yêu cầu pháp lý bắt buộc phải thông báo trong mọi dự án sửa chữa bất động sản",
        "Thông báo trước giúp công ty thi công có thêm nhân lực do người thuê nhà tình nguyện hỗ trợ",
        "Ban quản lý muốn được đánh giá cao về sự minh bạch để tăng tỷ lệ gia hạn hợp đồng",
      ],
      correctIndex: 0,
      feedback:
        "Trong quản lý bất động sản thương mại, thông báo trước (advance notice) là thực hành chuyên nghiệp quan trọng — thể hiện sự tôn trọng người thuê và giảm thiểu gián đoạn hoạt động kinh doanh của họ.",
    },
  ],
  // Bài 8 — Global Technology Summit
  [
    {
      question:
        "Chiến lược \"early-bird discount\" mang lại lợi ích gì cho ban tổ chức hội nghị?",
      options: [
        "Dự báo sớm số lượng người tham dự để lên kế hoạch hậu cần, đồng thời đảm bảo dòng tiền trước sự kiện",
        "Chỉ mang lại lợi ích cho người đăng ký sớm, ban tổ chức không hưởng lợi trực tiếp",
        "Đây là yêu cầu từ nhà tài trợ để đảm bảo số lượng người tham dự tối thiểu theo hợp đồng tài trợ",
        "Ban tổ chức muốn thưởng cho những người có tính kỷ luật và kế hoạch tốt",
      ],
      correctIndex: 0,
      feedback:
        "Early-bird pricing là chiến lược win-win: người đăng ký tiết kiệm tiền; ban tổ chức có cam kết tham dự sớm (giúp lên kế hoạch địa điểm, catering, tài liệu) và có dòng tiền ổn định trước ngày sự kiện.",
    },
  ],
  // Bài 9 — Rescheduled Meeting
  [
    {
      question:
        "Trong môi trường làm việc quốc tế, trợ lý hành chính cần kỹ năng nào để tránh sai sót lịch họp như trong bài?",
      options: [
        "Nhận thức về múi giờ toàn cầu và kỹ năng phối hợp lịch làm việc đa quốc gia",
        "Chỉ cần thành thạo phần mềm lên lịch họp tự động là đủ để tránh mọi xung đột",
        "Cần có kinh nghiệm làm việc thực tế ở ít nhất 3 quốc gia khác nhau trước khi đảm nhận vị trí",
        "Cần biết nhiều ngoại ngữ để giao tiếp trực tiếp với từng khách hàng quốc tế",
      ],
      correctIndex: 0,
      feedback:
        "Kỹ năng quản lý múi giờ (time zone awareness) là kỹ năng thiết yếu trong môi trường làm việc toàn cầu. Các công cụ như World Time Buddy hay tính năng multiple time zones trên lịch điện tử giúp tránh sai sót như trường hợp của Martina.",
    },
  ],
  // Bài 10 — Order Confirmation
  [
    {
      question:
        "Tại sao các công ty thương mại điện tử thường gửi email xác nhận đơn hàng ngay khi khách đặt mua?",
      options: [
        "Xây dựng niềm tin, giúp khách theo dõi tình trạng đơn và giảm lo lắng sau khi thanh toán",
        "Đây là yêu cầu pháp lý bắt buộc của luật thương mại điện tử tại mọi quốc gia",
        "Để nhân viên kho hàng biết có đơn mới và bắt đầu chuẩn bị ngay lập tức",
        "Vì khách hàng thường quên mất đã đặt hàng và cần được nhắc nhở liên tục",
      ],
      correctIndex: 0,
      feedback:
        "Email xác nhận đơn hàng là bước quan trọng trong trải nghiệm khách hàng (customer experience). Nó giảm lo lắng sau khi thanh toán (post-purchase anxiety) và là điểm tiếp xúc (touchpoint) để thương hiệu thể hiện sự chuyên nghiệp.",
    },
  ],
];

data.forEach((passage, i) => {
  passage.context = contextExercises[i] || [];
});

fs.writeFileSync(
  "E:/toeic-dictation-master/data/reading-exercises-review.json",
  JSON.stringify(data, null, 2),
  "utf8"
);
console.log("Done. Added context exercises to all 10 passages.");
