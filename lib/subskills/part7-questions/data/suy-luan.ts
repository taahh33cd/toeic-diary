import type { P7QItem } from "../types";

const S3_WHY = "Suy luận về X chung chung (không có chi tiết cụ thể để dò) → scan X, rồi đối chiếu từng phương án. Đáp án KHÔNG có nguyên văn trong bài, phải suy ra từ 1–2 câu. Loại phương án suy diễn quá xa.";
const NEXT_WHY = "'do next' → hành động tiếp theo thường nằm ở 1–2 tin / câu CUỐI của người đó (I'll… / Let me…). Scan tên người, đọc câu cuối của họ.";

export const suyLuanCoBan: P7QItem[] = [
  {
    id: "2026-1-148",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:suggested]] about [[c:High View Apartments]]?",
    vi: "Có thể suy ra điều gì về khu căn hộ High View?",
    wrong: [
      { text: "Điều gì được đề xuất cho khu căn hộ High View?", error: "da-nghia", why: "suggested ABOUT X = ngụ ý / có thể suy ra về X (Suy luận). 'Đề xuất' là suggest (that) sb do." },
      { text: "Khu căn hộ High View ngụ ý điều gì?", error: "thi-bi-dong", why: "is suggested about = điều được (bài) ngụ ý VỀ khu căn hộ." },
    ],
    kwNote: "suggested about → 🟨 Suy luận (không phải đề xuất). Tên khu căn hộ → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Thông báo",
      excerpt: "You will receive an e-mail if ==your parking space is moved more than 20 meters from your previous one==.",
      note: "Mỗi cư dân có 'chỗ đậu của mình' → khu căn hộ phân chỗ đậu cố định (It assigns tenants specific parking spots). Bài không nói thẳng, phải suy ra.",
    },
  },
  {
    id: "2026-10-152",
    type: "suy-luan",
    prompt: "[[q:What]] will [[c:Ms. Fisk]] [[t:most likely]] [[c:do next]]?",
    vi: "Nhiều khả năng bà Fisk sẽ làm gì tiếp theo?",
    wrong: [
      { text: "Bà Fisk thường làm gì nhất?", error: "da-nghia", why: "most likely = nhiều khả năng nhất (mức độ chắc chắn), không phải 'thường xuyên nhất'." },
      { text: "Bà Fisk vừa làm gì?", error: "thi-bi-dong", why: "will … do next = SẮP làm (tương lai), không phải vừa làm." },
    ],
    kwNote: "most likely → 🟨 Suy luận. 'do next' → 🟩 hành động tiếp theo.",
    strategy: { options: ["S2", "S1", "S3", "S4"], correct: "S2", why: NEXT_WHY },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "Oh, that's fine! ==I'll double-check the cost data in the meantime.==",
      note: "Kiểm tra lại số liệu chi phí → She will review a portion of the budget report.",
    },
  },
  {
    id: "2026-10-164",
    type: "suy-luan",
    prompt: "[[q:What]] can be [[t:concluded]] about [[c:Ms. Balog]]?",
    vi: "Có thể kết luận điều gì về bà Balog?",
    wrong: [
      { text: "Bà Balog kết luận điều gì?", error: "thi-bi-dong", why: "can be concluded about = (người đọc) kết luận VỀ bà Balog. Bà không phải người kết luận." },
      { text: "Điều gì đã kết thúc với bà Balog?", error: "da-nghia", why: "conclude: kết luận / kết thúc. 'concluded about' = rút ra kết luận về." },
    ],
    kwNote: "concluded → 🟨 Suy luận. Tên người → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S4"], correct: "S3", why: "Không có tin nhắn nào nói thẳng bà làm ở đâu → ghép 2 tin (quy định cho cứu hộ của Pool Guardian + hợp đồng cung cấp cứu hộ) rồi đối chiếu phương án." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "the rule for ==Pool Guardian lifeguards== is to wait for 30 minutes after bad weather passes ‖ ==Our contract says we must supply Rosemoor Park with a lifeguard==…",
      note: "Bà là cứu hộ do Pool Guardian cung cấp → She is an employee of Pool Guardian.",
    },
  },
  {
    id: "2026-10-166",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:implied]] about [[c:Rosemoor Park]]?",
    vi: "Có thể ngầm hiểu điều gì về công viên Rosemoor?",
    wrong: [
      { text: "Công viên Rosemoor ngụ ý điều gì?", error: "thi-bi-dong", why: "is implied about = điều được ngụ ý VỀ công viên." },
      { text: "Điều gì được áp dụng ở công viên Rosemoor?", error: "da-nghia", why: "imply = ngụ ý (khác apply = áp dụng)." },
    ],
    kwNote: "implied → 🟨 Suy luận (= suggested). Tên công viên → 🟩.",
    strategy: { options: ["S2", "S3", "S1", "S4"], correct: "S2", why: "Scan 'Rosemoor Park' → chỉ 1 câu nhắc tên → đọc kỹ câu đó là đủ." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "==Our contract says we must supply Rosemoor Park with a lifeguard== until 5 P.M. on Thursdays.",
      note: "Công viên có hợp đồng với công ty cung cấp cứu hộ → It has a contract with a company that provides lifeguards.",
    },
  },
  {
    id: "2026-2-150",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:suggested]] about the [[c:new business cards]]?",
    vi: "Có thể suy ra điều gì về những tấm danh thiếp mới?",
    wrong: [
      { text: "Điều gì được đề xuất in lên danh thiếp mới?", error: "da-nghia", why: "suggested about = ngụ ý về, không phải đề xuất." },
      { text: "Có thể suy ra điều gì về những thẻ kinh doanh mới?", error: "da-nghia", why: "business card = danh thiếp (một từ ghép cố định)." },
    ],
    kwNote: "suggested about → 🟨. new business cards → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "Ghép ngày viết memo (31/3) với hạn nhận danh thiếp (1/5) rồi đối chiếu phương án." },
    evidence: {
      doc: "Bản ghi nhớ (ngày 31/3)",
      excerpt: "==All employees should receive the new business cards by May 1.==",
      note: "Memo viết cuối tháng 3, nhận thẻ trước 1/5 → in trong tháng 4 (They will be printed during the month of April).",
    },
  },
  {
    id: "2026-4-147",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:suggested]] about [[c:Zestful Cuisine]]?",
    vi: "Có thể suy ra điều gì về Zestful Cuisine?",
    wrong: [
      { text: "Zestful Cuisine đề xuất điều gì?", error: "da-nghia", why: "suggested about X = ngụ ý về X; không phải X đề xuất." },
      { text: "Có thể suy ra điều gì về các món ăn Zestful?", error: "da-nghia", why: "Zestful Cuisine là tên nhà hàng (tên riêng), không phải 'món ăn'." },
    ],
    kwNote: "suggested about → 🟨. Tên nhà hàng → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Tin tuyển dụng",
      excerpt: "This is a ==full-time or part-time== position. ==Days and nights are available.==",
      note: "Được chọn toàn / bán thời gian, ca ngày / đêm → It offers shift flexibility to employees.",
    },
  },
  {
    id: "2026-5-157",
    type: "suy-luan",
    prompt: "[[q:During what month]] will [[c:Covered Bridge Industries]] [[t:most likely]] [[c:launch]] a [[c:new product]]?",
    vi: "Nhiều khả năng Covered Bridge Industries sẽ ra mắt sản phẩm mới vào tháng nào?",
    wrong: [
      { text: "Covered Bridge Industries đã ra mắt sản phẩm mới vào tháng nào?", error: "thi-bi-dong", why: "will … launch = SẼ ra mắt (việc đã bị hoãn, chưa diễn ra)." },
      { text: "Nhiều khả năng Covered Bridge Industries sẽ phóng tàu vào tháng nào?", error: "da-nghia", why: "launch: phóng (tàu) / ra mắt (sản phẩm)." },
    ],
    kwNote: "'During what month' → 🟦. most likely → 🟨: bài không ghi thẳng tháng, phải tính.",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Scan 'launch' → câu nói 'by November… the following month' → tự tính ra tháng 12." },
    evidence: {
      doc: "Bài báo",
      excerpt: "Covered Bridge now hopes to complete all quality testing by November so that it can ==launch the product the following month==.",
      note: "Tháng sau tháng 11 → In December. Bẫy: June (kế hoạch cũ), August, November đều CÓ trong bài.",
    },
  },
  {
    id: "2026-6-162",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:most likely]] [[t:true]] about [[c:Mr. Torres]]?",
    vi: "Điều gì nhiều khả năng đúng về ông Torres?",
    wrong: [
      { text: "Ông Torres cho rằng điều gì đúng nhất?", error: "chu-the", why: "Hỏi điều đúng VỀ ông Torres, không phải quan điểm của ông." },
      { text: "Điều gì chắc chắn đúng về ông Torres?", error: "da-nghia", why: "most likely = nhiều khả năng (suy luận), không phải 'chắc chắn'." },
    ],
    kwNote: "most likely true → 🟨 Suy luận (khác 'What is true' = Indicated).",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Bài blog",
      excerpt: "==A reader recently asked whether any innovations in 3-D printing are pertinent to the board game industry==… In this month's post, I am happy to report…",
      note: "Ông nhận câu hỏi, tìm hiểu rồi báo kết quả → He researched the answer to a question about 3-D printing.",
    },
  },
  {
    id: "2026-9-149",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:most likely]] [[t:true]] about [[c:Mr. Hong's account]]?",
    vi: "Điều gì nhiều khả năng đúng về tài khoản của ông Hong?",
    wrong: [
      { text: "Ông Hong nghĩ điều gì đúng về tài khoản?", error: "chu-the", why: "Hỏi điều đúng VỀ tài khoản, không phải suy nghĩ của ông Hong." },
      { text: "Điều gì nhiều khả năng đúng về bản báo cáo của ông Hong?", error: "da-nghia", why: "account: tài khoản / bản tường thuật. Với app trực tuyến → tài khoản." },
    ],
    kwNote: "most likely true → 🟨. Mr. Hong's account → 🟩 (danh từ chính: account).",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Câu đầu email nói ngay về tài khoản (not logged in… inactivity) → đọc kỹ 2 câu đó." },
    evidence: {
      doc: "Email",
      excerpt: "It appears ==you have not logged in to your Topp Management online app recently==. After six months of inactivity, user accounts are automatically closed.",
      note: "Lâu không đăng nhập → It has not been used in a few months.",
    },
  },
  {
    id: "2026-8-155",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:suggested]] about the [[c:town of Hillsdale]]?",
    vi: "Có thể suy ra điều gì về thị trấn Hillsdale?",
    wrong: [
      { text: "Thị trấn Hillsdale đề xuất điều gì?", error: "da-nghia", why: "suggested about = ngụ ý về; thị trấn không 'đề xuất'." },
      { text: "Điều gì được đề xuất cho người dân Hillsdale?", error: "da-nghia", why: "Không phải đề xuất, và hỏi về thị trấn chứ không riêng người dân." },
    ],
    kwNote: "suggested about → 🟨. town of Hillsdale → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Bài báo",
      excerpt: "To accommodate ==Hillsdale's ever-growing population==… The second project will ==build residential housing==",
      note: "Dân số tăng liên tục + xây thêm nhà ở → It needs more housing.",
    },
  },
];

