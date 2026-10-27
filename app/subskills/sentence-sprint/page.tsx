import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { BRANCHES, SPRINT_LEVELS, TOPICS, attemptPart } from "@/lib/subskills/sentence-sprint";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Đặt câu nhanh — Subskills" };

export default async function SentenceSprintPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Đếm số cấp đã qua ở mỗi bộ, khoá "<part>:<level>"
  const passed = new Set<string>();
  if (user) {
    const parts = TOPICS.flatMap((t) => [attemptPart(t.slug, "viet"), attemptPart(t.slug, "noi")]);
    const attempts = await prisma.subskillAttempt
      .findMany({
        where: { userId: user.id, part: { in: parts }, passed: true },
        select: { part: true, questionWord: true },
      })
      .catch(() => []);
    for (const a of attempts) passed.add(`${a.part}:${a.questionWord}`);
  }

  const totalWords = TOPICS.reduce((n, t) => n + t.entries.length, 0);

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
        }}
      >
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Subskills
        </Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Đặt câu nhanh</span>
      </div>

      <section
        style={{
          background: "#1E5F8E",
          borderRadius: "var(--radius-xl, 16px)",
          padding: "clamp(1.4rem, 3.5vw, 2.2rem)",
          marginBottom: "1.75rem",
        }}
      >
        <p
          style={{
            fontSize: FS.xs,
            color: "rgba(255,255,255,0.65)",
            margin: "0 0 0.5rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Subskill · Speaking &amp; Writing
        </p>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 3.6vw, 2rem)",
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 0.6rem",
            lineHeight: 1.2,
          }}
        >
          ⚡ Đặt câu nhanh
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: 760 }}>
          Biết nghĩa của từ mà vẫn im lặng mấy giây mới ra được câu — đó không phải lỗ hổng từ vựng,
          đó là lỗ hổng phản xạ. Khu này cho sẵn từ rồi bắt bạn dựng câu trong thời gian đếm ngược:
          nhánh Viết gõ, nhánh Nói ghi âm rồi chuyển thành chữ để chấm.
        </p>
        <p style={{ margin: "0.9rem 0 0", fontSize: FS.xs, color: "rgba(255,255,255,0.6)" }}>
          {TOPICS.length} bộ chủ đề · {totalWords} từ · {SPRINT_LEVELS.length} cấp
        </p>
      </section>

      {/* Hai nhánh */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "0.85rem",
          marginBottom: "1.75rem",
        }}
      >
        {(["viet", "noi"] as const).map((b) => (
          <div
            key={b}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 12px)",
              background: "var(--bg-elevated)",
              padding: "1rem",
            }}
          >
            <p style={{ margin: "0 0 0.35rem", fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)" }}>
              {BRANCHES[b].emoji} {BRANCHES[b].label}
            </p>
            <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {BRANCHES[b].blurb}
            </p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.85rem" }}>
        Chọn bộ từ
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem" }}>
        {TOPICS.map((t) => {
          const done =
            SPRINT_LEVELS.filter((l) => passed.has(`${attemptPart(t.slug, l.branch)}:${l.slug}`)).length;
          return (
            <Link
              key={t.slug}
              href={`/subskills/sentence-sprint/${t.slug}`}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg, 12px)",
                background: "var(--bg-elevated)",
                padding: "1.1rem",
                textDecoration: "none",
                display: "block",
              }}
            >
              <p style={{ margin: "0 0 0.4rem", fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>
                {t.emoji} {t.name}
              </p>
              <p style={{ margin: "0 0 0.75rem", fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {t.blurb}
              </p>
              <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)" }}>
                {t.entries.length} từ · {t.combos.length} bài ghép nhiều từ · qua {done}/{SPRINT_LEVELS.length} cấp
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
