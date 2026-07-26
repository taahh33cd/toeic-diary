"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ALL_PARTS, PARTS, REAL_READING_MINUTES, TIME_PRESETS,
  hasSection, partMeta, suggestedMinutes,
  type ExamMode,
} from "@/lib/full-tests/parts";
import type { PartNumber } from "@/lib/full-tests/types";
import { PALETTE, type Palette, type Skin } from "./theme";

export interface RunConfig {
  mode: ExamMode;
  parts: PartNumber[];
  /** 0 = không giới hạn */
  minutes: number;
  autoSubmit: boolean;
  instantFeedback: boolean;
}

const MODES: { value: ExamMode; label: string; blurb: string; bullets: string[] }[] = [
  {
    value: "real",
    label: "Thi thật",
    blurb: "Mô phỏng đúng phòng thi",
    bullets: [
      "Audio chạy liền mạch một lần, không tua không nghe lại",
      "Listening theo audio (~45 phút) rồi khoá, Reading tính riêng 75 phút",
      "Không quay lại phần Listening đã qua",
    ],
  },
  {
    value: "practice",
    label: "Luyện tập",
    blurb: "Chủ động, có công cụ hỗ trợ",
    bullets: [
      "Mỗi câu một player riêng, nghe lại và đổi tốc độ 0.75×–1.5×",
      "Đi lại giữa các part tự do, tự chọn thời gian",
      "Có bút highlight và ô ghi chú",
    ],
  },
];

