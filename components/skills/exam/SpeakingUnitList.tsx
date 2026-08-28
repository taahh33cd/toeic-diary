"use client";

import { useState } from "react";
import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import type { SpeakingMode } from "./SpeakingRunner";

/** Indigo của khu Luyện đề (trùng `bg` truyền cho Header ở app/skills/layout.tsx). */
const SKILLS_ACCENT = "#4f46e5";

export interface UnitListTest {
  slug: string;
  /** Nhãn ngắn ở góc thẻ, vd "Đề 3" */
  tag: string;
  title: string;
  subtitle?: string;
  free: boolean;
}

export interface UnitListGroup {
  id: string;
  label: string;
  labelEn: string;
  hint: string;
  color: string;
  tests: UnitListTest[];
}

/**
 * Danh sách bộ đề dùng chung cho các unit Speaking chỉ có chữ + audio
 * (Q1-2, Q5-7, Q11). Nút chọn chế độ ở đầu trang gắn `?mode=` vào mọi liên kết.
 */
export function SpeakingUnitList({
  skill,
  unit,
  unlocked,
  intro,
  freeNote,
  groups,
}: {
  skill: Skill;
  unit: SkillUnit;
  unlocked: boolean;
  intro: string;
  freeNote?: string;
  groups: UnitListGroup[];
}) {
  const [mode, setMode] = useState<SpeakingMode>("practice");
  const total = groups.reduce((a, g) => a + g.tests.length, 0);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 960,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/skills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Luyện đề</Link>
        <span>›</span>
        <Link href={`/skills/${skill.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{skill.label}</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{unit.label}</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          {skill.emoji} {skill.label} · {unit.label}
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          {unit.labelVi}{" "}
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({unit.labelEn})</span>
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{unit.description}</p>
      </div>

      <ModePicker mode={mode} onChange={setMode} />

      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "1.2rem 0 0.9rem" }}>
        {total} bộ đề. {intro}
      </p>

      {!unlocked && freeNote && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 1.3rem" }}>🔓 {freeNote}</p>
      )}

      {groups.map((g) => {
        if (g.tests.length === 0) return null;
        return (
          <section key={g.id} style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: g.color, display: "inline-block" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {g.label}{" "}
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({g.labelEn})</span>
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{g.tests.length} bộ đề</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 0.8rem" }}>{g.hint}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "0.8rem" }}>
              {g.tests.map((t) => {
                const locked = !unlocked && !t.free;
                const box: React.CSSProperties = {
                  display: "block",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${g.color}`,
                  borderRadius: 10,
                  padding: "0.75rem 0.9rem",
                  textDecoration: "none",
                  color: "var(--text-primary)",
                };
                const body = (
                  <>
                    <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      {t.tag}{locked ? " 🔒" : ""}
                    </span>
                    <span style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, lineHeight: 1.35, marginTop: 2 }}>{t.title}</span>
                    {t.subtitle && (
                      <span style={{ display: "block", fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.45, marginTop: 4 }}>{t.subtitle}</span>
                    )}
                    {locked && (
                      <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>Cần đăng ký khoá</span>
                    )}
                  </>
                );

                return locked ? (
                  <div key={t.slug} style={{ ...box, opacity: 0.5, cursor: "not-allowed" }}>{body}</div>
                ) : (
                  <Link key={t.slug} href={`/skills/${skill.slug}/${unit.slug}/${t.slug}?mode=${mode}`} style={box}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Nút chọn chế độ, dùng chung cho Speaking và Writing.
 * Mô tả mặc định viết cho Speaking — khu Writing phải truyền `descriptions`
 * riêng, kẻo hiện chữ "nghe lại" và "thu âm" ở một bài viết.
 */
export function ModePicker({
  mode,
  onChange,
  descriptions,
  icons,
}: {
  mode: SpeakingMode;
  onChange: (m: SpeakingMode) => void;
  descriptions?: Record<SpeakingMode, string>;
  icons?: Record<SpeakingMode, string>;
}) {
  const DEFAULT_DESC: Record<SpeakingMode, string> = {
    practice: "Nghe lại tuỳ ý · có chữ và bản dịch · thu âm lại nhiều lần",
    exam: "Đúng nhịp phòng thi · audio phát một lần · hết giờ tự chuyển câu",
  };
  const DEFAULT_ICON: Record<SpeakingMode, string> = { practice: "🎧", exam: "⏱" };
  const desc = descriptions ?? DEFAULT_DESC;
  const icon = icons ?? DEFAULT_ICON;

  const OPTIONS: { id: SpeakingMode; label: string; desc: string; icon: string }[] = [
    { id: "practice", label: "Luyện tập", icon: icon.practice, desc: desc.practice },
    { id: "exam", label: "Thi thử", icon: icon.exam, desc: desc.exam },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.7rem" }}>
      {OPTIONS.map((o) => {
        const on = mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              textAlign: "left",
              padding: "0.75rem 0.9rem",
              borderRadius: 10,
              border: `1.5px solid ${on ? SKILLS_ACCENT : "var(--border)"}`,
              background: on ? "rgba(79,70,229,0.08)" : "var(--bg-secondary)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.92rem", fontWeight: 700, color: on ? SKILLS_ACCENT : "var(--text-primary)" }}>
              <span
                style={{
                  width: 15, height: 15, borderRadius: "50%", flexShrink: 0,
                  border: `1.5px solid ${on ? SKILLS_ACCENT : "var(--border)"}`,
                  background: on ? SKILLS_ACCENT : "transparent",
                  boxShadow: on ? "inset 0 0 0 3px var(--bg-secondary)" : undefined,
                }}
              />
              {o.icon} {o.label}
            </span>
            <span style={{ display: "block", fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: 4 }}>{o.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
