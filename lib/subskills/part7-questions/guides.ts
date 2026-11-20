// Hướng dẫn mỗi bài: ví dụ mẫu (GV làm) + câu làm thử (HV làm, có gợi ý 2 nấc).
// Câu lấy từ đề EST không trùng 230 câu trong bài. Riêng Điền câu là đoạn tự soạn.

import type { ABCD, DemoStep, P7QDemo, P7QGuide, P7QItem, P7QType, StrategyCode, TransError } from "./types";

type DemoInput = {
  id: string;
  type: P7QType;
  prompt: string;
  vi: string;
  wrong: [string, TransError, string][];
  kwNote: string;
  strategy: [StrategyCode[], StrategyCode, string];
  passage: [string, string];
  options: [string, string, string, string];
  answer: ABCD;
  optionWhy: [string, string, string, string];
  think?: Partial<Record<DemoStep, string>>;
  hints?: Partial<Record<DemoStep, [string, string]>>;
  extra?: Partial<P7QItem>;
  invented?: boolean;
};

function demo(d: DemoInput): P7QDemo {
  const item: P7QItem = {
    id: d.id,
    type: d.type,
    prompt: d.prompt,
    vi: d.vi,
    wrong: d.wrong.map(([text, error, why]) => ({ text, error, why })),
    kwNote: d.kwNote,
    strategy: { options: d.strategy[0], correct: d.strategy[1], why: d.strategy[2] },
    evidence: { doc: d.passage[0], excerpt: d.passage[1], note: d.optionWhy["ABCD".indexOf(d.answer)] },
    ...d.extra,
  };
  const [A, B, C, D] = d.options;
  const [wA, wB, wC, wD] = d.optionWhy;
  return {
    item,
    passage: { doc: d.passage[0], text: d.passage[1] },
    options: { A, B, C, D },
    answer: d.answer,
    optionWhy: { A: wA, B: wB, C: wC, D: wD },
    think: d.think,
    hints: d.hints,
    invented: d.invented,
  };
}

const POS = ["[1]", "[2]", "[3]", "[4]"] as [string, string, string, string];
const STEM = "In which of the positions marked [1], [2], [3], and [4] does the following sentence best belong?";

