import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PhonemicChart } from "@/components/subskills/ipa/PhonemicChart";
import { ipaSectionTotal } from "@/lib/subskills/ipa";

export const metadata: Metadata = { title: "IPA / Pronunciation — Subskills TOEIC" };

const SECTIONS = [
  { key: "vowels", label: "Vowels — Nguyên âm đơn", desc: "Nghe & phân biệt các nguyên âm ngắn/dài dễ nhầm." },
  { key: "diphthongs", label: "Diphthongs — Nguyên âm đôi", desc: "Luyện 5 nguyên âm đôi giọng Mỹ." },
  { key: "consonants", label: "Consonants — Phụ âm", desc: "Phụ âm khó, đuôi -s/-ed, phiên âm." },
];

export default async function IpaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  type Row = { section: string; difficulty: string; exerciseIndex: number; passed: boolean };
  const attempts: Row[] = user
    ? await prisma.ipaAttempt
        .findMany({ where: { userId: user.id }, select: { section: true, difficulty: true, exerciseIndex: true, passed: true } })
        .catch(() => [] as Row[])
    : [];

  // done = unique (difficulty:exerciseIndex) attempted; passed = unique passed, per section
  const doneBySection: Record<string, Set<string>> = {};
  const passBySection: Record<string, Set<string>> = {};
  for (const a of attempts) {
    const key = `${a.difficulty}:${a.exerciseIndex}`;
    (doneBySection[a.section] ??= new Set()).add(key);
    if (a.passed) (passBySection[a.section] ??= new Set()).add(key);
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>IPA / Pronunciation</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          🔤 IPA / Pronunciation
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          Luyện phát âm theo IPA
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Khám phá bảng phiên âm tương tác (giọng Mỹ), sau đó luyện tập từng nhóm âm theo cấp độ Easy → Medium → Hard.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Section 1 — Interactive Phonemic Chart (placeholder, Phase 2) */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.75rem" }}>
          Interactive Phonemic Chart
        </h2>
        <PhonemicChart />
      </section>

      {/* Section 2 — Exercises by group (placeholder, Phase 3-4) */}
      <section>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.75rem" }}>
          Bài tập theo nhóm âm
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
          {SECTIONS.map((s, idx) => (
            <Link
              key={s.key}
              id={`ex-${s.key}`}
              href={`/subskills/ipa/${s.key}`}
              className="r-row"
              style={{
                display: "flex", alignItems: "center", gap: "1.25rem",
                padding: "1.3rem 1.6rem", textDecoration: "none",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                borderBottom: idx < SECTIONS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{s.label}</div>
                <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.desc}</p>
                {(() => {
                  const total = ipaSectionTotal(s.key);
                  const done = doneBySection[s.key]?.size ?? 0;
                  const passed = passBySection[s.key]?.size ?? 0;
                  return (
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>
                      {done > 0 ? `${done}/${total} bài · ${passed} đạt` : `${total} bài · 3 cấp độ`}
                    </span>
                  );
                })()}
              </div>
              <span style={{ color: "var(--accent-primary)", flexShrink: 0 }}>→</span>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
