"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TERRA = "#C4622D";
const INK = "#3D2B1F";
const SEPIA = "#6B4C2A";
const SERIF = "var(--font-display,'Lora',Georgia,serif)";

const CONFETTI = ["#C4622D", "#4A7C59", "#E0A458", "#6366f1", "#e55a6b"];

/**
 * App-wide: on load, asks the server whether this account just unlocked a
 * course (owns it but hasn't seen the celebration). If so, shows a one-time
 * congrats popup and acks it so it never re-appears. Renders nothing otherwise.
 */
export function CourseUnlockCelebration() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/course-unlock");
        const data = await res.json();
        if (!cancelled && data.celebrate) setShow(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    setShow(false);
    fetch("/api/me/course-unlock", { method: "POST" }).catch(() => {});
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(10,20,40,0.72)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={dismiss}
    >
      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden>
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "-10%",
              left: `${(i * 97) % 100}%`,
              width: 8, height: 12,
              background: CONFETTI[i % CONFETTI.length],
              borderRadius: 2,
              opacity: 0.9,
              animation: `celebrate-fall ${2.5 + (i % 5) * 0.4}s linear ${(i % 10) * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#fff", borderRadius: 18, padding: "2.5rem 2rem 2rem",
          maxWidth: 400, width: "100%", textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          animation: "celebrate-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div style={{ fontSize: "3.25rem", marginBottom: "0.5rem" }}>🎉</div>
        <h2 style={{ fontFamily: SERIF, fontSize: "1.4rem", fontWeight: 700, color: INK, marginBottom: "0.6rem" }}>
          Chúc mừng! Bạn đã được mở khoá
        </h2>
        <p style={{ fontSize: "0.9rem", color: SEPIA, lineHeight: 1.7, marginBottom: "1.75rem" }}>
          Tài khoản của bạn đã kích hoạt <strong>Khoá 0 — Tự luyện trọn đời</strong>.
          Toàn bộ bài luyện nghe Part 1–4, ngữ pháp và đọc hiểu giờ đã mở khoá không
          giới hạn. Chúc bạn học vui! 🚀
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Link
            href="/dictation"
            onClick={dismiss}
            style={{
              display: "block", padding: "12px 24px", borderRadius: 8,
              background: TERRA, color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
            }}
          >
            Vào học ngay →
          </Link>
          <button
            onClick={dismiss}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "1.5px solid #E5E7EB",
              color: "#6B7280", fontWeight: 500, fontSize: "0.875rem", background: "transparent", cursor: "pointer",
            }}
          >
            Để sau
          </button>
        </div>
      </div>

      <style>{`
        @keyframes celebrate-pop { from { opacity: 0; transform: scale(0.9) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes celebrate-fall { to { transform: translateY(110vh) rotate(540deg); } }
      `}</style>
    </div>
  );
}
