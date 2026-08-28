// Dữ liệu luyện đề TOEIC Writing Question 8: "Write an opinion essay".
//
// 30 phút cho một bài luận, ETS nói bài hiệu quả thường tối thiểu 300 từ.
// Chấm bằng AI (rubric ETS 0-5) ở `/api/skills/writing-q8-assess`; học viên
// vẫn gửi được cho giáo viên chấm tay qua SubmissionPanel.
//
// Nguồn đề: bộ 27 file của giáo viên (3 file trùng nội dung đã loại) →
// còn 24 đề, chia theo 6 dạng câu hỏi giống khu /subskills/writing/part3.

/** Khoá `part` khi lưu vào subskill_attempts */
export const Q8_PART_KEY = "skills-writing-q8";

/** Thời lượng chuẩn đề thi thật */
export const Q8_SECONDS = 30 * 60;

/** ETS: "Typically, an effective essay will contain a minimum of 300 words." */
export const Q8_MIN_WORDS = 300;

/** Directions nguyên văn trên màn hình thi thật */
export const Q8_DIRECTIONS =
  "Read the question below. You have 30 minutes to plan, write, and revise your essay. " +
  "Typically, an effective response will contain a minimum of 300 words.";

export type Q8Form = "agree_disagree" | "choice_2" | "choice_3" | "pros_cons" | "open_q" | "policy";

export interface Q8Prompt {
  id: string;
  form: Q8Form;
  /** Số thứ tự trong dạng đề, bắt đầu từ 1 */
  index: number;
  /** Nhãn chủ đề tiếng Việt cho danh sách đề */
  topicVi: string;
  /** Đề bài nguyên văn tiếng Anh */
  question: string;
  /** Mở cho mọi người, không cần đăng ký khoá học */
  free?: boolean;
}

export const Q8_FORMS: { id: Q8Form; label: string; labelEn: string; hint: string }[] = [
  {
    id: "agree_disagree",
    label: "Đồng ý hay không đồng ý",
    labelEn: "Agree / disagree",
    hint: "Đề đưa một phát biểu, bạn chọn phe. Bẫy lớn nhất là viết nửa vời — nêu cả hai phe rồi không chốt.",
  },
  {
    id: "choice_2",
    label: "Chọn một trong hai",
    labelEn: "Choose between two options",
    hint: "Đề đưa hai lựa chọn. Phải chọn hẳn một bên ngay câu mở bài, đừng để đến kết luận mới lộ.",
  },
  {
    id: "choice_3",
    label: "Chọn một trong ba",
    labelEn: "Choose among three options",
    hint: "Ba lựa chọn cho sẵn. Chọn một và nói vì sao hai cái còn lại yếu hơn — đó là phần ăn điểm.",
  },
  {
    id: "pros_cons",
    label: "Lợi và hại",
    labelEn: "Advantages and disadvantages",
    hint: "Đề KHÔNG hỏi bạn chọn phe. Hay hỏng nhất ở dạng này là bị kéo về viết thành bài chọn phe.",
  },
  {
    id: "open_q",
    label: "Câu hỏi mở",
    labelEn: "Open question",
    hint: "Không có sẵn lựa chọn để bám. Phải tự dựng 2-3 luận điểm rồi mới viết, nếu không sẽ lan man.",
  },
  {
    id: "policy",
    label: "Nên hay không nên (chính sách)",
    labelEn: "Should / should not",
    hint: "Bàn về một quy định hoặc đề xuất. Cần nói rõ ai được lợi, ai chịu thiệt, chứ không chỉ nêu cảm nghĩ.",
  },
];

