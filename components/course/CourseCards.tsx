"use client";

import { useState } from "react";
import { X, MessageCircle } from "lucide-react";

// TODO: Thay bằng link thật của bạn
const ZALO_LINK = "https://zalo.me/YOUR_ZALO";
const FB_LINK   = "https://www.facebook.com/YOUR_FB";

const CREAM  = "#FFFDF6";
const BEIGE  = "#F5EFE6";
const INK    = "#3D2B1F";
const SEPIA  = "#6B4C2A";
const TERRA  = "#C4622D";
const MUTED  = "#9A8672";
const BORDER = "#D9C9B8";
const SERIF  = "var(--font-display,'Lora',Georgia,serif)";
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.048'/%3E%3C/svg%3E")`;

type Course = {
  id: number;
  badge: string;
  featured?: boolean;
  title: string;
  subtitle: string;
  price: string;
  priceUnit: string;
  priceNote: string;
  duration: string;
  schedule: string;
  features: string[];
  ideal: string;
  waitNote?: string;
};

const COURSES: Course[] = [
  {
    id: 1,
    badge: "1-1 · Cá nhân",
    title: "Khoá 1 — Học 1-1",
    subtitle: "Theo từng buổi hàng tuần",
    price: "150.000đ",
    priceUnit: "/ buổi · 90 phút",
    priceNote: "≈ 1.2tr / tháng · Đóng theo tháng hoặc tuần",
    duration: "3 tháng + 1 tháng luyện đề",
    schedule: "2 buổi / tuần",
    features: [
      "Lộ trình cá nhân theo năng lực từng người",
      "Sát sao 1-1 mỗi buổi học",
      "Linh hoạt điều chỉnh theo tốc độ tiếp thu",
      "Online · Lịch thoả thuận linh hoạt",
    ],
    ideal: "Bạn muốn được chỉ dẫn trực tiếp 1-1",
  },
  {
    id: 2,
    badge: "Phổ biến nhất",
    featured: true,
    title: "Khoá 2 — Tự luyện có HD",
    subtitle: "Không lên lớp · Đồng hành đến khi thi",
    price: "1.000.000đ",
    priceUnit: "trọn gói",
    priceNote: "Đóng 1 lần · Hỗ trợ không giới hạn đến ngày thi",
    duration: "Đến khi đạt 5 đề ≥ mục tiêu",
    schedule: "Book tối đa 4 buổi / tuần",
    features: [
      "Bài tập soạn riêng theo năng lực mỗi 2 ngày",
      "Book lịch chữa bài / hỏi lý thuyết không giới hạn",
      "Đồng hành đến khi luyện đề vượt mục tiêu 80–120đ",
      "Online · Hoàn toàn linh hoạt về thời gian",
    ],
    ideal: "Bạn bận, muốn tự học nhưng cần định hướng rõ",
  },
  {
    id: 3,
    badge: "Offline · Hà Nội",
    title: "Khoá 3 — Học nhóm",
    subtitle: "33 Cầu Đất, Hồng Hà, Hà Nội",
    price: "120.000đ",
    priceUnit: "/ buổi",
    priceNote: "Đóng theo tháng hoặc tuần · Nhóm 2–4 học viên",
    duration: "3 tháng + 1 tháng luyện đề",
    schedule: "3 buổi / tuần",
    features: [
      "Lớp nhỏ 2–4 học viên, vẫn sát sao",
      "Học trực tiếp tại cơ sở Hà Nội",
      "Có sách, tài liệu in đầy đủ",
      "Học phí thấp hơn khoá 1-1",
    ],
    ideal: "Bạn ở Hà Nội, thích học cùng nhóm nhỏ",
    waitNote: "Cần thêm ít nhất 1 học viên nữa để khai giảng",
  },
];

