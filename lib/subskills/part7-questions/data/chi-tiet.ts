import type { P7QItem } from "../types";

const S2_WHY = "Có từ nội dung cụ thể (🟩) → scan đúng chỗ đó trong bài, đọc kỹ 1–2 câu quanh nó. Không cần đọc cả bài hay đối chiếu cả 4 phương án.";

export const chiTietCoBan: P7QItem[] = [
  {
    id: "2026-1-152",
    type: "chi-tiet",
    prompt: "[[q:What]] does [[c:Ms. Correa]] [[t:ask]] [[c:members of the sales team]] [[t:to do]]?",
    vi: "Bà Correa yêu cầu các thành viên nhóm bán hàng làm gì?",
    wrong: [
      { text: "Các thành viên nhóm bán hàng yêu cầu bà Correa làm gì?", error: "chu-the", why: "X ask Y to do: X (Correa) yêu cầu, Y (nhóm bán hàng) là người phải làm." },
      { text: "Bà Correa hỏi các thành viên nhóm bán hàng đã làm gì?", error: "da-nghia", why: "ask sb to do = yêu cầu / nhờ ai làm, không phải 'hỏi'. Câu hỏi cũng không ở quá khứ." },
    ],
    kwNote: "'ask … to do' là cấu trúc báo dạng Chi tiết (yêu cầu) → 🟨. Người yêu cầu và người được yêu cầu → 🟩.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Yêu cầu trong email thường nằm ở câu có Please / Let me know, gần cuối thư. Scan những cụm đó." },
    evidence: {
      doc: "Email",
      excerpt: "==Let me know by 12 October whether you will be able to attend.==",
      note: "Báo trước 12/10 có đi dự được không → yêu cầu: cho bà biết kế hoạch tham dự sự kiện (inform her of plans to attend an event).",
    },
  },
  {
    id: "2026-1-159",
    type: "chi-tiet",
    prompt: "[[q:What]] will [[c:happen]] on [[c:April 2]]?",
    vi: "Điều gì sẽ diễn ra vào ngày 2 tháng 4?",
    wrong: [
      { text: "Điều gì đã xảy ra vào ngày 2 tháng 4?", error: "thi-bi-dong", why: "will happen = SẼ diễn ra (tương lai)." },
      { text: "Điều gì sẽ diễn ra trong tháng 4 năm thứ 2?", error: "da-nghia", why: "April 2 = ngày 2 tháng 4, không phải tháng 4 của năm thứ hai." },
    ],
    kwNote: "Ngày tháng là 🟩 dễ scan nhất: mắt chỉ cần tìm '2 April / April 2'.",
    strategy: { options: ["S2", "S1", "S3", "S4"], correct: "S2", why: S2_WHY },
    evidence: {
      doc: "Email",
      excerpt: "our new graphic design software program ==will be released on 2 April==.",
      note: "Phần mềm mới phát hành ngày 2/4 → một sản phẩm sẽ ra mắt (a product will be launched). released ↔ launched.",
    },
  },
  {
    id: "2026-1-160",
    type: "chi-tiet",
    prompt: "[[q:How]] can [[c:people]] [[c:subscribe]] to a [[c:newsletter]]?",
    vi: "Mọi người có thể đăng ký nhận bản tin bằng cách nào?",
    wrong: [
      { text: "Mọi người có thể viết bản tin bằng cách nào?", error: "da-nghia", why: "subscribe to = đăng ký nhận (định kỳ), không phải viết." },
      { text: "Bản tin được gửi cho mọi người bằng cách nào?", error: "chu-the", why: "Chủ ngữ là people: hỏi người dùng làm thế nào để đăng ký, không hỏi công ty gửi ra sao." },
    ],
    kwNote: "How → hỏi cách thức. subscribe + newsletter → 🟩 (bài có thể viết 'sign up to receive').",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan 'newsletter' → đọc câu chứa nó. Chú ý paraphrase: subscribe = sign up." },
    evidence: {
      doc: "Email",
      excerpt: "visit… www.hamerkoptech.co.nz. There, ==you may also sign up to receive our weekly newsletter== by following the instructions on the home page.",
      note: "Đăng ký trên trang web → by visiting Hamerkoptech's Web site.",
    },
  },
  {
    id: "2026-1-174",
    type: "chi-tiet",
    prompt: "[[q:What]] does [[c:Ms. Choi]] [[t:offer to do]]?",
    vi: "Bà Choi đề nghị (sẵn sàng) làm gì?",
    wrong: [
      { text: "Bà Choi được đề nghị làm gì?", error: "thi-bi-dong", why: "does Ms. Choi offer = chủ động: chính bà Choi đề nghị giúp, không phải được người khác đề nghị." },
      { text: "Bà Choi giảm giá cho việc gì?", error: "da-nghia", why: "offer: đề nghị / ưu đãi. offer to do sth = ngỏ ý làm gì." },
    ],
    kwNote: "'offer to do' = ngỏ ý làm giúp → 🟨 (dạng Chi tiết: đề nghị). Tên người nói → 🟩.",
    strategy: { options: ["S2", "S4", "S1", "S3"], correct: "S2", why: "Scan tin nhắn của bà Choi, tìm câu dạng 'We can… / I'll… / Let me…'. Không có câu trích dẫn nên không phải S4." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "That's not necessary, Mr. Kubelski. ==We can update your current request form for you.==",
      note: "Bà Choi ngỏ ý cập nhật đơn yêu cầu → make a change to a form.",
    },
  },
  {
    id: "2026-4-158",
    type: "chi-tiet",
    prompt: "[[q:What problem]] does [[c:Ms. Gao]] [[c:have]]?",
    vi: "Bà Gao gặp vấn đề gì?",
    wrong: [
      { text: "Bà Gao gây ra vấn đề gì?", error: "chu-the", why: "have a problem = GẶP vấn đề (bà là người chịu), không phải gây ra." },
      { text: "Bà Gao đã giải quyết vấn đề gì?", error: "thi-bi-dong", why: "does … have = hiện tại, đang gặp; không nói đã giải quyết." },
    ],
    kwNote: "'What problem' cả cụm → 🟦. Tên người → 🟩. Vấn đề thường đi với but / unfortunately.",
    strategy: { options: ["S2", "S1", "S4", "S3"], correct: "S2", why: "Scan tin nhắn của bà Gao, tìm câu có 'but'." },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "I'm working from home today and have a call… ==But the notes I need for the call are on my desk.==",
      note: "Ghi chú cần dùng lại để trên bàn ở văn phòng → She left important information in her office.",
    },
  },
  {
    id: "2026-4-167",
    type: "chi-tiet",
    prompt: "[[q:How much]] is the [[c:TBC Gold Plan]]?",
    vi: "Gói TBC Gold giá bao nhiêu?",
    wrong: [
      { text: "Gói TBC Gold có bao nhiêu kênh?", error: "da-nghia", why: "How much is + gói dịch vụ = hỏi GIÁ, không hỏi số lượng nội dung." },
      { text: "Gói TBC Gold đã từng có giá bao nhiêu?", error: "thi-bi-dong", why: "is = hiện tại." },
    ],
    kwNote: "How much → 🟦 hỏi giá. Tên gói → 🟩. Cẩn thận: bài có nhiều gói (Silver, Gold, Platinum).",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Scan đúng chữ 'Gold' trong bảng giá, đừng đọc nhầm sang dòng của gói bên cạnh." },
    evidence: {
      doc: "Thông tin",
      excerpt: "TBC Gold Plan: ==$19/month== or $99/year",
      note: "$19 mỗi tháng → đáp án. Bẫy: các gói khác cũng có giá, chỉ lấy dòng Gold.",
    },
  },
  {
    id: "2026-9-155",
    type: "chi-tiet",
    prompt: "[[q:What]] is the [[c:deadline]] for [[c:requesting vacation time]]?",
    vi: "Hạn chót để xin nghỉ phép là khi nào?",
    wrong: [
      { text: "Kỳ nghỉ kết thúc vào ngày nào?", error: "da-nghia", why: "deadline for requesting = hạn nộp đơn xin nghỉ, không phải ngày kỳ nghỉ kết thúc." },
      { text: "Hạn chót để duyệt đơn nghỉ phép là khi nào?", error: "chu-the", why: "requesting = (nhân viên) xin nghỉ, không phải (quản lý) duyệt." },
    ],
    kwNote: "deadline + requesting vacation → 🟩. Bài sẽ có 'submit your request by…'.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan 'request' / 'by + ngày'. Bẫy: bài có nhiều ngày (June 1, August 31) là khoảng thời gian nghỉ, không phải hạn nộp." },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "if you are planning to take a vacation between June 1 and August 31, kindly ==submit your request by Friday, April 28==.",
      note: "Hạn nộp đơn: 28/4. June 1 – August 31 là thời gian nghỉ.",
    },
  },
  {
    id: "2026-9-166",
    type: "chi-tiet",
    prompt: "[[q:Where]] is [[c:Ms. Jeon]] at the [[c:time]] of the [[t:text-message chain]]?",
    vi: "Lúc nhắn tin, bà Jeon đang ở đâu?",
    wrong: [
      { text: "Bà Jeon sẽ đến đâu sau khi nhắn tin?", error: "thi-bi-dong", why: "is … at the time of = đang ở đâu ngay lúc nhắn tin, không phải nơi sẽ đến." },
      { text: "Chuỗi tin nhắn được gửi từ đâu đến bà Jeon?", error: "chu-the", why: "Hỏi vị trí của bà Jeon, không hỏi tin nhắn gửi từ đâu." },
    ],
    kwNote: "Where → 🟦. at the time of = ngay lúc đó → 🟩 thời điểm. Tên văn bản → 🟨.",
    strategy: { options: ["S2", "S1", "S4", "S3"], correct: "S2", why: "Scan tin nhắn của bà Jeon, tìm 'I am at / on-site / now'. Bẫy: về sau có hẹn ăn trưa ở nơi khác (tương lai)." },
    evidence: {
      doc: "Chuỗi tin nhắn",
      excerpt: "Karl, ==I am on-site at the Crosley Bridge now==.",
      note: "Đang ở cầu Crosley → At the Crosley Bridge.",
    },
  },
  {
    id: "2026-2-172",
    type: "chi-tiet",
    prompt: "[[q:Why]] does [[c:Ms. Walter]] [[c:want]] to [[c:have lunch]] with [[c:Mr. Hines]] and [[c:Ms. Au]]?",
    vi: "Tại sao bà Walter muốn ăn trưa với ông Hines và bà Au?",
    wrong: [
      { text: "Tại sao ông Hines và bà Au muốn ăn trưa với bà Walter?", error: "chu-the", why: "Chủ ngữ là Ms. Walter: bà Walter là người muốn." },
      { text: "Tại sao bà Walter đã ăn trưa với ông Hines và bà Au?", error: "thi-bi-dong", why: "does … want = muốn (bữa trưa chưa diễn ra)." },
    ],
    kwNote: "Why + hành động cụ thể (want to have lunch) → Chi tiết (lý do), không phải Mục đích văn bản.",
    strategy: { options: ["S2", "S1", "S4", "S3"], correct: "S2", why: "Scan 'lunch' trong chat → đọc tin nhắn ngay sau đó, nơi bà Walter giải thích lý do." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "I just want to make sure that ==we're on the same page about the new marketing campaign==. ‖ The one for the line of summer shoes? — Yes.",
      note: "Thống nhất về chiến dịch tiếp thị cho dòng giày mùa hè → to discuss a marketing campaign for a product.",
    },
  },
  {
    id: "2026-9-150",
    type: "chi-tiet",
    prompt: "[[q:What]] [[t:must]] [[c:Mr. Hong]] do to [[c:maintain access]] to his [[c:account]]?",
    vi: "Ông Hong phải làm gì để giữ được quyền truy cập tài khoản?",
    wrong: [
      { text: "Ông Hong phải làm gì để bảo trì tài khoản của mình?", error: "da-nghia", why: "maintain: bảo trì / duy trì. maintain access = giữ được quyền truy cập." },
      { text: "Ông Hong đã làm gì để mở tài khoản?", error: "thi-bi-dong", why: "must do = PHẢI làm (bắt buộc, sắp tới), không phải việc đã làm." },
    ],
    kwNote: "must → yêu cầu bắt buộc (🟨 Chi tiết – yêu cầu). maintain access + account → 🟩.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan 'account / access / deactivation' → câu 'To avoid…, simply…' nói việc cần làm." },
    evidence: {
      doc: "Email",
      excerpt: "To avoid account deactivation on 20 July, ==simply sign in to the app before that date==.",
      note: "Đăng nhập trước 20/7 → Sign in before July 20. maintain access ↔ avoid account deactivation.",
    },
  },
];

