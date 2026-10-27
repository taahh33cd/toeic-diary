import type { SentenceTopic } from "../types";

// Bộ Meeting — từ của lịch họp, lời mời, biên bản và việc sau họp.
//
// Đây là nhóm từ ra câu nhiều nhất trong Speaking Q5-7 (trả lời câu hỏi điện
// thoại) và Writing Q1-5, nên khuôn câu ở đây cố tình giữ đúng giọng email:
// Could we..., Please confirm..., I will follow up...

export const meetingTopic: SentenceTopic = {
  slug: "meeting",
  name: "Họp & lịch hẹn",
  emoji: "📅",
  blurb: "Đổi lịch, mời họp, xác nhận, ghi biên bản — từ bật ra liên tục ở Speaking Q5-7",
  entries: [
    {
      en: "reschedule",
      pos: "v",
      vi: "đổi lịch",
      frame: "Can we ___ tomorrow's meeting to Thursday?",
      frameAnswers: ["reschedule"],
      model: "Can we reschedule tomorrow's meeting to Thursday?",
      chunks: ["Can we reschedule", "tomorrow's meeting", "to Thursday"],
      wrong: [
        {
          text: "Can we reschedule tomorrow's meeting in Thursday?",
          why: "Thứ trong tuần đi với 'to/for/on', không bao giờ 'in Thursday'.",
        },
        {
          text: "Can we rescheduling tomorrow's meeting to Thursday?",
          why: "Sau 'Can we' phải là V nguyên mẫu.",
        },
      ],
      why: "Can we + V; chuyển sang mốc mới dùng 'to' hoặc 'for'.",
      situation: "Bạn xin đổi buổi họp mai sang thứ Năm vì trùng lịch khách.",
      collocations: ["reschedule a meeting", "reschedule for next week", "a rescheduled appointment"],
    },
    {
      en: "agenda",
      pos: "n",
      vi: "nội dung họp",
      frame: "I have added two items to the ___ for Monday.",
      frameAnswers: ["agenda"],
      model: "I have added two items to the agenda for Monday.",
      chunks: ["I have added", "two items", "to the agenda", "for Monday"],
      wrong: [
        {
          text: "I have added two items in the agenda for Monday.",
          why: "Thêm mục thì 'add ... to the agenda'; chỉ khi nói mục nằm ở đâu mới dùng 'on the agenda'.",
        },
        {
          text: "I have added two agendas for Monday.",
          why: "agenda là cả bản nội dung; từng mục gọi là 'item', không nói 'two agendas'.",
        },
      ],
      why: "add + mục + to the agenda; mục nằm 'on the agenda'.",
      situation: "Bạn báo cả nhóm là bạn đã thêm hai mục vào nội dung họp thứ Hai.",
      collocations: ["on the agenda", "add an item to the agenda", "the first item on the agenda"],
    },
    {
      en: "attend",
      pos: "v",
      vi: "dự, tham gia",
      frame: "About twenty people will ___ the training session.",
      frameAnswers: ["attend"],
      model: "About twenty people will attend the training session.",
      chunks: ["About twenty people", "will attend", "the training session"],
      wrong: [
        {
          text: "About twenty people will attend to the training session.",
          why: "attend + tân ngữ. 'attend to' nghĩa là để ý / chăm sóc, khác hẳn.",
        },
        {
          text: "About twenty people will attendance the training session.",
          why: "attendance là danh từ, không đứng sau 'will'.",
        },
      ],
      why: "attend đi thẳng với tên sự kiện, không cần giới từ.",
      situation: "Bạn báo với trưởng phòng số người sẽ dự buổi đào tạo.",
      collocations: ["attend a meeting", "attend a conference", "attendance rate"],
    },
    {
      en: "postpone",
      pos: "v",
      vi: "hoãn",
      frame: "The board decided to ___ the launch until next quarter.",
      frameAnswers: ["postpone"],
      model: "The board decided to postpone the launch until next quarter.",
      chunks: ["The board decided", "to postpone the launch", "until next quarter"],
      wrong: [
        {
          text: "The board decided to postpone to launch the product until next quarter.",
          why: "postpone + danh từ hoặc V-ing, không có 'postpone to V'.",
        },
        {
          text: "The board decided to postpone the launch since next quarter.",
          why: "Hoãn đến mốc nào thì 'until'; 'since' là từ mốc quá khứ đến nay.",
        },
      ],
      why: "postpone + danh từ/V-ing, mốc mới đi với 'until'.",
      situation: "Bạn thông báo ban lãnh đạo quyết định hoãn ra mắt sản phẩm.",
      collocations: ["postpone a meeting", "postpone until further notice", "be postponed indefinitely"],
    },
    {
      en: "confirm",
      pos: "v",
      vi: "xác nhận",
      frame: "Please ___ your attendance by replying to this email.",
      frameAnswers: ["confirm"],
      model: "Please confirm your attendance by replying to this email.",
      chunks: ["Please confirm", "your attendance", "by replying", "to this email"],
      wrong: [
        {
          text: "Please confirm about your attendance by replying to this email.",
          why: "confirm đi thẳng với tân ngữ, không 'confirm about'.",
        },
        {
          text: "Please confirm your attendance by reply to this email.",
          why: "Sau 'by' chỉ cách làm thì dùng V-ing: 'by replying'.",
        },
      ],
      why: "confirm + tân ngữ; 'by + V-ing' chỉ cách thực hiện.",
      situation: "Bạn gửi thư mời họp và xin người nhận xác nhận tham dự.",
      collocations: ["confirm a booking", "confirm attendance", "confirm in writing"],
    },
    {
      en: "in advance",
      pos: "phrase",
      vi: "trước (bao lâu)",
      frame: "Please let me know at least two days ___.",
      frameAnswers: ["in advance"],
      model: "Please let me know at least two days in advance.",
      chunks: ["Please let me know", "at least two days", "in advance"],
      wrong: [
        {
          text: "Please let me know at least two days in advanced.",
          why: "Cụm là 'in advance'; 'advanced' là tính từ nghĩa 'nâng cao'.",
        },
        {
          text: "Please let me know in advance at least two days.",
          why: "Khoảng thời gian đứng ngay trước cụm: 'two days in advance'.",
        },
      ],
      why: "khoảng thời gian + in advance.",
      situation: "Bạn nhắc khách báo trước ít nhất hai ngày nếu muốn đổi lịch.",
      collocations: ["book in advance", "two weeks in advance", "pay in advance"],
    },
    {
      en: "be held",
      pos: "v (bị động)",
      vi: "được tổ chức",
      frame: "The annual conference will ___ in Chicago this year.",
      frameAnswers: ["be held"],
      model: "The annual conference will be held in Chicago this year.",
      chunks: ["The annual conference", "will be held", "in Chicago", "this year"],
      wrong: [
        {
          text: "The annual conference will hold in Chicago this year.",
          why: "Hội nghị là thứ ĐƯỢC tổ chức, phải bị động 'be held'.",
        },
        {
          text: "The annual conference will be hold in Chicago this year.",
          why: "Bị động cần V3: 'held', không phải 'hold'.",
        },
      ],
      why: "will be + V3; sự kiện luôn ở thế bị động với 'hold'.",
      situation: "Bạn thông báo địa điểm hội nghị thường niên năm nay.",
      collocations: ["be held at", "hold a meeting", "the meeting was held"],
    },
    {
      en: "minutes",
      pos: "n",
      vi: "biên bản họp",
      frame: "Could you take the ___ at today's meeting?",
      frameAnswers: ["minutes"],
      model: "Could you take the minutes at today's meeting?",
      chunks: ["Could you take", "the minutes", "at today's meeting"],
      wrong: [
        {
          text: "Could you write the minute at today's meeting?",
          why: "Biên bản luôn số nhiều 'the minutes', và cụm quen là 'take the minutes'.",
        },
        {
          text: "Could you take the minutes in today's meeting?",
          why: "Sự kiện họp dùng 'at the meeting'.",
        },
      ],
      why: "take the minutes at a meeting — cả ba phần đều cố định.",
      situation: "Bạn nhờ đồng nghiệp ghi biên bản buổi họp hôm nay.",
      collocations: ["take the minutes", "circulate the minutes", "according to the minutes"],
    },
    {
      en: "participant",
      pos: "n",
      vi: "người tham dự",
      frame: "Each ___ will receive a copy of the handouts.",
      frameAnswers: ["participant"],
      model: "Each participant will receive a copy of the handouts.",
      chunks: ["Each participant", "will receive", "a copy of the handouts"],
      wrong: [
        {
          text: "Each participants will receive a copy of the handouts.",
          why: "Sau 'each' là danh từ số ít.",
        },
        {
          text: "Each of participant will receive a copy of the handouts.",
          why: "'each of' phải đi với 'the/our + số nhiều': 'each of the participants'.",
        },
      ],
      why: "each + danh từ số ít; each of + the + số nhiều.",
      situation: "Bạn dặn trước với người tham dự rằng ai cũng được phát tài liệu.",
      collocations: ["the participants in a program", "participate in a meeting", "take part in"],
    },
    {
      en: "run over",
      pos: "phrasal",
      vi: "kéo dài quá giờ",
      frame: "Sorry I am late — the previous meeting ___ by twenty minutes.",
      frameAnswers: ["ran over", "run over"],
      model: "Sorry I am late — the previous meeting ran over by twenty minutes.",
      chunks: ["Sorry I am late —", "the previous meeting", "ran over", "by twenty minutes"],
      wrong: [
        {
          text: "Sorry I am late — the previous meeting ran over for twenty minutes.",
          why: "Quá giờ bao nhiêu thì dùng 'by'; 'for' là nói độ dài cả buổi.",
        },
        {
          text: "Sorry I am late — the previous meeting was run over by twenty minutes.",
          why: "'run over' ở nghĩa này là nội động từ, không có bị động.",
        },
      ],
      why: "run over + by + khoảng thời gian vượt quá.",
      situation: "Bạn xin lỗi vì đến muộn do buổi họp trước kéo dài.",
      collocations: ["run over by ten minutes", "run late", "wrap up on time"],
    },
    {
      en: "follow up",
      pos: "phrasal",
      vi: "liên hệ lại, theo sát",
      frame: "I will ___ with the client after the call.",
      frameAnswers: ["follow up"],
      model: "I will follow up with the client after the call.",
      chunks: ["I will follow up", "with the client", "after the call"],
      wrong: [
        {
          text: "I will follow up the client after the call.",
          why: "Liên hệ lại với NGƯỜI thì 'follow up with somebody'; 'follow up something' là theo sát một việc.",
        },
        {
          text: "I will following up with the client after the call.",
          why: "Sau 'will' phải là V nguyên mẫu.",
        },
      ],
      why: "follow up with + người, follow up on + việc.",
      situation: "Bạn nhận việc liên hệ lại với khách sau cuộc gọi.",
      collocations: ["follow up with somebody", "a follow-up email", "follow up on a request"],
    },
    {
      en: "conference call",
      pos: "n",
      vi: "cuộc gọi hội nghị",
      frame: "We will discuss the budget on a ___ on Friday.",
      frameAnswers: ["conference call"],
      model: "We will discuss the budget on a conference call on Friday.",
      chunks: ["We will discuss", "the budget", "on a conference call", "on Friday"],
      wrong: [
        {
          text: "We will discuss about the budget on a conference call on Friday.",
          why: "discuss đi thẳng với tân ngữ, không 'discuss about'.",
        },
        {
          text: "We will discuss the budget on a conference calling on Friday.",
          why: "'conference call' là danh từ ghép cố định, không thêm -ing.",
        },
      ],
      why: "discuss + tân ngữ; tham gia cuộc gọi dùng 'on a call'.",
      situation: "Bạn báo cả nhóm ngân sách sẽ được bàn trong cuộc gọi hội nghị thứ Sáu.",
      collocations: ["join a conference call", "set up a conference call", "be on a call"],
    },
  ],
  combos: [
    {
      words: ["reschedule", "in advance"],
      situation: "Xin đổi lịch họp thứ Sáu và hứa lần sau báo sớm hơn.",
      model: "Could we reschedule Friday's meeting? Next time I will let you know at least two days in advance.",
    },
    {
      words: ["agenda", "attend"],
      situation: "Gửi lời mời họp kèm nội dung cho cả nhóm.",
      model: "Please attend Monday's meeting at ten; the agenda is attached.",
    },
    {
      words: ["postpone", "confirm", "participant"],
      situation: "Thông báo hoãn buổi tập huấn và xin xác nhận lại.",
      model: "We have postponed the workshop to June, so please confirm whether each participant can still come.",
    },
    {
      words: ["minutes", "follow up"],
      situation: "Phân việc ngay sau buổi họp.",
      model: "I will send out the minutes today and follow up with the vendor tomorrow.",
    },
    {
      words: ["conference call", "run over", "be held"],
      situation: "Giải thích vì sao buổi duyệt bị dồn sang sau giờ trưa.",
      model: "The conference call ran over, so the review will be held after lunch instead.",
    },
  ],
};
