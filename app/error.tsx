"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        Có lỗi xảy ra
      </h1>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          marginBottom: "24px",
          maxWidth: "320px",
        }}
      >
        Trang này gặp sự cố. Vui lòng thử lại hoặc liên hệ giáo viên nếu lỗi tiếp tục.
      </p>
      <button
        onClick={reset}
        className="btn btn-primary"
        style={{ minWidth: "120px" }}
      >
        Thử lại
      </button>
    </div>
  );
}
