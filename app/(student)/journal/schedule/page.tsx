"use client";

import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useClasses } from "@/hooks/firebase/useClasses";
import type { ScheduleItem } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DOW_FULL = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function getDowFull(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DOW_FULL[new Date(y, m - 1, d).getDay()];
}

function fmtDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// H5: Generate upcoming dates from a weeklySchedule entry
// day is "0"–"6" (Sun=0) or numeric-like string
function generateWeeklyDates(
  day: string,
  time: string,
  className: string,
  classId: string,
  fromDate: string,
  count = 8
): (ScheduleItem & { kind: string; source: "class"; classId: string; className: string })[] {
  const dayNum = parseInt(day, 10);
  if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) return [];

  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd);

  // Find first occurrence on or after fromDate
  let cur = new Date(start);
  // days to next dayNum
  const diff = (dayNum - cur.getDay() + 7) % 7;
  cur.setDate(cur.getDate() + diff);

  const results: (ScheduleItem & { kind: string; source: "class"; classId: string; className: string })[] = [];
  for (let i = 0; i < count; i++) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    results.push({
      id: `cls_${classId}_${y}-${m}-${d}`,
      date: `${y}-${m}-${d}`,
      time,
      title: `📚 ${className}`,
      kind: "class",
      source: "class",
      classId,
      className,
    });
    cur.setDate(cur.getDate() + 7);
  }
  return results;
}

// ─── Session row ─────────────────────────────────────────────────────────────

type SessionEntry = ScheduleItem & {
  kind?: string;
  source?: "personal" | "class";
  className?: string;
};

function SessionRow({ s, isToday }: { s: SessionEntry; isToday: boolean }) {
  const [, m, d] = s.date.split("-");
  const dow = getDowFull(s.date);
  const isClass = s.kind === "class";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".85rem",
        padding: ".7rem 1rem",
        background: isToday
          ? "rgba(196,98,45,.07)"
          : "var(--bg-elevated,#FBF7F2)",
        border: `1px solid ${isToday ? "rgba(196,98,45,.3)" : "var(--border,#DDD0BC)"}`,
        marginBottom: ".4rem",
        position: "relative",
      }}
    >
      {/* Today stripe */}
      {isToday && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "#C4622D",
          }}
        />
      )}

      {/* Mini calendar */}
      <div
        style={{
          flexShrink: 0,
          width: 42,
          textAlign: "center",
          borderRight: "1px solid var(--border,#DDD0BC)",
          paddingRight: ".6rem",
        }}
      >
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "1.35rem",
            fontWeight: 700,
            lineHeight: 1,
            color: isToday ? "#C4622D" : "#2C1E0F",
          }}
        >
          {d}
        </div>
        <div style={{ fontSize: ".6rem", color: "#9A8672", marginTop: ".05rem" }}>
          T{m}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: ".82rem",
              fontWeight: 600,
              color: "#2C1E0F",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {s.title}
          </span>
          {/* H3: Type tag */}
          <span
            style={{
              fontSize: ".58rem",
              fontWeight: 700,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              padding: ".1rem .4rem",
              borderRadius: 99,
              background: isClass
                ? "rgba(40,96,168,.1)"
                : "rgba(196,98,45,.1)",
              color: isClass ? "#2860A8" : "#C4622D",
              flexShrink: 0,
            }}
          >
            {isClass ? "🏫 Lớp" : "🤝 1-1"}
          </span>
          {/* H4: Today badge */}
          {isToday && (
            <span
              style={{
                fontSize: ".58rem",
                fontWeight: 700,
                padding: ".1rem .4rem",
                borderRadius: 99,
                background: "#C4622D",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              Hôm nay
            </span>
          )}
        </div>
        <div style={{ fontSize: ".72rem", color: "#9A8672", marginTop: ".15rem" }}>
          {dow}{s.time ? ` · ${s.time}` : ""}
          {s.source === "class" && s.className ? ` · ${s.className}` : ""}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { profile } = useProfile();
  const { student, loading: stuLoading } = useStudent(profile?.studentCode);
  const { classes, loading: clsLoading } = useClasses();

  const loading = stuLoading || clsLoading;
  const td = localToday();

  // H5: Merge personal schedule + class weeklySchedule
  const allSessions = useMemo<SessionEntry[]>(() => {
    const results: SessionEntry[] = [];

    // Personal sessions from student.schedule
    for (const s of student?.schedule ?? []) {
      results.push({ ...s, source: "personal" });
    }

    // Class recurring sessions from weeklySchedule
    const studentCode = profile?.studentCode;
    if (studentCode) {
      for (const cls of classes) {
        if (!cls.members?.includes(studentCode)) continue;
        for (const slot of cls.weeklySchedule ?? []) {
          // Generate 8 upcoming occurrences from today
          const generated = generateWeeklyDates(
            slot.day,
            slot.time,
            cls.name,
            cls.id,
            td,
            8
          );
          results.push(...generated);
        }
      }
    }

    // Deduplicate by date+time (prefer personal over class if same day)
    const seen = new Set<string>();
    const deduped: SessionEntry[] = [];
    // Sort personal first so they take priority
    results.sort((a, b) => {
      if (a.source === "personal" && b.source !== "personal") return -1;
      if (a.source !== "personal" && b.source === "personal") return 1;
      return 0;
    });
    for (const s of results) {
      const key = `${s.date}_${s.time ?? ""}_${s.kind ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(s);
      }
    }

    // Sort by date asc
    return deduped.sort((a, b) => a.date.localeCompare(b.date));
  }, [student?.schedule, classes, profile?.studentCode, td]);

  // H1: Upcoming (today and future)
  const upcoming = useMemo(
    () => allSessions.filter((s) => s.date >= td),
    [allSessions, td]
  );

  // H2: History (past)
  const history = useMemo(
    () => allSessions.filter((s) => s.date < td).reverse(), // newest first
    [allSessions, td]
  );

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
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
          🗓 Lịch học
        </h1>
        <p style={{ fontSize: ".78rem", color: "#9A8672", margin: ".2rem 0 0" }}>
          Lịch cá nhân + lịch lớp tổng hợp
        </p>
      </div>

      {loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "#9A8672", fontSize: ".85rem" }}>
          Đang tải…
        </div>
      )}

      {!loading && allSessions.length === 0 && (
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
          Chưa có lịch học nào. Giáo viên sẽ thêm lịch cho bạn.
        </div>
      )}

      {!loading && allSessions.length > 0 && (
        <>
          {/* H1: Sắp tới */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: ".65rem",
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#9A8672",
                  marginBottom: ".55rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                }}
              >
                Sắp tới
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: 99,
                    background: "#C4622D",
                    color: "#fff",
                    fontSize: ".6rem",
                    fontWeight: 700,
                  }}
                >
                  {upcoming.length}
                </span>
              </div>
              {upcoming.map((s) => (
                <SessionRow
                  key={s.id ?? `${s.date}_${s.time}`}
                  s={s}
                  isToday={s.date === td}
                />
              ))}
            </section>
          )}

          {/* H2: Lịch sử */}
          {history.length > 0 && (
            <section>
              <div
                style={{
                  fontSize: ".65rem",
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#9A8672",
                  marginBottom: ".55rem",
                }}
              >
                Lịch sử · {history.length} buổi
              </div>
              {history.map((s) => (
                <SessionRow
                  key={s.id ?? `${s.date}_${s.time}_past`}
                  s={s}
                  isToday={false}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
