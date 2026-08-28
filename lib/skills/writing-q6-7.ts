// Dữ liệu luyện đề TOEIC Writing Questions 6-7:
// "Respond to a written request" — đọc e-mail và viết e-mail phản hồi theo Directions.
//
// Không chấm bằng AI. Sau khi nộp, học viên đối chiếu với Model Answer và tự tick
// checklist mission + checklist hình thức; điểm ETS 0-4 được suy ra từ checklist đó.

import EXTRA_RAW from "./data/writing-q6-7-extra.json";

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
  /** số thứ tự trong bộ đề gốc của giáo viên — chỉ có ở 36 đề soạn tay */
  no?: number;
  difficulty: Q67Difficulty;
  email: Q67Email;
  directions: string;
  /** từng mission tách rời — dùng làm checklist tự chấm */
  missions: string[];
  /** chỉ số dòng trong modelAnswer ứng với từng mission (cùng thứ tự với `missions`) */
  missionLines?: number[];
  /** bài mẫu, mỗi phần tử một dòng — đề nhập từ nguồn ngoài chưa có */
  modelAnswer?: string[];
  /** lưu ý của giáo viên về cái bẫy riêng của đề này */
  note?: string;
  /** vai học viên phải đóng, bóc từ Directions ("as if you are ...") */
  role?: string;
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

