// ─────────────────────────────────────
// Writing Part 2 — Lý thuyết & kho mẫu câu
// Nội dung bám theo giáo trình. Quiz được sinh tự động từ chính dữ liệu này
// nên phần đọc và phần luyện không bao giờ lệch nhau.
// ─────────────────────────────────────

export type Phrase = {
  en: string;
  vi?: string;
  /** Ví dụ áp dụng đầy đủ */
  eg?: string;
  /** Dữ liệu cho quiz điền khuyết — dùng ___ trong `masked` */
  blank?: { masked: string; answer: string; distractors: string[] };
};

export type TheoryGroup = {
  title: string;
  hint?: string;
  phrases: Phrase[];
};

export type TheorySection = {
  id: string;
  num: string;
  title: string;
  intro: string;
  /** Nhãn dùng làm đáp án trong quiz "câu này dùng để làm gì" */
  quizLabel: string;
  groups: TheoryGroup[];
};

export const THEORY: TheorySection[] = [
  {
    id: "xung-ho",
    num: "01",
    title: "Phép xưng hô",
    quizLabel: "Xưng hô đầu thư",
    intro:
      "Nếu người gửi e-mail có nêu tên rõ ràng, khi trả lời bạn phải nêu rõ tên người đó. Nếu e-mail không nêu tên, dùng cách xưng hô sao cho không mất lịch sự và ai liên quan cũng nhận được thư.",
    groups: [
      {
        title: "Khi e-mail đề có nêu tên cụ thể",
        hint: "Dùng Dear + Mr./Ms./Mrs. + HỌ. Chỉ gọi tên riêng khi thật sự thân thiết.",
        phrases: [
          { en: "Dear John,", vi: "Kính gửi anh John," },
          { en: "Dear Mr. Backer,", vi: "Kính gửi ông Backer," },
          { en: "Dear Ms. Backer,", vi: "Kính gửi bà/cô Backer," },
          { en: "Dear Mrs. Thomson,", vi: "Kính gửi bà Thomson," },
        ],
      },
      {
        title: "Khi không biết tên người nhận",
        hint: "Chỉ biết tên cơ quan hoặc bộ phận thì dùng nhóm này.",
        phrases: [
          {
            en: "To Whom It May Concern,",
            vi: "Kính gửi quý vị có liên quan,",
            blank: { masked: "To ___ It May Concern,", answer: "Whom", distractors: ["Who", "Which", "Whose"] },
          },
          {
            en: "To the Human Resources Department,",
            vi: "Kính gửi Phòng Nhân sự,",
            blank: { masked: "To the Human ___ Department,", answer: "Resources", distractors: ["Resource", "Resourceful", "Resourcing"] },
          },
          {
            en: "Dear Sir or Madam,",
            vi: "Kính gửi quý ông/quý bà,",
            blank: { masked: "Dear Sir ___ Madam,", answer: "or", distractors: ["and", "to", "with"] },
          },
        ],
      },
    ],
  },
  {
    id: "chao-hoi",
    num: "02",
    title: "Câu chào hỏi mở đầu",
    quizLabel: "Câu chào hỏi mở đầu",
    intro:
      "Tuỳ e-mail trang trọng hay thông thường mà chọn câu chào khác nhau. E-mail công việc giữa các cơ quan thì luôn dùng nhóm lịch sự. Đây là câu THỨ HAI của thư, đứng ngay sau xưng hô.",
    groups: [
      {
        title: "Câu chào hỏi lịch sự",
        hint: "Nhắc lại ngày và chủ đề e-mail của họ — chứng minh bạn đã đọc kỹ.",
        phrases: [
          {
            en: "I just got your e-mail about…",
            vi: "Tôi vừa nhận được e-mail của bạn về…",
            blank: { masked: "I just ___ your e-mail about the delay.", answer: "got", distractors: ["get", "getting", "gets"] },
          },
          {
            en: "Thank you for your e-mail dated August 29.",
            vi: "Cảm ơn e-mail đề ngày 29 tháng 8 của bạn.",
            blank: { masked: "Thank you for your e-mail ___ August 29.", answer: "dated", distractors: ["date", "dating", "dates"] },
          },
          {
            en: "I've just received your e-mail of July 10th concerning…",
            vi: "Tôi vừa nhận được e-mail ngày 10 tháng 7 của bạn về việc…",
            blank: { masked: "I've just received your e-mail of July 10th ___ the refund.", answer: "concerning", distractors: ["concern", "concerned", "concerns"] },
          },
          {
            en: "I've just read your e-mail regarding…",
            vi: "Tôi vừa đọc e-mail của bạn về việc…",
            blank: { masked: "I've just read your e-mail ___ the delivery problem.", answer: "regarding", distractors: ["regard", "regards", "regarded"] },
          },
        ],
      },
      {
        title: "Câu chào hỏi thông thường",
        hint: "Chỉ dùng với đồng nghiệp thân thiết. Trong bài thi TOEIC nên tránh.",
        phrases: [
          { en: "Hi Jenny,", vi: "Chào Jenny," },
          { en: "Good morning, Mr. Jackson", vi: "Chào buổi sáng, ông Jackson" },
          { en: "Good afternoon, Mr. Jackson", vi: "Chào buổi chiều, ông Jackson" },
          { en: "Good evening, Mr. Jackson", vi: "Chào buổi tối, ông Jackson" },
        ],
      },
    ],
  },
  {
    id: "cung-cap-thong-tin",
    num: "03",
    title: "Cung cấp thông tin",
    quizLabel: "Cung cấp thông tin",
    intro:
      "Hầu hết e-mail TOEIC yêu cầu bạn cung cấp thông tin về một sự việc cụ thể. Câu văn phải nhẹ nhàng, cô đọng, tập trung vào trọng tâm câu hỏi.",
    groups: [
      {
        title: "Khuôn mở đầu khi cung cấp thông tin",
        phrases: [
          {
            en: "I am writing to let you know about…",
            vi: "Tôi viết thư này để báo cho bạn biết về…",
            blank: { masked: "I am writing to ___ you know about the schedule change.", answer: "let", distractors: ["letting", "lets", "make"] },
          },
          {
            en: "I am writing to inform you of…",
            vi: "Tôi viết thư này để thông báo với bạn về…",
            blank: { masked: "I am writing to inform you ___ a change in our policy.", answer: "of", distractors: ["to", "for", "with"] },
          },
          {
            en: "I'd like to give you information on…",
            vi: "Tôi muốn cung cấp cho bạn thông tin về…",
            blank: { masked: "I'd like to give you ___ on our summer programs.", answer: "information", distractors: ["informations", "informing", "informed"] },
          },
          {
            en: "I am attaching some information on…",
            vi: "Tôi xin đính kèm một số thông tin về…",
            blank: { masked: "I am ___ some information on the products.", answer: "attaching", distractors: ["attached", "attach", "attachment"] },
          },
          { en: "I would like to let you know that…", vi: "Tôi muốn cho bạn biết rằng…" },
        ],
      },
      {
        title: "Khi thông tin bạn cung cấp là một lời phàn nàn",
        phrases: [
          {
            en: "I'm writing to complain about…",
            vi: "Tôi viết thư này để phàn nàn về…",
            eg: "I am writing to complain about a problem with the copier that I bought last week.",
            blank: { masked: "I am writing to ___ about a problem with the copier.", answer: "complain", distractors: ["complaint", "complaining", "complains"] },
          },
          {
            en: "I'm writing in connection to…",
            vi: "Tôi viết thư này liên quan đến việc…",
            eg: "I'm writing in connection to the problem that we have recently experienced with the fax machine purchased from your store.",
            blank: { masked: "I'm writing in ___ to the problem with the fax machine.", answer: "connection", distractors: ["connect", "connecting", "connected"] },
          },
        ],
      },
    ],
  },
  {
    id: "de-nghi",
    num: "04",
    title: "Đề nghị / Gợi ý",
    quizLabel: "Đề nghị / gợi ý",
    intro:
      "Khi e-mail có nội dung đề nghị hoặc gợi ý, thường dùng “How about…?”, “Why don't…?”, hoặc nội dung khuyến cáo “You should…”. Với e-mail khiếu nại, nội dung trả lời có thể đề cập việc bồi thường (compensation) — cũng được xem là mission gợi ý.",
    groups: [
      {
        title: "Khuôn đưa ra đề nghị",
        phrases: [
          {
            en: "I suggest that you should…",
            vi: "Tôi đề nghị bạn nên…",
            eg: "I suggest that you should come early from now on.",
            blank: { masked: "I ___ that you should come early from now on.", answer: "suggest", distractors: ["suggestion", "suggesting", "suggests"] },
          },
          {
            en: "I have a suggestion for you…",
            vi: "Tôi có một gợi ý cho bạn…",
            eg: "I have a suggestion for you about the vehicle that you are going to purchase.",
            blank: { masked: "I have a ___ for you about the vehicle.", answer: "suggestion", distractors: ["suggest", "suggesting", "suggested"] },
          },
          {
            en: "In my opinion, it would be good to…",
            vi: "Theo ý tôi, sẽ tốt hơn nếu…",
            eg: "In my opinion, it would be good to go on a business trip with your colleagues this time.",
            blank: { masked: "In my ___, it would be good to start with the basic level.", answer: "opinion", distractors: ["opinions", "opine", "opinionated"] },
          },
          {
            en: "One thing I can recommend is…",
            vi: "Một điều tôi có thể khuyên là…",
            eg: "One thing I can recommend is we take the subway to avoid traffic congestion.",
            blank: { masked: "One thing I can ___ is our weekend class.", answer: "recommend", distractors: ["recommendation", "recommending", "recommends"] },
          },
          {
            en: "I would suggest that it would be better for you to…",
            vi: "Tôi cho rằng sẽ tốt hơn cho bạn nếu…",
            eg: "I would suggest that it would be better for you to move to another company for a better salary.",
          },
        ],
      },
    ],
  },
  {
    id: "xin-loi",
    num: "05",
    title: "Xin lỗi",
    quizLabel: "Xin lỗi",
    intro:
      "E-mail xin lỗi thường xoay quanh việc người bán hàng hoặc nhà sản xuất xin lỗi khách hàng về sự cố, bất tiện phát sinh trong quá trình mua hàng, sử dụng hàng hoá hoặc dịch vụ. Phải dùng ngôn ngữ lịch sự và trịnh trọng.",
    groups: [
      {
        title: "Khuôn mở đầu thư xin lỗi",
        phrases: [
          {
            en: "I am writing in relation to your recent complaint.",
            vi: "Tôi viết thư này liên quan đến khiếu nại gần đây của bạn.",
            eg: "I am writing in relation to your recent complaint about the poor service you received the other day.",
            blank: { masked: "I am writing in ___ to your recent complaint.", answer: "relation", distractors: ["relate", "relating", "related"] },
          },
          {
            en: "I was very concerned to learn about…",
            vi: "Tôi rất lo lắng khi biết về…",
            eg: "I was very concerned to learn about the problem that you experienced.",
            blank: { masked: "I was very ___ to learn about your problem.", answer: "concerned", distractors: ["concern", "concerning", "concerns"] },
          },
          {
            en: "I would like to apologize for the inconvenience.",
            vi: "Tôi xin lỗi vì sự bất tiện này.",
            eg: "I would like to apologize for any inconvenience that you might have received at our hotel.",
            blank: { masked: "I would like to ___ for the inconvenience.", answer: "apologize", distractors: ["apology", "apologizing", "apologetic"] },
          },
        ],
      },
      {
        title: "Câu diễn đạt lời xin lỗi thường dùng",
        phrases: [
          {
            en: "Please accept my sincere apology.",
            vi: "Xin hãy chấp nhận lời xin lỗi chân thành của tôi.",
            blank: { masked: "Please ___ my sincere apology.", answer: "accept", distractors: ["accepted", "accepting", "acceptance"] },
          },
          { en: "I would like to apologize for the inconvenience you have suffered.", vi: "Tôi xin lỗi vì sự bất tiện mà bạn đã phải chịu." },
          { en: "On behalf of my store, I would like to apologize.", vi: "Thay mặt cửa hàng, tôi xin lỗi." },
        ],
      },
    ],
  },
  {
    id: "cau-ket",
    num: "06",
    title: "Câu kết thúc nội dung",
    quizLabel: "Câu kết",
    intro:
      "Câu kết đứng ngay trước lời chào cuối thư. Chọn câu kết theo loại mission: đang chờ hồi âm, hay đang xin lỗi và bồi thường.",
    groups: [
      {
        title: "Khi e-mail yêu cầu thông tin / hỏi thêm / trình bày vấn đề",
        hint: "Nhóm này diễn tả ý mong đợi thông tin phản hồi.",
        phrases: [
          { en: "Please e-mail me as soon as possible.", vi: "Xin hãy e-mail cho tôi sớm nhất có thể." },
          { en: "Hope to hear from you soon.", vi: "Mong sớm nhận được hồi âm." },
          {
            en: "I'm looking forward to receiving your early reply.",
            vi: "Tôi mong nhận được hồi âm sớm của bạn.",
            blank: { masked: "I'm looking forward to ___ your early reply.", answer: "receiving", distractors: ["receive", "received", "receipt"] },
          },
          {
            en: "An early reply would be greatly appreciated.",
            vi: "Một hồi âm sớm sẽ được đánh giá rất cao.",
            blank: { masked: "An early reply would be greatly ___.", answer: "appreciated", distractors: ["appreciate", "appreciating", "appreciation"] },
          },
          {
            en: "Please send your response by the end of November.",
            vi: "Xin gửi phản hồi trước cuối tháng Mười Một.",
            blank: { masked: "Please send your response ___ the end of November.", answer: "by", distractors: ["until", "in", "since"] },
          },
        ],
      },
      {
        title: "Khi e-mail là xin lỗi / đề nghị bồi thường",
        phrases: [
          { en: "To compensate for the inconvenience, we would like to offer you…", vi: "Để bù đắp sự bất tiện, chúng tôi muốn dành cho bạn…" },
          {
            en: "We will replace ordered items or give you a full refund instantly.",
            vi: "Chúng tôi sẽ thay sản phẩm hoặc hoàn tiền toàn bộ ngay lập tức.",
            blank: { masked: "We will ___ ordered items or give you a full refund.", answer: "replace", distractors: ["replaced", "replacing", "replacement"] },
          },
          {
            en: "Thank you for pointing this matter out to us.",
            vi: "Cảm ơn vì đã chỉ ra vấn đề này cho chúng tôi.",
            blank: { masked: "Thank you for ___ this matter out to us.", answer: "pointing", distractors: ["point", "pointed", "points"] },
          },
          {
            en: "We have full assurance that it will not happen again.",
            vi: "Chúng tôi đảm bảo chắc chắn rằng chuyện này sẽ không tái diễn.",
            blank: { masked: "We have full ___ that it will not happen again.", answer: "assurance", distractors: ["assure", "assuring", "assured"] },
          },
          { en: "Once again, we hope you will consider my sincere apologies for the inconvenience caused.", vi: "Một lần nữa, mong bạn xem xét lời xin lỗi chân thành của tôi." },
          { en: "We expect that you will continue to use our services from now on.", vi: "Chúng tôi mong bạn tiếp tục sử dụng dịch vụ của chúng tôi." },
          {
            en: "If you have any further queries, please contact me without hesitation.",
            vi: "Nếu còn thắc mắc nào khác, xin đừng ngần ngại liên hệ với tôi.",
            blank: { masked: "If you have any further ___, please contact me.", answer: "queries", distractors: ["query", "querying", "queried"] },
          },
        ],
      },
    ],
  },
  {
    id: "chao-cuoi",
    num: "07",
    title: "Lời chào cuối thư",
    quizLabel: "Lời chào cuối thư",
    intro:
      "Đứng ở dòng cuối cùng, ngay trên chữ ký. Tuỳ thư trịnh trọng hay thông thường mà chọn cho phù hợp. Trong bài thi TOEIC, luôn chọn từ nhóm trang trọng.",
    groups: [
      {
        title: "Các lời chào cuối thư thông dụng",
        phrases: [
          { en: "Best wishes,", vi: "Thân ái," },
          { en: "Regards,", vi: "Trân trọng," },
          { en: "Warm regards,", vi: "Thân mến," },
          { en: "Best regards,", vi: "Trân trọng," },
          { en: "Sincerely,", vi: "Trân trọng," },
          { en: "Sincerely yours,", vi: "Trân trọng kính thư," },
          { en: "Yours truly,", vi: "Kính thư," },
          { en: "Cordially,", vi: "Kính thư," },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────
// Thang mức trang trọng (từ ảnh giáo trình)
// ─────────────────────────────────────

export const FORMALITY_LADDER: { text: string; level: string; safe: boolean }[] = [
  { text: "Talk to you later!", level: "Casual — suồng sã", safe: false },
  { text: "Best wishes,", level: "Thân mật", safe: false },
  { text: "Regards,", level: "Trung tính", safe: true },
  { text: "Best regards,", level: "Trung tính", safe: true },
  { text: "Sincerely,", level: "Trang trọng", safe: true },
  { text: "Sincerely yours,", level: "Trang trọng", safe: true },
  { text: "Yours truly,", level: "Rất trang trọng", safe: true },
  { text: "Cordially,", level: "Formal — rất trang trọng", safe: true },
];

// ─────────────────────────────────────
// Quy tắc ghép cặp mở ↔ kết (tiếng Anh-Anh)
// ─────────────────────────────────────

export const PAIR_RULES: { open: string; close: string; when: string; inQuiz: boolean }[] = [
  { open: "Dear Sir or Madam,", close: "Yours faithfully,", when: "Không biết tên người nhận", inQuiz: true },
  { open: "Dear Mr. Kim,", close: "Yours sincerely,", when: "Biết rõ tên người nhận", inQuiz: true },
  { open: "To Whom It May Concern,", close: "Yours faithfully,", when: "Gửi cho một cơ quan, không rõ ai đọc", inQuiz: true },
  // Chỉ hiển thị ở bảng đọc: với opener suồng sã thì "Talk to you later!" cũng hợp lệ
  // nên không có đáp án duy nhất, đưa vào quiz sẽ gây ức chế.
  { open: "Hi Jenny,", close: "Best regards,", when: "Đồng nghiệp thân thiết (tránh dùng trong bài thi)", inQuiz: false },
];

// ─────────────────────────────────────
// Chủ đề thường gặp — quan hệ doanh nghiệp ↔ khách hàng
// ─────────────────────────────────────

export const COMMON_TOPICS: string[] = [
  "Cảm ơn khách hàng đã mua sản phẩm",
  "Thông báo thời gian bán hàng và giới thiệu sản phẩm mới",
  "Cung cấp thông tin về dịch vụ và sản phẩm khách hàng đã mua",
  "Thông báo số lượng đặt mua, số tiền thanh toán, ngày giao hàng và cách lắp ráp",
  "Thông báo gia hạn dịch vụ hậu mãi, quy định đổi và trả hàng",
];

// ─────────────────────────────────────
// Sinh quiz từ chính dữ liệu trên
// ─────────────────────────────────────

export type QuizQ = {
  kind: "function" | "blank" | "pair" | "formality";
  prompt: string;
  /** Câu tiếng Anh hiển thị nổi bật (nếu có) */
  stem?: string;
  options: string[];
  answer: string;
  explain: string;
};

function shuffle<T>(a: T[]): T[] {
  const o = [...a];
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

function sample<T>(a: T[], n: number): T[] {
  return shuffle(a).slice(0, n);
}

/** "Câu này dùng để làm gì?" — đáp án nhiễu lấy từ các nhóm chức năng khác */
function buildFunctionQuestions(): QuizQ[] {
  const labels = THEORY.map((s) => s.quizLabel);
  const out: QuizQ[] = [];
  for (const sec of THEORY) {
    for (const g of sec.groups) {
      for (const p of g.phrases) {
        const others = sample(labels.filter((l) => l !== sec.quizLabel), 3);
        out.push({
          kind: "function",
          prompt: "Câu này thuộc nhóm chức năng nào?",
          stem: p.en,
          options: shuffle([sec.quizLabel, ...others]),
          answer: sec.quizLabel,
          explain: `${sec.num} · ${sec.title} — ${g.title}.${p.vi ? ` Nghĩa: ${p.vi}` : ""}`,
        });
      }
    }
  }
  return out;
}

/** "Điền từ còn thiếu" — chỉ dùng những mẫu câu đã khai báo sẵn blank */
function buildBlankQuestions(): QuizQ[] {
  const out: QuizQ[] = [];
  for (const sec of THEORY) {
    for (const g of sec.groups) {
      for (const p of g.phrases) {
        if (!p.blank) continue;
        out.push({
          kind: "blank",
          prompt: "Điền từ đúng vào chỗ trống:",
          stem: p.blank.masked,
          options: shuffle([p.blank.answer, ...p.blank.distractors]),
          answer: p.blank.answer,
          explain: `Mẫu câu gốc: “${p.en}”${p.vi ? ` — ${p.vi}` : ""}`,
        });
      }
    }
  }
  return out;
}

/** "Mở thế này thì kết thế nào?" */
function buildPairQuestions(): QuizQ[] {
  const rules = PAIR_RULES.filter((r) => r.inQuiz);
  const closes = Array.from(new Set(PAIR_RULES.map((r) => r.close)));
  return rules.map((r) => ({
    kind: "pair" as const,
    prompt: "Thư mở đầu như dưới đây thì lời chào cuối nào phù hợp nhất?",
    stem: r.open,
    options: shuffle(Array.from(new Set([r.close, ...closes.filter((c) => c !== r.close), "Talk to you later!"])).slice(0, 4)),
    answer: r.close,
    explain: `${r.when}. Quy tắc Anh-Anh: mở bằng “Dear Sir or Madam” thì kết bằng “Yours faithfully”; mở bằng tên cụ thể thì kết bằng “Yours sincerely”.`,
  }));
}

/** "Câu nào KHÔNG dùng được trong e-mail công việc?" */
function buildFormalityQuestions(): QuizQ[] {
  const safe = FORMALITY_LADDER.filter((f) => f.safe).map((f) => f.text);
  const unsafe = FORMALITY_LADDER.filter((f) => !f.safe);
  return unsafe.map((u) => ({
    kind: "formality" as const,
    prompt: "Câu nào KHÔNG phù hợp để kết thúc một e-mail công việc?",
    options: shuffle([u.text, ...sample(safe, 3)]),
    answer: u.text,
    explain: `“${u.text}” thuộc mức ${u.level}. Trong bài thi TOEIC luôn chọn Sincerely / Best regards / Yours truly / Cordially.`,
  }));
}

/** Trộn một đề quiz gồm `n` câu, cân bằng giữa các dạng */
export function buildQuiz(n: number): QuizQ[] {
  const fn = buildFunctionQuestions();
  const bl = buildBlankQuestions();
  const pr = buildPairQuestions();
  const fm = buildFormalityQuestions();

  const nBlank = Math.round(n * 0.4);
  const nFunc = Math.round(n * 0.4);
  const rest = Math.max(0, n - nBlank - nFunc);

  const blPicked = sample(bl, nBlank);
  const fnPicked = sample(fn, nFunc);
  const extraPicked = sample([...pr, ...fm], rest);

  const picked = [...blPicked, ...fnPicked, ...extraPicked];

  // Các dạng phụ (ghép cặp, mức trang trọng) có rất ít câu — nếu thiếu so với `n`
  // thì bù thêm từ hai kho lớn để người học luôn nhận đủ số câu đã chọn.
  if (picked.length < n) {
    const used = new Set(picked);
    const spare = shuffle([...bl, ...fn].filter((q) => !used.has(q)));
    picked.push(...spare.slice(0, n - picked.length));
  }

  return shuffle(picked).slice(0, n);
}

export function countPhrases(): number {
  return THEORY.reduce((sum, s) => sum + s.groups.reduce((a, g) => a + g.phrases.length, 0), 0);
}
