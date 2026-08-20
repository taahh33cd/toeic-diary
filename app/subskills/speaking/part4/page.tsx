import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART4_BANDS, SPEAKING_P4_SKILLS } from "@/lib/subskills/speaking-part4";

export const metadata: Metadata = { title: "Part 4 — Trả lời theo thông tin cho trước | Subskills" };

const BAND_COLOR: Record<string, string> = {
  "nen": "rgb(34,197,94)",
  "trong-tam": "rgb(234,179,8)",
  "nang-cao": "rgb(239,68,68)",
};

export default async function SpeakingPart4Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: { startsWith: "sp4-" } },
          select: { part: true, questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/speaking" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Speaking</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Part 4</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          🗣 Speaking · Questions 8–10
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          Trả lời theo thông tin cho trước
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Tách phần thi thành từng kỹ năng nhỏ, luyện trên chính những bảng thông tin bạn sẽ gặp ở{" "}
          <Link href="/skills/speaking/q8-10" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>khu luyện đề</Link>.
          Mỗi kỹ năng có 3 cấp: nhận diện → viết ra → nói và chấm phát âm.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {PART4_BANDS.map((band) => {
        const skills = SPEAKING_P4_SKILLS.filter((s) => s.band === band.id);
        const color = BAND_COLOR[band.id];
        return (
          <section key={band.id} style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: "0.2rem", flexWrap: "wrap" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{band.label}</h2>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>
                {band.target}
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 0.8rem" }}>{band.hint}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              {skills.map((s, i) => {
                const mine = attempts.filter((a) => a.part === s.part || a.part.startsWith(`${s.part}-`));
                const passed = new Set(mine.filter((a) => a.passed).map((a) => `${a.part}:${a.questionWord}`)).size;

                const row = (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                        <span style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.labelVi}</span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>({s.label})</span>
                        {!s.ready && (
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                            Sắp có
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.description}</p>
                      {s.ready && (
                        <div style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>
                            3 bộ · 3 cấp · 45 bài
                          </span>
                          {passed > 0 && (
                            <span style={{ fontSize: "0.68rem", color: "rgb(34,197,94)" }}>{passed} lượt đạt ≥ 80%</span>
                          )}
                        </div>
                      )}
                    </div>
                    {s.ready && <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>}
                  </>
                );

                const base: React.CSSProperties = {
                  display: "flex", alignItems: "flex-start", gap: "1rem",
                  padding: "1.05rem 1.3rem",
                  background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                  borderBottom: i < skills.length - 1 ? "1px solid var(--border)" : "none",
                  borderLeft: `3px solid ${s.ready ? color : "transparent"}`,
                };

                return s.ready ? (
                  <Link key={s.id} href={`/subskills/speaking/part4/${s.id}`} className="r-row" style={{ ...base, textDecoration: "none" }}>
                    {row}
                  </Link>
                ) : (
                  <div key={s.id} style={{ ...base, opacity: 0.55 }}>{row}</div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div style={{ width: "100%", marginTop: "2rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