const CORE_PROMPTS: Q67Prompt[] = [
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
  {
    id: "q67-16",
    no: 16,
    difficulty: "easy",
    email: {
      from: "Rachel Lin, Training Coordinator",
      to: "All staff",
      subject: "Invitation: Time Management Workshop",
      sent: "October 3, 9:20 a.m.",
      body: [
        "Dear colleagues,",
        "We are pleased to invite you to a Time Management Workshop on Friday, October 18, from two to five in the afternoon in the Lakeside Meeting Room. The session will be led by an outside trainer and places are limited to twenty people. Please reply to this e-mail if you would like to attend.",
        "Best regards,",
        "Rachel Lin, Training Coordinator",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a member of staff. In your e-mail, accept the invitation and ask TWO questions about the workshop.",
    missions: [
      "Chấp nhận lời mời một cách dứt khoát",
      "Câu hỏi thứ nhất về buổi workshop",
      "Câu hỏi thứ hai về buổi workshop",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Ms. Lin,",
      "Thank you for inviting me to the Time Management Workshop on October 18.",
      "I am pleased to confirm that I would like to attend the session.",
      "Could you tell me whether I need to prepare anything before the workshop?",
      "I would also like to know if a certificate will be issued to participants.",
      "I look forward to the session.",
      "Best regards,",
      "Hoa Le",
    ],
    note:
      "Mission «accept the invitation» đòi hỏi câu xác nhận DỨT KHOÁT. Viết «I will try to come» hay «I hope to attend» là chưa hoàn thành mission. Đề nói chỗ có hạn (20 người) nên hỏi về việc giữ chỗ cũng là câu hỏi hợp lý.",
  },
  {
    id: "q67-17",
    no: 17,
    difficulty: "easy",
    email: {
      from: "Libby Mills, Librarian",
      to: "Library members",
      subject: "Proposed change to opening hours",
      sent: "November 6, 4:15 p.m.",
      body: [
        "Dear member,",
        "We are considering closing the library at six in the evening instead of nine, and opening two hours earlier in the morning. The change would allow us to offer more morning activities for children. Before we make a decision, we would like to hear what our members think. Please write to us with your opinion.",
        "Libby Mills, Librarian",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a library member. In your e-mail, state your opinion about the proposed change and give TWO reasons.",
    missions: [
      "Nêu rõ bạn ĐỒNG Ý hay KHÔNG đồng ý với đề xuất",
      "Lý do thứ nhất",
      "Lý do thứ hai, khác lý do thứ nhất",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Ms. Mills,",
      "Thank you for asking members for their opinion about the proposed opening hours.",
      "I am afraid I do not agree with closing the library at six in the evening.",
      "First, many members work until five or six and can only visit the library after work.",
      "Second, students in our neighbourhood use the study area in the evening, and there is nowhere else quiet for them to go.",
      "I hope you will consider keeping the evening hours.",
      "Best regards,",
      "Bao Tran",
    ],
    note:
      "Dạng «state your opinion» rất hay ra trong đề thi thật. Bắt buộc nêu rõ ĐỒNG Ý hay PHẢN ĐỐI ngay trong một câu; viết lửng lơ kiểu «it has good and bad points» là mất mission. Hai lý do phải KHÁC nhau, không phải một lý do nói lại hai lần.",
  },
  {
    id: "q67-18",
    no: 18,
    difficulty: "easy",
    email: {
      from: "Seaview Hotel — Reservations",
      to: "Ms. Karen Whitfield",
      subject: "Booking confirmation KM-3382",
      sent: "May 2, 10:40 a.m.",
      body: [
        "Dear Ms. Whitfield,",
        "Thank you for booking a double room at the Seaview Hotel from June 8 to June 11. Check-in begins at three in the afternoon and check-out is at eleven in the morning. So that we can prepare for your stay, please let us know your expected arrival time and whether you will need parking.",
        "Best regards,",
        "Seaview Hotel — Reservations",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Karen Whitfield. In your e-mail, give TWO pieces of information and ask ONE question.",
    missions: [
      "Thông tin thứ nhất — giờ đến dự kiến",
      "Thông tin thứ hai — nhu cầu chỗ đỗ xe",
      "Một câu hỏi",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Reservations Team,",
      "Thank you for confirming my booking for a double room from June 8 to June 11.",
      "I expect to arrive at about half past six in the evening on June 8.",
      "I will also be travelling by car, so I would like to reserve a parking space.",
      "Could you tell me whether breakfast is included in the room rate?",
      "I look forward to my stay.",
      "Best regards,",
      "Karen Whitfield",
    ],
    note:
      "E-mail đề hỏi thẳng hai điều (giờ đến, chỗ đỗ xe) — đó chính là hai «pieces of information» bạn phải cung cấp, không phải tự nghĩ ra thông tin khác. Câu hỏi thì phải nhắm vào chỗ đề CHƯA nói: đừng hỏi giờ nhận phòng vì đề đã ghi ba giờ chiều.",
  },
  {
    id: "q67-19",
    no: 19,
    difficulty: "easy",
    email: {
      from: "Brightmart Online",
      to: "Mr. Owen Reid",
      subject: "Order #55210 confirmed",
      sent: "August 19, 2:05 p.m.",
      body: [
        "Dear Mr. Reid,",
        "Thank you for your order of one coffee machine and two boxes of filters, placed on August 19. Your order is now being prepared and you will receive a shipping notification as soon as it leaves our warehouse. You can view the status of your order at any time in your account.",
        "Brightmart Online — Customer Service",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Owen Reid. In your e-mail, ask THREE questions about your order.",
    missions: [
      "Câu hỏi thứ nhất về đơn hàng",
      "Câu hỏi thứ hai về đơn hàng",
      "Câu hỏi thứ ba về đơn hàng",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Customer Service Team,",
      "Thank you for confirming my order number 55210.",
      "I would like to ask three questions before the order is shipped.",
      "First, could you tell me when the order is expected to arrive?",
      "Second, I would like to know whether the coffee machine comes with a warranty.",
      "Finally, is it possible to change the delivery address after the order has been shipped?",
      "An early reply would be greatly appreciated.",
      "Yours sincerely,",
      "Owen Reid",
    ],
    note:
      "Ba câu hỏi nên dùng ba khuôn KHÁC nhau và đánh dấu First / Second / Finally để giám khảo đếm được ngay. Đề đã nói sẽ có thông báo khi hàng rời kho, nên đừng hỏi «bao giờ tôi được báo».",
  },
  {
    id: "q67-20",
    no: 20,
    difficulty: "easy",
    email: {
      from: "Diane Foster, Human Resources",
      to: "New employees",
      subject: "Welcome to Halcyon Media",
      sent: "February 26, 11:30 a.m.",
      body: [
        "Dear new colleague,",
        "Welcome to Halcyon Media. We are delighted that you will be joining the marketing team on Monday, March 4. Your first day will begin with an orientation session in the main building. If you have any questions before you start, please do not hesitate to write to me.",
        "Diane Foster, Human Resources",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a new employee. In your e-mail, ask THREE questions about your first day.",
    missions: [
      "Câu hỏi thứ nhất về ngày đầu đi làm",
      "Câu hỏi thứ hai về ngày đầu đi làm",
      "Câu hỏi thứ ba về ngày đầu đi làm",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Ms. Foster,",
      "Thank you for your warm welcome to Halcyon Media.",
      "I have a few questions before I start on March 4.",
      "First, could you tell me what time I should arrive at the main building?",
      "Second, I would like to know whether I need to bring any documents with me.",
      "Finally, is there a dress code that I should follow on my first day?",
      "I look forward to meeting the team.",
      "Best regards,",
      "Minh Tran",
    ],
    note:
      "Ba câu hỏi phải nằm trong phạm vi Directions cho phép: «about your first day». Hỏi về lương hay ngày nghỉ phép là lạc đề, dù ngoài đời thì hợp lý.",
  },
  {
    id: "q67-21",
    no: 21,
    difficulty: "easy",
    email: {
      from: "Gino Marchetti, Owner",
      to: "Regular customers",
      subject: "Our new spring menu",
      sent: "April 9, 5:45 p.m.",
      body: [
        "Dear valued customer,",
        "Last month we replaced several dishes on our menu with lighter spring options. Some of our regular customers have already told us what they think, and we would like to hear from more of you. Please write and tell us your opinion of the new menu.",
        "Gino Marchetti, Owner",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a regular customer. In your e-mail, state your opinion about the new menu and make ONE suggestion.",
    missions: [
      "Nêu rõ ý kiến của bạn về thực đơn mới",
      "Một lời gợi ý cho nhà hàng",
    ],
    missionLines: [2, 3],
    modelAnswer: [
      "Dear Mr. Marchetti,",
      "Thank you for asking your customers what they think of the new spring menu.",
      "In my opinion, the new menu is a clear improvement, as the lighter dishes suit the warmer weather much better.",
      "I would suggest, however, that you keep two or three of the older dishes for customers who come in the evening and want something more filling.",
      "I look forward to trying the rest of the menu.",
      "Best regards,",
      "Thao Bui",
    ],
    note:
      "Đề này chỉ có HAI mission — đừng thêm câu hỏi cho «đủ ba». Ý kiến có thể khen, chê, hoặc vừa khen vừa chê, miễn là nêu rõ lập trường; lời gợi ý phải là một hành động cụ thể nhà hàng làm được.",
  },
  {
    id: "q67-22",
    no: 22,
    difficulty: "easy",
    email: {
      from: "Pageturner Books",
      to: "Customers",
      subject: "Introducing our Reader Card",
      sent: "August 14, 10:00 a.m.",
      body: [
        "Dear customer,",
        "From September 1 we are introducing the Pageturner Reader Card. Members collect one point for every dollar they spend and receive a ten percent discount during their birthday month. You can sign up at any of our three branches.",
        "Pageturner Books",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a customer. In your e-mail, ask TWO questions and make ONE request.",
    missions: [
      "Câu hỏi thứ nhất về thẻ Reader Card",
      "Câu hỏi thứ hai về thẻ Reader Card",
      "Một đề nghị (request) — KHÔNG phải câu hỏi",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Sir or Madam,",
      "I have just read your e-mail about the new Pageturner Reader Card.",
      "First, could you tell me how many points are needed for a free book?",
      "Second, I would like to know whether points can be collected on online orders as well.",
      "I would also like to request that you send me an application form by e-mail, as I live a long way from your branches.",
      "An early reply would be greatly appreciated.",
      "Yours faithfully,",
      "Quang Ha",
    ],
    note:
      "Bẫy quen thuộc: phân biệt QUESTION (hỏi để biết) với REQUEST (đề nghị người ta LÀM một việc). Viết ba câu hỏi là mất một mission. Mở bằng «Dear Sir or Madam» thì kết bằng «Yours faithfully».",
  },
  {
    id: "q67-23",
    no: 23,
    difficulty: "medium",
    email: {
      from: "Professor Alan Grady, Career Services",
      to: "Ms. Priya Raman",
      subject: "Invitation to speak at Careers Day",
      sent: "October 8, 3:10 p.m.",
      body: [
        "Dear Ms. Raman,",
        "We would like to invite you to speak at our annual Careers Day on November 22. The session would last about forty minutes and would cover your career in digital marketing. Our students would benefit greatly from hearing about your experience. Please let us know whether you are able to join us.",
        "Professor Alan Grady, Career Services",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Priya Raman. In your e-mail, decline the invitation, give ONE reason, and make ONE suggestion.",
    missions: [
      "Từ chối lời mời một cách rõ ràng và lịch sự",
      "Nêu một lý do",
      "Một lời gợi ý cho ban tổ chức",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Professor Grady,",
      "Thank you very much for inviting me to speak at your Careers Day on November 22.",
      "I am afraid I will not be able to join you on that date.",
      "I will be attending a client conference in Singapore for the whole of that week.",
      "I would suggest inviting my colleague Daniel Pham, who leads our social media team and has spoken at student events before.",
      "I hope you will consider me for a future event.",
      "Yours sincerely,",
      "Priya Raman",
    ],
    note:
      "Từ chối lịch sự cần đủ ba phần: đệm («I am afraid»), lời từ chối RÕ RÀNG, rồi lý do. Viết «I am very busy that week» là lý do rỗng — phải cụ thể. Câu để ngỏ cho lần sau không phải mission nhưng là điểm cộng văn phong.",
  },
  {
    id: "q67-24",
    no: 24,
    difficulty: "medium",
    email: {
      from: "Martin Cole",
      to: "Fairfield Catering",
      subject: "Late delivery on May 4",
      sent: "May 5, 9:05 a.m.",
      body: [
        "Dear Sir or Madam,",
        "We booked your catering service for our office anniversary lunch on May 4. The food was due at twelve o'clock but did not arrive until almost one, by which time half of our guests had already left. We would like an explanation.",
        "Sincerely,",
        "Martin Cole",
      ],
    },
    directions:
      "Respond to the e-mail as if you are the manager of Fairfield Catering. In your e-mail, apologize, explain ONE reason, and make ONE offer.",
    missions: [
      "Một lời xin lỗi về việc giao đồ ăn muộn",
      "Giải thích một lý do khiến sự cố xảy ra",
      "Một đề nghị bồi thường cho khách",
    ],
    missionLines: [3, 2, 4],
    modelAnswer: [
      "Dear Mr. Cole,",
      "Thank you for letting us know about the delivery to your office on May 4.",
      "Our delivery van was held up by emergency roadworks on Bridge Street, and our driver was unable to reach you before one o'clock.",
      "I would like to apologize for the late arrival of your order and for the effect it had on your event.",
      "To make up for the inconvenience, we would like to offer your company a twenty percent discount on your next booking.",
      "Once again, please accept my sincere apology.",
      "Sincerely,",
      "Fairfield Catering",
    ],
    note:
      "Dạng «make an offer» — thứ bạn CHO khách, không phải điều bạn xin. Chú ý thứ tự trong bài mẫu: giải thích lý do đứng TRƯỚC lời xin lỗi, để người đọc hiểu chuyện gì đã xảy ra rồi mới nghe xin lỗi. Directions liệt kê theo thứ tự khác cũng không sao.",
  },
  {
    id: "q67-25",
    no: 25,
    difficulty: "medium",
    email: {
      from: "Ardent Fitness — Membership",
      to: "All members",
      subject: "Membership fees from January",
      sent: "December 2, 1:20 p.m.",
      body: [
        "Dear member,",
        "From January 1 our monthly membership fee will rise from 45 dollars to 52 dollars. The increase will allow us to replace our cardio equipment and to extend our opening hours at the weekend. We welcome comments from members before the change takes effect.",
        "Ardent Fitness — Membership",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a member. In your e-mail, state your opinion about the increase and ask TWO questions.",
    missions: [
      "Nêu rõ ý kiến của bạn về việc tăng phí",
      "Câu hỏi thứ nhất",
      "Câu hỏi thứ hai",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Membership Team,",
      "Thank you for letting members know about the change to the monthly fee.",
      "In my opinion, an increase of seven dollars is acceptable if the new equipment arrives quickly, but it is a large rise to introduce all at once.",
      "Could you tell me when the new cardio equipment will be installed?",
      "I would also like to know whether members who joined this year will keep the current rate until their renewal date.",
      "I would appreciate a reply before the end of December.",
      "Best regards,",
      "Linh Pham",
    ],
    note:
      "Ý kiến có thể là «đồng ý có điều kiện» như bài mẫu — vẫn tính là hoàn thành mission vì có lập trường rõ. Hai câu hỏi phải nhắm vào chỗ đề CHƯA nói: đừng hỏi phí mới là bao nhiêu vì đề đã ghi 52 đô la.",
  },
  {
    id: "q67-26",
    no: 26,
    difficulty: "medium",
    email: {
      from: "Owen Barrett, IT Support",
      to: "All staff",
      subject: "Laptop replacement programme",
      sent: "May 27, 8:50 a.m.",
      body: [
        "Dear colleagues,",
        "We will be replacing all staff laptops between June 10 and June 21. So that we can plan the schedule, please reply to this e-mail with the model of laptop you currently use and the software you will need installed on the new machine.",
        "Owen Barrett, IT Support",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a member of staff. In your e-mail, give TWO pieces of information and make ONE request.",
    missions: [
      "Thông tin thứ nhất — máy hiện tại của bạn",
      "Thông tin thứ hai — phần mềm bạn cần cài",
      "Một đề nghị gửi phòng IT",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Mr. Barrett,",
      "Thank you for your e-mail about the laptop replacement programme.",
      "I currently use a Vantage X13, which was issued to me in March last year.",
      "On the new machine I will need the full design suite and the video editing software that our team uses.",
      "I would also like to request that my replacement be scheduled for the week of June 17, as I will be away on a client visit the week before.",
      "Please let me know if you need any further details.",
      "Best regards,",
      "Hoa Le",
    ],
    note:
      "Hai thông tin đã được e-mail đề hỏi thẳng — cứ trả lời đúng hai điều đó, đừng kể thêm chuyện khác. Đề nghị phải là việc phòng IT làm được (đổi lịch), không phải điều ngoài tầm họ.",
  },
  {
    id: "q67-27",
    no: 27,
    difficulty: "medium",
    email: {
      from: "Northgate Travel",
      to: "Mr. Duc Nguyen",
      subject: "Your recent tour of northern Italy",
      sent: "September 18, 4:30 p.m.",
      body: [
        "Dear Mr. Nguyen,",
        "We hope you enjoyed your eight-day tour of northern Italy last month. We are always trying to improve our tours, so we would be grateful if you could tell us what you thought of it.",
        "Northgate Travel — Customer Experience",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Duc Nguyen. In your e-mail, state your opinion about the tour and describe TWO problems.",
    missions: [
      "Nêu ý kiến chung của bạn về chuyến đi",
      "Vấn đề thứ nhất, mô tả cụ thể",
      "Vấn đề thứ hai, khác loại với vấn đề thứ nhất",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Sir or Madam,",
      "Thank you for asking for my feedback on the eight-day tour of northern Italy.",
      "On the whole I enjoyed the tour, and the guide in Verona was excellent, but two things spoiled the trip for me.",
      "First, the hotel in Milan was much further from the city centre than the brochure suggested, and we spent nearly an hour travelling each morning.",
      "Second, the coach was changed halfway through the tour and the replacement had no air conditioning.",
      "I hope this feedback is useful for your future tours.",
      "Sincerely,",
      "Duc Nguyen",
    ],
    note:
      "Mission «state your opinion» ở đây khác «describe problems»: câu ý kiến là đánh giá TỔNG THỂ, hai câu sau mới là sự cố cụ thể. Nếu bạn viết ngay hai vấn đề mà không có câu đánh giá chung là mất một mission.",
  },
  {
    id: "q67-28",
    no: 28,
    difficulty: "medium",
    email: {
      from: "Brookside Property Management",
      to: "Ms. Hannah Reyes",
      subject: "Rent review for apartment 12B",
      sent: "January 15, 2:40 p.m.",
      body: [
        "Dear Ms. Reyes,",
        "We are writing to inform you that the monthly rent for apartment 12B will increase by six percent from March 1. The new rate reflects the improvements made to the building over the past year. Your current lease runs until August 31.",
        "Brookside Property Management",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Hannah Reyes. In your e-mail, ask TWO questions and make ONE request.",
    missions: [
      "Câu hỏi thứ nhất về việc tăng tiền thuê",
      "Câu hỏi thứ hai",
      "Một đề nghị gửi ban quản lý",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Property Manager,",
      "Thank you for your e-mail about the rent review for apartment 12B.",
      "Could you tell me which improvements the increase is intended to cover?",
      "I would also like to know whether the rent will be reviewed again before my lease ends in August.",
      "I would like to request a meeting to discuss the increase before it takes effect on March 1.",
      "I would appreciate a reply within the next two weeks.",
      "Sincerely,",
      "Hannah Reyes",
    ],
    note:
      "Đừng hỏi «tăng bao nhiêu» hay «từ bao giờ» — đề đã ghi rõ sáu phần trăm và ngày 1 tháng 3. Câu request nên nêu mốc thời gian («before it takes effect on March 1») để có sức nặng.",
  },
  {
    id: "q67-29",
    no: 29,
    difficulty: "medium",
    email: {
      from: "Vertex Paper Company",
      to: "Purchasing Department, Alden Office Supplies",
      subject: "Product discontinuation",
      sent: "October 21, 11:15 a.m.",
      body: [
        "Dear Sir or Madam,",
        "We are writing to let you know that our Everline recycled paper will be discontinued at the end of this year. Existing stock will be sold until December 31. We can recommend alternative products from our range if you wish.",
        "Vertex Paper Company",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a purchasing manager at Alden Office Supplies. In your e-mail, ask ONE question, make ONE request, and give ONE piece of information.",
    missions: [
      "Một câu hỏi về sản phẩm thay thế",
      "Một đề nghị gửi nhà cung cấp",
      "Một thông tin về nhu cầu của công ty bạn",
    ],
    missionLines: [2, 3, 4],
    modelAnswer: [
      "Dear Sir or Madam,",
      "Thank you for letting us know that the Everline recycled paper will be discontinued.",
      "Could you tell me which alternative product is closest to Everline in weight and brightness?",
      "I would like to request samples of two alternatives so that we can test them with our own customers.",
      "You may find it useful to know that we currently order around forty boxes of Everline each month, so we will need a replacement in place before January.",
      "I would appreciate a reply before the end of the month.",
      "Yours faithfully,",
      "Peter Nowak",
    ],
    note:
      "Ba mission KHÁC LOẠI nhau, mỗi loại một câu riêng — đây là kiểu Directions dễ làm sót nhất. «Give ONE piece of information» nghĩa là bạn CUNG CẤP thông tin cho họ, không phải hỏi thêm.",
  },
  {
    id: "q67-30",
    no: 30,
    difficulty: "hard",
    email: {
      from: "Sandra Kim, Recruitment Team",
      to: "Mr. Daniel Pham",
      subject: "Offer of employment",
      sent: "May 12, 10:05 a.m.",
      body: [
        "Dear Mr. Pham,",
        "Following your second interview, we are delighted to offer you the position of Marketing Assistant at Brightline Media, starting on June 3. The full details of the offer are in the attached letter. Please let us know your decision by May 20.",
        "Sandra Kim, Recruitment Team",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Daniel Pham. In your e-mail, decline the offer, give TWO reasons, and make ONE request.",
    missions: [
      "Từ chối lời mời làm việc một cách rõ ràng và lịch sự",
      "Lý do thứ nhất",
      "Lý do thứ hai, khác lý do thứ nhất",
      "Một đề nghị gửi nhà tuyển dụng",
    ],
    missionLines: [2, 3, 4, 5],
    modelAnswer: [
      "Dear Ms. Kim,",
      "Thank you very much for offering me the position of Marketing Assistant at Brightline Media.",
      "After careful thought, I am afraid I have decided not to accept the offer.",
      "First, I have been offered a role much closer to home, which will reduce my daily travel by nearly two hours.",
      "Second, that position includes the further training in data analysis that I mentioned during my interview.",
      "I would like to request that you keep my details on file, as I would be glad to be considered for future openings.",
      "Thank you again for the time your team gave me.",
      "Yours sincerely",
      "Daniel Pham",
    ],
    note:
      "Từ chối lời mời việc là tình huống tế nhị nhất: phải dứt khoát nhưng không được cộc lốc, và lý do phải thật sự thuyết phục chứ không phải «I found another job». Bốn mission nên mỗi mission một câu riêng, đừng gộp hai lý do vào một câu.",
  },
  {
    id: "q67-31",
    no: 31,
    difficulty: "hard",
    email: {
      from: "Tara Willis",
      to: "Kingsway Fashion",
      subject: "Return of a wool coat",
      sent: "February 19, 6:20 p.m.",
      body: [
        "Dear Sir or Madam,",
        "I bought a wool coat from your Kingsway store in November and would like to return it for a full refund. I no longer have the receipt, and the coat has been worn a few times, but I am simply not happy with the way it fits. Please let me know how to proceed.",
        "Tara Willis",
      ],
    },
    directions:
      "Respond to the e-mail as if you are the store manager. In your e-mail, apologize, explain TWO reasons why a full refund is not possible, and make ONE offer.",
    missions: [
      "Một lời xin lỗi",
      "Lý do thứ nhất không thể hoàn tiền",
      "Lý do thứ hai, khác lý do thứ nhất",
      "Một đề nghị bù đắp cho khách",
    ],
    missionLines: [2, 3, 4, 5],
    modelAnswer: [
      "Dear Ms. Willis,",
      "Thank you for writing to us about the wool coat you bought in November.",
      "I would like to apologize that you are not happy with the way the coat fits.",
      "Unfortunately, our returns policy allows refunds only within thirty days of purchase, and your coat was bought more than three months ago.",
      "In addition, we are able to refund worn items only when they are faulty, and the coat you describe does not appear to have a fault.",
      "I would, however, like to offer you a store credit for half the purchase price, which you may use on any item in our winter range.",
      "I am sorry that we cannot do more on this occasion.",
      "Yours sincerely,",
      "Kingsway Fashion",
    ],
    note:
      "Từ chối khách mà vẫn giữ được khách — kỹ thuật khó nhất của Part 2. Hai lý do phải dựa trên CHÍNH SÁCH cụ thể, không phải cảm tính; và bắt buộc phải có lời đề nghị bù đắp, nếu không thư chỉ là lời từ chối trần trụi.",
  },
  {
    id: "q67-32",
    no: 32,
    difficulty: "hard",
    email: {
      from: "Marco Ruiz",
      to: "Ms. Hoa Le",
      subject: "Taking over the Denton account",
      sent: "June 24, 3:35 p.m.",
      body: [
        "Dear Hoa,",
        "As you know, I will be on leave from July 8 for six weeks. I would like to ask you to take over the Denton account while I am away. It usually takes about a day a week. Please let me know if this is possible.",
        "Marco Ruiz",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Hoa Le. In your e-mail, explain TWO problems and make ONE suggestion.",
    missions: [
      "Vấn đề thứ nhất khiến bạn khó nhận việc",
      "Vấn đề thứ hai, khác vấn đề thứ nhất",
      "Một lời gợi ý để giải quyết",
    ],
    missionLines: [3, 4, 5],
    modelAnswer: [
      "Dear Mr. Ruiz,",
      "Thank you for asking me to look after the Denton account during your leave.",
      "I am afraid there are two problems that make this difficult for me.",
      "First, I am already covering the Preston account for Anna until the end of August, which takes up two days of my week.",
      "Second, I have never worked with the Denton team and would need training on their reporting system before I could take over.",
      "I would suggest that the account be split between me and Sam Ortiz, so that neither of us carries the whole workload alone.",
      "Please let me know what you think.",
      "Best regards,",
      "Hoa Le",
    ],
    note:
      "Phải TỰ BỊA hoàn toàn hai vấn đề — đề không cho dữ kiện nào về lịch làm việc của bạn. Từ chối đồng nghiệp cần giọng hợp tác: nêu khó khăn rồi đề xuất giải pháp, không phải từ chối thẳng. Câu «there are two problems» chỉ là câu dẫn, không tính là mission.",
  },
  {
    id: "q67-33",
    no: 33,
    difficulty: "hard",
    email: {
      from: "Joan Andrews, Andrews Systems",
      to: "Meridian Consulting",
      subject: "Draft report",
      sent: "March 6, 9:40 a.m.",
      body: [
        "Dear Sir or Madam,",
        "We received your draft report yesterday. Several of the figures in section three do not match the data we supplied, and the section on staffing was left out entirely. We need a corrected version before our board meeting on the fourteenth.",
        "Joan Andrews, President",
      ],
    },
    directions:
      "Respond to the e-mail as if you are the consultant who wrote the report. In your e-mail, apologize, explain ONE reason, and ask TWO questions.",
    missions: [
      "Một lời xin lỗi về bản báo cáo",
      "Giải thích một lý do khiến sai sót xảy ra",
      "Câu hỏi thứ nhất",
      "Câu hỏi thứ hai",
    ],
    missionLines: [3, 2, 4, 5],
    modelAnswer: [
      "Dear Ms. Andrews,",
      "Thank you for reviewing the draft report so quickly.",
      "An earlier version of your data set was used when section three was prepared, and the staffing section was still with our analyst when the draft was sent out.",
      "I would like to apologize for sending you a draft that was both incomplete and inaccurate.",
      "Could you confirm which version of the staffing data we should use?",
      "I would also like to know whether the corrected report needs to reach you before the fourteenth or on the day itself.",
      "We will have the revised version with you within three working days.",
      "Yours sincerely,",
      "Meridian Consulting",
    ],
    note:
      "Khách đang gấp (họp hội đồng ngày 14) nên câu cam kết thời gian ở cuối là bắt buộc về mặt văn phong, dù Directions không yêu cầu. Hai câu hỏi phải giúp bạn sửa được báo cáo, không phải hỏi cho có.",
  },
  {
    id: "q67-34",
    no: 34,
    difficulty: "hard",
    email: {
      from: "Middletown City Council",
      to: "Residents",
      subject: "Proposed closure of Elmwood Pool",
      sent: "November 4, 5:00 p.m.",
      body: [
        "Dear resident,",
        "The council is considering closing Elmwood Swimming Pool at the end of the year. The building needs repairs costing more than two million dollars, and use has fallen by a third since the new sports centre opened. Residents are invited to send their views before December 1.",
        "Middletown City Council",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a local resident. In your e-mail, state your opinion, give TWO reasons, and make ONE request.",
    missions: [
      "Nêu rõ lập trường của bạn về việc đóng cửa bể bơi",
      "Lý do thứ nhất",
      "Lý do thứ hai, khác lý do thứ nhất",
      "Một đề nghị gửi hội đồng thành phố",
    ],
    missionLines: [2, 3, 4, 5],
    modelAnswer: [
      "Dear Sir or Madam,",
      "Thank you for inviting residents to comment on the proposed closure of Elmwood Pool.",
      "I am strongly opposed to closing the pool at the end of the year.",
      "First, the new sports centre is on the other side of the city and cannot be reached by bus from our neighbourhood.",
      "Second, Elmwood is the only pool in Middletown with a shallow teaching area, and three local schools use it for swimming lessons.",
      "I would like to request that the council publish the full repair costs and consider a phased programme of work before any decision is taken.",
      "I hope the views of local residents will be taken into account.",
      "Yours faithfully,",
      "Bao Tran",
    ],
    note:
      "Đề đưa sẵn hai lý lẽ ỦNG HỘ việc đóng cửa (chi phí sửa, lượng người giảm) — bài viết tốt phải phản biện lại chúng chứ không nói lảng sang chuyện khác. Đây là dạng khó nhất vì phải lập luận, không chỉ kể.",
  },
  {
    id: "q67-35",
    no: 35,
    difficulty: "hard",
    email: {
      from: "Sam Ortiz",
      to: "Ms. Ngozi Okafor",
      subject: "Request to work from home",
      sent: "July 2, 8:15 a.m.",
      body: [
        "Dear Ms. Okafor,",
        "I would like to ask whether I could work from home three days a week from next month. My commute has become much longer since I moved, and I find that I concentrate better at home. Please let me know if this would be possible.",
        "Sam Ortiz",
      ],
    },
    directions:
      "Respond to the e-mail as if you are Ngozi Okafor, the department manager. In your e-mail, state your decision, explain TWO reasons, and make ONE request.",
    missions: [
      "Nêu quyết định dứt khoát của bạn",
      "Lý do thứ nhất cho quyết định đó",
      "Lý do thứ hai, khác lý do thứ nhất",
      "Một đề nghị gửi nhân viên",
    ],
    missionLines: [2, 3, 4, 5],
    modelAnswer: [
      "Dear Mr. Ortiz,",
      "Thank you for your e-mail about working from home three days a week.",
      "I am able to approve two days a week rather than the three you requested.",
      "The main reason is that our team meets clients on Tuesdays and Thursdays, and those meetings need someone from your team in the office.",
      "In addition, our department policy allows a maximum of two days of remote work while the new system is being introduced.",
      "Could you let me know by Friday which two days you would prefer?",
      "I hope this arrangement will still make your journey easier.",
      "Best regards,",
      "Ngozi Okafor",
    ],
    note:
      "Đồng ý MỘT PHẦN là dạng khó: phải nêu rõ bạn duyệt cái gì và không duyệt cái gì ngay một câu. Viết «I will think about it» hay «maybe two days» là chưa hoàn thành mission «state your decision».",
  },
  {
    id: "q67-36",
    no: 36,
    difficulty: "hard",
    email: {
      from: "Victor Lam, Regional Manager, Crestline Retail",
      to: "Brightlite Supplies",
      subject: "Our supply agreement",
      sent: "February 27, 4:05 p.m.",
      body: [
        "Dear Sir or Madam,",
        "Our supply agreement is due for renewal in April. Before we make a decision, we would like to be open with you: we are seriously considering moving to another supplier. We would welcome your response.",
        "Victor Lam, Regional Manager",
      ],
    },
    directions:
      "Respond to the e-mail as if you are a manager at Brightlite Supplies. In your e-mail, state your opinion, describe TWO problems, and make ONE suggestion.",
    missions: [
      "Nêu rõ quan điểm của bạn về việc gia hạn hợp đồng",
      "Vấn đề thứ nhất bạn thừa nhận",
      "Vấn đề thứ hai, khác vấn đề thứ nhất",
      "Một lời gợi ý để giữ hợp đồng",
    ],
    missionLines: [2, 3, 4, 5],
    modelAnswer: [
      "Dear Mr. Lam,",
      "Thank you for being open with us about the renewal of our supply agreement.",
      "In my opinion, our two companies have worked well together for three years, and it would be a mistake to end the agreement now.",
      "I accept that there have been problems on our side: our delivery times slipped during the autumn while our northern depot was being rebuilt.",
      "I also recognise that our price increase in July was announced with only three weeks' notice, which gave your team very little time to plan.",
      "I would suggest that we meet before the end of March to agree a service level that we commit to in writing for the coming year.",
      "I hope you will give us the chance to put things right.",
      "Yours sincerely,",
      "Brightlite Supplies",
    ],
    note:
      "Đề khó nhất trong bộ: bạn phải TỰ NÊU RA lỗi của chính mình («describe TWO problems») trong khi vẫn thuyết phục đối tác ở lại. Thừa nhận thẳng thắn rồi đề xuất cam kết cụ thể là cách duy nhất để thư có sức nặng — chối lỗi thì mất mission.",
  },
];

// ─────────────────────────────────────
// 18 bộ đề — mỗi mức 12 đề, chia thành 6 bộ × 2 câu như đề thi thật
// ─────────────────────────────────────

const CORE_TESTS: Q67Test[] = [
  { slug: "easy-1", label: "Bộ 1", difficulty: "easy", promptIds: ["q67-05", "q67-08"] },
  { slug: "easy-2", label: "Bộ 2", difficulty: "easy", promptIds: ["q67-13", "q67-09"] },
  { slug: "easy-3", label: "Bộ 3", difficulty: "easy", promptIds: ["q67-19", "q67-20"] },
  { slug: "easy-4", label: "Bộ 4", difficulty: "easy", promptIds: ["q67-03", "q67-18"] },
  { slug: "easy-5", label: "Bộ 5", difficulty: "easy", promptIds: ["q67-16", "q67-22"] },
  { slug: "easy-6", label: "Bộ 6", difficulty: "easy", promptIds: ["q67-17", "q67-21"] },
  { slug: "medium-1", label: "Bộ 1", difficulty: "medium", promptIds: ["q67-01", "q67-15"] },
  { slug: "medium-2", label: "Bộ 2", difficulty: "medium", promptIds: ["q67-02", "q67-24"] },
  { slug: "medium-3", label: "Bộ 3", difficulty: "medium", promptIds: ["q67-12", "q67-27"] },
  { slug: "medium-4", label: "Bộ 4", difficulty: "medium", promptIds: ["q67-14", "q67-25"] },
  { slug: "medium-5", label: "Bộ 5", difficulty: "medium", promptIds: ["q67-23", "q67-29"] },
  { slug: "medium-6", label: "Bộ 6", difficulty: "medium", promptIds: ["q67-26", "q67-28"] },
  { slug: "hard-1", label: "Bộ 1", difficulty: "hard", promptIds: ["q67-04", "q67-07"] },
  { slug: "hard-2", label: "Bộ 2", difficulty: "hard", promptIds: ["q67-06", "q67-10"] },
  { slug: "hard-3", label: "Bộ 3", difficulty: "hard", promptIds: ["q67-11", "q67-32"] },
  { slug: "hard-4", label: "Bộ 4", difficulty: "hard", promptIds: ["q67-30", "q67-35"] },
  { slug: "hard-5", label: "Bộ 5", difficulty: "hard", promptIds: ["q67-31", "q67-33"] },
  { slug: "hard-6", label: "Bộ 6", difficulty: "hard", promptIds: ["q67-34", "q67-36"] },
];


// ─────────────────────────────────────
// 48 đề nhập từ bộ đề ngoài (scripts/import-writing-q6-7-extra.ts)
//
// Khác 36 đề trên: CHƯA có Model Answer và ghi chú bẫy. Mission được tách tự động
// từ dòng Directions nên vẫn tự chấm bằng checklist được như thường.
// ─────────────────────────────────────

type ExtraRaw = {
  id: string;
  difficulty: Q67Difficulty;
  email: Q67Email;
  directions: string;
  missions: string[];
  role: string;
};

const EXTRA_PROMPTS: Q67Prompt[] = (EXTRA_RAW as ExtraRaw[]).map((p) => ({
  id: p.id,
  difficulty: p.difficulty,
  email: p.email,
  directions: p.directions,
  missions: p.missions,
  role: p.role || undefined,
}));

export const Q67_PROMPTS: Q67Prompt[] = [...CORE_PROMPTS, ...EXTRA_PROMPTS];

/** Đề chưa có bài mẫu → màn kết quả ẩn cột Model Answer, chỉ tự chấm bằng checklist. */
export function hasModelAnswer(p: Q67Prompt): boolean {
  return Boolean(p.modelAnswer?.length);
}

/**
 * Ghép 48 đề mới thành bộ 2 câu, nối tiếp số thứ tự của từng mức độ.
 * Đề lẻ của mức này được ghép với đề lẻ của mức kia, bộ đó lấy mức khó hơn.
 */
function buildExtraTests(): Q67Test[] {
  const ORDER: Q67Difficulty[] = ["easy", "medium", "hard"];
  const nextIndex: Record<Q67Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const t of CORE_TESTS) nextIndex[t.difficulty]++;

  const tests: Q67Test[] = [];
  const leftovers: Q67Prompt[] = [];

  for (const diff of ORDER) {
    const pool = EXTRA_PROMPTS.filter((p) => p.difficulty === diff);
    for (let i = 0; i + 1 < pool.length; i += 2) {
      const n = ++nextIndex[diff];
      tests.push({ slug: `${diff}-${n}`, label: `Bộ ${n}`, difficulty: diff, promptIds: [pool[i].id, pool[i + 1].id] });
    }
    if (pool.length % 2 === 1) leftovers.push(pool[pool.length - 1]);
  }

  for (let i = 0; i + 1 < leftovers.length; i += 2) {
    const a = leftovers[i];
    const b = leftovers[i + 1];
    const diff = ORDER[Math.max(ORDER.indexOf(a.difficulty), ORDER.indexOf(b.difficulty))];
    const n = ++nextIndex[diff];
    tests.push({ slug: `${diff}-${n}`, label: `Bộ ${n}`, difficulty: diff, promptIds: [a.id, b.id] });
  }

  return tests;
}

export const Q67_TESTS: Q67Test[] = [...CORE_TESTS, ...buildExtraTests()];

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
  16: "Đề bổ sung · soạn theo chuẩn ETS",
  17: "Đề bổ sung · soạn theo chuẩn ETS",
  18: "Đề bổ sung · soạn theo chuẩn ETS",
  19: "Đề bổ sung · soạn theo chuẩn ETS",
  20: "Đề bổ sung · soạn theo chuẩn ETS",
  21: "Đề bổ sung · soạn theo chuẩn ETS",
  22: "Đề bổ sung · soạn theo chuẩn ETS",
  23: "Đề bổ sung · soạn theo chuẩn ETS",
  24: "Đề bổ sung · soạn theo chuẩn ETS",
  25: "Đề bổ sung · soạn theo chuẩn ETS",
  26: "Đề bổ sung · soạn theo chuẩn ETS",
  27: "Đề bổ sung · soạn theo chuẩn ETS",
  28: "Đề bổ sung · soạn theo chuẩn ETS",
  29: "Đề bổ sung · soạn theo chuẩn ETS",
  30: "Đề bổ sung · soạn theo chuẩn ETS",
  31: "Đề bổ sung · soạn theo chuẩn ETS",
  32: "Đề bổ sung · soạn theo chuẩn ETS",
  33: "Đề bổ sung · soạn theo chuẩn ETS",
  34: "Đề bổ sung · soạn theo chuẩn ETS",
  35: "Đề bổ sung · soạn theo chuẩn ETS",
  36: "Đề bổ sung · soạn theo chuẩn ETS",
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
