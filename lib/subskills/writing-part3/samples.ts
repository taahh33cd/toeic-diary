// ─────────────────────────────────────
// Sáu cặp bài mẫu mức 3 / mức 5
//
// Mỗi cặp trả lời CÙNG MỘT đề, mỗi dạng đề một cặp. Bài mức 3 được viết cố ý
// gần như KHÔNG có lỗi ngữ pháp — đó chính là bài học: ETS mô tả mức 3 là
// «đúng nhưng hạn hẹp về cấu trúc câu và từ vựng», nên sạch lỗi thôi không đủ.
//
// Cặp bài này còn là nguyên liệu cho Tầng 5 (cụ thể hơn) và Tầng 10 (đa dạng
// hơn): cắt từng cặp câu tương ứng ra là thành một bài `compare`.
//
// Bài mẫu tự viết 100%, không lấy của ETS hay sách luyện thi.
// ─────────────────────────────────────

import type { P3EssayType } from "./index";

export type P3SampleGap = {
  /** Trục trong thang chấm */
  axis: string;
  band3: string;
  band5: string;
};

export type P3SamplePair = {
  id: string;
  label: string;
  essayType: P3EssayType;
  prompt: string;
  /** Bài mức 3, chia theo đoạn */
  band3: string[];
  /** Bài mức 5 cho cùng đề đó */
  band5: string[];
  /** Khoảng cách giữa hai bài, tách theo từng trục */
  gaps: P3SampleGap[];
  /** Một câu chốt nói cặp này dạy điều gì */
  takeaway: string;
};

