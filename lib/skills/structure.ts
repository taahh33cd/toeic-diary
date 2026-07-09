// Cấu trúc luyện đề chính thức TOEIC theo 4 kỹ năng.
// Mỗi kỹ năng chia thành các "unit" (Part cho L/R, Question cho S/W).

export interface SkillUnit {
  /** URL slug, vd "part1", "q1-2" */
  slug: string;
  /** Nhãn ngắn, vd "Part 1", "Questions 1–2" */
  label: string;
  /** Tên tiếng Việt của dạng bài */
  labelVi: string;
  /** Tên tiếng Anh (ETS) của dạng bài */
  labelEn: string;
  /** Mô tả ngắn dạng bài */
  description: string;
}

export interface Skill {
  slug: string;
  emoji: string;
  label: string;
  labelVi: string;
  /** Câu mô tả ở hero của trang kỹ năng */
  intro: string;
  units: SkillUnit[];
}

export const SKILLS: Skill[] = [
  {
    slug: "listening",
    emoji: "🎧",
    label: "Listening",
    labelVi: "Nghe hiểu",
    intro: "Part 1–4 · luyện theo đúng format đề thi TOEIC chính thức.",
    units: [
      { slug: "part1", label: "Part 1", labelVi: "Mô tả tranh", labelEn: "Photographs", description: "Nghe 4 câu mô tả một bức ảnh, chọn câu đúng nhất." },
      { slug: "part2", label: "Part 2", labelVi: "Hỏi – đáp", labelEn: "Question-Response", description: "Nghe câu hỏi/phát biểu ngắn, chọn phản hồi phù hợp nhất." },
      { slug: "part3", label: "Part 3", labelVi: "Hội thoại", labelEn: "Conversations", description: "Nghe đoạn hội thoại giữa 2–3 người, trả lời 3 câu hỏi." },
      { slug: "part4", label: "Part 4", labelVi: "Bài nói", labelEn: "Talks", description: "Nghe bài nói một chiều, trả lời 3 câu hỏi." },
    ],
  },
  {
    slug: "reading",
    emoji: "📖",
    label: "Reading",
    labelVi: "Đọc hiểu",
    intro: "Part 5–7 · luyện theo đúng format đề thi TOEIC chính thức.",
    units: [
      { slug: "part5", label: "Part 5", labelVi: "Hoàn thành câu", labelEn: "Incomplete Sentences", description: "Chọn từ/cụm từ điền vào chỗ trống hoàn thành câu." },
      { slug: "part6", label: "Part 6", labelVi: "Hoàn thành đoạn văn", labelEn: "Text Completion", description: "Điền từ, cụm từ và câu vào chỗ trống trong đoạn văn." },
      { slug: "part7", label: "Part 7", labelVi: "Đọc hiểu", labelEn: "Reading Comprehension", description: "Đọc đơn/đa văn bản, trả lời các câu hỏi." },
    ],
  },
  {
    slug: "speaking",
    emoji: "🗣",
    label: "Speaking",
    labelVi: "Nói",
    intro: "11 câu hỏi · luyện theo đúng format đề thi TOEIC chính thức.",
    units: [
      { slug: "q1-2",  label: "Questions 1–2",  labelVi: "Đọc to đoạn văn", labelEn: "Read a text aloud", description: "Đọc to một đoạn văn ngắn với ngữ điệu và phát âm chuẩn." },
      { slug: "q3-4",  label: "Questions 3–4",  labelVi: "Mô tả tranh", labelEn: "Describe a picture", description: "Mô tả chi tiết nội dung một bức ảnh." },
      { slug: "q5-7",  label: "Questions 5–7",  labelVi: "Trả lời câu hỏi", labelEn: "Respond to questions", description: "Trả lời trực tiếp một loạt câu hỏi về chủ đề quen thuộc." },
      { slug: "q8-10", label: "Questions 8–10", labelVi: "Trả lời theo thông tin cho trước", labelEn: "Respond using information provided", description: "Trả lời câu hỏi dựa trên thông tin (lịch trình, bảng...) cho sẵn." },
      { slug: "q11",   label: "Question 11",    labelVi: "Nêu ý kiến", labelEn: "Express an opinion", description: "Trình bày và bảo vệ quan điểm về một vấn đề." },
    ],
  },
  {
    slug: "writing",
    emoji: "✍️",
    label: "Writing",
    labelVi: "Viết",
    intro: "8 câu hỏi · luyện theo đúng format đề thi TOEIC chính thức.",
    units: [
      { slug: "q1-5", label: "Questions 1–5", labelVi: "Mô tả tranh", labelEn: "Write a sentence based on a picture", description: "Viết câu mô tả ảnh dựa trên 2 từ khóa cho trước." },
      { slug: "q6-7", label: "Questions 6–7", labelVi: "Viết email", labelEn: "Respond to a written request", description: "Đọc và viết email phản hồi theo yêu cầu." },
      { slug: "q8",   label: "Question 8",    labelVi: "Viết luận", labelEn: "Write an opinion essay", description: "Viết bài luận trình bày quan điểm về một chủ đề." },
    ],
  },
];

export function getSkill(slug: string): Skill | undefined {
  return SKILLS.find((s) => s.slug === slug);
}

export function getUnit(skillSlug: string, unitSlug: string): { skill: Skill; unit: SkillUnit } | undefined {
  const skill = getSkill(skillSlug);
  const unit = skill?.units.find((u) => u.slug === unitSlug);
  if (!skill || !unit) return undefined;
  return { skill, unit };
}
