import type { P7QItem } from "../types";

const S3_WHY = "What is indicated / true about X: thông tin về X có thể nằm rải rác. Scan X để khoanh vùng, rồi đối chiếu từng phương án (S3). Đáp án đúng thường là bản paraphrase, không lặp nguyên văn.";

export const indicatedCoBan: P7QItem[] = [
  {
    id: "2026-1-151",
    type: "indicated",
    prompt: "[[q:What]] is [[t:mentioned]] about [[c:Mr. Norton]]?",
    vi: "Điều gì được nhắc đến về ông Norton?",
    wrong: [
      { text: "Ông Norton nhắc đến điều gì?", error: "thi-bi-dong", why: "is mentioned about Mr. Norton = được nhắc VỀ ông ấy (bị động). Ông Norton không phải người nói." },
      { text: "Điều gì được nhắc đến cho ông Norton?", error: "chu-the", why: "about = về (thông tin về ông Norton), không phải 'nhắc cho ông ấy nghe'." },
    ],
    kwNote: "mentioned → 🟨 dạng Indicated. Đối tượng sau 'about' → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Email",
      excerpt: "==Jasen Norton will transfer to our Kingston headquarters next month.==",
      note: "Chuyển sang trụ sở Kingston → He will be moving to another company location. transfer ↔ moving.",
    },
  },
  {
    id: "2026-10-149",
    type: "indicated",
    prompt: "[[q:What]] is [[t:true]] about [[c:Hampton Landscaping]]?",
    vi: "Điều gì đúng về Hampton Landscaping?",
    wrong: [
      { text: "Sự thật nào Hampton Landscaping muốn che giấu?", error: "da-nghia", why: "What is true about X = điều nào ĐÚNG với X (theo bài), không phải 'sự thật bị che giấu'." },
      { text: "Hampton Landscaping cho rằng điều gì là đúng?", error: "chu-the", why: "Hỏi thông tin đúng VỀ công ty, không hỏi quan điểm của công ty." },
    ],
    kwNote: "true → 🟨 (= indicated). Tên công ty → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Trang web",
      excerpt: "we offer ==large- and small-volume deliveries== Monday through Saturday. Delivery rates vary based on volume, product, and location.",
      note: "Giao cả đơn lớn và nhỏ → It delivers orders of varying sizes. Bẫy: 'Monday through Saturday' loại phương án 7 ngày/tuần; 'rates vary' loại phương án phí cố định.",
    },
  },
  {
    id: "2026-2-148",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about [[c:Mr. Furuta]]?",
    vi: "Điều gì được nêu về ông Furuta?",
    wrong: [
      { text: "Ông Furuta chỉ ra điều gì?", error: "thi-bi-dong", why: "is indicated about = được nêu VỀ ông ấy, không phải ông ấy chỉ ra." },
      { text: "Điều gì được chỉ đường cho ông Furuta?", error: "da-nghia", why: "indicate = cho biết / nêu, không phải chỉ đường." },
    ],
    kwNote: "indicated → 🟨. Tên người → 🟩: tên có thể chỉ xuất hiện trong mẫu đơn ở cuối bài.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "Tên Furuta nằm ở mẫu đơn cuối bài; câu mở đầu ('Congratulations on your purchase…') nói với chính người điền đơn → phải ghép 2 chỗ trong cùng văn bản rồi đối chiếu phương án." },
    evidence: {
      doc: "Thông tin + mẫu đơn",
      excerpt: "==Congratulations on your purchase of a Gregerson Pro Phone 13.== … Name: ==Terrence Furuta==",
      note: "Người điền đơn là ông Furuta → ông vừa mua điện thoại Gregerson Pro Phone 13.",
    },
  },
  {
    id: "2026-3-148",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about the [[c:coupon]]?",
    vi: "Điều gì được nêu về phiếu giảm giá?",
    wrong: [
      { text: "Phiếu giảm giá chỉ ra điều gì?", error: "thi-bi-dong", why: "is indicated about the coupon = thông tin được nêu VỀ phiếu. Phiếu không 'chỉ ra'." },
      { text: "Điều gì được nêu về phiếu bầu?", error: "da-nghia", why: "coupon = phiếu giảm giá / phiếu ưu đãi." },
    ],
    kwNote: "indicated → 🟨. coupon → 🟩: các điều kiện dùng phiếu thường in nhỏ ở cuối quảng cáo.",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: "Điều kiện của phiếu nằm trong 2–3 câu cuối: đối chiếu từng phương án (chi nhánh nào, hạn dùng, số lần dùng)." },
    evidence: {
      doc: "Quảng cáo",
      excerpt: "This offer is valid only at our Smithville and Parkertown locations ==through August 31==… Limit one coupon per customer.",
      note: "Hạn đến 31/8 → It must be used before the end of August. 'only at… locations' loại 'all locations'; 'Limit one' loại 'multiple times'.",
    },
  },
  {
    id: "2026-4-152",
    type: "indicated",
    prompt: "[[q:What]] is [[t:mentioned]] about [[c:Stub Master tickets]]?",
    vi: "Điều gì được nhắc đến về vé Stub Master?",
    wrong: [
      { text: "Vé Stub Master nhắc đến điều gì?", error: "thi-bi-dong", why: "is mentioned about = được nhắc VỀ vé (bị động)." },
      { text: "Điều gì được nhắc đến về những người bán vé Stub Master?", error: "chu-the", why: "Hỏi về VÉ (tickets), không hỏi về người bán." },
    ],
    kwNote: "mentioned → 🟨. Stub Master tickets → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Biên lai",
      excerpt: "Your ==mobile ticket is ready and available in the Stub Master account you created online==… so that it can be ==scanned electronically==",
      note: "Vé nằm trong tài khoản trực tuyến, quét bằng điện thoại → They are saved electronically.",
    },
  },
  {
    id: "2026-6-147",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about [[c:Bumbleberry Farm]]?",
    vi: "Điều gì được nêu về trang trại Bumbleberry?",
    wrong: [
      { text: "Trang trại Bumbleberry chỉ ra điều gì?", error: "thi-bi-dong", why: "is indicated about = được nêu VỀ trang trại." },
      { text: "Điều gì được nêu về các loại quả mọng?", error: "chu-the", why: "Đối tượng là trang trại Bumbleberry (tên riêng), không phải quả mọng nói chung." },
    ],
    kwNote: "indicated → 🟨. Tên trang trại → 🟩, nhưng cả bài đều nói về trang trại nên phải đối chiếu phương án.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Quảng cáo",
      excerpt: "==We cater to families==, but everyone is welcome!",
      note: "Phục vụ các gia đình → It is family-friendly. 'Tuesday through Sunday' loại 'seven days a week'.",
    },
  },
  {
    id: "2026-7-147",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about [[c:boxes of Truli crackers]]?",
    vi: "Điều gì được nêu về các hộp bánh quy giòn Truli?",
    wrong: [
      { text: "Điều gì được nêu về các tay đấm bốc Truli?", error: "da-nghia", why: "boxes ở đây là danh từ = hộp; crackers = bánh quy giòn." },
      { text: "Các hộp bánh quy Truli cho thấy điều gì về khách hàng?", error: "chu-the", why: "Hỏi thông tin VỀ hộp bánh, không phải về khách hàng." },
    ],
    kwNote: "indicated → 🟨. 'boxes of Truli crackers' → 🟩. Cụm danh từ: danh từ chính là boxes (hộp).",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: "Phiếu ngắn, chi tiết nằm trong ngoặc đơn: đối chiếu từng phương án với từng chữ." },
    evidence: {
      doc: "Phiếu giảm giá",
      excerpt: "Save $2.00 on the purchase of ONE box of Truli crackers ==(any size)==",
      note: "'any size' → They come in various sizes.",
    },
  },
  {
    id: "2026-8-162",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about [[c:carry-on items]]?",
    vi: "Điều gì được nêu về hành lý xách tay?",
    wrong: [
      { text: "Điều gì được nêu về các món đồ được mang tiếp sang chuyến sau?", error: "da-nghia", why: "carry-on (tính từ) = hành lý xách tay lên máy bay; không phải 'carry on' = tiếp tục." },
      { text: "Hành lý xách tay cho thấy điều gì về hành khách?", error: "chu-the", why: "Hỏi về quy định với hành lý, không hỏi về hành khách." },
    ],
    kwNote: "indicated → 🟨. carry-on items → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Quy định",
      excerpt: "carry-on items ==must not exceed 56 x 36 x 23 centimetres==, including handles, straps, and wheels.",
      note: "Có kích thước tối đa → They have a maximum allowable size. 'including… wheels' cho thấy được phép có bánh xe → loại 'cannot have wheels'.",
    },
  },
  {
    id: "2026-9-154",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about [[c:Bellerson Financial]]?",
    vi: "Điều gì được nêu về công ty Bellerson Financial?",
    wrong: [
      { text: "Bellerson Financial chỉ ra điều gì?", error: "thi-bi-dong", why: "is indicated about = được nêu VỀ công ty." },
      { text: "Điều gì được nêu về tình hình tài chính của Bellerson?", error: "da-nghia", why: "Financial ở đây là một phần TÊN công ty, không phải 'tài chính của công ty'." },
    ],
    kwNote: "indicated → 🟨. Tên công ty → 🟩: hãy coi cả cụm là một tên riêng.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "deliver service of the highest quality, ==a policy for which Bellerson Financial is highly regarded by its customers==.",
      note: "Được khách đánh giá cao nhờ dịch vụ → It has built a reputation among customers for its excellent service.",
    },
  },
  {
    id: "2026-7-159",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about the [[c:Swansea Spotlight Bistro]]?",
    vi: "Điều gì được nêu về nhà hàng Swansea Spotlight Bistro?",
    wrong: [
      { text: "Nhà hàng Swansea Spotlight Bistro chỉ ra điều gì?", error: "thi-bi-dong", why: "is indicated about = được nêu VỀ nhà hàng." },
      { text: "Điều gì được nêu về ánh đèn sân khấu ở Swansea?", error: "da-nghia", why: "Spotlight ở đây là một phần tên riêng (Swansea Spotlight Theatre / Bistro), không phải đèn sân khấu." },
    ],
    kwNote: "indicated → 🟨. Tên nhà hàng → 🟩 (scan chữ 'Bistro').",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: S3_WHY },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "the Swansea Spotlight Bistro, a new restaurant with a large seating area that ==replaces our previous concession stand==. The bistro… will be open to the public even when no performances are scheduled.",
      note: "Thay quầy bán đồ ăn cũ → It replaces a concession stand. 'open… even when no performances' loại 'only during performances'.",
    },
  },
];

