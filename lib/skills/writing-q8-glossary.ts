// Từ vựng theo từng đề Writing Question 8.
//
// Mỗi mục là một CỤM dùng được thẳng vào bài luận ở mức band 5, không phải từ đơn.
// `example` bắt buộc chứa nguyên văn `en` — bài tập "điền cụm" khoét chỗ trống
// ngay trên câu này, nên đừng sửa `en` mà quên sửa `example`.
//
// Chạy `npx tsx scripts/validate-q8-glossary.ts` sau mỗi lần sửa.

export interface Q8GlossaryItem {
  en: string;
  vi: string;
  example: string;
}

/** Khoá `part` khi lưu điểm bài tập từ vựng vào subskill_attempts */
export const Q8_GLOSSARY_PART_KEY = "skills-writing-q8-glossary";

/** Số câu hỏi trong một lượt luyện từ */
export const Q8_GLOSSARY_DRILL_SIZE = 8;

export const Q8_GLOSSARY: Record<string, Q8GlossaryItem[]> = {
  // ── Việc mình thích hay mức lương cao ─────────────────────────────
  "q8-ad-1": [
    { en: "job satisfaction", vi: "sự hài lòng với công việc", example: "For me, job satisfaction matters far more than the figure on my pay slip." },
    { en: "a well-paid position", vi: "một vị trí lương cao", example: "Many graduates chase a well-paid position without asking whether they will enjoy the work." },
    { en: "look forward to going to work", vi: "mong được đi làm", example: "People who look forward to going to work rarely count the hours until Friday." },
    { en: "burn out", vi: "kiệt sức vì công việc", example: "Workers who hate their daily tasks burn out within a few years, however much they earn." },
    { en: "make ends meet", vi: "kiếm đủ sống", example: "A salary still has to be high enough to make ends meet, so passion alone is not enough." },
    { en: "in the long run", vi: "về lâu dài", example: "In the long run, a job you believe in produces better work than one you merely tolerate." },
    { en: "financial security", vi: "sự ổn định tài chính", example: "Financial security allows people to take risks later in their careers." },
    { en: "put up with", vi: "chịu đựng", example: "Nobody should have to put up with work that makes them miserable every single day." },
  ],

  // ── Học tại nhà ───────────────────────────────────────────────────
  "q8-ad-2": [
    { en: "tailored to a child's pace", vi: "được điều chỉnh theo tốc độ của trẻ", example: "Lessons at home can be tailored to a child's pace instead of the average of thirty students." },
    { en: "social skills", vi: "kỹ năng xã hội", example: "Children develop social skills by resolving disagreements with classmates every day." },
    { en: "a structured curriculum", vi: "chương trình học có cấu trúc", example: "Traditional schools follow a structured curriculum that has been tested for decades." },
    { en: "qualified teachers", vi: "giáo viên có chuyên môn", example: "Few parents can replace qualified teachers in subjects such as chemistry or history." },
    { en: "one-on-one attention", vi: "sự kèm cặp một kèm một", example: "One-on-one attention helps a struggling child far more than a lecture to a full classroom." },
    { en: "fall behind", vi: "bị tụt lại phía sau", example: "A quiet student can fall behind for months before a busy teacher notices." },
    { en: "peer pressure", vi: "áp lực từ bạn bè cùng trang lứa", example: "Homeschooled children are protected from peer pressure, but also from learning to resist it." },
    { en: "well-rounded", vi: "phát triển toàn diện", example: "A well-rounded education includes sport, music and teamwork, not just academic results." },
  ],

  // ── Ai cũng muốn tự làm chủ ───────────────────────────────────────
  "q8-ad-3": [
    { en: "be your own boss", vi: "tự làm chủ", example: "The freedom to be your own boss appeals to almost everyone at some point." },
    { en: "a steady income", vi: "thu nhập ổn định", example: "Employees give up some freedom in exchange for a steady income every month." },
    { en: "take on all the risk", vi: "gánh toàn bộ rủi ro", example: "When you run a business, you take on all the risk if a client fails to pay." },
    { en: "set your own hours", vi: "tự quyết định giờ làm", example: "Being able to set your own hours sounds attractive until the work never stops." },
    { en: "employee benefits", vi: "phúc lợi cho người lao động", example: "Employee benefits such as paid leave and insurance disappear the moment you go it alone." },
    { en: "start-up costs", vi: "chi phí khởi nghiệp", example: "Start-up costs keep many talented people in salaried jobs." },
    { en: "answer to no one", vi: "không phải báo cáo ai", example: "People say they want to answer to no one, but in reality customers become the new boss." },
    { en: "job security", vi: "sự an toàn về việc làm", example: "Job security is the single biggest reason most workers stay employed rather than self-employed." },
  ],

  // ── Ép nghỉ hưu hay để nhân viên tự quyết ─────────────────────────
  "q8-c2-1": [
    { en: "make way for younger staff", vi: "nhường chỗ cho nhân sự trẻ", example: "Forcing retirement is meant to make way for younger staff with fresh ideas." },
    { en: "decades of experience", vi: "hàng chục năm kinh nghiệm", example: "A company loses decades of experience the day a senior manager is pushed out." },
    { en: "mentor junior colleagues", vi: "dìu dắt đồng nghiệp mới", example: "Older employees can mentor junior colleagues instead of competing with them." },
    { en: "keep labour costs down", vi: "giữ chi phí nhân công thấp", example: "Replacing senior staff with graduates helps keep labour costs down in the short term." },
    { en: "institutional knowledge", vi: "kiến thức tích luỹ của tổ chức", example: "Institutional knowledge about old clients and past mistakes cannot be written in a manual." },
    { en: "age discrimination", vi: "phân biệt đối xử theo tuổi tác", example: "A fixed retirement age is a form of age discrimination in many countries." },
    { en: "keep up with new technology", vi: "theo kịp công nghệ mới", example: "Some assume older workers cannot keep up with new technology, which is rarely true." },
    { en: "phase out gradually", vi: "giảm dần rồi rút hẳn", example: "A better policy is to let employees phase out gradually by moving to part-time work." },
  ],

  // ── Yêu việc mình làm hay chăm chỉ là đủ ─────────────────────────
  "q8-c2-2": [
    { en: "sheer hard work", vi: "sự chăm chỉ thuần tuý", example: "Sheer hard work can carry someone through a job they dislike, but only for a while." },
    { en: "be passionate about", vi: "đam mê với", example: "You have to be passionate about a subject to keep reading about it after work." },
    { en: "go the extra mile", vi: "làm hơn mức được yêu cầu", example: "Employees who enjoy their work go the extra mile without being asked." },
    { en: "stay motivated", vi: "giữ được động lực", example: "It is far easier to stay motivated when the work itself interests you." },
    { en: "self-discipline", vi: "tính kỷ luật tự giác", example: "Self-discipline matters on the days when motivation disappears completely." },
    { en: "give up halfway", vi: "bỏ cuộc giữa chừng", example: "Those who chase a career purely for status often give up halfway." },
    { en: "reach the top of a field", vi: "vươn tới đỉnh cao của một lĩnh vực", example: "Nobody can reach the top of a field without thousands of unglamorous hours." },
    { en: "a means to an end", vi: "phương tiện để đạt mục đích khác", example: "For some people a job is simply a means to an end, and that is a valid choice." },
  ],

  // ── Tuyển người nhiều kinh nghiệm hay bằng cấp tốt ────────────────
  "q8-c2-3": [
    { en: "hit the ground running", vi: "bắt tay vào việc được ngay", example: "An experienced hire can hit the ground running in the first week." },
    { en: "a strong academic background", vi: "nền tảng học thuật vững", example: "A strong academic background shows that a candidate can learn difficult material quickly." },
    { en: "training costs", vi: "chi phí đào tạo", example: "Hiring graduates raises training costs but lowers salary expectations." },
    { en: "proven track record", vi: "thành tích đã được chứng minh", example: "A proven track record removes much of the guesswork from hiring." },
    { en: "bring fresh ideas", vi: "mang đến ý tưởng mới", example: "New graduates bring fresh ideas because they have not yet learned what is impossible." },
    { en: "outdated habits", vi: "thói quen lỗi thời", example: "Experienced staff sometimes carry outdated habits from their previous employers." },
    { en: "adapt to a new environment", vi: "thích nghi với môi trường mới", example: "Younger employees usually adapt to a new environment more quickly." },
    { en: "in the short term", vi: "trong ngắn hạn", example: "In the short term, experience wins; over five years, the gap often disappears." },
  ],

  // ── Giám sát chặt hay trao quyền tự do ───────────────────────────
  "q8-c2-4": [
    { en: "close supervision", vi: "sự giám sát sát sao", example: "Close supervision is necessary when a mistake could cost a customer's safety." },
    { en: "micromanage", vi: "quản lý quá chi li", example: "Managers who micromanage every email destroy the confidence of their team." },
    { en: "take ownership of their work", vi: "chịu trách nhiệm với công việc của mình", example: "Employees given freedom take ownership of their work and fix problems themselves." },
    { en: "meet deadlines", vi: "hoàn thành đúng hạn", example: "Clear goals help staff meet deadlines without anyone standing over them." },
    { en: "trust their staff", vi: "tin tưởng nhân viên", example: "Companies that trust their staff usually keep them for longer." },
    { en: "productivity", vi: "năng suất", example: "Productivity rose in our department once daily progress reports were abolished." },
    { en: "cut corners", vi: "làm ẩu, làm tắt", example: "Without any oversight, a small number of workers will cut corners." },
    { en: "regular check-ins", vi: "buổi trao đổi định kỳ", example: "Regular check-ins are a middle path between micromanagement and neglect." },
  ],

  // ── Nhân viên chuyên sâu hay đa năng ─────────────────────────────
  "q8-c2-5": [
    { en: "specialise in one area", vi: "chuyên sâu vào một mảng", example: "Engineers who specialise in one area solve difficult problems that generalists cannot." },
    { en: "a broad skill set", vi: "bộ kỹ năng rộng", example: "A broad skill set allows a small company to cover many roles with few people." },
    { en: "in-depth expertise", vi: "chuyên môn sâu", example: "In-depth expertise is what clients pay a premium for." },
    { en: "step in when someone is absent", vi: "thay thế khi ai đó vắng mặt", example: "A multi-skilled colleague can step in when someone is absent for a month." },
    { en: "a bottleneck", vi: "điểm nghẽn", example: "If only one person understands the payroll system, that person becomes a bottleneck." },
    { en: "spread too thin", vi: "làm quá nhiều việc nên không sâu", example: "Employees asked to do everything are often spread too thin to do anything well." },
    { en: "as a company grows", vi: "khi công ty lớn dần", example: "As a company grows, it can afford to replace generalists with specialists." },
    { en: "cover for each other", vi: "hỗ trợ thay phiên nhau", example: "Teams whose members can cover for each other survive busy periods far better." },
  ],

  // ── Có nên chặn mạng xã hội ở công sở ────────────────────────────
  "q8-c2-6": [
    { en: "block access to", vi: "chặn truy cập vào", example: "Some firms block access to social media on every office computer." },
    { en: "waste working hours", vi: "lãng phí giờ làm", example: "A minority of employees do waste working hours scrolling through their feeds." },
    { en: "treat employees like adults", vi: "đối xử với nhân viên như người trưởng thành", example: "Blocking websites fails to treat employees like adults." },
    { en: "judge people by their results", vi: "đánh giá qua kết quả", example: "It is fairer to judge people by their results than by the tabs open on their screen." },
    { en: "a short mental break", vi: "quãng nghỉ ngắn cho đầu óc", example: "A short mental break every hour actually improves concentration." },
    { en: "damage morale", vi: "làm tổn hại tinh thần làm việc", example: "Heavy-handed monitoring can damage morale more than lost time ever does." },
    { en: "sensitive company data", vi: "dữ liệu nhạy cảm của công ty", example: "Restrictions make sense where sensitive company data could be leaked." },
    { en: "a clear written policy", vi: "quy định bằng văn bản rõ ràng", example: "A clear written policy works better than a silent technical block." },
  ],

  // ── Cách tìm việc tốt nhất ───────────────────────────────────────
  "q8-c3-1": [
    { en: "personal recommendations", vi: "sự giới thiệu từ người quen", example: "Personal recommendations get a CV read instead of filtered out by software." },
    { en: "job search websites", vi: "trang tìm việc trực tuyến", example: "Job search websites list thousands of openings that would never appear in a newspaper." },
    { en: "newspaper advertisements", vi: "quảng cáo tuyển dụng trên báo", example: "Newspaper advertisements still reach older readers and local employers." },
    { en: "build a professional network", vi: "xây dựng mạng lưới nghề nghiệp", example: "Attending industry events is the cheapest way to build a professional network." },
    { en: "vouch for someone", vi: "bảo lãnh, đứng ra bảo đảm cho ai", example: "It helps enormously when a current employee can vouch for someone applying." },
    { en: "a wider pool of openings", vi: "nguồn việc rộng hơn", example: "Online platforms give access to a wider pool of openings across the country." },
    { en: "stand out from other applicants", vi: "nổi bật giữa các ứng viên khác", example: "It is very hard to stand out from other applicants when a post attracts five hundred CVs." },
    { en: "the hidden job market", vi: "thị trường việc làm không đăng tuyển", example: "Many roles are filled through the hidden job market before they are ever advertised." },
  ],

  // ── Làm ca đêm: lợi và hại ───────────────────────────────────────
  "q8-pc-1": [
    { en: "a shift allowance", vi: "phụ cấp ca", example: "Night workers usually receive a shift allowance on top of their basic pay." },
    { en: "sleep pattern", vi: "nhịp ngủ", example: "Working after midnight disrupts the body's natural sleep pattern." },
    { en: "fewer interruptions", vi: "ít bị làm phiền hơn", example: "There are fewer interruptions at night, so concentrated work gets done faster." },
    { en: "long-term health problems", vi: "vấn đề sức khoẻ lâu dài", example: "Studies link years of night work to long-term health problems." },
    { en: "avoid rush-hour traffic", vi: "tránh giờ cao điểm", example: "Night staff avoid rush-hour traffic in both directions." },
    { en: "miss family occasions", vi: "lỡ các dịp gia đình", example: "Night workers miss family occasions that everyone else takes for granted." },
    { en: "round-the-clock service", vi: "dịch vụ 24/24", example: "Hospitals and airports could not offer round-the-clock service without night shifts." },
    { en: "on balance", vi: "cân nhắc mọi mặt", example: "On balance, the extra pay does not fully compensate for the health cost." },
  ],

  // ── Công ty lớn và công ty nhỏ ───────────────────────────────────
  "q8-pc-2": [
    { en: "a clear career path", vi: "lộ trình thăng tiến rõ ràng", example: "Large firms offer a clear career path with defined levels and salaries." },
    { en: "get lost in the crowd", vi: "bị chìm nghỉm giữa đám đông", example: "In a company of ten thousand, an average performer can get lost in the crowd." },
    { en: "wear many hats", vi: "kiêm nhiều vai trò", example: "Staff at small firms wear many hats and learn the whole business quickly." },
    { en: "decision-making is faster", vi: "ra quyết định nhanh hơn", example: "Decision-making is faster when the owner sits at the next desk." },
    { en: "generous benefits", vi: "phúc lợi hậu hĩnh", example: "Big corporations attract talent with generous benefits and training budgets." },
    { en: "layers of bureaucracy", vi: "nhiều tầng thủ tục", example: "Layers of bureaucracy can delay a simple purchase by several weeks." },
    { en: "brand recognition", vi: "sự nhận diện thương hiệu", example: "Brand recognition on a CV opens doors for the rest of a career." },
    { en: "have a visible impact", vi: "thấy rõ tác động của mình", example: "In a small team you have a visible impact on results within months." },
  ],
  // ── Điều quan trọng nhất ở một công việc ─────────────────────────
  "q8-oq-1": [
    { en: "a supportive manager", vi: "người quản lý biết hỗ trợ", example: "A supportive manager makes a difficult job bearable and an easy job enjoyable." },
    { en: "room for growth", vi: "cơ hội phát triển", example: "Without room for growth, capable people leave within two years." },
    { en: "work-life balance", vi: "cân bằng công việc và cuộc sống", example: "Work-life balance is the first thing I ask about in an interview." },
    { en: "a sense of purpose", vi: "cảm giác công việc có ý nghĩa", example: "A sense of purpose keeps staff going through the difficult months." },
    { en: "be recognised for your work", vi: "được ghi nhận công sức", example: "It matters to be recognised for your work, not simply to be paid for it." },
    { en: "a reasonable workload", vi: "khối lượng công việc hợp lý", example: "A reasonable workload matters more than a corner office." },
    { en: "colleagues you can rely on", vi: "đồng nghiệp đáng tin cậy", example: "Colleagues you can rely on turn a stressful deadline into a shared effort." },
    { en: "fair compensation", vi: "mức đãi ngộ công bằng", example: "Fair compensation is not about being rich; it is about not feeling exploited." },
  ],

  // ── Khi nào nhân viên nên từ chối thăng chức ─────────────────────
  "q8-oq-2": [
    { en: "turn down a promotion", vi: "từ chối thăng chức", example: "It is reasonable to turn down a promotion that would double your travel." },
    { en: "managerial responsibilities", vi: "trách nhiệm quản lý", example: "Many excellent engineers have no interest in managerial responsibilities." },
    { en: "relocate to another city", vi: "chuyển đến thành phố khác", example: "A promotion that requires you to relocate to another city affects the whole family." },
    { en: "play to your strengths", vi: "phát huy đúng thế mạnh", example: "Staying in a technical role can play to your strengths better than managing people." },
    { en: "additional stress", vi: "áp lực tăng thêm", example: "The additional stress is rarely matched by the additional salary." },
    { en: "be set up to fail", vi: "bị đặt vào thế chắc chắn thất bại", example: "To accept a role with no budget and no team is to be set up to fail." },
    { en: "at this stage of my career", vi: "ở giai đoạn hiện tại của sự nghiệp", example: "At this stage of my career, I would rather deepen my skills than supervise others." },
    { en: "damage your reputation", vi: "làm tổn hại uy tín", example: "Failing in a role you never wanted can damage your reputation for years." },
  ],

  // ── Yếu tố chính để kinh doanh thành công ────────────────────────
  "q8-oq-3": [
    { en: "meet a real need", vi: "đáp ứng một nhu cầu có thật", example: "A business survives only if its product can meet a real need." },
    { en: "cash flow", vi: "dòng tiền", example: "More small firms fail from poor cash flow than from a poor idea." },
    { en: "customer loyalty", vi: "sự trung thành của khách hàng", example: "Customer loyalty costs far less than constantly finding new buyers." },
    { en: "hire the right people", vi: "tuyển đúng người", example: "Nothing matters more than the ability to hire the right people early on." },
    { en: "adapt to the market", vi: "thích ứng với thị trường", example: "Companies that refuse to adapt to the market disappear within a decade." },
    { en: "keep overheads low", vi: "giữ chi phí vận hành thấp", example: "Firms that keep overheads low buy themselves time when sales fall unexpectedly." },
    { en: "word of mouth", vi: "truyền miệng", example: "Word of mouth is the cheapest and most convincing form of advertising." },
    { en: "a clear competitive advantage", vi: "lợi thế cạnh tranh rõ ràng", example: "Without a clear competitive advantage, a business competes only on price." },
  ],

  // ── Vì sao công ty cho làm việc từ xa ────────────────────────────
  "q8-oq-4": [
    { en: "work remotely", vi: "làm việc từ xa", example: "Staff who work remotely often start earlier because there is no commute." },
    { en: "office space", vi: "diện tích văn phòng", example: "Employers save a great deal on office space when half the team stays at home." },
    { en: "recruit from anywhere", vi: "tuyển người ở bất cứ đâu", example: "Remote policies let a firm recruit from anywhere in the country." },
    { en: "commuting time", vi: "thời gian đi lại", example: "Two hours of commuting time a day is two hours taken from family or sleep." },
    { en: "staff retention", vi: "giữ chân nhân sự", example: "Flexible arrangements improve staff retention among parents of young children." },
    { en: "measure output rather than hours", vi: "đo kết quả thay vì số giờ", example: "Remote work forces managers to measure output rather than hours." },
    { en: "reduce absenteeism", vi: "giảm tình trạng nghỉ việc", example: "Allowing home working can reduce absenteeism during minor illness." },
    { en: "cut down on overheads", vi: "cắt giảm chi phí vận hành", example: "Closing one floor of the building cut down on overheads immediately." },
  ],

  // ── Vì sao thể thao quan trọng với con người ─────────────────────
  "q8-oq-5": [
    { en: "physical fitness", vi: "thể lực", example: "Regular matches maintain physical fitness without feeling like exercise." },
    { en: "relieve stress", vi: "giải toả căng thẳng", example: "An hour on the court can relieve stress that has built up all week." },
    { en: "teamwork and discipline", vi: "tinh thần đồng đội và kỷ luật", example: "Team sports teach children teamwork and discipline earlier than any classroom." },
    { en: "bring communities together", vi: "gắn kết cộng đồng", example: "Few events bring communities together the way a local derby does." },
    { en: "a sense of belonging", vi: "cảm giác thuộc về", example: "Supporting a club gives people a sense of belonging in a large city." },
    { en: "learn to lose gracefully", vi: "học cách chấp nhận thua", example: "Children who compete regularly learn to lose gracefully." },
    { en: "a healthy routine", vi: "thói quen lành mạnh", example: "Training twice a week builds a healthy routine that lasts into adulthood." },
    { en: "role models", vi: "hình mẫu để noi theo", example: "Successful athletes become role models for young people who have few others." },
  ],

  // ── Lương thấp nhưng nhiều ngày nghỉ ────────────────────────────
  "q8-oq-6": [
    { en: "paid time off", vi: "ngày nghỉ có lương", example: "Six weeks of paid time off is worth more to me than a ten per cent rise." },
    { en: "recharge", vi: "nạp lại năng lượng", example: "People need long enough away from work to genuinely recharge." },
    { en: "at the expense of", vi: "đánh đổi bằng", example: "A large salary is often earned at the expense of every evening and weekend." },
    { en: "cover basic expenses", vi: "trang trải chi phí cơ bản", example: "A low salary is acceptable only if it can still cover basic expenses comfortably." },
    { en: "save for the future", vi: "tiết kiệm cho tương lai", example: "Those with dependants must save for the future, which limits this choice." },
    { en: "pursue interests outside work", vi: "theo đuổi sở thích ngoài công việc", example: "Long holidays let people pursue interests outside work that make life richer." },
    { en: "depend on your circumstances", vi: "tuỳ hoàn cảnh từng người", example: "The right answer will depend on your circumstances at that point in life." },
    { en: "money cannot buy back time", vi: "tiền không mua lại được thời gian", example: "Money cannot buy back time spent away from a growing child." },
  ],

  // ── Chuẩn bị cho buổi phỏng vấn ─────────────────────────────────
  "q8-oq-7": [
    { en: "research the company", vi: "tìm hiểu về công ty", example: "Candidates should research the company thoroughly before the interview." },
    { en: "prepare specific examples", vi: "chuẩn bị ví dụ cụ thể", example: "Prepare specific examples of problems you solved rather than general claims." },
    { en: "anticipate common questions", vi: "lường trước câu hỏi thường gặp", example: "It pays to anticipate common questions about weaknesses and gaps in a CV." },
    { en: "dress appropriately", vi: "ăn mặc phù hợp", example: "Dress appropriately for that particular industry, not for every industry." },
    { en: "arrive early", vi: "đến sớm", example: "Arrive early enough to calm down before you are called in." },
    { en: "ask thoughtful questions", vi: "đặt câu hỏi có suy nghĩ", example: "Interviewers remember candidates who ask thoughtful questions at the end." },
    { en: "a mock interview", vi: "buổi phỏng vấn thử", example: "A mock interview with a friend reveals answers that sound weak out loud." },
    { en: "follow up afterwards", vi: "liên hệ lại sau buổi phỏng vấn", example: "A short message to follow up afterwards keeps your name in mind." },
  ],

  // ── Phẩm chất của một người sếp giỏi ────────────────────────────
  "q8-oq-8": [
    { en: "lead by example", vi: "làm gương", example: "A good manager has to lead by example rather than issue instructions from a distance." },
    { en: "give constructive feedback", vi: "góp ý mang tính xây dựng", example: "Learning to give constructive feedback is harder than it sounds." },
    { en: "delegate effectively", vi: "giao việc hiệu quả", example: "Managers who cannot delegate effectively end up doing everyone's job badly." },
    { en: "stay calm under pressure", vi: "bình tĩnh dưới áp lực", example: "A boss who can stay calm under pressure keeps the whole team steady." },
    { en: "take responsibility for mistakes", vi: "nhận trách nhiệm khi sai", example: "Great leaders take responsibility for mistakes instead of blaming their staff." },
    { en: "listen to their team", vi: "lắng nghe đội của mình", example: "Managers who listen to their team discover problems while they are still small." },
    { en: "set clear expectations", vi: "nêu rõ yêu cầu", example: "Managers who set clear expectations prevent most conflicts before they start." },
    { en: "give credit where it is due", vi: "ghi nhận đúng người", example: "A boss who will give credit where it is due earns loyalty that money cannot buy." },
  ],

  // ── Nghe nhạc ở nơi làm việc ────────────────────────────────────
  "q8-oq-9": [
    { en: "concentrate on repetitive tasks", vi: "tập trung vào việc lặp đi lặp lại", example: "Music helps many people concentrate on repetitive tasks." },
    { en: "block out background noise", vi: "chặn tiếng ồn xung quanh", example: "Headphones block out background noise in an open-plan office." },
    { en: "disturb colleagues", vi: "làm phiền đồng nghiệp", example: "Playing music aloud can disturb colleagues who need silence to think." },
    { en: "a matter of personal preference", vi: "chuyện sở thích cá nhân", example: "Whether music helps is largely a matter of personal preference." },
    { en: "safety-critical work", vi: "công việc liên quan an toàn", example: "In safety-critical work, anything that reduces alertness should be banned." },
    { en: "improve mood", vi: "cải thiện tâm trạng", example: "A familiar playlist can improve mood during a long afternoon." },
    { en: "miss important announcements", vi: "bỏ lỡ thông báo quan trọng", example: "Staff wearing headphones may miss important announcements." },
    { en: "a sensible compromise", vi: "một thoả hiệp hợp lý", example: "A sensible compromise is to allow headphones but not speakers." },
  ],

  // ── Công ty có nên áp quy định trang phục ───────────────────────
  "q8-po-1": [
    { en: "a strict dress code", vi: "quy định trang phục nghiêm ngặt", example: "A strict dress code makes sense for staff who meet clients every day." },
    { en: "project a professional image", vi: "tạo hình ảnh chuyên nghiệp", example: "Uniforms help a company project a professional image to the public." },
    { en: "express their individuality", vi: "thể hiện cá tính", example: "Younger employees want to express their individuality through what they wear." },
    { en: "dress casually", vi: "ăn mặc thoải mái", example: "Software teams who dress casually are no less productive than those in suits." },
    { en: "customer-facing roles", vi: "vị trí tiếp xúc khách hàng", example: "Rules should apply mainly to customer-facing roles." },
    { en: "put staff at ease", vi: "giúp nhân viên thoải mái", example: "A relaxed policy can put staff at ease and often improves morale." },
    { en: "an unnecessary expense", vi: "khoản chi không cần thiết", example: "Buying formal clothes is an unnecessary expense for junior employees." },
    { en: "a minimum standard", vi: "chuẩn mực tối thiểu", example: "Most companies only need a minimum standard rather than a detailed list." },
  ],

  // ── Cư dân chung cư có bắt buộc dự họp ──────────────────────────
  "q8-po-2": [
    { en: "residents' meeting", vi: "cuộc họp cư dân", example: "A residents' meeting is the only place where every household can be heard." },
    { en: "shared facilities", vi: "tiện ích dùng chung", example: "Decisions about shared facilities affect everyone in the building." },
    { en: "maintenance fees", vi: "phí bảo trì", example: "Nobody should complain about maintenance fees if they never attend the meeting." },
    { en: "make attendance compulsory", vi: "bắt buộc phải tham dự", example: "It would be difficult to make attendance compulsory and then enforce it fairly." },
    { en: "shift workers", vi: "người làm theo ca", example: "Shift workers simply cannot attend a meeting held on a weekday evening." },
    { en: "reach a quorum", vi: "đủ số người để họp hợp lệ", example: "Buildings often fail to reach a quorum and decisions are delayed for months." },
    { en: "vote by proxy", vi: "bỏ phiếu uỷ quyền", example: "Allowing residents to vote by proxy solves most of the problem." },
    { en: "a sense of community", vi: "tinh thần cộng đồng", example: "Regular meetings build a sense of community among neighbours who never speak." },
  ],

  // ── Phỏng vấn tuyển dụng qua điện thoại ─────────────────────────
  "q8-po-3": [
    { en: "a first-round interview", vi: "vòng phỏng vấn đầu", example: "A phone call is ideal for a first-round interview when there are many applicants." },
    { en: "screen candidates quickly", vi: "sàng lọc ứng viên nhanh", example: "Recruiters can screen candidates quickly without booking meeting rooms." },
    { en: "save travel costs", vi: "tiết kiệm chi phí đi lại", example: "Phone interviews save travel costs for candidates who live far away." },
    { en: "body language", vi: "ngôn ngữ cơ thể", example: "Interviewers lose all the information carried by body language." },
    { en: "build rapport", vi: "tạo thiện cảm, sự kết nối", example: "It is much harder to build rapport when you cannot see the other person." },
    { en: "a poor connection", vi: "đường truyền kém", example: "A poor connection can make a strong candidate sound hesitant." },
    { en: "level the playing field", vi: "tạo sân chơi công bằng", example: "Removing appearance from the first round helps level the playing field." },
    { en: "the final decision", vi: "quyết định cuối cùng", example: "The final decision should always be made face to face." },
  ],
};