export const suyLuanNangCao: P7QItem[] = [
  {
    id: "2026-1-163",
    type: "suy-luan",
    prompt: "[[q:What]] does [[c:Ms. Martens]] [[t:suggest]] about [[c:flash-frozen food]]?",
    vi: "Bà Martens ngụ ý điều gì về thực phẩm cấp đông nhanh?",
    wrong: [
      { text: "Bà Martens đề xuất làm gì với thực phẩm cấp đông nhanh?", error: "da-nghia", why: "suggest ABOUT sth = ngụ ý / cho thấy về điều gì. 'Đề xuất làm gì' là suggest (that) sb do." },
      { text: "Bà Martens ngụ ý điều gì về đồ ăn chớp nhoáng?", error: "da-nghia", why: "flash-frozen = cấp đông nhanh (flash = rất nhanh), không phải 'chớp nhoáng / đồ ăn nhanh'." },
    ],
    kwNote: "X suggest about Y → Suy luận (ý ngầm của X). Cẩn thận với X suggest (that) Y do → Chi tiết (đề xuất).",
    strategy: { options: ["S2", "S3", "S1", "S4"], correct: "S2", why: "Scan lời trích dẫn của Ms. Martens có 'flash-freezing' → đọc kỹ câu đó và so với phương án." },
    evidence: {
      doc: "Bài báo",
      excerpt: "our method of flash-freezing… ensures that our products retain their texture and flavour ==as well as their healthy vitamins and minerals==… without sacrificing quality.",
      note: "Giữ được vitamin, khoáng chất → It is as nutritious as fresh food.",
    },
  },
  {
    id: "2026-2-152",
    type: "suy-luan",
    prompt: "[[q:When]] [[t:most likely]] will [[c:Ms. Begani]] [[c:meet]] with the [[c:accounting department]]?",
    vi: "Nhiều khả năng bà Begani sẽ gặp phòng kế toán khi nào?",
    wrong: [
      { text: "Nhiều khả năng phòng kế toán sẽ gặp bà Begani để làm gì?", error: "chu-the", why: "When = khi nào; và chủ ngữ là bà Begani (người đi gặp)." },
      { text: "Bà Begani đã gặp phòng kế toán khi nào?", error: "thi-bi-dong", why: "will meet = sẽ gặp." },
    ],
    kwNote: "When + most likely → phải loại trừ các ngày. Tên + accounting → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S4"], correct: "S3", why: "4 phương án là 4 ngày đều có trong chat → kiểm tra từng ngày: ngày nào bận, ngày nào đóng cửa, ngày nào quá muộn." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "Thursday, September 4. ==It will take up most of the day.== ‖ the only days I'll be in the office are September 2, 3, and 4. After that, I won't be back until September 15, ==which would be too late==. ‖ the office will be ==closed on the morning of September 2== for maintenance work… ==That leaves only one sure date== for that accounting meeting then.",
      note: "Loại 2/9, 4/9, 15/9 → On September 3.",
    },
  },
  {
    id: "2026-3-159",
    type: "suy-luan",
    prompt: "[[q:Who]] [[c:received]] a [[c:job promotion]] from [[c:within]] [[c:Osmond Microtronics Ltd.]]?",
    vi: "Ai được thăng chức từ nội bộ công ty Osmond Microtronics?",
    wrong: [
      { text: "Ai đã trao quyết định thăng chức tại Osmond Microtronics?", error: "chu-the", why: "received = NHẬN (người được thăng chức), không phải người trao." },
      { text: "Ai nhận được chương trình khuyến mãi việc làm từ Osmond Microtronics?", error: "da-nghia", why: "promotion: thăng chức / khuyến mãi. job promotion = thăng chức." },
    ],
    kwNote: "'from within' = người của chính công ty (không tuyển ngoài) → 🟩 then chốt.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "4 phương án là 4 tên → kiểm tra từng người: ai được tuyển từ ngoài, ai là nhân viên cũ được lên chức." },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "==product designer Lewis Sung will now oversee his department as director of product design==.",
      note: "Đang là nhà thiết kế, nay lên giám đốc chính phòng mình → Mr. Sung.",
    },
  },
  {
    id: "2026-5-174",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:suggested]] about the [[c:members]] of [[c:Mr. Gruyter's work crew]]?",
    vi: "Có thể suy ra điều gì về các thành viên trong đội thi công của ông Gruyter?",
    wrong: [
      { text: "Các thành viên trong đội của ông Gruyter đề xuất điều gì?", error: "da-nghia", why: "suggested about = ngụ ý về, không phải họ đề xuất." },
      { text: "Có thể suy ra điều gì về ông Gruyter?", error: "chu-the", why: "Hỏi về CÁC THÀNH VIÊN đội (members of… crew), không riêng ông Gruyter." },
    ],
    kwNote: "Cụm 'the members of Mr. Gruyter's work crew' → danh từ chính là members.",
    strategy: { options: ["S2", "S3", "S1", "S4"], correct: "S2", why: "Scan tin nhắn của Gruyter về đội ('My crew…') → câu 'unusually large job' là chỗ để suy luận." },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "Our work patching and waterproofing the foundation will likely take three or four days. ==It's an unusually large job.==",
      note: "3–4 ngày là bất thường → thường họ làm xong dưới 3 ngày (They usually complete jobs in fewer than three days).",
    },
  },
  {
    id: "2026-6-174",
    type: "suy-luan",
    prompt: "[[q:When]] will [[c:Ms. Karp's report]] [[t:most likely]] be [[c:sent]] to the [[c:staff]]?",
    vi: "Nhiều khả năng báo cáo của bà Karp sẽ được gửi cho nhân viên khi nào?",
    wrong: [
      { text: "Nhiều khả năng bà Karp sẽ gửi báo cáo cho nhân viên khi nào?", error: "thi-bi-dong", why: "be sent = ĐƯỢC gửi; báo cáo nằm trong bản tin, người gửi chưa chắc là bà Karp." },
      { text: "Nhân viên sẽ gửi báo cáo cho bà Karp khi nào?", error: "chu-the", why: "Báo cáo CỦA bà Karp được gửi ĐẾN nhân viên." },
    ],
    kwNote: "Bị động 'be sent to the staff' → 🟩. Bài không có ngày cụ thể → phải ghép 'monthly bulletin' + 'next bulletin'.",
    strategy: { options: ["S3", "S2", "S1", "S4"], correct: "S3", why: "4 phương án là 4 mốc (giờ, ngày, tuần, tháng) → tìm manh mối về tần suất bản tin rồi loại trừ." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "We don't have a lot of news ==this month==. ‖ I'll be sure to have a report on current projects ready ==for the next bulletin==.",
      note: "Bản tin ra hằng tháng; báo cáo vào kỳ sau → In a month.",
    },
  },
  {
    id: "2026-7-177",
    type: "suy-luan",
    prompt: "[[q:What]] is [[t:suggested]] about the [[c:workers]] who were [[c:hired last year]]?",
    vi: "Có thể suy ra điều gì về những công nhân được tuyển năm ngoái?",
    wrong: [
      { text: "Có thể suy ra điều gì về những công nhân đã tuyển người năm ngoái?", error: "thi-bi-dong", why: "who were hired = ĐƯỢC tuyển (bị động). Công nhân là người được tuyển." },
      { text: "Những công nhân được tuyển năm ngoái đề xuất điều gì?", error: "da-nghia", why: "suggested about = ngụ ý về họ." },
    ],
    kwNote: "Mệnh đề quan hệ bị động 'who were hired last year' → 🟩 (năm ngoái là mốc so sánh).",
    strategy: { options: ["S2", "S3", "S7", "S1"], correct: "S2", why: "Scan 'last year' trong email → câu so sánh năm nay với năm ngoái ('but this time…')." },
    evidence: {
      doc: "Email (văn bản 1)",
      excerpt: "We should hire the same number of workers as last year, but ==this time, all four should be full-time==.",
      note: "'this time' all full-time → năm ngoái thì không phải ai cũng làm toàn thời gian (They did not all work full-time).",
    },
  },
  {
    id: "2026-9-163",
    type: "suy-luan",
    prompt: "[[q:What]] can be [[t:concluded]] about the [[c:final paragraph]] of a [[c:personal statement]]?",
    vi: "Có thể kết luận điều gì về đoạn cuối của bài tự giới thiệu?",
    wrong: [
      { text: "Đoạn cuối của bài tự giới thiệu kết luận điều gì?", error: "thi-bi-dong", why: "can be concluded about = (người đọc) rút ra về đoạn cuối; không hỏi nội dung kết luận của đoạn." },
      { text: "Có thể kết luận điều gì về đoạn cuối của bản sao kê cá nhân?", error: "da-nghia", why: "personal statement = bài tự giới thiệu (khi xin việc)." },
    ],
    kwNote: "concluded → 🟨. final paragraph → 🟩 (bài sẽ viết 'Your final paragraph').",
    strategy: { options: ["S2", "S3", "S1", "S6"], correct: "S2", why: "Scan 'final paragraph' → câu đó giải thích vì sao đoạn cuối hợp để sửa theo từng vị trí." },
    evidence: {
      doc: "Hướng dẫn",
      excerpt: "Your final paragraph is an ideal place for this information, as ==you can create a separate version of this paragraph for each position== you apply for.",
      note: "Viết bản riêng cho từng vị trí → It should be easily customizable.",
    },
  },
  {
    id: "2026-4-184",
    type: "suy-luan",
    prompt: "[[q:What]] does the [[t:second e-mail]] [[t:suggest]] about [[c:Takem Boot Company]]?",
    vi: "Email thứ hai ngụ ý điều gì về công ty Takem Boot?",
    wrong: [
      { text: "Email thứ hai đề xuất công ty Takem Boot làm gì?", error: "da-nghia", why: "suggest ABOUT = ngụ ý về; không phải đề xuất ai làm gì." },
      { text: "Công ty Takem Boot ngụ ý điều gì trong email thứ hai?", error: "chu-the", why: "Chủ ngữ là the second e-mail." },
    ],
    kwNote: "'the second e-mail' → 🟨 phạm vi. suggest about → 🟨 Suy luận.",
    strategy: { options: ["S3", "S7", "S2", "S1"], correct: "S3", why: "Có phạm vi (second e-mail) → không ghép. Đối chiếu từng phương án với email 2." },
    evidence: {
      doc: "Email 2",
      excerpt: "we have other styles available in your preferred colour, including Viola boots, ==our most popular style==.",
      note: "Mẫu bán chạy nhất → It sells a lot of Viola boots. Bẫy: 'most popular style' của công ty, không phải 'most popular company'.",
    },
  },
  {
    id: "2026-2-189",
    type: "suy-luan",
    prompt: "[[q:What]] will [[c:Ms. Desnoyers]] [[t:most likely]] [[c:do]] as a [[c:result]] of the [[t:second e-mail]]?",
    vi: "Sau email thứ hai, nhiều khả năng bà Desnoyers sẽ làm gì?",
    wrong: [
      { text: "Bà Desnoyers đã làm gì khiến có email thứ hai?", error: "thi-bi-dong", why: "will … do as a result of = sẽ làm gì DO KẾT QUẢ của email (sau email), không phải nguyên nhân." },
      { text: "Người viết email thứ hai sẽ làm gì cho bà Desnoyers?", error: "chu-the", why: "Chủ ngữ là Ms. Desnoyers (người nhận email 2)." },
    ],
    kwNote: "as a result of the second e-mail → hành động sau khi đọc email 2 → 🟨 phạm vi + 🟩.",
    strategy: { options: ["S2", "S7", "S3", "S1"], correct: "S2", why: "Phạm vi rõ (second e-mail) → scan câu nói về bước tiếp theo ('will contact you…')." },
    evidence: {
      doc: "Email 2",
      excerpt: "I have forwarded your message to our office of public programs. ==A staff member will contact you by phone== with more details.",
      note: "Sẽ có nhân viên gọi điện → She will expect a telephone call. Bẫy: 'forwarded' là việc người viết đã làm, không phải bà Desnoyers.",
    },
  },
  {
    id: "2026-6-175",
    type: "suy-luan",
    prompt: "[[q:What]] will [[c:Mr. Nusaputra]] [[t:probably]] [[c:do next]]?",
    vi: "Có lẽ ông Nusaputra sẽ làm gì tiếp theo?",
    wrong: [
      { text: "Ông Nusaputra đã làm gì trước đó?", error: "thi-bi-dong", why: "will … do next = việc làm tiếp theo." },
      { text: "Người ta sẽ làm gì tiếp theo với ông Nusaputra?", error: "chu-the", why: "Chủ ngữ là Mr. Nusaputra." },
    ],
    kwNote: "probably = most likely → 🟨 Suy luận. do next → 🟩.",
    strategy: { options: ["S2", "S1", "S3", "S4"], correct: "S2", why: NEXT_WHY },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "==I'll just need an hour or so to finish it up==, as I have no client meetings this morning. I can send you the reminder before lunch.",
      note: "Hoàn thành nốt bản nhắc → Finish drafting a reminder. Bẫy: 'lunch', 'client meetings' có trong câu nhưng không phải việc sắp làm.",
    },
  },
];