export const indicatedNangCao: P7QItem[] = [
  {
    id: "2026-2-154",
    type: "indicated",
    prompt: "[[q:What]] does the [[t:e-mail]] [[t:indicate]] about [[c:Ms. Watkins]]?",
    vi: "Email cho biết điều gì về bà Watkins?",
    wrong: [
      { text: "Bà Watkins chỉ ra điều gì trong email?", error: "chu-the", why: "Chủ ngữ là the e-mail: EMAIL cho biết thông tin về bà Watkins." },
      { text: "Email chỉ đường cho bà Watkins đến đâu?", error: "da-nghia", why: "indicate = cho biết / nêu." },
    ],
    kwNote: "'What does the [văn bản] indicate about X' = biến thể của 'What is indicated about X'. Bẫy: bà Watkins chính là người viết email (dòng From) → thông tin về bà nằm ở cả dòng From lẫn chữ 'I'.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "Tên Watkins chỉ có ở dòng From và chữ ký; thông tin về bà nằm trong các câu có 'I'. Đối chiếu từng phương án với những câu đó." },
    evidence: {
      doc: "Email (From: Connie Watkins)",
      excerpt: "…was requested in ==an e-mail I sent on May 1==.",
      note: "'I' = bà Watkins → She sent an e-mail to employees on May 1.",
    },
  },
  {
    id: "2026-1-168",
    type: "indicated",
    prompt: "[[q:What]] does the [[t:article]] [[t:mention]] about [[c:Marco's Italian Restaurant]]?",
    vi: "Bài báo nhắc đến điều gì về nhà hàng Ý của Marco?",
    wrong: [
      { text: "Nhà hàng Ý của Marco nhắc đến điều gì trong bài báo?", error: "chu-the", why: "Chủ ngữ là the article: BÀI BÁO nhắc đến." },
      { text: "Bài báo nhắc đến điều gì về chợ Ý của Marco?", error: "chu-the", why: "Bài có cả Marco's Italian Market. Câu hỏi về RESTAURANT: đọc sai tên là chọn sai đối tượng." },
    ],
    kwNote: "Bài có 2 tên gần giống nhau (Restaurant / Market) → phải tô đủ cả tên riêng.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "Scan đúng 'Restaurant' (không phải Market), đọc các câu về nhà hàng rồi đối chiếu phương án." },
    evidence: {
      doc: "Bài báo",
      excerpt: "a water leak caused extensive damage to the kitchen. ==A significant amount of work needed to be done in the kitchen and dining areas.==",
      note: "Phải sửa chữa nhiều → It needed major renovations.",
    },
  },
  {
    id: "2026-4-153",
    type: "indicated",
    prompt: "[[q:What]] is [[t:true]] about the [[c:event]] [[c:Mr. Sato]] will [[c:attend]]?",
    vi: "Điều gì đúng về sự kiện mà ông Sato sẽ tham dự?",
    wrong: [
      { text: "Ông Sato cho rằng điều gì đúng về sự kiện?", error: "chu-the", why: "Hỏi thông tin đúng VỀ sự kiện; 'Mr. Sato will attend' chỉ là mệnh đề bổ nghĩa cho event." },
      { text: "Điều gì đúng về sự kiện mà ông Sato đã tham dự?", error: "thi-bi-dong", why: "will attend = sẽ tham dự (sự kiện chưa diễn ra)." },
    ],
    kwNote: "Mệnh đề quan hệ rút gọn: 'the event (that) Mr. Sato will attend' → danh từ chính là event (🟩).",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "Biên lai có nhiều dòng thông tin (ngày, chỗ ngồi, loại sự kiện): đối chiếu từng phương án." },
    evidence: {
      doc: "Biên lai",
      excerpt: "Order: 1 ticket; bleachers—uncovered; ==regular season baseball==",
      note: "Trận bóng chày → It is a baseball game. 'uncovered' (không mái che) loại 'indoors'.",
    },
  },
  {
    id: "2026-6-177",
    type: "indicated",
    prompt: "[[t?:In]] the [[t:first e-mail]], [[q:what]] is [[t:indicated]] about the [[c:magazine's special issue]]?",
    vi: "Trong email thứ nhất, điều gì được nêu về số đặc biệt của tạp chí?",
    wrong: [
      { text: "Trong email thứ nhất, điều gì được nêu về vấn đề đặc biệt của tạp chí?", error: "da-nghia", why: "issue: vấn đề / số (báo, tạp chí). magazine's special issue = số đặc biệt của tạp chí." },
      { text: "Trong email thứ nhất, tạp chí nêu điều gì về số đặc biệt?", error: "chu-the", why: "Thông tin được nêu TRONG EMAIL, không phải tạp chí tự nêu." },
    ],
    kwNote: "'In the first e-mail' → 🟨 khoanh vùng, bỏ qua email 2. magazine's special issue → 🟩.",
    strategy: { options: ["S3", "S7", "S2", "S1"], correct: "S3", why: "Đã có phạm vi (first e-mail) → không ghép văn bản. Đối chiếu từng phương án với email 1." },
    evidence: {
      doc: "Email 1",
      excerpt: "we reduced the page total by condensing the text of ==our interview with animation artist Bret Lusk==.",
      note: "Có bài phỏng vấn họa sĩ hoạt hình → It will include an interview with an animator.",
    },
  },
  {
    id: "2026-6-178",
    type: "indicated",
    prompt: "[[t?:In]] the [[t:second e-mail]], [[q:what]] is [[t:mentioned]] about [[c:Sklarr Press]]?",
    vi: "Trong email thứ hai, điều gì được nhắc đến về Sklarr Press?",
    wrong: [
      { text: "Trong email thứ hai, Sklarr Press nhắc đến điều gì?", error: "thi-bi-dong", why: "is mentioned about = được nhắc VỀ Sklarr Press." },
      { text: "Trong email thứ hai, điều gì được nhắc đến về báo chí của Sklarr?", error: "da-nghia", why: "Press ở đây là tên nhà in (Sklarr Press), không phải 'báo chí'." },
    ],
    kwNote: "'In the second e-mail' → 🟨 phạm vi. Sklarr Press → 🟩 tên riêng.",
    strategy: { options: ["S3", "S7", "S2", "S1"], correct: "S3", why: "Có phạm vi (second e-mail). Scan 'Sklarr' rồi đối chiếu phương án; chú ý cụm 'just as we did last year'." },
    evidence: {
      doc: "Email 2",
      excerpt: "I'm happy with the plan to use Sklarr Press to print our magazine's special issue, ==just as we did last year==.",
      note: "Năm ngoái đã in ở đây → It has printed issues of Best Design Insights in the past.",
    },
  },
  {
    id: "2026-8-169",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about the [[c:payment]] [[c:Mr. Kolman]] will [[c:receive]]?",
    vi: "Điều gì được nêu về khoản tiền mà ông Kolman sẽ nhận?",
    wrong: [
      { text: "Điều gì được nêu về khoản tiền ông Kolman sẽ trả?", error: "chu-the", why: "receive = NHẬN: ông Kolman là người được trả tiền." },
      { text: "Điều gì được nêu về khoản tiền ông Kolman đã nhận?", error: "thi-bi-dong", why: "will receive = sẽ nhận (chưa nhận)." },
    ],
    kwNote: "Danh từ chính là payment, mệnh đề 'Mr. Kolman will receive' bổ nghĩa → 🟩. Bài có thể viết 'reimburse / fee'.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "Hợp đồng có nhiều điều khoản về tiền (phí, hoàn tiền, thời điểm trả): đối chiếu từng phương án." },
    evidence: {
      doc: "Hợp đồng",
      excerpt: "Grotel Corporation will ==reimburse the Event Speaker for lodging and transportation up to $500==, provided that original receipts are submitted.",
      note: "Hoàn tiền đi lại → It may include transportation costs. 'may' vì có điều kiện (nộp hoá đơn).",
    },
  },
  {
    id: "2026-6-155",
    type: "indicated",
    prompt: "[[q:What]] does the [[t:letter]] [[t:indicate]] about the [[c:laundry room]] at [[c:Cottonwood Apartments]]?",
    vi: "Lá thư cho biết điều gì về phòng giặt ở khu căn hộ Cottonwood?",
    wrong: [
      { text: "Phòng giặt ở khu căn hộ Cottonwood cho biết điều gì trong thư?", error: "chu-the", why: "Chủ ngữ là the letter: LÁ THƯ cho biết." },
      { text: "Lá thư cho biết điều gì về phòng giặt đồ ở cửa hàng giặt là Cottonwood?", error: "da-nghia", why: "Apartments = khu căn hộ, không phải cửa hàng." },
    ],
    kwNote: "What does the letter indicate about X → Indicated. laundry room → 🟩.",
    strategy: { options: ["S3", "S2", "S1", "S7"], correct: "S3", why: "Scan 'laundry' → câu nói về phòng giặt không nêu thẳng số máy mà nói 'plenty of machines' → so với phương án." },
    evidence: {
      doc: "Lá thư",
      excerpt: "I have never had to wait long to use a washer or dryer in the laundry room since ==there are plenty of machines available==.",
      note: "Có nhiều máy → It has several washers and dryers.",
    },
  },
  {
    id: "2026-1-199",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] [[t?:in]] the [[t:notice]] about [[c:Ms. Boyd]]?",
    vi: "Thông báo nêu điều gì về cô Boyd?",
    wrong: [
      { text: "Cô Boyd nêu điều gì trong thông báo?", error: "thi-bi-dong", why: "is indicated in the notice about Ms. Boyd = thông báo nêu VỀ cô ấy." },
      { text: "Điều gì được nêu về thông báo của cô Boyd?", error: "chu-the", why: "Cô Boyd là đối tượng được nói đến, không phải tác giả thông báo." },
    ],
    kwNote: "'in the notice' → 🟨 phạm vi (bộ 3 văn bản). Ms. Boyd → 🟩. Trong thông báo cô được gọi bằng tên 'Erica'.",
    strategy: { options: ["S3", "S7", "S2", "S1"], correct: "S3", why: "Có phạm vi (notice) → chỉ đọc thông báo; scan 'Erica / Boyd' rồi đối chiếu từng phương án." },
    evidence: {
      doc: "Thông báo (văn bản 3)",
      excerpt: "She has also been ==instrumental in encouraging satisfied customers to post comments==… We received more great reviews in the past month than we did in the four previous months combined!",
      note: "Cô góp phần lớn khiến khách để lại nhiều đánh giá → She is responsible for an increase in customer feedback.",
    },
  },
  {
    id: "2026-10-176",
    type: "indicated",
    prompt: "[[q:What]] does the [[t:table]] [[t:indicate]] about [[c:customers' satisfaction]] with their [[c:overall experience]]?",
    vi: "Bảng cho biết điều gì về mức độ hài lòng của khách hàng với trải nghiệm tổng thể?",
    wrong: [
      { text: "Khách hàng cho biết điều gì về bảng trải nghiệm tổng thể?", error: "chu-the", why: "Chủ ngữ là the table: BẢNG cho biết." },
      { text: "Bảng cho biết điều gì về sự hài lòng của khách hàng với kinh nghiệm làm việc tổng thể?", error: "da-nghia", why: "experience: kinh nghiệm / trải nghiệm. Với khách hàng → trải nghiệm (dịch vụ)." },
    ],
    kwNote: "'the table' → 🟨 phạm vi. 'overall experience' là tên một dòng trong bảng → 🟩 rất cụ thể.",
    strategy: { options: ["S2", "S3", "S7", "S1"], correct: "S2", why: "🟩 trùng tên một dòng trong bảng → scan đúng dòng 'Overall experience', đọc các cột (%, thay đổi)." },
    evidence: {
      doc: "Bảng (văn bản 1)",
      excerpt: "Overall experience | 87% | ==+7%==",
      note: "Tăng 7% so với tháng trước → It is better than it was the previous month.",
    },
  },
  {
    id: "2026-6-163",
    type: "indicated",
    prompt: "[[q:What]] is [[t:indicated]] about the [[c:small-batch production]] of [[c:games]]?",
    vi: "Điều gì được nêu về việc sản xuất trò chơi theo lô nhỏ?",
    wrong: [
      { text: "Điều gì được nêu về việc sản xuất các trò chơi nhỏ?", error: "da-nghia", why: "small-batch = theo LÔ nhỏ (số lượng ít); không phải trò chơi kích thước nhỏ." },
      { text: "Các trò chơi lô nhỏ cho biết điều gì về nhà sản xuất?", error: "chu-the", why: "Hỏi thông tin về CÁCH sản xuất lô nhỏ, không hỏi về nhà sản xuất." },
    ],
    kwNote: "Cụm danh từ ghép 'small-batch production' → 🟩. Danh từ chính là production (việc sản xuất).",
    strategy: { options: ["S3", "S2", "S1", "S5"], correct: "S3", why: "Scan 'small batch(es)' rồi đối chiếu phương án; bài có cả mass production để so sánh → dễ nhầm." },
    evidence: {
      doc: "Bài blog",
      excerpt: "Small batches are ideal for limited-edition games and ==new versions of existing games==.",
      note: "Hợp để làm phiên bản mới của game có sẵn → It is useful in making multiple versions of a game.",
    },
  },
];
