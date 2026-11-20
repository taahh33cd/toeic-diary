import type { P7QItem } from "../types";

const NOT_WHY = "NOT → tìm 3 phương án CÓ trong bài và gạch đi, phương án còn lại là đáp án. S2 chỉ tìm 1 chỗ, không đủ để kiểm tra cả 4 phương án.";

export const notCoBan: P7QItem[] = [
  {
    id: "2024-2-150",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT]] [[c:included]] in the [[c:reduced-price meals]]?",
    vi: "Thứ gì KHÔNG có trong các suất ăn giảm giá?",
    wrong: [
      { text: "Thứ gì KHÔNG có trong các bữa ăn đã giảm khẩu phần?", error: "da-nghia", why: "reduced-price = giá đã giảm, không phải giảm lượng đồ ăn." },
      { text: "Ai KHÔNG được ăn các suất giảm giá?", error: "chu-the", why: "Hỏi món nào không có trong suất ăn (What), không hỏi người (Who)." },
    ],
    kwNote: "NOT → 🟨. 'included in the meals' nói về nội dung suất ăn (bao gồm món gì) → 🟩, không phải tên văn bản.",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Thông báo",
      excerpt: "special four-course dinners including ==a cup of soup==, ==a salad==, ==a main course==, and ==a dessert==—all for a reduced price of $30.",
      note: "Có: súp, salad, món chính, tráng miệng → không nhắc đồ uống (a beverage) → đáp án.",
    },
  },
  {
    id: "2024-4-159",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT mentioned]] about [[c:green roofs]]?",
    vi: "Điều gì KHÔNG được nhắc đến về mái nhà xanh?",
    wrong: [
      { text: "Điều gì KHÔNG được nhắc đến về những mái nhà sơn màu xanh lá?", error: "da-nghia", why: "green roof = mái phủ cỏ cây. green ở đây là 'xanh' theo nghĩa cây cỏ / môi trường, không phải màu sơn." },
      { text: "Mái nhà xanh KHÔNG nhắc đến điều gì?", error: "thi-bi-dong", why: "is mentioned = BỊ ĐỘNG: điều được nhắc đến (trong bài) về mái nhà. Mái nhà không tự 'nhắc'." },
    ],
    kwNote: "NOT + mentioned → 🟨 dạng NOT. 'green roofs' = đối tượng cần kiểm tra → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Trang web",
      excerpt: "Green roofs are an energy-saving option for ==office buildings and homes==… It ==lowers heating and cooling costs== while ==increasing a structure's aesthetic appeal==.",
      note: "Có: giảm hoá đơn năng lượng, làm đẹp công trình, lắp cho cả văn phòng lẫn nhà ở → không nhắc việc lọc ô nhiễm không khí (remove pollution from the air).",
    },
  },
  {
    id: "2024-10-154",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT indicated]] about [[c:Mr. Rami]]?",
    vi: "Điều gì KHÔNG được nêu về ông Rami?",
    wrong: [
      { text: "Điều gì KHÔNG được chỉ đường cho ông Rami?", error: "da-nghia", why: "indicate trong câu hỏi Part 7 = cho biết / nêu, không phải chỉ đường." },
      { text: "Ông Rami KHÔNG được thông báo điều gì?", error: "chu-the", why: "about Mr. Rami = thông tin VỀ ông ấy, không phải điều thông báo CHO ông ấy." },
    ],
    kwNote: "NOT + indicated → 🟨. Tên người (🟩) là đối tượng cần kiểm tra.",
    strategy: { options: ["S3", "S2", "S1", "S4"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Đơn xin việc",
      excerpt: "The Garment Barn | ==Sales associate== | 2 years … I ==flourish in a fast-paced and demanding work environment== … with my ==bachelor's degree in retail management==…",
      note: "Có: học quản lý bán lẻ, có kinh nghiệm bán hàng, thích môi trường bận rộn → không nói ông 'mới chuyển đến' Werribee (recently moved). Bẫy: chữ Werribee CÓ trong địa chỉ.",
    },
  },
  {
    id: "2024-5-150",
    type: "not",
    prompt: "[[q:What color bag]] is [[c:currently]] [[t:NOT]] [[c:available]]?",
    vi: "Túi màu nào hiện KHÔNG còn hàng?",
    wrong: [
      { text: "Túi màu nào trước đây KHÔNG có hàng?", error: "thi-bi-dong", why: "currently = hiện tại." },
      { text: "Túi màu nào hiện KHÔNG rảnh?", error: "da-nghia", why: "available: có sẵn (hàng) / rảnh (người). Với đồ vật → còn hàng." },
    ],
    kwNote: "'What color bag' cả cụm là 🟦 (hỏi màu túi). NOT → 🟨. currently / available là nội dung cần dò → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S6"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Email",
      excerpt: "That item is currently available in ==light blue, dark green, and dark gray==… Wait until the item you ordered is back in stock in ==light gray==.",
      note: "Còn hàng: xanh nhạt, xanh lá đậm, xám đậm → hết hàng: xám nhạt (the light gray one).",
    },
  },
  {
    id: "2026-2-147",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT]] [[c:offered]] to [[c:Radial Tunes subscribers]]?",
    vi: "Điều gì KHÔNG được cung cấp cho người đăng ký Radial Tunes?",
    wrong: [
      { text: "Người đăng ký Radial Tunes KHÔNG đề nghị điều gì?", error: "thi-bi-dong", why: "is offered TO subscribers = được cung cấp CHO họ (bị động). Họ là người nhận, không phải người đề nghị." },
      { text: "Người đăng ký Radial Tunes KHÔNG được mời làm gì?", error: "da-nghia", why: "offer: cung cấp / mời / trả giá. Ở đây = cung cấp (quyền lợi)." },
    ],
    kwNote: "NOT → 🟨. 'offered' là nội dung (quyền lợi được cung cấp) → 🟩, cùng tên dịch vụ.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Thông tin",
      excerpt: "As a Radial Tunes subscriber, you can access ==hundreds of songs==, ==music videos==, and ==playlists specially curated by other users==.",
      note: "Có: kho bài hát lớn, video ca nhạc, playlist do người dùng tạo → không có phỏng vấn nghệ sĩ (audio interviews with popular musicians).",
    },
  },
  {
    id: "2026-3-147",
    type: "not",
    prompt: "[[q:What service]] is [[t:NOT]] [[c:included]] with the [[c:special]]?",
    vi: "Dịch vụ nào KHÔNG nằm trong gói ưu đãi?",
    wrong: [
      { text: "Dịch vụ nào KHÔNG đi kèm với món đặc biệt?", error: "da-nghia", why: "special là danh từ: món đặc biệt / gói ưu đãi đặc biệt. Đây là quảng cáo dịch vụ ô tô → gói ưu đãi." },
      { text: "Gói ưu đãi KHÔNG dành cho khách nào?", error: "chu-the", why: "Hỏi dịch vụ nào (What service) không có trong gói, không hỏi khách hàng." },
    ],
    kwNote: "'What service' → 🟦. NOT → 🟨. 'included with the special' = nội dung gói → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Quảng cáo",
      excerpt: "Service includes: • ==Conventional oil change== • ==Premium oil filter change== • ==Complimentary car inspection==",
      note: "Có: thay dầu, thay lọc dầu, kiểm tra xe → không có rửa xe (a car wash).",
    },
  },
  {
    id: "2026-3-166",
    type: "not",
    prompt: "[[q:What]] does the [[t:job posting]] [[t:NOT mention]]?",
    vi: "Tin tuyển dụng KHÔNG đề cập đến điều gì?",
    wrong: [
      { text: "Việc điều chuyển công tác KHÔNG đề cập đến điều gì?", error: "da-nghia", why: "posting: bài đăng / sự điều chuyển nhân sự. job posting = tin tuyển dụng." },
      { text: "Điều gì KHÔNG đề cập đến tin tuyển dụng?", error: "chu-the", why: "Chủ ngữ là the job posting: TIN TUYỂN DỤNG đề cập, không phải 'điều gì đó đề cập đến tin'." },
    ],
    kwNote: "NOT mention → 🟨. 'job posting' là tên văn bản → 🟨 phạm vi. Không có 🟩 → phải loại trừ.",
    strategy: { options: ["S3", "S1", "S2", "S6"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Tin tuyển dụng",
      excerpt: "The regular work hours… are ==Monday through Friday, 9:00 A.M. to 5:00 P.M.==… The job involves ==editing engineering reports==… Applicants must have ==a bachelor's degree==…",
      note: "Có: lịch làm việc, nhiệm vụ, yêu cầu bằng cấp → không có ngày bắt đầu làm (the starting date).",
    },
  },
  {
    id: "2026-8-150",
    type: "not",
    prompt: "[[q:What information]] is [[t:NOT included]] in the [[t:flyer]]?",
    vi: "Thông tin nào KHÔNG có trong tờ rơi?",
    wrong: [
      { text: "Thông tin nào KHÔNG có trong hồ sơ hành khách bay?", error: "da-nghia", why: "flyer: tờ rơi / người đi máy bay. Văn bản Part 7 → tờ rơi." },
      { text: "Ai KHÔNG được nhận tờ rơi?", error: "chu-the", why: "Hỏi thông tin nào không có (What information), không hỏi người nhận." },
    ],
    kwNote: "'What information' → 🟦. 'NOT included in the flyer' = không có trong văn bản → 🟨 cả cụm.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Tờ rơi",
      excerpt: "==The services we offer include:== • Power washing… • Window washing · Johan G. Matey · ==506-555-0193== · ==www.johanspowerwashing.ca==",
      note: "Có: danh sách dịch vụ, số điện thoại, địa chỉ web → không có địa chỉ gửi thư (a mailing address). Bẫy: Web address ≠ mailing address.",
    },
  },
  {
    id: "2026-8-153",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT indicated]] about the [[c:Westover Zoo]]?",
    vi: "Điều gì KHÔNG được nêu về Sở thú Westover?",
    wrong: [
      { text: "Điều gì KHÔNG được chỉ dẫn bằng biển báo tại Sở thú Westover?", error: "da-nghia", why: "indicate = cho biết / nêu (trong văn bản), không phải chỉ dẫn bằng biển." },
      { text: "Sở thú Westover KHÔNG nêu điều gì về khách tham quan?", error: "chu-the", why: "about the Westover Zoo = hỏi thông tin VỀ sở thú, không phải về khách." },
    ],
    kwNote: "NOT + indicated → 🟨. Tên sở thú (🟩) là đối tượng kiểm tra.",
    strategy: { options: ["S3", "S2", "S1", "S4"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Thông báo",
      excerpt: "Admission tickets are required for all visitors, ==including infants==. Tickets may be ==printed or presented electronically==… visit ==our Web site, westoverzoo.org==… During the summer months, extra buses run on these routes…",
      note: "Có: trẻ nhỏ cũng cần vé, vé giấy hoặc điện tử, có website. 'Summer months' chỉ nói xe buýt tăng chuyến → không nói sở thú chỉ mở mùa hè (đáp án). Bẫy: chữ summer CÓ trong bài.",
    },
  },
  {
    id: "2024-9-162",
    type: "not",
    prompt: "[[q:What material]] is [[t:NOT specified]] in the [[t:advertisement]]?",
    vi: "Vật liệu nào KHÔNG được nêu cụ thể trong quảng cáo?",
    wrong: [
      { text: "Tài liệu nào KHÔNG được nêu cụ thể trong quảng cáo?", error: "da-nghia", why: "material: vật liệu / tài liệu. Quảng cáo tuyển thợ cơ khí → vật liệu (kim loại, gỗ…)." },
      { text: "Ứng viên KHÔNG cần biết vật liệu nào?", error: "chu-the", why: "Hỏi điều quảng cáo nêu ra, không hỏi ứng viên cần biết gì." },
    ],
    kwNote: "'What material' → 🟦. NOT specified + tên văn bản → 🟨.",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Quảng cáo tuyển dụng",
      excerpt: "Comfort working with ==metal== and various other materials, such as ==wood== and ==plastics==",
      note: "Có: kim loại, gỗ, nhựa → không có kính (glass).",
    },
  },
];

