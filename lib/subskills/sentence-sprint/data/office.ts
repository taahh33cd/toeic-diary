import type { SentenceTopic } from "../types";

// Bộ Office — 12 từ gặp hằng ngày trong email và hội thoại công việc.
//
// Hai câu sai ở mỗi từ không phải bịa: đều là lỗi học viên Việt mắc thật, chủ
// yếu do dịch ngược từ tiếng Việt ("nộp CHO báo cáo", "duyệt CHO ngân sách")
// hoặc do nhớ nghĩa mà không nhớ từ loại ("submission" thay "submit").

export const officeTopic: SentenceTopic = {
  slug: "office",
  name: "Công việc & văn phòng",
  emoji: "🏢",
  blurb: "Nộp báo cáo, duyệt ngân sách, phụ trách, làm thêm giờ — từ của email đi làm mỗi ngày",
  entries: [
    {
      en: "submit",
      pos: "v",
      vi: "nộp, gửi lên",
      frame: "All team leaders must ___ their expense reports by Friday.",
      frameAnswers: ["submit"],
      model: "All team leaders must submit their expense reports by Friday.",
      chunks: ["All team leaders", "must submit", "their expense reports", "by Friday"],
      wrong: [
        {
          text: "All team leaders must submit to their expense reports by Friday.",
          why: "submit là ngoại động từ — tân ngữ đi liền sau, không chen 'to'.",
        },
        {
          text: "All team leaders must submission their expense reports by Friday.",
          why: "submission là danh từ, không đứng được sau 'must'.",
        },
      ],
      why: "must + V nguyên mẫu, rồi tân ngữ ngay sau submit.",
      situation: "Bạn là trưởng phòng, nhắc cả nhóm nộp báo cáo chi phí trước thứ Sáu.",
      collocations: ["submit a report", "submit an application", "submit a request"],
    },
    {
      en: "deadline",
      pos: "n",
      vi: "hạn chót",
      frame: "We cannot afford to miss the ___ for the quarterly report.",
      frameAnswers: ["deadline"],
      model: "We cannot afford to miss the deadline for the quarterly report.",
      chunks: ["We cannot afford", "to miss the deadline", "for the quarterly report"],
      wrong: [
        {
          text: "We cannot afford to lose the deadline for the quarterly report.",
          why: "Hạn chót thì 'miss the deadline'; 'lose' không ghép với deadline.",
        },
        {
          text: "We cannot afford to miss the deadline the quarterly report.",
          why: "Thiếu 'for' — deadline nối với công việc bằng 'for'.",
        },
      ],
      why: "miss the deadline là cụm cố định, nối việc bằng 'for'.",
      situation: "Nhóm đang chậm tiến độ, bạn cảnh báo trong buổi họp đầu giờ.",
      collocations: ["meet the deadline", "miss the deadline", "extend the deadline", "a tight deadline"],
    },
    {
      en: "approve",
      pos: "v",
      vi: "phê duyệt",
      frame: "The manager has not ___ the new budget yet.",
      frameAnswers: ["approved"],
      model: "The manager has not approved the new budget yet.",
      chunks: ["The manager", "has not approved", "the new budget", "yet"],
      wrong: [
        {
          text: "The manager has not approved for the new budget yet.",
          why: "approve + tân ngữ trực tiếp. 'approve of' là tán thành, không dùng cho duyệt giấy tờ.",
        },
        {
          text: "The manager has not approval the new budget yet.",
          why: "approval là danh từ; chỗ này cần dạng V3 của động từ.",
        },
      ],
      why: "has not + V3, và approve đi thẳng với tân ngữ.",
      situation: "Đồng nghiệp hỏi bạn ngân sách mới đã được duyệt chưa.",
      collocations: ["approve a request", "approve a budget", "get approval from"],
    },
    {
      en: "in charge of",
      pos: "phrase",
      vi: "phụ trách",
      frame: "Ms. Carter is ___ the new training program.",
      frameAnswers: ["in charge of"],
      model: "Ms. Carter is in charge of the new training program.",
      chunks: ["Ms. Carter is", "in charge of", "the new training program"],
      wrong: [
        {
          text: "Ms. Carter is in charge the new training program.",
          why: "Thiếu 'of' — cụm là 'in charge OF + việc'.",
        },
        {
          text: "Ms. Carter is charged of the new training program.",
          why: "'be charged' nghĩa bị buộc tội hoặc bị tính phí, không phải phụ trách.",
        },
      ],
      why: "be in charge of + danh từ hoặc V-ing.",
      situation: "Bạn giới thiệu với khách ai là người phụ trách chương trình đào tạo mới.",
      collocations: ["be in charge of a project", "put somebody in charge of", "take charge of"],
    },
    {
      en: "revise",
      pos: "v",
      vi: "sửa lại, chỉnh sửa",
      frame: "Could you ___ the draft before I send it to the client?",
      frameAnswers: ["revise"],
      model: "Could you revise the draft before I send it to the client?",
      chunks: ["Could you revise", "the draft", "before I send it", "to the client"],
      wrong: [
        {
          text: "Could you revise again the draft before I send it to the client?",
          why: "Trạng từ không chen giữa động từ và tân ngữ: phải là 'revise the draft again'.",
        },
        {
          text: "Could you revise the draft before I will send it to the client?",
          why: "Mệnh đề 'before' không dùng 'will' — dùng hiện tại đơn.",
        },
      ],
      why: "Could you + V nguyên mẫu; mệnh đề chỉ thời gian dùng hiện tại đơn.",
      situation: "Bạn nhờ đồng nghiệp xem lại bản nháp trước khi gửi khách.",
      collocations: ["revise a draft", "revise a policy", "a revised version"],
    },
    {
      en: "shift",
      pos: "n",
      vi: "ca làm",
      frame: "I will be working the night ___ next week.",
      frameAnswers: ["shift"],
      model: "I will be working the night shift next week.",
      chunks: ["I will be working", "the night shift", "next week"],
      wrong: [
        {
          text: "I will be working in the night shift next week.",
          why: "Làm ca nào thì 'work the night shift' — không chen 'in'.",
        },
        {
          text: "I will be working the night shift at next week.",
          why: "'next week' là trạng ngữ trống, không đi với giới từ.",
        },
      ],
      why: "work + the + tên ca; 'next week' đứng trơ không cần giới từ.",
      situation: "Bạn báo với đồng nghiệp tuần sau bạn làm ca đêm.",
      collocations: ["work the night shift", "swap shifts", "a double shift", "shift schedule"],
    },
    {
      en: "urgent",
      pos: "adj",
      vi: "gấp",
      frame: "This request is ___, so please handle it first.",
      frameAnswers: ["urgent"],
      model: "This request is urgent, so please handle it first.",
      chunks: ["This request is urgent,", "so please handle it", "first"],
      wrong: [
        {
          text: "This request is urgently, so please handle it first.",
          why: "Sau 'is' cần tính từ; urgently là trạng từ.",
        },
        {
          text: "This request has urgent, so please handle it first.",
          why: "Tính từ đi với 'be', không đi với 'have'.",
        },
      ],
      why: "be + tính từ; trạng từ urgently chỉ bổ nghĩa cho động từ.",
      situation: "Bạn chuyển một yêu cầu gấp cho đồng nghiệp xử lý trước.",
      collocations: ["an urgent request", "an urgent matter", "urgently needed"],
    },
    {
      en: "attach",
      pos: "v",
      vi: "gửi kèm",
      frame: "I have ___ the revised contract to this email.",
      frameAnswers: ["attached"],
      model: "I have attached the revised contract to this email.",
      chunks: ["I have attached", "the revised contract", "to this email"],
      wrong: [
        {
          text: "I have attached the revised contract in this email.",
          why: "File gắn vào email dùng 'attach ... to', không 'in'.",
        },
        {
          text: "I have attachment the revised contract to this email.",
          why: "attachment là danh từ; chỗ này cần V3 của attach.",
        },
      ],
      why: "attach + vật + to + nơi gắn vào.",
      situation: "Bạn viết email gửi bản hợp đồng đã sửa cho khách.",
      collocations: ["attach a file to", "please find attached", "see the attachment"],
    },
    {
      en: "remind",
      pos: "v",
      vi: "nhắc",
      frame: "Please ___ me to call the supplier at three.",
      frameAnswers: ["remind"],
      model: "Please remind me to call the supplier at three.",
      chunks: ["Please remind me", "to call the supplier", "at three"],
      wrong: [
        {
          text: "Please remind me calling the supplier at three.",
          why: "remind somebody TO V, không dùng V-ing.",
        },
        {
          text: "Please remind to me to call the supplier at three.",
          why: "remind đi thẳng với người: 'remind me', không 'remind to me'.",
        },
      ],
      why: "remind + người + to + V.",
      situation: "Bạn nhờ đồng nghiệp nhắc mình gọi cho nhà cung cấp lúc ba giờ.",
      collocations: ["remind somebody to do", "remind somebody about", "a reminder email"],
    },
    {
      en: "available",
      pos: "adj",
      vi: "rảnh, sẵn có",
      frame: "Are you ___ for a short call tomorrow morning?",
      frameAnswers: ["available"],
      model: "Are you available for a short call tomorrow morning?",
      chunks: ["Are you available", "for a short call", "tomorrow morning"],
      wrong: [
        {
          text: "Are you availability for a short call tomorrow morning?",
          why: "availability là danh từ; sau 'Are you' cần tính từ.",
        },
        {
          text: "Are you available a short call tomorrow morning?",
          why: "Thiếu giới từ — available FOR + việc, hoặc available TO + V.",
        },
      ],
      why: "be available for + danh từ / to + V.",
      situation: "Bạn hỏi khách sáng mai có rảnh gọi điện ngắn không.",
      collocations: ["be available for", "be available to meet", "the earliest available slot"],
    },
    {
      en: "handle",
      pos: "v",
      vi: "xử lý",
      frame: "Our support team ___ about fifty requests a day.",
      frameAnswers: ["handles"],
      model: "Our support team handles about fifty requests a day.",
      chunks: ["Our support team handles", "about fifty requests", "a day"],
      wrong: [
        {
          text: "Our support team handle with about fifty requests a day.",
          why: "handle đi thẳng với tân ngữ ('deal' mới cần 'with'), và chủ ngữ số ít phải là 'handles'.",
        },
        {
          text: "Our support team is handle about fifty requests a day.",
          why: "'is' + V nguyên mẫu là sai — hoặc 'handles', hoặc 'is handling'.",
        },
      ],
      why: "handle + tân ngữ, không cần giới từ.",
      situation: "Bạn giới thiệu với khách khối lượng việc bộ phận hỗ trợ xử lý mỗi ngày.",
      collocations: ["handle a complaint", "handle a request", "handle the paperwork"],
    },
    {
      en: "overtime",
      pos: "n",
      vi: "giờ làm thêm",
      frame: "We had to work ___ to finish the inventory count.",
      frameAnswers: ["overtime"],
      model: "We had to work overtime to finish the inventory count.",
      chunks: ["We had to work overtime", "to finish", "the inventory count"],
      wrong: [
        {
          text: "We had to work overtimes to finish the inventory count.",
          why: "overtime không đếm được — không có dạng 'overtimes'.",
        },
        {
          text: "We had to work overtime for finish the inventory count.",
          why: "Chỉ mục đích thì dùng 'to + V', không 'for + V'.",
        },
      ],
      why: "work overtime là cụm cố định; mục đích đi với 'to + V'.",
      situation: "Bạn kể với trưởng phòng là nhóm đã làm thêm giờ để xong việc kiểm kê.",
      collocations: ["work overtime", "overtime pay", "put in overtime"],
    },
  ],
  combos: [
    {
      words: ["submit", "deadline"],
      situation: "Nhắc đồng nghiệp nộp báo cáo trước hạn chót thứ Sáu.",
      model: "Please submit your report before the Friday deadline so we don't have to ask for an extension.",
    },
    {
      words: ["approve", "urgent"],
      situation: "Xin trưởng phòng duyệt gấp một yêu cầu mua hàng.",
      model: "Could you approve this purchase request today? It is urgent.",
    },
    {
      words: ["available", "remind"],
      situation: "Hỏi giờ rảnh của đồng nghiệp và nhờ họ nhắc bạn.",
      model: "Let me know when you are available, and please remind me the day before.",
    },
    {
      words: ["in charge of", "handle", "revise"],
      situation: "Giới thiệu người phụ trách hợp đồng và việc họ làm.",
      model: "Ms. Carter is in charge of the contract, so she handles the client's questions and revises the draft.",
    },
    {
      words: ["shift", "overtime", "deadline"],
      situation: "Giải thích vì sao nhóm bạn phải làm thêm tuần trước.",
      model: "My team worked the night shift and put in overtime because the deadline was Monday.",
    },
  ],
};
