import type { P7QItem } from "../types";

const S1_OPTS = ["S1", "S2", "S3", "S7"] as const;

export const mucDichCoBan: P7QItem[] = [
  {
    id: "2024-1-176",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:purpose]] of the [[t:press release]]?",
    vi: "Mục đích của thông cáo báo chí là gì?",
    wrong: [
      { text: "Mục đích của việc phát hành báo là gì?", error: "da-nghia", why: "press release là danh từ ghép = thông cáo báo chí (văn bản), không phải hành động 'phát hành báo'." },
      { text: "Báo chí đăng tin này nhằm mục đích gì?", error: "chu-the", why: "Chủ thể là bản thông cáo do công ty viết, không phải các tờ báo." },
    ],
    kwNote: "What + purpose → dạng Mục đích. 'press release' là tên văn bản → 🟨 phạm vi. Câu không có 🟩 → đọc ý chính.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Thông cáo báo chí luôn đưa tin chính vào câu mở đầu (sau dòng địa danh – ngày tháng)." },
    evidence: {
      doc: "Thông cáo báo chí",
      excerpt: "SYDNEY (4 June)—==Kitchen Swifts and Chef Darius Cordero are joining together== to give home cooks a new culinary experience.",
      note: "Kitchen Swifts và đầu bếp Cordero hợp tác → mục đích: thông báo một quan hệ hợp tác kinh doanh (announce a business partnership).",
    },
  },
  {
    id: "2024-10-168",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:purpose]] of the [[t:brochure]]?",
    vi: "Mục đích của tờ giới thiệu (brochure) là gì?",
    wrong: [
      { text: "Người đọc tờ giới thiệu nhằm mục đích gì?", error: "chu-the", why: "Hỏi mục đích của tờ giới thiệu (của bên viết), không phải của người đọc." },
      { text: "Tờ giới thiệu này trước đây đã được dùng vào mục đích gì?", error: "thi-bi-dong", why: "'is' ở hiện tại và chủ động; câu hỏi không nói gì về quá khứ hay việc 'được dùng'." },
    ],
    kwNote: "purpose → Mục đích; 'brochure' là tên văn bản → 🟨. Không có 🟩.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Đọc tiêu đề + đoạn mở đầu, rồi lướt bố cục: phần lớn bài là các bước 'Here's how it works: First…' → bài giới thiệu một quy trình." },
    evidence: {
      doc: "Tờ giới thiệu",
      excerpt: "Contempo Spaces has the perfect treatment design package for you… ==Here's how it works:== • ==First==, one of our style representatives will come to your home and measure and photograph the windows…",
      note: "Thân bài liệt kê lần lượt các bước của gói dịch vụ → mục đích: trình bày một quy trình chuẩn (present a standard process).",
    },
  },
  {
    id: "2024-2-161",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:purpose]] of the [[t:letter]]?",
    vi: "Mục đích của lá thư là gì?",
    wrong: [
      { text: "Mục đích của chữ cái là gì?", error: "da-nghia", why: "letter có 2 nghĩa: lá thư / chữ cái. Part 7 là văn bản → lá thư." },
      { text: "Người nhận lá thư có mục đích gì?", error: "chu-the", why: "Hỏi mục đích của lá thư (người viết), không phải của người nhận." },
    ],
    kwNote: "purpose → Mục đích; 'letter' là tên văn bản → 🟨.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Câu 'This is a reminder that…' ngay sau lời chào nói luôn lý do viết thư." },
    evidence: {
      doc: "Lá thư",
      excerpt: "This is a reminder that ==the one-year lease for your space will end on 30 April==. Please contact my office… to make an appointment to ==renew your lease==.",
      note: "Thư nhắc hợp đồng thuê sắp hết hạn và hướng dẫn gia hạn → mục đích: cung cấp thông tin về hợp đồng thuê (provide information about a lease agreement).",
    },
  },
  {
    id: "2026-7-158",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:purpose]] of the [[t:memo]]?",
    vi: "Mục đích của bản ghi nhớ (memo) là gì?",
    wrong: [
      { text: "Nhân viên cần làm gì với bản ghi nhớ?", error: "chu-the", why: "Câu hỏi về bản ghi nhớ, không hỏi nhân viên phải làm gì." },
      { text: "Bản ghi nhớ đã đạt được mục đích gì?", error: "thi-bi-dong", why: "Hỏi mục đích (hiện tại: is), không hỏi kết quả đã đạt được." },
    ],
    kwNote: "purpose → Mục đích; 'memo' là tên văn bản → 🟨.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Dòng Subject và câu đầu tiên của memo nêu ngay chuyện chính: nhà hát sắp mở cửa lại." },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "I am thrilled about ==the imminent reopening of our theatre==… It has been a long process, and audiences will undoubtedly appreciate ==all the renovations==…",
      note: "Nhà hát sắp mở cửa lại sau đợt cải tạo → mục đích: cập nhật cho nhân viên về một dự án đã hoàn thành (update employees about the completion of a project).",
    },
  },
  {
    id: "2026-8-149",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:purpose]] of the [[t:flyer]]?",
    vi: "Mục đích của tờ rơi là gì?",
    wrong: [
      { text: "Mục đích của người phi công là gì?", error: "da-nghia", why: "flyer: tờ rơi / người bay. Văn bản Part 7 → tờ rơi." },
      { text: "Khách hàng nhận tờ rơi để làm gì?", error: "chu-the", why: "Hỏi mục đích của tờ rơi (bên phát), không phải của khách nhận." },
    ],
    kwNote: "purpose → Mục đích; 'flyer' là tên văn bản → 🟨.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Tên doanh nghiệp ở tiêu đề + câu kêu gọi cuối bài đủ cho thấy đây là quảng cáo." },
    evidence: {
      doc: "Tờ rơi",
      excerpt: "==Johan's Power Washing== … Serving the Meadowbrook community for over 25 years!… The services we offer include… ==Call now for a free estimate== or to schedule a cleaning.",
      note: "Giới thiệu dịch vụ + kêu gọi gọi điện → mục đích: quảng cáo một doanh nghiệp địa phương (advertise a local business).",
    },
  },
  {
    id: "2024-2-155",
    type: "muc-dich",
    prompt: "[[q:Why]] did [[c:Ms. Otney]] [[t:write]] the [[t:letter]]?",
    vi: "Tại sao bà Otney viết lá thư này?",
    wrong: [
      { text: "Tại sao bà Otney nhận được lá thư này?", error: "chu-the", why: "Bà Otney là người VIẾT thư (did … write), không phải người nhận." },
      { text: "Tại sao bà Otney sẽ viết thư?", error: "thi-bi-dong", why: "did = quá khứ: thư đã được viết rồi." },
    ],
    kwNote: "Why did … write = hỏi lý do viết → dạng Mục đích, nên 'write' là 🟨. Tên người viết (🟩) giúp chắc chắn đọc đúng lá thư.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Câu đầu thư: 'I have read your inquiry…' → đây là thư trả lời." },
    evidence: {
      doc: "Lá thư",
      excerpt: "Dear Mr. Croft, … ==I have read your inquiry about offering financial management courses== at libraries across Queensland.",
      note: "Bà Otney trả lời thư hỏi của ông Croft → mục đích: trả lời câu hỏi của ông Croft (reply to a question from Mr. Croft).",
    },
  },
  {
    id: "2024-2-164",
    type: "muc-dich",
    prompt: "[[q:Why]] did [[c:Mr. Hagel]] [[t:write]] the [[t:e-mail]]?",
    vi: "Tại sao ông Hagel viết email này?",
    wrong: [
      { text: "Tại sao có người viết email cho ông Hagel?", error: "chu-the", why: "Ông Hagel là người viết (From: khagel), không phải người nhận." },
      { text: "Tại sao ông Hagel sẽ viết email?", error: "thi-bi-dong", why: "did = quá khứ: email đã được viết." },
    ],
    kwNote: "Why did … write → Mục đích ('write' là 🟨). Tên người viết là 🟩.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Câu đầu nhắc 'your proposed revisions to the contract', các câu sau đồng ý / từ chối từng điểm → mục đích lộ ngay từ đầu." },
    evidence: {
      doc: "Email",
      excerpt: "Thank you for forwarding ==your proposed revisions to the contract==… First, ==we will gladly agree to an extension== of the contract term… ==we do not agree to pay an additional penalty fee==…",
      note: "Đồng ý điểm này, từ chối điểm kia trong bản sửa hợp đồng → mục đích: thương lượng hợp đồng (negotiate a contract).",
    },
  },
  {
    id: "2024-1-161",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:main purpose]] of the [[t:e-mail]]?",
    vi: "Mục đích chính của email là gì?",
    wrong: [
      { text: "Mục đích chính của người nhận email là gì?", error: "chu-the", why: "Hỏi mục đích của email (người viết), không phải của người nhận." },
      { text: "Email đã đạt được kết quả chính nào?", error: "thi-bi-dong", why: "Hỏi mục đích ở hiện tại (is), không hỏi kết quả đã đạt." },
    ],
    kwNote: "'main purpose' → Mục đích CHÍNH (khác 'one purpose'). 'e-mail' là tên văn bản → 🟨.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Mở đầu bằng lời cảm ơn thì đọc tiếp 2–3 câu: yêu cầu thật nằm ngay sau, ở câu 'Please…'." },
    evidence: {
      doc: "Email",
      excerpt: "Thank you for selecting our business… You will be billed on March 28. ==Please review the attached order form and return it to me within seven days.==",
      note: "Sau lời cảm ơn là yêu cầu xem lại và gửi lại đơn hàng → mục đích chính: đề nghị xác nhận đơn hàng (request confirmation of an order).",
    },
  },
  {
    id: "2026-3-149",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:main purpose]] of the [[t:article]]?",
    vi: "Mục đích chính của bài báo là gì?",
    wrong: [
      { text: "Mục đích chính của mạo từ là gì?", error: "da-nghia", why: "article: bài báo / mạo từ / điều khoản. Trong Part 7 → bài báo." },
      { text: "Người đọc bài báo chủ yếu muốn gì?", error: "chu-the", why: "Hỏi mục đích của bài báo, không phải của người đọc." },
    ],
    kwNote: "'main purpose' → Mục đích chính; 'article' là tên văn bản → 🟨.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Bài tin ngắn: câu đầu nêu sự kiện chính (ga sắp được cải tạo)." },
    evidence: {
      doc: "Bài báo",
      excerpt: "Commuters are relieved that ==the River Avenue Railway Station is finally going to be renovated==… ==Work will begin in two weeks==…",
      note: "Ga sắp được cải tạo, khởi công sau 2 tuần → mục đích: thông báo một dự án cải tạo sắp bắt đầu (publicize the start of a renovation project).",
    },
  },
  {
    id: "2024-10-178",
    type: "muc-dich",
    prompt: "[[q:What]] is [[t:one purpose]] of the [[t:e-mail]]?",
    vi: "Một trong những mục đích của email là gì?",
    wrong: [
      { text: "Mục đích duy nhất của email là gì?", error: "da-nghia", why: "one purpose = MỘT TRONG các mục đích, không phải 'duy nhất' (only). Email có thể có nhiều mục đích." },
      { text: "Một mục đích của người nhận email là gì?", error: "chu-the", why: "Hỏi mục đích của email (người viết), không phải của người nhận." },
    ],
    kwNote: "'one purpose' → email có thể có NHIỀU mục đích; đây là tín hiệu đổi cách làm.",
    strategy: { options: ["S3", "S1", "S2", "S7"], correct: "S3", why: "one purpose → đáp án có thể nằm ở bất kỳ đoạn nào (ở đây: báo trùng lịch + hỏi có bản ghi lại không). Đối chiếu từng phương án với cả email." },
    evidence: {
      doc: "Email (văn bản 2)",
      excerpt: "==I am scheduled to present a detailed project update== at my company's quarterly division meeting ==on the same day==… Do you know whether the webinar will be recorded…?",
      note: "Ông Chung trùng lịch thuyết trình đúng ngày webinar → một mục đích: giải thích việc trùng lịch (explain a scheduling conflict).",
    },
  },
];

