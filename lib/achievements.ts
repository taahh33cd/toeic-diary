export interface Achievement {
  id: string;
  icon: string;
  label: string;
  desc: string;
  unlocked: boolean;
  progress?: number;
}

export const ACHIEVEMENTS: Omit<Achievement, "unlocked" | "progress">[] = [
  { id: "first_lesson",  icon: "🎯", label: "Bắt đầu",       desc: "Hoàn thành bài đầu tiên" },
  { id: "ten_lessons",   icon: "🔥", label: "Đà học tập",     desc: "Hoàn thành 10 bài ≥70" },
  { id: "fifty_lessons", icon: "💪", label: "Kiên trì",        desc: "Hoàn thành 50 bài ≥70" },
  { id: "hundred",       icon: "🏆", label: "Chiến binh",      desc: "Hoàn thành 100 bài ≥70" },
  { id: "streak7",       icon: "📅", label: "Streak 7 ngày",  desc: "Học 7 ngày liên tiếp" },
  { id: "streak30",      icon: "🌟", label: "Streak 30 ngày", desc: "Học 30 ngày liên tiếp" },
  { id: "perfect",       icon: "💯", label: "Hoàn hảo",        desc: "Đạt 100 điểm một bài" },
  { id: "all_parts",     icon: "🗺️", label: "Toàn diện",       desc: "Hoàn thành ít nhất 1 bài mỗi Part" },
  { id: "speed_demon",   icon: "⚡", label: "Tốc chiến",       desc: "Hoàn thành 5 bài trong 1 ngày" },
  { id: "full_test",     icon: "📋", label: "Đề đầu tiên",    desc: "Hoàn thành toàn bộ 1 bộ đề" },

  // ── Journal/Admin platform expansion ──
  { id: "vocab_master",   icon: "📚", label: "Thợ săn từ",      desc: "Review 100 thẻ vocab" },
  { id: "vocab_legend",   icon: "🧠", label: "Vocab Legend",   desc: "Master 50 từ vựng" },
  { id: "marathon",       icon: "🏅", label: "Marathon",        desc: "Streak 30 ngày liên tiếp" },
  { id: "centurion",      icon: "💎", label: "Centurion",       desc: "Streak 100 ngày liên tiếp" },
  { id: "homework_hero",  icon: "📝", label: "Hero bài tập",    desc: "Nộp 20 homework đúng hạn" },
  { id: "test_taker",     icon: "📊", label: "Người luyện đề", desc: "Ghi 10 lần điểm test" },
  { id: "perfectionist",  icon: "✨", label: "Cầu toàn",        desc: "10 bài đạt 100 điểm" },
  { id: "early_bird",     icon: "🌅", label: "Dậy sớm",         desc: "Login 7 ngày trước 8h sáng" },
  { id: "night_owl",      icon: "🌙", label: "Cú đêm",          desc: "Login 7 ngày sau 22h" },
  { id: "polyglot",       icon: "🗣️", label: "Đa năng",         desc: "50 vocab + 50 lessons" },
  { id: "class_star",     icon: "⭐", label: "Sao của lớp",     desc: "Top 1 lớp trong tuần" },
];
