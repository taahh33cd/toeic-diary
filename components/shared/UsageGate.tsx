"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useUsageTimer } from "@/hooks/useUsageTimer";

interface Props {
  /** Cumulative seconds already used, from server (DB value). */
  initialSeconds: number;
  /** True for admin / teacher / HV internal / enrolled users — skips the timer entirely. */
  isExempt: boolean;
}

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Client component that:
 *  1. Runs the usage timer (only for non-exempt free-tier users).
 *  2. Shows a warning toast when ≤ 10 min remain.
 *  3. Shows a full-screen lock overlay when 120 min is exhausted.
 *
 * Renders null for exempt users or users with plenty of time remaining.
 * Place it anywhere inside the page tree — it uses position:fixed overlays.
 */
export function UsageGate({ initialSeconds, isExempt }: Props) {
  const { isLocked, showWarning, remaining } = useUsageTimer(initialSeconds, isExempt);

  if (isLocked) {
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
          {/* Icon */}
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
            Hết thời gian dùng thử miễn phí
          </h2>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#4B5563",
              lineHeight: 1.7,
              marginBottom: "1.75rem",
            }}
          >
            Bạn đã sử dụng hết <strong>120 phút</strong> trải nghiệm miễn phí.
            Đăng ký khoá học để tiếp tục học không giới hạn.
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
              }}
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

  if (showWarning) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 84, // chừa góc phải dưới cho bubble annotate
          zIndex: 150,
          background: "#1e293b",
          color: "#fff",
          borderRadius: 12,
          padding: "12px 16px",
          maxWidth: 270,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⏱️</span>
        <div>
          <p style={{ fontWeight: 700, marginBottom: 3 }}>
            Còn {formatRemaining(remaining)} dùng thử miễn phí
          </p>
          <p style={{ color: "#94a3b8", fontSize: 11.5 }}>
            Đăng ký khoá học để học không giới hạn.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
