import type { P7QItem } from "../types";

const S1_WHY = "Hỏi văn bản dành cho ai / doanh nghiệp làm gì → không có 1 câu trả lời sẵn; nhìn tiêu đề, lời chào, người nhận, 2–3 câu đầu để đoán bối cảnh.";
const S2_WHY = "Hỏi danh tính một người cụ thể → scan tên người đó, xem chức danh, chữ ký, hoặc việc người khác nhờ họ làm.";

export const doiTuongCoBan: P7QItem[] = [
  {
    id: "2026-1-149",
    type: "doi-tuong",
    prompt: "[[q:What]] [[t:most likely]] is [[c:Ms. Seang's]] [[c:job]]?",
    vi: "Nhiều khả năng công việc của bà Seang là gì?",
    wrong: [
      { text: "Bà Seang thích công việc nào nhất?", error: "da-nghia", why: "most likely = nhiều khả năng (suy đoán), không phải 'thích nhất'." },
      { text: "Bà Seang giao việc gì cho người khác?", error: "chu-the", why: "Hỏi nghề của bà Seang, không hỏi bà giao việc gì." },
    ],
    kwNote: "most likely + job → dạng Đối tượng (đoán nghề). Tên người → 🟩.",
    strategy: { options: ["S2", "S1", "S3", "S4"], correct: "S2", why: S2_WHY },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "We have fifteen participants enrolled in ==your mosaic workshop== tomorrow… ==Your workshops get more popular every year!==",
      note: "Bà đứng lớp workshop làm tranh khảm → Art instructor.",
    },
  },
  {
    id: "2026-10-168",
    type: "doi-tuong",
    prompt: "[[q:What kind of business]] is [[c:Sagemont Services]]?",
    vi: "Sagemont Services là loại hình doanh nghiệp gì?",
    wrong: [
      { text: "Sagemont Services có loại hình kinh doanh tốt bụng nào?", error: "da-nghia", why: "kind of = loại; không phải 'tốt bụng' (kind là tính từ)." },
      { text: "Sagemont Services phục vụ những doanh nghiệp nào?", error: "chu-the", why: "Hỏi chính Sagemont là doanh nghiệp gì, không hỏi khách hàng của nó." },
    ],
    kwNote: "'What kind of business' cả cụm → 🟦, báo dạng Đối tượng (loại hình doanh nghiệp).",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: S1_WHY },
    evidence: {
      doc: "Trang web",
      excerpt: "we offer ==custom-tailored information technology solutions== to clients in various industries",
      note: "Giải pháp CNTT cho khách hàng → A technology consulting firm.",
    },
  },
  {
    id: "2026-10-181",
    type: "doi-tuong",
    prompt: "[[q:For whom]] is the [[t:notice]] [[t:most likely]] [[t:intended]]?",
    vi: "Nhiều khả năng thông báo dành cho ai?",
    wrong: [
      { text: "Thông báo được ai soạn ra?", error: "chu-the", why: "For whom … intended = dành CHO ai (người đọc), không phải ai viết." },
      { text: "Nhiều khả năng ai dự định đọc thông báo?", error: "thi-bi-dong", why: "is intended for = được dành cho (bị động); không phải ai đó 'dự định'." },
    ],
    kwNote: "For whom … intended → 🟦 + 🟨 dạng Đối tượng (người đọc). Không có 🟩.",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: S1_WHY },
    evidence: {
      doc: "Thông báo (văn bản 1)",
      excerpt: "==WELCOME TO RICHMOND SUPERMARKET!==… All classes use ingredients ==you can find right here in the store==.",
      note: "Chào mừng đến siêu thị, nguyên liệu bán ngay tại cửa hàng → Store customers.",
    },
  },
  {
    id: "2026-3-155",
    type: "doi-tuong",
    prompt: "[[q:What kind of business]] is [[c:Dannla Brothers]]?",
    vi: "Dannla Brothers là loại hình doanh nghiệp gì?",
    wrong: [
      { text: "Anh em nhà Dannla làm nghề gì?", error: "da-nghia", why: "Dannla Brothers là TÊN công ty; hỏi loại hình doanh nghiệp, không hỏi nghề của các anh em." },
      { text: "Dannla Brothers hợp tác với loại doanh nghiệp nào?", error: "chu-the", why: "Hỏi chính Dannla Brothers là gì." },
    ],
    kwNote: "What kind of business → 🟦. Tên công ty → 🟩.",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: "Câu 'We manufacture…' ở đầu trang web nói luôn công ty làm gì." },
    evidence: {
      doc: "Trang web",
      excerpt: "==We manufacture ergonomic laptop stands, comfortable chairs, and adjustable standing desks==",
      note: "Sản xuất giá đỡ, ghế, bàn → A maker of computer furniture.",
    },
  },
  {
    id: "2026-5-151",
    type: "doi-tuong",
    prompt: "[[q:For whom]] is the [[t:advertisement]] [[t:most likely]] [[t:intended]]?",
    vi: "Nhiều khả năng quảng cáo nhắm đến ai?",
    wrong: [
      { text: "Ai là người đăng quảng cáo?", error: "chu-the", why: "intended for = nhắm đến (người đọc), không phải người đăng." },
      { text: "Nhiều khả năng ai có ý định xem quảng cáo?", error: "thi-bi-dong", why: "is intended for là bị động: quảng cáo được làm ra cho ai." },
    ],
    kwNote: "For whom … intended → dạng Đối tượng.",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: "Đọc vài câu đầu xem quảng cáo khoe điều gì → đoán người nó muốn kéo đến." },
    evidence: {
      doc: "Quảng cáo khách sạn",
      excerpt: "==Windsurfing, paddleboarding, and several hiking and biking trails== are all a short walk from our front door… arrange ==a kayaking excursion or a fishing trip==",
      note: "Toàn hoạt động ngoài trời → People who enjoy outdoor activities.",
    },
  },
  {
    id: "2026-6-154",
    type: "doi-tuong",
    prompt: "[[q:Who]] [[t:most likely]] is [[c:Ms. Valdez]]?",
    vi: "Nhiều khả năng bà Valdez là ai?",
    wrong: [
      { text: "Ai thích bà Valdez nhất?", error: "da-nghia", why: "most likely = nhiều khả năng, không phải 'thích nhất'." },
      { text: "Bà Valdez nhiều khả năng sẽ gặp ai?", error: "chu-the", why: "Hỏi danh tính của chính bà Valdez." },
    ],
    kwNote: "Who most likely is X → dạng Đối tượng (danh tính). Bà Valdez là người NHẬN thư.",
    strategy: { options: ["S2", "S1", "S3", "S4"], correct: "S2", why: "Bà Valdez là người nhận thư → đọc những việc người viết nhờ bà làm (trả tiền cọc, bảo trì căn hộ)." },
    evidence: {
      doc: "Lá thư (gửi bà Valdez)",
      excerpt: "Per my lease agreement, this letter constitutes written notice that I will be moving out… ==Please let me know when I can expect the return of my security deposit.==",
      note: "Người nhận thông báo trả nhà và hoàn tiền cọc → A property manager.",
    },
  },
  {
    id: "2026-7-161",
    type: "doi-tuong",
    prompt: "[[q:For whom]] is the [[t:information]] [[t:most likely]] [[t:intended]]?",
    vi: "Nhiều khả năng thông tin này dành cho ai?",
    wrong: [
      { text: "Ai cung cấp thông tin này?", error: "chu-the", why: "intended for = dành cho người đọc, không hỏi nguồn." },
      { text: "Nhiều khả năng ai đã định đưa ra thông tin này?", error: "thi-bi-dong", why: "is intended là bị động: thông tin được dành cho ai." },
    ],
    kwNote: "For whom … intended → dạng Đối tượng.",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: "Câu đầu giới thiệu nhóm tình nguyện của NHÂN VIÊN công ty → người đọc là nhân viên. Đọc thêm câu sau để biết họ giúp ai." },
    evidence: {
      doc: "Trang web công ty",
      excerpt: "Building Blocks is ==the newest employee-led volunteer group at Milos Tek Corporation==… free seminars… to ==nonprofit organizations in Lalortown==.",
      note: "Dành cho nhân viên Milos Tek muốn giúp cộng đồng địa phương.",
    },
  },
  {
    id: "2026-8-167",
    type: "doi-tuong",
    prompt: "[[q:What]] [[t:most likely]] is [[c:Z-Hype]]?",
    vi: "Nhiều khả năng Z-Hype là gì?",
    wrong: [
      { text: "Z-Hype thích điều gì nhất?", error: "da-nghia", why: "most likely = nhiều khả năng." },
      { text: "Nhiều khả năng Z-Hype đã tổ chức sự kiện gì?", error: "chu-the", why: "Hỏi Z-Hype là thứ gì (danh tính), không hỏi nó làm gì." },
    ],
    kwNote: "What most likely is + tên riêng lạ → đoán đó là gì từ ngữ cảnh.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan mọi chỗ có 'Z-Hype', gom manh mối: sign in from home, virtual background." },
    evidence: {
      doc: "Thư mời",
      excerpt: "employees… will ==sign into the Z-Hype room from their homes== ‖ the most creative ==Z-Hype virtual background==",
      note: "Đăng nhập từ nhà, có phông nền ảo → A video conferencing platform.",
    },
  },
  {
    id: "2026-9-161",
    type: "doi-tuong",
    prompt: "[[q:For whom]] are the [[t:instructions]] [[t:most likely]] [[t:intended]]?",
    vi: "Nhiều khả năng các hướng dẫn này dành cho ai?",
    wrong: [
      { text: "Ai viết ra các hướng dẫn này?", error: "chu-the", why: "intended for = dành cho người đọc." },
      { text: "Các hướng dẫn này dành cho người hướng dẫn nào?", error: "da-nghia", why: "instructions = các chỉ dẫn (văn bản), không phải người hướng dẫn (instructors)." },
    ],
    kwNote: "For whom … intended → Đối tượng.",
    strategy: { options: ["S1", "S2", "S3", "S6"], correct: "S1", why: S1_WHY },
    evidence: {
      doc: "Hướng dẫn",
      excerpt: "Personal statements are brief pieces of writing that showcase ==a job applicant's most notable talents==… Do not forget to mention ==the specific job you are applying for==",
      note: "'you are applying for' → người đọc đang xin việc → Job applicants.",
    },
  },
  {
    id: "2026-4-164",
    type: "doi-tuong",
    prompt: "[[q:Where]] would the [[t:information]] [[t:most likely]] be [[c:found]]?",
    vi: "Nhiều khả năng thông tin này được đăng ở đâu?",
    wrong: [
      { text: "Nhiều khả năng người ta tìm thấy thông tin này khi nào?", error: "da-nghia", why: "Where = ở đâu (nguồn đăng), không phải khi nào." },
      { text: "Thông tin này giúp người đọc tìm thấy cái gì?", error: "chu-the", why: "be found là bị động: chính THÔNG TIN được tìm thấy ở đâu." },
    ],
    kwNote: "Where would … be found → đoán nguồn văn bản (Đối tượng).",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: "Nhìn tổng thể: đây là quảng cáo các gói xem bóng rổ → loại ấn phẩm nào sẽ đăng nó." },
    evidence: {
      doc: "Thông tin",
      excerpt: "==Stream exciting, insightful content from the Total Basketball Channel==",
      note: "Quảng cáo kênh xem bóng rổ → In a sports magazine.",
    },
  },
];

