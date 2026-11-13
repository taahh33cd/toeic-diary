"use client";

import { useState } from "react";
import Link from "next/link";
import { EXAM } from "@/lib/skills/exam-theme";
import { isAiGradable, type SubmissionItem } from "@/lib/submissions";

type Variant = "app" | "exam";

/** Màn thi khoá nền trắng nên không dùng CSS var của app được. */
const TOKENS: Record<Variant, { bg: string; border: string; ink: string; muted: string; accent: string }> = {
  app: {
    bg: "var(--bg-elevated)",
    border: "var(--border)",
    ink: "var(--text-primary)",
    muted: "var(--text-muted)",
    accent: "var(--accent-primary)",
  },
  exam: {
    bg: EXAM.panel,
    border: EXAM.border,
    ink: EXAM.ink,
    muted: EXAM.muted,
    accent: "#1e419a",
  },
};

type Props = {
  skill: string;
  unit: string;
  testKey: string;
  title: string;
  /** Gọi lúc bấm nút — cho phép upload audio ngay trước khi lưu. */
  buildItems: () => SubmissionItem[] | Promise<SubmissionItem[]>;
  /** Chỉ học viên đã đăng ký khoá học mới gửi bài chấm được. */
  canSubmit: boolean;
  variant?: Variant;
};

/**
 * Lưu bài làm vào sổ tay và gửi đi chấm.
 * Dùng chung cho mọi unit Speaking/Writing của /skills.
 *
 * Phần nào có AI chấm thì hiện hai nút riêng, vì hai đường khác nhau thật:
 * "Nhờ AI chấm" cho nhận xét ngay và bài nằm ở tab "AI đã chấm" để thầy soát
 * lại; "Gửi giáo viên chấm" đi thẳng vào hàng chờ của thầy, không gọi AI nên
 * không tốn lượt nào trong 5 lượt mỗi ngày. Phần chưa có AI chỉ hiện nút sau.
 */
