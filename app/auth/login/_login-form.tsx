"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// ── Design tokens — matches landing page ─────────────────────
const CREAM  = "#FFFDF6";
const INK    = "#3D2B1F";
const SEPIA  = "#6B4C2A";
const TERRA  = "#C4622D";
const MUTED  = "#9A8672";
const BORDER = "#D9C9B8";
const SERIF  = "'Lora', Georgia, serif";

type Tab = "email" | "code";

const roleHome = (role: string | undefined) =>
  role === "teacher" || role === "admin" ? "/admin" : "/journal";

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: MUTED, marginBottom: "6px" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
    </svg>
  );
}

export function LoginForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const nextParam   = searchParams.get("next");

  const [tab, setTab]         = useState<Tab>("email");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  // ── Email login ──────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const role = data.user?.app_metadata?.role as string | undefined;
      router.push(nextParam ?? roleHome(role));
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const next = nextParam ?? "/auth/post-login";
    const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  };

  // ── Code login ───────────────────────────────────────────────

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) { setError("Vui lòng nhập mã học viên."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/code-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const json = await res.json() as { email?: string; token?: string; error?: string };
      if (!res.ok || !json.email || !json.token) {
        setError(json.error ?? "Đăng nhập thất bại.");
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: json.email,
        token: json.token,
        type: "magiclink",
      });
      if (otpErr) {
        setError(otpErr.message);
        setLoading(false);
        return;
      }
      router.push(nextParam ?? "/journal");
      router.refresh();
    } catch {
      setError("Không thể kết nối server.");
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    padding: "10px 14px",
    background: CREAM,
    border: `1.5px solid ${focused === name ? TERRA : BORDER}`,
    color: INK,
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
    borderRadius: 0,
    boxShadow: focused === name ? `0 0 0 3px rgba(196,98,45,0.12)` : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: "420px",
    background: CREAM,
    border: `1.5px solid ${BORDER}`,
    borderTop: `3px solid ${TERRA}`,
    padding: "2.5rem 2rem",
    boxShadow: "0 4px 24px rgba(61,43,31,0.09), 0 1px 4px rgba(61,43,31,0.05)",
  };

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div style={{
          width: 50, height: 50,
          background: "#FAE8DB",
          border: `1.5px dashed ${TERRA}70`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1rem",
          fontSize: "1.4rem",
        }}>
          🎧
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: "1.5rem", fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.01em" }}>
          TOEIC Dictation
        </h1>
        <p style={{ color: MUTED, fontSize: "0.82rem", marginTop: "6px" }}>
          Đăng nhập để tiếp tục luyện tập
        </p>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, marginBottom: "1.5rem" }}>
        {(["email", "code"] as Tab[]).map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(""); }}
            style={{
              flex: 1,
              padding: "9px 0",
              background: tab === t ? TERRA : "transparent",
              color: tab === t ? "#fff" : MUTED,
              fontWeight: tab === t ? 700 : 500,
              fontSize: "0.82rem",
              border: "none",
              borderRight: i === 0 ? `1.5px solid ${BORDER}` : "none",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {t === "email" ? "📧 Email" : "🔢 Mã học viên"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "10px 14px",
            background: "rgba(180,60,40,0.07)",
            border: "1px solid rgba(180,60,40,0.25)",
            color: "#A03020", fontSize: "0.83rem", lineHeight: 1.5,
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Tab: Email ── */}
      {tab === "email" && (
        <>
          <button
            onClick={handleGoogleLogin}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "10px 18px",
              background: CREAM, border: `1.5px solid ${BORDER}`,
              color: INK, fontWeight: 600, fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "inherit",
              marginBottom: "1.25rem",
            }}
          >
            <GoogleIcon />
            Đăng nhập với Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", color: MUTED, textTransform: "uppercase" as const }}>hoặc</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="Email" htmlFor="login-email">
              <input
                id="login-email"
                type="email"
                style={inputStyle("email")}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Mật khẩu" htmlFor="login-password">
              <input
                id="login-password"
                type="password"
                style={inputStyle("password")}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="current-password"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px 24px",
                background: TERRA, color: "#fff",
                fontWeight: 700, fontSize: "0.9rem",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: "4px",
                boxShadow: `0 4px 16px ${TERRA}35`,
                fontFamily: "inherit",
              }}
            >
              {loading ? "Đang đăng nhập…" : "Đăng nhập →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.84rem", color: SEPIA }}>
            Chưa có tài khoản?{" "}
            <Link href="/auth/register" style={{ color: TERRA, fontWeight: 700, textDecoration: "none" }}>
              Đăng ký ngay
            </Link>
          </p>
        </>
      )}

      {/* ── Tab: Mã học viên ── */}
      {tab === "code" && (
        <form onSubmit={handleCodeLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Field label="Mã học viên" htmlFor="login-code">
            <input
              id="login-code"
              type="text"
              style={inputStyle("code")}
              placeholder="Nhập mã học viên"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={() => setFocused("code")}
              onBlur={() => setFocused(null)}
              required
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "11px 24px",
              background: TERRA, color: "#fff",
              fontWeight: 700, fontSize: "0.9rem",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 16px ${TERRA}35`,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Đang xử lý…" : "Vào nhật ký học tập →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.78rem", color: MUTED, lineHeight: 1.6 }}>
            Không cần mật khẩu — hệ thống tự tạo link đăng nhập cho bạn.
          </p>
        </form>
      )}

      {/* Footer ornament */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "1.75rem" }}>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
        <span style={{ fontSize: "0.55rem", letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          ✦ TOEIC DICTATION DIARY ✦
        </span>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
      </div>
    </div>
  );
}
