"use client";

import { useState } from "react";
import { AnnotatedText } from "@/components/submissions/AnnotatedText";
import {
  countByLabel,
  labelMeta,
  type Annotation,
  type FeedbackItem,
  type SubmissionFeedback,
  type SubmissionItem,
} from "@/lib/submissions";

function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Học viên xem lại bài đã chấm — chỉ đọc, nhưng thấy đúng thứ giáo viên thấy:
 * highlight theo nhóm lỗi, chữ sửa kiểu track-changes, comment neo bên cạnh.
 */
export function GradedView({
  items, feedback, max,
}: {
  items: SubmissionItem[];
  feedback: SubmissionFeedback | null;
  max: number;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const annotations: Annotation[] = feedback?.annotations ?? [];
  const stats = countByLabel(annotations);
  const fbOf = (idx: number): FeedbackItem | undefined => feedback?.items?.find((f) => f.idx === idx);

  return (
    <div className="flex flex-col gap-4">
      {/* Thống kê lỗi + nút xuất */}
      {(stats.length > 0 || annotations.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          {stats.map((s) => (
            <span key={s.id} className="text-[11px] font-semibold px-2 py-1 rounded-md"
              style={{ background: tint(s.color, 0.12), color: s.color }}>
              {s.label} {s.count}
            </span>
          ))}
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", cursor: "pointer" }}
          >
            🖨️ In / Lưu PDF
          </button>
        </div>
      )}

      {items.map((it) => {
        const fb = fbOf(it.idx);
        const anns = annotations.filter((a) => a.itemIdx === it.idx).sort((a, b) => a.start - b.start);
        return (
          <section
            key={it.idx}
            className="rounded-2xl px-4 py-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Câu {it.idx + 1}
              </span>
              {typeof fb?.score === "number" && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{ background: "rgba(34,197,94,0.14)", color: "#15803d" }}>
                  {fb.score}/{max}
                </span>
              )}
            </div>

            {it.prompt && <p className="text-xs m-0 mb-2 italic" style={{ color: "var(--text-secondary)" }}>{it.prompt}</p>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full rounded-lg mb-2" />}

            <div className="grid gap-3" style={{ gridTemplateColumns: anns.length ? "minmax(0,1.6fr) minmax(0,1fr)" : "1fr" }}>
              <div>
                {it.text && (
                  <p className="text-sm whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)", lineHeight: 1.9 }}>
                    <AnnotatedText
                      text={it.text}
                      annotations={anns}
                      activeId={activeId}
                      onSelectAnnotation={setActiveId}
                    />
                  </p>
                )}
                {it.audioUrl && <audio controls src={it.audioUrl} className="w-full mt-1" />}

                {fb?.comment && (
                  <p className="text-sm whitespace-pre-wrap mt-3 mb-0" style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    💬 {fb.comment}
                  </p>
                )}
              </div>

              {anns.length > 0 && (
                <div className="flex flex-col gap-2">
                  {anns.map((a) => {
                    const meta = labelMeta(a.label);
                    const active = activeId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setActiveId(a.id);
                          document.querySelector(`[data-annotation-id="${a.id}"]`)
                            ?.scrollIntoView({ block: "center", behavior: "smooth" });
                        }}
                        className="text-left rounded-xl p-3"
                        style={{
                          border: `1px solid ${active ? meta.color : "var(--border)"}`,
                          background: active ? tint(meta.color, 0.06) : "var(--bg-primary)",
                          cursor: "pointer",
                        }}
                      >
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: tint(meta.color, 0.14), color: meta.color }}>
                          {meta.label}
                        </span>
                        <span className="block text-xs italic mt-1.5" style={{ color: "var(--text-muted)" }}>
                          “{a.quote}”
                        </span>
                        {a.suggestion && (
                          <span className="block text-xs mt-1" style={{ color: "#15803d" }}>
                            → {a.suggestion}
                          </span>
                        )}
                        {a.comment && (
                          <span className="block text-xs mt-1.5" style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>
                            {a.comment}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
