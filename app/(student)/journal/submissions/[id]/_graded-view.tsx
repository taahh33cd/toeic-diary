"use client";

import { useState } from "react";
import { AnnotatedText, tint, type ViewMode } from "@/components/submissions/AnnotatedText";
import { DocumentSheet, type RailCard } from "@/components/submissions/DocumentSheet";
import {
  annotationKind,
  countByLabel,
  labelMeta,
  type Annotation,
  type AnnotationReply,
  type FeedbackItem,
  type SubmissionFeedback,
  type SubmissionItem,
} from "@/lib/submissions";

const MODES: { id: ViewMode; label: string }[] = [
  { id: "edited", label: "Bản đã sửa" },
  { id: "compare", label: "Đối chiếu" },
  { id: "original", label: "Bài gốc của tôi" },
];

const KIND_TEXT: Record<string, string> = {
  replace: "Sửa thành",
  insert: "Chèn thêm",
  delete: "Bỏ đoạn này",
};

function CommentCard({
  a, active, onClick, onHover, onReply,
}: {
  a: Annotation;
  active: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
  onReply: (text: string) => Promise<void>;
}) {
  const meta = labelMeta(a.label);
  const kind = annotationKind(a);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const replies = a.replies ?? [];

  async function send() {
    const t = reply.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await onReply(t);
      setReply("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(a.id)}
      onMouseLeave={() => onHover(null)}
      className="w-full text-left rounded-lg px-3 py-2.5 transition-shadow"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${active ? meta.color : "var(--border)"}`,
        boxShadow: active ? `0 2px 10px ${tint(meta.color, 0.22)}` : "var(--shadow-sm)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: tint(meta.color, 0.14), color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: kind === "delete" ? "rgba(185,28,28,.1)" : "rgba(21,128,61,.1)",
            color: kind === "delete" ? "#b91c1c" : "#15803d",
          }}>
          {KIND_TEXT[kind]}
        </span>
      </div>

      <span className="block text-xs italic mt-1.5"
        style={{ color: "var(--text-muted)", textDecoration: kind === "delete" ? "line-through" : "none" }}>
        “{a.quote}”
      </span>
      {kind !== "delete" && a.suggestion && (
        <span className="block text-xs mt-1 font-semibold" style={{ color: "#15803d" }}>→ {a.suggestion}</span>
      )}
      {a.comment && (
        <span className="block text-[13px] mt-1.5" style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{a.comment}</span>
      )}

      {replies.length > 0 && (
        <div className="mt-2 pt-2 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
          {replies.map((r) => (
            <div key={r.id} className="text-[11px]">
              <span className="font-bold" style={{ color: r.role === "teacher" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                {r.authorName || (r.role === "teacher" ? "Thầy Hiếu" : "Bạn")}
              </span>
              <p className="m-0 mt-0.5" style={{ color: "var(--text-primary)" }}>{r.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
          placeholder="Hỏi lại thầy…"
          className="flex-1 px-2 py-1 rounded text-[12px] border outline-none"
          style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!reply.trim() || sending}
          className="px-2 py-1 rounded text-[11px] font-bold"
          style={{
            background: reply.trim() && !sending ? "var(--accent-primary)" : "var(--border)",
            color: "#fff", border: "none", cursor: reply.trim() && !sending ? "pointer" : "default",
          }}
        >
          {sending ? "…" : "Gửi"}
        </button>
      </div>
    </div>
  );
}

/**
 * Học viên xem lại bài đã chấm — bố cục tài liệu: cả bộ đề là một trang liền,
 * mỗi câu chỉ là một tiêu đề nhỏ, nhận xét nằm ngoài lề phải ngang tầm đoạn chữ.
 */
export function GradedView({
  id, items, feedback, max, title, meta,
}: {
  /** Id bài nộp — cần để gửi trả lời trong thẻ nhận xét. */
  id: string;
  items: SubmissionItem[];
  feedback: SubmissionFeedback | null;
  max: number;
  title: string;
  meta: string;
}) {
  const [mode, setMode] = useState<ViewMode>("edited");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  /** Trả lời mới thêm tại chỗ, khỏi tải lại cả trang sau mỗi lượt. */
  const [extraReplies, setExtraReplies] = useState<Record<string, AnnotationReply[]>>({});

  const annotations: Annotation[] = (feedback?.annotations ?? []).map((a) =>
    extraReplies[a.id] ? { ...a, replies: [...(a.replies ?? []), ...extraReplies[a.id]] } : a
  );

  async function sendReply(annotationId: string, text: string) {
    const res = await fetch(`/api/submissions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annotationId, text }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { reply?: AnnotationReply };
    if (!data.reply) return;
    setExtraReplies((prev) => ({ ...prev, [annotationId]: [...(prev[annotationId] ?? []), data.reply!] }));
  }
  const stats = countByLabel(annotations);
  const fbOf = (idx: number): FeedbackItem | undefined => feedback?.items?.find((f) => f.idx === idx);

  function focus(id: string) {
    setActiveId(id);
    document.querySelector(`[data-annotation-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const cards: RailCard[] = annotations
    .slice()
    .sort((a, b) => (a.itemIdx - b.itemIdx) || (a.start - b.start))
    .map((a) => ({
      id: a.id,
      node: (
        <CommentCard
          a={a}
          active={activeId === a.id}
          onClick={() => focus(a.id)}
          onHover={setHoverId}
          onReply={(text) => sendReply(a.id, text)}
        />
      ),
    }));

  const toolbar = (
    <div
      className="flex items-center gap-3 flex-wrap px-3 md:px-6 py-2.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className="px-3 py-1.5 text-xs font-semibold"
            style={{
              background: mode === m.id ? "var(--accent-primary)" : "transparent",
              color: mode === m.id ? "#fff" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {stats.map((s) => (
          <span key={s.id} className="text-[11px] font-semibold px-2 py-1 rounded-md"
            style={{ background: tint(s.color, 0.12), color: s.color }}>
            {s.label} {s.count}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg"
        style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", cursor: "pointer" }}
      >
        🖨️ In / Lưu PDF
      </button>
    </div>
  );

  return (
    <DocumentSheet toolbar={toolbar} cards={cards} activeId={activeId}>
      {/* Đầu tài liệu */}
      <header className="mb-7">
        <h1 className="text-[1.6rem] font-bold m-0" style={{ color: "var(--text-primary)", fontFamily: "'Lora', Georgia, serif" }}>
          {title}
        </h1>
        <p className="text-xs mt-1.5 m-0" style={{ color: "var(--text-muted)" }}>{meta}</p>
      </header>

      {/* Nhận xét chung */}
      {feedback && (feedback.overall || feedback.audioUrl) && (
        <section className="mb-7 pl-4" style={{ borderLeft: "3px solid var(--accent-primary)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wider m-0 mb-1.5" style={{ color: "var(--text-muted)" }}>
            Nhận xét của giáo viên
          </p>
          {feedback.overall && (
            <p className="text-[15px] whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)", lineHeight: 1.75 }}>
              {feedback.overall}
            </p>
          )}
          {feedback.audioUrl && <audio controls src={feedback.audioUrl} className="w-full mt-2.5 print:hidden" />}
        </section>
      )}

      {/* Thân tài liệu — mỗi câu là một mục, không khung viền */}
      {items.map((it, i) => {
        const fb = fbOf(it.idx);
        const anns = annotations.filter((a) => a.itemIdx === it.idx);
        return (
          <section key={it.idx} className={i > 0 ? "mt-7 pt-7" : ""} style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
            <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
              <h2 className="text-[11px] font-bold uppercase tracking-widest m-0" style={{ color: "var(--text-muted)" }}>
                Câu {it.idx + 1}
              </h2>
              {it.prompt && <span className="text-xs italic" style={{ color: "var(--text-secondary)" }}>{it.prompt}</span>}
              {typeof fb?.score === "number" && (
                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{ background: "rgba(34,197,94,0.14)", color: "#15803d" }}>
                  {fb.score}/{max}
                </span>
              )}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full rounded-md my-3" />}

            {it.text && (
              <p className="text-[15px] whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)", lineHeight: 2 }}>
                <AnnotatedText
                  text={it.text}
                  annotations={anns}
                  activeId={activeId}
                  hoverId={hoverId}
                  onSelectAnnotation={focus}
                  onHoverAnnotation={setHoverId}
                  mode={mode}
                />
              </p>
            )}
            {it.audioUrl && <audio controls src={it.audioUrl} className="w-full mt-2 print:hidden" />}

            {fb?.comment && (
              <p className="text-sm mt-3 mb-0 pl-3 whitespace-pre-wrap"
                style={{ color: "var(--text-secondary)", borderLeft: "2px solid var(--border)", lineHeight: 1.7 }}>
                {fb.comment}
              </p>
            )}
          </section>
        );
      })}
    </DocumentSheet>
  );
}
