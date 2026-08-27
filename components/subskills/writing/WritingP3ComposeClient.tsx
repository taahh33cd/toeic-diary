"use client";

import { useState, useEffect, useRef } from "react";
import {
  COMPOSE_TASKS_P3,
  COMPOSE_CHECKS_P3,
  COMPOSE_MINUTES_P3,
  MIN_WORDS_P3,
  type P3ComposeTask,
} from "@/lib/subskills/writing-part3/tang13";
import { P3_ESSAY_TYPES, countWords, type P3EssayType } from "@/lib/subskills/writing-part3";
import { SubmissionPanel } from "@/components/skills/SubmissionPanel";
import { FS } from "@/lib/ui/scale";

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";
const AMBER = "rgb(234,179,8)";

function mmss(sec: number): string {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  return `${sec < 0 ? "+" : ""}${m}:${String(s).padStart(2, "0")}`;
}

function typeMeta(id: P3EssayType) {
  return P3_ESSAY_TYPES.find((t) => t.id === id)!;
}

function TaskRunner({ task, canSubmit, onBack }: { task: P3ComposeTask; canSubmit: boolean; onBack: () => void }) {
  const total = COMPOSE_MINUTES_P3 * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const [text, setText] = useState("");
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  function start() {
    setRunning(true);
    // Đợi textarea bỏ disabled rồi mới focus được
    setTimeout(() => areaRef.current?.focus(), 0);
  }

  const meta = typeMeta(task.essayType);
  const overtime = left < 0;
  const timerColor = overtime ? RED : left <= 300 ? AMBER : "var(--text-secondary)";
  const words = countWords(text);
  const enough = words >= MIN_WORDS_P3;
  const allChecks = [...task.missions, ...COMPOSE_CHECKS_P3];

  return (
    <div>
      <button
        onClick={onBack}
        style={{ marginBottom: "1rem", padding: "5px 12px", fontSize: FS.xs, fontWeight: 600, borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
      >
        ← Chọn đề khác
      </button>

      {/* Đồng hồ + đếm từ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: "1rem", borderRadius: 10, border: `1.5px solid ${overtime ? "rgba(239,68,68,0.45)" : "var(--border)"}`, background: "var(--bg-elevated)" }}>
        <span style={{ fontSize: FS.lg, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: timerColor, letterSpacing: "0.02em" }}>
          {mmss(left)}
        </span>
        {!running ? (
          <button
            onClick={start}
            style={{ padding: "7px 18px", fontSize: FS.sm, fontWeight: 700, borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}
          >
            Bắt đầu tính giờ
          </button>
        ) : (
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
            {overtime
              ? "Hết giờ — trong phòng thi bài đã bị khoá tại đây. Cứ viết nốt, nhưng nhớ mình đã quá bao lâu."
              : `Q8 thật cho đúng ${COMPOSE_MINUTES_P3} phút để lên dàn ý, viết và sửa.`}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: FS.sm, fontWeight: 600, color: enough ? GREEN : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {words}/{MIN_WORDS_P3} từ{enough ? " ✓" : ""}
        </span>
      </div>

      {/* Đề bài */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--bg-secondary)", marginBottom: "1rem" }}>
        <div style={{ padding: "7px 13px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: FS.xs, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)" }}>ĐỀ BÀI</span>
          <span style={{ fontSize: FS.xs, fontWeight: 700, color: "var(--accent-primary)", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 5, padding: "1px 8px" }}>
            {meta.labelVi}
          </span>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: FS.md, lineHeight: 1.75, color: "var(--text-primary)" }}>{task.prompt}</p>
        </div>
        <div style={{ padding: "9px 13px", borderTop: "1px solid var(--border)", background: "rgba(234,179,8,0.07)" }}>
          <p style={{ margin: 0, fontSize: FS.xs, lineHeight: 1.65, color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Khung đúng:</strong> {meta.skeleton}
            <br />
            <strong style={{ color: "var(--text-primary)" }}>Bẫy của dạng này:</strong> {meta.trap}
          </p>
        </div>
      </div>

      <textarea
        ref={areaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!running}
        placeholder={running ? "Viết bài luận của bạn ở đây…" : "Bấm «Bắt đầu tính giờ» rồi viết."}
        rows={20}
        style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", fontSize: FS.sm, lineHeight: 1.85, fontFamily: "inherit", color: "var(--text-primary)", background: running ? "var(--bg-secondary)" : "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, resize: "vertical", opacity: running ? 1 : 0.6 }}
      />

      {/* Checklist tự soi */}
      <div style={{ marginTop: "1.2rem", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "9px 13px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)" }}>Tự soi trước khi nộp</span>
          <span style={{ fontSize: FS.xs, color: ticked.size === allChecks.length ? GREEN : "var(--text-muted)", fontWeight: 600 }}>
            {ticked.size}/{allChecks.length}
          </span>
        </div>
        {allChecks.map((c, i) => {
          const isMission = i < task.missions.length;
          const on = ticked.has(c);
          return (
            <button
              key={c}
              onClick={() => setTicked((prev) => {
                const next = new Set(prev);
                if (next.has(c)) next.delete(c); else next.add(c);
                return next;
              })}
              style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%", padding: "9px 13px", background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", border: "none", borderBottom: i < allChecks.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: 5, marginTop: 1, border: `1.5px solid ${on ? GREEN : "var(--border)"}`, background: on ? "rgba(34,197,94,0.15)" : "transparent", color: GREEN, fontSize: FS.xs, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {on ? "✓" : ""}
              </span>
              <span style={{ flex: 1, fontSize: FS.sm, lineHeight: 1.55, color: on ? "var(--text-muted)" : "var(--text-primary)", textDecoration: on ? "line-through" : "none" }}>
                {c}
              </span>
              {isMission && (
                <span style={{ flexShrink: 0, fontSize: FS.xs, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-primary)", background: "rgba(59,130,246,0.12)", borderRadius: 4, padding: "2px 6px", marginTop: 1 }}>
                  Việc đề giao
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "1.2rem" }}>
        <SubmissionPanel
          skill="writing"
          unit="subskill-wp3-tang13"
          testKey={task.id}
          title={`Writing Q8 — ${task.label}`}
          canSubmit={canSubmit}
          buildItems={() => [{ idx: 0, prompt: task.prompt.slice(0, 2000), text }]}
        />
      </div>
    </div>
  );
}

export default function WritingP3ComposeClient({ canSubmit }: { canSubmit: boolean }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<P3EssayType | "all">("all");
  const task = COMPOSE_TASKS_P3.find((t) => t.id === taskId);

  if (task) return <TaskRunner task={task} canSubmit={canSubmit} onBack={() => setTaskId(null)} />;

  const shown = filter === "all" ? COMPOSE_TASKS_P3 : COMPOSE_TASKS_P3.filter((t) => t.essayType === filter);

  return (
    <div>
      <div style={{ padding: "11px 14px", marginBottom: "1.2rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <p style={{ margin: 0, fontSize: FS.sm, lineHeight: 1.7, color: "var(--text-secondary)" }}>
          Đến tầng này thì trắc nghiệm hết tác dụng — phải tự viết mới biết mình hổng chỗ nào.
          Mỗi đề cho đúng <strong style={{ color: "var(--text-primary)" }}>{COMPOSE_MINUTES_P3} phút</strong> và tối thiểu{" "}
          <strong style={{ color: "var(--text-primary)" }}>{MIN_WORDS_P3} từ</strong> như phòng thi thật.
          Viết xong tự soi checklist, rồi gửi giáo viên chấm.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Chưa quen nhịp thì làm <strong style={{ color: "var(--text-secondary)" }}>Tầng 9</strong> trước — ở đó chỉ viết một đoạn dưới đồng hồ.
          Chưa rõ bài mức 5 khác bài mức 3 chỗ nào thì xem <strong style={{ color: "var(--text-secondary)" }}>Thư viện bài mẫu</strong>.
        </p>
        {!canSubmit && (
          <p style={{ margin: "8px 0 0", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Bạn vẫn viết và lưu bài vào sổ tay được. Gửi giáo viên chấm thì cần đăng ký khoá học.
          </p>
        )}
      </div>

      {/* Lọc theo dạng đề */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
        {([{ id: "all" as const, labelVi: `Tất cả (${COMPOSE_TASKS_P3.length})` }, ...P3_ESSAY_TYPES]).map((t) => {
          const on = filter === t.id;
          const n = t.id === "all" ? COMPOSE_TASKS_P3.length : COMPOSE_TASKS_P3.filter((x) => x.essayType === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as P3EssayType | "all")}
              style={{ padding: "5px 13px", fontSize: FS.xs, fontWeight: 600, borderRadius: 999, border: `1.5px solid ${on ? "var(--accent-primary)" : "var(--border)"}`, background: on ? "rgba(59,130,246,0.12)" : "transparent", color: on ? "var(--accent-primary)" : "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
            >
              {t.id === "all" ? t.labelVi : `${t.labelVi} (${n})`}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        {shown.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTaskId(t.id)}
            style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 15px", background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", border: "none", borderBottom: i < shown.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{typeMeta(t.essayType).labelVi}</div>
            </div>
            <span style={{ flexShrink: 0, fontSize: FS.sm, color: "var(--accent-primary)", marginTop: 4 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
