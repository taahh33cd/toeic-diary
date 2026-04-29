import { Suspense } from "react";
import { LoginForm } from "./_login-form";

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)",
      padding: "24px",
    }}>
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
      maxWidth: "400px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      padding: "40px",
      boxShadow: "var(--shadow-lg)",
    }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎧</div>
        <div style={{ height: "28px", width: "160px", background: "var(--border)", borderRadius: "8px", margin: "0 auto 8px" }} />
        <div style={{ height: "16px", width: "200px", background: "var(--border)", borderRadius: "8px", margin: "0 auto" }} />
      </div>
      <div style={{ height: "44px", background: "var(--border)", borderRadius: "10px", marginBottom: "16px" }} />
      <div style={{ height: "16px", width: "40px", background: "var(--border)", borderRadius: "8px", margin: "0 auto 16px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ height: "64px", background: "var(--border)", borderRadius: "10px" }} />
        <div style={{ height: "64px", background: "var(--border)", borderRadius: "10px" }} />
        <div style={{ height: "44px", background: "var(--border)", borderRadius: "10px" }} />
      </div>
    </div>
  );
}
