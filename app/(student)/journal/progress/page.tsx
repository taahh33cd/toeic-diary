"use client";

import type { Metadata } from "next";
import { useProfile } from "@/hooks/useProfile";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { useDayLinks } from "@/hooks/firebase/useDayLinks";
import type { Homework, DayLinksMap } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function fmtDateFull(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function getDow(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DOW_VI[new Date(y, m - 1, d).getDay()];
}

const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

function countItems(hw: Homework): number {
  return SECTIONS.reduce((sum, s) => sum + (hw[s]?.length ?? 0), 0);
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, isDone, isOverdue }: { pct: number; isDone: boolean; isOverdue: boolean }) {
  const color = isDone
    ? "linear-gradient(90deg,#4A7C59,#2ECC71)"
    : isOverdue
    ? "linear-gradient(90deg,#B03A2A,#C0392B)"
    : "linear-gradient(90deg,#C4622D,#E8885C)";

  return (
    <div
      style={{
        height: 6,
        background: "rgba(0,0,0,0.07)",
        borderRadius: 99,
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: "width 0.7s ease",
        }}
      />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  isDone,
  hasLink,
  hasTick,
  isToday,
  isOverdue,
  isFuture,
}: {
  isDone: boolean;
  hasLink: boolean;
  hasTick: boolean;
  isToday: boolean;
  isOverdue: boolean;
  isFuture: boolean;
}) {
  if (hasLink) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: ".25rem",
          fontSize: ".65rem", fontWeight: 600,
          padding: ".2rem .55rem", borderRadius: 99,
          background: "rgba(46,204,113,.14)", color: "#27AE60",
          whiteSpace: "nowrap",
        }}
      >
        🔗 Đã nộp link
      </span>
    );
  }
  if (hasTick) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: ".25rem",
          fontSize: ".65rem", fontWeight: 600,
          padding: ".2rem .55rem", borderRadius: 99,
          background: "rgba(74,124,89,.13)", color: "#4A7C59",
          whiteSpace: "nowrap",
        }}
      >
        ✓ Đã tick
      </span>
    );
  }
  if (isToday) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center",
          fontSize: ".65rem", fontWeight: 600,
          padding: ".2rem .55rem", borderRadius: 99,
          background: "rgba(196,98,45,.13)", color: "#C4622D",
          whiteSpace: "nowrap",
        }}
      >
        Hôm nay
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center",
          fontSize: ".65rem", fontWeight: 600,
          padding: ".2rem .55rem", borderRadius: 99,
          background: "rgba(176,58,42,.12)", color: "#B03A2A",
          whiteSpace: "nowrap",
        }}
      >
        Quá hạn
      </span>
    );
  }
  if (isFuture) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center",
          fontSize: ".65rem", fontWeight: 500,
          padding: ".2rem .55rem", borderRadius: 99,
          background: "rgba(0,0,0,0.05)", color: "#9A8672",
          whiteSpace: "nowrap",
        }}
      >
        Sắp tới
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        fontSize: ".65rem", fontWeight: 500,
        padding: ".2rem .55rem", borderRadius: 99,
        background: "rgba(0,0,0,0.05)", color: "#9A8672",
        whiteSpace: "nowrap",
      }}
    >
      Chưa nộp
    </span>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function HwRow({
  hw,
  td,
  hasLink,
  hasTick,
}: {
  hw: Homework;
  td: string;
  hasLink: boolean;
  hasTick: boolean;
}) {
  const isDone = hasLink || hasTick;
  const deadline = hw.endDate ?? hw.date;
  const isToday = hw.date <= td && deadline >= td;
  const isOverdue = !isDone && deadline < td;
  const isFuture = !isToday && !isOverdue && !isDone && hw.date > td;

  const total = countItems(hw);
  const done = isDone ? total : 0;
  const pct = total > 0 ? (done / total) * 100 : isDone ? 100 : 0;

  // Date display
  const dateLabel = hw.endDate
    ? `${fmtDate(hw.date)} → ${fmtDate(hw.endDate)}`
    : fmtDateFull(hw.date);
  const dow = getDow(hw.date);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".85rem",
        padding: ".75rem 1rem",
        background: isToday
          ? "rgba(196,98,45,.06)"
          : isDone
          ? "rgba(74,124,89,.04)"
          : "var(--bg-elevated,#FBF7F2)",
        border: `1px solid ${
          isToday
            ? "rgba(196,98,45,.2)"
            : isDone
            ? "rgba(74,124,89,.2)"
            : isOverdue
            ? "rgba(176,58,42,.18)"
            : "var(--border,#DDD0BC)"
        }`,
        marginBottom: ".45rem",
      }}
    >
      {/* Mini calendar */}
      <div
        style={{
          flexShrink: 0,
          width: 44,
          textAlign: "center",
          padding: ".2rem",
          borderRight: "1px solid var(--border,#DDD0BC)",
        }}
      >
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "1.4rem",
            fontWeight: 700,
            lineHeight: 1,
            color: isDone ? "#4A7C59" : isOverdue ? "#B03A2A" : isToday ? "#C4622D" : "#2C1E0F",
          }}
        >
          {hw.date.split("-")[2]}
        </div>
        <div style={{ fontSize: ".6rem", color: "#9A8672", marginTop: ".05rem" }}>
          {dow} · T{hw.date.split("-")[1]}
        </div>
      </div>

      {/* Middle: date label + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: ".75rem",
            fontWeight: 600,
            color: "#2C1E0F",
            marginBottom: ".35rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {dateLabel}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
          <ProgressBar pct={pct} isDone={isDone} isOverdue={isOverdue} />
          <span
            style={{
              flexShrink: 0,
              fontSize: ".65rem",
              fontWeight: 600,
              color: isDone ? "#4A7C59" : isOverdue ? "#B03A2A" : "#9A8672",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {total > 0 ? `${done}/${total}` : "—"}
          </span>
        </div>
      </div>

      {/* Status */}
      <StatusBadge
        isDone={isDone}
        hasLink={hasLink}
        hasTick={hasTick}
        isToday={isToday}
        isOverdue={isOverdue}
        isFuture={isFuture}
      />
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  total,
  done,
  overdue,
}: {
  total: number;
  done: number;
  overdue: number;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      style={{
        background: "var(--bg-elevated,#FBF7F2)",
        border: "1px solid var(--border,#DDD0BC)",
        padding: "1rem 1.2rem",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      {/* Overall progress ring */}
      <div style={{ display: "flex", alignItems: "center", gap: ".65rem" }}>
        <svg width="48" height="48" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="#C4622D"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C1E0F", lineHeight: 1 }}>
            {pct}%
          </div>
          <div style={{ fontSize: ".65rem", color: "#9A8672", marginTop: ".1rem" }}>
            Hoàn thành
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 40, background: "var(--border,#DDD0BC)", flexShrink: 0 }} />

      {/* Stats */}
      <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1E0F" }}>{total}</div>
          <div style={{ fontSize: ".62rem", color: "#9A8672" }}>Tổng BTVN</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4A7C59" }}>{done}</div>
          <div style={{ fontSize: ".62rem", color: "#9A8672" }}>Đã nộp</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: overdue > 0 ? "#B03A2A" : "#9A8672" }}>
            {overdue}
          </div>
          <div style={{ fontSize: ".62rem", color: "#9A8672" }}>Quá hạn</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#9A8672" }}>{total - done - overdue}</div>
          <div style={{ fontSize: ".62rem", color: "#9A8672" }}>Sắp tới</div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { profile } = useProfile();
  const { homework, loading: hwLoading } = useHomework(profile?.studentCode);
  const { submissions, loading: subLoading } = useSubmissions(profile?.studentCode);
  const { dayLinks: _dayLinks, loading: dlLoading } = useDayLinks(profile?.studentCode);
  const dayLinks = _dayLinks as DayLinksMap;

  const loading = hwLoading || subLoading || dlLoading;
  const td = localToday();

  // Summary counts
  const doneCount = homework.filter(
    (hw) => !!dayLinks[hw.id] || !!submissions[hw.date]?.ticked
  ).length;
  const overdueCount = homework.filter((hw) => {
    const deadline = hw.endDate ?? hw.date;
    return deadline < td && !dayLinks[hw.id] && !submissions[hw.date]?.ticked;
  }).length;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Page title */}
      <div style={{ marginBottom: "1.1rem" }}>
        <h1
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "var(--text-primary,#2C1E0F)",
            margin: 0,
          }}
        >
          📈 Tiến độ học
        </h1>
        <p style={{ fontSize: ".78rem", color: "#9A8672", margin: ".2rem 0 0" }}>
          Danh sách bài tập và trạng thái nộp bài
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "#9A8672",
            fontSize: ".85rem",
          }}
        >
          Đang tải…
        </div>
      )}

      {!loading && homework.length === 0 && (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "#9A8672",
            fontSize: ".85rem",
            background: "var(--bg-elevated,#FBF7F2)",
            border: "1px solid var(--border,#DDD0BC)",
          }}
        >
          Chưa có bài tập nào được giao.
        </div>
      )}

      {!loading && homework.length > 0 && (
        <>
          {/* Summary */}
          <SummaryCard
            total={homework.length}
            done={doneCount}
            overdue={overdueCount}
          />

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: ".75rem",
              flexWrap: "wrap",
              marginBottom: ".75rem",
              fontSize: ".65rem",
              color: "#9A8672",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, background: "rgba(46,204,113,.6)" }} />
              Đã nộp link ngày
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, background: "rgba(74,124,89,.6)" }} />
              Đã tick hoàn thành
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, background: "rgba(176,58,42,.5)" }} />
              Quá hạn chưa nộp
            </span>
          </div>

          {/* Homework rows — newest first (already sorted by useHomework) */}
          <div>
            {homework.map((hw) => (
              <HwRow
                key={hw.id}
                hw={hw}
                td={td}
                hasLink={!!dayLinks[hw.id]}
                hasTick={!dayLinks[hw.id] && !!submissions[hw.date]?.ticked}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
