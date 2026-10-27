import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { BRANCHES, TOPICS, attemptPart, getTopic, levelsOf } from "@/lib/subskills/sentence-sprint";
import type { BestScore } from "@/lib/subskills/sentence-sprint/types";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const t = getTopic(topic);
  return { title: t ? `${t.name} — Đặt câu nhanh` : "Đặt câu nhanh" };
}

export default async function SentenceSprintTopicPage({ params }: Props) {
  const { topic } = await params;
  const t = getTopic(topic);
  if (!t) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const best: Record<string, BestScore> = {};
  if (user) {
    const attempts = await prisma.subskillAttempt
      .findMany({
        where: {
          userId: user.id,
          part: { in: [attemptPart(t.slug, "viet"), attemptPart(t.slug, "noi")] },
        },
        select: { part: true, questionWord: true, score: true, passed: true },
      })
      .catch(() => []);
    for (const a of attempts) {
      const key = `${a.part}:${a.questionWord}`;
      if (!best[key] || a.score > best[key].score) best[key] = { score: a.score, passed: a.passed };
    }
  }

  return (
    <div
      className="page-enter"
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: "1.25rem",
          fontSize: FS.xs,
          color: "var(--text-muted)",
          flexWrap: "wrap",
        }}
      >
        <Link href="/subskills/sentence-sprint" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Đặt câu nhanh
        </Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{t.name}</span>
      </div>

      <h1
        style={{
          fontSize: "clamp(1.25rem, 2.8vw, 1.6rem)",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 0.4rem",
        }}
      >
        {t.emoji} {t.name}
      </h1>
      <p style={{ margin: "0 0 1.5rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        {t.blurb}
      </p>

      {/* Bộ từ của chủ đề */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 12px)",
          background: "var(--bg-elevated)",
          padding: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <p style={{ margin: "0 0 0.6rem", fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 600 }}>
          {t.entries.length} từ của bộ này
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {t.entries.map((e) => (
            <span
              key={e.en}
              style={{
                padding: "0.3rem 0.65rem",
                borderRadius: 999,
                border: "1px solid var(--border)",
                fontSize: FS.xs,
                color: "var(--text-primary)",
              }}
            >
              {e.en} <span style={{ color: "var(--text-muted)" }}>· {e.vi}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hai nhánh, mỗi nhánh 5 cấp */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        {(["viet", "noi"] as const).map((branch) => (
          <section key={branch}>
            <h2 style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.3rem" }}>
              {BRANCHES[branch].emoji} {BRANCHES[branch].label}
            </h2>
            <p style={{ margin: "0 0 0.85rem", fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {BRANCHES[branch].blurb}
            </p>

            <div style={{ display: "grid", gap: "0.6rem" }}>
              {levelsOf(branch).map((lv, i) => {
                const b = best[`${attemptPart(t.slug, branch)}:${lv.slug}`];
                return (
                  <Link
                    key={lv.slug}
                    href={`/subskills/sentence-sprint/${t.slug}/${branch}/${lv.slug}`}
                    style={{
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${b?.passed ? "rgb(34,197,94)" : "var(--border)"}`,
                      borderRadius: "var(--radius-lg, 12px)",
                      background: "var(--bg-elevated)",
                      padding: "0.85rem 1rem",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                    }}
                  >
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        flexShrink: 0,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: FS.xs,
                        fontWeight: 700,
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)" }}>
                        {lv.name}
                      </span>
                      <span style={{ display: "block", fontSize: FS.xs, color: "var(--text-muted)", marginTop: 2 }}>
                        {lv.count} câu · {lv.seconds}s mỗi câu · đích {lv.passThreshold}%
                      </span>
                    </span>
                    {b && (
                      <span
                        style={{
                          fontSize: FS.xs,
                          fontWeight: 700,
                          color: b.passed ? "rgb(34,197,94)" : "rgb(234,179,8)",
                        }}
                      >
                        {b.score}%
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
