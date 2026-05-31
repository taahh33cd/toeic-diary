import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { LandingHeader } from "@/components/home/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import {
  Headphones, GraduationCap, BookOpen, NotebookPen,
  Image, MessageSquare, Users, Megaphone, ChevronRight, CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: <Headphones size={28} className="text-[#4DA8DA]" />,
    color: "#4DA8DA",
    title: "Dictation — Luyện nghe chép",
    desc: "Nghe audio TOEIC rồi tự gõ lại từng câu. Phương pháp chủ động nhất để cải thiện khả năng nghe.",
    href: "/dictation",
    parts: ["Part 1 · Photographs", "Part 2 · Question-Response", "Part 3 · Conversations", "Part 4 · Talks"],
  },
  {
    icon: <GraduationCap size={28} className="text-[#4DA86A]" />,
    color: "#4DA86A",
    title: "Grammar — Ngữ pháp",
    desc: "Luyện ngữ pháp theo 11 chủ đề trọng tâm của TOEIC. Có ngân hàng câu sai để ôn tập lại.",
    href: "/grammar",
    parts: ["11 chủ đề ngữ pháp", "Tracking đúng/sai theo câu", "Ngân hàng câu sai", "Streak ngày học"],
  },
  {
    icon: <BookOpen size={28} className="text-[#8B6B42]" />,
    color: "#8B6B42",
    title: "Reading — Đọc hiểu Part 7",
    desc: "Luyện đọc hiểu 3 dạng bài: Đoạn đơn, Đoạn đôi, Đoạn ba. Đúng với format TOEIC thực tế.",
    href: "/reading-practice",
    parts: ["Single Passage", "Double Passage", "Triple Passage", "Theo dõi tiến độ"],
  },
  {
    icon: <NotebookPen size={28} className="text-[#7C5CBF]" />,
    color: "#7C5CBF",
    title: "Journal — Nhật ký học tập",
    desc: "Theo dõi XP, level, streak, từ vựng đã lưu và lịch sử điểm số của bạn mỗi ngày.",
    href: "/journal",
    parts: ["XP & Level", "Streak ngày học", "Từ vựng đã lưu", "Lịch sử điểm số"],
  },
];

const LISTENING_PARTS = [
  { part: 1, Icon: Image,         name: "Photographs",       color: "#e55a6b" },
  { part: 2, Icon: MessageSquare, name: "Question-Response", color: "#d97706" },
  { part: 3, Icon: Users,         name: "Conversations",     color: "#6366f1" },
  { part: 4, Icon: Megaphone,     name: "Talks",             color: "#10b981" },
];

