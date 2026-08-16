"use client";

import { useState } from "react";
import Link from "next/link";
import { partMeta } from "@/lib/full-tests/parts";
import type { PartNumber } from "@/lib/full-tests/types";
import { PALETTE, type Skin } from "@/components/full-tests/theme";
import { Toggle, type RunConfig } from "@/components/full-tests/SetupPanel";

type Mode = RunConfig["mode"];

const MODES: { value: Mode; label: string; blurb: string; bullets: string[] }[] = [
  {
    value: "real",
    label: "Thi thử",
    blurb: "Mô phỏng đúng phòng thi",
    bullets: [
      "Audio chạy liền một mạch, không tua không nghe lại",
      "Thời gian cố định theo độ dài audio, hết là khoá",
      "Chữ và đáp án chỉ hiện sau khi nộp bài",
    ],
  },
  {
    value: "practice",
    label: "Luyện tập",
    blurb: "Chủ động, có công cụ hỗ trợ",
    bullets: [
      "Mỗi câu một player riêng, nghe lại và đổi tốc độ 0.75×–1.5×",
      "Không giới hạn thời gian, đi lại giữa các câu tự do",
      "Có bút highlight và ô ghi chú",
    ],
  },
];

/**
 * Bản rút gọn của SetupPanel cho màn luyện một part: part đã cố định theo URL,
 * thời gian không cho chỉnh (Thi thử = theo audio, Luyện tập = không giới hạn)
 * nên chỉ còn đúng lựa chọn chế độ.
 */
export function PartSetupPanel({
  title,
  part,
  questionCount,
  backHref,
  brokenQuestions,
  skin,
  onToggleSkin,
  onStart,
}: {
  title: string;
  part: PartNumber;
  /** Số câu thật của bộ đề — không lấy theo PARTS vì bộ đề có thể thiếu câu */
  questionCount: number;
  backHref: string;
  brokenQuestions: number[];
  skin: Skin;
  onToggleSkin: () => void;
  onStart: (cfg: RunConfig) => void;
}) {
  const P = PALETTE[skin];
  const [mode, setMode] = useState<Mode>("real");
  const [instantFeedback, setInstantFeedback] = useState(false);

  const meta = partMeta(part);
  const realMode = mode === "real";

  const box: React.CSSProperties = {
    background: P.panel,
    border: `1px solid ${P.border}`,
    borderRadius: 14,
    padding: "1.2rem 1.3rem",
  };
  const h2: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em",
    textTransform: "uppercase", color: P.muted, margin: "0 0 0.85rem",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: P.bg, color: P.ink, fontFamily: P.sans, padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", display: "grid", gap: "1rem" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href={backHref} style={{ fontSize: "0.82rem", color: P.muted, textDecoration: "none" }}>
            ← Danh sách đề
          </Link>
          <button
            type="button"
            onClick={onToggleSkin}
            style={{ background: "transparent", border: `1px solid ${P.border}`, borderRadius: 999, padding: "5px 12px", color: P.inkSoft, fontSize: "0.78rem", cursor: "pointer", fontFamily: P.sans }}
          >
            {skin === "light" ? "🌙 Tối" : "☀️ Sáng"}
          </button>
        </div>

        <div>
          <p style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.primary, margin: "0 0 0.4rem" }}>
            {meta.label} · {meta.labelVi}
          </p>
          <h1 style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 0.35rem" }}>
            {title}
          </h1>
          <p style={{ color: P.muted, fontSize: "0.9rem", margin: 0 }}>
            {questionCount} câu. Bài làm được lưu tự động, thoát giữa buổi vẫn làm tiếp được.
          </p>
        </div>

        {/* Chế độ */}
        <div style={box}>
          <h2 style={h2}>Chế độ làm bài</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.7rem" }}>
            {MODES.map((m) => {
              const on = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  style={{
                    textAlign: "left", cursor: "pointer", fontFamily: P.sans,
                    background: on ? P.primarySoft : "transparent",
                    border: `2px solid ${on ? P.primary : P.border}`,
                    borderRadius: 11, padding: "0.85rem 0.95rem", color: P.ink,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.98rem" }}>
                    <span style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${on ? P.primary : P.muted}`, background: on ? P.primary : "transparent", flexShrink: 0 }} />
                    {m.label}
                  </span>
                  <span style={{ display: "block", fontSize: "0.76rem", color: P.muted, margin: "2px 0 0.6rem", paddingLeft: 23 }}>
                    {m.blurb}
                  </span>
                  <ul style={{ margin: 0, paddingLeft: 23, listStyle: "none", display: "grid", gap: 4 }}>
                    {m.bullets.map((b) => (
                      <li key={b} style={{ fontSize: "0.78rem", color: P.inkSoft, lineHeight: 1.45, display: "flex", gap: 6 }}>
                        <span style={{ color: on ? P.primary : P.muted }}>•</span>{b}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          {brokenQuestions.length > 0 && (
            <p style={{ fontSize: "0.76rem", color: P.warn, margin: "0.85rem 0 0" }}>
              ⚠ Câu {brokenQuestions.join(", ")} thiếu file audio gốc nên sẽ bị bỏ qua và không tính điểm.
            </p>
          )}
        </div>

        {/* Tuỳ chọn — chỉ có ý nghĩa ở chế độ Luyện tập */}
        <div style={box}>
          <h2 style={h2}>Tuỳ chọn</h2>
          <Toggle
            P={P}
            checked={!realMode && instantFeedback}
            disabled={realMode}
            onChange={setInstantFeedback}
            label="Hiện đáp án ngay sau khi chọn"
            hint={realMode ? "Chỉ có ở chế độ Luyện tập" : "Học nhanh hơn nhưng không còn giống thi thật"}
          />
        </div>

        <button
          type="button"
          onClick={() => onStart({
            mode,
            parts: [part],
            // Thi thử chạy theo audio, Luyện tập không bấm giờ ⇒ không có đồng hồ đếm ngược.
            minutes: 0,
            autoSubmit: true,
            instantFeedback: !realMode && instantFeedback,
          })}
          style={{
            width: "100%", padding: "0.95rem", borderRadius: 11, border: "none",
            background: P.primary, color: P.onPrimary,
            fontFamily: P.sans, fontSize: "1rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          Bắt đầu · {questionCount} câu
        </button>
      </div>
    </div>
  );
}
