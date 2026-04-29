"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Phase = "loading" | "ready" | "accepting" | "done" | "error";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [studentCode, setStudentCode] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setPhase("ready");
    });
  }, []);

  async function handleAccept() {
    if (!isLoggedIn) {
      // Redirect to login, then come back
      router.push(`/auth/login?next=/invite/${token}`);
      return;
    }

    setPhase("accepting");
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json() as { ok?: boolean; studentCode?: string | null; error?: string };

      if (!res.ok) {
        setErrorMsg(json.error ?? "Có lỗi xảy ra.");
        setPhase("error");
        return;
      }

      setStudentCode(json.studentCode ?? null);
      setPhase("done");
    } catch {
      setErrorMsg("Không thể kết nối server.");
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-4xl animate-pulse">📨</div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8 border text-center space-y-4"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Chào mừng!
          </h1>
          {studentCode && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Tài khoản của bạn đã được liên kết với mã học viên{" "}
              <code
                className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{ background: "var(--border)", color: "var(--accent-primary)" }}
              >
                {studentCode}
              </code>
            </p>
          )}
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Bạn có thể vào nhật ký học tập để xem điểm số, bài tập và đặt lịch học.
          </p>
          <Link
            href="/journal"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-primary)" }}
          >
            Vào nhật ký →
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8 border text-center space-y-4"
          style={{ background: "var(--bg-elevated)", borderColor: "rgba(239,68,68,0.3)" }}
        >
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Lỗi
          </h1>
          <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{errorMsg}</p>
          <Link
            href="/journal"
            className="block w-full py-3 rounded-xl text-sm font-semibold border transition-opacity hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // "ready" or "accepting"
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8 border text-center space-y-5"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <div className="text-5xl">📨</div>

        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Lời mời tham gia lớp học
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {isLoggedIn
              ? "Nhấn bên dưới để chấp nhận lời mời và liên kết tài khoản của bạn."
              : "Bạn cần đăng nhập để chấp nhận lời mời này."}
          </p>
        </div>

        <button
          onClick={handleAccept}
          disabled={phase === "accepting"}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--accent-primary)" }}
        >
          {phase === "accepting"
            ? "Đang xử lý..."
            : isLoggedIn
            ? "✅ Chấp nhận lời mời"
            : "🔑 Đăng nhập để tiếp tục"}
        </button>

        {isLoggedIn && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Lời mời có hiệu lực trong 7 ngày kể từ khi được gửi.
          </p>
        )}
      </div>
    </div>
  );
}
