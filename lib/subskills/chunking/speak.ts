// Liệu nhánh Nói của subskill Chunking.
//
// Ranh giới chunk ở đây viết tay nhưng phải khớp với bộ cắt ở `chunker.ts` —
// chạy `npx tsx scripts/chunking/check-speak-data.ts` để đối chiếu. Làm vậy để
// đáp án của nhánh Nói và nhánh Nghe cùng một quy ước, học sinh không gặp hai
// kiểu cắt khác nhau.
//
// `stress` là từ nhận đỉnh nhấn của chunk, theo luật hạt nhân: đỉnh nhấn rơi
// vào TỪ NỘI DUNG CUỐI của chunk (danh/động/tính/trạng từ), không phải từ chức
// năng. Mỗi chunk đúng một đỉnh — đó là chỗ học sinh hay nhấn đều nên nghe như
// máy đọc.

export type SpeakChunk = {
  en: string;
  vi: string;
  /** Từ nhận đỉnh nhấn, viết đúng như trong `en` */
  stress: string;
};

export type SpeakSentence = { chunks: SpeakChunk[] };

export type SpeakPassage = {
  id: string;
  genre: string;
  genreVi: string;
  sentences: SpeakSentence[];
};

export type SpeakSample = {
  id: string;
  task: "q5-7" | "q11";
  /** Chủ đề ngắn, để phân biệt các bài cùng dạng trong danh sách */
  topicVi: string;
  question: string;
  questionVi: string;
  chunks: SpeakChunk[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Đoạn đọc to — thể loại y như Speaking Questions 1-2
// ─────────────────────────────────────────────────────────────────────────────

export const SPEAK_PASSAGES: SpeakPassage[] = [
  {
    id: "voice-mail",
    genre: "Voice mail message",
    genreVi: "Tin nhắn thoại",
    sentences: [
      {
        chunks: [{ en: "Hi.", vi: "Xin chào.", stress: "Hi." }],
      },
      {
        chunks: [
          { en: "This is Myra Peters", vi: "Tôi là Myra Peters", stress: "Peters" },
          { en: "calling about my appointment", vi: "gọi về cuộc hẹn của tôi", stress: "appointment" },
          { en: "with Dr. Jones.", vi: "với bác sĩ Jones.", stress: "Jones." },
        ],
      },
      {
        chunks: [
          { en: "I have a three o'clock appointment", vi: "Tôi có một cuộc hẹn lúc 3 giờ", stress: "appointment" },
          { en: "scheduled for this afternoon.", vi: "đã đặt vào chiều nay.", stress: "afternoon." },
        ],
      },
      {
        chunks: [
          { en: "Unfortunately, I won't be able", vi: "Tiếc là tôi sẽ không thể", stress: "able" },
          { en: "to keep it", vi: "giữ cuộc hẹn đó", stress: "keep" },
          { en: "because of an important meeting", vi: "vì có một cuộc họp quan trọng", stress: "meeting" },
          { en: "at work.", vi: "ở công ty.", stress: "work." },
        ],
      },
      {
        chunks: [
          { en: "So I'll need to reschedule.", vi: "Nên tôi cần hẹn lại.", stress: "reschedule." },
        ],
      },
      {
        chunks: [
          { en: "Any time Monday,", vi: "Giờ nào thứ Hai,", stress: "Monday," },
          { en: "Tuesday, or Wednesday afternoon would work", vi: "thứ Ba, hay chiều thứ Tư cũng được", stress: "work" },
          { en: "for me.", vi: "với tôi.", stress: "me." },
        ],
      },
    ],
  },
  {
    id: "airport-announce",
    genre: "Announcement",
    genreVi: "Thông báo sân bay",
    sentences: [
      {
        chunks: [
          { en: "Attention, passengers", vi: "Xin quý khách chú ý,", stress: "passengers" },
          { en: "waiting for Flight 412", vi: "đang chờ chuyến bay 412", stress: "412" },
          { en: "to Seattle.", vi: "đi Seattle.", stress: "Seattle." },
        ],
      },
      {
        chunks: [
          { en: "Because of heavy rain", vi: "Vì mưa lớn", stress: "rain" },
          { en: "in the Seattle area,", vi: "ở khu vực Seattle,", stress: "area," },
          { en: "our departure has been delayed", vi: "giờ khởi hành bị hoãn", stress: "delayed" },
          { en: "by approximately forty minutes.", vi: "khoảng 40 phút.", stress: "minutes." },
        ],
      },
      {
        chunks: [
          { en: "We will begin boarding", vi: "Chúng tôi sẽ bắt đầu cho lên máy bay", stress: "boarding" },
          { en: "at gate twenty-three", vi: "ở cửa số 23", stress: "twenty-three" },
          { en: "at five fifteen.", vi: "vào 5 giờ 15.", stress: "fifteen." },
        ],
      },
      {
        chunks: [
          { en: "Passengers who need assistance should speak", vi: "Quý khách cần hỗ trợ xin trao đổi", stress: "speak" },
          { en: "with an agent", vi: "với nhân viên", stress: "agent" },
          { en: "at the counter.", vi: "ở quầy.", stress: "counter." },
        ],
      },
      {
        chunks: [
          { en: "We apologize", vi: "Chúng tôi xin lỗi", stress: "apologize" },
          { en: "for the inconvenience", vi: "vì sự bất tiện này", stress: "inconvenience" },
          { en: "and thank you", vi: "và cảm ơn quý khách", stress: "thank" },
          { en: "for your patience.", vi: "đã kiên nhẫn.", stress: "patience." },
        ],
      },
    ],
  },
  {
    id: "museum-tour",
    genre: "Tour information",
    genreVi: "Giới thiệu tour tham quan",
    sentences: [
      {
        chunks: [
          { en: "Good morning,", vi: "Chào buổi sáng,", stress: "morning," },
          { en: "and welcome", vi: "và xin chào mừng", stress: "welcome" },
          { en: "to the Riverside Museum of Design.", vi: "đến Bảo tàng Thiết kế Riverside.", stress: "Design." },
        ],
      },
      {
        chunks: [
          { en: "My name is Carla,", vi: "Tôi tên Carla,", stress: "Carla," },
          { en: "and I'll be your guide", vi: "và tôi sẽ là hướng dẫn viên", stress: "guide" },
          { en: "for this morning's tour.", vi: "cho tour sáng nay.", stress: "tour." },
        ],
      },
      {
        chunks: [
          { en: "We'll start in the main hall,", vi: "Ta sẽ bắt đầu ở gian chính,", stress: "hall," },
          { en: "where you can see furniture made", vi: "nơi quý khách thấy đồ nội thất làm", stress: "made" },
          { en: "by local craftspeople.", vi: "bởi nghệ nhân địa phương.", stress: "craftspeople." },
        ],
      },
      {
        chunks: [
          { en: "Please remember", vi: "Xin lưu ý", stress: "remember" },
          { en: "that photography is not permitted", vi: "rằng không được chụp ảnh", stress: "permitted" },
          { en: "inside the galleries.", vi: "bên trong các phòng trưng bày.", stress: "galleries." },
        ],
      },
      {
        chunks: [
          { en: "If you have questions", vi: "Nếu quý khách có thắc mắc", stress: "questions" },
          { en: "during the tour,", vi: "trong lúc tham quan,", stress: "tour," },
          { en: "feel free", vi: "xin cứ thoải mái", stress: "free" },
          { en: "to ask me", vi: "hỏi tôi", stress: "ask" },
          { en: "at any time.", vi: "bất cứ lúc nào.", stress: "time." },
        ],
      },
    ],
  },
  {
    id: "traffic-report",
    genre: "Radio report",
    genreVi: "Bản tin giao thông",
    sentences: [
      {
        chunks: [
          { en: "And now", vi: "Và bây giờ", stress: "now" },
          { en: "for your afternoon traffic update here", vi: "là bản tin giao thông buổi chiều", stress: "here" },
          { en: "on Radio 88.", vi: "trên Radio 88.", stress: "88." },
        ],
      },
      {
        chunks: [
          { en: "Drivers heading north", vi: "Tài xế đi về hướng bắc", stress: "north" },
          { en: "on Highway 9 should expect delays", vi: "trên Quốc lộ 9 nên lường trước tắc đường", stress: "delays" },
          { en: "near the Fifth Street exit.", vi: "gần lối ra Phố Năm.", stress: "exit." },
        ],
      },
      {
        chunks: [
          { en: "Crews are repairing the road surface there,", vi: "Công nhân đang sửa mặt đường ở đó,", stress: "there," },
          { en: "and only one lane is open.", vi: "và chỉ còn một làn mở.", stress: "open." },
        ],
      },
      {
        chunks: [
          { en: "If you're travelling downtown this evening,", vi: "Nếu bạn vào trung tâm chiều nay,", stress: "evening," },
          { en: "we recommend", vi: "chúng tôi khuyên", stress: "recommend" },
          { en: "taking Park Avenue instead.", vi: "nên đi đường Park thay vì vậy.", stress: "instead." },
        ],
      },
      {
        chunks: [
          { en: "We'll have another update", vi: "Chúng tôi sẽ có bản tin tiếp", stress: "update" },
          { en: "for you", vi: "cho bạn", stress: "you" },
          { en: "at the top of the hour.", vi: "vào đầu giờ kế tiếp.", stress: "hour." },
        ],
      },
    ],
  },
  {
    id: "speaker-intro",
    genre: "Introduction of a speaker",
    genreVi: "Lời giới thiệu diễn giả",
    sentences: [
      {
        chunks: [
          { en: "Our speaker tonight is Mr. John Wilson,", vi: "Diễn giả tối nay là ông John Wilson,", stress: "Wilson," },
          { en: "who has just returned", vi: "người vừa trở về", stress: "returned" },
          { en: "from traveling", vi: "sau chuyến đi", stress: "traveling" },
          { en: "in South America.", vi: "ở Nam Mỹ.", stress: "America." },
        ],
      },
      {
        chunks: [
          { en: "Mr. Wilson spent his trip", vi: "Ông Wilson dành cả chuyến đi", stress: "trip" },
          { en: "photographing scenes of small-town life", vi: "chụp ảnh cảnh sống ở các thị trấn nhỏ", stress: "life" },
          { en: "across the continent.", vi: "khắp lục địa.", stress: "continent." },
        ],
      },
      {
        chunks: [
          { en: "His work", vi: "Tác phẩm của ông", stress: "work" },
          { en: "is well known around the world,", vi: "được biết đến khắp thế giới,", stress: "world," },
          { en: "and his photography has been featured", vi: "và ảnh của ông đã xuất hiện", stress: "featured" },
          { en: "in numerous newspapers and magazines.", vi: "trên nhiều báo và tạp chí.", stress: "magazines." },
        ],
      },
      {
        chunks: [
          { en: "Tonight he will share", vi: "Tối nay ông sẽ chia sẻ", stress: "share" },
          { en: "with us photographs", vi: "với chúng ta những bức ảnh", stress: "photographs" },
          { en: "and stories from his recent trip.", vi: "và câu chuyện từ chuyến đi vừa rồi.", stress: "trip." },
        ],
      },
    ],
  },
  {
    id: "advertisement",
    genre: "Advertisement",
    genreVi: "Quảng cáo",
    sentences: [
      {
        chunks: [
          { en: "If you're shopping,", vi: "Nếu bạn cứ đi mua sắm,", stress: "shopping," },
          { en: "sightseeing and running around every minute,", vi: "ngắm cảnh và chạy khắp nơi từng phút,", stress: "minute," },
          { en: "your vacation can seem like hard work.", vi: "kỳ nghỉ của bạn hoá ra như đi làm.", stress: "work." },
        ],
      },
      {
        chunks: [
          { en: "To avoid vacation stress,", vi: "Để tránh căng thẳng khi nghỉ,", stress: "stress," },
          { en: "come to the Blue Valley Inn", vi: "hãy đến Blue Valley Inn", stress: "Inn" },
          { en: "on beautiful Lake Mead.", vi: "bên hồ Mead xinh đẹp.", stress: "Mead." },
        ],
      },
      {
        chunks: [
          { en: "While staying at our inn,", vi: "Khi ở nhà nghỉ của chúng tôi,", stress: "inn," },
          { en: "you'll breathe clean country air as you view spectacular sights.", vi: "bạn hít khí trời trong lành trong khi ngắm cảnh tuyệt đẹp.", stress: "sights." },
        ],
      },
      {
        chunks: [
          { en: "The Blue Valley Inn prides itself", vi: "Blue Valley Inn tự hào", stress: "itself" },
          { en: "on the personal attention it provides", vi: "về sự chăm sóc riêng mà nơi này dành", stress: "provides" },
          { en: "to every guest.", vi: "cho từng khách.", stress: "guest." },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Bài mẫu nói tự do — Questions 5-7 và Question 11
// ─────────────────────────────────────────────────────────────────────────────

export const SPEAK_SAMPLES: SpeakSample[] = [
  {
    id: "q5-7-store",
    task: "q5-7",
    topicVi: "đi chợ",
    question: "How often do you go grocery shopping, and how much do you usually spend?",
    questionVi: "Bạn đi mua đồ ăn bao lâu một lần, và thường tiêu bao nhiêu?",
    chunks: [
      { en: "I usually shop", vi: "Tôi thường đi mua", stress: "shop" },
      { en: "for groceries", vi: "đồ ăn", stress: "groceries" },
      { en: "about twice a week,", vi: "khoảng hai lần một tuần,", stress: "week," },
      { en: "mostly on weekends.", vi: "phần lớn vào cuối tuần.", stress: "weekends." },
      { en: "The supermarket is only ten minutes", vi: "Siêu thị chỉ cách mười phút", stress: "minutes" },
      { en: "from my apartment,", vi: "từ căn hộ của tôi,", stress: "apartment," },
      { en: "so it is very convenient.", vi: "nên rất tiện.", stress: "convenient." },
      { en: "I normally spend around forty dollars,", vi: "Tôi thường tiêu chừng bốn mươi đô,", stress: "dollars," },
      { en: "because I buy food", vi: "vì tôi chỉ mua đồ ăn", stress: "food" },
      { en: "for just a few days.", vi: "cho vài ngày.", stress: "days." },
    ],
  },
  {
    id: "q5-7-transport",
    task: "q5-7",
    topicVi: "đi lại",
    question: "How do you usually get to work, and why do you choose that way?",
    questionVi: "Bạn thường đi làm bằng gì, và vì sao chọn cách đó?",
    chunks: [
      { en: "I take the bus", vi: "Tôi đi xe buýt", stress: "bus" },
      { en: "to work almost every day,", vi: "đi làm gần như mỗi ngày,", stress: "day," },
      { en: "usually around seven in the morning.", vi: "thường quãng bảy giờ sáng.", stress: "morning." },
      { en: "The trip takes", vi: "Chuyến đi mất", stress: "takes" },
      { en: "about thirty minutes", vi: "chừng ba mươi phút", stress: "minutes" },
      { en: "if the traffic is light.", vi: "nếu đường thoáng.", stress: "light." },
      { en: "I prefer the bus", vi: "Tôi thích xe buýt hơn", stress: "bus" },
      { en: "to driving", vi: "so với tự lái", stress: "driving" },
      { en: "because parking downtown is very expensive,", vi: "vì gửi xe trong trung tâm rất đắt,", stress: "expensive," },
      { en: "and I can read", vi: "và tôi đọc được sách", stress: "read" },
      { en: "on the way.", vi: "trên đường.", stress: "way." },
    ],
  },
  {
    id: "q11-remote",
    task: "q11",
    topicVi: "làm ở nhà",
    question:
      "Do you agree or disagree with the following statement? Working from home is better for most office employees.",
    questionVi:
      "Bạn đồng ý hay không với ý kiến sau? Làm việc tại nhà tốt hơn cho phần lớn nhân viên văn phòng.",
    chunks: [
      { en: "I think", vi: "Tôi cho rằng", stress: "think" },
      { en: "working from home is better", vi: "làm việc tại nhà thì tốt hơn", stress: "better" },
      { en: "for most office employees.", vi: "với phần lớn nhân viên văn phòng.", stress: "employees." },
      { en: "The main reason", vi: "Lý do chính", stress: "reason" },
      { en: "is that people save a lot of time", vi: "là người ta tiết kiệm được nhiều thời gian", stress: "time" },
      { en: "on commuting.", vi: "đi lại.", stress: "commuting." },
      { en: "In my city,", vi: "Ở thành phố tôi,", stress: "city," },
      { en: "a typical trip", vi: "một chuyến đi thường", stress: "trip" },
      { en: "to the office takes almost an hour", vi: "tới công ty mất gần một tiếng", stress: "hour" },
      { en: "each way.", vi: "mỗi lượt.", stress: "way." },
      { en: "Employees can use those hours", vi: "Nhân viên dùng số giờ đó", stress: "hours" },
      { en: "for rest or family instead.", vi: "để nghỉ hoặc cho gia đình.", stress: "instead." },
      { en: "As far as I know,", vi: "Theo tôi biết,", stress: "know," },
      { en: "most of my friends", vi: "phần lớn bạn tôi", stress: "friends" },
      { en: "are also more productive", vi: "cũng làm hiệu quả hơn", stress: "productive" },
      { en: "at home", vi: "ở nhà", stress: "home" },
      { en: "because the office is noisy.", vi: "vì văn phòng ồn.", stress: "noisy." },
    ],
  },
  {
    id: "q11-training",
    task: "q11",
    topicVi: "đào tạo",
    question:
      "Do you agree or disagree with the following statement? Companies should pay for employee training.",
    questionVi:
      "Bạn đồng ý hay không với ý kiến sau? Công ty nên chi trả cho việc đào tạo nhân viên.",
    chunks: [
      { en: "I agree", vi: "Tôi đồng ý", stress: "agree" },
      { en: "that companies should pay", vi: "rằng công ty nên chi trả", stress: "pay" },
      { en: "for employee training.", vi: "cho việc đào tạo nhân viên.", stress: "training." },
      { en: "To begin with,", vi: "Trước hết,", stress: "begin" },
      { en: "trained workers make fewer mistakes,", vi: "người được đào tạo mắc ít lỗi hơn,", stress: "mistakes," },
      { en: "so the company saves money", vi: "nên công ty tiết kiệm tiền", stress: "money" },
      { en: "in the long run.", vi: "về lâu dài.", stress: "run." },
      { en: "In addition,", vi: "Thêm nữa,", stress: "addition," },
      { en: "staff who receive training usually stay longer", vi: "nhân viên được đào tạo thường ở lại lâu hơn", stress: "longer" },
      { en: "at the company.", vi: "với công ty.", stress: "company." },
      { en: "For these reasons,", vi: "Vì những lẽ đó,", stress: "reasons," },
      { en: "I believe", vi: "tôi tin", stress: "believe" },
      { en: "training is an investment,", vi: "đào tạo là một khoản đầu tư,", stress: "investment," },
      { en: "not a cost.", vi: "không phải khoản chi.", stress: "cost." },
    ],
  },
];

export function getSpeakPassage(id: string): SpeakPassage | undefined {
  return SPEAK_PASSAGES.find((p) => p.id === id);
}

export function getSpeakSample(id: string): SpeakSample | undefined {
  return SPEAK_SAMPLES.find((s) => s.id === id);
}

/** Cả đoạn ghép lại thành văn bản liền mạch — dùng làm referenceText cho Azure. */
export function passageText(p: SpeakPassage): string {
  return p.sentences.map((s) => s.chunks.map((c) => c.en).join(" ")).join(" ");
}

export function sampleText(s: SpeakSample): string {
  return s.chunks.map((c) => c.en).join(" ");
}
