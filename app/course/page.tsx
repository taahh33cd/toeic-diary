import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "@/components/home/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import { CourseCards } from "@/components/course/CourseCards";

export const dynamic = "force-dynamic";

const CREAM  = "#FFFDF6";
const INK    = "#3D2B1F";
const SEPIA  = "#6B4C2A";
const TERRA  = "#C4622D";
const BORDER = "#D9C9B8";
const SERIF  = "var(--font-display,'Lora',Georgia,serif)";
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.048'/%3E%3C/svg%3E")`;

export default async function CoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: CREAM, color: INK }}>
      <LandingHeader isLoggedIn={isLoggedIn} />

      <main style={{ flex: 1 }}>

        {/* Hero */}
        <section
          style={{
            background: `${GRAIN_BG}, ${CREAM}`,
            backgroundBlendMode: "multiply",
            borderBottom: `1px solid ${BORDER}`,
            padding: "clamp(2.5rem,6vw,4rem) clamp(1rem,4vw,2rem)",
            textAlign: "center",
          }}
        >
          {/* Tag */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px",
              border: `1.5px solid ${TERRA}55`,
              borderRadius: 4, marginBottom: "1.5rem",
              background: "#FAE8DB",
            }}
          >
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TERRA }}>
              2 kỹ năng · Nghe · Đọc · TOEIC
            </span>
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(1.75rem,5vw,2.75rem)",
              fontWeight: 700, color: INK, lineHeight: 1.25,
              marginBottom: "0.875rem",
              maxWidth: 600, marginLeft: "auto", marginRight: "auto",
            }}
          >
            Khoá học TOEIC<br />có người đồng hành
          </h1>

          <p
            style={{
              fontSize: "clamp(0.88rem,2vw,1rem)",
              color: SEPIA, maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            4 hình thức học — tự luyện online, 1-1 cá nhân, tự học có hướng dẫn, và nhóm nhỏ offline.
            <br />
            Chọn cái phù hợp với lịch và mục tiêu của bạn.
          </p>
        </section>

        {/* Course cards + shared benefits + contact modal */}
        <CourseCards />

      </main>

      <Footer />
    </div>
  );
}
