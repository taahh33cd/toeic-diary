"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { saveSubmission, removeSubmission, saveProgress } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import type { Homework } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10); }

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

const SEC_META: Record<string, { label: string; bg: string; color: string; cls: string }> = {
  vocab:     { label: "Từ vựng",    bg: "rgba(196,98,45,.12)",  color: "#C4622D", cls: "vocab" },
  listening: { label: "Nghe",       bg: "rgba(40,96,168,.12)",  color: "#2860A8", cls: "listening" },
  reading:   { label: "Đọc",        bg: "rgba(62,122,82,.12)",  color: "#3E7A52", cls: "reading" },
  practice:  { label: "Đề luyện thi", bg: "rgba(26,62,128,.10)", color: "#1A3E80", cls: "practice" },
  other:     { label: "Khác",       bg: "rgba(160,112,64,.12)", color: "#A07040", cls: "other" },
};

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({
  pct, done, color,
}: { pct: number; done: boolean; color: string }) {
  const r = 18, circ = 2 * Math.PI * r;
  return (
    <div style={{ flexShrink: 0, position: "relative", width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: done ? "1rem" : ".68rem",
        fontWeight: 700,
        color,
      }}>
        {done ? "✓" : `${Math.round(pct)}%`}
      </div>
    </div>
  );
}

// ─── Homework card ────────────────────────────────────────────────────────────

// ─── G11: Congrats Popup ─────────────────────────────────────────────────────

function CongratsPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(44,30,15,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FBF7F2",
          width: "calc(100vw - 3rem)",
          maxWidth: 340,
          padding: "2rem 1.5rem",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(44,30,15,.2)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: "2.8rem", marginBottom: ".5rem" }}>🎉</div>
        <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C1E0F", marginBottom: ".4rem" }}>
          Hoàn thành!
        </div>
        <p style={{ fontSize: ".85rem", color: "#9A8672", marginBottom: "1.25rem" }}>
          Bạn đã hoàn thành 100% nhiệm vụ ngày hôm nay. Tuyệt vời! 💪
        </p>
        <button
          onClick={onClose}
          style={{
            background: "#C4622D", color: "#fff",
            border: "none", padding: ".65rem 2rem",
            fontWeight: 700, fontSize: ".9rem",
            cursor: "pointer",
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

// ─── Homework card ────────────────────────────────────────────────────────────

function HwCard({
  hw, isCurrent, studentCode, submitted, submittedUrl, onDone, allSubmissions,
}: {
  hw: Homework; isCurrent: boolean; studentCode: string;
  submitted: boolean; submittedUrl?: string;
  onDone?: () => void;
  allSubmissions: Record<string, { ticked?: boolean }>;
}) {
  const [open, setOpen] = useState(isCurrent);
  const [submitting, setSubmitting] = useState(false);
  const [url, setUrl] = useState(submittedUrl ?? "");
  const [done, setDone] = useState(submitted);
  // Per-item check state — initialized from Firebase, persisted on toggle
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const sec of SECTIONS) {
      const items = hw[sec] ?? [];
      items.forEach((_, i) => {
        if (allSubmissions[`${hw.id}_${sec}_${i}`]?.ticked) init[`${sec}-${i}`] = true;
      });
    }
    return init;
  });

  const startDate = new Date(hw.date + "T00:00:00");
  const endDate   = hw.endDate ? new Date(hw.endDate + "T00:00:00") : null;
  const td        = today();

  // Card status
  const isOverdue = !done && hw.date < td && (!hw.endDate || hw.endDate < td);
  const isFuture  = hw.date > td;
  const isDone    = done;

  // Section items count
  const sections = SECTIONS.filter(s => (hw[s]?.length ?? 0) > 0);
  const totalItems = sections.reduce((sum, s) => sum + (hw[s]?.length ?? 0), 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const ringPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  // Status class → colors
  const statusColors = isDone
    ? { header: "linear-gradient(135deg,#f2f9f5,#e8f5ee)", calDay: "#4A7C59", calSub: "#4A7C59", label: "#4A7C59", ring: "#4A7C59", divider: "rgba(74,124,89,.3)", border: "rgba(74,124,89,.35)" }
    : isOverdue
    ? { header: "linear-gradient(135deg,#fdf2f0,#fae8e5)", calDay: "#B03A2A", calSub: "#B03A2A", label: "#B03A2A", ring: "#B03A2A", divider: "rgba(176,58,42,.25)", border: "rgba(176,58,42,.35)" }
    : isCurrent
    ? { header: "linear-gradient(135deg,#2C1E0F,#3D2A10)", calDay: "#E8885C", calSub: "rgba(255,255,255,.45)", label: "#fff", ring: "#C4622D", divider: "rgba(196,98,45,.3)", border: "rgba(196,98,45,.3)" }
    : isFuture
    ? { header: "#faf7f2", calDay: "#2C1E0F", calSub: "#9A8672", label: "#2C1E0F", ring: "#9A8672", divider: "var(--border,#DDD0BC)", border: "var(--border,#DDD0BC)" }
    : { header: "var(--bg-elevated,#FBF7F2)", calDay: "#2C1E0F", calSub: "#9A8672", label: "#2C1E0F", ring: "#9A8672", divider: "var(--border,#DDD0BC)", border: "var(--border,#DDD0BC)" };

  const dateLabel = startDate.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
  const endLabel  = endDate ? endDate.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || done) return;
    setSubmitting(true);
    try {
      await saveSubmission(studentCode, hw.date, {
        ticked: true,
        url: url.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      // G10: Sync progress node
      await saveProgress(studentCode, hw.date, {
        done: totalItems,
        total: totalItems,
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      await awardXp("homework_submit", { hwDate: hw.date });
      setDone(true);
      onDone?.(); // G11: trigger congrats popup
    } finally {
      setSubmitting(false);
    }
  }

  function toggleItem(sec: typeof SECTIONS[number], i: number) {
    const key = `${sec}-${i}`;
    const fbKey = `${hw.id}_${sec}_${i}`;
    const newVal = !checked[key];
    setChecked(prev => ({ ...prev, [key]: newVal }));
    if (newVal) {
      saveSubmission(studentCode, fbKey, { ticked: true, updatedAt: new Date().toISOString() });
    } else {
      removeSubmission(studentCode, fbKey);
    }
  }

  return (
    <div style={{
      background: "var(--bg-elevated,#FBF7F2)",
      border: `1px solid ${statusColors.border}`,
      marginBottom: ".7rem",
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: ".9rem",
          padding: ".85rem 1.1rem",
          cursor: "pointer", userSelect: "none",
          background: statusColors.header,
          borderBottom: open ? `1px solid ${statusColors.divider}` : "1px solid transparent",
          transition: "background .15s",
        }}
      >
        {/* Calendar widget */}
        <div style={{ flexShrink: 0, width: 52, textAlign: "center", padding: ".3rem .2rem" }}>
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "1.9rem", fontWeight: 700, lineHeight: 1,
            color: statusColors.calDay,
          }}>
            {startDate.getDate()}
          </div>
          <div style={{
            fontSize: ".6rem", textTransform: "uppercase", letterSpacing: ".08em",
            color: statusColors.calSub, marginTop: ".05rem",
          }}>
            Tháng {startDate.getMonth() + 1}
          </div>
          <div style={{
            fontSize: ".62rem", fontWeight: 600, marginTop: ".08rem",
            color: statusColors.calSub,
          }}>
            {startDate.toLocaleDateString("vi-VN", { weekday: "short" })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 44, background: statusColors.divider, flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {hw.title && (
            <div style={{
              fontSize: ".92rem", fontWeight: 700,
              color: statusColors.label,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              marginBottom: ".1rem",
            }}>
              {hw.title}
            </div>
          )}
          <div style={{
            fontSize: hw.title ? ".76rem" : ".92rem",
            fontWeight: hw.title ? 400 : 600,
            color: hw.title
              ? (isCurrent && !isDone ? "rgba(255,255,255,.55)" : "#9A8672")
              : statusColors.label,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: ".2rem",
          }}>
            {dateLabel}{endLabel ? ` → ${endLabel}` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
            {isDone && (
              <span style={{
                fontSize: ".6rem", fontWeight: 700, padding: ".18rem .5rem",
                background: "rgba(74,124,89,.15)", color: "#4A7C59",
              }}>
                ✓ Hoàn thành
              </span>
            )}
            {isOverdue && !isDone && (
              <span style={{
                fontSize: ".6rem", fontWeight: 700, padding: ".18rem .5rem",
                background: "rgba(176,58,42,.15)", color: "#B03A2A",
              }}>
                Quá hạn
              </span>
            )}
            {isCurrent && !isDone && (
              <span style={{
                fontSize: ".6rem", fontWeight: 700, padding: ".18rem .5rem",
                background: "#C4622D", color: "#fff",
              }}>
                HIỆN TẠI
              </span>
            )}
            <span style={{ fontSize: ".7rem", color: isCurrent ? "rgba(255,255,255,.45)" : "#9A8672" }}>
              {totalItems} nhiệm vụ
            </span>
          </div>
        </div>

        {/* Progress ring */}
        <ProgressRing pct={isDone ? 100 : ringPct} done={isDone} color={statusColors.ring} />

        {/* Toggle */}
        <span style={{
          fontSize: ".7rem", color: isCurrent ? "rgba(255,255,255,.3)" : "#9A8672",
          transition: "transform .2s",
          transform: open ? "rotate(180deg)" : "none",
          flexShrink: 0,
        }}>▼</span>
      </div>

      {/* ── Body ── */}
      {open && (
        <div style={{ padding: ".9rem 1.1rem 1.1rem" }}>
          {/* Submission link zone */}
          {done && submittedUrl ? (
            <div style={{
              padding: ".6rem .9rem", marginBottom: ".9rem",
              background: "rgba(74,124,89,.06)",
              border: "1px solid rgba(74,124,89,.2)",
              display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#4A7C59" }}>
                Link tổng hợp:
              </span>
              <a href={submittedUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: ".8rem", color: "#4A7C59", textDecoration: "underline", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {submittedUrl}
              </a>
            </div>
          ) : null}

          {/* Section groups */}
          {sections.length === 0 ? (
            <p style={{ fontSize: ".83rem", color: "#9A8672", fontStyle: "italic" }}>Không có bài tập.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
              {sections.map(sec => {
                const meta = SEC_META[sec];
                const items = hw[sec] ?? [];
                const isPractice = sec === "practice";
                return (
                  <div key={sec}>
                    {/* Section header */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: ".4rem",
                      padding: ".2rem .6rem", marginBottom: ".55rem",
                      background: meta.bg, color: meta.color,
                      fontSize: ".63rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                      ...(isPractice ? { border: "1px solid rgba(26,62,128,.2)" } : {}),
                    }}>
                      {meta.label}
                    </div>

                    {/* Items */}
                    <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                      {items.map((item, i) => {
                        const key = `${sec}-${i}`;
                        const isChecked = checked[key] ?? false;
                        return (
                          <div
                            key={key}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: ".75rem",
                              padding: ".5rem .75rem",
                              border: isChecked
                                ? "1px solid rgba(74,124,89,.4)"
                                : isPractice ? "1px solid #c5d0ee" : "1px solid var(--border,#DDD0BC)",
                              background: isChecked
                                ? "rgba(74,124,89,.06)"
                                : isPractice ? "#f0f4ff" : "var(--bg-primary,#F5EFE6)",
                              opacity: isChecked ? 0.78 : 1,
                              cursor: "pointer",
                              transition: "all .15s",
                            }}
                            onClick={() => toggleItem(sec, i)}
                          >
                            {/* Checkbox */}
                            <div style={{
                              flexShrink: 0, width: 16, height: 16, marginTop: 2,
                              border: isChecked ? "none" : "1.5px solid #9A8672",
                              background: isChecked ? "#4A7C59" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {isChecked && <span style={{ color: "#fff", fontSize: ".6rem", fontWeight: 700 }}>✓</span>}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
                              <div style={{
                                fontSize: ".86rem", fontWeight: 500,
                                textDecoration: isChecked ? "line-through" : "none",
                                color: isChecked ? "#9A8672" : "var(--text-primary,#2C1E0F)",
                                transition: "all .2s",
                              }}>
                                {item.text}
                              </div>
                              {item.desc && (
                                <div
                                  style={{ fontSize: ".72rem", color: "#9A8672", marginTop: ".2rem", fontStyle: "italic" }}
                                  dangerouslySetInnerHTML={{ __html: item.desc }}
                                />
                              )}
                            </div>

                            {/* Link button */}
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{
                                  flexShrink: 0,
                                  fontSize: ".7rem", fontWeight: 600,
                                  padding: ".22rem .65rem",
                                  background: "var(--orange,#C4622D)",
                                  color: "#fff",
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                  opacity: isChecked ? 0.45 : 1,
                                  pointerEvents: isChecked ? "none" : "auto",
                                  transition: "background .15s",
                                }}
                              >
                                {isPractice ? "Mở đề ↗" : "Mở bài ↗"}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit zone */}
          {!done && (
            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: "1rem",
                padding: ".75rem .9rem",
                background: "var(--bg-primary,#F5EFE6)",
                border: "1px solid var(--border,#DDD0BC)",
                display: "flex", alignItems: "center", gap: ".65rem", flexWrap: "wrap",
              }}
            >
              <input
                type="url"
                placeholder="Link bài làm (Drive, Notion…)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1, minWidth: 160,
                  padding: ".45rem .75rem",
                  border: "1px solid var(--border,#DDD0BC)",
                  background: "var(--bg-elevated,#FBF7F2)",
                  color: "var(--text-primary,#2C1E0F)",
                  fontSize: ".82rem",
                  outline: "none",
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                }}
                aria-label="Link bài làm"
              />
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flexShrink: 0,
                  padding: ".45rem 1.1rem",
                  background: "#C4622D",
                  color: "#fff",
                  border: "none",
                  fontSize: ".8rem",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  transition: "background .15s",
                  whiteSpace: "nowrap",
                }}
              >
                {submitting ? "Đang nộp…" : "✓ Nộp bài  +30 XP"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MissionsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { homework, loading: hwLoading } = useHomework(profile?.studentCode);
  const { goal, loading: goalLoading } = useGoal(profile?.studentCode);
  const { submissions, loading: subLoading } = useSubmissions(profile?.studentCode);
  const [showCongrats, setShowCongrats] = useState(false); // G11

  const loading = profileLoading || hwLoading || goalLoading || subLoading;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 72, background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  const td = today();
  const currentHw = homework.find(
    hw => hw.date <= td && (!hw.endDate || hw.endDate >= td)
  ) ?? homework[0];

  const submittedCount = Object.values(submissions).filter(s => s.ticked).length;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h1 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: "1.25rem", fontWeight: 700,
          color: "var(--text-primary,#2C1E0F)",
        }}>
          Nhiệm vụ & Bài tập
        </h1>
        {homework.length > 0 && (
          <span style={{ fontSize: ".75rem", color: "#9A8672" }}>
            {submittedCount}/{homework.length} đã nộp
          </span>
        )}
      </div>

      {/* Goal banner */}
      {goal && (
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          border: "1px solid var(--border,#DDD0BC)",
          marginBottom: "1.25rem",
        }}>
          <div style={{
            padding: ".7rem 1.2rem",
            borderRight: "1px solid var(--border,#DDD0BC)",
            background: "var(--bg-elevated,#FBF7F2)",
          }}>
            <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#9A8672", marginBottom: ".2rem" }}>Mục tiêu</div>
            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: "#C4622D", lineHeight: 1 }}>
              {goal.target} điểm
            </div>
          </div>
          {goal.deadline && (
            <div style={{ padding: ".7rem 1.2rem", background: "var(--bg-elevated,#FBF7F2)" }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#9A8672", marginBottom: ".2rem" }}>Hạn</div>
              <div style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--text-primary,#2C1E0F)" }}>
                {new Date(goal.deadline).toLocaleDateString("vi-VN")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* G11: Congrats popup */}
      {showCongrats && <CongratsPopup onClose={() => setShowCongrats(false)} />}

      {/* Homework list */}
      {!profile?.studentCode ? (
        <p style={{ fontSize: ".85rem", color: "#9A8672" }}>Chưa có mã học viên.</p>
      ) : homework.length === 0 ? (
        <div style={{
          padding: "3rem 1.5rem", textAlign: "center",
          border: "1px solid var(--border,#DDD0BC)",
          background: "var(--bg-elevated,#FBF7F2)",
        }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary,#2C1E0F)" }}>Chưa có bài tập</p>
          <p style={{ fontSize: ".82rem", color: "#9A8672", marginTop: ".4rem" }}>
            Bài tập sẽ xuất hiện khi giáo viên giao.
          </p>
        </div>
      ) : (
        <div>
          {homework.map((hw, i) => (
            <HwCard
              key={`${hw.date}-${i}`}
              hw={hw}
              isCurrent={hw === currentHw}
              studentCode={profile.studentCode!}
              submitted={!!submissions[hw.date]?.ticked}
              submittedUrl={submissions[hw.date]?.url}
              onDone={() => setShowCongrats(true)}
              allSubmissions={submissions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
