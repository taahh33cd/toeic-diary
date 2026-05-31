"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ── Design tokens — matches landing page ─────────────────────
const CREAM  = "#FFFDF6";
const BEIGE  = "#F5EFE6";
const INK    = "#3D2B1F";
const SEPIA  = "#6B4C2A";
const TERRA  = "#C4622D";
const MUTED  = "#9A8672";
const BORDER = "#D9C9B8";
const SERIF  = "'Lora', Georgia, serif";
const GRAIN  = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.048'/%3E%3C/svg%3E")`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: MUTED, marginBottom: "6px" }}>
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

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
      <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", color: MUTED, textTransform: "uppercase" as const }}>hoặc</span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

export default function RegisterPage() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [focused, setFocused]         = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) { setError(error.message); setLoading(false); }
    else        { setSuccess(true); setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

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

  const page: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `${GRAIN}, ${BEIGE}`,
    backgroundBlendMode: "multiply",
    padding: "clamp(1.5rem, 4vw, 3rem) 1rem",
    gap: "1.25rem",
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: "420px",
    background: CREAM,
    border: `1.5px solid ${BORDER}`,
    borderTop: `3px solid ${TERRA}`,
    padding: "2.5rem 2rem",
    boxShadow: "0 4px 24px rgba(61,43,31,0.09), 0 1px 4px rgba(61,43,31,0.05)",
  };

  if (success) {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📧</div>
            <h2 style={{ fontFamily: SERIF, fontSize: "1.4rem", color: INK, fontWeight: 700, marginBottom: "0.75rem" }}>
              Kiểm tra email!
            </h2>
            <p style={{ color: SEPIA, fontSize: "0.87rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Đã gửi link xác nhận đến <strong>{email}</strong>.
              Kiểm tra hộp thư và click vào link để kích hoạt tài khoản.
            </p>
            <Link
              href="/auth/login"
              style={{
                display: "inline-flex",
                padding: "10px 24px",
                background: TERRA, color: "#fff",
                fontWeight: 700, fontSize: "0.88rem",
                textDecoration: "none",
                boxShadow: `0 4px 16px ${TERRA}40`,
              }}
            >
              Về trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <Link
        href="/home"
        style={{ fontSize: "0.78rem", color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
      >
        ← Về trang chủ
      </Link>

      <div style={card}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "1.5rem", fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.01em" }}>
            Tạo tài khoản
          </h1>
          <p style={{ color: MUTED, fontSize: "0.82rem", marginTop: "6px" }}>
            Bắt đầu hành trình luyện TOEIC ngay hôm nay
          </p>
        </div>

        {/* Google */}
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
          Đăng ký với Google
        </button>

        <Divider />

        {/* Form */}
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem" }}>
          {error && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(180,60,40,0.07)",
              border: "1px solid rgba(180,60,40,0.25)",
              color: "#A03020", fontSize: "0.83rem", lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <Field label="Tên hiển thị">
            <input
              type="text"
              style={inputStyle("name")}
              placeholder="Nguyễn Văn A"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              required
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              style={inputStyle("email")}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              required
            />
          </Field>

          <Field label="Mật khẩu">
            <input
              type="password"
              style={inputStyle("password")}
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              minLength={6}
              required
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
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản →"}
          </button>
        </form>

        {/* Footer ornament */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "1.5rem 0 0" }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            ✦ TOEIC DICTATION DIARY ✦
          </span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.84rem", color: SEPIA }}>
          Đã có tài khoản?{" "}
          <Link href="/auth/login" style={{ color: TERRA, fontWeight: 700, textDecoration: "none" }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
