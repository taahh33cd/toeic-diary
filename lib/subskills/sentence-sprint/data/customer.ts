import type { SentenceTopic } from "../types";

// Bộ Khách hàng & dịch vụ — giọng email xin lỗi, hoàn tiền, bảo hành.
//
// Đây là bộ sát Speaking Q5-7 nhất (trả lời điện thoại thay công ty), nên câu
// mẫu giữ nguyên mức lịch sự của người trực tổng đài: "We apologize for…",
// "Could you describe…", "We appreciate your patience".

export const customerTopic: SentenceTopic = {
  slug: "customer",
  name: "Khách hàng & dịch vụ",
  emoji: "🤝",
  blurb: "Xin lỗi, hoàn tiền, bảo hành, xoa dịu khách — giọng cần có ở Speaking Q5-7 và thư trả lời",
  entries: [
    {
      en: "complaint",
      pos: "n",
      vi: "lời phàn nàn, khiếu nại",
      frame: "We received a ___ about the delivery time.",
      frameAnswers: ["complaint"],
      model: "We received a complaint about the delivery time.",
      chunks: ["We received", "a complaint", "about the delivery time"],
      wrong: [
        {
          text: "We received a complaint for the delivery time.",
          why: "Phàn nàn VỀ việc gì thì dùng 'about'.",
        },
        {
          text: "We received a complain about the delivery time.",
          why: "complain là động từ; danh từ là 'complaint'.",
        },
      ],
      why: "a complaint about + việc bị phàn nàn.",
      situation: "Bạn báo nhóm rằng có khách phàn nàn về thời gian giao hàng.",
      collocations: ["file a complaint", "a complaint about", "handle complaints"],
    },
    {
      en: "apologize",
      pos: "v",
      vi: "xin lỗi",
      frame: "We ___ for the inconvenience this has caused.",
      frameAnswers: ["apologize", "apologise"],
      model: "We apologize for the inconvenience this has caused.",
      chunks: ["We apologize", "for the inconvenience", "this has caused"],
      wrong: [
        {
          text: "We apologize the inconvenience this has caused.",
          why: "apologize FOR + việc; thiếu 'for' là sai cấu trúc.",
        },
        {
          text: "We are apologize for the inconvenience this has caused.",
          why: "'are' + V nguyên mẫu là sai — 'We apologize' hoặc 'We are sorry'.",
        },
      ],
      why: "apologize (to + người) for + việc.",
      situation: "Bạn viết thư xin lỗi khách vì sự bất tiện vừa gây ra.",
      collocations: ["apologize for the delay", "apologize to a customer", "a sincere apology"],
    },
    {
      en: "refund",
      pos: "n / v",
      vi: "tiền hoàn lại; hoàn tiền",
      frame: "We will issue a full ___ within five business days.",
      frameAnswers: ["refund"],
      model: "We will issue a full refund within five business days.",
      chunks: ["We will issue", "a full refund", "within five business days"],
      wrong: [
        {
          text: "We will refund a full refund within five business days.",
          why: "Lặp — hoặc 'issue a refund', hoặc 'refund your money'.",
        },
        {
          text: "We will be issue a full refund within five business days.",
          why: "'will be' + V nguyên mẫu là sai; dùng 'will issue' hoặc 'will be issuing'.",
        },
      ],
      why: "issue / give a refund; refund + tiền.",
      situation: "Bạn trả lời khách đang yêu cầu hoàn tiền.",
      collocations: ["issue a refund", "a full refund", "request a refund"],
    },
    {
      en: "issue",
      pos: "n",
      vi: "sự cố, vấn đề",
      frame: "Could you describe the ___ you are having with the device?",
      frameAnswers: ["issue"],
      model: "Could you describe the issue you are having with the device?",
      chunks: ["Could you describe", "the issue", "you are having", "with the device"],
      wrong: [
        {
          text: "Could you describe about the issue you are having with the device?",
          why: "describe đi thẳng với tân ngữ, không 'describe about'.",
        },
        {
          text: "Could you describe the issue you are having to the device?",
          why: "Gặp vấn đề VỚI thiết bị: 'an issue with the device'.",
        },
      ],
      why: "describe + vấn đề; have an issue WITH + vật.",
      situation: "Bạn trực tổng đài, hỏi khách đang gặp lỗi gì với máy.",
      collocations: ["report an issue", "an issue with", "resolve an issue"],
    },
    {
      en: "resolve",
      pos: "v",
      vi: "giải quyết",
      frame: "Our team ___ the problem within an hour.",
      frameAnswers: ["resolved"],
      model: "Our team resolved the problem within an hour.",
      chunks: ["Our team resolved", "the problem", "within an hour"],
      wrong: [
        {
          text: "Our team resolved to the problem within an hour.",
          why: "resolve + vấn đề. 'resolve to do' nghĩa là quyết tâm làm gì, khác hẳn.",
        },
        {
          text: "Our team was resolved the problem within an hour.",
          why: "Nhóm là người giải quyết nên phải chủ động: 'resolved'.",
        },
      ],
      why: "resolve + vấn đề, luôn chủ động khi nói về người xử lý.",
      situation: "Bạn báo cáo rằng sự cố của khách đã được xử lý trong một giờ.",
      collocations: ["resolve an issue", "resolve a complaint", "a quick resolution"],
    },
    {
      en: "satisfied",
      pos: "adj",
      vi: "hài lòng",
      frame: "Most customers are ___ with the new return policy.",
      frameAnswers: ["satisfied"],
      model: "Most customers are satisfied with the new return policy.",
      chunks: ["Most customers", "are satisfied", "with the new return policy"],
      wrong: [
        {
          text: "Most customers are satisfied about the new return policy.",
          why: "satisfied luôn đi với 'with'.",
        },
        {
          text: "Most customers are satisfying with the new return policy.",
          why: "'satisfying' là gây hài lòng; người hài lòng là 'satisfied'.",
        },
      ],
      why: "be satisfied with + thứ làm mình hài lòng.",
      situation: "Bạn tóm tắt phản hồi của khách về chính sách đổi trả mới.",
      collocations: ["be satisfied with", "customer satisfaction", "a satisfied customer"],
    },
    {
      en: "replacement",
      pos: "n",
      vi: "hàng thay thế",
      frame: "We have sent a ___ by express courier.",
      frameAnswers: ["replacement"],
      model: "We have sent a replacement by express courier.",
      chunks: ["We have sent", "a replacement", "by express courier"],
      wrong: [
        {
          text: "We have sent a replace by express courier.",
          why: "replace là động từ; danh từ là 'replacement'.",
        },
        {
          text: "We have sent a replacement with express courier.",
          why: "Phương tiện gửi dùng 'by': by courier, by air.",
        },
      ],
      why: "send a replacement by + phương tiện.",
      situation: "Bạn báo khách là hàng thay thế đã được gửi đi.",
      collocations: ["send a replacement", "a replacement part", "replace a faulty item"],
    },
    {
      en: "inquiry",
      pos: "n",
      vi: "câu hỏi, thắc mắc",
      frame: "Thank you for your ___ about our group rates.",
      frameAnswers: ["inquiry", "enquiry"],
      model: "Thank you for your inquiry about our group rates.",
      chunks: ["Thank you", "for your inquiry", "about our group rates"],
      wrong: [
        {
          text: "Thank you for your inquiry of our group rates.",
          why: "Hỏi về cái gì thì 'inquiry about'.",
        },
        {
          text: "Thank you for your inquire about our group rates.",
          why: "inquire là động từ; danh từ là 'inquiry'.",
        },
      ],
      why: "an inquiry about + nội dung hỏi.",
      situation: "Bạn mở đầu email trả lời khách hỏi giá cho đoàn.",
      collocations: ["make an inquiry", "an inquiry about", "respond to an inquiry"],
    },
    {
      en: "assist",
      pos: "v",
      vi: "hỗ trợ",
      frame: "Our staff will ___ you with the installation.",
      frameAnswers: ["assist"],
      model: "Our staff will assist you with the installation.",
      chunks: ["Our staff will assist", "you", "with the installation"],
      wrong: [
        {
          text: "Our staff will assist to you with the installation.",
          why: "assist đi thẳng với người: 'assist you'.",
        },
        {
          text: "Our staff will assist you the installation.",
          why: "Giúp ai VIỆC gì: 'assist somebody WITH something'.",
        },
      ],
      why: "assist + người + with + việc.",
      situation: "Bạn trấn an khách rằng nhân viên sẽ hỗ trợ lắp đặt.",
      collocations: ["assist a customer with", "offer assistance", "need assistance"],
    },
    {
      en: "appreciate",
      pos: "v",
      vi: "trân trọng, cảm kích",
      frame: "We ___ your patience while we look into this.",
      frameAnswers: ["appreciate"],
      model: "We appreciate your patience while we look into this.",
      chunks: ["We appreciate", "your patience", "while we look into this"],
      wrong: [
        {
          text: "We appreciate for your patience while we look into this.",
          why: "appreciate + tân ngữ, không có 'appreciate for'.",
        },
        {
          text: "We are appreciate your patience while we look into this.",
          why: "'are' + V nguyên mẫu là sai — 'We appreciate' hoặc 'We are grateful for'.",
        },
      ],
      why: "appreciate + điều mình biết ơn (danh từ hoặc V-ing).",
      situation: "Bạn xin khách chờ trong lúc công ty kiểm tra sự việc.",
      collocations: ["appreciate your patience", "appreciate your feedback", "I would appreciate it if"],
    },
    {
      en: "discount",
      pos: "n",
      vi: "mức giảm giá",
      frame: "We would like to offer you a ten percent ___ on your next order.",
      frameAnswers: ["discount"],
      model: "We would like to offer you a ten percent discount on your next order.",
      chunks: ["We would like", "to offer you", "a ten percent discount", "on your next order"],
      wrong: [
        {
          text: "We would like to offer you ten percent discount on your next order.",
          why: "discount đếm được — phải có mạo từ: 'a ten percent discount'.",
        },
        {
          text: "We would like to offer you a ten percents discount on your next order.",
          why: "Đứng trước danh từ, 'percent' không thêm 's'.",
        },
      ],
      why: "offer + người + a X percent discount on + đơn hàng.",
      situation: "Bạn bù cho khách bằng mức giảm giá cho đơn kế tiếp.",
      collocations: ["offer a discount", "a discount on", "a discounted price"],
    },
    {
      en: "warranty",
      pos: "n",
      vi: "bảo hành",
      frame: "The product is still under ___ until next March.",
      frameAnswers: ["warranty"],
      model: "The product is still under warranty until next March.",
      chunks: ["The product", "is still under warranty", "until next March"],
      wrong: [
        {
          text: "The product is still in warranty until next March.",
          why: "Cụm cố định là 'under warranty'.",
        },
        {
          text: "The product is still under the warranty until next March.",
          why: "'under warranty' không có mạo từ.",
        },
      ],
      why: "be under warranty (until + mốc thời gian).",
      situation: "Bạn trả lời khách hỏi máy còn bảo hành không.",
      collocations: ["under warranty", "a two-year warranty", "the warranty expires"],
    },
  ],
  combos: [
    {
      words: ["complaint", "apologize"],
      situation: "Mở đầu thư trả lời một khách vừa phàn nàn.",
      model: "I have read your complaint, and I apologize for the delay in our reply.",
    },
    {
      words: ["refund", "issue"],
      situation: "Trả lời khách về hướng xử lý sự cố.",
      model: "If we cannot fix the issue today, we will give you a full refund.",
    },
    {
      words: ["replacement", "warranty"],
      situation: "Trả lời khách có hàng lỗi vẫn còn hạn bảo hành.",
      model: "The unit is still under warranty, so we will send a replacement free of charge.",
    },
    {
      words: ["appreciate", "satisfied", "discount"],
      situation: "Giữ chân một khách chưa hài lòng.",
      model: "We appreciate your feedback, and if you are not satisfied, we can offer a discount on your next order.",
    },
    {
      words: ["inquiry", "assist", "resolve"],
      situation: "Nhận việc hỗ trợ khách sau khi họ gửi thắc mắc.",
      model: "Thank you for your inquiry; our technician will assist you and resolve the problem this afternoon.",
    },
  ],
};
