import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getTopicConfig, isLevelUnlocked } from "@/lib/subskills/translation";
import { topicToPartKey, type BestScore } from "@/lib/subskills/translation/types";
import { CONTAINER_MAX, FILL_SCREEN, FS } from "@/lib/ui/scale";

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const config = getTopicConfig(topic);
  return { title: config ? `${config.name} — Dịch Anh–Việt` : "Dịch Anh–Việt" };
}

export default async function TranslationTopicPage({ params }: Props) {
  const { topic } = await params;
  const config = getTopicConfig(topic);
  if (!config) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/subskills/translation/${topic}`);

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { studentCode: true } })
    .catch(() => null);
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const partKey = topicToPartKey(topic);
  const attempts = await prisma.subskillAttempt
    .findMany({
      where: { userId: user.id, part: partKey },
      select: { questionWord: true, score: true, passed: true },
    })
    .catch(() => []);

  const best: Record<string, BestScore> = {};
  for (const a of attempts) {
    const cur = best[a.questionWord];
    if (!cur || a.score > cur.score) best[a.questionWord] = { score: a.score, passed: a.passed };
  }

  return (
    <div
      style={{
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 5vw, 3rem)",
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <Link
        href="/subskills/translation"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: FS.sm,
          color: "var(--text-muted)",
          textDecoration: "none",
          marginBottom: "1.25rem",
        }}
      >
        <ArrowLeft size={14} /> Dịch Anh–Việt
      </Link>

      <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.4rem" }}>
        {config.name}
      </h1>
      <p style={{ fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 1.25rem" }}>
        {config.problem}
      </p>

      {/* Nguyên tắc + ví dụ */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.1rem 1.15rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
          <Sparkles size={15} style={{ color: "var(--accent-primary)" }} />
          <span style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)" }}>Nguyên tắc</span>
        </div>
        <p style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.7, margin: "0 0 0.9rem" }}>
          {config.principle}
        </p>
        <div style={{ padding: "0.7rem 0.8rem", borderRadius: 8, background: "var(--bg-secondary)", fontSize: FS.sm, lineHeight: 1.7 }}>
          <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>{config.sample.en}</div>
          <div style={{ color: "#b91c1c" }}>✗ {config.sample.wrong}</div>
          <div style={{ color: "#15803d" }}>✓ {config.sample.right}</div>
        </div>
      </div>

      {/* 6 level */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {config.levels.map((level) => {
          const unlocked = isLevelUnlocked(level.slug, best, isTestUser);
          const record = best[level.slug];
          const aiGraded = level.level >= 5;

          const inner = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
                background: "var(--bg-elevated)",
                border: `1px solid ${record?.passed ? "#86efac" : "var(--border)"}`,
                borderRadius: 12,
                padding: "0.95rem 1.1rem",
                opacity: unlocked ? 1 : 0.55,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: FS.sm,
                  background: record?.passed ? "#dcfce7" : "var(--bg-secondary)",
                  color: record?.passed ? "#15803d" : "var(--text-muted)",
                }}
              >
                L{level.level}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>
                    {level.name}
                  </span>
                  {aiGraded && (
                    <span
                      style={{
                        padding: "1px 7px",
                        borderRadius: 99,
                        background: "rgba(1,62,55,0.08)",
                        color: "var(--accent-primary)",
                        fontSize: FS.xs,
                        fontWeight: 700,
                      }}
                    >
                      AI chấm
                    </span>
                  )}
                </div>
                <p style={{ fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.55, margin: "0.2rem 0 0" }}>
                  {level.description}
                </p>
              </div>

              <div style={{ flexShrink: 0, textAlign: "right" }}>
                {!unlocked ? (
                  <Lock size={16} style={{ color: "var(--text-muted)" }} />
                ) : record ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {record.passed && <CheckCircle2 size={14} style={{ color: "#16a34a" }} />}
                    <span
                      style={{
                        fontSize: FS.sm,
                        fontWeight: 700,
                        color: record.passed ? "#15803d" : "var(--text-muted)",
                      }}
                    >
                      {record.score}%
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
                    {level.questions.length} câu
                  </span>
                )}
              </div>
            </div>
          );

          return unlocked ? (
            <Link
              key={level.slug}
              href={`/subskills/translation/${topic}/${level.slug}`}
              style={{ textDecoration: "none" }}
            >
              {inner}
            </Link>
          ) : (
            <div key={level.slug} title="Cần pass level trước">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
