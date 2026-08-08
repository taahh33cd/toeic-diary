"use client";

import { useEffect, useRef } from "react";
import { StickyNote, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

/** Giấy nháp gõ chữ — nội dung lưu riêng theo từng URL bài tập. */
export function Scratchpad({ value, onChange, onClose }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      style={{
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: 14,
        overflow: "hidden",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 10px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          fontSize: ".78rem",
          fontWeight: 700,
        }}
      >
        <StickyNote size={14} />
        Giấy nháp
        <span
          style={{
            marginLeft: "auto",
            fontSize: ".68rem",
            fontWeight: 500,
            color: "var(--text-muted)",
          }}
        >
          tự lưu
        </span>
        <button
          type="button"
          title="Đóng"
          onClick={onClose}
          style={{
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 22,
            border: "none",
            borderRadius: 6,
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Ghi nháp ở đây…\n- từ mới\n- câu 32: loại B vì sai thì\n- đoán đáp án"}
        spellCheck={false}
        style={{
          width: "100%",
          height: 260,
          minHeight: 140,
          maxHeight: "50vh",
          resize: "vertical",
          border: "none",
          outline: "none",
          padding: "10px 12px",
          background: "transparent",
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
          fontSize: ".85rem",
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}