export function SetupPanel({
  title,
  examSlug,
  brokenQuestions,
  skin,
  onToggleSkin,
  onStart,
}: {
  title: string;
  examSlug: string;
  brokenQuestions: number[];
  skin: Skin;
  onToggleSkin: () => void;
  onStart: (cfg: RunConfig) => void;
}) {
  const P = PALETTE[skin];
  const [mode, setMode] = useState<ExamMode>("real");
  const [parts, setParts] = useState<PartNumber[]>(ALL_PARTS);
  const [minutes, setMinutes] = useState<number>(120);
  const [customTime, setCustomTime] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [instantFeedback, setInstantFeedback] = useState(false);

  const suggested = useMemo(() => suggestedMinutes(parts), [parts]);
  const questionCount = useMemo(
    () => parts.reduce((s, p) => s + partMeta(p).count, 0),
    [parts],
  );
  const realMode = mode === "real";

  function togglePart(p: PartNumber) {
    setParts((prev) => {
      const next = prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p];
      const sorted = next.sort((a, b) => a - b);
      if (!customTime) setMinutes(sorted.length ? suggestedMinutes(sorted) : 0);
      return sorted;
    });
  }

  function pickPreset(m: number) {
    setCustomTime(false);
    setMinutes(m);
  }

  const brokenInScope = brokenQuestions.filter((q) => {
    const meta = PARTS.find((p) => q >= p.first && q <= p.last);
    return meta && parts.includes(meta.part);
  });

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
          <Link href="/skills/full-tests" style={{ fontSize: "0.82rem", color: P.muted, textDecoration: "none" }}>
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
          <h1 style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 0.35rem" }}>
            {title}
          </h1>
          <p style={{ color: P.muted, fontSize: "0.9rem", margin: 0 }}>
            Chọn chế độ và phạm vi trước khi bắt đầu. Bài làm được lưu tự động, thoát giữa buổi vẫn làm tiếp được.
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
        </div>

        {/* Part */}
        <div style={box}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 style={h2}>Phần làm bài</h2>
            <button
              type="button"
              onClick={() => { setParts(ALL_PARTS); if (!customTime) setMinutes(120); }}
              style={{ background: "transparent", border: "none", color: P.primary, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: P.sans, padding: 0, marginBottom: "0.85rem" }}
            >
              Chọn tất cả
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "0.55rem" }}>
            {PARTS.map((p) => {
              const on = parts.includes(p.part);
              return (
                <button
                  key={p.part}
                  type="button"
                  onClick={() => togglePart(p.part)}
                  style={{
                    textAlign: "left", cursor: "pointer", fontFamily: P.sans,
                    background: on ? P.primarySoft : "transparent",
                    border: `1px solid ${on ? P.primary : P.border}`,
                    borderRadius: 9, padding: "0.6rem 0.7rem", color: P.ink,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: "0.88rem" }}>
                    <span style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${on ? P.primary : P.muted}`, background: on ? P.primary : "transparent", color: P.onPrimary, fontSize: "0.6rem", lineHeight: "11px", textAlign: "center", flexShrink: 0 }}>
                      {on ? "✓" : ""}
                    </span>
                    {p.label}
                  </span>
                  <span style={{ display: "block", fontSize: "0.72rem", color: P.muted, marginTop: 2, paddingLeft: 20 }}>
                    {p.labelVi} · {p.count} câu
                  </span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "0.78rem", color: P.muted, margin: "0.85rem 0 0" }}>
            Đã chọn <strong style={{ color: P.ink }}>{questionCount} câu</strong>
            {parts.length > 0 && <> · thời gian gợi ý <strong style={{ color: P.ink }}>{suggested} phút</strong></>}
          </p>
          {brokenInScope.length > 0 && (
            <p style={{ fontSize: "0.76rem", color: P.warn, margin: "0.5rem 0 0" }}>
              ⚠ Câu {brokenInScope.join(", ")} thiếu nội dung trong đề gốc nên sẽ bị bỏ qua và không tính điểm.
            </p>
          )}
        </div>

        {/* Thời gian */}
        <div style={box}>
          <h2 style={h2}>Thời gian</h2>
          {realMode ? (
            <div style={{ display: "grid", gap: 8 }}>
              <p style={{ fontSize: "0.86rem", color: P.inkSoft, margin: 0, lineHeight: 1.55 }}>
                Chế độ thi thật dùng hai đồng hồ riêng như đề thi TOEIC:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {hasSection(parts, "listening") && (
                  <span style={{ padding: "6px 12px", background: P.panelAlt, border: `1px solid ${P.border}`, borderRadius: 8, fontSize: "0.8rem" }}>
                    Listening — <strong>theo độ dài audio</strong> (~45 phút)
                  </span>
                )}
                {hasSection(parts, "reading") && (
                  <span style={{ padding: "6px 12px", background: P.panelAlt, border: `1px solid ${P.border}`, borderRadius: 8, fontSize: "0.8rem" }}>
                    Reading — <strong>{REAL_READING_MINUTES} phút</strong>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {TIME_PRESETS.map((t) => {
                  const on = !customTime && minutes === t.minutes;
                  return (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => pickPreset(t.minutes)}
                      style={{
                        cursor: "pointer", fontFamily: P.sans, fontSize: "0.83rem", fontWeight: 700,
                        background: on ? P.primary : "transparent",
                        color: on ? P.onPrimary : P.inkSoft,
                        border: `1px solid ${on ? P.primary : P.border}`,
                        borderRadius: 999, padding: "7px 15px",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
                <label style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${customTime ? P.primary : P.border}`, borderRadius: 999, padding: "5px 13px", fontSize: "0.83rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    checked={customTime}
                    onChange={() => setCustomTime(true)}
                    style={{ accentColor: P.primary }}
                  />
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={minutes || ""}
                    onFocus={() => setCustomTime(true)}
                    onChange={(e) => { setCustomTime(true); setMinutes(Math.max(0, Number(e.target.value))); }}
                    style={{ width: 52, background: "transparent", border: "none", color: P.ink, fontFamily: P.sans, fontSize: "0.83rem", fontWeight: 700 }}
                  />
                  phút
                </label>
              </div>
              <p style={{ fontSize: "0.78rem", color: P.muted, margin: "0.8rem 0 0" }}>
                {minutes === 0 ? "Không bấm giờ — làm bao lâu cũng được." : `Đồng hồ đếm ngược ${minutes} phút cho ${questionCount} câu.`}
              </p>
            </>
          )}
        </div>

        {/* Tuỳ chọn */}
        <div style={box}>
          <h2 style={h2}>Tuỳ chọn</h2>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            <Toggle
              P={P}
              checked={autoSubmit}
              disabled={!realMode && minutes === 0}
              onChange={setAutoSubmit}
              label="Tự động nộp bài khi hết giờ"
              hint={!realMode && minutes === 0 ? "Không áp dụng khi không giới hạn thời gian" : "Bỏ chọn thì chỉ hiện cảnh báo, vẫn làm tiếp được"}
            />
            <Toggle
              P={P}
              checked={!realMode && instantFeedback}
              disabled={realMode}
              onChange={setInstantFeedback}
              label="Hiện đáp án và giải thích ngay sau khi chọn"
              hint={realMode ? "Chỉ có ở chế độ Luyện tập" : "Học nhanh hơn nhưng không còn giống thi thật"}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={parts.length === 0}
          onClick={() => onStart({ mode, parts, minutes: realMode ? 0 : minutes, autoSubmit, instantFeedback })}
          style={{
            width: "100%", padding: "0.95rem", borderRadius: 11, border: "none",
            background: parts.length ? P.primary : P.border,
            color: parts.length ? P.onPrimary : P.muted,
            fontFamily: P.sans, fontSize: "1rem", fontWeight: 800,
            cursor: parts.length ? "pointer" : "not-allowed",
          }}
        >
          {parts.length === 0 ? "Chọn ít nhất một part" : `Bắt đầu · ${questionCount} câu`}
        </button>

        <p style={{ fontSize: "0.72rem", color: P.muted, textAlign: "center", margin: 0 }}>
          {examSlug.toUpperCase().replace(/-/g, " ")}
        </p>
      </div>
    </div>
  );
}

function Toggle({
  P, checked, disabled, onChange, label, hint,
}: {
  P: Palette;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: P.primary, width: 16, height: 16, flexShrink: 0 }}
      />
      <span>
        <span style={{ display: "block", fontSize: "0.88rem", fontWeight: 600 }}>{label}</span>
        {hint && <span style={{ display: "block", fontSize: "0.75rem", color: P.muted, marginTop: 1 }}>{hint}</span>}
      </span>
    </label>
  );
}
