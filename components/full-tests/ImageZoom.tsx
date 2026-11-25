"use client";

import { useEffect, useState } from "react";

/**
 * Xem ảnh toàn màn hình. Ảnh co theo chiều ngang và cuộn dọc (bài đọc Part 7
 * thường cao); chạm vào ảnh để phóng to gấp đôi, chạm nền hoặc Esc để đóng.
 */
export default function ImageZoom({ src, onClose }: { src: string; onClose: () => void }) {
  const [big, setBig] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(6,10,20,.86)", zIndex: 60, overflow: "auto", padding: "3rem 0.75rem 1.5rem", cursor: "zoom-out" }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        style={{ position: "fixed", top: 10, right: 12, width: 38, height: 38, borderRadius: 19, border: "none", background: "rgba(255,255,255,.92)", color: "#111", fontSize: 22, lineHeight: 1, cursor: "pointer", zIndex: 61 }}
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onClick={(e) => {
          e.stopPropagation();
          setBig((v) => !v);
        }}
        style={{
          display: "block",
          margin: "0 auto",
          borderRadius: 8,
          background: "#fff",
          cursor: big ? "zoom-out" : "zoom-in",
          ...(big ? { width: "min(200%, 1600px)", maxWidth: "none" } : { maxWidth: "100%", height: "auto" }),
        }}
      />
    </div>
  );
}
