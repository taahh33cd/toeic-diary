"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/firebase/useNotifications";
import { pushComment, sendNotification } from "@/lib/firebase/helpers";
import type { Student } from "@/lib/firebase/types";

const box: React.CSSProperties = { background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" };

function when(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * Nhắn HV: một ô, hai chế độ.
 *  - Nhận xét: hiện ở sổ HV + đẩy push (như mục Nhận xét cũ).
 *  - Thông báo: vào chuông của HV (như mục Gửi thông báo cũ).
 * Dưới ô nhập là 3 tin gần nhất của chế độ đang chọn, để khỏi gửi trùng.
 */
export function MessageSection({ student, code }: { student: Student; code: string }) {
  const [mode, setMode] = useState<"comment" | "notif">("comment");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { notifications } = useNotifications(code);

  const recentComments = Object.entries(student.comments ?? {})
    .map(([k, v]) => ({ key: k, text: v.text, ts: v.ts }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 3);
  const recentNotifs = notifications
    .filter((n) => n.type === "manual")
    .slice(0, 3)
    .map((n) => ({ key: n._key, text: n.body ? `${n.title} — ${n.body}` : n.title, ts: n.createdAt ? Date.parse(n.createdAt) : Number(n._key) }));
  const recent = mode === "comment" ? recentComments : recentNotifs;

  const canSend = mode === "comment" ? !!text.trim() : !!title.trim();

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      if (mode === "comment") {
        const commentText = text.trim();
        await pushComment(code, commentText);
        fetch("/api/push/comment-new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentCode: code, comment: commentText }),
        }).catch(() => {});
      } else {
        await sendNotification(code, { type: "manual", title: title.trim(), body: text.trim(), createdAt: new Date().toISOString() });
        setTitle("");
      }
      setText("");
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } finally {
      setSending(false);
    }
  }

  const tab = (key: typeof mode, label: string) => (
    <button type="button" onClick={() => setMode(key)} role="tab" aria-selected={mode === key}
      className="flex-1 text-xs py-1.5 rounded-md font-semibold"
      style={mode === key ? { background: "var(--accent-primary)", color: "#fff" } : { color: "var(--text-secondary)" }}>
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>💬 Nhắn HV</h3>
      </div>
      <div className="p-4 space-y-2.5">
        <div role="tablist" className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-primary)" }}>
          {tab("comment", "Nhận xét")}
          {tab("notif", "Thông báo")}
        </div>
        {mode === "notif" && (
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề — VD: Nhớ làm bài nhé!"
            aria-label="Tiêu đề thông báo" className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={box} />
        )}
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
          aria-label={mode === "comment" ? "Nội dung nhận xét" : "Nội dung thông báo"}
          placeholder={mode === "comment" ? "Viết nhận xét cho học viên…" : "Nội dung (không bắt buộc)"}
          className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none" style={box} />
        <button type="button" onClick={handleSend} disabled={sending || !canSend}
          className="w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={sent ? { background: "rgba(16,185,129,0.15)", color: "rgb(5,150,105)" } : { background: "var(--accent-primary)", color: "#fff" }}>
          {sending ? "Đang gửi…" : sent ? "✓ Đã gửi" : mode === "comment" ? "📨 Gửi nhận xét" : `🔔 Gửi thông báo cho ${student.name}`}
        </button>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {mode === "comment" ? "Hiện ở sổ của HV và đẩy thông báo về máy." : "Vào chuông thông báo của HV."}
        </p>

        {recent.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {mode === "comment" ? "Nhận xét gần đây" : "Thông báo gần đây"}
            </p>
            {recent.map((r) => (
              <div key={r.key} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{Number.isFinite(r.ts) ? when(r.ts) : ""}</p>
                <p className="text-sm line-clamp-3" style={{ color: "var(--text-primary)" }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