export const chiTietNangCao: P7QItem[] = [
  {
    id: "2026-1-166",
    type: "chi-tiet",
    prompt: "[[q:What]] is [[t:required]] of [[c:job applicants]]?",
    vi: "Ứng viên được yêu cầu phải có điều gì?",
    wrong: [
      { text: "Ứng viên yêu cầu điều gì?", error: "thi-bi-dong", why: "is required of sb = được đòi hỏi Ở ai (bị động). Ứng viên là người phải đáp ứng, không phải người yêu cầu." },
      { text: "Điều gì cần thiết cho nhà tuyển dụng?", error: "chu-the", why: "of job applicants = đòi hỏi ở ỨNG VIÊN." },
    ],
    kwNote: "'be required of' = đòi hỏi ở ai → 🟨 (Chi tiết: yêu cầu tuyển dụng). job applicants → 🟩.",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Scan mục Requirements / Qualifications của quảng cáo tuyển dụng rồi so với phương án (bài thường paraphrase)." },
    evidence: {
      doc: "Quảng cáo tuyển dụng",
      excerpt: "==Demonstrates a strong ability to work closely with colleagues==",
      note: "work closely with colleagues ↔ skill in working with others.",
    },
  },
  {
    id: "2026-1-173",
    type: "chi-tiet",
    prompt: "[[q:Who]] will [[c:receive]] an [[c:e-mail]] from [[c:Mr. Kubelski]]?",
    vi: "Ai sẽ nhận được email từ ông Kubelski?",
    wrong: [
      { text: "Ông Kubelski sẽ nhận email từ ai?", error: "chu-the", why: "receive … FROM Mr. Kubelski: Kubelski là người gửi." },
      { text: "Ai đã gửi email cho ông Kubelski?", error: "thi-bi-dong", why: "will receive = sẽ nhận (tương lai), và người gửi là Kubelski." },
    ],
    kwNote: "Who + receive … from → để ý chiều gửi – nhận. 'an e-mail' là nội dung trong chat → 🟩 (không phải tên văn bản).",
    strategy: { options: ["S2", "S4", "S1", "S3"], correct: "S2", why: "Scan tin nhắn của Kubelski có 'e-mail' → đọc xem ông định gửi cho ai." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "I want to ==e-mail account holders aged 55 to 65== to invite them to meet with a retirement planning expert.",
      note: "Gửi cho chủ tài khoản 55–65 tuổi → account holders in one age-group.",
    },
  },
  {
    id: "2026-10-150",
    type: "chi-tiet",
    prompt: "[[t?:In]] [[q:what situation]] would a [[c:customer]] be [[c:billed $50]]?",
    vi: "Trong trường hợp nào khách hàng sẽ bị tính phí 50 đô la?",
    wrong: [
      { text: "Trong trường hợp nào khách hàng sẽ tính phí 50 đô la?", error: "thi-bi-dong", why: "be billed = BỊ tính tiền (bị động). Khách hàng là người trả, không phải người thu." },
      { text: "Trong trường hợp nào khách hàng nhận hoá đơn quảng cáo 50 đô la?", error: "da-nghia", why: "bill (động từ) = tính tiền / gửi hoá đơn thanh toán." },
    ],
    kwNote: "'In what situation' = khi nào / điều kiện gì → 🟦. billed $50 → 🟩: con số dễ scan, bài có thể viết 'fee / charge'.",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Scan '$50' → đọc câu đứng TRƯỚC nó: điều kiện thường nằm ở câu trước ('In the event that…')." },
    evidence: {
      doc: "Trang web",
      excerpt: "the requested delivery area ==must be accessible for our trucks==. In the event that this requirement is not met, a $50 restocking fee will be charged.",
      note: "Xe tải không vào được nơi giao → when a delivery driver cannot access a drop-off location. billed ↔ charged.",
    },
  },
  {
    id: "2026-4-166",
    type: "chi-tiet",
    prompt: "[[q:What plan]] is [[c:designed]] for a [[c:subscriber]] who is [[c:only interested in a single team]]?",
    vi: "Gói nào được thiết kế cho người đăng ký chỉ quan tâm đến một đội duy nhất?",
    wrong: [
      { text: "Người đăng ký thiết kế gói nào khi chỉ quan tâm đến một đội?", error: "thi-bi-dong", why: "is designed for = được thiết kế DÀNH CHO (bị động). Người đăng ký không tự thiết kế." },
      { text: "Gói nào được thiết kế cho người đăng ký quan tâm đến một đội độc thân?", error: "da-nghia", why: "single: duy nhất / độc thân. a single team = một đội duy nhất." },
    ],
    kwNote: "'What plan' → 🟦. Mệnh đề 'who is only interested in a single team' chứa điều kiện cần dò → 🟩.",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Scan cụm diễn đạt lại 'one team': 'team of your choice / your favorite team' trong mô tả từng gói." },
    evidence: {
      doc: "Thông tin",
      excerpt: "Silver Plan: ==Most live games played by a team of your choice== / ==Stream games played by your favorite TBC team==",
      note: "Chỉ theo dõi đội mình chọn → The TBC Silver Plan.",
    },
  },
  {
    id: "2026-2-149",
    type: "chi-tiet",
    prompt: "[[q:What]] [[t:prompted]] the [[t:need]] for the [[t:memo]]?",
    vi: "Điều gì dẫn đến việc cần ra bản ghi nhớ này?",
    wrong: [
      { text: "Điều gì được nhắc trong bản ghi nhớ?", error: "da-nghia", why: "prompt (động từ) = khiến cho, dẫn đến; không phải 'nhắc' (prompt như lời nhắc)." },
      { text: "Bản ghi nhớ đã khiến điều gì trở nên cần thiết?", error: "chu-the", why: "Đảo nhân – quả: câu hỏi tìm NGUYÊN NHÂN khiến memo cần thiết, không phải hệ quả của memo." },
    ],
    kwNote: "prompted the need for = nguyên nhân ra đời văn bản → 🟨. Câu không có 🟩 cụ thể.",
    strategy: { options: ["S1", "S2", "S3", "S7"], correct: "S1", why: "Hỏi nguyên nhân viết memo, không có 🟩 để scan → đọc câu đầu như dạng Mục đích (thường có 'As a result of… / Due to…')." },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "As a result of our merger with Frantum Corporation, printed business cards… will be replaced… The new cards will ==feature the new corporate name==",
      note: "Sáp nhập → đổi tên công ty → cần thay danh thiếp → A change in a company's name.",
    },
  },
  {
    id: "2026-3-160",
    type: "chi-tiet",
    prompt: "[[q:Why]] does [[c:Ms. Paulsen]] [[t:mention]] [[c:Pretoria]]?",
    vi: "Tại sao bà Paulsen nhắc đến Pretoria?",
    wrong: [
      { text: "Tại sao bà Paulsen chuyển đến Pretoria?", error: "chu-the", why: "Hỏi lý do bà NHẮC đến địa danh; người chuyển đi là ông Bromley, không phải bà Paulsen." },
      { text: "Tại sao Pretoria được bà Paulsen chọn làm nơi họp?", error: "da-nghia", why: "mention = nhắc đến, không có nghĩa 'chọn'." },
    ],
    kwNote: "Why does X mention Y → hỏi vai trò của Y trong bài → 🟨 mention. Pretoria → 🟩 scan tên riêng.",
    strategy: { options: ["S2", "S1", "S3", "S4"], correct: "S2", why: "Scan 'Pretoria' → đọc cả câu chứa nó: ai làm gì ở đó." },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "Mr. Bromley ==plans to settle permanently in his native Pretoria== in June.",
      note: "Đồng nghiệp sắp chuyển về Pretoria → A colleague is planning to move there.",
    },
  },
  {
    id: "2026-5-158",
    type: "chi-tiet",
    prompt: "[[q:Why]] is the [[c:Zipvid app]] [[c:no longer being used]]?",
    vi: "Tại sao ứng dụng Zipvid không còn được sử dụng nữa?",
    wrong: [
      { text: "Tại sao ứng dụng Zipvid không còn sử dụng được nữa?", error: "thi-bi-dong", why: "no longer being used = không còn ĐƯỢC (công ty) dùng nữa, không nói app hỏng hẳn không dùng được." },
      { text: "Tại sao ứng dụng Zipvid sẽ sớm được dùng lại?", error: "da-nghia", why: "no longer = không còn nữa." },
    ],
    kwNote: "Bị động tiếp diễn 'is being used' + no longer → 🟩 nội dung. Tên app → 🟩.",
    strategy: { options: ["S2", "S1", "S3", "S7"], correct: "S2", why: "Scan 'Zipvid' / 'instead' → bài không nói thẳng lý do mà khen app mới 'less likely to crash' → suy ra app cũ hay treo." },
    evidence: {
      doc: "Bản ghi nhớ",
      excerpt: "We will instead be using Curtain Call, which we trust will prove to be a more reliable program that is ==less likely to crash==.",
      note: "App mới ít bị treo hơn → Zipvid hay bị lỗi → It malfunctioned too frequently.",
    },
  },
  {
    id: "2026-8-175",
    type: "chi-tiet",
    prompt: "[[q:What]] does [[c:Ms. Gammon]] [[t:suggest]] the [[c?:writers]] [[c:do]] with a [[c:video]]?",
    vi: "Bà Gammon đề xuất những người trong nhóm làm gì với video?",
    wrong: [
      { text: "Bà Gammon ngụ ý điều gì về video?", error: "da-nghia", why: "suggest + (sb) do = ĐỀ XUẤT ai làm gì (Chi tiết). 'suggested about' mới là ngụ ý (Suy luận)." },
      { text: "Những người trong nhóm đề xuất bà Gammon làm gì với video?", error: "chu-the", why: "Ms. Gammon suggest the writers do: Gammon đề xuất, nhóm là người làm." },
    ],
    kwNote: "suggest sb do = đề xuất → 🟨 Chi tiết. Phân biệt với 'What is suggested about…' (Suy luận).",
    strategy: { options: ["S2", "S4", "S1", "S3"], correct: "S2", why: "Scan tin nhắn của Gammon, tìm 'Why don't we… / How about…' (cách đề xuất)." },
    evidence: {
      doc: "Cuộc trò chuyện trực tuyến",
      excerpt: "==Why don't we make a few==—so that we can reach different audiences? How about a short one to use as a paid ad and a longer one to post on our Web site?",
      note: "Làm vài bản video khác nhau → Make multiple versions of it.",
    },
  },
  {
    id: "2026-5-169",
    type: "chi-tiet",
    prompt: "[[t?:According]] [[t?:to]] the [[t:job description]], [[q:what]] [[t:should]] the [[c:highway supervisor]] do if a [[c:serious problem]] with a [[c:crew member]] [[c:arises]]?",
    vi: "Theo bản mô tả công việc, người giám sát đường cao tốc nên làm gì nếu nảy sinh vấn đề nghiêm trọng với một thành viên trong đội?",
    wrong: [
      { text: "Theo bản mô tả công việc, thành viên trong đội nên làm gì nếu gặp vấn đề nghiêm trọng với người giám sát?", error: "chu-the", why: "Chủ ngữ là the highway supervisor; vấn đề là VỚI một thành viên trong đội." },
      { text: "Theo bản mô tả công việc, người giám sát nên làm gì nếu một thành viên trong đội đứng dậy?", error: "da-nghia", why: "arise = nảy sinh (vấn đề), không phải 'đứng dậy' (rise)." },
    ],
    kwNote: "Câu dài: tách 2 vế. Vế chính 'what should the supervisor do' (việc cần làm); vế 'if…' là điều kiện cần dò → 🟩.",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Scan từ diễn đạt lại 'serious problem with a crew member' → 'major personnel problems'." },
    evidence: {
      doc: "Bản mô tả công việc",
      excerpt: "The supervisor ==informs the division director of major personnel problems==; the director will recommend an appropriate course of action",
      note: "Báo cho giám đốc bộ phận → Notify the division director of the issue. serious problem with a crew member ↔ major personnel problems.",
    },
  },
  {
    id: "2026-3-171",
    type: "chi-tiet",
    prompt: "[[q:What work]] will be [[c:done]] by [[c:Elbart City employees]]?",
    vi: "Nhân viên thành phố Elbart sẽ làm công việc gì?",
    wrong: [
      { text: "Công việc nào sẽ được giao cho nhân viên thành phố Elbart?", error: "chu-the", why: "be done BY employees = do nhân viên làm. Câu không nói ai giao việc." },
      { text: "Nhân viên thành phố Elbart đã hoàn thành việc gì?", error: "thi-bi-dong", why: "will be done = sẽ được làm (tương lai), không phải đã xong (done ở đây là phân từ bị động)." },
    ],
    kwNote: "Bị động 'be done by X' → X là người làm. Bài không viết 'city employees' mà viết 'parks department crews' → phải nhận ra paraphrase.",
    strategy: { options: ["S2", "S3", "S1", "S7"], correct: "S2", why: "Scan 'crews / department' (nhân viên thành phố) chứ không chỉ chữ 'Elbart'. Bẫy: tình nguyện viên FGS làm việc khác (trồng cây)." },
    evidence: {
      doc: "Bài báo",
      excerpt: "FGS volunteers will do the planting after ==parks department crews have laid fresh topsoil== on the area designated for the garden.",
      note: "Đội của phòng công viên (nhân viên thành phố) rải đất mặt → Preparing the ground for planting. Trồng cây là việc của tình nguyện viên.",
    },
  },
];
