"use client";

import { useState } from "react";
import Link from "next/link";
import { EXAM } from "@/lib/skills/exam-theme";
import type { SubmissionItem } from "@/lib/submissions";

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
 * Lưu bài làm vào sổ tay và gửi giáo viên chấm.
 * Dùng chung cho mọi unit Speaking/Writing của /skills.
 */
export function SubmissionPanel({ skill, unit, testKey, title, buildItems, canSubmit, variant = "app" }: Props) {
  const t = TOKENS[variant];
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(submit: boolean) {
    setBusy(submit ? "submit" : "save");
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
      setId(data.submission?.id ?? id);
      if (submit) setSent(true);
      else setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được, thử lại nhé");
    } finally {
      setBusy(null);
    }
  }

  if (sent) {
    return (
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg, padding: "12px 14px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: t.ink }}>Đã gửi giáo viên chấm ✓</p>
        <p style={{ margin: "5px 0 0", fontSize: "0.8rem", color: t.muted }}>
          Có nhận xét bạn sẽ nhận được thông báo.{" "}
          <Link href="/journal/submissions" style={{ color: t.accent, fontWeight: 600 }}>Xem trong sổ tay →</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg, padding: "12px 14px" }}>
      <p style={{ margin: "0 0 9px", fontSize: "0.8rem", color: t.muted, lineHeight: 1.55 }}>
        Lưu bài này vào <strong style={{ color: t.ink }}>sổ tay</strong> để xem lại bất cứ lúc nào
        {canSubmit ? ", hoặc gửi giáo viên chấm và nhận xét." : "."}
      </p>

      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => post(false)}
          disabled={busy !== null}
          style={{ padding: "8px 18px", border: `1.5px solid ${t.border}`, background: "transparent", color: t.ink, borderRadius: 8, fontSize: "0.84rem", fontWeight: 600, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}
        >
          {busy === "save" ? "Đang lưu…" : savedAt ? "Đã lưu ✓ — lưu lại" : "Lưu vào sổ tay"}
        </button>

        {canSubmit && (
          <button
            type="button"
            onClick={() => post(true)}
            disabled={busy !== null}
            style={{ padding: "8px 18px", border: "none", background: t.accent, color: "#fff", borderRadius: 8, fontSize: "0.84rem", fontWeight: 700, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}
          >
            {busy === "submit" ? "Đang gửi…" : "Gửi giáo viên chấm"}
          </button>
        )}
      </div>

      {error && <p style={{ margin: "9px 0 0", fontSize: "0.79rem", color: EXAM.bad }}>{error}</p>}
    </div>
  );
}