export const SAMPLE_PAIRS: P3SamplePair[] = [
  {
    id: "s-ad",
    label: "Việc mình thích hay lương cao",
    essayType: "agree_disagree",
    prompt:
      "It is more important to work at a job you enjoy than to earn a high salary. Do you agree or disagree with this statement? Give reasons or examples to support your opinion.",
    band3: [
      "I agree with this statement. I think enjoying your job is more important than a high salary. There are two reasons for this.",
      "The first reason is that we spend a lot of time at work. Most people work eight hours every day. If you do not like your job, you will be unhappy for many hours. This is bad for your life. A high salary cannot change this feeling. So enjoying the job is very important.",
      "The second reason is about health. People who do not like their job feel stressed. Stress is bad for health. Many workers become tired and sick. If you enjoy your job, you feel better and you have more energy. This is good for you and also for your family.",
      "Of course, money is also important. We need money to pay for food and housing. But I think a job you enjoy is more important than a high salary. This is my opinion.",
    ],
    band5: [
      "Most of us will spend more waking hours at work than anywhere else, which makes the choice between a job we enjoy and a job that pays well less abstract than it sounds. I agree that enjoyment matters more, both because of what a bad job does to the hours themselves and because of what it quietly does to everything outside them.",
      "The first reason is simple arithmetic. Eight hours a day, five days a week, is roughly half of every waking weekday. A salary can buy a better apartment to come home to, but it cannot buy back the afternoon. A friend of mine doubled his income by moving into compliance work and told me, six months later, that he had started dreading Sunday evenings — the money had bought him a nicer flat to dread them in.",
      "The second reason is that dissatisfaction does not stay at the office. People who resent their work carry it home, and the people who live with them absorb it. When my father was managing a warehouse he disliked, our dinners were silent; when he moved to a smaller company for less money, he started asking about our days again. Nothing in our household changed except the job, and everything in it felt different.",
      "None of this means salary is irrelevant. Below a certain point, worrying about rent poisons any job, however interesting. But once the bills are covered, an extra ten percent buys far less than a Monday morning you do not dread.",
    ],
    gaps: [
      {
        axis: "Triển khai ý & ví dụ",
        band3: "Cả hai lý do đều dừng ở mức khái quát: «stress is bad for health», «this is bad for your life». Không có một người nào, một con số nào.",
        band5: "Mỗi lý do có một người thật và một tình huống thật: người bạn tăng gấp đôi thu nhập rồi sợ tối Chủ nhật, người cha đổi việc rồi bữa tối có tiếng nói.",
      },
      {
        axis: "Mạch bài",
        band3: "Nối bằng «The first reason… The second reason…» rồi hết. Câu cuối «This is my opinion» không thêm gì.",
        band5: "Kết bài nhượng bộ có điều kiện («below a certain point…») rồi khẳng định lại bằng một hình ảnh mới, không lặp mở bài.",
      },
      {
        axis: "Độ chính xác",
        band3: "Gần như không có lỗi ngữ pháp nào — và đó chính là điểm cần chú ý.",
        band5: "Cũng không có lỗi. Hai bài ngang nhau ở trục này.",
      },
      {
        axis: "Độ đa dạng",
        band3: "Hầu hết là câu đơn ngắn, chủ ngữ «I / we / people», từ vựng phổ thông: good, bad, important, very.",
        band5: "Mệnh đề quan hệ, mệnh đề nhượng bộ, dấu chấm phẩy, đối lập trong một câu; từ chính xác: dreading, absorb, resent, poisons.",
      },
    ],
    takeaway:
      "Bài mức 3 ở đây không sai chữ nào. Thứ chặn nó lại là câu đơn liên tiếp và ví dụ chỉ nói chung chung — đúng hai trục mà Tầng 5 và Tầng 10 nhắm vào.",
  },

  {
    id: "s-c2",
    label: "Công ty lớn hay công ty nhỏ",
    essayType: "choice_2",
    prompt:
      "Some people prefer to work for a large company with many departments. Others prefer a small company where everyone knows each other. Which would you prefer? Give reasons or examples to support your opinion.",
    band3: [
      "I would prefer to work for a small company. I have two reasons for my choice.",
      "First, in a small company you can learn many things. There are not many people, so everyone must do different jobs. A new employee can see all parts of the business. In a large company, you only do one job. You do the same thing every day and you learn slowly.",
      "Second, in a small company the relationships are better. Everyone knows each other. You can talk to your boss easily. In a large company there are many managers and it is difficult to meet them. Communication is slow.",
      "A large company has some advantages too. The salary is usually higher and the company is more stable. But I still prefer a small company because I want to learn quickly and know my colleagues. That is my choice.",
    ],
    band5: [
      "Both kinds of workplace attract people for reasons that have little to do with each other, which is why the choice says more about what you want from your twenties than about which company is better. I would take the small one, mainly because of how much of the business you get to see.",
      "In a firm of nine people, nobody can afford to do just one narrow task. In my first job at exactly that size, I answered client calls, prepared invoices and sat in on a contract negotiation in the same week. Within three months I understood how money actually moved through the company — something a friend who joined a large bank the same autumn still could not explain a year later, because his job was one step in a process he never saw the ends of.",
      "The second advantage is harder to measure but matters more day to day. When the person who decides the budget sits four metres away, a question that would otherwise become a chain of e-mails takes thirty seconds. Our designer once redrew a client's whole proposal in an afternoon because she overheard the account manager on the phone. That does not happen through a ticketing system.",
      "A large company would certainly pay me more, and it would survive a bad quarter that might close a small one. Those are real advantages and I do not dismiss them. But early in a career, seeing the whole machine is worth more than a safer seat inside one part of it.",
    ],
    gaps: [
      {
        axis: "Triển khai ý & ví dụ",
        band3: "Nói «you can learn many things» rồi giải thích lại chính điều đó. Không có ví dụ nào.",
        band5: "Công ty chín người, ba việc trong một tuần, người bạn ở ngân hàng lớn sau một năm vẫn không giải thích được — có đối chiếu nên tự thành bằng chứng.",
      },
      {
        axis: "Mạch bài",
        band3: "Câu nhượng bộ có ở đoạn cuối nhưng chỉ là «has some advantages too», rồi khẳng định lại y nguyên mở bài.",
        band5: "Nhượng bộ nêu đích danh hai điểm mạnh của bên kia, rồi kết bằng một tiêu chí mới: «seeing the whole machine» so với «a safer seat».",
      },
      {
        axis: "Độ chính xác",
        band3: "Không có lỗi.",
        band5: "Không có lỗi.",
      },
      {
        axis: "Độ đa dạng",
        band3: "Câu đơn và câu ghép với «and / but». Từ vựng: good, better, easily, difficult, slow.",
        band5: "Mệnh đề quan hệ lồng, dấu gạch ngang chèn ý, danh hoá («a safer seat inside one part of it»), và một câu mở đầu dài có mệnh đề «which is why…».",
      },
    ],
    takeaway:
      "Chú ý câu nhượng bộ ở hai bài: bài mức 3 nói bên kia «cũng có ưu điểm», bài mức 5 gọi tên đúng hai ưu điểm đó rồi mới vượt qua chúng.",
  },

  {
    id: "s-pc",
    label: "Làm việc tại nhà",
    essayType: "pros_cons",
    prompt:
      "Many companies now allow their staff to work from home several days a week. What are the advantages and disadvantages of this arrangement? Give reasons or examples to support your opinion.",
    band3: [
      "Working from home has become popular in recent years. It has advantages and disadvantages. I will discuss both of them.",
      "The main advantage is time. Employees do not have to travel to the office. They save many hours every week. They can use this time for their family or for sleeping. Another advantage is money, because they do not pay for transport. This is good for workers.",
      "The main disadvantage is communication. At home, you cannot talk to your colleagues directly. You must send e-mails and wait for answers. This is slow. New employees also have problems because they cannot learn from other people. They do not see how their colleagues work.",
      "In conclusion, working from home has both advantages and disadvantages. Companies must decide what is best for them. In my opinion, a mix of home and office is a good solution.",
    ],
    band5: [
      "Remote work was unusual a decade ago and is now ordinary in whole industries. The change has delivered gains that few people predicted, along with costs that are easy to overlook precisely because nobody experiences them all at once.",
      "The clearest gain is the return of time that used to disappear into travel. My cousin left her flat at half past six to reach an office by eight; she now starts at eight from her kitchen table and sleeps until seven. Multiplied across a year, that is several working weeks handed back to her — and unlike a pay rise, it arrives every single morning rather than once a month.",
      "The cost falls unevenly, and it falls hardest on the people least able to complain about it. Much of what a beginner needs to know is never written down anywhere: how a difficult client is calmed, when a deadline is genuinely fixed and when it is a negotiating position. A junior who joined our team in March had still never heard anyone handle an angry call by the time she faced one herself in July, and she had nothing to copy. Her more experienced colleagues, who learned all of that years ago in a noisy room, lost nothing at all.",
      "On balance I would keep remote work for anything that carries a date or a number in it, and bring people into a room for the conversations that can go wrong. The arrangement that suits a fifteen-year veteran is rarely the one that suits someone in their first quarter.",
    ],
    gaps: [
      {
        axis: "Triển khai ý & ví dụ",
        band3: "«They save many hours every week» — bao nhiêu giờ, ai? Cả bài không có một người cụ thể nào.",
        band5: "Sáu rưỡi, tám giờ, bảy giờ; nhân viên mới vào tháng Ba, gặp khách giận tháng Bảy. Mỗi mặt có một người và một mốc thời gian.",
      },
      {
        axis: "Mạch bài",
        band3: "Mở bài nói «I will discuss both of them» — tự thuật về bài viết. Kết bài lặp lại y nguyên «has both advantages and disadvantages».",
        band5: "Mở bài báo trước hai chiều mà không tự thuật. Kết bài chia phạm vi dùng cho từng thứ, rồi thêm một ý mới về việc ai hợp với cách nào.",
      },
      {
        axis: "Độ chính xác",
        band3: "Không có lỗi.",
        band5: "Không có lỗi.",
      },
      {
        axis: "Độ đa dạng",
        band3: "«The main advantage is… Another advantage is… The main disadvantage is…» — khuôn lặp ba lần.",
        band5: "Dấu chấm phẩy nối hai vế, dấu hai chấm dẫn danh sách, mệnh đề quan hệ «who learned all of that years ago», và một câu kết dùng so sánh «rarely the one that…».",
      },
    ],
    takeaway:
      "Bài mức 3 làm đủ hai chiều nên không mất điểm ở trục «trả lời đúng việc» — nó vẫn ở mức 3 vì đoạn nhược viết mỏng bằng một nửa đoạn lợi và không có ví dụ nào.",
  },

  {
    id: "s-c3",
    label: "Thưởng nhân viên cuối năm",
    essayType: "choice_3",
    prompt:
      "A company wants to thank its staff after a successful year. It is considering three options: a cash bonus, five extra vacation days, or a company trip abroad. Which option should the company choose? Give reasons or examples to support your opinion.",
    band3: [
      "The company has three options. I think the best option is a cash bonus.",
      "The first reason is that money is flexible. Every employee has different needs. Some people need money for rent. Other people want to buy something. With a cash bonus, everyone can use the money in the way they like. This is fair for all employees.",
      "The second reason is that a cash bonus is simple. The company does not need to organise anything. A company trip needs a lot of planning. Extra vacation days can also be a problem when there is a lot of work.",
      "In conclusion, I think a cash bonus is the best choice for the company. It is flexible and simple. The employees will be happy with it.",
    ],
    band5: [
      "Of the three options on the table, a cash bonus is the only one that reaches every member of staff in a form they themselves get to choose. That, rather than its size, is what makes it the right decision.",
      "Money is the one reward that does not assume anything about the person receiving it. One colleague may put it towards a deposit; another may finally replace a laptop that has been failing for a year. A designer on my last team used her bonus to pay for an evening course in motion graphics, and eighteen months later that course was the reason she was promoted. No trip and no extra leave could have turned into that.",
      "A company trip abroad sounds the most generous of the three and is in fact the least evenly distributed. Colleagues with small children, ageing parents or a fear of flying simply cannot take it, so a reward meant for everyone quietly becomes a reward for the unencumbered. Extra vacation days fail in a quieter way: they only help people whose workload can actually wait. In my team, leave carried over from last year is still sitting unused in the system, because taking it would mean handing the work to someone equally busy.",
      "The test for a reward is not how exciting it looks in the announcement e-mail but how many people can genuinely use it. On that measure the bonus wins twice over.",
    ],
    gaps: [
      {
        axis: "Trả lời đúng việc",
        band3: "Có loại bỏ hai phương án kia, nhưng gộp cả hai vào một câu ở đoạn ba, mỗi cái đúng một dòng.",
        band5: "Dành hẳn một đoạn cho việc loại bỏ, mỗi phương án một lý do riêng và một chi tiết riêng.",
      },
      {
        axis: "Triển khai ý & ví dụ",
        band3: "«Some people need money for rent. Other people want to buy something» — vẫn là người chung chung.",
        band5: "Nữ đồng nghiệp thiết kế dùng thưởng học khoá motion graphics, mười tám tháng sau được thăng chức. Một người, một kết quả đo được.",
      },
      {
        axis: "Mạch bài",
        band3: "Kết bài liệt kê lại đúng hai tính từ đã dùng ở thân bài: flexible, simple.",
        band5: "Kết bài nêu ra TIÊU CHÍ đánh giá phần thưởng, tức là thêm một tầng lập luận chứ không tóm tắt.",
      },
      {
        axis: "Độ đa dạng",
        band3: "Chủ ngữ lặp «The company / I / Employees», câu đều một nhịp.",
        band5: "Cấu trúc chẻ ở mở bài, dấu chấm phẩy, danh hoá «the unencumbered», và một câu kết dùng khuôn «not… but…».",
      },
    ],
    takeaway:
      "Ở dạng chọn-1-trong-3, chỗ ăn điểm dễ nhất mà cũng hay bị làm qua loa nhất là đoạn loại bỏ. Bài mức 3 dành cho nó hai dòng, bài mức 5 dành hẳn một đoạn.",
  },

  {
    id: "s-oq",
    label: "Cách học việc nhanh nhất",
    essayType: "open_q",
    prompt:
      "In your opinion, what is the most effective way for a new employee to learn how a company really works? Give reasons or examples to support your opinion.",
    band3: [
      "There are many ways for a new employee to learn about a company. In my opinion, the best way is to work with an experienced colleague.",
      "The first reason is that an experienced colleague knows everything about the company. He or she has worked there for a long time. A new employee can ask questions and get answers immediately. This is faster than reading documents alone.",
      "The second reason is that a new employee can see real situations. He can watch how his colleague talks to customers and solves problems. Books and training courses cannot show this. Real experience is the best teacher.",
      "In conclusion, working with an experienced colleague is the most effective way to learn. It is fast and practical. Every company should use this method for new employees.",
    ],
    band5: [
      "A new employee has three realistic ways to find out how a company operates: read the handbook, attend the training sessions, or sit beside somebody who has been doing the job for years. The first two are easy to arrange, which is probably why they are the ones companies offer. The third is the one that actually works.",
      "What a handbook cannot contain is everything a company has decided without writing down. It will tell you that expenses are approved by a line manager; it will not tell you that this particular manager approves anything submitted before Thursday and questions everything that arrives on Friday afternoon. Training sessions have the same limit — they teach the process as designed, not the process as practised.",
      "Sitting next to someone dissolves that gap without anyone having to explain it. When I joined my current company, I spent my first fortnight at a desk beside a colleague who had been there eleven years. I learned more in one afternoon of listening to her talk a supplier down from a missed deadline than in three days of orientation slides — not because the slides were wrong, but because they could not show me the pause she left before naming a number.",
      "None of this makes the handbook useless; it is exactly what you want at four in the afternoon when the person beside you is in a meeting. But if a company can only invest in one thing for its newcomers, it should invest in the seat, not the slides.",
    ],
    gaps: [
      {
        axis: "Trả lời đúng việc",
        band3: "Nói «có nhiều cách» rồi chọn luôn, không hề dựng ra các hạng mục để so.",
        band5: "Tự dựng đúng ba hạng mục ở mở bài rồi mới chọn — cách gỡ chuẩn cho dạng câu hỏi mở.",
      },
      {
        axis: "Triển khai ý & ví dụ",
        band3: "«He can watch how his colleague talks to customers» — vẫn là giả định, chưa xảy ra.",
        band5: "Quản lý duyệt chi trước thứ Năm, đồng nghiệp mười một năm, khoảng lặng trước khi ra giá. Chi tiết không ai đoán được.",
      },
      {
        axis: "Mạch bài",
        band3: "Kết bài lặp lại mở bài rồi thêm một lời khuyên chung «Every company should use this method».",
        band5: "Kết bài nhượng bộ đúng chỗ sổ tay có ích, rồi khép lại bằng đối lập «the seat, not the slides».",
      },
      {
        axis: "Độ đa dạng",
        band3: "«He or she», «This is faster than…», «Real experience is the best teacher» — câu ngắn, từ phổ thông.",
        band5: "Dấu chấm phẩy đối lập, mệnh đề «not because… but because…», động từ chính xác: dissolves, practised, invest.",
      },
    ],
    takeaway:
      "Dạng câu hỏi mở không cho sẵn lựa chọn nào. Bài mức 5 tự dựng ba hạng mục ngay câu đầu — đó vừa là cách thoát bí, vừa cho sẵn dàn ý cả bài.",
  },

  {
    id: "s-pl",
    label: "Máy bán hàng trong trường",
    essayType: "policy",
    prompt:
      "Some schools have placed vending machines in their hallways so that students can buy snacks between classes. Do you think schools should do this? Give reasons or examples to support your opinion.",
    band3: [
      "Some schools put vending machines in the hallways. In my opinion, schools should not do this.",
      "The first reason is health. Vending machines sell snacks and sweet drinks. These products are not healthy. Students will eat them instead of proper food. This is bad for their health and they can gain weight.",
      "The second reason is money. Students must bring money to school every day. Some families cannot afford this. Students who have no money will feel bad when they see other students buying snacks.",
      "In conclusion, I think vending machines are not a good idea for schools. They are bad for health and for money. Schools should provide healthy food in the canteen instead.",
    ],
    band5: [
      "A vending machine in a corridor looks like a small convenience, and that is precisely why it slips past the people who would object to it. Schools should not install them, because the convenience accrues to one party while the cost lands on two others.",
      "For students, the machine does not add a snack to lunch; it replaces lunch. A canteen meal takes fifteen minutes and a queue, while a chocolate bar takes forty seconds and no decision. The secondary school nearest my flat installed two machines last September, and by the end of the autumn term the lunchtime queue had visibly shortened — the same pupils were still hungry, they were simply eating standing up in a hallway.",
      "For parents, each school day quietly becomes a small negotiation about money. A neighbour told me she now sends her son out with no coins at all, not because she cannot spare them but because handing over two every morning had turned into a daily argument she was tired of losing. Families who cannot spare the coins face something worse than an argument: a child standing beside a machine that everyone else can use.",
      "The school gains a modest share of the takings and one less complaint about hunger. Weighed against a shorter canteen queue and a morning argument in several hundred households, that is not a trade worth making — and a school that wants its pupils to eat properly should not put the alternative in the corridor outside the classroom.",
    ],
    gaps: [
      {
        axis: "Trả lời đúng việc",
        band3: "Có trả lời «should not» rõ ràng, nhưng hai lý do đều nhìn từ phía học sinh.",
        band5: "Lập luận theo ba bên chịu tác động: học sinh, phụ huynh, nhà trường — cách làm dày đặc trưng của dạng chính sách.",
      },
      {
        axis: "Triển khai ý & ví dụ",
        band3: "«These products are not healthy», «Some families cannot afford this» — đúng nhưng không ai kiểm chứng được.",
        band5: "Trường gần nhà lắp hai máy tháng Chín, hàng chờ căng-tin ngắn lại sau một học kỳ; người hàng xóm không đưa tiền lẻ cho con nữa.",
      },
      {
        axis: "Mạch bài",
        band3: "Kết bài liệt kê lại «bad for health and for money» rồi thêm một đề xuất chưa hề được chuẩn bị ở thân bài.",
        band5: "Kết bài cân đo hai bên trong cùng một câu rồi mới chốt, và câu chốt dùng lại hình ảnh hành lang từ mở bài.",
      },
      {
        axis: "Độ đa dạng",
        band3: "Chủ ngữ «Students / These products / Schools» lặp, câu đều một nhịp ngắn.",
        band5: "Cấu trúc «not because… but because…», dấu hai chấm dẫn hệ quả, dấu gạch ngang chèn ý, danh hoá «a modest share of the takings».",
      },
    ],
    takeaway:
      "Hai bài cùng chọn «không nên» và cùng sạch lỗi. Khác nhau ở chỗ bài mức 3 nói cảm nghĩ, bài mức 5 truy xem ai được lợi và ai chịu thiệt.",
  },
];

export function getSamplePair(id: string): P3SamplePair | undefined {
  return SAMPLE_PAIRS.find((p) => p.id === id);
}
