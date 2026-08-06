// Dữ liệu luyện đề TOEIC Writing Questions 6-7:
// "Respond to a written request" — đọc e-mail và viết e-mail phản hồi theo Directions.
//
// Không chấm bằng AI. Sau khi nộp, học viên đối chiếu với Model Answer và tự tick
// checklist mission + checklist hình thức; điểm ETS 0-4 được suy ra từ checklist đó.

export type Q67Difficulty = "easy" | "medium" | "hard";

export interface Q67Email {
  from: string;
  to: string;
  subject: string;
  sent?: string;
  body: string[];
}

export interface Q67Prompt {
  id: string;
  /** số thứ tự trong bộ đề gốc của giáo viên */
  no: number;
  difficulty: Q67Difficulty;
  email: Q67Email;
  directions: string;
  /** từng mission tách rời — dùng làm checklist tự chấm */
  missions: string[];
  /** chỉ số dòng trong modelAnswer ứng với từng mission (cùng thứ tự với `missions`) */
  missionLines: number[];
  /** bài mẫu, mỗi phần tử một dòng */
  modelAnswer: string[];
  /** lưu ý của giáo viên về cái bẫy riêng của đề này */
  note: string;
}

export interface Q67Test {
  slug: string;
  label: string;
  difficulty: Q67Difficulty;
  promptIds: string[];
}

/** Khoá `part` khi lưu vào subskill_attempts */
export const Q67_PART_KEY = "skills-writing-q6-7";

/** Thời lượng chuẩn của đề thi thật: 10 phút cho mỗi câu */
export const Q67_SECONDS_PER_QUESTION = 600;

/**
 * Tiêu chí hình thức — giống nhau ở mọi đề, kiểm tra bố cục 5 khối
 * mà học viên đã luyện ở khu Subskills Writing Part 2.
 */
export const Q67_FORM_CHECKS: string[] = [
  "Có xưng hô đúng người nhận ở dòng đầu (Dear Mr./Ms. + HỌ, hoặc tên bộ phận)",
  "Có câu chào hỏi / tóm tắt lý do viết ngay sau xưng hô",
  "Có câu kết trước lời chào cuối",
  "Có lời chào cuối trang trọng và ký tên đúng vai được giao",
];

// ─────────────────────────────────────
// Quy đổi checklist → điểm ETS 0-4
// ─────────────────────────────────────

export interface Q67Score {
  ets: 0 | 1 | 2 | 3 | 4;
  /** dùng để lưu DB (cột score là Int 0-100) */
  pct: number;
  label: string;
  detail: string;
}

/**
 * Thang ETS thật của Q6-7 là 0-4. Quy tắc dưới đây bám theo mô tả rubric:
 * điểm cao nhất đòi hỏi hoàn thành ĐỦ mission VÀ đúng khuôn thư.
 */
export function computeQ67Score(
  missionsDone: boolean[],
  formDone: boolean[],
  wroteSomething: boolean,
): Q67Score {
  if (!wroteSomething || missionsDone.length === 0) {
    return { ets: 0, pct: 0, label: "Chưa đạt", detail: "Bài trống hoặc không có nội dung liên quan." };
  }

  const m = missionsDone.filter(Boolean).length / missionsDone.length;
  const f = formDone.filter(Boolean).length / (formDone.length || 1);

  let ets: Q67Score["ets"];
  let detail: string;

  if (m === 1 && f >= 0.75) {
    ets = 4;
    detail = "Hoàn thành đủ mission và đúng khuôn thư business.";
  } else if (m === 1) {
    ets = 3;
    detail = "Đủ mission nhưng khuôn thư còn thiếu (xưng hô, câu chào, câu kết hoặc chữ ký).";
  } else if (m >= 0.5) {
    ets = 2;
    detail = "Mới hoàn thành được một phần mission.";
  } else if (m > 0) {
    ets = 1;
    detail = "Rất ít nội dung đáp ứng yêu cầu của Directions.";
  } else {
    ets = 0;
    detail = "Không hoàn thành mission nào.";
  }

  const LABELS = ["Chưa đạt", "Yếu", "Trung bình", "Khá", "Tốt"] as const;
  return { ets, pct: ets * 25, label: LABELS[ets], detail };
}

// ─────────────────────────────────────
// 15 đề
// ─────────────────────────────────────

