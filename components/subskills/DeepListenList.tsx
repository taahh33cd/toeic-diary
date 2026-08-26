"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadDeepProgress, type DeepProgress } from "@/lib/subskills/part3/deep-progress";
import { FS } from "@/lib/ui/scale";

export type DeepListRow = {
  groupId: string;
  label: string;
  part: 3 | 4;
  lineCount: number;
  keywordCount: number;
  /** Câu hỏi mở đầu — cho thấy đoạn nói về chuyện gì */
  firstPrompt: string;
};

export default function DeepListenList({ rows }: { rows: DeepListRow[] }) {
  const [progress, setProgress] = useState<Record<string, DeepProgress>>({});

  // localStorage chỉ đọc được sau khi đã dựng xong trên trình duyệt
  useEffect(() => {
    const next: Record<string, DeepProgress> = {};
    for (const r of rows) {
      const p = loadDeepProgress(r.groupId);
      if (p.doneAt || p.step > 0 || p.plays > 0) next[r.groupId] = p;
    }
    setProgress(next);
  }, [rows]);

  const doneCount = Object.values(progress).filter((p) => p.doneAt).length;

  return (
    <>
      <p style={{ margin: "0 0 1rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
        {rows.length} đoạn · đã xong {doneCount}
      </p>

      <div
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
        {rows.map((r, idx) => {
          const p = progress[r.groupId];
          const done = !!p?.doneAt;

          return (
            <Link
              key={r.groupId}
              href={`/subskills/listening/part3/nghe-sau/${r.groupId}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "0.95rem 1.3rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < rows.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: FS.xs,
                  fontWeight: 700,
                  background: done ? "rgba(34,197,94,0.15)" : p ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)",
                  border: `1.5px solid ${done ? "rgba(34,197,94,0.5)" : p ? "rgba(234,179,8,0.45)" : "var(--border)"}`,
                  color: done ? "rgb(34,197,94)" : p ? "rgb(234,179,8)" : "var(--text-muted)",
                }}
              >
                {done ? "✓" : p ? p.step + 1 : r.part}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                  {r.label}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: FS.xs,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.firstPrompt}
                </p>
              </div>

              <span style={{ fontSize: FS.xs, color: "var(--text-muted)", flexShrink: 0, alignSelf: "center", whiteSpace: "nowrap" }}>
                {p ? `${p.plays} lượt nghe` : `${r.lineCount} lượt nói · ${r.keywordCount} từ`}
              </span>

              <span className="r-arrow" style={{ fontSize: FS.xs, color: "var(--accent-primary)", flexShrink: 0, alignSelf: "center" }}>→</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