export const GUIDES: Record<P7QType, P7QGuide> = {
  // ── Mục đích ──────────────────────────────────────────────────────────────
  "muc-dich": {
    advancedNote: "Bài Nâng cao có bộ 2–3 văn bản (dùng tên người gửi / nhận để chọn đúng email), mục đích nằm sau câu chào hoặc ở đoạn 2, và câu có most likely.",
    example: demo({
      id: "2026-1-155",
      type: "muc-dich",
      prompt: "[[q:What]] is the [[t:purpose]] of the [[t:e-mail]]?",
      vi: "Mục đích của email là gì?",
      wrong: [
        ["Người nhận email muốn gì?", "chu-the", "Hỏi mục đích của email (người viết), không phải mong muốn của người nhận."],
        ["Email đã đạt được kết quả gì?", "thi-bi-dong", "Hỏi mục đích (hiện tại), không hỏi kết quả."],
      ],
      kwNote: "What → 🟦. purpose → 🟨 dạng Mục đích. e-mail → 🟨 phạm vi. Không có 🟩.",
      strategy: [["S1", "S2", "S3", "S7"], "S1", "Mục đích + không có từ nội dung → đọc tiêu đề và 2–3 câu đầu."],
      passage: ["Email", "Thank you for ordering the Makatasi ETX-Triple Refracting Telescope, model METX-33948. ==Unfortunately, the item you requested is on back order.== … ==If you would prefer not to wait, we have a similar telescope made by another manufacturer==, Belter Telescopes."],
      options: ["To request payment", "To provide operating instructions", "To advertise a new product", "To offer a substitute item"],
      answer: "D",
      optionWhy: [
        "Email không nhắc chuyện thanh toán.",
        "Không có hướng dẫn sử dụng.",
        "Bẫy: email có giới thiệu kính Belter, nhưng đó là hàng THAY THẾ cho món đang hết, không phải quảng cáo sản phẩm mới.",
        "Hàng đã đặt đang hết, đề nghị một kính tương tự → đề nghị hàng thay thế ✓",
      ],
      think: {
        dich: "Câu ngắn, mẫu quen: 'What is the purpose of X?' = X nhằm mục đích gì? Không có người, không có thì phức tạp → dịch thẳng.",
        "tu-khoa": "Tô theo thứ tự: từ để hỏi (What) → từ báo dạng (purpose) → tên văn bản (e-mail, cũng là màu vàng). Tô xong thấy KHÔNG có từ nội dung (xanh lá) → biết ngay là không có gì để dò, phải đọc ý chính.",
        "chien-luoc": "Dạng Mục đích + không có từ nội dung → S1: đọc dòng Subject và 2–3 câu đầu. Không cần đọc hết email.",
        "ap-dung": "Câu 1 là lời cảm ơn xã giao. Câu 2–3 mới là chuyện chính: hàng đang hết, đề nghị kính tương tự → D. Loại C vì kính Belter được giới thiệu để THAY THẾ, không phải quảng cáo hàng mới.",
      },
    }),
    practice: demo({
      id: "2026-1-172",
      type: "muc-dich",
      prompt: "[[q:Why]] did [[c:Ms. Barry]] [[t:begin]] an [[t:online chat]] with [[c:Mr. Kubelski]]?",
      vi: "Tại sao bà Barry bắt đầu cuộc trò chuyện trực tuyến với ông Kubelski?",
      wrong: [
        ["Tại sao ông Kubelski nhắn tin cho bà Barry trước?", "chu-the", "Ms. Barry là chủ ngữ: chính bà mở đầu cuộc chat."],
        ["Tại sao bà Barry sẽ bắt đầu trò chuyện với ông Kubelski?", "thi-bi-dong", "did … begin = đã bắt đầu (quá khứ)."],
      ],
      kwNote: "Why did X begin … chat → hỏi lý do mở đầu cuộc trò chuyện = dạng Mục đích. Hai tên người → 🟩.",
      strategy: [["S1", "S2", "S4", "S3"], "S1", "Lý do mở đầu cuộc chat nằm ở 2–3 tin đầu của người mở đầu (bà Barry). Không có câu trích dẫn nên không phải S4."],
      passage: ["Cuộc trò chuyện trực tuyến", "Marlys Barry: This is Ms. Barry from the data analysis department… We're contacting you about your data request… ‖ Alexander Kubelski: Yes, how soon can you complete the request? ‖ Marlys Barry: ==I have a question for you first. Do you really need the e-mail addresses of all account holders?== … ==Or do you need the e-mail addresses of account holders only within a certain age-group?=="],
      options: ["To refer him to a different department", "To decline an invitation", "To issue an apology", "To ask for clarification about a request"],
      answer: "D",
      optionWhy: [
        "Bà không chuyển ông sang phòng khác; chính phòng bà đang xử lý yêu cầu.",
        "Không có lời mời nào.",
        "Không có lời xin lỗi.",
        "Bà hỏi lại ông cần TẤT CẢ hay chỉ một nhóm tuổi → hỏi làm rõ yêu cầu ✓",
      ],
      hints: {
        dich: ["'Why did X begin …' = Vì sao X BẮT ĐẦU… Ai là người mở đầu cuộc chat?", "Ms. Barry là chủ ngữ → chính bà mở đầu; did = quá khứ."],
        "tu-khoa": ["Có 2 tên người, và cụm 'begin … online chat' cho biết đang hỏi lý do của cả cuộc chat.", "Why → 🟦 · begin, online chat → 🟨 · Ms. Barry, Mr. Kubelski → 🟩."],
        "chien-luoc": ["Hỏi lý do MỞ ĐẦU cuộc chat → nên đọc ở đầu hay cuối?", "S1: đọc 2–3 tin đầu của bà Barry."],
        "ap-dung": ["Tin thứ 2 của bà Barry bắt đầu bằng 'I have a question for you first'.", "Bà hỏi lại ông cần tất cả hay chỉ một nhóm tuổi → làm rõ yêu cầu."],
      },
    }),
  },

  // ── Chi tiết ──────────────────────────────────────────────────────────────
  "chi-tiet": {
    advancedNote: "Bài Nâng cao có câu dài và bị động (be required of, be billed, be done by), suggest … do. Tách câu thành vế chính + vế điều kiện trước khi dịch.",
    example: demo({
      id: "2026-10-155",
      type: "chi-tiet",
      prompt: "[[q:What]] does [[c:Ms. Lombardo]] [[t:ask]] [[c:Mr. Garza]] [[t:to do]]?",
      vi: "Bà Lombardo nhờ ông Garza làm gì?",
      wrong: [
        ["Ông Garza nhờ bà Lombardo làm gì?", "chu-the", "X ask Y to do: X (Lombardo) nhờ, Y (Garza) là người làm."],
        ["Bà Lombardo hỏi ông Garza đang làm gì?", "da-nghia", "ask sb to do = nhờ / yêu cầu ai làm, không phải hỏi."],
      ],
      kwNote: "What → 🟦. ask … to do → 🟨 Chi tiết (yêu cầu). Hai tên người → 🟩.",
      strategy: [["S2", "S1", "S3", "S7"], "S2", "Có từ nội dung cụ thể → scan câu bà Lombardo nhờ ông Garza (Please / Could you / Thank you for…)."],
      passage: ["Email (Lombardo → Garza)", "Rogelio, Here is the latest draft of the cookbook I will be self-publishing. ==Thank you for reviewing my recipes to ensure they are easy to follow.== Your input is much appreciated."],
      options: ["Make sure her recipes are clear", "Create an index of all her ingredients", "Suggest possible publishers for her book", "Help her format a final manuscript"],
      answer: "A",
      optionWhy: [
        "'reviewing my recipes to ensure they are easy to follow' ↔ đảm bảo công thức rõ ràng ✓",
        "Không nhắc mục lục nguyên liệu.",
        "Bẫy: bà TỰ xuất bản (self-publishing) nên không cần tìm nhà xuất bản.",
        "Có gửi bản thảo nhưng không nhờ trình bày (format).",
      ],
      think: {
        dich: "Cấu trúc 'X ask Y to do' = X nhờ Y làm gì. Xác định vai trước khi dịch: Lombardo là người nhờ, Garza là người làm.",
        "tu-khoa": "What (🟦) → 'ask … to do' báo dạng yêu cầu (🟨) → hai tên người (🟩) để biết đọc email nào, câu nào.",
        "chien-luoc": "Có 🟩 cụ thể → S2. Lời nhờ có thể ở dạng 'Please…' hoặc 'Thank you for…' (cảm ơn trước việc mình nhờ).",
        "ap-dung": "'Thank you for reviewing my recipes to ensure they are easy to follow' = nhờ xem lại công thức cho dễ hiểu → A (easy to follow ↔ clear). Loại C vì bà tự xuất bản.",
      },
    }),
    practice: demo({
      id: "2026-1-167",
      type: "chi-tiet",
      prompt: "[[q:What]] will [[c:happen]] on [[c:March 31]]?",
      vi: "Điều gì sẽ diễn ra vào ngày 31 tháng 3?",
      wrong: [
        ["Điều gì đã xảy ra vào ngày 31 tháng 3?", "thi-bi-dong", "will happen = SẼ diễn ra."],
        ["Ai sẽ đến vào ngày 31 tháng 3?", "chu-the", "What = điều gì (sự việc), không phải ai."],
      ],
      kwNote: "Ngày tháng là từ nội dung dễ scan nhất.",
      strategy: [["S2", "S1", "S3", "S4"], "S2", "Có ngày cụ thể → scan 'March 31'."],
      passage: ["Quảng cáo tuyển dụng", "If you are ready to join our team, we want to meet you! Contact Salvador Tomassin at 608-555-0144 for further details. ==All applications must be received by March 31.=="],
      options: ["A project will begin.", "A deadline will occur.", "A graphic designer will relocate.", "An application form will be made available."],
      answer: "B",
      optionWhy: [
        "Không nói dự án bắt đầu.",
        "'must be received by March 31' = hạn chót nhận hồ sơ ✓",
        "Không nhắc chuyện chuyển chỗ ở.",
        "Bẫy: có chữ 'application' nhưng là hạn NỘP, không phải ngày phát mẫu đơn.",
      ],
      hints: {
        dich: ["Chú ý thì của 'will happen'.", "will happen = SẼ diễn ra (tương lai)."],
        "tu-khoa": ["Ngày tháng thuộc lớp nào?", "What → 🟦 · happen, March 31 → 🟩."],
        "chien-luoc": ["Câu hỏi có thông tin cụ thể để dò không?", "Có (ngày) → S2: scan 'March 31'."],
        "ap-dung": ["Câu có 'March 31' nằm cuối quảng cáo.", "'must be received by' = hạn chót."],
      },
    }),
  },

  // ── Indicated ─────────────────────────────────────────────────────────────
  indicated: {
    advancedNote: "Bài Nâng cao có câu dạng 'What does [văn bản] indicate about X', có phạm vi (In the first e-mail), và X nằm trong mệnh đề bổ nghĩa.",
    example: demo({
      id: "2026-4-162",
      type: "indicated",
      prompt: "[[q:What]] is [[t:indicated]] about the [[c:festival]]?",
      vi: "Điều gì được nêu về lễ hội?",
      wrong: [
        ["Lễ hội chỉ ra điều gì?", "thi-bi-dong", "is indicated about = được nêu VỀ lễ hội (bị động)."],
        ["Điều gì được chỉ đường đến lễ hội?", "da-nghia", "indicate = cho biết / nêu, không phải chỉ đường."],
      ],
      kwNote: "What → 🟦. indicated → 🟨 dạng Indicated. festival → 🟩.",
      strategy: [["S3", "S2", "S1", "S7"], "S3", "Cả bài đều nói về lễ hội (X chung chung) → đối chiếu từng phương án."],
      passage: ["Lịch lễ hội", "Millsberg's ==annual== Summer Festival returns this June… ‖ ==Children's Fun Fair== · Carnival rides and entertainment at ==Millsberg Park== ‖ ==Outdoor Concert Series== · Live music, including folk, jazz, and classical, at ==Greenrow Park== ‖ Open-Air Art Studio"],
      options: ["It takes place several times a year.", "It has activities for all ages.", "Its events are held indoors.", "Its events are held at a single location."],
      answer: "B",
      optionWhy: [
        "'annual' = mỗi năm một lần.",
        "Có hội chợ cho trẻ em và hòa nhạc cho người lớn → mọi lứa tuổi ✓",
        "'Outdoor', 'Open-Air' → ngoài trời.",
        "Có nhiều công viên khác nhau (Millsberg Park, Greenrow Park…).",
      ],
      think: {
        dich: "'What is indicated about X' = Điều gì được nêu về X. Bị động: thông tin được BÀI nêu về X.",
        "tu-khoa": "What (🟦) → indicated (🟨) → festival (🟩). Nhưng 'festival' xuất hiện khắp bài, nên chữ này chỉ khoanh vùng chứ không dẫn tới 1 câu.",
        "chien-luoc": "Indicated + X chung chung → S3: cầm từng phương án đi đối chiếu, gạch cái sai.",
        "ap-dung": "A: 'annual' ✗. C: 'Outdoor / Open-Air' ✗. D: nhiều công viên ✗. Còn B: có hội chợ trẻ em lẫn hòa nhạc → B. Đáp án đúng gom từ nhiều chỗ, không có câu nào ghi 'for all ages'.",
      },
    }),
    practice: demo({
      id: "2026-2-162",
      type: "indicated",
      prompt: "[[q:What]] is [[t:indicated]] about [[c:Ms. Woods]]?",
      vi: "Điều gì được nêu về bà Woods?",
      wrong: [
        ["Bà Woods chỉ ra điều gì?", "thi-bi-dong", "is indicated about = được nêu VỀ bà."],
        ["Bà Woods được thông báo điều gì?", "chu-the", "about Ms. Woods = thông tin VỀ bà, không phải điều thông báo CHO bà."],
      ],
      kwNote: "Bà Woods là người NHẬN email → thông tin về bà nằm ở chữ 'you'.",
      strategy: [["S3", "S2", "S1", "S7"], "S3", "Tìm các câu có 'you' rồi đối chiếu từng phương án."],
      passage: ["Email (gửi bà Woods)", "Among the selections, we have highlighted several sweaters that would look beautiful with ==the skirt you bought==. ‖ And, to thank you for ==being a Honey Canyon customer for so many years==, we are also offering you a 20 percent discount on your next order."],
      options: ["She is applying for a job at Honey Canyon Apparel.", "She has shopped at Honey Canyon Apparel before.", "She prefers to wear casual clothing.", "She works as a fashion designer."],
      answer: "B",
      optionWhy: [
        "Không có chuyện xin việc.",
        "Khách hàng lâu năm, đã mua váy → đã từng mua sắm ở đây ✓",
        "Không nói bà thích đồ thường ngày.",
        "Không nói nghề của bà.",
      ],
      hints: {
        dich: ["is indicated about = được nêu VỀ ai?", "Thông tin VỀ bà Woods (bị động), không phải bà nêu ra."],
        "tu-khoa": ["Tên người là đối tượng cần kiểm tra.", "What → 🟦 · indicated → 🟨 · Ms. Woods → 🟩."],
        "chien-luoc": ["Tên bà Woods có thể chỉ ở dòng To. Thông tin về bà nằm ở đâu?", "S3: tìm các câu có 'you', đối chiếu từng phương án."],
        "ap-dung": ["'customer for so many years' nói gì về bà?", "Khách lâu năm → đã từng mua hàng → B."],
      },
    }),
  },

  // ── NOT ───────────────────────────────────────────────────────────────────
  not: {
    advancedNote: "Bài Nâng cao có câu dài, bị động, 'not' viết thường (does not need to), và câu phải ghép 2 văn bản.",
    example: demo({
      id: "2026-6-171",
      type: "not",
      prompt: "[[q:What]] is [[t:NOT mentioned]] as a [[c:planned activity]] during [[c:Green Awareness Week]]?",
      vi: "Điều gì KHÔNG được nhắc đến là một hoạt động dự kiến trong Tuần lễ Xanh?",
      wrong: [
        ["Hoạt động nào đã KHÔNG diễn ra trong Tuần lễ Xanh?", "thi-bi-dong", "Hỏi điều không được NHẮC trong bài (hoạt động dự kiến), không hỏi việc đã không xảy ra."],
        ["Tuần lễ Xanh KHÔNG nhắc đến hoạt động nào?", "thi-bi-dong", "is mentioned = được nhắc (trong bài báo). Tuần lễ không tự 'nhắc'."],
      ],
      kwNote: "What → 🟦. NOT mentioned → 🟨. planned activity, Green Awareness Week → 🟩.",
      strategy: [["S3", "S2", "S1", "S7"], "S3", "NOT → tìm 3 phương án CÓ trong bài, gạch đi."],
      passage: ["Bài báo", "The activities will start on Sunday, April 1, with ==a cleanup of the Misford Stream trails==. ‖ On Monday, residents are encouraged to ==walk along the trails and take photographs==. ‖ On Tuesday and Wednesday, residents who come to the village hall can ==pick up cloth bags==… ‖ Finally, on Saturday, ==500 tree saplings will be offered to residents=="],
      options: ["Planting native trees", "Riding bicycles on a trail", "Participating in a cleanup effort", "Distributing cloth bags"],
      answer: "B",
      optionWhy: [
        "Có: thứ Bảy phát 500 cây non.",
        "KHÔNG có: thứ Hai là đi bộ chụp ảnh, không đạp xe ✓ (bẫy: chữ 'trails' có trong bài).",
        "Có: Chủ nhật dọn đường mòn.",
        "Có: thứ Ba – thứ Tư phát túi vải.",
      ],
      think: {
        dich: "NOT viết hoa → câu hỏi tìm điều KHÔNG có. 'planned activity during…' = hoạt động dự kiến trong tuần lễ.",
        "tu-khoa": "What (🟦) → NOT mentioned (🟨) → planned activity, Green Awareness Week (🟩). Thấy NOT là biết phải loại trừ.",
        "chien-luoc": "NOT → S3. Không đi tìm 1 câu trả lời, mà đi kiểm tra cả 4 phương án.",
        "ap-dung": "Đọc lần lượt từng ngày: CN dọn đường mòn (C có), T3–T4 túi vải (D có), T7 cây non (A có). Còn B (đạp xe) không có → đáp án. Bẫy: chữ 'trails' xuất hiện nhưng là đi bộ.",
      },
    }),
    practice: demo({
      id: "2026-2-158",
      type: "not",
      prompt: "[[q:What]] is [[t:NOT indicated]] as a [[c:service]] [[c:provided]] by [[c:Gernack Home]]?",
      vi: "Điều gì KHÔNG được nêu là dịch vụ mà Gernack Home cung cấp?",
      wrong: [
        ["Gernack Home KHÔNG được cung cấp dịch vụ nào?", "thi-bi-dong", "provided BY Gernack Home = do Gernack Home cung cấp; công ty là bên cung cấp."],
        ["Khách hàng KHÔNG cung cấp dịch vụ nào cho Gernack Home?", "chu-the", "Bên cung cấp là Gernack Home, không phải khách."],
      ],
      kwNote: "NOT + indicated → 🟨. service, provided, Gernack Home → 🟩.",
      strategy: [["S3", "S2", "S1", "S5"], "S3", "NOT → gạch 3 dịch vụ CÓ trong bài."],
      passage: ["Tờ rơi", "Our specialties are ==renovating kitchens== and bathrooms, converting basements and garages into recreation rooms or ==home offices==, and ==building home additions==."],
      options: ["Kitchen renovation", "Home-office creation", "Patio installation", "Home-addition building"],
      answer: "C",
      optionWhy: [
        "Có: renovating kitchens.",
        "Có: … into home offices.",
        "KHÔNG có: không nhắc làm hiên (patio) ✓",
        "Có: building home additions.",
      ],
      hints: {
        dich: ["provided by Gernack Home: ai cung cấp?", "Gernack Home là bên cung cấp (bị động 'provided by')."],
        "tu-khoa": ["NOT + indicated là cặp báo dạng.", "What → 🟦 · NOT indicated → 🟨 · service, provided, Gernack Home → 🟩."],
        "chien-luoc": ["Dạng NOT cần kiểm tra mấy phương án?", "S3: cả 4, gạch 3 cái có trong bài."],
        "ap-dung": ["Danh sách dịch vụ nằm gọn trong câu 'Our specialties are…'.", "Có bếp, văn phòng tại nhà, nới rộng nhà → thiếu hiên (patio)."],
      },
    }),
  },

  // ── Suy luận ──────────────────────────────────────────────────────────────
  "suy-luan": {
    advancedNote: "Bài Nâng cao phải phân biệt suggest about / suggest … do, tự tính ngày tháng và ghép 2 manh mối.",
    example: demo({
      id: "2026-5-152",
      type: "suy-luan",
      prompt: "[[q:What]] is [[t:suggested]] about [[c:some of the rooms]] at [[c:Cavalina Hotel]]?",
      vi: "Có thể suy ra điều gì về một số phòng ở khách sạn Cavalina?",
      wrong: [
        ["Điều gì được đề xuất cho một số phòng ở khách sạn Cavalina?", "da-nghia", "suggested ABOUT = ngụ ý / có thể suy ra về; không phải 'đề xuất'."],
        ["Khách sạn Cavalina gợi ý khách làm gì trong phòng?", "chu-the", "Không phải khách sạn gợi ý; hỏi điều suy ra VỀ các phòng."],
      ],
      kwNote: "What → 🟦. suggested → 🟨 Suy luận. some of the rooms, Cavalina Hotel → 🟩.",
      strategy: [["S2", "S3", "S1", "S7"], "S2", "Có từ nội dung cụ thể ('rooms') → scan tới mục Room Types."],
      passage: ["Quảng cáo khách sạn", "Room Types: single room, two-room suite with balcony, ==two-room suite with kitchen=="],
      options: ["They contain antique furniture.", "They have recently been updated.", "Guests can view them online.", "Guests can prepare food in them."],
      answer: "D",
      optionWhy: [
        "Không nhắc đồ cổ.",
        "Không nói mới sửa.",
        "Không nói xem phòng trên mạng.",
        "Có loại phòng có bếp → khách nấu ăn được ✓ (phải suy ra, bài không viết 'prepare food').",
      ],
      think: {
        dich: "Bẫy lớn nhất: 'suggested ABOUT' KHÔNG phải 'đề xuất'. Dịch là 'có thể suy ra / ngụ ý điều gì về…'.",
        "tu-khoa": "What (🟦) → suggested (🟨, báo Suy luận) → 'some of the rooms', 'Cavalina Hotel' (🟩). 'some of' gợi ý chỉ MỘT SỐ phòng có đặc điểm đó.",
        "chien-luoc": "Có 🟩 cụ thể là 'rooms' → S2: scan chữ 'room' → tới mục Room Types.",
        "ap-dung": "'two-room suite with kitchen' → có bếp → khách tự nấu ăn được → D. 'some of' khớp vì chỉ 1 loại phòng có bếp. Đáp án được suy ra, không có nguyên văn.",
      },
    }),
    practice: demo({
      id: "2026-5-164",
      type: "suy-luan",
      prompt: "[[t?:According]] [[t?:to]] the [[t:article]], [[q:what]] will [[c:Mr. Rosier]] [[t:most likely]] [[c:do soon]]?",
      vi: "Theo bài báo, nhiều khả năng ông Rosier sắp làm gì?",
      wrong: [
        ["Theo bài báo, ông Rosier vừa làm gì?", "thi-bi-dong", "will … do soon = SẮP làm."],
        ["Theo bài báo, ông Rosier thích làm gì nhất?", "da-nghia", "most likely = nhiều khả năng nhất, không phải 'thích nhất'."],
      ],
      kwNote: "most likely → 🟨 Suy luận. 'do soon' → 🟩 mốc tương lai cần dò.",
      strategy: [["S2", "S1", "S3", "S7"], "S2", "Kế hoạch tương lai thường ở cuối bài báo → scan 'exploring / looking at / plans to'."],
      passage: ["Bài báo", "Sometimes I considered shutting it all down and going back to my former job. ‖ Now that the business is doing well, ==he is exploring opening another store==… \"I'm currently looking at Morganville to see if that would be the best location for ==a second store==.\""],
      options: ["He will write a book about his experience.", "He will move his home to Morganville.", "He will return to his previous career.", "He will open another garden center."],
      answer: "D",
      optionWhy: [
        "Không nhắc viết sách.",
        "Bẫy: Morganville là nơi định mở CỬA HÀNG, không phải chuyển nhà.",
        "Bẫy: chỉ là ý nghĩ trong quá khứ lúc khó khăn.",
        "Đang tìm hiểu mở cửa hàng thứ hai → D ✓",
      ],
      hints: {
        dich: ["'will … most likely do soon' nói về quá khứ hay tương lai?", "Tương lai gần: nhiều khả năng SẮP làm gì."],
        "tu-khoa": ["most likely là từ báo dạng; 'soon' là mốc thời gian cần dò.", "what → 🟦 · article, most likely → 🟨 · Mr. Rosier, do soon → 🟩."],
        "chien-luoc": ["Kế hoạch tương lai thường nằm ở đâu trong bài báo?", "S2: scan đoạn cuối, tìm 'exploring / looking at'."],
        "ap-dung": ["Đoạn cuối: 'he is exploring opening another store'.", "Mở cửa hàng thứ hai → D. Morganville là nơi đặt cửa hàng."],
      },
    }),
  },

  // ── Đối tượng ─────────────────────────────────────────────────────────────
  "doi-tuong": {
    advancedNote: "Bài Nâng cao có câu đảo (Executives in what industry…), In what field / industry, và người chỉ xuất hiện ở dòng To / From.",
    example: demo({
      id: "2026-1-154",
      type: "doi-tuong",
      prompt: "[[q:Who]] is [[c:Ms. Flanagan]]?",
      vi: "Bà Flanagan là ai?",
      wrong: [
        ["Bà Flanagan đang tìm ai?", "chu-the", "Hỏi danh tính của chính bà Flanagan."],
        ["Bà Flanagan đã từng là ai?", "thi-bi-dong", "is = hiện tại: bà là ai (bây giờ)."],
      ],
      kwNote: "Who → 🟦 (hỏi danh tính). Tên người → 🟩.",
      strategy: [["S2", "S1", "S3", "S7"], "S2", "Hỏi danh tính 1 người cụ thể → scan tên, đọc các câu quanh tên."],
      passage: ["Bài báo", "Christine Lafferty said that she and ==her childhood friend Morgan Flanagan== spent plenty of time at the theater while growing up. … ==The friends, who also own the popular Blue Bay Bistro, decided to buy the theater== and make the necessary repairs"],
      options: ["A town council member", "An event coordinator", "Ms. Lafferty's business partner", "The writer of the article"],
      answer: "C",
      optionWhy: [
        "Không nhắc hội đồng thị trấn.",
        "Không nói bà tổ chức sự kiện.",
        "Bạn từ nhỏ, cùng sở hữu quán ăn và cùng mua nhà hát → đối tác kinh doanh ✓",
        "Bà là người được nhắc trong bài, không phải người viết.",
      ],
      think: {
        dich: "Câu ngắn nhất có thể: 'Who is X?' = X là ai?",
        "tu-khoa": "Who (🟦) báo dạng Đối tượng (danh tính). Tên Flanagan (🟩) là thứ duy nhất để dò.",
        "chien-luoc": "Danh tính 1 người cụ thể → S2: scan tên, đọc câu có tên và câu ngay sau.",
        "ap-dung": "Câu có tên: bạn thời thơ ấu của Lafferty. Câu sau: 'The friends… also own… Bistro, decided to buy the theater' → hai người cùng kinh doanh → C. Phải ghép 2 câu.",
      },
    }),
    practice: demo({
      id: "2024-1-155",
      type: "doi-tuong",
      prompt: "[[q:For whom]] is the [[t:notice]] [[t:most likely]] [[t:intended]]?",
      vi: "Nhiều khả năng thông báo này dành cho ai?",
      wrong: [
        ["Ai đã viết thông báo này?", "chu-the", "intended for = dành CHO ai đọc, không hỏi người viết."],
        ["Nhiều khả năng ai đã định đọc thông báo?", "thi-bi-dong", "is intended (for) là bị động: thông báo được làm ra cho ai."],
      ],
      kwNote: "For whom … intended → dạng Đối tượng (người đọc). Không có 🟩.",
      strategy: [["S1", "S2", "S3", "S7"], "S1", "Không có 🟩 → đọc 2–3 câu đầu, xem bài đang nói với 'you' là ai."],
      passage: ["Thông báo", "This season's excellent weather has yielded a substantial harvest of fruits and vegetables, in many cases ==more than growers may find buyers for==. ==Those of you wishing to donate surplus produce== to community organizations can do so…"],
      options: ["Farmers", "Professional chefs", "Truck drivers", "Supermarket managers"],
      answer: "A",
      optionWhy: [
        "'growers', 'those of you… surplus produce' → người trồng trọt ✓",
        "Không nói với đầu bếp.",
        "Bẫy: tài xế được nhắc như tình nguyện viên chở hàng, không phải người đọc.",
        "Không nói với quản lý siêu thị.",
      ],
      hints: {
        dich: ["intended for = dành CHO ai?", "Hỏi người ĐỌC thông báo, không hỏi người viết."],
        "tu-khoa": ["Câu hỏi không có tên riêng nào.", "For whom → 🟦 · notice, most likely, intended → 🟨."],
        "chien-luoc": ["Không có 🟩 để scan → đọc ở đâu?", "S1: 2–3 câu đầu, tìm 'you' là ai."],
        "ap-dung": ["'Those of you wishing to donate surplus produce': ai có nông sản dư?", "Người trồng (growers) → Farmers."],
      },
    }),
  },

  // ── Đồng nghĩa ────────────────────────────────────────────────────────────
  "dong-nghia": {
    advancedNote: "Bài Nâng cao toàn từ có nghĩa phụ hay bị bẫy: just, last, meet, turn, function, driven.",
    example: demo({
      id: "2026-5-166",
      type: "dong-nghia",
      prompt: 'The word [[c:"measures"]] in [[t:paragraph 1, line 6,]] is [[t:closest in meaning]] to',
      vi: "biện pháp (an toàn)",
      wrong: [
        ["số đo, kích thước", "da-nghia", "measure = đo / số đo là nghĩa quen, nhưng 'propose additional measures' = đề xuất thêm biện pháp."],
        ["lượng, mức độ", "da-nghia", "Không hợp với 'propose' (đề xuất)."],
      ],
      kwNote: "closest in meaning + vị trí → 🟨. Từ trong ngoặc kép → 🟩. Không có từ để hỏi.",
      strategy: [["S5", "S2", "S1", "S3"], "S5", "Hiểu nghĩa trong câu rồi thay từng phương án vào."],
      passage: ["Thông báo", "any employee who has concerns about these protocols or would like to propose additional ==measures== should contact the safety coordinator directly."],
      options: ["amounts", "procedures", "dimensions", "penalties"],
      answer: "B",
      optionWhy: [
        "amounts = lượng: nghĩa 'đo lường', không hợp câu.",
        "propose additional procedures = đề xuất thêm quy trình / biện pháp ✓",
        "dimensions = kích thước ✗.",
        "penalties = hình phạt: nhân viên không 'đề xuất thêm hình phạt' khi lo về quy định an toàn.",
      ],
      extra: {
        context: { label: "Câu trong bài", text: "any employee who has concerns about these protocols or would like to propose additional ==measures== should contact the safety coordinator directly." },
        transLabel: "Từ này nghĩa là gì trong câu?",
      },
      think: {
        dich: "Đừng dịch câu hỏi (luôn giống nhau). Đọc CÂU TRONG BÀI: thông báo về quy định an toàn, 'propose additional measures' → measures = biện pháp.",
        "tu-khoa": "Câu hỏi không có từ để hỏi. Tô vị trí + 'closest in meaning' (🟨) và từ được hỏi (🟩).",
        "chien-luoc": "Đồng nghĩa → S5: hiểu nghĩa trong câu trước, sau đó thay từng phương án.",
        "ap-dung": "Thay vào: 'propose additional procedures' ✓. 'amounts / dimensions' là nghĩa quen của measure (đo) nhưng sai ngữ cảnh → B.",
      },
    }),
    practice: demo({
      id: "2024-2-166",
      type: "dong-nghia",
      prompt: 'The word [[c:"address"]] in [[t:paragraph 2, line 2,]] is [[t:closest in meaning]] to',
      vi: "giải quyết, đáp lại (mối lo ngại)",
      wrong: [
        ["địa chỉ, gửi thư đến", "da-nghia", "Nghĩa quen nhất, nhưng 'address your concerns' = giải quyết mối lo."],
        ["phát biểu trước đám đông", "da-nghia", "address an audience mới là phát biểu."],
      ],
      kwNote: "closest in meaning + vị trí → 🟨. \"address\" → 🟩.",
      strategy: [["S5", "S2", "S1", "S3"], "S5", "Thay từng phương án vào câu gốc."],
      passage: ["Email", "Secondly, I am not sure what more we can do to ==address== your concerns about packaging materials."],
      options: ["respond to", "think about", "greet", "deliver"],
      answer: "A",
      optionWhy: [
        "respond to your concerns = đáp lại / giải quyết mối lo ✓",
        "think about = chỉ suy nghĩ, chưa xử lý.",
        "greet = chào hỏi.",
        "deliver = giao (thư đến một địa chỉ).",
      ],
      extra: {
        context: { label: "Câu trong bài", text: "Secondly, I am not sure what more we can do to ==address== your concerns about packaging materials." },
        transLabel: "Từ này nghĩa là gì trong câu?",
      },
      hints: {
        dich: ["Nhìn từ đi kèm: address + your concerns.", "address concerns = giải quyết mối lo ngại."],
        "tu-khoa": ["Câu hỏi không có từ để hỏi.", "closest in meaning, paragraph 2, line 2 → 🟨 · \"address\" → 🟩."],
        "chien-luoc": ["Có nên chọn theo nghĩa quen nhất ('địa chỉ') không?", "Không. S5: thay từng phương án vào câu."],
        "ap-dung": ["Thay vào: 'what more we can do to ___ your concerns'.", "respond to your concerns giữ đúng nghĩa."],
      },
    }),
  },

  // ── Ý định người viết ─────────────────────────────────────────────────────
  "y-dinh": {
    advancedNote: "Bài Nâng cao có câu trích dẫn trả lời tin cách 2–3 tin, và phải xác định it / that / those trỏ về đâu.",
    example: demo({
      id: "2024-2-175",
      type: "y-dinh",
      prompt: '[[t:At 7:58 A.M.,]] [[q:what]] does [[c:Mr. Zuniga]] [[t:most likely mean]] when he writes, [[c?:"Will do"]]?',
      vi: "Lúc 7:58 sáng, nhiều khả năng ông Zuniga có ý gì khi viết \"Will do\"?",
      wrong: [
        ["Lúc 7:58 sáng, ông Wendel có ý gì khi viết cho ông Zuniga?", "chu-the", "Người viết câu trích dẫn là ông Zuniga."],
        ["Lúc 7:58 sáng, ông Zuniga sẽ làm gì vào ngày mai?", "da-nghia", "Câu hỏi hỏi Ý của câu nói 'Will do', không hỏi lịch làm việc."],
      ],
      kwNote: "At [giờ] → 🟨 định vị tin. most likely mean → 🟨 dạng. Tên người viết → 🟩.",
      strategy: [["S4", "S2", "S1", "S3"], "S4", "Tìm tin 7:58, đọc tin NGAY TRƯỚC và vài tin trước nữa."],
      passage: ["Cuộc trò chuyện trực tuyến", "Robbie Zuniga (7:55 A.M.) Actually, ==I'm meeting Nathan at the site this morning, so I'll get his opinion on when we can pour the concrete==. ‖ Gary Wendel (7:57 A.M.) ==Keep me posted.== I don't want to rush it if it's still too wet. ‖ Robbie Zuniga (7:58 A.M.) Will do."],
      options: ["He will revise a delivery schedule.", "He will purchase more equipment.", "He will hire workers to help at a site.", "He will share the outcome of a meeting."],
      answer: "D",
      optionWhy: [
        "Không nói sửa lịch giao hàng.",
        "Không mua thêm thiết bị.",
        "Không thuê thêm người.",
        "'Keep me posted' → 'Will do' = tôi sẽ báo lại kết quả buổi gặp Nathan ✓",
      ],
      think: {
        dich: "Khung câu hỏi cố định: 'At [giờ], what does X mean when he writes \"…\"' = Lúc [giờ], X có ý gì khi viết \"…\".",
        "tu-khoa": "Giờ (🟨) là chìa khoá định vị tin nhắn. 'most likely mean' (🟨) báo dạng. Tên Zuniga (🟩). Câu trích dẫn tô hay không đều được.",
        "chien-luoc": "S4: tìm đúng tin 7:58 → đọc tin 7:57 ngay trước (câu đang trả lời) và tin 7:55 (bối cảnh).",
        "ap-dung": "7:57 'Keep me posted' (báo tôi biết nhé) → 7:58 'Will do' (sẽ làm) = sẽ báo lại. Báo điều gì? Ý kiến của Nathan sau buổi gặp ở công trường (7:55) → D.",
      },
    }),
    practice: demo({
      id: "2024-1-153",
      type: "y-dinh",
      prompt: '[[t:At 1:00 P.M.,]] [[q:what]] does [[c:Ms. Chi]] [[t:most likely mean]] when she writes, [[c?:"Sure thing, Mina"]]?',
      vi: "Lúc 1 giờ chiều, nhiều khả năng bà Chi có ý gì khi viết \"Sure thing, Mina\"?",
      wrong: [
        ["Lúc 1 giờ chiều, bà Evers có ý gì?", "chu-the", "Người viết câu trích dẫn là bà Chi."],
        ["Lúc 1 giờ chiều, bà Chi chắc chắn về điều gì?", "da-nghia", "'Sure thing' = được thôi (đồng ý), không phải 'chắc chắn về…'."],
      ],
      kwNote: "At [giờ] + mean → Ý định người viết.",
      strategy: [["S4", "S2", "S1", "S3"], "S4", "Đọc tin ngay trước câu trích dẫn."],
      passage: ["Chuỗi tin nhắn", "Joan Chi (12:51 P.M.) Oh no. ==Should we bring something back for you?== ‖ Mina Evers (12:59 P.M.) ==Get me a chicken sandwich.== ‖ Joan Chi (1:00 P.M.) Sure thing, Mina. See you in a while."],
      options: ["She will bring lunch for Ms. Evers.", "She can provide a tool that Ms. Evers needs.", "Some site coordinates are correct.", "Some measurements must be double-checked."],
      answer: "A",
      optionWhy: [
        "Đồng ý mua bánh mì kẹp cho Mina → mang bữa trưa về ✓",
        "Không có dụng cụ nào.",
        "Bẫy: 'coordinates' có trong chat nhưng đang có vấn đề, không phải đúng.",
        "Không liên quan câu 'Sure thing'.",
      ],
      hints: {
        dich: ["Ai viết câu trích dẫn?", "Bà Chi viết; hỏi Ý của bà."],
        "tu-khoa": ["Giờ là chìa khoá định vị.", "At 1:00 P.M. → 🟨 · what → 🟦 · Ms. Chi → 🟩 · most likely mean → 🟨."],
        "chien-luoc": ["Câu trích dẫn đang trả lời tin nào?", "S4: đọc tin 12:59 ngay trước."],
        "ap-dung": ["Tin 12:59: 'Get me a chicken sandwich'.", "'Sure thing' = được thôi → mua đồ ăn trưa cho Mina."],
      },
    }),
  },

  // ── Điền câu (đoạn tự soạn) ───────────────────────────────────────────────
  "dien-cau": {
    advancedNote: "Bài Nâng cao có nhiều câu không chứa đại từ: phải móc bằng chủ đề (Alternatively, Otherwise, câu chủ đề đứng trước chi tiết).",
    example: demo({
      id: "mau-dien-cau-1",
      type: "dien-cau",
      invented: true,
      prompt: "[[c:These]] [[c:boxes]] will be [[c:delivered]] to your [[c:desk]] next week.",
      vi: "Những thùng này sẽ được giao đến bàn làm việc của bạn vào tuần sau.",
      wrong: [
        ["Bạn sẽ giao những thùng này đến bàn vào tuần sau.", "thi-bi-dong", "will be delivered = SẼ ĐƯỢC giao (bị động); bạn là người nhận."],
        ["Những thùng này đã được giao đến bàn tuần trước.", "thi-bi-dong", "will be … next week = tuần sau mới giao."],
      ],
      kwNote: "'These boxes' là móc nối: câu ngay trước phải có chữ 'boxes'.",
      strategy: [["S6", "S2", "S1", "S3"], "S6", "Tìm câu trước có nhắc 'boxes', kiểm tra thời gian có hợp lý không."],
      passage: ["Email gửi nhân viên", "Dear team, Our office will move to the Larkin Building on May 3. [1] The new space is larger and closer to the train station. [2] ==Please pack your personal items in the boxes provided before April 30.== [3] Movers will take the boxes on May 1. [4] If you have questions, please contact Mr. Ortiz."],
      options: POS,
      answer: "C",
      optionWhy: [
        "Trước [1] chưa có chữ 'boxes' nào → 'These boxes' không có gì để trỏ.",
        "Câu trước [2] nói về toà nhà mới, không liên quan thùng.",
        "Ngay sau câu 'pack… in the boxes provided' → giao thùng tuần sau, đóng gói trước 30/4 → hợp lý ✓",
        "Bẫy: câu trước [4] cũng có 'boxes', nhưng thùng đã được chuyển đi ngày 1/5 thì không thể giao đến bàn 'next week'.",
      ],
      extra: { stem: STEM, transLabel: "Chọn bản dịch đúng của câu cho sẵn" },
      think: {
        dich: "Dịch CÂU CHO SẴN, không phải câu hỏi (câu hỏi luôn giống nhau). Chú ý bị động 'will be delivered' = sẽ được giao.",
        "tu-khoa": "Tô từ móc nối: 'These boxes' (phải trỏ về 'boxes' ở câu trước) + các từ nội dung để kiểm tra mạch (delivered, desk).",
        "chien-luoc": "S6: tìm câu trước có 'boxes', đặt câu cho sẵn ngay sau, đọc thử câu đứng sau vị trí.",
        "ap-dung": "Có 2 câu nhắc 'boxes': trước [3] (đóng gói vào thùng) và trước [4] (thợ chở thùng đi ngày 1/5). Giao thùng tới bàn phải xảy ra TRƯỚC khi đóng gói → [3]. Luôn kiểm tra cả thời gian, không chỉ khớp chữ.",
      },
    }),
    practice: demo({
      id: "mau-dien-cau-2",
      type: "dien-cau",
      invented: true,
      prompt: "[[c:She]] has [[c:played]] at the [[c:café]] every [[c:summer]] since it [[c:opened]].",
      vi: "Cô ấy đã biểu diễn ở quán mỗi mùa hè kể từ khi quán mở cửa.",
      wrong: [
        ["Cô ấy đã chơi đùa ở quán mỗi mùa hè.", "da-nghia", "play (nhạc công) = biểu diễn, không phải chơi đùa."],
        ["Quán đã mời cô ấy mỗi mùa hè kể từ khi khai trương.", "chu-the", "Chủ ngữ là She: cô ấy biểu diễn."],
      ],
      kwNote: "'She' là móc nối: câu ngay trước phải nhắc tới một người nữ.",
      strategy: [["S6", "S2", "S1", "S3"], "S6", "Tìm người nữ mà 'She' trỏ về."],
      passage: ["Thông báo của quán", "Bean Corner Café will celebrate its tenth anniversary on June 12. [1] All customers who visit that day will receive a free pastry with any drink. [2] ==Local musician Ana Ruiz will also perform from 2 to 4 P.M.== [3] We look forward to seeing you there. [4]"],
      options: POS,
      answer: "C",
      optionWhy: [
        "Trước [1] chưa có người nữ nào.",
        "Câu trước [2] nói về khách hàng, không phải 'she'.",
        "Ngay sau câu giới thiệu Ana Ruiz → 'She has played…' ✓",
        "Câu trước [4] là lời chào kết, mạch đã sang chỗ khác.",
      ],
      extra: { stem: STEM, transLabel: "Chọn bản dịch đúng của câu cho sẵn" },
      hints: {
        dich: ["'has played … since it opened' là thì gì?", "Hiện tại hoàn thành: đã biểu diễn (từ khi quán mở tới nay)."],
        "tu-khoa": ["Đại từ nào cần trỏ về một người?", "'She' là móc nối chính; played, café, summer, opened → 🟩."],
        "chien-luoc": ["'She' trỏ về ai trong bài?", "S6: tìm câu trước có nhắc một người nữ."],
        "ap-dung": ["Người nữ duy nhất trong bài là ai?", "Ana Ruiz → đặt ngay sau câu về cô ấy: [3]."],
      },
    }),
  },

  // ── Liên kết ──────────────────────────────────────────────────────────────
  "lien-ket": {
    advancedNote: "Bài Nâng cao phải ghép lý do, loại trừ ngày, và có văn bản không nêu tên / mã.",
    example: demo({
      id: "2026-1-179",
      type: "lien-ket",
      prompt: "[[q:In which section]] of the [[c:Web site]] will [[c:information]] [[t:most likely]] be [[c:added]]?",
      vi: "Nhiều khả năng thông tin sẽ được thêm vào mục nào của trang web?",
      wrong: [
        ["Thông tin đã được thêm vào mục nào của trang web?", "thi-bi-dong", "will … be added = SẼ được thêm."],
        ["Nhiều khả năng khách hàng sẽ thêm thông tin vào mục nào?", "chu-the", "Bị động: thông tin được (người làm web) thêm vào, không phải khách."],
      ],
      kwNote: "'In which section' → 🟦. most likely → 🟨. Web site, information, added → 🟩. 'information' chung chung → phải tìm ở văn bản khác xem là thông tin GÌ.",
      strategy: [["S7", "S2", "S3", "S1"], "S7", "Email cho biết thông tin gì cần thêm; bài báo cho biết loại thông tin đó thuộc mục nào → ghép."],
      passage: ["Email + Bài báo", "I still do not see ==the information I sent about our new promotion==… Please be sure to add this important information ‖ The News page can include text informing visitors about seasonal food items and ==upcoming promotions=="],
      options: ["The Home page", "The Food Menu page", "The About Us page", "The News page"],
      answer: "D",
      optionWhy: [
        "Trang chủ dành cho tên, địa điểm, giờ hoạt động.",
        "Trang Thực đơn dành cho ảnh và mô tả món.",
        "Trang Giới thiệu dành cho ý tưởng, tiểu sử.",
        "Khuyến mãi mới (email) ↔ upcoming promotions thuộc trang News (bài báo) ✓",
      ],
      think: {
        dich: "Bị động 'will … be added' = sẽ được thêm vào. 'In which section' = vào mục nào.",
        "tu-khoa": "'In which section' (🟦) → most likely (🟨) → Web site, information, added (🟩). 'information' quá chung → dấu hiệu phải tìm thông tin cụ thể ở văn bản khác.",
        "chien-luoc": "Bộ 2 văn bản, câu hỏi không ghi phạm vi → S7: lấy chìa khoá ở văn bản này, tra sang văn bản kia.",
        "ap-dung": "Email: thông tin cần thêm là khuyến mãi mới. Bài báo: khuyến mãi sắp tới thuộc trang News → D. Không văn bản nào tự trả lời được một mình.",
      },
    }),
    practice: demo({
      id: "2026-10-183",
      type: "lien-ket",
      prompt: "[[q:When]] [[t:most likely]] did [[c:Ms. Klein]] [[c:participate]] in a [[c:Richmond Supermarket cooking class]]?",
      vi: "Nhiều khả năng bà Klein đã tham gia lớp nấu ăn của siêu thị Richmond vào ngày nào?",
      wrong: [
        ["Bà Klein sẽ tham gia lớp nấu ăn khi nào?", "thi-bi-dong", "did participate = đã tham gia."],
        ["Khi nào siêu thị Richmond mời bà Klein dạy nấu ăn?", "chu-the", "Bà Klein là học viên (participate), không phải người dạy."],
      ],
      kwNote: "Bài đánh giá không ghi ngày → ngày nằm ở thông báo.",
      strategy: [["S7", "S2", "S3", "S1"], "S7", "Lấy món ăn ở bài đánh giá, tra ngày ở thông báo."],
      passage: ["Thông báo + Bài đánh giá", "• 2 August: Butter Chicken (India) • 9 August: Pad Thai (Thailand) • ==16 August: Fish Tacos (Mexico)== • 23 August: Roast Vegetable Lasagna (Italy) ‖ Last week I learned how to prepare ==fish tacos== with Mateo Bernal"],
      options: ["On August 2", "On August 9", "On August 16", "On August 23"],
      answer: "C",
      optionWhy: ["Ngày của lớp Butter Chicken.", "Ngày của lớp Pad Thai.", "Fish tacos → 16 August ✓", "Ngày của lớp Lasagna."],
      hints: {
        dich: ["did participate = đã hay sẽ?", "Đã tham gia (quá khứ)."],
        "tu-khoa": ["Tên người + tên lớp học là gì?", "When → 🟦 · most likely → 🟨 · Ms. Klein, participate, cooking class → 🟩."],
        "chien-luoc": ["Bài đánh giá của bà Klein có ghi ngày không?", "Không → S7: lấy món ăn ở bài đánh giá, tra ngày ở thông báo."],
        "ap-dung": ["Bà Klein học làm món gì?", "Fish tacos → lịch ghi 16 August."],
      },
    }),
  },
};

