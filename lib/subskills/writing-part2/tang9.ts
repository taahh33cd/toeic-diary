// ─────────────────────────────────────
// Tầng 9 — viết thật rồi nộp giáo viên chấm
// Không có bộ test tự chấm: đề thật, đồng hồ 10 phút, checklist tự soi.
// ─────────────────────────────────────

import type { EmailBlock } from "./index";

export type P2ComposeTask = {
  id: string;
  /** Nhãn ngắn hiện ở danh sách đề */
  label: string;
  /** Kiểu mission của đề — giúp người học chọn đúng thứ mình yếu */
  tag: string;
  email: EmailBlock;
  /** Mission tách sẵn từ Directions, dùng làm checklist tự soi trước khi nộp */
  missions: string[];
};

/** Đúng thời gian thật của Q6-7 trong phòng thi */
export const COMPOSE_MINUTES = 10;

/** Mục tự soi áp dụng cho mọi đề — rút ra từ tang7 (đúng loại) và tang8 (cắt gọn) */
export const COMPOSE_CHECKS = [
  "Mỗi mission viết bằng ĐÚNG loại câu (thông tin / đề xuất / yêu cầu / câu hỏi)",
  "Không còn câu nào không phục vụ mission nào",
  "Đã rà lại toàn bộ động từ: chia thì, số ít/số nhiều, dạng sau «to» và sau giới từ",
  "Có xưng hô đầu thư và lời chào cuối kèm ký tên",
];

export const COMPOSE_TASKS: P2ComposeTask[] = [
  {
    id: "c1",
    label: "Đề 1 — Máy in hỏng",
    tag: "Xin lỗi · Thông tin · Câu hỏi",
    email: {
      from: "Sandra Whitfield, Office Manager",
      to: "Kestrel Office Solutions — Support",
      subject: "Printer down since Monday",
      sent: "October 14th, 8:52 a.m.",
      body: [
        "Dear Support Team:",
        "The colour printer your company installed in our office in July has not worked since Monday morning. It shows an error code E-14 and will not print anything at all. We have a client presentation on Friday and we need this printer running before then. Please tell me what can be done.",
        "Regards,",
        "Sandra Whitfield",
      ],
      directions:
        "Respond to the e-mail as if you were a support agent at Kestrel Office Solutions. In your e-mail, make an apology, provide ONE piece of information and ask ONE question.",
    },
    missions: [
      "Xin lỗi về việc máy in hỏng",
      "Cung cấp MỘT thông tin cụ thể (ngày kỹ thuật viên đến, thời gian sửa…)",
      "Hỏi MỘT câu hỏi thật (xin thông tin, không phải nhờ họ làm việc)",
    ],
  },
  {
    id: "c2",
    label: "Đề 2 — Mời dự hội thảo",
    tag: "Thông tin ×2 · Đề xuất",
    email: {
      from: "Hoang Minh Tuan, Event Coordinator",
      to: "All partner companies",
      subject: "Annual logistics forum — please confirm",
      sent: "October 15th, 3:20 p.m.",
      body: [
        "Dear partners,",
        "We are holding our annual logistics forum on November 22nd at the Riverside Convention Center. Please let us know how many people from your company will attend and whether any of them need a vegetarian meal. If you have topics you would like us to cover in the afternoon panel, we would be glad to hear them.",
        "Best regards,",
        "Hoang Minh Tuan",
      ],
      directions:
        "Respond to the e-mail as if you were a representative of a partner company. In your e-mail, provide TWO pieces of information and make ONE suggestion.",
    },
    missions: [
      "Thông tin 1: số người công ty bạn sẽ cử đi",
      "Thông tin 2: có ai cần suất ăn chay không",
      "Đề xuất MỘT chủ đề cho phiên thảo luận buổi chiều",
    ],
  },
  {
    id: "c3",
    label: "Đề 3 — Khiếu nại tiền phòng",
    tag: "Yêu cầu · Câu hỏi ×2",
    email: {
      from: "Riverbend Apartments — Billing",
      to: "Nguyen Thi Lan",
      subject: "October invoice",
      sent: "October 16th, 10:05 a.m.",
      body: [
        "Dear Ms. Nguyen:",
        "Please find attached your invoice for October. The total is 8,900,000 VND, which includes rent, water, electricity and a management fee. Payment is due on the 25th of this month. If anything looks incorrect, contact our billing office.",
        "Sincerely,",
        "Billing Department",
      ],
      directions:
        "Respond to the e-mail as if you were the tenant. In your e-mail, make ONE request and ask TWO questions about the invoice.",
    },
    missions: [
      "Yêu cầu MỘT việc (gửi lại bảng chi tiết, kiểm tra lại chỉ số điện…)",
      "Câu hỏi 1 về hoá đơn",
      "Câu hỏi 2 về hoá đơn",
    ],
  },
  {
    id: "c4",
    label: "Đề 4 — Ứng viên xin dời lịch",
    tag: "Xin lỗi · Đề xuất ×2",
    email: {
      from: "Rebecca Lindqvist, HR Manager",
      to: "Applicant",
      subject: "Interview scheduled for Thursday 9 a.m.",
      sent: "October 17th, 5:40 p.m.",
      body: [
        "Dear applicant,",
        "Thank you for applying for the marketing assistant position. We would like to invite you to an interview at our head office this Thursday at 9 a.m. The interview will take about forty minutes. Please confirm that this time works for you.",
        "Kind regards,",
        "Rebecca Lindqvist",
      ],
      directions:
        "Respond to the e-mail as if you were the applicant and you cannot attend at that time. In your e-mail, make an apology and make TWO suggestions.",
    },
    missions: [
      "Xin lỗi vì không dự được khung giờ đã hẹn",
      "Đề xuất 1: một khung giờ thay thế",
      "Đề xuất 2: một phương án khác (phỏng vấn online, một ngày khác…)",
    ],
  },
  {
    id: "c5",
    label: "Đề 5 — Đơn hàng thiếu",
    tag: "Thông tin · Yêu cầu · Câu hỏi",
    email: {
      from: "Daniel Okoye",
      to: "Larkspur Stationery",
      subject: "Missing items in order #77214",
      sent: "October 18th, 7:15 a.m.",
      body: [
        "Dear Larkspur Stationery:",
        "I received order #77214 yesterday, but two boxes of A4 paper were missing from the delivery. The invoice lists five boxes and only three arrived. I have already checked with our reception desk and nothing was left there. I would appreciate a quick reply as we are running low.",
        "Best,",
        "Daniel Okoye",
      ],
      directions:
        "Respond to the e-mail as if you were a sales assistant at Larkspur Stationery. In your e-mail, provide ONE piece of information, make ONE request and ask ONE question.",
    },
    missions: [
      "Cung cấp MỘT thông tin (khi nào gửi bù, đã kiểm tra kho…)",
      "Yêu cầu MỘT việc (gửi ảnh phiếu giao hàng, xác nhận địa chỉ…)",
      "Hỏi MỘT câu hỏi thật",
    ],
  },
];

export function getComposeTask(id: string): P2ComposeTask | undefined {
  return COMPOSE_TASKS.find((t) => t.id === id);
}
