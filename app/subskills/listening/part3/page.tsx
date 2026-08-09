import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART3_LEVELS, TRANSCRIPT_POLICY_VI, part3AttemptKey } from "@/lib/subskills/part3";

export const metadata: Metadata = { title: "Listening Part 3 & 4 — Subskills TOEIC" };

export default async function ListeningPart3Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: { in: PART3_LEVELS.map((l) => part3AttemptKey(l.level)) } },
          select: { part: true, questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  // Điểm cao nhất theo (cấp độ, bài)
  const best: Record<string, { score: number; passed: boolean }> = {};
  for (const a of attempts) {
    const key = `${a.part}:${a.questionWord}`;
    if (!best[key] || a.score > best[key].score) best[key] = { score: a.score, passed: a.passed };
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 1000,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/listening" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Listening</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Part 3 &amp; 4</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Listening · Part 3 &amp; 4
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.6rem" }}>
          Hội thoại &amp; bài nói — 5 cấp độ
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
          Thi trên máy không cho đọc câu hỏi trước, chỉ có khoảng 3 giây. Cả 5 cấp độ dưới đây
          luyện đúng hai thứ bù lại điều đó: đoán trước đề bài sắp hỏi gì, và bắt được đáp án
          dù nó luôn được diễn đạt lại chứ không lặp từ trong bài.
        </p>
      </div>

      {/* Điều đo được từ đề thật */}
      <div
        style={{
          padding: "0.9rem 1.1rem",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          marginBottom: "1.75rem",
        }}
      >
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Đo trên 230 bộ đề EST 2026
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>
          <li>Câu 1 hỏi nơi chốn / nghề nghiệp / mục đích trong <strong>60%</strong> số bộ.</li>
          <li>Câu 3 hỏi hành động tiếp theo hoặc yêu cầu trong <strong>47%</strong> số bộ.</li>
          <li>Câu 2 rải đều mọi dạng — <strong>đừng đoán câu giữa</strong>, dồn sức nghe.</li>
          <li>Câu hàm ý và câu nhìn bảng biểu gần như không rơi vào câu 1 (<strong>0.4%</strong> và <strong>1.7%</strong>).</li>
        </ul>
      </div>

      {/* Lối vào chế độ Nghe sâu */}
      <Link
        href="/subskills/listening/part3/nghe-sau"
        className="r-row"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
          padding: "1.1rem 1.4rem",
          marginBottom: "1.5rem",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          textDecoration: "none",
        }}
      >
        <span style={{ fontSize: "1.15rem", lineHeight: 1.2, flexShrink: 0 }}>🎧</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.97rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
            Nghe sâu — quy trình 5 bước
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            230 đoạn nghe đầy đủ transcript và từ mới. Làm đề khi chưa biết gì, tra từ, nghe kèm
            chữ và đọc theo, rồi nghe chay đến khi hiểu trọn. Đây là phần xây nền; các cấp độ bên
            dưới là phần rèn phản xạ.
          </p>
        </div>
        <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, alignSelf: "center" }}>→</span>
      </Link>

      {/* Danh sách cấp độ */}
      <div
        className="stagger-children animate-slide-up"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {PART3_LEVELS.map((lv, idx) => {
          const marks = lv.drills.map((d) => best[`${part3AttemptKey(lv.level)}:${d.id}`] ?? null);
          const done = marks.filter(Boolean).length;
          const passedAll = marks.every((m) => m?.passed);
          const totalItems = lv.drills.reduce((s, d) => s + d.items.length, 0);

          return (
            <Link
              key={lv.level}
              href={`/subskills/listening/part3/${lv.level}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1.3rem 1.6rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < PART3_LEVELS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 2,
                  background: passedAll && done > 0 ? "rgba(34,197,94,0.15)" : done > 0 ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)",
                  border: `1.5px solid ${passedAll && done > 0 ? "rgba(34,197,94,0.5)" : done > 0 ? "rgba(234,179,8,0.5)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: passedAll && done > 0 ? "rgb(34,197,94)" : "var(--text-muted)",
                }}
              >
                {passedAll && done > 0 ? "✓" : lv.level.toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "1.03rem", fontWeight: 700, color: "var(--text-primary)" }}>{lv.title}</span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "var(--accent-primary)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "2px 7px",
                    }}
                  >
                    {lv.band}
                  </span>
                </div>
                <p style={{ margin: "0 0 0.55rem", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {lv.goal}
                </p>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                    {lv.drills.length} bài · {totalItems} câu
                  </span>
                  <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                    Tốc độ {lv.config.playbackRate}×
                  </span>
                  <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                    {TRANSCRIPT_POLICY_VI[lv.config.transcriptPolicy]}
                  </span>
                  {lv.config.replayLimit !== null && (
                    <span style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                      Nghe tối đa {lv.config.replayLimit} lần
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 3, flexShrink: 0, alignSelf: "center" }}>
                {marks.map((m, i) => (
                  <span
                    key={i}
                    title={`Bài ${i + 1}: ${m ? `${m.score}%` : "chưa làm"}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      background: m?.passed ? "rgba(34,197,94,0.18)" : m ? "rgba(239,68,68,0.13)" : "var(--bg-elevated)",
                      color: m?.passed ? "rgb(34,197,94)" : m ? "rgb(239,68,68)" : "var(--text-muted)",
                      border: `1px solid ${m?.passed ? "rgba(34,197,94,0.35)" : m ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                    }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>

              <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          );
        })}
      </div>

      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
