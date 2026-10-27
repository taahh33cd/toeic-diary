import type { SentenceTopic } from "../types";

// Bộ Nhân sự & tuyển dụng — từ của tin tuyển dụng, thư mời phỏng vấn, giới
// thiệu đồng nghiệp.
//
// Hai cái bẫy lặp lại cả bộ: danh từ không đếm được (experience, training) bị
// thêm -s, và những việc mà NGƯỜI là đối tượng bị tác động (be interviewed,
// be promoted, be required) lại bị viết ở thể chủ động.

export const hrTopic: SentenceTopic = {
  slug: "hr",
  name: "Nhân sự & tuyển dụng",
  emoji: "👥",
  blurb: "Ứng tuyển, phỏng vấn, thăng chức, chế độ — nhóm từ ra câu nhiều ở Part 4 và Writing Q6-7",
  entries: [
    {
      en: "apply",
      pos: "v",
      vi: "ứng tuyển, nộp đơn",
      frame: "She decided to ___ for the marketing manager position.",
      frameAnswers: ["apply"],
      model: "She decided to apply for the marketing manager position.",
      chunks: ["She decided", "to apply", "for the marketing manager position"],
      wrong: [
        {
          text: "She decided to apply the marketing manager position.",
          why: "Ứng tuyển vị trí nào thì 'apply FOR'; 'apply something' nghĩa là áp dụng cái gì.",
        },
        {
          text: "She decided to application for the marketing manager position.",
          why: "application là danh từ; sau 'to' cần động từ.",
        },
      ],
      why: "apply for + vị trí, apply to + công ty.",
      situation: "Bạn kể với đồng nghiệp việc cô ấy nộp đơn vào vị trí quản lý marketing.",
      collocations: ["apply for a position", "apply to a company", "submit an application"],
    },
    {
      en: "candidate",
      pos: "n",
      vi: "ứng viên",
      frame: "We have shortlisted four ___ for the final round.",
      frameAnswers: ["candidates"],
      model: "We have shortlisted four candidates for the final round.",
      chunks: ["We have shortlisted", "four candidates", "for the final round"],
      wrong: [
        {
          text: "We have shortlisted four candidate for the final round.",
          why: "Sau số đếm lớn hơn một phải là danh từ số nhiều.",
        },
        {
          text: "We have shortlisted four candidates to the final round.",
          why: "Vào vòng nào thì dùng 'for the final round'.",
        },
      ],
      why: "số đếm + danh từ số nhiều; for + vòng tuyển.",
      situation: "Bạn báo trưởng phòng đã chọn được bốn ứng viên vào vòng cuối.",
      collocations: ["a strong candidate", "shortlist candidates", "the successful candidate"],
    },
    {
      en: "hire",
      pos: "v",
      vi: "tuyển, thuê",
      frame: "The company plans to ___ ten new engineers this year.",
      frameAnswers: ["hire"],
      model: "The company plans to hire ten new engineers this year.",
      chunks: ["The company plans", "to hire", "ten new engineers", "this year"],
      wrong: [
        {
          text: "The company plans to hire for ten new engineers this year.",
          why: "hire + người, không cần 'for'.",
        },
        {
          text: "The company plans hiring ten new engineers this year.",
          why: "plan TO V, không 'plan V-ing'.",
        },
      ],
      why: "plan to + V; hire + người.",
      situation: "Bạn giới thiệu kế hoạch tuyển dụng năm nay của công ty.",
      collocations: ["hire staff", "a new hire", "the hiring manager"],
    },
    {
      en: "resume",
      pos: "n",
      vi: "hồ sơ xin việc (CV)",
      frame: "Please attach your ___ and a short cover letter.",
      frameAnswers: ["resume", "résumé"],
      model: "Please attach your resume and a short cover letter.",
      chunks: ["Please attach", "your resume", "and a short cover letter"],
      wrong: [
        {
          text: "Please attach your resumes and a short cover letter.",
          why: "Mỗi ứng viên chỉ có một hồ sơ — 'your resume' số ít.",
        },
        {
          text: "Please attach to your resume and a short cover letter.",
          why: "attach + vật cần gửi; 'attach to' là gắn vật vào đâu.",
        },
      ],
      why: "attach + hồ sơ (+ to + email).",
      situation: "Bạn viết tin tuyển dụng, dặn ứng viên gửi kèm những gì.",
      collocations: ["update a resume", "a resume and cover letter", "review resumes"],
    },
    {
      en: "interview",
      pos: "v / n",
      vi: "phỏng vấn",
      frame: "You will be ___ by two managers on Thursday.",
      frameAnswers: ["interviewed"],
      model: "You will be interviewed by two managers on Thursday.",
      chunks: ["You will be interviewed", "by two managers", "on Thursday"],
      wrong: [
        {
          text: "You will be interview by two managers on Thursday.",
          why: "Bị động cần V3: 'interviewed'.",
        },
        {
          text: "You will interview by two managers on Thursday.",
          why: "Ứng viên LÀ người được phỏng vấn; thiếu 'be' thành ra họ đi phỏng vấn người khác.",
        },
      ],
      why: "will be + V3 + by + người thực hiện.",
      situation: "Bạn báo ứng viên lịch phỏng vấn và ai sẽ phỏng vấn.",
      collocations: ["a job interview", "schedule an interview", "interview a candidate"],
    },
    {
      en: "position",
      pos: "n",
      vi: "vị trí công việc",
      frame: "The ___ requires at least three years of experience.",
      frameAnswers: ["position"],
      model: "The position requires at least three years of experience.",
      chunks: ["The position requires", "at least three years", "of experience"],
      wrong: [
        {
          text: "The position require at least three years of experience.",
          why: "Chủ ngữ số ít cần 'requires'.",
        },
        {
          text: "The position requires at least three years of experiences.",
          why: "experience nghĩa 'kinh nghiệm nghề nghiệp' là danh từ không đếm được.",
        },
      ],
      why: "danh từ số ít + V-s; experience không có số nhiều.",
      situation: "Bạn giải thích yêu cầu của vị trí đang tuyển.",
      collocations: ["an open position", "apply for a position", "fill a position"],
    },
    {
      en: "promote",
      pos: "v",
      vi: "thăng chức",
      frame: "He was ___ to regional director last spring.",
      frameAnswers: ["promoted"],
      model: "He was promoted to regional director last spring.",
      chunks: ["He was promoted", "to regional director", "last spring"],
      wrong: [
        {
          text: "He was promoted as regional director last spring.",
          why: "Thăng lên chức nào dùng 'promote TO', không 'as'.",
        },
        {
          text: "He promoted to regional director last spring.",
          why: "Người ĐƯỢC thăng chức nên phải bị động: 'was promoted'.",
        },
      ],
      why: "be promoted to + chức vụ.",
      situation: "Bạn giới thiệu quá trình thăng tiến của một đồng nghiệp.",
      collocations: ["be promoted to", "earn a promotion", "a promotion opportunity"],
    },
    {
      en: "experience",
      pos: "n",
      vi: "kinh nghiệm",
      frame: "She has ten years of ___ in logistics.",
      frameAnswers: ["experience"],
      model: "She has ten years of experience in logistics.",
      chunks: ["She has", "ten years of experience", "in logistics"],
      wrong: [
        {
          text: "She has ten years of experiences in logistics.",
          why: "Nghĩa 'kinh nghiệm nghề' không đếm được — không thêm 's'.",
        },
        {
          text: "She has ten years experience of logistics.",
          why: "Thiếu 'of' sau 'years', và lĩnh vực đi với 'in'.",
        },
      ],
      why: "X years OF experience IN + lĩnh vực.",
      situation: "Bạn giới thiệu ứng viên với hội đồng phỏng vấn.",
      collocations: ["work experience", "years of experience in", "relevant experience"],
    },
    {
      en: "require",
      pos: "v",
      vi: "yêu cầu",
      frame: "All applicants are ___ to submit two references.",
      frameAnswers: ["required"],
      model: "All applicants are required to submit two references.",
      chunks: ["All applicants", "are required", "to submit", "two references"],
      wrong: [
        {
          text: "All applicants are required submit two references.",
          why: "be required TO + V — thiếu 'to' là sai cấu trúc.",
        },
        {
          text: "All applicants require to submit two references.",
          why: "Ứng viên là người BỊ yêu cầu, nên phải 'are required'.",
        },
      ],
      why: "be required to + V.",
      situation: "Bạn viết hướng dẫn nộp hồ sơ cho ứng viên.",
      collocations: ["be required to", "meet the requirements", "require approval"],
    },
    {
      en: "benefits",
      pos: "n",
      vi: "phúc lợi",
      frame: "The package includes health insurance and other ___.",
      frameAnswers: ["benefits"],
      model: "The package includes health insurance and other benefits.",
      chunks: ["The package includes", "health insurance", "and other benefits"],
      wrong: [
        {
          text: "The package includes health insurance and other benefit.",
          why: "Nói chung về chế độ đãi ngộ thì luôn số nhiều: 'benefits'.",
        },
        {
          text: "The package is included health insurance and other benefits.",
          why: "'include' ở đây chủ động: 'The package includes…'.",
        },
      ],
      why: "include + danh sách; benefits số nhiều khi chỉ chế độ.",
      situation: "Bạn trình bày chế độ đãi ngộ cho ứng viên.",
      collocations: ["employee benefits", "a benefits package", "offer benefits"],
    },
    {
      en: "resign",
      pos: "v",
      vi: "xin nghỉ việc",
      frame: "He plans to ___ at the end of the quarter.",
      frameAnswers: ["resign"],
      model: "He plans to resign at the end of the quarter.",
      chunks: ["He plans", "to resign", "at the end of the quarter"],
      wrong: [
        {
          text: "He plans to resign from at the end of the quarter.",
          why: "Hoặc 'resign' đứng một mình, hoặc 'resign from the company' — không để 'from' lửng.",
        },
        {
          text: "He plans to resignation at the end of the quarter.",
          why: "resignation là danh từ; sau 'to' cần động từ.",
        },
      ],
      why: "resign (from + nơi làm); danh từ dùng trong 'hand in a resignation'.",
      situation: "Bạn báo trưởng phòng việc một nhân viên sắp nghỉ.",
      collocations: ["resign from a position", "hand in a resignation", "a letter of resignation"],
    },
    {
      en: "training",
      pos: "n",
      vi: "việc đào tạo",
      frame: "New employees receive two weeks of ___ before starting.",
      frameAnswers: ["training"],
      model: "New employees receive two weeks of training before starting.",
      chunks: ["New employees receive", "two weeks of training", "before starting"],
      wrong: [
        {
          text: "New employees receive two weeks of trainings before starting.",
          why: "training không đếm được — không có 'trainings'.",
        },
        {
          text: "New employees receive two weeks training before starting.",
          why: "Thiếu 'of' giữa khoảng thời gian và 'training'.",
        },
      ],
      why: "X weeks OF training.",
      situation: "Bạn giới thiệu chương trình đào tạo dành cho người mới.",
      collocations: ["on-the-job training", "a training session", "undergo training"],
    },
  ],
  combos: [
    {
      words: ["apply", "position"],
      situation: "Khuyên đồng nghiệp nộp đơn vào vị trí vừa mở.",
      model: "You should apply for the position before the posting closes on Friday.",
    },
    {
      words: ["candidate", "interview"],
      situation: "Báo lịch phỏng vấn vòng cuối.",
      model: "The three remaining candidates will be interviewed on Thursday morning.",
    },
    {
      words: ["training", "benefits"],
      situation: "Giới thiệu chế độ dành cho nhân viên mới.",
      model: "New hires get two weeks of training, and the benefits start from the first day.",
    },
    {
      words: ["hire", "experience", "require"],
      situation: "Giải thích tiêu chí tuyển cho vị trí đang mở.",
      model: "We want to hire someone with logistics experience, and the role also requires fluent English.",
    },
    {
      words: ["promote", "resign", "position"],
      situation: "Kể thay đổi nhân sự trong phòng tháng vừa rồi.",
      model: "After the team leader resigned, Ms. Lopez was promoted to that position.",
    },
  ],
};
