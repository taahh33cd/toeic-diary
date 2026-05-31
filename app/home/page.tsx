import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { LandingHeader } from "@/components/home/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import {
  Headphones, GraduationCap, BookOpen, NotebookPen,
  Image, MessageSquare, Users, Megaphone,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ── Design tokens ────────────────────────────────────────────────────────────
const CREAM  = "#FFFDF6";
const BEIGE  = "#F5EFE6";
const INK    = "#3D2B1F";
const SEPIA  = "#6B4C2A";
const TERRA  = "#C4622D";
const TERRA2 = "#E8885C";
const MUTED  = "#9A8672";
const BORDER = "#D9C9B8";
const SERIF  = "var(--font-display,'Lora',Georgia,serif)";

// Subtle paper grain overlay (SVG noise)
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.048'/%3E%3C/svg%3E")`;

// ── Ornament divider ──────────────────────────────────────────────────────────
function Ornament({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0 auto", maxWidth: 480, padding: "0 1.5rem" }}>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label ?? "✦ TOEIC DICTATION DIARY ✦"}
      </span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

// ── Stamp badge (stats) ───────────────────────────────────────────────────────
function Stamp({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "1rem 1.25rem", minWidth: 100,
        border: `2px dashed ${TERRA}70`,
        borderRadius: 6,
        background: `${GRAIN_BG}, #FAE8DB`,
        backgroundBlendMode: "multiply",
        boxShadow: `inset 0 0 0 3px ${CREAM}`,
      }}
    >
      <span style={{ fontFamily: SERIF, fontSize: "1.8rem", fontWeight: 700, color: TERRA, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: "0.62rem", color: SEPIA, marginTop: 5, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>{label}</span>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Headphones size={24} style={{ color: TERRA }} />,
    label: "Part 1 · 2 · 3 · 4",
    title: "Dictation",
    sub: "Luyện nghe chép",
    desc: "Nghe audio TOEIC rồi tự gõ lại từng câu. Phương pháp chủ động nhất để cải thiện khả năng nghe.",
    href: "/dictation",
    bullets: ["Part 1 · Photographs", "Part 2 · Question-Response", "Part 3 · Conversations", "Part 4 · Talks"],
  },
  {
    icon: <GraduationCap size={24} style={{ color: TERRA }} />,
    label: "11 chủ đề",
    title: "Grammar",
    sub: "Ngữ pháp TOEIC",
    desc: "Luyện ngữ pháp theo 11 chủ đề trọng tâm. Có ngân hàng câu sai để ôn lại.",
    href: "/grammar",
    bullets: ["11 chủ đề ngữ pháp", "Tracking đúng/sai", "Ngân hàng câu sai", "Streak ngày học"],
  },
  {
    icon: <BookOpen size={24} style={{ color: TERRA }} />,
    label: "Part 7",
    title: "Reading",
    sub: "Đọc hiểu Part 7",
    desc: "Luyện đọc hiểu 3 dạng: Đoạn đơn, đôi, ba. Đúng format TOEIC thực tế.",
    href: "/reading-practice",
    bullets: ["Single Passage", "Double Passage", "Triple Passage", "Theo dõi tiến độ"],
  },
  {
    icon: <NotebookPen size={24} style={{ color: TERRA }} />,
    label: "Cá nhân hoá",
    title: "Journal",
    sub: "Nhật ký học tập",
    desc: "XP, level, streak, từ vựng đã lưu và lịch sử điểm mỗi ngày.",
    href: "/journal",
    bullets: ["XP & Level", "Streak ngày học", "Từ vựng đã lưu", "Lịch sử điểm số"],
  },
];

const LISTENING_PARTS = [
  { part: 1, Icon: Image,         name: "Photographs",       color: "#b44a45" },
  { part: 2, Icon: MessageSquare, name: "Question-Response", color: "#b06010" },
  { part: 3, Icon: Users,         name: "Conversations",     color: "#5a52a0" },
  { part: 4, Icon: Megaphone,     name: "Talks",             color: "#2a7a5a" },
];

const CERTS = [
  { img: "/certificates/cert-935.jpg", name: "Nguyễn Đức Lân",  score: 935, listening: 485, reading: 450, date: "09/2024", rotate: "-2.5deg", portrait: true  },
  { img: "/certificates/cert-715.png", name: "Đào Duy Thành",   score: 715, listening: 445, reading: 270, date: "11/2024", rotate:  "1.5deg", portrait: false },
  { img: "/certificates/cert-760.png", name: "Vũ Minh Thuận",   score: 760, listening: 410, reading: 350, date: "03/2025", rotate:  "-1deg",  portrait: false },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let lessonCount = 0;
  let seriesCount = 0;

  try {
    [lessonCount, seriesCount] = await Promise.all([
      prisma.lesson.count(),
      prisma.testSeries.count(),
    ]);
  } catch { /* silently continue */ }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: CREAM, color: INK }}>
      <LandingHeader isLoggedIn={isLoggedIn} />

      <main style={{ flex: 1 }}>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: `${GRAIN_BG}, ${CREAM}`,
            backgroundBlendMode: "multiply",
            borderBottom: `1px solid ${BORDER}`,
            padding: "clamp(3rem,8vw,5rem) clamp(1rem,4vw,2rem)",
            textAlign: "center",
          }}
        >
          {/* Tag */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", border: `1.5px solid ${TERRA}55`, borderRadius: 4, marginBottom: "1.5rem", background: "#FAE8DB", maxWidth: "90vw" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TERRA, lineHeight: 1.5 }}>
              ETS 2024 · ETS 2026 · TOEIC Listening · Grammar · Reading
            </span>
          </div>

          <h1
            style={{
              fontFamily: SERIF, fontSize: "clamp(1.75rem,6vw,3.25rem)", fontWeight: 700,
              color: INK, lineHeight: 1.2, letterSpacing: "-0.01em",
              marginBottom: "1rem", maxWidth: 640, marginLeft: "auto", marginRight: "auto",
            }}
          >
            Luyện TOEIC hiệu quả<br />mỗi ngày — không cần giáo viên
          </h1>

          <p style={{ fontSize: "clamp(0.88rem,2vw,1.05rem)", color: SEPIA, maxWidth: 500, margin: "0 auto 2rem", lineHeight: 1.75, padding: "0 0.5rem" }}>
            Dictation chủ động, ngữ pháp có tracking, đọc hiểu theo dạng bài thực tế.
            Tất cả trong một ứng dụng. Hoàn toàn miễn phí.
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", maxWidth: 320, margin: "0 auto" }}>
            <Link
              href="/auth/register"
              style={{
                display: "block", width: "100%", textAlign: "center",
                padding: "13px 28px", borderRadius: 8,
                background: TERRA, color: "#fff",
                fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                boxShadow: `0 4px 16px ${TERRA}45`,
              }}
            >
              Bắt đầu học miễn phí →
            </Link>
            <Link
              href="/auth/login"
              style={{ display: "block", width: "100%", textAlign: "center", padding: "11px 24px", borderRadius: 8, border: `1.5px solid ${SEPIA}60`, color: SEPIA, fontWeight: 500, fontSize: "0.88rem", textDecoration: "none" }}
            >
              Đã có tài khoản
            </Link>
            <Link
              href="/course"
              style={{ fontSize: "0.84rem", color: TERRA, fontWeight: 600, textDecoration: "none", paddingTop: 4 }}
            >
              🎓 Muốn học có giáo viên? Xem khoá học →
            </Link>
          </div>
        </section>

        {/* ── Ornament ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "2rem 0", background: BEIGE }}>
          <Ornament />
        </div>

        {/* ── Stats stamps ───────────────────────────────────────────────── */}
        <section style={{ background: BEIGE, paddingBottom: "3rem" }}>
          <div
            style={{
              maxWidth: 800, margin: "0 auto", padding: "0 1.5rem",
              display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.25rem",
            }}
          >
            <Stamp value={`${seriesCount}+`}  label="Bộ đề ETS" />
            <Stamp value={`${lessonCount}+`}  label="Bài nghe" />
            <Stamp value="1,200+"            label="Câu ngữ pháp" />
            <Stamp value="Free"              label="Miễn phí" />
          </div>
        </section>

        {/* ── Ornament ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "2rem 0", background: CREAM, borderTop: `1px solid ${BORDER}` }}>
          <Ornament label="✦ 4 KỸ NĂNG · 1 NỀN TẢNG ✦" />
        </div>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section style={{ background: CREAM, padding: "0 clamp(1rem,4vw,2rem) 4rem" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 700, color: INK, marginBottom: "0.6rem" }}>
                Đủ 4 kỹ năng trong một nền tảng
              </h2>
              <p style={{ fontSize: "0.9rem", color: SEPIA, maxWidth: 440, margin: "0 auto" }}>
                Từ luyện nghe đến đọc hiểu — mỗi module đều có tracking tiến độ riêng.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px,100%),1fr))", gap: "1.25rem" }}>
              {FEATURES.map(({ icon, label, title, sub, desc, href, bullets }) => (
                <div
                  key={href}
                  style={{
                    background: `${GRAIN_BG}, ${BEIGE}`,
                    backgroundBlendMode: "multiply",
                    border: `1.5px solid ${BORDER}`,
                    borderTop: `3px solid ${TERRA}`,
                    borderRadius: 10,
                    padding: "1.5rem",
                    display: "flex", flexDirection: "column",
                    boxShadow: `0 2px 12px rgba(61,43,31,0.06)`,
                  }}
                >
                  {/* Label tag */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#FAE8DB", border: `1px solid ${TERRA}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "1rem", color: INK }}>{title}</div>
                        <div style={{ fontSize: "0.72rem", color: MUTED }}>{sub}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: TERRA, background: "#FAE8DB", border: `1px dashed ${TERRA}60`, padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.82rem", color: SEPIA, lineHeight: 1.65, marginBottom: "1rem", flex: 1 }}>{desc}</p>

                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", marginBottom: "1.25rem" }}>
                    {bullets.map((b) => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: SEPIA }}>
                        <span style={{ color: TERRA, flexShrink: 0 }}>✓</span> {b}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={isLoggedIn ? href : "/auth/register"}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.82rem", fontWeight: 700, color: TERRA, textDecoration: "none" }}
                  >
                    Vào luyện →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ornament ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "2rem 0", background: BEIGE, borderTop: `1px solid ${BORDER}` }}>
          <Ornament label="✦ TOEIC LISTENING PARTS 1 – 4 ✦" />
        </div>

        {/* ── Listening detail ─────────────────────────────────────────────── */}
        <section style={{ background: BEIGE, padding: "0 clamp(1rem,4vw,2rem) 4rem" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 300px" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: TERRA, marginBottom: "0.75rem" }}>
                  Dictation — TOEIC Listening
                </p>
                <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.3rem,3vw,1.7rem)", fontWeight: 700, color: INK, marginBottom: "0.75rem", lineHeight: 1.35 }}>
                  Audio thật từ đề ETS — nghe rồi tự gõ lại
                </h2>
                <p style={{ fontSize: "0.86rem", color: SEPIA, lineHeight: 1.75, maxWidth: 440 }}>
                  Mỗi bài nghe có audio gốc từ bộ đề ETS. Gõ lại câu để kiểm tra, xem đáp án,
                  tra từ điển ngay trong bài. Điểm tự động tính và lưu vào tiến độ.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", flex: "0 0 auto" }}>
                {LISTENING_PARTS.map(({ part, Icon, name, color }) => (
                  <div
                    key={part}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "0.85rem 1.1rem", borderRadius: 8,
                      background: `${GRAIN_BG}, #FFFDF6`,
                      backgroundBlendMode: "multiply",
                      border: `1.5px solid ${BORDER}`,
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <Icon size={17} style={{ color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: INK }}>Part {part}</div>
                      <div style={{ fontSize: "0.68rem", color: MUTED }}>{name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Series ────────────────────────────────────────────────────────── */}

        {/* ── Student Certificates ──────────────────────────────────────────── */}
        <div style={{ padding: "2rem 0", background: BEIGE, borderTop: `1px solid ${BORDER}` }}>
          <Ornament label="✦ KẾT QUẢ THỰC TẾ CỦA HỌC VIÊN ✦" />
        </div>

        <section style={{ background: BEIGE, padding: "0 clamp(1rem,4vw,2rem) 4rem" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.3rem,3vw,1.7rem)", fontWeight: 700, color: INK, marginBottom: "0.5rem" }}>
                Học viên đã đạt được
              </h2>
              <p style={{ fontSize: "0.86rem", color: SEPIA, maxWidth: 420, margin: "0 auto" }}>
                Chứng chỉ thực tế từ kỳ thi TOEIC chính thức ETS.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px,100%), 1fr))", gap: "2rem" }}>
              {CERTS.map(({ img, name, score, listening, reading, date, rotate, portrait }) => (
                <div
                  key={name}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
                  }}
                >
                  {/* Certificate image — portrait images rotated -90° inside a landscape container */}
                  <div
                    style={{
                      width: "100%",
                      transform: `rotate(${rotate})`,
                      borderRadius: 8,
                      boxShadow: "0 6px 24px rgba(61,43,31,0.18), 0 2px 6px rgba(61,43,31,0.1)",
                      overflow: "hidden",
                      border: `3px solid #fff`,
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      // portrait: lock to landscape aspect ratio, img rotated inside
                      ...(portrait ? { position: "relative", aspectRatio: "1.5 / 1" } : {}),
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Chứng chỉ TOEIC của ${name}`}
                      style={portrait ? {
                        position: "absolute",
                        height: "155%",   // fills landscape container after -90° rotation
                        width: "auto",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) rotate(-90deg)",
                      } : {
                        width: "100%", display: "block",
                      }}
                    />
                  </div>

                  {/* Info card */}
                  <div
                    style={{
                      background: `${GRAIN_BG}, ${CREAM}`,
                      backgroundBlendMode: "multiply",
                      border: `1.5px solid ${BORDER}`,
                      borderTop: `3px solid ${TERRA}`,
                      borderRadius: 10,
                      padding: "1rem 1.25rem",
                      width: "100%",
                      boxShadow: "0 2px 8px rgba(61,43,31,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                      <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.95rem", color: INK }}>{name}</span>
                      <span style={{ fontSize: "0.65rem", color: MUTED }}>{date}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: SERIF, fontSize: "1.5rem", fontWeight: 700, color: TERRA,
                          background: "#FAE8DB", border: `1px dashed ${TERRA}55`,
                          borderRadius: 6, padding: "2px 10px", lineHeight: 1.4,
                        }}
                      >
                        {score}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: "0.7rem", color: SEPIA }}>🎧 Nghe: <strong>{listening}</strong></span>
                        <span style={{ fontSize: "0.7rem", color: SEPIA }}>📖 Đọc: <strong>{reading}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section
          style={{
            background: `${GRAIN_BG}, ${INK}`,
            backgroundBlendMode: "multiply",
            padding: "clamp(3rem,6vw,4.5rem) clamp(1rem,4vw,2rem)",
            textAlign: "center",
            borderTop: `3px solid ${TERRA}`,
          }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <Ornament label="✦ BẮT ĐẦU HỌC HÔM NAY ✦" />
          </div>

          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 700, color: CREAM, marginBottom: "0.75rem", lineHeight: 1.3 }}>
            Sẵn sàng nâng điểm TOEIC?
          </h2>
          <p style={{ fontSize: "0.9rem", color: `${CREAM}99`, maxWidth: 400, margin: "0 auto 2rem", lineHeight: 1.75 }}>
            Tạo tài khoản trong 30 giây. Miễn phí hoàn toàn.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Link
              href="/auth/register"
              style={{
                padding: "12px 28px", borderRadius: 8,
                background: TERRA, color: "#fff",
                fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                boxShadow: `0 4px 20px ${TERRA}60`,
              }}
            >
              Đăng ký miễn phí →
            </Link>
            {isLoggedIn && (
              <Link
                href="/dictation"
                style={{ padding: "11px 24px", borderRadius: 8, border: `1.5px solid ${CREAM}40`, color: `${CREAM}cc`, fontWeight: 500, fontSize: "0.88rem", textDecoration: "none" }}
              >
                Vào học ngay
              </Link>
            )}
            <Link
              href="/course"
              style={{ padding: "11px 24px", borderRadius: 8, border: `1.5px solid ${CREAM}40`, color: `${CREAM}cc`, fontWeight: 500, fontSize: "0.88rem", textDecoration: "none" }}
            >
              🎓 Xem khoá học có HD
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