export const Q8_PROMPTS: Q8Prompt[] = [
  // ── Đồng ý / không đồng ý ──────────────────────────────────────────
  {
    id: "q8-ad-1",
    form: "agree_disagree",
    index: 1,
    topicVi: "Việc mình thích hay mức lương cao",
    question:
      "Do you agree or disagree with the following statement? It is more important to work at a job you enjoy than to make a lot of money. Support your answer with specific reasons and examples.",
    free: true,
  },
  {
    id: "q8-ad-2",
    form: "agree_disagree",
    index: 2,
    topicVi: "Học tại nhà có tốt hơn trường lớp",
    question:
      "Some parents choose to teach their children at home instead of sending them to traditional schools. From an educational point of view, do you think homeschooling is a better choice for children? Use specific reasons and examples to support your answer.",
    free: true,
  },
  {
    id: "q8-ad-3",
    form: "agree_disagree",
    index: 3,
    topicVi: "Ai cũng muốn tự làm chủ",
    question:
      "Most people would like to work for themselves over an employer. Are you in agreement with this assertion? To support your position, give precise details and justification.",
  },

  // ── Chọn một trong hai ─────────────────────────────────────────────
  {
    id: "q8-c2-1",
    form: "choice_2",
    index: 1,
    topicVi: "Ép nghỉ hưu hay để nhân viên tự quyết",
    question:
      "Some companies push employees to retire after they pass middle age. Others allow employees to stay until they want to retire. Which do you think is better from the company's point of view? Use specific reasons and examples to explain your choice.",
    free: true,
  },
  {
    id: "q8-c2-2",
    form: "choice_2",
    index: 2,
    topicVi: "Yêu việc mình làm hay chăm chỉ là đủ",
    question:
      "If people want to be successful in their field, do they have to like what they do? Some say it is a must to enjoy working to succeed. But others claim that all they need is just hard work, whether they like it or not. Compare these two views and choose the one you prefer. Use specific reasons and examples to support your opinion.",
    free: true,
  },
  {
    id: "q8-c2-3",
    form: "choice_2",
    index: 3,
    topicVi: "Tuyển người nhiều kinh nghiệm hay bằng cấp tốt",
    question:
      "Some companies prefer to hire people with a lot of experience, while others prefer to hire people with strong academic backgrounds but little work experience. Which approach do you think is better for a company? Use specific reasons and examples to support your answer.",
  },
  {
    id: "q8-c2-4",
    form: "choice_2",
    index: 4,
    topicVi: "Giám sát chặt hay trao quyền tự do",
    question:
      "Some people think employees work better when they are closely supervised. Others think employees are more productive when they are given freedom. Which do you think is better for a company? Use specific reasons and examples to support your answer.",
  },
  {
    id: "q8-c2-5",
    form: "choice_2",
    index: 5,
    topicVi: "Nhân viên chuyên sâu hay đa năng",
    question:
      "Some companies prefer employees who specialize in one specific job. Others prefer workers who can do many different tasks. From the company's point of view, which kind of employee is more valuable? Use specific reasons and examples to support your answer.",
  },
  {
    id: "q8-c2-6",
    form: "choice_2",
    index: 6,
    topicVi: "Có nên chặn mạng xã hội ở công sở",
    question:
      "Some companies block their employees from using social media networks and websites such as Facebook. Do you think managers should trust employees to use time wisely, or do you think it is smart of companies to block access to some sites? Provide reasons and examples to support your opinion.",
  },

  // ── Chọn một trong ba ──────────────────────────────────────────────
  {
    id: "q8-c3-1",
    form: "choice_3",
    index: 1,
    topicVi: "Cách tìm việc tốt nhất",
    question:
      "There are many ways to find a job: newspaper advertisements, internet job search websites, and personal recommendations. What do you think is the best way to find a job? Why? Give reasons or examples to support your opinion.",
    free: true,
  },

  // ── Lợi và hại ─────────────────────────────────────────────────────
  {
    id: "q8-pc-1",
    form: "pros_cons",
    index: 1,
    topicVi: "Làm ca đêm: lợi và hại",
    question:
      "Some workers must work at night. What are the advantages and disadvantages of night-shift work? Give reasons and examples to support your opinion.",
    free: true,
  },
  {
    id: "q8-pc-2",
    form: "pros_cons",
    index: 2,
    topicVi: "Công ty lớn và công ty nhỏ",
    question:
      "People have their own preferences when choosing companies. Some would like to work for big companies, whereas others choose to work at smaller ones. Compare the advantages of working for these two types of companies. Use appropriate reasons and examples for your opinion.",
    free: true,
  },

  // ── Câu hỏi mở ─────────────────────────────────────────────────────
  {
    id: "q8-oq-1",
    form: "open_q",
    index: 1,
    topicVi: "Điều quan trọng nhất ở một công việc",
    question:
      "What do you think are the most important characteristics for a job you have had or you want to have? Use specific details and examples to support your opinion.",
    free: true,
  },
  {
    id: "q8-oq-2",
    form: "open_q",
    index: 2,
    topicVi: "Khi nào nhân viên nên từ chối thăng chức",
    question:
      "In a company, sometimes employees refuse to be promoted. In which situations should employees be able to refuse a promotion? Give reasons and examples to support your ideas.",
    free: true,
  },
  {
    id: "q8-oq-3",
    form: "open_q",
    index: 3,
    topicVi: "Yếu tố chính để kinh doanh thành công",
    question:
      "To lead a business to success, there are many things to consider. What do you think are the main factors in running a successful business? Give specific reasons and examples.",
  },
  {
    id: "q8-oq-4",
    form: "open_q",
    index: 4,
    topicVi: "Vì sao công ty cho làm việc từ xa",
    question:
      "When it comes to the workplace, we normally think we have to go there to work. A lot of us commute to work every day. However, there are some people who work remotely at their homes or away from their offices. What do you think is the reason why some companies permit their employees to work this way?",
  },
  {
    id: "q8-oq-5",
    form: "open_q",
    index: 5,
    topicVi: "Vì sao thể thao quan trọng với con người",
    question:
      "Many people enjoy spending time playing and watching sports. Why do you think sports are important to people? Give specific reasons and examples to support your opinion.",
  },
  {
    id: "q8-oq-6",
    form: "open_q",
    index: 6,
    topicVi: "Lương thấp nhưng nhiều ngày nghỉ",
    question:
      "Some people prefer to take a job that does not pay well but does provide a lot of time off from work. What is your opinion about taking a job with a low salary that has a lot of vacation time? Give reasons for your opinion.",
  },
  {
    id: "q8-oq-7",
    form: "open_q",
    index: 7,
    topicVi: "Chuẩn bị cho buổi phỏng vấn",
    question:
      "What should a candidate do to get ready for a job interview, in your opinion? To support your response, include precise details and examples.",
  },
  {
    id: "q8-oq-8",
    form: "open_q",
    index: 8,
    topicVi: "Phẩm chất của một người sếp giỏi",
    question:
      "Taking charge of a team can be difficult. What qualities do you reckon a good boss should have? To support your response, include precise details and examples.",
  },
  {
    id: "q8-oq-9",
    form: "open_q",
    index: 9,
    topicVi: "Nghe nhạc ở nơi làm việc",
    question:
      "In the workplace, music listening is permitted in particular situations. What do you think about this? Give arguments or instances to back up your claims.",
  },

  // ── Nên hay không nên ──────────────────────────────────────────────
  {
    id: "q8-po-1",
    form: "policy",
    index: 1,
    topicVi: "Công ty có nên áp quy định trang phục",
    question:
      "Some companies enforce strict dress codes, requiring employees to adhere to specific attire, such as business suits or uniforms, while others adopt a more relaxed approach, allowing employees to dress casually. Do you think it is necessary for companies to enforce dress codes, or do you believe that employees should have the freedom to choose their attire? Provide reasons and examples to support your opinion.",
    free: true,
  },
  {
    id: "q8-po-2",
    form: "policy",
    index: 2,
    topicVi: "Cư dân chung cư có bắt buộc dự họp",
    question:
      "Do you think residents of apartment buildings should be required to attend regular meetings about building-related issues? Give reasons and examples to support your answer.",
    free: true,
  },
  {
    id: "q8-po-3",
    form: "policy",
    index: 3,
    topicVi: "Phỏng vấn tuyển dụng qua điện thoại",
    question:
      "Do you believe companies should conduct job interviews by phone? Why? Give reasons and examples to support your answer.",
  },
];

export function getQ8Prompt(id: string): Q8Prompt | undefined {
  return Q8_PROMPTS.find((p) => p.id === id);
}

export function q8FormMeta(form: Q8Form) {
  return Q8_FORMS.find((f) => f.id === form)!;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Tự đánh giá khi AI không dùng được: chỉ dựa vào độ dài, KHÔNG phải điểm ETS.
 * Dùng làm phương án dự phòng để học viên vẫn lưu được tiến độ.
 */
export function fallbackQ8Score(words: number): { rubric: 0 | 1 | 2 | 3 | 4 | 5; note: string } {
  if (words < 50) return { rubric: 0, note: "Bài gần như bỏ trống." };
  if (words < 120) return { rubric: 1, note: "Quá ngắn so với yêu cầu 300 từ." };
  if (words < 200) return { rubric: 2, note: "Chưa đủ dài để triển khai đủ lý lẽ và ví dụ." };
  if (words < 280) return { rubric: 3, note: "Gần đủ độ dài — cần thêm một ví dụ cụ thể nữa." };
  return { rubric: 4, note: "Đủ độ dài. Chưa chấm được nội dung nên tạm để mức 4." };
}