/** Bài Tổng hợp: bảng nhận diện + 1 ví dụ có bước Nhận diện dạng */
export const MIXED_TABLE: { signal: string; type: P7QType; strategy: string }[] = [
  { signal: "purpose · mainly about · Why did X write / send", type: "muc-dich", strategy: "S1" },
  { signal: "Wh- + chi tiết cụ thể · ask / offer / suggest sb to do", type: "chi-tiet", strategy: "S2" },
  { signal: "What is indicated / mentioned / true about X", type: "indicated", strategy: "S3" },
  { signal: "NOT viết hoa", type: "not", strategy: "S3" },
  { signal: "suggested / implied / concluded about · most likely", type: "suy-luan", strategy: "S2 / S3" },
  { signal: "For whom · Who most likely is · What kind of business", type: "doi-tuong", strategy: "S1 / S2" },
  { signal: "closest in meaning", type: "dong-nghia", strategy: "S5" },
  { signal: "At [giờ], what does X mean when he writes \"…\"", type: "y-dinh", strategy: "S4" },
  { signal: "positions marked [1], [2], [3], [4]", type: "dien-cau", strategy: "S6" },
  { signal: "bộ 2–3 văn bản, không ghi phạm vi, cần tra chéo", type: "lien-ket", strategy: "S7" },
];