export const notNangCao: P7QItem[] = [
  {
    id: "2024-1-169",
    type: "not",
    prompt: "[[t?:In]] the [[t:information]], [[q:what]] is [[t:NOT mentioned]] as being [[c:offered]] to [[c:employees]]?",
    vi: "Trong phần thông tin, điều gì KHÔNG được nhắc đến là quyền lợi dành cho nhân viên?",
    wrong: [
      { text: "Trong phần thông tin, nhân viên KHÔNG đề nghị điều gì?", error: "thi-bi-dong", why: "being offered TO employees = được trao cho nhân viên (bị động). Nhân viên là người nhận." },
      { text: "Trong phần thông tin, điều gì KHÔNG được chào bán cho nhân viên?", error: "da-nghia", why: "offer ở đây = cung cấp (phúc lợi), không phải chào bán." },
    ],
    kwNote: "'In the information' = phạm vi → 🟨. NOT mentioned → 🟨. 'offered to employees' = nội dung cần dò → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Thông tin tuyển dụng",
      excerpt: "our discount program enables them to fly… ==for a fraction of the average ticket price==… We offer upward and global mobility, ==tuition reimbursement==, ==a mentorship program==… ==Annual paid vacations==…",
      note: "Có: hoàn học phí, chương trình cố vấn, nghỉ phép có lương. Vé máy bay chỉ được GIẢM GIÁ, không MIỄN PHÍ → đáp án: free airline tickets.",
    },
  },
  {
    id: "2024-10-156",
    type: "not",
    prompt: "[[q:When]] can a [[c?:customer]] [[t:NOT]] be [[c:served]] at [[c:Donovan Auto Lube]]?",
    vi: "Khi nào khách hàng KHÔNG thể được phục vụ tại Donovan Auto Lube?",
    wrong: [
      { text: "Khi nào khách hàng KHÔNG thể phục vụ tại Donovan Auto Lube?", error: "thi-bi-dong", why: "be served = ĐƯỢC phục vụ (bị động). Khách là người được phục vụ." },
      { text: "Khi nào khách KHÔNG được dọn món tại Donovan Auto Lube?", error: "da-nghia", why: "serve: phục vụ / dọn món. Tiệm bảo dưỡng ô tô → phục vụ khách." },
    ],
    kwNote: "When → 🟦. NOT → 🟨. served + tên tiệm → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "4 phương án là 4 thời điểm → lấy giờ mở cửa rồi kiểm tra từng thời điểm. Đây vẫn là loại trừ (S3), dù chỉ có 1 chỗ trong bài." },
    evidence: {
      doc: "Quảng cáo",
      excerpt: "during our business hours of ==8:00 A.M. to 8:00P.M., Monday to Saturday==, and ==11:00 A.M. to 5:00P.M. on Sunday==.",
      note: "Thứ Hai 8h sáng ✓, Thứ Tư 6h chiều ✓, Thứ Bảy 4h chiều ✓, Chủ nhật 6h chiều ✗ (Chủ nhật đóng cửa lúc 5h) → đáp án: On Sunday at 6:00 P.M.",
    },
  },
  {
    id: "2024-4-163",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT stated]] about the [[c:live sound-mixing engineers]]?",
    vi: "Điều gì KHÔNG được nêu về các kỹ sư hoà âm trực tiếp?",
    wrong: [
      { text: "Điều gì KHÔNG được nêu về các kỹ sư hoà âm còn sống?", error: "da-nghia", why: "live (tính từ): trực tiếp (biểu diễn live) / còn sống. Hoà âm cho buổi diễn → trực tiếp." },
      { text: "Các kỹ sư hoà âm trực tiếp KHÔNG phát biểu điều gì?", error: "thi-bi-dong", why: "is stated about = được nêu VỀ họ (bị động), không phải họ phát biểu." },
    ],
    kwNote: "NOT stated → 🟨. Cụm danh từ dài 'live sound-mixing engineers' → 🟩, danh từ chính là engineers.",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Quảng cáo",
      excerpt: "we ==create recordings for them that they can post on social media to promote their shows==… known for their ==experience and professionalism== and have an impressive track record ==working on tours worldwide==.",
      note: "Có: làm tư liệu quảng bá, giàu kinh nghiệm, đi tour khắp thế giới → không nói họ có bằng âm nhạc (degrees in music).",
    },
  },
  {
    id: "2024-4-181",
    type: "not",
    prompt: "[[t?:According]] [[t?:to]] the [[t:schedule]], [[q:what]] is [[t:NOT mentioned]] as an [[c:activity]] for [[c:Mr. Darr]]?",
    vi: "Theo lịch trình, điều gì KHÔNG được nhắc đến là một hoạt động của ông Darr?",
    wrong: [
      { text: "Theo lịch trình, ông Darr KHÔNG nhắc đến hoạt động nào?", error: "thi-bi-dong", why: "is mentioned = được nhắc đến (trong lịch trình). Ông Darr không phải người nhắc." },
      { text: "Theo lịch trình, ông Darr đã KHÔNG tham gia hoạt động nào?", error: "chu-the", why: "Hỏi điều lịch trình không ghi, không hỏi việc ông Darr đã bỏ không làm." },
    ],
    kwNote: "'According to the schedule' khoanh vùng → 🟨: chỉ đọc lịch trình, bỏ qua bài review. NOT mentioned → 🟨.",
    strategy: { options: ["S3", "S7", "S2", "S1"], correct: "S3", why: "Có phạm vi rõ (schedule) nên KHÔNG cần ghép 2 văn bản (S7). Hoạt động nằm gọn ở đoạn đầu lịch trình → đối chiếu từng phương án." },
    evidence: {
      doc: "Lịch trình (văn bản 1)",
      excerpt: "Mr. Darr will ==read an excerpt from his new novel==… followed by ==a question-and-answer session==. Afterward, Mr. Darr will be available ==to autograph copies of his books==.",
      note: "Có: đọc trích đoạn, hỏi đáp, ký sách → không có chụp ảnh với người tham dự (taking photos with participants).",
    },
  },
  {
    id: "2024-5-156",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT listed]] as a [[c:responsibility]] of the [[c:construction superintendent]]?",
    vi: "Điều gì KHÔNG được liệt kê là trách nhiệm của giám sát thi công?",
    wrong: [
      { text: "Giám sát thi công KHÔNG liệt kê trách nhiệm nào?", error: "thi-bi-dong", why: "is listed = được liệt kê (trong quảng cáo tuyển dụng), không phải giám sát tự liệt kê." },
      { text: "Điều gì KHÔNG được liệt kê là lỗi của giám sát thi công?", error: "da-nghia", why: "responsibility = trách nhiệm (nhiệm vụ công việc), không phải 'lỗi phải chịu'." },
    ],
    kwNote: "NOT listed → 🟨 (thường gặp với danh sách gạch đầu dòng). responsibility + chức danh → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Quảng cáo tuyển dụng",
      excerpt: "Responsibilities: • Report to senior project manager • Manage on-site construction activities • ==Ensure compliance with safety regulations== • ==Negotiate purchases and contracts== • ==Establish construction schedules==",
      note: "Có (đã paraphrase): đảm bảo an toàn, đàm phán hợp đồng, lập lịch (Setting schedules = Establish construction schedules) → không có đào tạo công nhân mới (training inexperienced workers).",
    },
  },
  {
    id: "2024-5-162",
    type: "not",
    prompt: "[[q:Who]] will [[t:NOT]] be [[c:conducting informational presentations]] at the [[c:fair]]?",
    vi: "Ai sẽ KHÔNG thuyết trình cung cấp thông tin tại hội chợ?",
    wrong: [
      { text: "Ai đã KHÔNG thuyết trình tại hội chợ?", error: "thi-bi-dong", why: "will be conducting = tương lai (hội chợ diễn ra cuối tuần này)." },
      { text: "Ai sẽ KHÔNG thuyết trình một cách công bằng?", error: "da-nghia", why: "fair: hội chợ (danh từ) / công bằng (tính từ). 'at the fair' → hội chợ." },
    ],
    kwNote: "Who → 🟦. NOT → 🟨. 'conducting informational presentations' + 'fair' → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Bài báo",
      excerpt: "presentations by ==coffee growers== and roasters, food writers, ==makers of kitchen equipment==, and ==chefs==.",
      note: "Có: người trồng cà phê, nhà sản xuất thiết bị bếp, đầu bếp → không có chủ quán cà phê (coffeehouse owners). Bẫy: 'coffeehouse experience' ở đoạn sau nói về khách tự pha ở nhà.",
    },
  },
  {
    id: "2024-9-183",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT indicated]] [[t?:in]] the [[t:article]] as a [[c:characteristic]] of a [[c:good tour guide]]?",
    vi: "Bài báo KHÔNG nêu điều gì là đặc điểm của một hướng dẫn viên giỏi?",
    wrong: [
      { text: "Bài báo KHÔNG nêu điều gì là đặc điểm của một cuốn sách hướng dẫn du lịch hay?", error: "da-nghia", why: "guide: người hướng dẫn / sách hướng dẫn. Bài nói về người dẫn khách tham quan nhà máy." },
      { text: "Hướng dẫn viên giỏi KHÔNG nêu điều gì trong bài báo?", error: "thi-bi-dong", why: "is indicated = được nêu (trong bài báo). Hướng dẫn viên không phải người viết." },
    ],
    kwNote: "NOT indicated + 'in the article' (phạm vi, bộ có 2 văn bản) → 🟨. characteristic + good tour guide → 🟩.",
    strategy: { options: ["S3", "S7", "S2", "S1"], correct: "S3", why: "Phạm vi 'in the article' → chỉ đọc bài báo, không cần ghép với email. Các đặc điểm nằm rải rác trong đoạn cuối → đối chiếu từng phương án." },
    evidence: {
      doc: "Bài báo (văn bản 1)",
      excerpt: "having a ==personable and friendly tour guide== is essential… ==a comprehensive knowledge of the production processes== is important… someone who will keep the tour moving—visitors will appreciate a tour that ==begins and ends on time==.",
      note: "Có: thân thiện, hiểu quy trình, đúng giờ. 'Standing… for long periods' có trong bài nhưng nói KHÁCH mỏi chân, không phải yêu cầu với hướng dẫn viên → đáp án.",
    },
  },
  {
    id: "2026-1-177",
    type: "not",
    prompt: "[[t?:According]] [[t?:to]] the [[t:article]], [[q:what information]] does [[t:not]] [[t:need]] to [[c:appear]] on the [[c:Home page]]?",
    vi: "Theo bài báo, thông tin nào KHÔNG cần xuất hiện trên Trang chủ?",
    wrong: [
      { text: "Theo bài báo, thông tin nào có vẻ không cần thiết trên Trang chủ?", error: "da-nghia", why: "appear: xuất hiện / có vẻ. 'appear on the Home page' → xuất hiện trên trang." },
      { text: "Theo bài báo, thông tin nào đã bị gỡ khỏi Trang chủ?", error: "thi-bi-dong", why: "does not need to = không cần (lời khuyên ở hiện tại), không nói thông tin đã bị gỡ." },
    ],
    kwNote: "'not' viết thường nhưng 'does not need to' vẫn là câu phủ định hỏi điều KHÔNG cần → cùng cách làm NOT. 'According to the article' → 🟨 phạm vi.",
    strategy: { options: ["S3", "S7", "S2", "S1"], correct: "S3", why: "Có phạm vi (article) → không cần email. Lấy danh sách thứ Trang chủ cần có, gạch 3 phương án." },
    evidence: {
      doc: "Bài báo (văn bản 1)",
      excerpt: "The Home page should have bold graphics with ==your food truck's name==. The text must prominently display key information, such as ==your truck's locations and operating hours==.… The News page can include text informing visitors about seasonal food items…",
      note: "Trang chủ cần: tên xe, địa điểm, giờ hoạt động → món theo mùa (seasonal food items) thuộc trang News → đáp án.",
    },
  },
  {
    id: "2026-4-183",
    type: "not",
    prompt: "[[q:What color]] is [[c:currently]] [[t:NOT]] [[c:available]] for [[c:boots]] in the [[c:Erin style]]?",
    vi: "Màu nào hiện KHÔNG còn hàng cho mẫu bốt Erin?",
    wrong: [
      { text: "Màu nào trước đây KHÔNG có cho mẫu bốt Erin?", error: "thi-bi-dong", why: "currently = hiện tại." },
      { text: "Màu nào hiện KHÔNG có cho bốt theo phong cách của Erin?", error: "da-nghia", why: "style ở đây = kiểu / mẫu sản phẩm (tên mẫu là Erin), không phải phong cách của một người tên Erin." },
    ],
    kwNote: "'What color' → 🟦. NOT → 🟨. currently / available / boots / Erin style → 🟩. Bộ 2 email, không ghi phạm vi → nghĩ đến Liên kết.",
    strategy: { options: ["S7", "S2", "S1", "S4"], correct: "S7", why: "Email 1: khách đã mua màu chocolate, muốn đổi sang terracotta. Email 2: màu khách yêu cầu đã hết, còn sand và forest. Phải ghép 2 email mới ra màu hết hàng." },
    evidence: {
      doc: "Email 1 + Email 2",
      excerpt: "I would like to exchange the boots… ==in the terracotta colour==. ‖ boots in the size, style, and colour you are requesting ==are out of stock==… Other than what you have purchased, we currently have the Erin boots of your size in the following colours: ==sand and forest==.",
      note: "Còn hàng: chocolate (đã mua), sand, forest → hết hàng: terracotta.",
    },
  },
  {
    id: "2026-9-162",
    type: "not",
    prompt: "[[q:What]] is [[t:NOT mentioned]] as something to be [[c:considered]] when [[c:writing a personal statement]]?",
    vi: "Điều gì KHÔNG được nhắc đến là yếu tố cần cân nhắc khi viết bài tự giới thiệu (personal statement)?",
    wrong: [
      { text: "Điều gì KHÔNG được nhắc đến là yếu tố cần cân nhắc khi lập bản sao kê cá nhân?", error: "da-nghia", why: "statement: bản sao kê (ngân hàng) / bài trình bày. personal statement khi xin việc = bài tự giới thiệu." },
      { text: "Điều gì KHÔNG được nhắc đến là thứ đã được xem xét khi viết bài tự giới thiệu?", error: "thi-bi-dong", why: "to be considered = CẦN được cân nhắc (việc nên làm), không phải đã xem xét rồi." },
    ],
    kwNote: "NOT mentioned → 🟨. considered + personal statement → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S6"], correct: "S3", why: NOT_WHY },
    evidence: {
      doc: "Hướng dẫn",
      excerpt: "be thoughtful about issues such as ==word choice and tone==… aim for ==between 300 and 500 words==… provide concrete examples… ==your ability to overcome challenges==…",
      note: "Có: chất lượng câu chữ, số từ, ví dụ vượt khó → không nhắc thông tin học vấn (details about the writer's education).",
    },
  },
];
