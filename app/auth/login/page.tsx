import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./_login-form";

const CREAM  = "#FFFDF6";
const BEIGE  = "#F5EFE6";
const TERRA  = "#C4622D";
const BORDER = "#D9C9B8";
const MUTED  = "#9A8672";
const GRAIN  = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.048'/%3E%3C/svg%3E")`;

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: `${GRAIN}, ${BEIGE}`,
      backgroundBlendMode: "multiply",
      padding: "clamp(1.5rem, 4vw, 3rem) 1rem",
      gap: "1.25rem",
    }}>
      <Link
        href="/home"
        style={{ fontSize: "0.78rem", color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
      >
        ← Về trang chủ
      </Link>
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div style={{
      width: "100%",
      maxWidth: "420px",
      background: CREAM,
      border: `1.5px solid ${BORDER}`,
      borderTop: `3px solid ${TERRA}`,
      padding: "2.5rem 2rem",
      boxShadow: "0 4px 24px rgba(61,43,31,0.09)",
    }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 50, height: 50, background: "#FAE8DB", margin: "0 auto 1rem" }} />
        <div style={{ height: "24px", width: "200px", background: BORDER, margin: "0 auto 8px" }} />
        <div style={{ height: "14px", width: "220px", background: BORDER, margin: "0 auto" }} />
      </div>
      <div style={{ height: "40px", background: BORDER, marginBottom: "16px" }} />
      <div style={{ height: "1px", background: BORDER, marginBottom: "20px" }} />
      <div style={{ height: "42px", background: "#FAE8DB", marginBottom: "16px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ height: "58px", background: BORDER }} />
        <div style={{ height: "58px", background: BORDER }} />
        <div style={{ height: "42px", background: BORDER }} />
      </div>
    </div>
  );
}