export function CourseCards() {
  const [modalCourse, setModalCourse] = useState<Course | null>(null);

  return (
    <>
      {/* Cards grid */}
      <section style={{ background: BEIGE, padding: "3rem clamp(1rem,4vw,2rem) 4rem" }}>
        <div
          style={{
            maxWidth: 1120, margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(320px,100%), 1fr))",
            gap: "1.5rem",
          }}
        >
          {COURSES.map((course) => (
            <div
              key={course.id}
              style={{
                background: `${GRAIN_BG}, ${CREAM}`,
                backgroundBlendMode: "multiply",
                border: course.featured ? `2px solid ${TERRA}` : `1.5px solid ${BORDER}`,
                borderTop: `3px solid ${course.featured ? TERRA : BORDER}`,
                borderRadius: 12,
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                boxShadow: course.featured
                  ? `0 8px 32px rgba(196,98,45,0.15)`
                  : `0 2px 12px rgba(61,43,31,0.06)`,
              }}
            >
              {/* Badge */}
              <div style={{ marginBottom: "1.25rem" }}>
                <span
                  style={{
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: course.featured ? "#fff" : TERRA,
                    background: course.featured ? TERRA : "#FAE8DB",
                    border: course.featured ? "none" : `1px dashed ${TERRA}60`,
                    padding: "3px 9px", borderRadius: 3,
                  }}
                >
                  {course.badge}
                </span>
              </div>

              {/* Title */}
              <h3 style={{ fontFamily: SERIF, fontSize: "1.15rem", fontWeight: 700, color: INK, marginBottom: "0.3rem", lineHeight: 1.3 }}>
                {course.title}
              </h3>
              <p style={{ fontSize: "0.76rem", color: MUTED, marginBottom: "1.5rem" }}>{course.subtitle}</p>

              {/* Price block */}
              <div
                style={{
                  background: `${GRAIN_BG}, #FAE8DB`,
                  backgroundBlendMode: "multiply",
                  border: `1px dashed ${TERRA}50`,
                  borderRadius: 8,
                  padding: "0.9rem 1.1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: SERIF, fontSize: "1.5rem", fontWeight: 700, color: TERRA, lineHeight: 1 }}>
                    {course.price}
                  </span>
                  <span style={{ fontSize: "0.76rem", color: SEPIA }}>{course.priceUnit}</span>
                </div>
                <p style={{ fontSize: "0.68rem", color: MUTED, marginTop: 5, lineHeight: 1.5 }}>{course.priceNote}</p>
              </div>

              {/* Schedule info */}
              <div style={{ display: "flex", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: SEPIA }}>
                  <span style={{ color: TERRA }}>📅 </span>{course.duration}
                </span>
                <span style={{ fontSize: "0.75rem", color: SEPIA }}>
                  <span style={{ color: TERRA }}>⏰ </span>{course.schedule}
                </span>
              </div>

              {/* Features list */}
              <ul style={{ listStyle: "none", margin: "0 0 1.25rem", padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {course.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.81rem", color: SEPIA, lineHeight: 1.5 }}>
                    <span style={{ color: TERRA, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Ideal for */}
              <p
                style={{
                  fontSize: "0.74rem", color: MUTED, fontStyle: "italic",
                  marginBottom: "1.25rem", paddingTop: "0.75rem",
                  borderTop: `1px solid ${BORDER}`,
                  lineHeight: 1.5,
                }}
              >
                💡 Phù hợp: {course.ideal}
              </p>

              {/* Waiting note */}
              {course.waitNote && (
                <div
                  style={{
                    fontSize: "0.71rem", color: "#7a5200", background: "#FFF3CD",
                    border: "1px solid #F0C040", borderRadius: 6,
                    padding: "6px 10px", marginBottom: "1rem", lineHeight: 1.5,
                  }}
                >
                  ⏳ {course.waitNote}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => setModalCourse(course)}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 8,
                  background: course.featured ? TERRA : "transparent",
                  color: course.featured ? "#fff" : TERRA,
                  border: `2px solid ${TERRA}`,
                  fontWeight: 700,
                  fontSize: "0.87rem",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                Đăng ký khoá này →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Shared benefits strip */}
      <section
        style={{
          background: CREAM,
          borderTop: `1px solid ${BORDER}`,
          padding: "2.5rem clamp(1rem,4vw,2rem)",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: TERRA, marginBottom: "1.1rem",
            }}
          >
            ── ✦ Tất cả khoá học đều bao gồm ✦ ──
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.875rem" }}>
            {[
              "🎧 Truy cập website Dictation miễn phí",
              "📦 Ship sách tận nhà miễn phí",
            ].map((b) => (
              <div
                key={b}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 18px",
                  background: "#FAE8DB",
                  border: `1px dashed ${TERRA}55`,
                  borderRadius: 6,
                  fontSize: "0.84rem", color: SEPIA, fontWeight: 500,
                }}
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact modal */}
      {modalCourse && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(61,43,31,0.6)",
          }}
          onClick={() => setModalCourse(null)}
        >
          <div
            style={{
              position: "relative",
              background: CREAM,
              border: `2px solid ${TERRA}45`,
              borderRadius: 18,
              boxShadow: `0 24px 64px rgba(61,43,31,0.35)`,
              padding: "2rem 2rem 1.75rem",
              width: "100%", maxWidth: 370, margin: "0 1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalCourse(null)}
              style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: MUTED }}
              aria-label="Đóng"
            >
              <X size={17} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📩</div>
              <h2 style={{ fontFamily: SERIF, fontSize: "1.05rem", fontWeight: 700, color: INK, margin: "0 0 6px" }}>
                Đăng ký {modalCourse.title}
              </h2>
              <p style={{ fontSize: "0.81rem", color: SEPIA, lineHeight: 1.65, margin: 0 }}>
                Nhắn tin để được tư vấn và chốt lịch học nha.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "1.25rem" }}>
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px 16px", borderRadius: 10,
                  background: "#0068FF", color: "#fff",
                  fontWeight: 700, fontSize: "0.87rem", textDecoration: "none",
                }}
              >
                <MessageCircle size={17} />
                Nhắn Zalo
              </a>
              <a
                href={FB_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 16px", borderRadius: 10,
                  border: `1.5px solid ${TERRA}55`, color: INK,
                  fontWeight: 500, fontSize: "0.84rem", textDecoration: "none",
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0 }}>
                  <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.795-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
                Nhắn Facebook
              </a>
            </div>

            <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.6rem", letterSpacing: "0.15em", color: `${TERRA}60`, textTransform: "uppercase" }}>
              ── ✦ TOEIC DICTATION DIARY ✦ ──
            </div>
          </div>
        </div>
      )}
    </>
  );
}
