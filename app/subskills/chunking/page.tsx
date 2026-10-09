import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  attemptPart,
  BRANCHES,
  levelsOf,
  LISTEN_PASSAGES,
  type Branch,
} from "@/lib/subskills/chunking";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Chunking — Subskills" };

export default async function ChunkingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Điểm cao nhất của mỗi cấp, khoá là "<part>:<level slug>"
  const best: Record<string, { score: number; passed: boolean }> = {};
  if (user) {
    const attempts = await prisma.subskillAttempt
      .findMany({
        where: { userId: user.id, part: { in: [attemptPart("noi"), attemptPart("nghe")] } },
        select: { part: true, questionWord: true, score: true, passed: true },
      })
      .catch(() => []);
    for (const a of attempts) {
      const key = `${a.part}:${a.questionWord}`;
      if (!best[key] || a.score > best[key].score) best[key] = { score: a.score, passed: a.passed };
    }
  }

  const chunkCount = LISTEN_PASSAGES.reduce(
    (n, p) => n + p.lines.reduce((m, l) => m + l.chunks.length, 0),
    0
  );

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
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Chunking</span>
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
          Subskill nền
        </p>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 3.6vw, 2rem)",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            margin: "0 0 0.6rem",
          }}
        >
          Chunking — cắt câu thành cụm nghĩa
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, maxWidth: 760 }}>
          Người bản ngữ không nói từng từ, họ nói từng <strong>cụm</strong> 3-5 từ rồi nghỉ rất ngắn.
          Nói theo cụm thì hết vụn; nghe theo cụm thì bắt được nghĩa mà không phải dịch từng từ. Hai
          nhánh dưới đây dùng chung một quy ước ranh giới, nên cụm bạn tập đọc đúng là cụm bạn phải bắt
          khi nghe.
        </p>
      </section>

      <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {(["noi", "nghe"] as Branch[]).map((branch) => (
          <section
            key={branch}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 12px)",
              background: "var(--bg-elevated)",
              padding: "1.1rem",
            }}
          >
            <h2
              style={{
                margin: "0 0 0.35rem",
                fontSize: FS.md,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {BRANCHES[branch].emoji} {BRANCHES[branch].label}
            </h2>
            <p style={{ margin: "0 0 1rem", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {BRANCHES[branch].blurb}
            </p>

            <div style={{ display: "grid", gap: "0.5rem" }}>
              {levelsOf(branch).map((lv, i) => {
                const b = best[`${attemptPart(branch)}:${lv.slug}`];
                return (
                  <Link
                    key={lv.slug}
                    href={`/subskills/chunking/${branch}/${lv.slug}`}
                    style={{
                      display: "block",
                      padding: "0.75rem 0.9rem",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.6rem" }}>
                      <span style={{ fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)" }}>
                        Cấp {i + 1} · {lv.name}
                      </span>
                      {b && (
                        <span
                          style={{
                            fontSize: FS.xs,
                            fontWeight: 700,
                            color: b.passed ? "rgb(34,197,94)" : "var(--text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {b.score}%
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0.25rem 0 0", fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                      {lv.goal}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p style={{ margin: "1.5rem 0 0", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.7 }}>
        Nhánh Nghe lấy {LISTEN_PASSAGES.length} đoạn hội thoại Part 3 và độc thoại Part 4 từ đề EST
        2026, cắt thành {chunkCount} cụm; ranh giới được đối chiếu với chỗ ngừng thật trong audio.
        Nhánh Nói đo nhịp đọc của chính bản thu của bạn — ngưỡng chấm được hiệu chỉnh theo giọng
        phát thanh viên trong đề, nên đọc đúng như họ là đạt.
      </p>
    </div>
  );
}