export const MIXED_EXAMPLE: P7QDemo = demo({
  id: "2026-2-164",
  type: "suy-luan",
  prompt: "[[q:What]] is [[t:suggested]] about the [[c:XC-35]]?",
  vi: "Có thể suy ra điều gì về xe XC-35?",
  wrong: [
    ["Điều gì được đề xuất cho xe XC-35?", "da-nghia", "suggested ABOUT = ngụ ý về; không phải đề xuất."],
    ["XC-35 gợi ý điều gì cho người lái?", "chu-the", "Hỏi điều suy ra VỀ chiếc xe, không phải xe gợi ý."],
  ],
  kwNote: "What → 🟦. suggested → 🟨 Suy luận. XC-35 → 🟩 (cả bài nói về xe này).",
  strategy: [["S3", "S2", "S1", "S7"], "S3", "Cả bài quảng cáo XC-35 (X chung chung) → đối chiếu từng phương án."],
  passage: ["Quảng cáo", "==Wherever you want to go, from the beach to the backwoods==, the Nibora XC-35 can take you there! … the Nibora XC-35 offers a smooth ride ==even on the roughest terrain=="],
  options: ["It is Nibora's best-selling vehicle.", "It is good for parking in small spaces.", "It has received more positive reviews than other SUVs have received.", "It is good for driving on many types of surfaces."],
  answer: "D",
  optionWhy: [
    "Không nói bán chạy nhất.",
    "Không nói về đỗ xe.",
    "Không so sánh đánh giá.",
    "Từ bãi biển đến rừng sâu, êm trên địa hình gồ ghề → đi được nhiều loại mặt đường ✓",
  ],
  extra: {
    typeOptions: ["suy-luan", "chi-tiet", "indicated", "doi-tuong"],
    typeWhy: "suggested ABOUT → Suy luận. Chỉ khi là 'What does X suggest sb do' mới là Chi tiết (đề xuất).",
  },
  think: {
    dich: "'What is suggested about X' = Có thể suy ra điều gì về X (không phải 'đề xuất').",
    "tu-khoa": "What (🟦) → suggested (🟨) → XC-35 (🟩).",
    dang: "Nhìn TỪ BÁO DẠNG (lớp vàng): 'suggested about' → Suy luận. Đừng nhìn chữ 'suggest' đứng một mình: 'X suggest sb do' lại là Chi tiết.",
    "chien-luoc": "Suy luận + X chung chung (cả bài nói về XC-35) → S3.",
    "ap-dung": "'from the beach to the backwoods' + 'roughest terrain' → đi được nhiều loại địa hình → D. Không có câu nào viết 'many types of surfaces', phải suy ra.",
  },
});
