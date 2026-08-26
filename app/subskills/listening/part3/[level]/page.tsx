import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART3_LEVELS, getPart3Level, TRANSCRIPT_POLICY_VI, part3AttemptKey } from "@/lib/subskills/part3";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ level: string }> };

export function generateStaticParams() {
  return PART3_LEVELS.map((l) => ({ level: l.level }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level } = await params;
  const lv = getPart3Level(level);
  return { title: lv ? `${lv.title} (${lv.band}) — Listening Part 3 & 4` : "Subskills" };
}

const KIND_VI: Record<string, string> = {
  classify: "Phân loại",
  position: "Đoán vị trí",
  "predict-set": "Dự đoán",
  "listen-mcq": "Nghe hiểu",
  "full-set": "Trọn bộ 3 câu",
  evidence: "Truy ngược",
  paraphrase: "Paraphrase",
  trap: "Bắt bẫy",
  "fill-blank": "Điền từ",
};

export default async function Part3LevelPage({ params }: Props) {
  const { level } = await params;
  const lv = getPart3Level(level);
  if (!lv) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: part3AttemptKey(lv.level) },
          select: { questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const best: Record<string, { score: number; passed: boolean }> = {};
  for (const a of attempts) {
    if (!best[a.questionWord] || a.score > best[a.questionWord].score) {
      best[a.questionWord] = { score: a.score, passed: a.passed };
    }
  }

  const order = PART3_LEVELS.findIndex((l) => l.level === lv.level);
  const prev = order > 0 ? PART3_LEVELS[order - 1] : null;
  const next = order < PART3_LEVELS.length - 1 ? PART3_LEVELS[order + 1] : null;

  return (
    <div
      style={{
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: `${PAD_Y} ${PAD_X}`,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills/listening" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Listening</Link>
        <span>›</span>
        <Link href="/subskills/listening/part3" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 3 &amp; 4</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{lv.title}</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: FS.xs, color: "var(--accent-primary)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.3rem" }}>
          {lv.level.toUpperCase()} · {lv.band}
        </p>
        <h1 style={{ fontSize: "clamp(1.25rem, 3vw, 1.6rem)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, margin: "0 0 0.55rem" }}>
          {lv.title}
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.7 }}>{lv.goal}</p>
      </div>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.75rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
        <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px" }}>
          Tốc độ {lv.config.playbackRate}×
        </span>
        <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px" }}>
          {TRANSCRIPT_POLICY_VI[lv.config.transcriptPolicy]}
        </span>
        <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px" }}>
          {lv.config.replayLimit === null ? "Nghe lại thoải mái" : `Nghe tối đa ${lv.config.replayLimit} lần`}
        </span>
        <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px" }}>
          Qua bài từ {lv.passThreshold}%
        </span>
      </div>

      <div
        className="stagger-children animate-slide-up"
        style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
      >
        {lv.drills.map((d, idx) => {
          const m = best[d.id] ?? null;
          return (
            <Link
              key={d.id}
              href={`/subskills/listening/part3/${lv.level}/${d.id}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.1rem",
                padding: "1.2rem 1.5rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < lv.drills.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 2,
                  background: m?.passed ? "rgba(34,197,94,0.15)" : m ? "rgba(239,68,68,0.12)" : "var(--bg-elevated)",
                  border: `1.5px solid ${m?.passed ? "rgba(34,197,94,0.5)" : m ? "rgba(239,68,68,0.35)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: FS.xs,
                  fontWeight: 700,
                  color: m?.passed ? "rgb(34,197,94)" : m ? "rgb(239,68,68)" : "var(--text-muted)",
                }}
              >
                {m?.passed ? "✓" : idx + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{d.title}</span>
                  <span style={{ fontSize: FS.xs, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" }}>
                    {KIND_VI[d.kind] ?? d.kind}
                  </span>
                </div>
                <p style={{ margin: "0 0 0.4rem", fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {d.instruction}
                </p>
                <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
                  {d.items.length} câu{m ? ` · điểm cao nhất ${m.score}%` : ""}
                </span>
              </div>

              <span className="r-arrow" style={{ fontSize: FS.sm, color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
        {prev ? (
          <Link href={`/subskills/listening/part3/${prev.level}`} style={{ fontSize: FS.xs, color: "var(--text-muted)", textDecoration: "none" }}>
            ← {prev.title} ({prev.band})
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/subskills/listening/part3/${next.level}`} style={{ fontSize: FS.xs, color: "var(--accent-primary)", textDecoration: "none" }}>
            {next.title} ({next.band}) →
          </Link>
        )}
      </div>

      <div style={{ width: "100%", marginTop: "auto", paddingTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
