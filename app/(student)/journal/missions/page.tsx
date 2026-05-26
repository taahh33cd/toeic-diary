"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { useDayLinks } from "@/hooks/firebase/useDayLinks";
import { saveSubmission, removeSubmission, saveProgress, saveDayLink } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import type { Homework } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10); }

/** Same logic as calcProgress on /journal/progress page */
function calcHwIsDone(
  hw: import("@/lib/firebase/types").Homework,
  submissions: Record<string, { ticked?: boolean; url?: string }>,
  dayLinks: Record<string, { link?: string }>
): boolean {
  let total = 0;
  for (const sec of (["vocab", "listening", "reading", "practice", "other"] as const)) {
    total += hw[sec]?.length ?? 0;
  }
  if (total === 0) return false;
  if (dayLinks[hw.id]?.link) return true;
  let done = 0;
  for (const sec of (["vocab", "listening", "reading", "practice", "other"] as const)) {
    const items = hw[sec] ?? [];
    for (let i = 0; i < items.length; i++) {
      const sub = submissions[`${hw.id}_${sec}_${i}`];
      if (sub?.ticked || sub?.url) done++;
    }
  }
  return done === total;
}

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

const LINK_LABEL: Record<string, string> = {
  listening: "Nghe ngay ↗",
  practice:  "Mở đề ↗",
  reading:   "Đọc ngay ↗",
  vocab:     "Xem ngay ↗",
  other:     "Mở link ↗",
};

const SEC_META: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  vocab:     { label: "Từ vựng",      bg: "rgba(196,98,45,.1)",  color: "#C4622D", emoji: "📖" },
  listening: { label: "Nghe",         bg: "rgba(40,96,168,.1)",  color: "#2860A8", emoji: "🎧" },
  reading:   { label: "Đọc",          bg: "rgba(62,122,82,.1)",  color: "#3E7A52", emoji: "📄" },
  practice:  { label: "Đề luyện thi", bg: "rgba(26,62,128,.08)", color: "#1A3E80", emoji: "✏️" },
  other:     { label: "Khác",         bg: "rgba(160,112,64,.1)", color: "#A07040", emoji: "⭐" },
};

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({
  pct, done, color,
}: { pct: number; done: boolean; color: string }) {
  // Animate from 0 on first mount; then follow live changes immediately
  const [displayed, setDisplayed] = useState(0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      const id = setTimeout(() => setDisplayed(done ? 100 : pct), 60);
      return () => clearTimeout(id);
    }
    setDisplayed(done ? 100 : pct);
  }, [pct, done]);

  const r = 18, circ = 2 * Math.PI * r;
  return (
    <div style={{ flexShrink: 0, position: "relative", width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * displayed) / 100}
          style={{ transition: "stroke-dashoffset 0.65s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: done ? "1rem" : ".68rem",
        fontWeight: 700,
        color,
      }}>
        {done ? "✓" : `${Math.round(displayed)}%`}
      </div>
    </div>
  );
}

// ─── Homework card ────────────────────────────────────────────────────────────

// ─── G11: Congrats Popup ─────────────────────────────────────────────────────

