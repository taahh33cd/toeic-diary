import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { LandingHeader } from "@/components/home/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import { Khoa0Checkout } from "@/components/course/Khoa0Checkout";
import { KHOA0_COURSE_ID } from "@/lib/payment/khoa0";

export const dynamic = "force-dynamic";

const CREAM = "#FFFDF6";
const INK = "#3D2B1F";
const SEPIA = "#6B4C2A";
const TERRA = "#C4622D";
const SERIF = "var(--font-display,'Lora',Georgia,serif)";

export default async function Khoa0CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must be logged in — course access is tied to a Profile.
  if (!user) redirect("/auth/login?next=/course/khoa-0");

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { enrolledCourses: true } })
    .catch(() => null);

  const alreadyOwned = !!profile?.enrolledCourses.includes(KHOA0_COURSE_ID);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: CREAM, color: INK }}>
      <LandingHeader isLoggedIn />

      <main style={{ flex: 1, padding: "clamp(1.5rem,5vw,3rem) 1rem", display: "flex", justifyContent: "center" }}>
        {alreadyOwned ? (
          <div style={{ maxWidth: 440, textAlign: "center", paddingTop: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
            <h1 style={{ fontFamily: SERIF, fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Bạn đã mở khoá rồi!
            </h1>
            <p style={{ fontSize: "0.9rem", color: SEPIA, lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Tài khoản của bạn đã có quyền truy cập không giới hạn toàn bộ website.
            </p>
            <Link
              href="/dictation"
              style={{
                display: "inline-block", padding: "12px 28px", borderRadius: 8,
                background: TERRA, color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
              }}
            >
              Vào học ngay →
            </Link>
          </div>
        ) : (
          <Khoa0Checkout />
        )}
      </main>

      <Footer />
    </div>
  );
}
