"use client";

import { useState } from "react";
import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { ModePicker } from "./SpeakingUnitList";
import type { SpeakingMode } from "./SpeakingRunner";

export interface MockRow {
  slug: string;
  label: string;
  parts: string[];
  free: boolean;
}

/** Danh sách đề thi thử trọn bộ (Speaking 11 câu · Writing 8 câu). */
export function MockTestList({
  skill,
  unit,
  unlocked,
  mocks,
  intro,
  color,
}: {
  skill: Skill;
  unit: SkillUnit;
  unlocked: boolean;
  mocks: MockRow[];
  intro: string;
  color: string;
}) {
  const [mode, setMode] = useState<SpeakingMode>("exam");

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-primary)", padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/skills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Luyện đề</Link>
        <span>›</span>
        <Link href={`/skills/${skill.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{skill.label}</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{unit.label}</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          {skill.emoji} {skill.label} · Thi thử trọn bộ
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          {unit.labelEn}{" "}
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({unit.labelVi})</span>
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{unit.description}</p>
      </div>

      <ModePicker
        mode={mode}
        onChange={setMode}
        icons={skill.slug === "writing" ? { practice: "🗒️", exam: "⏱" } : undefined}
        descriptions={
          skill.slug === "writing"
            ? {
                practice: "Không giới hạn thời gian · tự bấm chuyển câu",
                exam: "Q1-5 8 phút · Q6 và Q7 mỗi câu 10 phút · Q8 30 phút · hết giờ tự sang phần sau",
              }
            : undefined
        }
      />

      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "1.2rem 0 1.2rem" }}>{intro}</p>

      <div style={{ display: "grid", gap: "0.7rem" }}>
        {mocks.map((m) => {
          const locked = !unlocked && !m.free;
          const box: React.CSSProperties = {
            display: "block",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderLeft: `3px solid ${color}`,
            borderRadius: 10,
            padding: "0.85rem 1rem",
            textDecoration: "none",
            color: "var(--text-primary)",
          };
          const body = (
            <>
              <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 700 }}>
                {m.label}{locked ? " 🔒" : ""}
              </span>
              <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55, marginTop: 3 }}>
                {m.parts.join("  ·  ")}
              </span>
              {locked && (
                <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>Cần đăng ký khoá</span>
              )}
            </>
          );
          return locked ? (
            <div key={m.slug} style={{ ...box, opacity: 0.5, cursor: "not-allowed" }}>{body}</div>
          ) : (
            <Link key={m.slug} href={`/skills/${skill.slug}/mock/${m.slug}?mode=${mode}`} style={box}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