export default async function HomePage() {
  // Check auth silently — don't redirect
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch public stats
  let seriesCount = 0;
  let lessonCount = 0;
  let grammarCount = 0;
  let seriesList: { id: string; name: string; publisher: string | null; year: number | null; icon: string | null; description: string | null }[] = [];

  try {
    const [series, lessons, grammar] = await Promise.all([
      prisma.testSeries.findMany({
        orderBy: { orderIndex: "asc" },
        select: { id: true, name: true, publisher: true, year: true, icon: true, description: true },
      }),
      prisma.lesson.count(),
      prisma.grammarAttempt.count().catch(() => 0),
    ]);
    seriesList = series;
    seriesCount = series.length;
    lessonCount = lessons;
    // grammar question count from static import would be better, use a fixed number
    grammarCount = 1200; // approximate
  } catch {
    // silently continue with zeroes
  }

  const STATS = [
    { value: `${seriesCount}+`, label: "Bộ đề ETS" },
    { value: `${lessonCount}+`, label: "Bài nghe" },
    { value: "1,200+", label: "Câu ngữ pháp" },
    { value: "Free", label: "Hoàn toàn miễn phí" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <LandingHeader isLoggedIn={isLoggedIn} />

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#4DA8DA]">
          {/* decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-white pointer-events-none" />
          <div className="absolute bottom-0 -left-10 w-60 h-60 rounded-full opacity-10 bg-white pointer-events-none" />

          <div className="relative max-w-[1120px] mx-auto px-4 md:px-6 py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6 uppercase tracking-wider">
              🎧 TOEIC Listening · Grammar · Reading
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight md:leading-[1.15] tracking-[-0.02em] mb-4 max-w-3xl mx-auto">
              Luyện TOEIC hiệu quả<br className="hidden md:block" /> mỗi ngày — không cần giáo viên
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto leading-relaxed mb-10">
              Dictation chủ động, ngữ pháp có tracking, đọc hiểu theo dạng bài thực tế.
              Tất cả trong một ứng dụng. Hoàn toàn miễn phí.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="px-6 py-3 rounded-xl bg-white text-[#4DA8DA] font-bold text-sm hover:bg-[#FFD66B] transition-colors shadow-md"
                style={{ textDecoration: "none" }}
              >
                Bắt đầu học miễn phí →
              </Link>
              <Link
                href="/auth/login"
                className="px-6 py-3 rounded-xl border border-white/50 text-white font-medium text-sm hover:bg-white/10 transition-colors"
                style={{ textDecoration: "none" }}
              >
                Đã có tài khoản
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-b border-[var(--border)]">
          <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#4DA8DA] mb-1">{value}</div>
                <div className="text-sm text-[var(--text-secondary)]">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-[1120px] mx-auto px-4 md:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
              Đủ 4 kỹ năng trong một nền tảng
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-sm md:text-base">
              Từ luyện nghe đến đọc hiểu — mỗi module đều có tracking tiến độ riêng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon, color, title, desc, href, parts }) => (
              <div
                key={href}
                className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 hover:-translate-y-0.5 transition-all"
                style={{ boxShadow: `0 8px 24px -8px ${color}22` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  {icon}
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{desc}</p>
                <ul className="grid grid-cols-2 gap-1.5 mb-5">
                  {parts.map((p) => (
                    <li key={p} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <CheckCircle2 size={12} style={{ color, flexShrink: 0 }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={isLoggedIn ? href : "/auth/register"}
                  className="inline-flex items-center gap-1 text-sm font-semibold transition-colors"
                  style={{ color, textDecoration: "none" }}
                >
                  Vào luyện <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Dictation detail ── */}
        <section className="bg-[var(--bg-elevated)] border-y border-[var(--border)]">
          <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-14">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4DA8DA] uppercase tracking-wider mb-3">
                  <Headphones size={14} /> Listening — TOEIC Part 1–4
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
                  Luyện nghe theo từng Part — có audio thật từ đề ETS
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Nghe audio chính xác từ bộ đề ETS, gõ lại câu để kiểm tra, xem đáp án và tra từ điển ngay trong bài.
                  Mỗi bài được tính điểm và lưu vào tiến độ.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {LISTENING_PARTS.map(({ part, Icon, name, color }) => (
                  <div
                    key={part}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                    style={{ borderColor: `${color}40`, background: `${color}0d` }}
                  >
                    <Icon size={18} style={{ color, flexShrink: 0 }} />
                    <div>
                      <div className="text-xs font-bold" style={{ color }}>Part {part}</div>
                      <div className="text-xs text-[var(--text-muted)]">{name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Series ── */}
        {seriesList.length > 0 && (
          <section className="max-w-[1120px] mx-auto px-4 md:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                Bộ đề hiện có
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Nội dung chuẩn ETS, cập nhật thường xuyên.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {seriesList.map((series) => (
                <div
                  key={series.id}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6"
                  style={{ boxShadow: "0 4px 12px -4px rgba(77,168,218,0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#4DA8DA]/10 border border-[#4DA8DA]/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {series.icon ?? "📚"}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{series.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {series.publisher}{series.year ? ` · ${series.year}` : ""}
                      </div>
                    </div>
                  </div>
                  {series.description && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{series.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <section className="bg-[#4DA8DA]">
          <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
              Sẵn sàng nâng điểm TOEIC?
            </h2>
            <p className="text-white/80 mb-8 text-sm md:text-base max-w-md mx-auto">
              Tạo tài khoản trong 30 giây. Miễn phí hoàn toàn.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="px-6 py-3 rounded-xl bg-white text-[#4DA8DA] font-bold text-sm hover:bg-[#FFD66B] transition-colors shadow-md"
                style={{ textDecoration: "none" }}
              >
                Đăng ký miễn phí →
              </Link>
              {isLoggedIn && (
                <Link
                  href="/dictation"
                  className="px-6 py-3 rounded-xl border border-white/50 text-white font-medium text-sm hover:bg-white/10 transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  Vào học ngay
                </Link>
              )}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
