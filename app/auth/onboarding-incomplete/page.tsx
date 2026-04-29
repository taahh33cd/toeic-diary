import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Tài khoản chưa được liên kết | Anh Hiếu²",
};

export default async function OnboardingIncompletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/journal");

  const role = (user.app_metadata?.role as string | undefined) ?? "student";
  if (role === "teacher" || role === "admin") redirect("/admin");

  return (
    <div
      className="theme-journal min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="text-4xl mb-4">📨</div>
        <h1 className="text-2xl font-bold mb-3" style={{ letterSpacing: "-0.02em" }}>
          Tài khoản chưa được liên kết
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Bạn đã đăng nhập với <b>{user.email}</b>, nhưng tài khoản này chưa được
          gắn với một mã học viên trong hệ thống.
        </p>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Hãy liên hệ thầy Hiếu để nhận <b>email mời</b>, hoặc nếu đã có link mời, mở link đó để hoàn tất.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="btn btn-primary w-full justify-center"
            style={{ textAlign: "center" }}
          >
            🎧 Luyện Dictation
          </Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="btn btn-secondary w-full justify-center">
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
