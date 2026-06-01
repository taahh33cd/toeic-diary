import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Đăng ký khoá học | Anh Hiếu²",
};

const COURSES = [
  {
    id: 1,
    badge: "1-1 · Cá nhân",
    title: "Khoá 1",
    sub: "Học 1-1 · Online",
    price: "150.000đ / buổi",
    color: "#C4622D",
    bg: "#FFF4EE",
    border: "#F0C8B0",
  },
  {
    id: 2,
    badge: "Phổ biến nhất",
    title: "Khoá 2",
    sub: "Tự luyện có hướng dẫn",
    price: "999.000đ trọn gói",
    color: "#6B4C2A",
    bg: "#F5EFE6",
    border: "#D9C9B8",
    featured: true,
  },
  {
    id: 3,
    badge: "Offline · Hà Nội",
    title: "Khoá 3",
    sub: "Học nhóm nhỏ 2–4 người",
    price: "120.000đ / buổi",
    color: "#3D7A6B",
    bg: "#EEF7F5",
    border: "#B0D9CF",
  },
];

export default async function OnboardingIncompletePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/journal");

  const role = (user.app_metadata?.role as string | undefined) ?? "student";
  if (role === "teacher" || role === "admin") redirect("/admin");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFDF6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #E8DDD4",
            boxShadow: "0 4px 24px rgba(61,43,31,0.09)",
            padding: "2rem 1.75rem 1.75rem",
          }}
        >
          {/* Icon + heading */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#FFF4EE",
                fontSize: 26,
                marginBottom: "1rem",
              }}
            >
              📓
            </div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#3D2B1F",
                marginBottom: "0.5rem",
                lineHeight: 1.3,
              }}
            >
              Journal dành cho học viên đang học
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6B4C2A", lineHeight: 1.65 }}>
              Tính năng này chỉ mở với học viên đang theo Khoá 1, 2 hoặc 3 —
              những bạn học trực tiếp cùng thầy và được cấp mã học viên.
            </p>
          </div>

          {/* Mini course cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
            {COURSES.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: "0.625rem 0.875rem",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: c.color,
                        background: c.featured ? "#C4622D22" : "transparent",
                        padding: c.featured ? "1px 6px" : 0,
                        borderRadius: 4,
                      }}
                    >
                      {c.badge}
                    </span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#3D2B1F", marginBottom: 1 }}>
                    {c.title} · {c.sub}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#6B4C2A" }}>{c.price}</p>
                </div>
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {c.id === 1 ? "🎓" : c.id === 2 ? "💻" : "🏫"}
                </span>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <Link
            href="/course"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "13px 24px",
              borderRadius: 10,
              background: "#C4622D",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              marginBottom: "0.625rem",
              boxSizing: "border-box",
            }}
          >
            Xem chi tiết & đăng ký →
          </Link>

          {/* Logout */}
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "11px 24px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid #E8DDD4",
                color: "#9A8672",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              Đăng xuất
            </button>
          </form>
        </div>

        {/* Sub-note */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#9A8672",
            marginTop: "1rem",
            lineHeight: 1.6,
          }}
        >
          Đã đăng ký và được thầy cấp link mời? Mở link đó để liên kết tài khoản.
        </p>

      </div>
    </div>
  );
}