export function SubmissionPanel({ skill, unit, testKey, title, buildItems, canSubmit, variant = "app" }: Props) {
  const t = TOKENS[variant];
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "ai" | "teacher" | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * "running" = đang chấm tại chỗ (Writing) · "queued" = đã nhận, chấm nền và
   * sẽ push (Speaking) · "done" = có nhận xét · "failed" = bài nằm chờ giáo viên.
   */
  const [ai, setAi] = useState<"running" | "queued" | "done" | "failed" | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const aiGrades = isAiGradable(skill, unit);

  /**
   * Gọi AI chấm ngay sau khi gửi. Thất bại không phải lỗi của học viên: bài đã
   * nằm trong danh sách chờ của giáo viên rồi, nên chỉ ghi một dòng giải thích.
   */
  async function runAi(submissionId: string) {
    setAi("running");
    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Lỗi ${res.status}`);
      setAi(data?.queued ? "queued" : "done");
    } catch (e) {
      setAiNote(e instanceof Error ? e.message : "AI chưa chấm được bài này");
      setAi("failed");
    }
  }

  /**
   * "save" = chỉ lưu nháp · "ai" = gửi rồi nhờ AI chấm ngay · "teacher" = gửi
   * thẳng vào hàng chờ của thầy, KHÔNG gọi AI và không tốn lượt chấm nào.
   */
  async function post(mode: "save" | "ai" | "teacher") {
    const submit = mode !== "save";
    setBusy(mode);
    setError(null);
    try {
      const items = await buildItems();
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, skill, unit, testKey, title, items, submit }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Lỗi ${res.status}`);
      const newId: string | null = data.submission?.id ?? id;
      setId(newId);
      if (submit) {
        setSent(true);
        if (mode === "ai" && newId) void runAi(newId);
      } else setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được, thử lại nhé");
    } finally {
      setBusy(null);
    }
  }

  if (sent) {
    const box = { border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg, padding: "12px 14px", textAlign: "center" as const };
    const head = { margin: 0, fontSize: "0.88rem", fontWeight: 700, color: t.ink };
    const sub = { margin: "5px 0 0", fontSize: "0.8rem", color: t.muted };

    if (ai === "running") {
      return (
        <div style={box}>
          <p style={head}>Đã gửi ✓ — AI đang chấm…</p>
          <p style={sub}>Khoảng 10–20 giây, bạn đợi ở đây nhé.</p>
        </div>
      );
    }

    if (ai === "queued") {
      return (
        <div style={box}>
          <p style={head}>Đã gửi ✓ — AI đang nghe bài nói của bạn</p>
          <p style={sub}>
            Chấm xong bạn sẽ nhận được thông báo.{" "}
            <Link href="/journal/submissions" style={{ color: t.accent, fontWeight: 600 }}>Xem trong sổ tay →</Link>
          </p>
        </div>
      );
    }

    if (ai === "done") {
      return (
        <div style={box}>
          <p style={head}>AI đã chấm xong ✓</p>
          <p style={sub}>
            Điểm AI ước tính, không thay điểm thi chính thức — giáo viên vẫn soát lại.{" "}
            <Link href={id ? `/journal/submissions/${id}` : "/journal/submissions"} style={{ color: t.accent, fontWeight: 600 }}>
              Xem nhận xét →
            </Link>
          </p>
        </div>
      );
    }

    return (
      <div style={box}>
        <p style={head}>Đã gửi giáo viên chấm ✓</p>
        <p style={sub}>
          {aiNote ? `${aiNote} ` : "Có nhận xét bạn sẽ nhận được thông báo. "}
          <Link href="/journal/submissions" style={{ color: t.accent, fontWeight: 600 }}>Xem trong sổ tay →</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg, padding: "12px 14px" }}>
      <p style={{ margin: "0 0 9px", fontSize: "0.8rem", color: t.muted, lineHeight: 1.55 }}>
        Lưu bài này vào <strong style={{ color: t.ink }}>sổ tay</strong> để xem lại bất cứ lúc nào
        {!canSubmit
          ? "."
          : aiGrades
          ? ". Nhờ AI chấm để có nhận xét ngay, hoặc gửi thẳng cho giáo viên."
          : ", hoặc gửi giáo viên chấm và nhận xét."}
      </p>

      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => post("save")}
          disabled={busy !== null}
          style={{ padding: "8px 18px", border: `1.5px solid ${t.border}`, background: "transparent", color: t.ink, borderRadius: 8, fontSize: "0.84rem", fontWeight: 600, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}
        >
          {busy === "save" ? "Đang lưu…" : savedAt ? "Đã lưu ✓ — lưu lại" : "Lưu vào sổ tay"}
        </button>

        {canSubmit && aiGrades && (
          <button
            type="button"
            onClick={() => post("ai")}
            disabled={busy !== null}
            style={{ padding: "8px 18px", border: "none", background: t.accent, color: "#fff", borderRadius: 8, fontSize: "0.84rem", fontWeight: 700, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}
          >
            {busy === "ai" ? "Đang gửi…" : "Nhờ AI chấm"}
          </button>
        )}

        {canSubmit && (
          // Phần đã có AI thì nút này là đường riêng: gửi thẳng cho thầy, không
          // gọi AI — nên để viền thay vì nền đặc, khỏi tranh chỗ với nút AI.
          <button
            type="button"
            onClick={() => post("teacher")}
            disabled={busy !== null}
            style={
              aiGrades
                ? { padding: "8px 18px", border: `1.5px solid ${t.accent}`, background: "transparent", color: t.accent, borderRadius: 8, fontSize: "0.84rem", fontWeight: 700, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }
                : { padding: "8px 18px", border: "none", background: t.accent, color: "#fff", borderRadius: 8, fontSize: "0.84rem", fontWeight: 700, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }
            }
          >
            {busy === "teacher" ? "Đang gửi…" : "Gửi giáo viên chấm"}
          </button>
        )}
      </div>

      {error && <p style={{ margin: "9px 0 0", fontSize: "0.79rem", color: EXAM.bad }}>{error}</p>}
    </div>
  );
}