export const doiTuongNangCao: P7QItem[] = [
  {
    id: "2026-1-164",
    type: "doi-tuong",
    prompt: "[[t?:According]] [[t?:to]] the [[t:advertisement]], [[q:who]] [[t:most likely]] is [[c:Ms. Navani]]?",
    vi: "Theo quảng cáo, nhiều khả năng bà Navani là ai?",
    wrong: [
      { text: "Theo quảng cáo, bà Navani muốn gặp ai nhất?", error: "chu-the", why: "Hỏi danh tính của bà Navani." },
      { text: "Theo quảng cáo, ai thích bà Navani nhất?", error: "da-nghia", why: "most likely = nhiều khả năng." },
    ],
    kwNote: "Phạm vi 'According to the advertisement' → 🟨. Tên → 🟩.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: S2_WHY },
    evidence: {
      doc: "Quảng cáo",
      excerpt: "set up in the home of ==our current CEO and founder Shirin Navani==",
      note: "CEO và người sáng lập → A business owner (paraphrase).",
    },
  },
  {
    id: "2026-1-178",
    type: "doi-tuong",
    prompt: "[[q:In what field]] does [[c:Mr. Abruzzo]] [[t:most likely]] [[c:work]]?",
    vi: "Nhiều khả năng ông Abruzzo làm việc trong lĩnh vực nào?",
    wrong: [
      { text: "Nhiều khả năng ông Abruzzo làm việc trên cánh đồng nào?", error: "da-nghia", why: "field: cánh đồng / lĩnh vực. In what field … work = làm trong lĩnh vực nào." },
      { text: "Ông Abruzzo thuê ai làm việc cho mình?", error: "chu-the", why: "Hỏi lĩnh vực của chính ông Abruzzo." },
    ],
    kwNote: "'In what field' → 🟦. Ông Abruzzo là người NHẬN email 2 → thông tin về ông nằm trong lời người khác nói với ông.",
    strategy: { options: ["S2", "S7", "S1", "S3"], correct: "S2", why: "Scan 'Abruzzo' → email gửi ông; câu đầu cảm ơn ông việc gì là đủ, không cần ghép với bài báo." },
    evidence: {
      doc: "Email (văn bản 2, gửi ông Abruzzo)",
      excerpt: "Thank you again for ==creating the prototype Web site== for my food-truck business.",
      note: "Ông làm trang web → Web design.",
    },
  },
  {
    id: "2026-1-191",
    type: "doi-tuong",
    prompt: "[[q:What]] is [[c:one service]] that [[c:Darboury Company]] [[t:most likely]] [[c:provides]]?",
    vi: "Nhiều khả năng một dịch vụ mà công ty Darboury cung cấp là gì?",
    wrong: [
      { text: "Nhiều khả năng công ty Darboury sử dụng dịch vụ nào?", error: "chu-the", why: "provides = CUNG CẤP (Darboury là bên bán dịch vụ), không phải bên dùng." },
      { text: "Dịch vụ duy nhất mà công ty Darboury cung cấp là gì?", error: "da-nghia", why: "one service = MỘT trong các dịch vụ." },
    ],
    kwNote: "Mệnh đề 'that Darboury Company most likely provides' → hỏi dịch vụ của công ty (Đối tượng – lĩnh vực).",
    strategy: { options: ["S2", "S7", "S1", "S3"], correct: "S2", why: "Scan email gửi Darboury → khách nhờ họ làm gì." },
    evidence: {
      doc: "Email 1 (gửi Darboury)",
      excerpt: "We would like your help ==creating the following cover designs==.",
      note: "Thiết kế bìa → Graphic design.",
    },
  },
  {
    id: "2026-2-156",
    type: "doi-tuong",
    prompt: "[[c:Executives]] in [[q:what industry]] would [[t:most likely]] [[c:read]] [[c:CVT Direct magazine]]?",
    vi: "Nhiều khả năng lãnh đạo trong ngành nào sẽ đọc tạp chí CVT Direct?",
    wrong: [
      { text: "Tạp chí CVT Direct nhiều khả năng sẽ viết về lãnh đạo ngành nào?", error: "chu-the", why: "Executives … read: lãnh đạo là người ĐỌC tạp chí." },
      { text: "Những người thi hành án trong ngành nào sẽ đọc CVT Direct?", error: "da-nghia", why: "executive = (nhà) điều hành, lãnh đạo doanh nghiệp." },
    ],
    kwNote: "Câu đảo: từ để hỏi 'what industry' nằm giữa câu → 🟦. Đối tượng đọc là executives.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan 'sent / readers / published by' → câu nói tạp chí gửi cho ai." },
    evidence: {
      doc: "Trang web",
      excerpt: "published by Lorne Transportation, ==the largest freight vehicle corporation==… sent free… to managers of dealerships with fleets of 25 or more ==vehicles for transporting goods==",
      note: "Xe chở hàng, đội xe vận tải → Commercial trucking.",
    },
  },
  {
    id: "2026-2-168",
    type: "doi-tuong",
    prompt: "[[q:Who]] [[t:most likely]] is the [[t:intended audience]] of the [[t:advertisement]]?",
    vi: "Nhiều khả năng đối tượng mà quảng cáo nhắm đến là ai?",
    wrong: [
      { text: "Nhiều khả năng ai là khán giả của buổi biểu diễn trong quảng cáo?", error: "da-nghia", why: "audience of the advertisement = đối tượng NGƯỜI ĐỌC quảng cáo, không phải khán giả buổi diễn." },
      { text: "Ai là người làm ra quảng cáo?", error: "chu-the", why: "intended audience = người nhận, không phải người làm." },
    ],
    kwNote: "intended audience = For whom … intended → dạng Đối tượng.",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: "Tiêu đề + câu đầu ('It's never too late to learn…', 'for adults', 'for beginners') cho biết nhắm vào ai." },
    evidence: {
      doc: "Quảng cáo",
      excerpt: "==It's never too late to learn to play an instrument==… private music education program for adults… guitar and violin instruction ==for beginners==.",
      note: "Người lớn mới bắt đầu học → Individuals with no music experience.",
    },
  },
  {
    id: "2026-5-161",
    type: "doi-tuong",
    prompt: "[[q:What type of business]] do [[c:Ms. Ohtani]] and [[c:Ms. Rivera]] [[t:most likely]] [[c:operate]]?",
    vi: "Nhiều khả năng bà Ohtani và bà Rivera điều hành loại hình kinh doanh nào?",
    wrong: [
      { text: "Bà Ohtani và bà Rivera phẫu thuật cho loại doanh nghiệp nào?", error: "da-nghia", why: "operate: phẫu thuật / vận hành. operate a business = điều hành doanh nghiệp." },
      { text: "Bà Ohtani và bà Rivera làm khách hàng của loại doanh nghiệp nào?", error: "chu-the", why: "Hai bà là người ĐIỀU HÀNH, không phải khách." },
    ],
    kwNote: "What type of business … operate → Đối tượng (loại hình doanh nghiệp).",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan lời 2 bà trong bài, gom manh mối (authors, books and reading)." },
    evidence: {
      doc: "Bài báo",
      excerpt: "special events ==with authors==… People here ==love books and reading==, and they visit us regularly.",
      note: "→ A bookshop (cửa hàng tên A Thousand Stories).",
    },
  },
  {
    id: "2026-6-160",
    type: "doi-tuong",
    prompt: "[[q:In what industry]] do [[c:Mr. Porter]] and [[c:Ms. Warner]] [[t:most likely]] [[c:work]]?",
    vi: "Nhiều khả năng ông Porter và bà Warner làm trong ngành nào?",
    wrong: [
      { text: "Ông Porter và bà Warner làm việc chăm chỉ đến mức nào?", error: "da-nghia", why: "industry: ngành / sự chăm chỉ (nghĩa cũ). In what industry = ngành nào." },
      { text: "Ông Porter và bà Warner thuê ngành nào làm việc cho mình?", error: "chu-the", why: "Hỏi ngành họ làm." },
    ],
    kwNote: "In what industry → 🟦. Hai tên người → 🟩.",
    strategy: { options: ["S2", "S1", "S4", "S3"], correct: "S2", why: "Chuỗi tin ngắn: gom manh mối nghề nghiệp (open house, potential buyers)." },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "I'm preparing the paperwork for tomorrow's ==open house== at 431 Oakdale Lane. ‖ the pastries we want to provide to ==potential buyers==",
      note: "Buổi mở cửa xem nhà, người mua tiềm năng → Real estate.",
    },
  },
  {
    id: "2026-8-168",
    type: "doi-tuong",
    prompt: "[[q:For what type of event]] has [[c:Mr. Kolman]] [[t:most likely]] been [[c:hired]]?",
    vi: "Nhiều khả năng ông Kolman được thuê cho loại sự kiện nào?",
    wrong: [
      { text: "Nhiều khả năng ông Kolman đã thuê người cho sự kiện nào?", error: "thi-bi-dong", why: "has been hired = ĐƯỢC thuê (bị động hoàn thành). Ông là người được thuê." },
      { text: "Ông Kolman sẽ tổ chức loại sự kiện nào?", error: "chu-the", why: "Ông được thuê (làm diễn giả), không phải người tổ chức." },
    ],
    kwNote: "'For what type of event' → 🟦. Bị động 'has been hired' → ông là diễn giả được thuê.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan mục 'Event' / 'Name' trong hợp đồng." },
    evidence: {
      doc: "Hợp đồng",
      excerpt: "Name: ==Annual Employee Recognition and Honors==",
      note: "Lễ vinh danh nhân viên → An awards ceremony.",
    },
  },
  {
    id: "2026-10-180",
    type: "doi-tuong",
    prompt: "[[q:What]] is [[c:Mr. Tsudama's]] [[c:area of expertise]]?",
    vi: "Lĩnh vực chuyên môn của ông Tsudama là gì?",
    wrong: [
      { text: "Ông Tsudama có kinh nghiệm ở khu vực nào?", error: "da-nghia", why: "area: khu vực / lĩnh vực. area of expertise = lĩnh vực chuyên môn." },
      { text: "Ông Tsudama đánh giá chuyên môn của ai?", error: "chu-the", why: "Hỏi chuyên môn CỦA ông Tsudama." },
    ],
    kwNote: "area of expertise ≈ nghề / lĩnh vực → dạng Đối tượng (bài không ghi thẳng nghề).",
    strategy: { options: ["S2", "S7", "S1", "S3"], correct: "S2", why: "Scan 'Tsudama' trong bài báo → ông làm gì với tòa nhà." },
    evidence: {
      doc: "Bài báo (văn bản 2)",
      excerpt: "The new office building ==was designed by Frank Tsudama==, whose latest project involved Seoul's futurist Global Trade Centre.",
      note: "Thiết kế tòa nhà → Architecture.",
    },
  },
  {
    id: "2026-9-192",
    type: "doi-tuong",
    prompt: "[[q:Who]] [[t:most likely]] is [[c:Mr. Aurinen]]?",
    vi: "Nhiều khả năng ông Aurinen là ai?",
    wrong: [
      { text: "Ông Aurinen nhiều khả năng sẽ đào tạo ai?", error: "chu-the", why: "Hỏi danh tính của ông Aurinen." },
      { text: "Ai thích ông Aurinen nhất?", error: "da-nghia", why: "most likely = nhiều khả năng." },
    ],
    kwNote: "Ông Aurinen chỉ xuất hiện ở dòng To của email → danh tính phải suy từ việc ông được giao và tên miền email.",
    strategy: { options: ["S2", "S7", "S1", "S3"], correct: "S2", why: "Scan 'Aurinen' → dòng To (email @edwildurables.com) + việc được nhờ (chuẩn bị giấy tờ, xếp lịch). Không cần danh bạ hay lịch trình." },
    evidence: {
      doc: "Email (văn bản 1)",
      excerpt: "To: Max Aurinen <maurinen==@edwildurables.com==> … ==Please prepare his initial onboarding paperwork and arrange a schedule==",
      note: "Cùng công ty, làm giấy tờ và xếp lịch → An administrative assistant at Edwil Durables, Inc.",
    },
  },
];
