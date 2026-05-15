"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useGoal } from "@/hooks/firebase/useGoal";
import { pushStudentScore, deleteStudentScore, setGoal } from "@/lib/firebase/helpers";
import type { ToeicScore } from "@/lib/firebase/types";

const PART_MAX: Record<string, number> = {
  p1: 6, p2: 25, p3: 39, p4: 30, p5: 30, p6: 16, p7: 54,
};

const PART_KEYS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const;
type PartKey = typeof PART_KEYS[number];

const L_PARTS: PartKey[] = ["p1", "p2", "p3", "p4"];
const R_PARTS: PartKey[] = ["p5", "p6", "p7"];

function formatDeadline(deadline: string): string {
  const [year, month] = deadline.split("-");
  return `Trước tháng ${month}/${year}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

type PartInputs = Record<PartKey, string>;

const emptyPartInputs = (): PartInputs =>
  PART_KEYS.reduce((acc, k) => ({ ...acc, [k]: "" }), {} as PartInputs);

interface GoalCardProps {
  target: number;
  deadline?: string;
  latestScore: number | null;
  onEditGoal: () => void;
}

function GoalCard({ target, deadline, latestScore, onEditGoal }: GoalCardProps) {
  const achieved = latestScore !== null && latestScore >= target;
  const gap = latestScore !== null ? target - latestScore : null;

  return (
    <div
      style={{
        background: "var(--ink2)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        minWidth: 0,
      }}
    >
      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Mục tiêu
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
        <span
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "3rem",
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--orange)",
          }}
        >
          {target}
        </span>
        <span style={{ color: "#9A8672", fontSize: "0.85rem" }}>/990 điểm TOEIC</span>
      </div>
      {deadline && (
        <div style={{ color: "#9A8672", fontSize: "0.8rem" }}>{formatDeadline(deadline)}</div>
      )}
      {latestScore !== null && (
        <div style={{ marginTop: "0.25rem" }}>
          {achieved ? (
            <span
              style={{
                color: "var(--sage)",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              ✓ Đã đạt mục tiêu!
            </span>
          ) : (
            <span style={{ color: "#9A8672", fontSize: "0.82rem" }}>
              Còn thiếu{" "}
              <span style={{ color: "var(--orange2)", fontWeight: 700 }}>{gap}</span>{" "}
              điểm
            </span>
          )}
        </div>
      )}
      <button
        onClick={onEditGoal}
        style={{
          marginTop: "0.75rem",
          background: "transparent",
          border: "1px solid rgba(196,98,45,0.5)",
          color: "var(--orange2)",
          fontSize: "0.75rem",
          padding: "0.35rem 0.75rem",
          cursor: "pointer",
          borderRadius: 0,
          alignSelf: "flex-start",
        }}
      >
        Chỉnh mục tiêu
      </button>
    </div>
  );
}

interface StatsProps {
  scores: ToeicScore[];
  target: number | null;
}

function StatsPanel({ scores, target }: StatsProps) {
  const best = scores.length ? Math.max(...scores.map((s) => s.score)) : null;
  const avg = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : null;
  const lowest = scores.length ? Math.min(...scores.map((s) => s.score)) : null;
  const latest = scores[0]?.score ?? null;
  const prev = scores[1]?.score ?? null;
  const delta = latest !== null && prev !== null ? latest - prev : null;
  const achieved = target !== null && latest !== null && latest >= target;

  const stats = [
    { label: "Bài test", value: scores.length },
    { label: "Cao nhất", value: best },
    { label: "Trung bình", value: avg },
    { label: "Thấp nhất", value: lowest },
  ];

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0",
          border: "1px solid var(--border)",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              textAlign: "center",
              padding: "0.75rem 0.5rem",
              borderRight: i < stats.length - 1 ? "1px solid var(--border)" : undefined,
              background: i === 1 ? "rgba(196,98,45,0.04)" : undefined,
            }}
          >
            <div
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: i === 0 ? "1.4rem" : "1.6rem",
                fontWeight: 700,
                color: i === 1 ? "var(--orange)" : "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {s.value ?? "—"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.3rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {latest !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Gần nhất:{" "}
            <span
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontWeight: 700,
                color: "var(--text-primary)",
                fontSize: "1rem",
              }}
            >
              {latest}
            </span>
          </span>
          {delta !== null && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: delta > 0 ? "#2e7d32" : delta < 0 ? "#c62828" : "var(--text-muted)",
              }}
            >
              {delta > 0 ? `+${delta}` : delta} so với lần trước
            </span>
          )}
          {achieved && (
            <span
              style={{
                background: "var(--sage)",
                color: "#fff",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "0.2rem 0.5rem",
                letterSpacing: "0.04em",
              }}
            >
              ĐÃ ĐẠT MỤC TIÊU
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface AddScoreFormProps {
  studentCode: string;
  onSaved: () => void;
}

function AddScoreForm({ studentCode, onSaved }: AddScoreFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testname, setTestname] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [parts, setParts] = useState<PartInputs>(emptyPartInputs());

  function setPart(key: PartKey, val: string) {
    setParts((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numScore = parseInt(score, 10);
    if (!date || isNaN(numScore) || numScore < 10 || numScore > 990) return;
    setSaving(true);
    try {
      const entry: ToeicScore = { score: numScore, date };
      if (testname.trim()) entry.testname = testname.trim();
      if (note.trim()) entry.note = note.trim();
      for (const k of PART_KEYS) {
        const v = parts[k];
        if (v !== "") {
          const n = parseInt(v, 10);
          if (!isNaN(n)) (entry as unknown as Record<string, unknown>)[k] = n;
        }
      }
      await pushStudentScore(studentCode, entry);
      setTestname("");
      setDate(new Date().toISOString().slice(0, 10));
      setScore("");
      setNote("");
      setParts(emptyPartInputs());
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.45rem 0.6rem",
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    borderRadius: 0,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    display: "block",
    marginBottom: "0.25rem",
  };

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 1rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontSize: "0.9rem",
          fontWeight: 600,
        }}
      >
        <span>+ Nhập điểm test mới</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Tên bài test</label>
              <input
                style={inputStyle}
                value={testname}
                onChange={(e) => setTestname(e.target.value)}
                placeholder="VD: ETS 2024 Test 1"
              />
            </div>
            <div>
              <label style={labelStyle}>Ngày thi</label>
              <input
                type="date"
                style={inputStyle}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Tổng điểm (10–990)</label>
              <input
                type="number"
                min={10}
                max={990}
                style={inputStyle}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="VD: 750"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Ghi chú</label>
              <input
                style={inputStyle}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhận xét, cảm nhận..."
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
              Điểm từng Part (tuỳ chọn)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {PART_KEYS.map((k) => (
                <div key={k}>
                  <label style={{ ...labelStyle, color: L_PARTS.includes(k as PartKey) ? "#C4622D" : "#1E6FA8" }}>
                    PART {k[1]} /{PART_MAX[k]}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={PART_MAX[k]}
                    style={inputStyle}
                    value={parts[k]}
                    onChange={(e) => setPart(k, e.target.value)}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? "var(--border)" : "var(--orange)",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.5rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: saving ? "not-allowed" : "pointer",
              borderRadius: 0,
              alignSelf: "flex-start",
            }}
          >
            {saving ? "Đang lưu..." : "Lưu điểm"}
          </button>
        </form>
      )}
    </div>
  );
}

interface ScoreHistoryItemProps {
  score: ToeicScore;
  isNewest: boolean;
  onDelete: () => void;
}

function ScoreHistoryItem({ score, isNewest, onDelete }: ScoreHistoryItemProps) {
  const hasL = L_PARTS.some((k) => score[k] !== undefined);
  const hasR = R_PARTS.some((k) => score[k] !== undefined);

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            background: isNewest ? "rgba(196,98,45,0.07)" : "var(--bg-primary)",
            borderRight: "1px solid var(--border)",
            flexShrink: 0,
            flexDirection: "column",
            gap: "0.2rem",
            padding: "0.75rem 0",
          }}
        >
          <span
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: "2rem",
              fontWeight: 700,
              lineHeight: 1,
              color: isNewest ? "var(--orange)" : "var(--text-primary)",
            }}
          >
            {score.score}
          </span>
          {isNewest && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "var(--orange)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Mới nhất
            </span>
          )}
        </div>

        <div style={{ flex: 1, padding: "0.75rem 1rem", minWidth: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ minWidth: 0 }}>
              {score.testname && (
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {score.testname}
                </div>
              )}
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                📅 {formatDate(score.date)}
              </div>
            </div>
            <button
              onClick={onDelete}
              style={{
                background: "transparent",
                border: "1px solid rgba(198,40,40,0.3)",
                color: "#c62828",
                fontSize: "0.72rem",
                padding: "0.25rem 0.55rem",
                cursor: "pointer",
                borderRadius: 0,
                flexShrink: 0,
              }}
            >
              Xoá
            </button>
          </div>

          {(hasL || hasR) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.25rem" }}>
              {L_PARTS.map((k) =>
                score[k] !== undefined ? (
                  <span
                    key={k}
                    style={{
                      background: "rgba(196,98,45,0.12)",
                      color: "#C4622D",
                      border: "1px solid rgba(196,98,45,0.25)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.4rem",
                    }}
                  >
                    P{k[1]}:{score[k]}
                  </span>
                ) : null
              )}
              {R_PARTS.map((k) =>
                score[k] !== undefined ? (
                  <span
                    key={k}
                    style={{
                      background: "rgba(30,111,168,0.1)",
                      color: "#1E6FA8",
                      border: "1px solid rgba(30,111,168,0.22)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.4rem",
                    }}
                  >
                    P{k[1]}:{score[k]}
                  </span>
                ) : null
              )}
            </div>
          )}

          {score.note && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              {score.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GoalEditFormProps {
  currentTarget: number;
  currentDeadline?: string;
  studentCode: string;
  studentId: string;
  studentName: string;
  onDone: () => void;
}

function GoalEditForm({ currentTarget, currentDeadline, studentCode, studentId, studentName, onDone }: GoalEditFormProps) {
  const [target, setTarget] = useState(String(currentTarget));
  const [deadline, setDeadline] = useState(currentDeadline ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const numTarget = parseInt(target, 10);
    if (isNaN(numTarget) || numTarget < 10 || numTarget > 990) return;
    setSaving(true);
    try {
      await setGoal(studentCode, {
        target: numTarget,
        deadline: deadline || undefined,
        studentId,
        studentName,
        updatedAt: new Date().toISOString(),
      });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    border: "1px solid rgba(196,98,45,0.4)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "0.85rem",
    borderRadius: 0,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <form
      onSubmit={handleSave}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}
    >
      <div>
        <label style={{ fontSize: "0.68rem", color: "#9A8672", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "0.25rem" }}>
          Mục tiêu (10–990)
        </label>
        <input
          type="number"
          min={10}
          max={990}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label style={{ fontSize: "0.68rem", color: "#9A8672", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "0.25rem" }}>
          Deadline (tháng/năm)
        </label>
        <input
          type="month"
          value={deadline.slice(0, 7)}
          onChange={(e) => setDeadline(e.target.value ? e.target.value + "-01" : "")}
          style={inputStyle}
        />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "var(--orange)",
            color: "#fff",
            border: "none",
            padding: "0.45rem 1rem",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: saving ? "not-allowed" : "pointer",
            borderRadius: 0,
          }}
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{
            background: "transparent",
            color: "#9A8672",
            border: "1px solid rgba(154,134,114,0.4)",
            padding: "0.45rem 0.75rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            borderRadius: 0,
          }}
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

export default function ScoresPage() {
  const { profile, loading: profileLoading } = useProfile();
  const studentCode = profile?.studentCode ?? null;
  const { student, loading: studentLoading } = useStudent(studentCode);
  const { goal, loading: goalLoading } = useGoal(studentCode);
  const [editingGoal, setEditingGoal] = useState(false);
  const [deleteKey, setDeleteKey] = useState<number | null>(null);

  const loading = profileLoading || studentLoading || goalLoading;

  const sortedScores: ToeicScore[] = student?.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const latestScore = sortedScores[0]?.score ?? null;

  async function handleDelete(displayIndex: number) {
    if (!studentCode) return;
    const scoreToDelete = sortedScores[displayIndex];
    if (!window.confirm(`Xoá điểm ${scoreToDelete.score} (${formatDate(scoreToDelete.date)})?`)) return;
    const originalScores: ToeicScore[] = student?.scores ? [...student.scores] : [];
    const originalIndex = originalScores.findIndex(
      (s) => s.date === scoreToDelete.date && s.score === scoreToDelete.score
    );
    if (originalIndex === -1) return;
    setDeleteKey(displayIndex);
    try {
      await deleteStudentScore(studentCode, originalIndex);
    } finally {
      setDeleteKey(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: i === 0 ? 160 : 80, background: "var(--border)" }}
          />
        ))}
      </div>
    );
  }

  if (!studentCode) {
    return (
      <div>
        <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Điểm số TOEIC
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Chưa có mã học viên. Liên hệ giáo viên để được thêm vào hệ thống.
        </p>
      </div>
    );
  }

  const hasGoal = goal !== null;
  const hasScores = sortedScores.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h1
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Điểm số TOEIC
        </h1>
        {hasScores && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {sortedScores.length} lần thi
          </span>
        )}
      </div>

      {hasGoal ? (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto", width: "clamp(240px, 38%, 340px)" }}>
            <div style={{ background: "var(--ink2)", padding: "1.5rem" }}>
              {editingGoal ? (
                <>
                  <div style={{ color: "#9A8672", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                    Chỉnh mục tiêu
                  </div>
                  <GoalEditForm
                    currentTarget={goal.target}
                    currentDeadline={goal.deadline}
                    studentCode={studentCode}
                    studentId={profile?.id ?? ""}
                    studentName={profile?.displayName ?? ""}
                    onDone={() => setEditingGoal(false)}
                  />
                </>
              ) : (
                <GoalCard
                  target={goal.target}
                  deadline={goal.deadline}
                  latestScore={latestScore}
                  onEditGoal={() => setEditingGoal(true)}
                />
              )}
            </div>
          </div>
          <div style={{ flex: "1 1 260px" }}>
            {hasScores ? (
              <StatsPanel scores={sortedScores} target={goal.target} />
            ) : (
              <div
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Chưa có điểm thi — hãy nhập bài test đầu tiên!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--ink2)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {editingGoal ? (
            <>
              <div style={{ color: "#9A8672", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Đặt mục tiêu TOEIC
              </div>
              <GoalEditForm
                currentTarget={500}
                currentDeadline=""
                studentCode={studentCode}
                studentId={profile?.id ?? ""}
                studentName={profile?.displayName ?? ""}
                onDone={() => setEditingGoal(false)}
              />
            </>
          ) : (
            <>
              <div style={{ color: "#9A8672", fontSize: "0.85rem" }}>Bạn chưa đặt mục tiêu điểm TOEIC.</div>
              <button
                onClick={() => setEditingGoal(true)}
                style={{
                  background: "var(--orange)",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1.25rem",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  borderRadius: 0,
                  alignSelf: "flex-start",
                }}
              >
                Đặt mục tiêu ngay
              </button>
            </>
          )}
        </div>
      )}

      <AddScoreForm studentCode={studentCode} onSaved={() => {}} />

      {hasScores && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
            Lịch sử điểm thi
          </div>
          {sortedScores.map((s, i) => (
            <ScoreHistoryItem
              key={`${s.date}-${s.score}-${i}`}
              score={s}
              isNewest={i === 0}
              onDelete={() => deleteKey === null && handleDelete(i)}
            />
          ))}
        </div>
      )}

      {!hasScores && (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
            Chưa có điểm thi nào
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Dùng form bên trên để nhập kết quả bài test đầu tiên.
          </div>
        </div>
      )}
    </div>
  );
}
