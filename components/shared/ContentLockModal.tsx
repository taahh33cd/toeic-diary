"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Full-screen fixed overlay shown when the user hasn't enrolled in any course.
 * Non-dismissable — user must go enroll or contact support.
 *
 * Usage (server component passes locked=true):
 *   {locked && <ContentLockModal />}
 */
export function ContentLockModal() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(10, 20, 40, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "2.5rem 2rem",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          <Lock size={26} color="#D97706" />
        </div>

        <h2
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "#0B1C30",
            marginBottom: "0.6rem",
            lineHeight: 1.35,
          }}
        >
          Nội dung dành riêng cho học viên
        </h2>

        <p
          style={{
            fontSize: "0.875rem",
            color: "#4B5563",
            lineHeight: 1.7,
            marginBottom: "1.75rem",
          }}
        >
          Bạn chưa đăng ký khoá học nào. Hãy xem các gói học và đăng ký để
          truy cập toàn bộ nội dung Dictation, Ngữ pháp và Reading.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Link
            href="/course"
            style={{
              display: "block",
              padding: "12px 24px",
              borderRadius: 8,
              background: "#C4622D",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            Xem khoá học →
          </Link>

          <Link
            href="/home"
            style={{
              display: "block",
              padding: "11px 24px",
              borderRadius: 8,
              border: "1.5px solid #E5E7EB",
              color: "#6B7280",
              fontWeight: 500,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Về trang chủ
          </Link>
        </div>

        <p
          style={{
            marginTop: "1.25rem",
            fontSize: "0.75rem",
            color: "#9CA3AF",
          }}
        >
          Đã đăng ký? Liên hệ thầy/cô để được cấp quyền truy cập.
        </p>
      </div>
    </div>
  );
}
