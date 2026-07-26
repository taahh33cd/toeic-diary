import type { Metadata } from "next";
import Link from "next/link";
import { EXAM_SETS, listTests, PARTS } from "@/lib/full-tests";

export const metadata: Metadata = { title: "Full Test — Luyện đề TOEIC" };

// Cùng palette với /skills
const C = {
  bg: "#f6f6fb",
  ink: "#201d33",
  muted: "#6b6880",
  card: "#ffffff",
  border: "#e7e6f0",
  accent: "#4f46e5",
  accentSoft: "#eef0fe",
};

export default function FullTestsLanding() {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: C.bg, color: C.ink, padding: "clamp(1.75rem, 5vw, 3.5rem) clamp(1.25rem, 5vw, 2rem)" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        <Link href="/skills" style={{ fontSize: "0.82rem", color: C.muted, textDecoration: "none" }}>
          ← Luyện đề
        </Link>

        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent, margin: "1.1rem 0 0.6rem" }}>
          TOEIC · Full Test
        </p>
        <h1 style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 0.6rem" }}>
          Thi thử trọn đề
        </h1>
        <p style={{ fontSize: "1rem", color: C.muted, lineHeight: 1.6, maxWidth: "56ch", margin: 0 }}>
          200 câu Listening &amp; Reading trong 120 phút như phòng thi thật — hoặc chọn riêng part
          và thời gian để luyện từng phần.
        </p>

        {/* Cấu trúc đề */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "1.4rem" }}>
          {PARTS.map((p) => (
            <span key={p.part} style={{ display: "inline-flex", alignItems: "baseline", gap: 6, padding: "6px 11px", background: C.accentSoft, border: `1px solid ${C.border}`, borderRadius: 999, fontSize: "0.78rem" }}>
              <strong>{p.label}</strong>
              <span style={{ color: C.muted }}>{p.labelVi} · {p.count} câu</span>
            </span>
          ))}
        </div>

        {/* Bộ đề */}
        <div style={{ display: "grid", gap: "1.1rem", marginTop: "2.2rem" }}>
          {EXAM_SETS.map((exam) => {
            const tests = listTests(exam.slug);
            const ready = tests.filter((t) => !t.locked);

            return (
              <section key={exam.slug} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.3rem", opacity: exam.available ? 1 : 0.55 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: exam.available ? "1rem" : 0 }}>
                  <span>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>{exam.title}</h2>
                    <span style={{ fontSize: "0.78rem", color: C.muted }}>
                      {exam.available ? `${ready.length}/${tests.length} đề sẵn sàng` : exam.subtitle}
                    </span>
                  </span>
                  {!exam.available && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 999, padding: "4px 10px" }}>
                      Sắp có
                    </span>
                  )}
                </div>

                {exam.available && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.7rem" }}>
                    {tests.map((t) => {
                      const inner = (
                        <>
                          <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 700 }}>
                            Test {t.testNumber}
                          </span>
                          <span style={{ display: "block", fontSize: "0.72rem", color: C.muted, marginTop: 2 }}>
                            {t.locked ? "Thiếu đáp án gốc" : `${t.questions} câu · 120 phút`}
                          </span>
                        </>
                      );

                      if (t.locked) {
                        return (
                          <div
                            key={t.slug}
                            title={t.lockReason ?? undefined}
                            style={{ border: `1px dashed ${C.border}`, borderRadius: 11, padding: "0.85rem 0.95rem", background: C.bg, color: C.muted, cursor: "not-allowed" }}
                          >
                            {inner}
                            <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 6 }}>
                              Sắp có
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={t.slug}
                          href={`/skills/full-tests/${exam.slug}/${t.testNumber}`}
                          className="skill-card-link"
                          style={{ display: "block", border: `1px solid ${C.border}`, borderRadius: 11, padding: "0.85rem 0.95rem", textDecoration: "none", color: C.ink, transition: "border-color .15s, box-shadow .15s" }}
                        >
                          {inner}
                          <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: C.accent, marginTop: 6 }}>
                            Bắt đầu →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p style={{ textAlign: "center", fontSize: "0.7rem", letterSpacing: "0.1em", color: C.muted, marginTop: "3rem" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