export const mucDichNangCao: P7QItem[] = [
  {
    id: "2024-2-186",
    type: "muc-dich",
    prompt: "[[q:Why]] did [[c:Mr. Nakashima]] [[t:send]] the [[t:e-mail]]?",
    vi: "Tại sao ông Nakashima gửi email?",
    wrong: [
      { text: "Tại sao ông Nakashima nhận được email?", error: "chu-the", why: "Ông Nakashima là người GỬI (did … send), không phải người nhận." },
      { text: "Vì sao ông Nakashima được yêu cầu gửi email?", error: "thi-bi-dong", why: "Câu chủ động 'did … send', không có ai yêu cầu ông. Tự thêm bị động là đổi nghĩa." },
    ],
    kwNote: "Why did … send → Mục đích. Bộ có 2 email + hoá đơn → tên Nakashima (🟩) quyết định đọc email nào.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Dùng tên để chọn đúng email (From: Akihito Nakashima), rồi đọc 2–3 câu đầu. Không cần ghép văn bản." },
    evidence: {
      doc: "Email 1",
      excerpt: "I received an e-mail receipt, but ==the costs are not itemized on it==… Could you e-mail me such a receipt?",
      note: "Hoá đơn không ghi giá từng món → ông gửi email vì nhận hoá đơn không đủ chi tiết (received a receipt that was not detailed enough).",
    },
  },
  {
    id: "2024-4-195",
    type: "muc-dich",
    prompt: "[[q:What]] is [[t:one purpose]] of [[c:Ms. Smith's]] [[t:e-mail]] to [[c:Mr. Hilliard]]?",
    vi: "Một trong những mục đích của email bà Smith gửi ông Hilliard là gì?",
    wrong: [
      { text: "Một mục đích của email ông Hilliard gửi bà Smith là gì?", error: "chu-the", why: "Ms. Smith's e-mail to Mr. Hilliard: Smith gửi → Hilliard nhận." },
      { text: "Mục đích duy nhất của email bà Smith gửi ông Hilliard là gì?", error: "da-nghia", why: "one purpose = một trong các mục đích, không phải 'duy nhất'." },
    ],
    kwNote: "one purpose → nhiều mục đích. Sở hữu cách 'Ms. Smith's … to Mr. Hilliard' cho biết người gửi và người nhận (🟩).",
    strategy: { options: ["S3", "S1", "S2", "S7"], correct: "S3", why: "Đoạn đầu chỉ là hỏi thăm và kể chuyện bản thân; lời nhờ vả nằm ở đoạn 2. one purpose → đối chiếu từng phương án với cả email." },
    evidence: {
      doc: "Email (văn bản 3)",
      excerpt: "I have a nephew who is interested in pursuing a degree… ==I was hoping I could put you both in touch so that he can take advantage of your new company's expertise== in this area.",
      note: "Nhờ công ty Clear Path của ông Hilliard tư vấn cho cháu → một mục đích: nhờ dịch vụ chuyên môn của ông (request his professional services).",
    },
  },
  {
    id: "2026-9-147",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:purpose]] of the [[c:event]]?",
    vi: "Mục đích của sự kiện là gì?",
    wrong: [
      { text: "Mục đích của thư mời là gì?", error: "chu-the", why: "Hỏi mục đích của SỰ KIỆN (buổi tiệc được mời), không phải của văn bản thư mời." },
      { text: "Mục đích của biến cố này là gì?", error: "da-nghia", why: "event: sự kiện / biến cố. Đây là buổi tiệc công ty → sự kiện." },
    ],
    kwNote: "Khác các câu khác: hỏi mục đích của 'event' (nội dung trong bài), không phải của văn bản → 'event' là 🟩.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Thư mời ngắn: dòng đầu nói luôn mục đích buổi gặp." },
    evidence: {
      doc: "Thư mời",
      excerpt: "Join your colleagues for pastries and coffee ==to welcome Ms. Misun Lee as Chief Financial Officer==",
      note: "Tiệc để chào đón tân Giám đốc Tài chính → mục đích: giới thiệu lãnh đạo mới với nhân viên (introduce a new company executive to employees).",
    },
  },
  {
    id: "2026-10-189",
    type: "muc-dich",
    prompt: "[[q:Why]] did [[c:Ms. Raskin]] [[t:send]] the [[t:e-mail]] to [[c:Dr. Sohn]]?",
    vi: "Tại sao bà Raskin gửi email cho tiến sĩ Sohn?",
    wrong: [
      { text: "Tại sao tiến sĩ Sohn gửi email cho bà Raskin?", error: "chu-the", why: "Raskin send … to Sohn: Raskin gửi, Sohn nhận." },
      { text: "Tại sao bà Raskin sẽ gửi email cho tiến sĩ Sohn?", error: "thi-bi-dong", why: "did = quá khứ: email đã gửi." },
    ],
    kwNote: "Why did … send → Mục đích. Bộ 3 văn bản → 2 tên (🟩) giúp tìm đúng email.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Tìm email From: Paulina Raskin, To: Dae-Ho Sohn, đọc câu đầu. Bài báo và lịch trình không cần đến." },
    evidence: {
      doc: "Email (văn bản 3)",
      excerpt: "==I just wanted to thank you again for speaking at the ICVA conference== in Berlin last week.",
      note: "Cảm ơn vì đã phát biểu ở hội nghị → mục đích: bày tỏ lòng biết ơn vì ông tham gia sự kiện (express gratitude for his participation in an event).",
    },
  },
  {
    id: "2026-10-194",
    type: "muc-dich",
    prompt: "[[q:What]] is [[t:one purpose]] of [[c:Mr. Moran's]] [[t:e-mail]]?",
    vi: "Một trong những mục đích của email ông Moran là gì?",
    wrong: [
      { text: "Một mục đích của email gửi cho ông Moran là gì?", error: "chu-the", why: "Mr. Moran's e-mail = email CỦA ông Moran (ông ký tên cuối thư), không phải email gửi cho ông." },
      { text: "Mục đích duy nhất của email ông Moran là gì?", error: "da-nghia", why: "one purpose = một trong các mục đích." },
    ],
    kwNote: "one purpose → nhiều mục đích. 'Mr. Moran's' (🟩) = người viết → tìm email ký tên Peter Moran.",
    strategy: { options: ["S3", "S1", "S2", "S7"], correct: "S3", why: "Email làm 3 việc: xác nhận lịch hẹn, nêu chính sách, nói không đảm bảo ngày bán. Câu đầu (xác nhận lịch) không phải đáp án → phải đối chiếu từng phương án." },
    evidence: {
      doc: "Email 2 (văn bản 3)",
      excerpt: "==Our consignment policy stipulates that== once the sale of a bicycle has been finalized, the money owed to the customer must be paid into the person's bank account.",
      note: "'Our policy stipulates' = nêu quy định của công ty → một mục đích: nêu một quy định của công ty (state a company rule).",
    },
  },
  {
    id: "2026-2-192",
    type: "muc-dich",
    prompt: "[[q:Why]] did [[c:Ms. Brown]] [[t:most likely]] [[t:send]] the [[t:letter]]?",
    vi: "Nhiều khả năng bà Brown gửi lá thư vì lý do gì?",
    wrong: [
      { text: "Nhiều khả năng bà Brown nhận được lá thư vì lý do gì?", error: "chu-the", why: "Bà Brown là người gửi (ký tên Verna Brown)." },
      { text: "Nhiều khả năng bà Brown sẽ gửi thư vì sao?", error: "thi-bi-dong", why: "did = quá khứ: thư đã gửi." },
    ],
    kwNote: "most likely → đáp án SUY RA, không có nguyên văn. Kết hợp với 'Why did … send' → Mục đích suy luận.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Câu đầu 'Thank you for allowing me to speak with you…' + 'As I explained during our meeting' → thư viết sau một buổi gặp giới thiệu sản phẩm." },
    evidence: {
      doc: "Lá thư (văn bản 2)",
      excerpt: "==Thank you for allowing me to speak with you and your team== about Green Globe All-Natural Toothpaste. ==As I explained during our meeting==…",
      note: "Thư không viết 'follow up' nhưng cảm ơn buổi gặp và nhắc lại nội dung đã trình bày → mục đích: tiếp nối một buổi giới thiệu bán hàng (follow up on a sales presentation).",
    },
  },
  {
    id: "2026-3-153",
    type: "muc-dich",
    prompt: "[[q:What]] are the [[c?:writers]] [[t:mainly discussing]]?",
    vi: "Những người nhắn tin chủ yếu đang bàn về việc gì?",
    wrong: [
      { text: "Các nhà văn chủ yếu thảo luận về điều gì?", error: "da-nghia", why: "writers ở đây = những người viết tin nhắn, không phải nhà văn." },
      { text: "Những người nhắn tin đã bàn xong chuyện gì?", error: "thi-bi-dong", why: "are discussing = đang bàn (tiếp diễn), không phải đã bàn xong." },
    ],
    kwNote: "mainly discussing → hỏi chủ đề chính = dạng Mục đích. 'writers' chỉ người nhắn tin chung chung (đánh dấu hay không đều được).",
    strategy: { options: ["S1", "S2", "S4", "S3"], correct: "S1", why: "Chuỗi tin nhắn: chủ đề nằm ở 2–3 tin đầu. Không phải S4 vì câu hỏi không trích dẫn câu nào." },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "I think I've found something for us at 10 Maple Street… it's ideal for retailers needing ==storage space==, and it offers ==temporary rental terms==.",
      note: "Hai người bàn chỗ kho thuê ngắn hạn → chủ đề: thuê một không gian tạm thời (renting a temporary space).",
    },
  },
  {
    id: "2026-9-165",
    type: "muc-dich",
    prompt: "[[q:What]] is the [[t:main purpose]] of the [[t:text-message chain]]?",
    vi: "Mục đích chính của chuỗi tin nhắn là gì?",
    wrong: [
      { text: "Mục đích chính của chuỗi cửa hàng nhắn tin là gì?", error: "da-nghia", why: "chain: chuỗi (tin nhắn) / chuỗi cửa hàng. text-message chain = chuỗi tin nhắn." },
      { text: "Người nhận tin nhắn chủ yếu muốn gì?", error: "chu-the", why: "Hỏi mục đích của cả chuỗi tin nhắn, không phải mong muốn của người nhận." },
    ],
    kwNote: "main purpose → Mục đích; 'text-message chain' là tên văn bản → 🟨.",
    strategy: { options: ["S1", "S4", "S2", "S3"], correct: "S1", why: "Tin đầu tiên nói Ji-Min đang ở cầu Crosley. Đoạn sau chuyển sang hẹn ăn trưa: đó là chi tiết phụ, đừng để bị kéo theo." },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "Karl, ==I am on-site at the Crosley Bridge now==… It definitely ==needs routine maintenance==, and we may have to plan some additional work.",
      note: "Ji-Min báo tình trạng cầu Crosley từ hiện trường → mục đích: cập nhật thông tin về một cây cầu (provide an update about a bridge).",
    },
  },
  {
    id: "2026-6-181",
    type: "muc-dich",
    prompt: "[[q:Why]] did [[c:Ms. Rosen]] [[t:send]] an [[t:e-mail]] to [[c:Mr. Iqbal]]?",
    vi: "Tại sao bà Rosen gửi email cho ông Iqbal?",
    wrong: [
      { text: "Tại sao ông Iqbal gửi email cho bà Rosen?", error: "chu-the", why: "Rosen send … to Iqbal: Rosen gửi, Iqbal nhận." },
      { text: "Tại sao bà Rosen được ông Iqbal gửi email?", error: "thi-bi-dong", why: "did … send là chủ động: bà Rosen là người gửi. Đổi sang bị động là đảo vai." },
    ],
    kwNote: "Why did … send → Mục đích. Bộ 2 email → tên người gửi / nhận (🟩) chọn đúng email 1.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Câu 1 chỉ nhắc bối cảnh ('As you know…'); câu 2 là lời đề nghị chính. Đọc đủ 2–3 câu đầu." },
    evidence: {
      doc: "Email 1",
      excerpt: "I was wondering ==if you would be willing to say a few words about Walter during the event==.",
      note: "Hỏi ông có sẵn lòng nói vài lời về Walter không → mục đích: mời ông phát biểu tại sự kiện (ask him to give a speech at an event).",
    },
  },
  {
    id: "2024-4-172",
    type: "muc-dich",
    prompt: "[[q:Why]] did [[c:Mr. Karikas]] [[t:write]] the [[t:post]]?",
    vi: "Tại sao ông Karikas viết bài đăng này?",
    wrong: [
      { text: "Tại sao ông Karikas viết về một vị trí công việc?", error: "da-nghia", why: "post: bài đăng / chức vụ / bưu điện. 'write the post' trên diễn đàn → bài đăng." },
      { text: "Tại sao bài đăng lại viết về ông Karikas?", error: "chu-the", why: "Ông Karikas là người viết bài, không phải đối tượng được viết về." },
    ],
    kwNote: "Why did … write → Mục đích; 'post' là tên văn bản → 🟨.",
    strategy: { options: [...S1_OPTS], correct: "S1", why: "Câu đầu chỉ giới thiệu bản thân (thành viên lâu năm). Đọc tiếp đến câu 'I am looking for…' là ra mục đích." },
    evidence: {
      doc: "Bài đăng trên diễn đàn",
      excerpt: "This is my first post on the Tunisia forum. ==I am looking for recommendations for a janitorial service== on the island of Djerba.",
      note: "Xin giới thiệu dịch vụ vệ sinh → mục đích: nhờ giới thiệu một nhà cung cấp dịch vụ (request referrals to a service provider).",
    },
  },
];