function CongratsPopup({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(44,30,15,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
          style={{ fontSize: "2.8rem", marginBottom: ".5rem" }}
        >
          🎉
        </motion.div>
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
      </motion.div>
    </motion.div>
  );
}

// ─── Homework card ────────────────────────────────────────────────────────────

function HwCard({
  hw, isCurrent, studentCode, submitted, submittedUrl, dayLinkUrl, onDone, allSubmissions,
}: {
  hw: Homework; isCurrent: boolean; studentCode: string;
  submitted: boolean; submittedUrl?: string; dayLinkUrl?: string;
  onDone?: () => void;
  allSubmissions: Record<string, { ticked?: boolean }>;
}) {
  const [open, setOpen] = useState(isCurrent);
  const [submitting, setSubmitting] = useState(false);
  const [url, setUrl] = useState(dayLinkUrl ?? submittedUrl ?? "");
  const [done, setDone] = useState(submitted);
  const [showDescMap, setShowDescMap] = useState<Record<string, boolean>>({});
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

  // Section items count (computed before isDone since isDone depends on checkedCount)
  const sections = SECTIONS.filter(s => (hw[s]?.length ?? 0) > 0);
  const totalItems = sections.reduce((sum, s) => sum + (hw[s]?.length ?? 0), 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  // Card status
  // isDone: official submission (Nộp button) OR every item ticked
  const allItemsChecked = totalItems > 0 && checkedCount === totalItems;
  const isDone    = done || allItemsChecked;
  const isOverdue = !isDone && hw.date < td && (!hw.endDate || hw.endDate < td);
  const isFuture  = hw.date > td;
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
      const trimmedUrl = url.trim();
      await saveSubmission(studentCode, hw.date, {
        ticked: true,
        url: trimmedUrl || undefined,
        updatedAt: new Date().toISOString(),
      });
      // Sync link to daylinks so admin sees LINK TỔNG HỢP
      if (trimmedUrl) await saveDayLink(studentCode, hw.id, trimmedUrl);
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
      <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
        <div style={{ padding: ".9rem 1.1rem 1.1rem" }}>

          {/* ── Submit form at TOP (if not done) ── */}
          {!done && (
            <form
              onSubmit={handleSubmit}
              style={{
                marginBottom: ".9rem",
                border: "1px solid var(--border,#DDD0BC)",
                background: "var(--bg-primary,#F5EFE6)",
              }}
            >
              <div style={{
                padding: ".4rem .75rem",
                borderBottom: "1px solid var(--border,#DDD0BC)",
                fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                color: "#9A8672", display: "flex", alignItems: "center", gap: ".4rem",
              }}>
                📎 NỘP LINK DRIVE TỔNG HỢP
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".65rem", flexWrap: "wrap", padding: ".5rem .75rem" }}>
                <input
                  type="url"
                  placeholder="Paste link Google Drive tổng hợp..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, minWidth: 160,
                    padding: ".4rem .7rem",
                    border: "1px solid var(--border,#DDD0BC)",
                    background: "var(--bg-elevated,#FBF7F2)",
                    color: "var(--text-primary,#2C1E0F)",
                    fontSize: ".82rem",
                    outline: "none",
                  }}
                  aria-label="Link bài làm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flexShrink: 0,
                    padding: ".42rem 1.1rem",
                    background: "#C4622D", color: "#fff", border: "none",
                    fontSize: ".8rem", fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {submitting ? "Đang nộp…" : "Nộp →"}
                </button>
              </div>
            </form>
          )}

          {/* ── Link tổng hợp (if done) ── */}
          {done && (dayLinkUrl || submittedUrl) && (
            <div style={{
              padding: ".5rem .75rem", marginBottom: ".9rem",
              background: "rgba(74,124,89,.06)", border: "1px solid rgba(74,124,89,.2)",
              display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#4A7C59", flexShrink: 0 }}>
                🔗 LINK TỔNG HỢP:
              </span>
              <a
                href={dayLinkUrl ?? submittedUrl}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: ".8rem", color: "#4A7C59", textDecoration: "underline", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {dayLinkUrl ?? submittedUrl}
              </a>
            </div>
          )}

          {/* ── Section groups ── */}
          {sections.length === 0 ? (
            <p style={{ fontSize: ".83rem", color: "#9A8672", fontStyle: "italic" }}>Không có bài tập.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
              {sections.map(sec => {
                const meta = SEC_META[sec];
                const items = hw[sec] ?? [];
                const isPractice = sec === "practice";
                return (
                  <div key={sec}>
                    {/* Section header — full-width colored bar */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: ".45rem",
                      padding: ".3rem .75rem", marginBottom: ".5rem",
                      background: meta.bg, borderLeft: `3px solid ${meta.color}`,
                    }}>
                      <span style={{ fontSize: ".85rem" }}>{meta.emoji}</span>
                      <span style={{ fontSize: ".63rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Items */}
                    <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                      {items.map((item, i) => {
                        const key = `${sec}-${i}`;
                        const isChecked = checked[key] ?? false;
                        const descKey = `${key}-desc`;
                        const showDesc = showDescMap[descKey] ?? false;
                        return (
                          <div
                            key={key}
                            style={{
                              border: isChecked
                                ? "1px solid rgba(74,124,89,.4)"
                                : isPractice ? "1px solid #c5d0ee" : "1px solid var(--border,#DDD0BC)",
                              background: isChecked
                                ? "rgba(74,124,89,.06)"
                                : isPractice ? "#f0f4ff" : "var(--bg-primary,#F5EFE6)",
                              transition: "all .15s",
                            }}
                          >
                            {/* Main row */}
                            <div
                              style={{
                                display: "flex", alignItems: "center", gap: ".75rem",
                                padding: ".5rem .75rem",
                                cursor: "pointer",
                                opacity: isChecked ? 0.78 : 1,
                              }}
                              onClick={() => toggleItem(sec, i)}
                            >
                              {/* Checkbox */}
                              <motion.div
                                style={{
                                  flexShrink: 0, width: 16, height: 16,
                                  border: isChecked ? "none" : "1.5px solid #9A8672",
                                  background: isChecked ? "#4A7C59" : "transparent",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                                animate={isChecked ? { scale: [0.8, 1.15, 1] } : { scale: 1 }}
                                transition={{ duration: 0.2, times: [0, 0.5, 1] }}
                              >
                                {isChecked && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <motion.path
                                      d="M1 4L3.5 6.5L9 1"
                                      stroke="white"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{ duration: 0.15, ease: "easeOut" }}
                                    />
                                  </svg>
                                )}
                              </motion.div>

                              {/* Text */}
                              <span style={{
                                flex: 1, fontSize: ".86rem", fontWeight: 500,
                                textDecoration: isChecked ? "line-through" : "none",
                                color: isChecked ? "#9A8672" : "var(--text-primary,#2C1E0F)",
                                transition: "all .2s",
                              }}>
                                {item.text}
                              </span>

                              {/* Link button */}
                              {item.link && (
                                <a
                                  href={item.link} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    flexShrink: 0, fontSize: ".72rem", fontWeight: 600,
                                    padding: ".2rem .65rem",
                                    background: "var(--orange,#C4622D)", color: "#fff",
                                    textDecoration: "none", whiteSpace: "nowrap",
                                    opacity: isChecked ? 0.4 : 1,
                                    pointerEvents: isChecked ? "none" : "auto",
                                  }}
                                >
                                  {LINK_LABEL[sec] ?? "Mở link ↗"}
                                </a>
                              )}

                              {/* Desc toggle button */}
                              {item.desc && (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); setShowDescMap(prev => ({ ...prev, [descKey]: !prev[descKey] })); }}
                                  style={{
                                    flexShrink: 0, fontSize: ".68rem", fontWeight: 600,
                                    padding: ".2rem .55rem",
                                    border: `1px solid ${showDesc ? meta.color : "var(--border,#DDD0BC)"}`,
                                    background: showDesc ? meta.bg : "transparent",
                                    color: showDesc ? meta.color : "#9A8672",
                                    cursor: "pointer", whiteSpace: "nowrap",
                                  }}
                                >
                                  {showDesc ? "Ẩn hướng dẫn" : "Xem hướng dẫn"}
                                </button>
                              )}
                            </div>

                            {/* Desc expanded */}
                            <AnimatePresence initial={false}>
                              {item.desc && showDesc && (
                                <motion.div
                                  key="desc"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div
                                    style={{
                                      padding: ".5rem .75rem .6rem 2.5rem",
                                      borderTop: `1px solid ${meta.bg}`,
                                      fontSize: ".78rem", color: "#6B4C30", lineHeight: 1.6,
                                      background: meta.bg,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: item.desc }}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MissionsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { homework, loading: hwLoading } = useHomework(profile?.studentCode);
  const { goal, loading: goalLoading } = useGoal(profile?.studentCode);
  const { submissions, loading: subLoading } = useSubmissions(profile?.studentCode);
  const { dayLinks } = useDayLinks(profile?.studentCode);
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

  // ── Summary stats (mirrors /journal/progress logic) ───────────────────
  const dlMap = dayLinks as Record<string, { link?: string }>;
  const hwTotal    = homework.length;
  const hwDone     = homework.filter(hw => calcHwIsDone(hw, submissions, dlMap)).length;
  const hwOverdue  = homework.filter(hw => {
    const deadline = hw.endDate ?? hw.date;
    return deadline < td && !calcHwIsDone(hw, submissions, dlMap);
  }).length;
  const hwRemaining = Math.max(0, hwTotal - hwDone - hwOverdue);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: "1.25rem", fontWeight: 700,
          color: "var(--text-primary,#2C1E0F)",
        }}>
          Nhiệm vụ & Bài tập
        </h1>
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

      {/* ── Progress summary chips ── */}
      {hwTotal > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: ".4rem",
          flexWrap: "wrap",
          padding: ".55rem .85rem",
          background: "var(--bg-elevated,#FBF7F2)",
          border: "1px solid var(--border,#DDD0BC)",
          marginBottom: "1.25rem",
          fontSize: ".75rem",
        }}>
          <span style={{ fontWeight: 700, color: "#2C1E0F" }}>{hwTotal}</span>
          <span style={{ color: "#9A8672" }}>BTVN</span>
          <span style={{ color: "var(--border,#DDD0BC)", userSelect: "none" }}>·</span>
          <span style={{ fontWeight: 700, color: "#4A7C59" }}>{hwDone}</span>
          <span style={{ color: "#9A8672" }}>hoàn thành</span>
          {hwOverdue > 0 && (<>
            <span style={{ color: "var(--border,#DDD0BC)", userSelect: "none" }}>·</span>
            <span style={{ fontWeight: 700, color: "#B03A2A" }}>{hwOverdue}</span>
            <span style={{ color: "#9A8672" }}>quá hạn</span>
          </>)}
          {hwRemaining > 0 && (<>
            <span style={{ color: "var(--border,#DDD0BC)", userSelect: "none" }}>·</span>
            <span style={{ fontWeight: 700, color: "#9A8672" }}>{hwRemaining}</span>
            <span style={{ color: "#9A8672" }}>còn lại</span>
          </>)}
        </div>
      )}

      {/* G11: Congrats popup */}
      <AnimatePresence>
        {showCongrats && <CongratsPopup onClose={() => setShowCongrats(false)} />}
      </AnimatePresence>

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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {homework.map((hw, i) => (
            <motion.div
              key={`${hw.date}-${i}`}
              variants={{
                hidden:  { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
              }}
            >
              <HwCard
                hw={hw}
                isCurrent={hw === currentHw}
                studentCode={profile.studentCode!}
                submitted={!!submissions[hw.date]?.ticked}
                submittedUrl={submissions[hw.date]?.url}
                dayLinkUrl={(dayLinks as Record<string, { link?: string }>)[hw.id]?.link}
                onDone={() => setShowCongrats(true)}
                allSubmissions={submissions}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