export const Q67_PROMPTS: Q67Prompt[] = [
  {
    id: "q67-01",
    no: 1,
    difficulty: "medium",
    email: {
      from: "Marilyn Aniston",
      to: "Getaway Travel",
      subject: "Travel Package",
      sent: "March 14, 5:20 p.m.",
      body: [
        "Dear Sir/Madam,",
        "I am planning on taking a trip out of the country this summer vacation. My budget for the trip is low. So, I would like to have an economical trip, but I also want to have lots of fun at the same time. Would you recommend some of your tour packages to me?",
        "Sincerely,",
        "Marilyn Aniston",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a travel agent at Getaway Travel. In your e-mail, give TWO pieces of information about tour packages and ONE suggestion.",
    missions: [
      "Thông tin thứ nhất về một gói tour (có số liệu cụ thể)",
      "Thông tin thứ hai về một gói tour khác hoặc chi tiết khác",
      "Một lời gợi ý bám vào hoàn cảnh của khách",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Ms. Aniston,",
      "Thank you for your e-mail dated March 14 regarding our tour packages.",
      "I would like to let you know that our Southeast Asia package costs 890 dollars for ten days, including flights, hotels and daily breakfast.",
      "We also offer a budget option to Eastern Europe at 650 dollars for eight days, which covers accommodation and city tours but not meals.",
      "Since you would like an economical trip with plenty of activities, I would suggest travelling in early June, when prices are around twenty percent lower than in July and August.",
      "Please let me know if you would like a detailed itinerary for either package.",
      "Sincerely,",
      "Getaway Travel",
    ],
    note:
      "«TWO pieces of information» phải là hai thông tin KHÁC nhau và có số liệu — hai câu cùng nói về một gói tour chỉ tính là một. Khách nêu hai điều kiện (ngân sách thấp + muốn vui), nên lời gợi ý phải bám vào đó thì mới được tính là hoàn thành mission.",
  },
  {
    id: "q67-02",
    no: 2,
    difficulty: "medium",
    email: {
      from: "Jodie McMaster",
      to: "Bathroom Master",
      subject: "Incorrect Faucet",
      sent: "February 10, 8:15 a.m.",
      body: [
        "Bathroom Master:",
        "I am writing to let you know about the incorrect faucet that I received in the mail. I originally ordered a shiny and durable metallic faucet for my bathroom. However, what I now have is a cheap-looking white plastic faucet. I would like to believe that there was a mistake in shipping. Will you take immediate action to fix this error?",
        "Thank you.",
        "Best wishes,",
        "Jodie McMaster",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a sales manager at Bathroom Master. In your e-mail, make AN apology about your mistake and give A suggestion.",
    missions: [
      "Một lời xin lỗi về đúng lỗi đã gây ra (giao sai vòi nước)",
      "Một lời gợi ý / phương án xử lý cho khách",
    ],
    missionLines: [3, 4],
    modelAnswer: [
      "Dear Ms. McMaster,",
      "Thank you for letting us know about the faucet you received on February 10.",
      "When we checked our records, we found that your order had been packed with the wrong item number by our warehouse team.",
      "I would like to apologize for sending you a white plastic faucet instead of the metallic one you ordered.",
      "I would suggest that you keep the incorrect faucet until our courier collects it next week, so that your bathroom is not left without one; we will ship the correct metallic faucet today by express delivery.",
      "Once again, please accept my sincere apology for the inconvenience caused.",
      "Sincerely,",
      "Bathroom Master",
    ],
    note:
      "Đề này chỉ có HAI mission, ít nhất trong cả bộ. Đừng thêm câu hỏi cho «đủ ba» — Directions không yêu cầu, viết thừa chỉ tốn thời gian trong 10 phút. Câu giải thích nguyên nhân không bắt buộc nhưng làm lời xin lỗi đáng tin hơn hẳn.",
  },
  {
    id: "q67-03",
    no: 3,
    difficulty: "easy",
    email: {
      from: "Jonathan Louise",
      to: "Barron Hotel",
      subject: "Reservation",
      sent: "April 26, 11:05 a.m.",
      body: [
        "Dear Sir or Madam,",
        "My name is Jonathan Louise and I'm writing to make a reservation at your hotel. My whole family will visit London for about one week in July, so I hope to make a reservation for that time. An early reply would be greatly appreciated. Thank you.",
        "Regards,",
        "Jonathan Louise",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a receptionist at the Barron Hotel. In your e-mail, give TWO pieces of information and make ONE question.",
    missions: [
      "Thông tin thứ nhất (loại phòng, giá, tình trạng phòng trống…)",
      "Thông tin thứ hai (vị trí, dịch vụ kèm theo…)",
      "Một câu hỏi cho khách",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Mr. Louise,",
      "Thank you for your e-mail of April 26 regarding a reservation for your family in July.",
      "I am pleased to inform you that our family rooms are available throughout July at a rate of 180 pounds per night, including breakfast for four guests.",
      "The hotel is also a ten-minute walk from Victoria Station, and we provide free luggage storage on your arrival and departure days.",
      "Could you tell me the exact dates of your stay and how many people will be travelling with you?",
      "I look forward to hearing from you soon.",
      "Yours sincerely,",
      "Barron Hotel",
    ],
    note:
      "Khách chưa nêu ngày cụ thể và số người — đó chính là câu hỏi tự nhiên nhất. Tuyệt đối đừng hỏi lại những gì khách đã nói (London, khoảng một tuần, tháng 7).",
  },
  {
    id: "q67-04",
    no: 4,
    difficulty: "hard",
    email: {
      from: "Ellen's Style",
      to: "Joe & Lee Clothing",
      subject: "Faulty goods",
      sent: "March 1st, 10:15 a.m.",
      body: [
        "Joe & Lee Clothing:",
        "Thank you for your delivery of the 'glamorous' dresses, which we ordered last week. However, we have to draw your attention to the following problem. Of the ordered items supplied, the size 10 was of a darker red than the other sizes. I'm looking forward to receiving your immediate explanation.",
        "Sincerely,",
        "Ellen's Style",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a sales manager at Joe & Lee Clothing. In your e-mail, make AN apology and suggestion and ONE question.",
    missions: [
      "Một lời xin lỗi về việc màu váy size 10 bị lệch",
      "Một lời gợi ý / phương án khắc phục",
      "Một câu hỏi cho khách hàng",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Ellen's Style Team,",
      "Thank you for your e-mail of March 1 concerning the 'glamorous' dresses delivered last week.",
      "Our supplier has informed us that one dyeing batch produced a darker shade than our standard red, and the size 10 dresses were taken from that batch.",
      "I would like to apologize for the difference in colour between the size 10 dresses and the other sizes.",
      "I would suggest that we replace all the size 10 dresses free of charge from our new batch, which can be delivered within three working days.",
      "Would you like us to collect the darker dresses at the same time, or would you prefer to keep them at a thirty percent discount?",
      "Once again, please accept my sincere apology for the inconvenience caused.",
      "Yours sincerely,",
      "Joe & Lee Clothing",
    ],
    note:
      "Đây là quan hệ doanh nghiệp ↔ doanh nghiệp, không phải với người tiêu dùng, nên giọng phải trang trọng hơn. Khách yêu cầu rõ «immediate explanation» — vì vậy câu giải thích nguyên nhân là BẮT BUỘC dù Directions không ghi. Cả hai bên đều ký bằng tên công ty nên xưng hô dùng tên công ty + Team.",
  },
  {
    id: "q67-05",
    no: 5,
    difficulty: "easy",
    email: {
      from: "Just Good Car",
      to: "Potential customer",
      subject: "Grab the chance!",
      sent: "September 21, 11:09 a.m.",
      body: [
        "JUST GOOD CAR",
        "BUYING A SECOND-HAND car is made easy at Just Good Car. We have a huge selection of cars for sale on our Web site. We've made it possible to buy used cars online free of any additional service charge. We are one of the largest used car dealers. Just search for the car model that you want using our quick search engine.",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a potential buyer who wants to purchase a used car. In your e-mail, ask THREE questions about used cars.",
    missions: [
      "Câu hỏi thứ nhất về xe cũ",
      "Câu hỏi thứ hai về xe cũ",
      "Câu hỏi thứ ba về xe cũ",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Sir or Madam,",
      "I have just read your e-mail about buying a second-hand car through your website.",
      "I am interested in purchasing a used car and would like to ask a few questions.",
      "First, could you tell me whether the cars on your website come with a warranty?",
      "Second, I would like to know if I can arrange a test drive before I buy.",
      "Finally, do you provide a full service history for each vehicle?",
      "An early reply would be greatly appreciated.",
      "Yours faithfully,",
      "Jim Nguyen",
    ],
    note:
      "Ba câu hỏi nên dùng ba khuôn KHÁC nhau và đánh dấu bằng First / Second / Finally — giám khảo đếm được ngay. Đề đã nói «free of any additional service charge» nên đừng hỏi về phí dịch vụ. E-mail đề không ký tên người nên xưng hô dùng «Dear Sir or Madam» → kết bằng «Yours faithfully».",
  },
  {
    id: "q67-06",
    no: 6,
    difficulty: "hard",
    email: {
      from: "Matthew Hanson, A-Force Tech, Management Supervisor",
      to: "Manufacturing employees",
      subject: "Sick leave",
      sent: "May 1st, 9:30 a.m.",
      body: [
        "As a reminder, all the paperwork for paid sick leave is due this week. Please turn in the completed form by e-mail and attach any special consideration concerning your paid sick leave. Please know that not all circumstances are covered as paid sick leave. Please e-mail me by the end of this week. Thanks.",
        "Regards,",
        "Matthew Hanson, Management Supervisor",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Jim Ford, one of the workers at A-Force Tech. In your e-mail, give at least TWO explanations why you need paid sick leave and make ONE request.",
    missions: [
      "Lý do thứ nhất cần nghỉ ốm có lương",
      "Lý do thứ hai, KHÁC lý do thứ nhất",
      "Một đề nghị (request) gửi cấp trên",
    ],
    missionLines: [3, 4, 6],
    modelAnswer: [
      "Dear Mr. Hanson,",
      "Thank you for the reminder about the paperwork for paid sick leave.",
      "I am writing to explain why I need to apply for paid sick leave this month.",
      "First, I injured my back while moving equipment on the production line on April 22, and my doctor has advised me to rest for at least one week.",
      "Second, I have a follow-up appointment at the hospital on May 8, which falls on a working day.",
      "I have attached my medical certificate and the completed form to this e-mail.",
      "Could you confirm whether a hospital appointment counts as a special consideration under our policy?",
      "Best regards,",
      "Jim Ford",
    ],
    note:
      "Phải TỰ BỊA hoàn toàn lý do — e-mail đề không cho dữ kiện nào về bạn. «at least TWO explanations» nghĩa là hai lý do KHÁC nhau, không phải nói lại một lý do bằng hai cách. E-mail đề có nhắc «not all circumstances are covered» — bám vào đó để viết câu request là hợp lý nhất.",
  },
  {
    id: "q67-07",
    no: 7,
    difficulty: "hard",
    email: {
      from: "George Pinkney",
      to: "Social Committee members",
      subject: "Meeting",
      sent: "April 12",
      body: [
        "It is time for a meeting of the Social Committee. We need to start planning the annual year-end party. I would like all members of the committee to meet next Friday morning from 9 to 11 in Conference Room A. Please let me know as soon as possible if you are available to attend this meeting.",
        "Thank you.",
        "George Pinkney",
        "Social Committee Chair",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a member of the Social Committee. In your e-mail, explain ONE problem and make TWO suggestions.",
    missions: [
      "Nêu rõ MỘT vấn đề với cuộc họp được đề xuất",
      "Gợi ý thứ nhất để giải quyết vấn đề đó",
      "Gợi ý thứ hai, là một phương án KHÁC",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Mr. Pinkney,",
      "Thank you for your e-mail of April 12 about the Social Committee meeting.",
      "Unfortunately, there is a problem with the proposed time: three of us on the committee attend the departmental budget review every Friday morning, so we would not be able to join you from nine to eleven.",
      "I would suggest that we move the meeting to Friday afternoon, for example from two to four in Conference Room A.",
      "Alternatively, if Friday is the only possible day for you, I would suggest holding the meeting on Thursday morning instead, when the room is also free.",
      "Please let me know which option suits you best.",
      "Best regards,",
      "Hoa Le",
    ],
    note:
      "E-mail đề KHÔNG nêu vấn đề nào — bạn phải tự nghĩ ra một vấn đề hợp lý với bối cảnh (trùng lịch, phòng họp bận, thông báo quá gấp). Hai gợi ý phải là hai PHƯƠNG ÁN khác nhau; nói lại một phương án bằng hai cách chỉ được tính là một mission.",
  },
  {
    id: "q67-08",
    no: 8,
    difficulty: "easy",
    email: {
      from: "Journal of Business News",
      to: "Business professionals",
      subject: "Subscribe",
      sent: "December 2",
      body: [
        "Dear Business Professional,",
        "The Journal of Business News brings you all the latest news about important developments in the international business world. It is read by thousands of business people just like you in over 40 countries around the world. Subscribe today and receive a 30% discount off the regular price.",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a businessperson interested in subscribing to the Journal of Business News. In your e-mail, ask THREE questions.",
    missions: [
      "Câu hỏi thứ nhất về việc đăng ký",
      "Câu hỏi thứ hai về việc đăng ký",
      "Câu hỏi thứ ba về việc đăng ký",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Sir or Madam,",
      "I have just read your e-mail about subscribing to the Journal of Business News.",
      "I am interested in taking out a subscription and would like to ask three questions.",
      "First, could you tell me how much the regular annual price is before the discount?",
      "Second, I would like to know whether the journal is available in a digital edition as well as in print.",
      "Finally, how long does the thirty percent discount remain valid?",
      "An early reply would be greatly appreciated.",
      "Yours faithfully,",
      "Quang Ha",
    ],
    note:
      "Đề chỉ nói «30% discount off the regular price» mà không cho biết giá gốc — đó là câu hỏi hiển nhiên nhất. Tránh hỏi những gì đề đã nêu (đọc ở hơn 40 nước, nội dung là tin kinh doanh quốc tế).",
  },
  {
    id: "q67-09",
    no: 9,
    difficulty: "easy",
    email: {
      from: "City Sports and Fitness Club",
      to: "New Members",
      subject: "Welcome to the club",
      body: [
        "We are happy to have you as a new member of our club. We offer facilities for all kinds of sports and fitness activities, and we have classes for all ability levels. Please let us know if you have any questions.",
        "Phyllis Rich",
        "Manager",
      ],
    },
    directions:
      "Respond to the e-mail as a new member of the sports and fitness club. In your e-mail, ask THREE questions.",
    missions: [
      "Câu hỏi thứ nhất về câu lạc bộ",
      "Câu hỏi thứ hai về câu lạc bộ",
      "Câu hỏi thứ ba về câu lạc bộ",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Ms. Rich,",
      "Thank you for your warm welcome to City Sports and Fitness Club.",
      "I have a few questions before I start using the facilities.",
      "First, could you tell me what your opening hours are at the weekend?",
      "Second, I would like to know how I can sign up for the classes you mentioned.",
      "Finally, is there an additional charge for using the swimming pool?",
      "I look forward to hearing from you soon.",
      "Best regards,",
      "Mai Tran",
    ],
    note:
      "E-mail đề rất ngắn nên phải tự nghĩ ra chủ đề hỏi. Bám vào hai chi tiết đề có nhắc: «facilities for all kinds of sports» và «classes for all ability levels». Người ký tên là Phyllis Rich, Manager → xưng hô đúng là «Dear Ms. Rich».",
  },
  {
    id: "q67-10",
    no: 10,
    difficulty: "hard",
    email: {
      from: "Joan Andrews",
      to: "John Munro",
      subject: "Lease",
      body: [
        "Dear Mr. Munro,",
        "I have been informed that you don't wish to renew the lease for the office space we rent from you at 151 South Main Street. I feel that we have been good tenants since we started occupying the space a year ago. Could you please explain the reason why you don't wish to renew the lease?",
        "Your tenant,",
        "Joan Andrews",
        "President, Andrews Systems, Inc.",
      ],
    },
    directions:
      "Respond to the e-mail as if you are John Munro, owner of the office space at 151 South Main Street. In your e-mail, explain TWO problems and make ONE request.",
    missions: [
      "Vấn đề thứ nhất khiến bạn không gia hạn hợp đồng",
      "Vấn đề thứ hai, KHÁC vấn đề thứ nhất",
      "Một đề nghị (request) gửi người thuê",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Ms. Andrews,",
      "Thank you for your e-mail regarding the lease for the office space at 151 South Main Street.",
      "I am writing to explain why I have decided not to renew the lease.",
      "First, the building requires major electrical and plumbing work, which will begin in September and will make the second floor unusable for several months.",
      "Second, I have received a number of complaints from other tenants about noise from your offices after ten at night.",
      "Could you confirm in writing that you will vacate the space by the end of the current lease on August 31?",
      "Please accept my thanks for the past year, and I wish your company every success.",
      "Yours sincerely,",
      "John Munro",
    ],
    note:
      "Vai chủ nhà từ chối gia hạn — tế nhị nhất trong 15 đề. Người thuê đã viết «we have been good tenants», nên hai lý do phải hợp lý và KHÔNG mang giọng buộc tội gay gắt. Câu cuối giữ quan hệ («I wish your company every success») là điểm cộng về văn phong.",
  },
  {
    id: "q67-11",
    no: 11,
    difficulty: "hard",
    email: {
      from: "Riverdale Public Library",
      to: "Neighborhood Residents",
      subject: "Library now open",
      body: [
        "Dear Neighbors,",
        "We are pleased to announce that your neighborhood library is now open! After three years of construction work, the library is now ready for use by all neighborhood residents. We offer a wide range of library services and interesting activities for the entire family. Please let us know how we can help you.",
        "Libby Mills",
        "Librarian",
      ],
    },
    directions:
      "Respond to the e-mail as a local resident who wants to use the library. In your e-mail, ask TWO questions and make ONE request.",
    missions: [
      "Câu hỏi thứ nhất về thư viện",
      "Câu hỏi thứ hai về thư viện",
      "Một đề nghị (request) — KHÔNG phải câu hỏi",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Ms. Mills,",
      "Thank you for letting us know that the neighborhood library is now open.",
      "I live on Maple Street and I am looking forward to using the library with my family.",
      "First, could you tell me what your opening hours are during the week?",
      "Second, I would like to know whether residents need to bring proof of address to obtain a library card.",
      "I would also like to request that you consider opening a small study area for students preparing for exams, as there is nowhere quiet to study in our neighborhood.",
      "An early reply would be greatly appreciated.",
      "Best regards,",
      "Bao Tran",
    ],
    note:
      "Directions ở bản gốc bị lỗi đánh máy («make ONE question») — đã sửa thành «make ONE request» cho đúng logic. Đây chính là bẫy của đề: phân biệt QUESTION (hỏi để biết thông tin) với REQUEST (đề nghị người ta LÀM một việc gì đó). Viết ba câu hỏi là mất một mission.",
  },
  {
    id: "q67-12",
    no: 12,
    difficulty: "medium",
    email: {
      from: "William Hamm",
      to: "Marilyn Hughes",
      subject: "Your subscription",
      body: [
        "Dear Ms. Hughes,",
        "You recently canceled your subscription to World Economic News magazine. We were very sorry to hear this. Our primary concern is to keep our readers well informed about economic news around the world. Please let us know the reasons why you canceled your subscription. Thank you for your time.",
        "Sincerely,",
        "William Hamm",
        "Subscriptions Editor, World Economic News",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Marilyn Hughes, a magazine subscriber. In your e-mail, describe TWO problems and make ONE suggestion.",
    missions: [
      "Vấn đề thứ nhất khiến bạn huỷ đăng ký",
      "Vấn đề thứ hai, KHÁC loại với vấn đề thứ nhất",
      "Một lời gợi ý cho toà soạn",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Mr. Hamm,",
      "Thank you for your e-mail asking why I cancelled my subscription to World Economic News.",
      "I am happy to explain the two main reasons for my decision.",
      "First, my copy arrived late almost every month, and on three occasions it did not arrive at all.",
      "Second, I found that the magazine devoted very little space to the Asian markets, which are the area I follow most closely.",
      "I would suggest that you offer subscribers a digital edition on the day of publication, so that delivery problems no longer affect readers.",
      "Thank you for taking the time to ask for my feedback.",
      "Sincerely,",
      "Marilyn Hughes",
    ],
    note:
      "Phải tự bịa hai lý do huỷ, nhưng có khung để bám: với một tạp chí thì lý do thường nằm ở nội dung, khâu giao hàng, hoặc giá. Hai vấn đề nên KHÁC LOẠI (một về dịch vụ, một về nội dung) thì mới thuyết phục.",
  },
  {
    id: "q67-13",
    no: 13,
    difficulty: "easy",
    email: {
      from: "National Business Conference",
      to: "Conference Attendees",
      subject: "Conference Registration",
      body: [
        "We have received your registration application for the National Business Conference in Middletown on Dec. 15-17. Please let us know if we can help you with information about hotels, restaurants, transportation, or anything else in Middletown.",
        "Peter Van Eyk",
        "Conference Organizer",
      ],
    },
    directions:
      "Respond to the e-mail as if you are planning to attend a conference in a strange city. In your e-mail, ask THREE questions.",
    missions: [
      "Câu hỏi thứ nhất về hội nghị hoặc thành phố",
      "Câu hỏi thứ hai",
      "Câu hỏi thứ ba",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Mr. Van Eyk,",
      "Thank you for confirming my registration for the National Business Conference in Middletown on December 15-17.",
      "As this will be my first visit to Middletown, I would like to ask a few questions.",
      "First, could you recommend a hotel within walking distance of the conference venue?",
      "Second, I would like to know whether there is a shuttle service from the airport to the venue.",
      "Finally, could you tell me what time the sessions begin on the first day?",
      "An early reply would be greatly appreciated.",
      "Yours sincerely,",
      "Linh Pham",
    ],
    note:
      "Đây là đề dễ nhất trong 15 đề: e-mail đề tự liệt kê sẵn các chủ đề có thể hỏi (hotels, restaurants, transportation), bạn chỉ cần chọn ba trong số đó và diễn đạt thành câu hỏi lịch sự.",
  },
  {
    id: "q67-14",
    no: 14,
    difficulty: "medium",
    email: {
      from: "Elaine Meyer",
      to: "Robert Krumm",
      subject: "Customer complaint",
      body: [
        "Dear Mr. Krumm:",
        "On your recent visit to the Stardust Restaurant, you filled out a customer complaint form in which you indicated that you were not satisfied with the service. In order to serve our customers better in the future, I would like to inquire why you were not happy with the service you received. I appreciate your help and hope to see you at the Stardust Restaurant soon.",
        "Sincerely,",
        "Elaine Meyer",
        "Manager, Stardust Restaurant",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Robert Krumm, a restaurant customer. In your e-mail, describe ONE problem and make TWO suggestions.",
    missions: [
      "Mô tả MỘT vấn đề cụ thể về dịch vụ",
      "Gợi ý thứ nhất để khắc phục",
      "Gợi ý thứ hai, là cách KHÁC để khắc phục",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Ms. Meyer,",
      "Thank you for your e-mail asking about the complaint form I filled out during my recent visit to the Stardust Restaurant.",
      "The main problem was the waiting time: although I had booked a table for seven o'clock, we were not served until almost eight, and no one explained the delay to us.",
      "I would suggest that your staff inform guests as soon as a delay is expected, so that customers can decide whether to wait.",
      "I would also suggest that you take fewer bookings for the same time slot on busy evenings.",
      "I hope this feedback is useful, and I would be glad to visit the restaurant again.",
      "Sincerely,",
      "Robert Krumm",
    ],
    note:
      "Kiểu Directions rất dễ làm NGƯỢC: chỉ MỘT vấn đề nhưng HAI gợi ý. Nhiều người viết hai vấn đề và một gợi ý rồi mất mission. Hai gợi ý phải cùng nhắm vào vấn đề đó nhưng theo hai cách khác nhau.",
  },
  {
    id: "q67-15",
    no: 15,
    difficulty: "medium",
    email: {
      from: "Piero Caggia",
      to: "artlesson@ikeaartstudio.com",
      subject: "Art lessons",
      sent: "August 17, 10:30 A.M.",
      body: [
        "Hello,",
        "I saw your advertisement about art lessons on the Ikeada's Art Studio Web site. I am interested in lessons for my son. Could you tell me about your qualifications and more about the lessons you provided?",
        "Thanks,",
        "Piero Caggia",
      ],
    },
    directions:
      "Respond to the e-mail as if you are the art instructor. In your e-mail, give TWO pieces of information and ONE instruction.",
    missions: [
      "Thông tin thứ nhất (bằng cấp / kinh nghiệm của bạn)",
      "Thông tin thứ hai (lịch học, học phí, nội dung lớp…)",
      "Một hướng dẫn (instruction) cho phụ huynh",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Mr. Caggia,",
      "Thank you for your e-mail of August 17 regarding art lessons for your son.",
      "I would like to let you know that I graduated from the National College of Fine Arts and have been teaching children's art classes for eleven years.",
      "Our lessons for children run on Tuesdays and Thursdays from four to six in the afternoon, and each term consists of sixteen sessions costing 240 dollars in total.",
      "Before the first lesson, please bring a sketchbook and a set of soft pencils for your son; all paints and brushes are provided by the studio.",
      "If you have any further queries, please contact me without hesitation.",
      "Best regards,",
      "Ikeada's Art Studio",
    ],
    note:
      "«ONE instruction» KHÁC với «suggestion»: instruction là HƯỚNG DẪN người ta phải làm gì (mang gì, đến lúc nào), thường viết ở dạng câu mệnh lệnh «Please bring…». Viết thành lời gợi ý «I would suggest…» là chưa đúng mission.",
  },
];

// ─────────────────────────────────────
// 6 bộ đề — mỗi mức 5 đề, chia thành 2 bộ
// ─────────────────────────────────────

export const Q67_TESTS: Q67Test[] = [
  { slug: "easy-1", label: "Bộ 1", difficulty: "easy", promptIds: ["q67-05", "q67-08"] },
  { slug: "easy-2", label: "Bộ 2", difficulty: "easy", promptIds: ["q67-13", "q67-09", "q67-03"] },
  { slug: "medium-1", label: "Bộ 1", difficulty: "medium", promptIds: ["q67-01", "q67-15"] },
  { slug: "medium-2", label: "Bộ 2", difficulty: "medium", promptIds: ["q67-02", "q67-12", "q67-14"] },
  { slug: "hard-1", label: "Bộ 1", difficulty: "hard", promptIds: ["q67-04", "q67-07"] },
  { slug: "hard-2", label: "Bộ 2", difficulty: "hard", promptIds: ["q67-06", "q67-10", "q67-11"] },
];

export const Q67_DIFF_META: Record<Q67Difficulty, { label: string; blurb: string }> = {
  easy: {
    label: "Easy",
    blurb: "Mission cùng một loại hoặc rất rõ ràng. E-mail đề dài, cho sẵn nhiều thông tin để bám vào.",
  },
  medium: {
    label: "Medium",
    blurb: "Hai đến ba mission khác loại, nhưng ngữ cảnh cụ thể nên không phải bịa nhiều.",
  },
  hard: {
    label: "Hard",
    blurb: "Phải tự nghĩ ra gần như toàn bộ nội dung, hoặc vai đòi hỏi sự tế nhị (từ chối, khiếu nại B2B).",
  },
};

/**
 * Cách giáo trình gốc chia 15 đề theo buổi học (file "WRITING PART 2.docx").
 * Web chia theo độ khó, nhưng giữ lại thông tin này để đối chiếu với lịch dạy.
 */
export const Q67_SOURCE_LESSON: Record<number, string> = {
  1: "Lesson 2 · luyện tại lớp",
  2: "Lesson 2 · luyện tại lớp",
  3: "Lesson 2 · luyện tại lớp",
  4: "Lesson 2 · BTVN",
  5: "Lesson 2 · BTVN",
  6: "Lesson 2 · BTVN",
  7: "Lesson 3 · luyện tại lớp",
  8: "Lesson 3 · luyện tại lớp",
  9: "Lesson 3 · luyện tại lớp",
  10: "Lesson 3 · luyện tại lớp",
  11: "Lesson 3 · luyện tại lớp",
  12: "Lesson 3 · BTVN",
  13: "Lesson 3 · BTVN",
  14: "Lesson 3 · BTVN",
  15: "Lesson 3 · BTVN",
};

export function getPromptById(id: string): Q67Prompt | undefined {
  return Q67_PROMPTS.find((p) => p.id === id);
}

export function getTestBySlug(slug: string): Q67Test | undefined {
  return Q67_TESTS.find((t) => t.slug === slug);
}

export function promptsOfTest(test: Q67Test): Q67Prompt[] {
  return test.promptIds.map(getPromptById).filter((p): p is Q67Prompt => Boolean(p));
}
