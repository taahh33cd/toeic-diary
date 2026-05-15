"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useHomework } from "@/hooks/firebase/useHomework";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import type { XpStats } from "./page";
import type { Homework, ScheduleItem, ToeicScore } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Focus card ───────────────────────────────────────────────────────────────

const HW_SECTIONS_COUNT = ["vocab", "listening", "reading", "practice", "other"] as const;

function TodayFocusCard({
  hw,
  schedule,
}: {
  hw: Homework | null;
  schedule: ScheduleItem[];
}) {
  const now = new Date();
  const todayStr = today();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const taskCount = hw
    ? HW_SECTIONS_COUNT.reduce((s, sec) => s + (hw[sec]?.length ?? 0), 0)
    : 0;
  const todaySchedule = schedule.filter((s) => s.date === todayStr);

  return (
    <div
      style={{
        border: "1px dashed rgba(196,98,45,.38)",
        background: "rgba(196,98,45,.04)",
        padding: ".9rem 1.2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: ".62rem",
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: ".4rem",
          }}
        >
          Hôm nay · {dateStr}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".18rem" }}>
          {taskCount > 0 ? (
            <span style={{ fontSize: ".82rem", color: "var(--text-secondary)" }}>
              · {taskCount} bài tập cần hoàn thành
            </span>
          ) : (
            <span style={{ fontSize: ".82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              · Không có bài tập mới
            </span>
          )}
          {todaySchedule.length > 0 ? (
            <span style={{ fontSize: ".82rem", color: "var(--text-secondary)" }}>
              · {todaySchedule.length} lịch học hôm nay
            </span>
          ) : (
            <span style={{ fontSize: ".82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              · Không có lịch học
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: ".45rem", flexShrink: 0 }}>
        <Link
          href="/journal/missions"
          style={{
            padding: ".38rem .85rem",
            fontSize: ".75rem",
            fontWeight: 600,
            background: "#C4622D",
            color: "#fff",
            textDecoration: "none",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#B05525";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#C4622D";
          }}
        >
          Làm bài →
        </Link>
        <Link
          href="/journal/vocab"
          style={{
            padding: ".38rem .85rem",
            fontSize: ".75rem",
            fontWeight: 500,
            background: "transparent",
            color: "#C4622D",
            textDecoration: "none",
            border: "1px solid rgba(196,98,45,.4)",
            transition: "all .15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "#C4622D";
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(196,98,45,.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(196,98,45,.4)";
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          Ôn từ →
        </Link>
      </div>
    </div>
  );
}

// ─── Homework widget ──────────────────────────────────────────────────────────

const HW_LABELS: Record<string, string> = {
  vocab: "📗 Từ vựng", reading: "📘 Đọc",
  listening: "📙 Nghe", practice: "📝 Đề luyện", other: "⭐ Khác",
};
const HW_DOTS: Record<string, string> = {
  vocab: "var(--orange)", reading: "#3E7A52",
  listening: "#2860A8", practice: "#1A3E80", other: "#A07040",
};

function HomeworkWidget({ hw }: { hw: Homework }) {
  const total = HW_SECTIONS_COUNT.reduce((s, sec) => s + (hw[sec]?.length ?? 0), 0);
  const d = new Date(hw.date + "T00:00:00");
  const dateLabel = d.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="journal-section" style={{ marginBottom: 0 }}>
      <div className="journal-section-hd">
        <span>📋 Bài tập gần nhất — <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)", fontSize: ".8rem" }}>{dateLabel}</span></span>
        <Link href="/journal/missions" style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", padding: ".2rem .6rem", fontSize: ".68rem", textDecoration: "none", fontFamily: "var(--font-be-vietnam,'Be Vietnam Pro',sans-serif)" }}>
          Xem đầy đủ →
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
        {HW_SECTIONS_COUNT.map((sec) => {
          const items = hw[sec] ?? [];
          if (!items.length) return null;
          return (
            <div key={sec}>
              <div style={{ fontSize: ".63rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: ".2rem .6rem", display: "inline-flex", alignItems: "center", gap: ".4rem", marginBottom: ".45rem", background: sec === "vocab" ? "rgba(196,98,45,.12)" : sec === "reading" ? "rgba(62,122,82,.12)" : sec === "listening" ? "rgba(40,96,168,.12)" : sec === "practice" ? "rgba(26,62,128,.10)" : "rgba(160,112,64,.12)", color: HW_DOTS[sec] }}>
                {HW_LABELS[sec]}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
                {items.map((item, i) => {
                  const desc = item.desc ? stripHtml(item.desc) : "";
                  const descShort = desc.length > 90 ? desc.slice(0, 90) + "…" : desc;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: ".75rem", padding: ".5rem .6rem", border: "1px solid var(--line,#EDE4D6)", background: "var(--bg-primary)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: HW_DOTS[sec], flexShrink: 0, marginTop: 6 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".86rem", fontWeight: 500, color: "var(--orange)", textDecoration: "none" }}>
                            {item.text}
                          </a>
                        ) : (
                          <span style={{ fontSize: ".86rem", fontWeight: 500 }}>{item.text}</span>
                        )}
                        {descShort && (
                          <p style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: ".18rem", fontStyle: "italic" }}>{descShort}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: ".9rem", paddingTop: ".7rem", borderTop: "1px solid var(--line,#EDE4D6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>{total} nhiệm vụ</span>
        <Link href="/journal/missions" style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--orange)", textDecoration: "none", background: "var(--orange4,#FAE8DB)", border: "1px solid rgba(196,98,45,.25)", padding: ".3rem .8rem" }}>
          Vào làm bài →
        </Link>
      </div>
    </div>
  );
}

// ─── Schedule widget ──────────────────────────────────────────────────────────

function ScheduleWidget({ items }: { items: ScheduleItem[] }) {
  const td = today();
  const upcoming = items
    .filter((s) => s.date >= td)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <div className="journal-section" style={{ marginBottom: 0 }}>
      <div className="journal-section-hd">📅 Lịch sắp tới</div>
      {!upcoming.length ? (
        <div className="journal-no-tasks">Không có lịch trong thời gian tới</div>
      ) : (
        <div>
          {upcoming.map((sc, i) => {
            const d = new Date(sc.date + "T00:00:00");
            const isToday = sc.date === td;
            return (
              <div key={i} className={`journal-sched-row${isToday ? " today" : ""}`}>
                <div className="journal-sched-cal">
                  <div className="journal-sched-d">{d.getDate()}</div>
                  <div className="journal-sched-m">{d.toLocaleDateString("vi-VN", { month: "short" }).replace("thg ", "Th")}</div>
                </div>
                <div className="journal-sched-info">
                  <div className="journal-sched-title">{sc.title}</div>
                  {sc.time && <div className="journal-sched-time">{isToday ? "Hôm nay" : d.toLocaleDateString("vi-VN", { weekday: "short" })} · {sc.time}</div>}
                </div>
                <span className={`journal-sched-tag ${sc.kind === "oneone" ? "journal-sched-oneone" : "journal-sched-class"}`}>
                  {sc.kind === "oneone" ? "📞 1-1" : "🏫 Lớp"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Teacher note ─────────────────────────────────────────────────────────────

function TeacherNote({ comments }: { comments: Record<string, { text: string; ts: number }> }) {
  const latest = Object.values(comments).sort((a, b) => b.ts - a.ts)[0];
  if (!latest) return null;
  return (
    <div className="journal-note-block">
      <div className="journal-note-lbl">💬 Nhận xét từ giáo viên</div>
      <div className="journal-note-txt">{stripHtml(latest.text)}</div>
      <div className="journal-note-sig">— Giáo viên · {new Date(latest.ts).toLocaleDateString("vi-VN", { day: "numeric", month: "long" })}</div>
    </div>
  );
}

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ scores, goal }: { scores: ToeicScore[]; goal: number | null }) {
  const sorted = [...scores].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const latestNum = latest?.score ?? null;
  const scorePct = latestNum ? Math.min(100, (latestNum / 990) * 100).toFixed(1) : "0";
  const goalPct = latestNum && goal ? Math.min(100, (latestNum / goal) * 100) : 0;

  const label = latestNum
    ? latestNum >= 750 ? "Xuất sắc 🏆" : latestNum >= 600 ? "Khá tốt 📈" : latestNum >= 450 ? "Trung bình" : "Đang tiến bộ 💪"
    : null;

  return (
    <div className="journal-section">
      <div className="journal-section-hd">
        <span>🎯 Điểm TOEIC</span>
        <Link href="/journal/scores" style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", padding: ".2rem .6rem", fontSize: ".68rem", textDecoration: "none", fontFamily: "var(--font-be-vietnam,'Be Vietnam Pro',sans-serif)" }}>
          Xem chi tiết →
        </Link>
      </div>

      <div className="journal-score-big">
        <span className="n">{latestNum ?? "—"}</span>
        <span className="d">/990</span>
      </div>
      {label && <div className="journal-score-sub">{label} · Cập nhật {latest ? new Date(latest.date + "T00:00:00").toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }) : ""}</div>}

      <div className="journal-score-track">
        <div className="journal-score-fill" style={{ width: `${scorePct}%` }} />
      </div>
      <div className="journal-score-ticks">
        <span>0</span><span>300</span><span>600</span><span>990</span>
      </div>

      {goal && latestNum && (
        <div style={{ marginTop: ".7rem", padding: ".5rem .7rem", background: "rgba(196,98,45,.07)", border: "1px solid rgba(196,98,45,.2)", display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>Mục tiêu:</span>
          <span style={{ fontFamily: "var(--font-lora,'Lora',serif)", fontSize: "1.1rem", fontWeight: 700, color: "var(--orange)" }}>{goal}</span>
          <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>
            {latestNum >= goal ? "— 🏆 Đã đạt!" : `— còn ${goal - latestNum} điểm (${goalPct.toFixed(0)}%)`}
          </span>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="journal-history-row">
          {sorted.slice(0, 8).map((sc, i) => {
            const dp = sc.date.split("-");
            const lbl = dp.length === 3 ? `${sc.score} (${dp[2]}/${dp[1]})` : `${sc.score}`;
            return <div key={i} className={`journal-h-pip${i === 0 ? " latest" : ""}`}>{lbl}</div>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── No profile ───────────────────────────────────────────────────────────────

function NoStudentProfile() {
  return (
    <div className="journal-section" style={{ textAlign: "center", padding: "2.5rem 1.4rem" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>📋</div>
      <p style={{ fontWeight: 600, fontSize: "1rem" }}>Chưa có hồ sơ học viên</p>
      <p style={{ fontSize: ".85rem", color: "var(--text-muted)", marginTop: ".4rem" }}>
        Tài khoản chưa được liên kết mã học viên. Vui lòng liên hệ giáo viên.
      </p>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardClient({ xpStats }: { xpStats: XpStats | null }) {
  const { profile, loading: profileLoading } = useProfile();
  const { student, loading: studentLoading } = useStudent(profile?.studentCode);
  const { goal } = useGoal(profile?.studentCode);
  const { homework } = useHomework(profile?.studentCode);

  const loading = profileLoading || studentLoading;

  if (loading) {
    return (
      <div>
        <div style={{ height: 140, background: "var(--ink2)", marginBottom: "1.4rem", opacity: .6 }} />
        <div className="journal-three">
          {[1, 2, 3].map((i) => <div key={i} className="journal-stat" style={{ height: 90 }} />)}
        </div>
        <div className="journal-two">
          {[1, 2].map((i) => <div key={i} className="journal-section" style={{ height: 200 }} />)}
        </div>
      </div>
    );
  }

  if (!profile?.studentCode) {
    return <NoStudentProfile />;
  }

  const scores = student?.scores ?? [];
  const sortedScores = [...scores].sort((a, b) => b.date.localeCompare(a.date));
  const latestScore = sortedScores[0] ?? null;
  const latestNum = latestScore?.score ?? null;

  const doneCount = (student?.modules ?? []).filter((m) => m.status === "done").length;
  const todayHw = homework[0] ?? null;
  const schedule: ScheduleItem[] = Array.isArray(student?.schedule) ? student!.schedule : [];

  const td = today();
  const todayTasks = todayHw
    ? HW_SECTIONS_COUNT.reduce((s, sec) => s + ((todayHw as never as Record<string, unknown[]>)[sec]?.length ?? 0), 0)
    : 0;

  const nowDate = new Date();
  const dateStr = nowDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      {/* ── Frozen alert ── */}
      {student?.frozen && (
        <div style={{ padding: ".75rem 1.4rem", marginBottom: "1rem", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)", borderLeft: "4px solid rgba(245,158,11,.7)", display: "flex", alignItems: "center", gap: ".75rem" }}>
          <span style={{ fontSize: "1.3rem" }}>❄️</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: ".88rem", color: "rgba(245,158,11,.9)" }}>Tài khoản đang tạm dừng</p>
            <p style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: ".2rem" }}>Liên hệ giáo viên để tiếp tục học.</p>
          </div>
        </div>
      )}

      {/* ── Welcome banner ── */}
      <div className="journal-welcome">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <div className="journal-welcome-name">
              Chào, <span>{student?.name ?? profile.displayName ?? "bạn"}</span> 👋
            </div>
            <div className="journal-welcome-meta">{dateStr}</div>
            <div className="journal-week-pill">
              <span className="wl">Tuần hiện tại</span>
              <span className="wv">{student?.currentWeek ?? "—"}</span>
            </div>
          </div>
          <LiveIndicator />
        </div>
      </div>

      {/* ── Focus card (always visible) ── */}
      <TodayFocusCard hw={todayHw} schedule={schedule} />

      {/* ── Three stat cards ── */}
      <div className="journal-three">
        <div className="journal-stat">
          <div className="journal-stat-num">{latestNum ?? "—"}</div>
          <div className="journal-stat-lbl">Điểm TOEIC hiện tại</div>
        </div>
        <div className="journal-stat">
          <div className="journal-stat-num">{doneCount}</div>
          <div className="journal-stat-lbl">Học phần hoàn thành</div>
        </div>
        <div className="journal-stat">
          <div className="journal-stat-num" style={{ fontSize: todayTasks ? "2.6rem" : "1.5rem" }}>
            {todayTasks || "—"}
          </div>
          <div className="journal-stat-lbl">Nhiệm vụ hôm nay</div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="journal-two">
        {/* Left: Score + Note */}
        <div>
          {scores.length > 0 ? (
            <ScoreCard scores={scores} goal={goal?.target ?? null} />
          ) : (
            <div className="journal-section">
              <div className="journal-section-hd">🎯 Điểm TOEIC</div>
              <p style={{ fontSize: ".82rem", color: "var(--text-muted)", padding: "1rem 0", textAlign: "center" }}>Chưa có điểm thi nào.</p>
            </div>
          )}

          {student?.comments && Object.keys(student.comments).length > 0 && (
            <TeacherNote comments={student.comments as Record<string, { text: string; ts: number }>} />
          )}

          {student?.note && !student?.comments && (
            <div className="journal-note-block">
              <div className="journal-note-lbl">📌 Ghi chú</div>
              <div className="journal-note-txt">{student.note}</div>
            </div>
          )}

          {xpStats && (
            <div className="journal-section" style={{ marginTop: "1.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "var(--text-muted)", marginBottom: ".4rem" }}>
                <span>⭐ Level {xpStats.level} — {xpStats.totalXp} XP</span>
                <span>{xpStats.totalXp} / {xpStats.xpNext}</span>
              </div>
              <div style={{ height: 4, background: "var(--line,#EDE4D6)" }}>
                <div style={{ height: "100%", width: `${xpStats.xpPct}%`, background: "linear-gradient(90deg,#C4622D,#E8885C)", transition: "width 1s ease" }} />
              </div>
              <div style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
                🔥 {xpStats.currentStreak} ngày streak
              </div>
            </div>
          )}
        </div>

        {/* Right: Homework + Schedule */}
        <div>
          {todayHw ? (
            <HomeworkWidget hw={todayHw} />
          ) : (
            <div className="journal-section">
              <div className="journal-section-hd">✅ Nhiệm vụ hôm nay</div>
              <div className="journal-no-tasks">🎉 Không có nhiệm vụ nào!</div>
            </div>
          )}

          <div style={{ marginTop: "1.4rem" }}>
            {schedule.length > 0 ? (
              <ScheduleWidget items={schedule} />
            ) : (
              <div className="journal-section">
                <div className="journal-section-hd">📅 Lịch sắp tới</div>
                <div className="journal-no-tasks">Chưa có lịch học nào</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: ".7rem", marginTop: "1.4rem" }}>
        {[
          { href: "/journal/scores",    emoji: "🎯", label: "Điểm số" },
          { href: "/journal/vocab",     emoji: "📖", label: "Từ vựng" },
          { href: "/journal/error-log", emoji: "📒", label: "Nhật ký lỗi" },
          { href: "/journal/missions",  emoji: "✅", label: "Nhiệm vụ" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: ".4rem", padding: ".9rem .5rem",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              textDecoration: "none", transition: "border-color .15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--orange)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; }}
          >
            <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{l.emoji}</span>
            <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)" }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
