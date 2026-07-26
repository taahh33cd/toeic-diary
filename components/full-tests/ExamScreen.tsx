"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PARTS, partMeta } from "@/lib/full-tests/parts";
import type {
  FullTest, FullTestGroup, FullTestQuestion, PartNumber,
} from "@/lib/full-tests/types";
import { PALETTE, type Palette, type Skin } from "./theme";
import type { RunConfig } from "./SetupPanel";

/** Giai đoạn của chế độ thi thật: Listening chạy theo audio rồi khoá, Reading tính giờ riêng. */
type Stage = "listening" | "reading";

const SPEEDS = [0.75, 1, 1.25, 1.5];
// Mặc định là bậc 1 (1.15). Bậc 0 = 1.0 tương đương cỡ chữ cũ, để ai muốn nhỏ lại.
const FONT_STEPS = [1, 1.15, 1.32, 1.5];
const FONT_DEFAULT = 1;
const SPLIT_KEY = "fulltest:split";

/**
 * Part có media riêng theo nhóm ⇒ phân trang từng nhóm một, hai khung scroll độc lập.
 * Part 2 và 5 mỗi câu độc lập, không có gì để ghép cặp ⇒ danh sách dọc.
 */
const PAGINATED: PartNumber[] = [1, 3, 4, 6, 7];

function isPaginated(part: PartNumber) {
  return PAGINATED.includes(part);
}

function mmss(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function rangeLabel(g: FullTestGroup) {
  return g.questionEnd > g.questionStart
    ? `Câu ${g.questionStart}–${g.questionEnd}`
    : `Câu ${g.questionStart}`;
}

export function ExamScreen({
  test,
  config,
  skin,
  onToggleSkin,
  onSubmit,
  initialAnswers,
  initialMarked,
  onProgress,
}: {
  test: FullTest;
  config: RunConfig;
  skin: Skin;
  onToggleSkin: () => void;
  onSubmit: (answers: Record<number, string>, marked: number[]) => void;
  initialAnswers?: Record<number, string>;
  initialMarked?: number[];
  onProgress?: (answers: Record<number, string>, marked: number[]) => void;
}) {
  const P = PALETTE[skin];
  const real = config.mode === "real";

  const chosen = useMemo(() => new Set(config.parts), [config.parts]);
  const groups = useMemo(() => test.groups.filter((g) => chosen.has(g.part)), [test.groups, chosen]);
  const partsInPlay = useMemo(() => PARTS.filter((p) => chosen.has(p.part)), [chosen]);
  const listeningParts = useMemo(() => partsInPlay.filter((p) => p.section === "listening"), [partsInPlay]);
  const readingParts = useMemo(() => partsInPlay.filter((p) => p.section === "reading"), [partsInPlay]);

  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers ?? {});
  const [marked, setMarked] = useState<Set<number>>(new Set(initialMarked ?? []));
  const [stage, setStage] = useState<Stage>(real && listeningParts.length ? "listening" : "reading");
  const [activePart, setActivePart] = useState<PartNumber>(
    (real && listeningParts.length ? listeningParts[0].part : partsInPlay[0]?.part) ?? 1,
  );
  const [groupIndex, setGroupIndex] = useState(0);
  const [fontStep, setFontStep] = useState(FONT_DEFAULT);
  const [speed, setSpeed] = useState(1);
  const [mobilePane, setMobilePane] = useState<"media" | "questions">("media");
  const [narrow, setNarrow] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [splitPct, setSplitPct] = useState(58);

  const countdownTotal = real
    ? stage === "reading" && readingParts.length ? 75 * 60 : null
    : config.minutes > 0 ? config.minutes * 60 : null;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(countdownTotal);

  const stageRef = useRef(stage);
  useEffect(() => {
    if (stageRef.current !== stage) {
      stageRef.current = stage;
      setSecondsLeft(real && stage === "reading" && readingParts.length ? 75 * 60 : null);
    }
  }, [stage, real, readingParts.length]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    const saved = Number(localStorage.getItem(SPLIT_KEY));
    if (saved >= 30 && saved <= 75) setSplitPct(saved);
    return () => mq.removeEventListener("change", on);
  }, []);

  const submit = useCallback(() => onSubmit(answers, [...marked]), [answers, marked, onSubmit]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (config.autoSubmit) submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, config.autoSubmit, submit]);

  useEffect(() => {
    onProgress?.(answers, [...marked]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, marked]);

  // Chỉ chọn part Listening thì hết audio vẫn giữ các part đó lại, không thì
  // màn hình trắng trơn chẳng còn gì bấm ngoài nút nộp bài.
  const visibleParts = real
    ? stage === "listening"
      ? listeningParts
      : readingParts.length ? readingParts : listeningParts
    : partsInPlay;

  useEffect(() => {
    if (visibleParts.length && !visibleParts.some((p) => p.part === activePart)) {
      setActivePart(visibleParts[0].part);
      setGroupIndex(0);
    }
  }, [visibleParts, activePart]);

  const activeGroups = useMemo(() => groups.filter((g) => g.part === activePart), [groups, activePart]);
  const paginated = isPaginated(activePart);
  const safeIndex = Math.min(groupIndex, Math.max(0, activeGroups.length - 1));
  const shownGroups = paginated ? activeGroups.slice(safeIndex, safeIndex + 1) : activeGroups;

  const goToPart = useCallback((part: PartNumber, index = 0) => {
    setActivePart(part);
    setGroupIndex(index);
    setMobilePane("media");
  }, []);

  /** Nhảy tới nhóm chứa câu q — dùng cho sidebar và cho playlist chế độ thi thật. */
  const jumpToQuestion = useCallback(
    (q: number) => {
      const part = groups.find((g) => q >= g.questionStart && q <= g.questionEnd)?.part;
      if (!part) return;
      const list = groups.filter((g) => g.part === part);
      const idx = list.findIndex((g) => q >= g.questionStart && q <= g.questionEnd);
      setActivePart(part);
      setGroupIndex(Math.max(0, idx));
      if (!isPaginated(part)) {
        requestAnimationFrame(() =>
          document.getElementById(`q-${q}`)?.scrollIntoView({ block: "center", behavior: "smooth" }),
        );
      }
    },
    [groups],
  );

  // ── Audio ──────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playIndex, setPlayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gap, setGap] = useState(0);
  // Chỉ nhảy đoạn khi đoạn hiện tại đã phát xong. Không suy từ gap === 0 được:
  // lúc mới bấm bắt đầu thì gap cũng đang 0 và sẽ nhảy mất đoạn đầu.
  const [pendingNext, setPendingNext] = useState(false);

  const playlist = useMemo(() => (real ? groups.filter((g) => g.audio) : []), [real, groups]);

  const advance = useCallback(() => {
    const cur = playlist[playIndex];
    if (!cur) return;
    const count = cur.questionEnd - cur.questionStart + 1;
    setGap(partMeta(cur.part).gapSeconds * count);
    setPendingNext(true);
  }, [playlist, playIndex]);

  useEffect(() => {
    if (!real || gap <= 0) return;
    const t = setTimeout(() => setGap((g) => g - 1), 1000);
    return () => clearTimeout(t);
  }, [real, gap]);

  useEffect(() => {
    if (!real || !playing || !pendingNext || gap > 0) return;
    setPendingNext(false);
    const next = playIndex + 1;
    if (next >= playlist.length) {
      setPlaying(false);
      setStage("reading");
      return;
    }
    setPlayIndex(next);
  }, [gap, real, playing, pendingNext, playIndex, playlist.length]);

  // đoạn đang phát quyết định nhóm đang hiển thị
  const current = playlist[playIndex];
  useEffect(() => {
    if (!real || !current) return;
    jumpToQuestion(current.questionStart);
  }, [real, current, jumpToQuestion]);

  // đổi đoạn ⇒ phát ngay; autoPlay không kích lại khi chỉ src thay đổi
  useEffect(() => {
    if (!real || !playing) return;
    audioRef.current?.play().catch(() => {});
  }, [real, playing, playIndex]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = real ? 1 : speed;
  }, [speed, real, playIndex]);

  function pick(q: number, letter: string) {
    setAnswers((prev) => ({ ...prev, [q]: letter }));
  }
  function toggleMark(q: number) {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  }

  const allQuestions = useMemo(
    () => groups.flatMap((g) => g.questions).filter((q) => !q.broken),
    [groups],
  );
  const answeredCount = allQuestions.filter((q) => answers[q.number]).length;
  const fontScale = FONT_STEPS[fontStep];

  // Chế độ thi thật: chỉ khoá điều hướng trong giai đoạn Listening (playlist tự
  // chạy, không được đi lại). Sang Reading thì vẫn phải chuyển bài đọc bình thường.
  const navLocked = real && stage === "listening";

  // điều hướng nhóm: hết nhóm thì sang part kế trong nhóm part đang mở
  const partPos = visibleParts.findIndex((p) => p.part === activePart);
  const canPrev = paginated && !navLocked && (safeIndex > 0 || partPos > 0);
  const canNext = paginated && !navLocked && (safeIndex < activeGroups.length - 1 || partPos < visibleParts.length - 1);

  function prevGroup() {
    if (safeIndex > 0) return setGroupIndex(safeIndex - 1);
    const prev = visibleParts[partPos - 1];
    if (!prev) return;
    const list = groups.filter((g) => g.part === prev.part);
    goToPart(prev.part, Math.max(0, list.length - 1));
  }
  function nextGroup() {
    if (safeIndex < activeGroups.length - 1) return setGroupIndex(safeIndex + 1);
    const nxt = visibleParts[partPos + 1];
    if (nxt) goToPart(nxt.part, 0);
  }

  return (
    <div style={{ height: "100vh", background: P.bg, color: P.ink, fontFamily: P.sans, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.6rem 1rem", background: P.panel, borderBottom: `1px solid ${P.border}`, flexWrap: "wrap", flexShrink: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.02rem", minWidth: 0 }}>
          <span style={{ color: P.primary }}>✳</span>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{test.title}</span>
        </span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, background: P.primarySoft, color: P.primary, border: `1px solid ${P.primary}` }}>
          {real ? "Thi thật" : "Luyện tập"}
          {real && <span style={{ fontWeight: 500, opacity: 0.85 }}>· {stage === "listening" ? "Listening" : "Reading"}</span>}
        </span>

        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {secondsLeft !== null ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: "0.95rem", background: secondsLeft <= 300 ? P.bad : P.panelAlt, color: secondsLeft <= 300 ? "#fff" : P.ink, border: `1px solid ${secondsLeft <= 300 ? P.bad : P.border}` }}>
              ⏱ {mmss(secondsLeft)}
            </span>
          ) : (
            <span style={{ fontSize: "0.8rem", color: P.muted }}>
              {real && stage === "listening" ? "Theo độ dài audio" : "Không giới hạn"}
            </span>
          )}
          <span style={{ fontSize: "0.8rem", color: P.muted, fontVariantNumeric: "tabular-nums" }}>
            {answeredCount}/{allQuestions.length}
          </span>
          <button type="button" onClick={onToggleSkin} title="Sáng / tối" style={iconBtn(P)}>
            {skin === "light" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            onClick={() => setFontStep((s) => (s + 1) % FONT_STEPS.length)}
            title={`Cỡ chữ ${Math.round(fontScale * 100)}%`}
            style={iconBtn(P)}
          >
            {fontStep === 0 ? "A−" : fontStep === FONT_DEFAULT ? "A" : "A+"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", fontFamily: P.sans }}
          >
            Nộp bài
          </button>
        </span>
      </header>

      {/* ── Tab part ───────────────────────────────────────────────────── */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", background: P.panelAlt, borderBottom: `1px solid ${P.border}`, overflowX: "auto", flexShrink: 0 }}>
        {partsInPlay.map((p) => {
          const on = p.part === activePart;
          const open = visibleParts.some((v) => v.part === p.part);
          const qs = groups.filter((g) => g.part === p.part).flatMap((g) => g.questions).filter((q) => !q.broken);
          const got = qs.filter((q) => answers[q.number]).length;
          return (
            <button
              key={p.part}
              type="button"
              disabled={!open}
              onClick={() => goToPart(p.part)}
              title={open ? p.labelVi : "Phần này đã khoá"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0,
                padding: "6px 13px", borderRadius: 8, fontFamily: P.sans,
                fontSize: "0.9rem", fontWeight: 700, cursor: open ? "pointer" : "not-allowed",
                background: on ? P.primary : "transparent",
                color: on ? P.onPrimary : open ? P.inkSoft : P.muted,
                border: `1px solid ${on ? P.primary : P.border}`,
                opacity: open ? 1 : 0.45,
              }}
            >
              {p.label}
              <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>
                {got}/{qs.length}
              </span>
              {!open && <span style={{ fontSize: "0.7rem" }}>🔒</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Playlist chế độ thi thật ───────────────────────────────────── */}
      {real && partMeta(activePart).hasAudio && (
        <div style={{ padding: "0.6rem 1rem", background: P.panelAlt, borderBottom: `1px solid ${P.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <audio
            ref={audioRef}
            src={current?.audio ? `${test.audioBase}/${current.audio}` : undefined}
            onEnded={advance}
            style={{ display: "none" }}
          />
          {!playing ? (
            <button
              type="button"
              onClick={() => { setPlaying(true); audioRef.current?.play().catch(() => {}); }}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, fontSize: "0.88rem", cursor: "pointer" }}
            >
              ▶ Bắt đầu phần nghe
            </button>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.86rem", fontWeight: 700 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: gap > 0 ? P.warn : P.ok }} />
              {gap > 0 ? `Thời gian trả lời — còn ${gap}s` : current ? `Đang phát ${rangeLabel(current)}` : ""}
            </span>
          )}
          <span style={{ fontSize: "0.78rem", color: P.muted }}>
            Audio chạy liền mạch một lần — không tua, không nghe lại.
          </span>
        </div>
      )}

      {/* ── Điều hướng nhóm ────────────────────────────────────────────── */}
      {paginated && activeGroups.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.45rem 1rem", background: P.panel, borderBottom: `1px solid ${P.border}`, flexShrink: 0 }}>
          <button type="button" onClick={prevGroup} disabled={!canPrev} style={navBtn(P, !canPrev)}>
            ← Trước
          </button>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, textAlign: "center", flex: 1 }}>
            {rangeLabel(activeGroups[safeIndex])}
            <span style={{ color: P.muted, fontWeight: 500 }}>
              {" "}· {safeIndex + 1}/{activeGroups.length}
            </span>
          </span>
          <button type="button" onClick={nextGroup} disabled={!canNext} style={navBtn(P, !canNext)}>
            Sau →
          </button>
        </div>
      )}

      {/* ── Thân ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <MainPane
          P={P}
          groups={shownGroups}
          part={activePart}
          paginated={paginated}
          real={real}
          config={config}
          answers={answers}
          marked={marked}
          onPick={pick}
          onMark={toggleMark}
          fontScale={fontScale}
          narrow={narrow}
          mobilePane={mobilePane}
          setMobilePane={setMobilePane}
          audioBase={test.audioBase}
          speed={speed}
          setSpeed={setSpeed}
          onZoom={setZoomed}
          splitPct={splitPct}
          setSplitPct={(v) => { setSplitPct(v); localStorage.setItem(SPLIT_KEY, String(v)); }}
        />

        {!narrow && (
          <ProgressSidebar
            P={P}
            partsInPlay={partsInPlay}
            visibleParts={visibleParts}
            groups={groups}
            answers={answers}
            marked={marked}
            activePart={activePart}
            shownRange={paginated && activeGroups[safeIndex] ? activeGroups[safeIndex] : null}
            jumpLocked={navLocked}
            onJump={jumpToQuestion}
          />
        )}
      </div>

      {zoomed && (
        <div
          onClick={() => setZoomed(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(6,10,20,.82)", zIndex: 60, display: "grid", placeItems: "center", padding: "2rem", cursor: "zoom-out" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomed} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, background: "#fff" }} />
        </div>
      )}

      {confirming && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,10,20,.6)", zIndex: 70, display: "grid", placeItems: "center", padding: "1.5rem" }}>
          <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, padding: "1.4rem", maxWidth: 420, width: "100%" }}>
            <h2 style={{ margin: "0 0 0.6rem", fontSize: "1.1rem", fontWeight: 800 }}>Nộp bài?</h2>
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.88rem", color: P.inkSoft, lineHeight: 1.55 }}>
              Đã trả lời <strong>{answeredCount}/{allQuestions.length}</strong> câu.
            </p>
            {answeredCount < allQuestions.length && (
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.84rem", color: P.warn }}>
                Còn {allQuestions.length - answeredCount} câu chưa chọn — sẽ tính là sai.
              </p>
            )}
            {marked.size > 0 && (
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.84rem", color: P.marked }}>
                Đang đánh dấu {marked.size} câu: {[...marked].sort((a, b) => a - b).join(", ")}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: "1.1rem" }}>
              <button type="button" onClick={() => setConfirming(false)} style={{ flex: 1, padding: "0.7rem", borderRadius: 9, border: `1px solid ${P.border}`, background: "transparent", color: P.inkSoft, fontWeight: 700, fontFamily: P.sans, cursor: "pointer" }}>
                Làm tiếp
              </button>
              <button type="button" onClick={submit} style={{ flex: 1, padding: "0.7rem", borderRadius: 9, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, cursor: "pointer" }}>
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function iconBtn(P: Palette): React.CSSProperties {
  return {
    width: 34, height: 32, borderRadius: 8, cursor: "pointer",
    border: `1px solid ${P.border}`, background: "transparent",
    color: P.inkSoft, fontSize: "0.8rem", fontWeight: 700, fontFamily: P.sans,
    display: "inline-grid", placeItems: "center",
  };
}

function navBtn(P: Palette, disabled: boolean): React.CSSProperties {
  return {
    padding: "5px 14px", borderRadius: 7, fontFamily: P.sans,
    fontSize: "0.82rem", fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    background: "transparent", color: disabled ? P.muted : P.inkSoft,
    border: `1px solid ${P.border}`, opacity: disabled ? 0.5 : 1, flexShrink: 0,
  };
}

// ── Khung chính ──────────────────────────────────────────────────────────────

function MainPane({
  P, groups, part, paginated, real, config, answers, marked, onPick, onMark,
  fontScale, narrow, mobilePane, setMobilePane, audioBase, speed, setSpeed,
  onZoom, splitPct, setSplitPct,
}: {
  P: Palette;
  groups: FullTestGroup[];
  part: PartNumber;
  paginated: boolean;
  real: boolean;
  config: RunConfig;
  answers: Record<number, string>;
  marked: Set<number>;
  onPick: (q: number, l: string) => void;
  onMark: (q: number) => void;
  fontScale: number;
  narrow: boolean;
  mobilePane: "media" | "questions";
  setMobilePane: (p: "media" | "questions") => void;
  audioBase: string;
  speed: number;
  setSpeed: (s: number) => void;
  onZoom: (src: string | null) => void;
  splitPct: number;
  setSplitPct: (v: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    function move(e: MouseEvent) {
      if (!dragging.current || !boxRef.current) return;
      const r = boxRef.current.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      setSplitPct(Math.round(Math.min(75, Math.max(30, pct))));
    }
    function up() { dragging.current = false; }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [setSplitPct]);

  const questionCards = (g: FullTestGroup) =>
    g.questions.map((q) => (
      <QuestionCard
        key={q.number}
        P={P}
        q={q}
        picked={answers[q.number]}
        isMarked={marked.has(q.number)}
        onPick={onPick}
        onMark={onMark}
        fontScale={fontScale}
        reveal={config.instantFeedback && !real && Boolean(answers[q.number])}
      />
    ));

  // Part 2 / 5: danh sách dọc một cột, mỗi câu tự chứa audio của nó
  if (!paginated) {
    return (
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "1rem", background: P.bg }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {groups.map((g) => (
            <div key={g.questionStart}>
              {!real && g.audio && <AudioRow P={P} src={`${audioBase}/${g.audio}`} speed={speed} setSpeed={setSpeed} />}
              {questionCards(g)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const mediaVisible = !narrow || mobilePane === "media";
  const questionsVisible = !narrow || mobilePane === "questions";

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      {narrow && (
        <div style={{ display: "flex", gap: 6, padding: "0.5rem 0.75rem", background: P.panel, borderBottom: `1px solid ${P.border}`, flexShrink: 0 }}>
          {(["media", "questions"] as const).map((k) => {
            const on = mobilePane === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setMobilePane(k)}
                style={{ flex: 1, padding: "7px 10px", borderRadius: 8, fontFamily: P.sans, fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", background: on ? P.primary : "transparent", color: on ? P.onPrimary : P.inkSoft, border: `1px solid ${on ? P.primary : P.border}` }}
              >
                {k === "media" ? (part <= 4 ? "Nghe" : "Bài đọc") : "Câu hỏi"}
              </button>
            );
          })}
        </div>
      )}

      <div ref={boxRef} style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {mediaVisible && (
          <section style={{ flex: narrow ? 1 : `0 0 ${splitPct}%`, minWidth: 0, overflowY: "auto", padding: "1rem", background: P.bg }}>
            {groups.map((g) => (
              <MediaBlock
                key={g.questionStart}
                P={P}
                g={g}
                real={real}
                audioBase={audioBase}
                speed={speed}
                setSpeed={setSpeed}
                fontScale={fontScale}
                onZoom={onZoom}
              />
            ))}
          </section>
        )}

        {/* thanh kéo đổi tỷ lệ hai khung */}
        {!narrow && (
          <div
            onMouseDown={() => { dragging.current = true; }}
            title="Kéo để đổi tỷ lệ"
            style={{ flex: "0 0 7px", cursor: "col-resize", background: P.border, position: "relative" }}
          >
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 3, height: 34, borderRadius: 3, background: P.muted, opacity: 0.7 }} />
          </div>
        )}

        {questionsVisible && (
          <section style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "1rem", background: P.bg }}>
            {groups.map((g) => (
              <div key={g.questionStart}>{questionCards(g)}</div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function MediaBlock({
  P, g, real, audioBase, speed, setSpeed, fontScale, onZoom,
}: {
  P: Palette;
  g: FullTestGroup;
  real: boolean;
  audioBase: string;
  speed: number;
  setSpeed: (s: number) => void;
  fontScale: number;
  onZoom: (src: string | null) => void;
}) {
  return (
    <div>
      {g.intro && (
        <p style={{ fontSize: `${0.8 * fontScale}rem`, fontStyle: "italic", color: P.muted, margin: "0 0 0.7rem" }}>
          {g.intro}
        </p>
      )}

      {!real && g.audio && <AudioRow P={P} src={`${audioBase}/${g.audio}`} speed={speed} setSpeed={setSpeed} />}

      {g.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={g.image}
          alt={`Hình ${rangeLabel(g)}`}
          onClick={() => onZoom(g.image!)}
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, border: `1px solid ${P.border}`, background: "#fff", cursor: "zoom-in", marginBottom: "0.8rem" }}
        />
      )}

      {g.passages?.map((ps, i) => (
        <article
          key={i}
          style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 10, padding: "1rem 1.1rem", marginBottom: "0.8rem" }}
        >
          {(g.passages?.length ?? 0) > 1 && (
            <p style={{ fontSize: `${0.68 * fontScale}rem`, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: P.primary, margin: "0 0 0.6rem" }}>
              {ps.label}
            </p>
          )}
          <div style={{ fontSize: `${0.92 * fontScale}rem`, lineHeight: 1.72, whiteSpace: "pre-wrap" }}>
            {ps.text}
          </div>
        </article>
      ))}
    </div>
  );
}

function AudioRow({
  P, src, speed, setSpeed,
}: { P: Palette; src: string; speed: number; setSpeed: (s: number) => void }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem", flexWrap: "wrap" }}>
      <audio ref={ref} src={src} controls preload="metadata" style={{ flex: 1, minWidth: 190, height: 36 }} />
      <button
        type="button"
        onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
        title="Tốc độ phát"
        style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${P.border}`, background: "transparent", color: P.inkSoft, fontFamily: P.sans, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
      >
        {speed}×
      </button>
    </div>
  );
}

function QuestionCard({
  P, q, picked, isMarked, onPick, onMark, fontScale, reveal,
}: {
  P: Palette;
  q: FullTestQuestion;
  picked?: string;
  isMarked: boolean;
  onPick: (q: number, l: string) => void;
  onMark: (q: number) => void;
  fontScale: number;
  reveal: boolean;
}) {
  const letters = q.options ? Object.keys(q.options).sort() : ["A", "B", "C", "D"];
  const exp = q.explanation;
  // Part 1/2: đề bài và phương án chỉ có trong audio, không được hiện chữ khi
  // đang làm bài. Lúc review thì mở ra để đối chiếu với transcript.
  const showText = q.showText || reveal;

  if (q.broken) {
    return (
      <div id={`q-${q.number}`} style={{ border: `1px dashed ${P.border}`, borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "0.85rem", color: P.muted, fontSize: `${0.85 * fontScale}rem` }}>
        <strong>Câu {q.number}</strong> — đề gốc thiếu nội dung câu này nên đã bỏ qua, không tính điểm.
      </div>
    );
  }

  return (
    <div
      id={`q-${q.number}`}
      style={{ background: P.panel, border: `1px solid ${isMarked ? P.marked : P.border}`, borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "0.85rem", scrollMarginTop: 20 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: "0.6rem" }}>
        <span style={{ fontWeight: 800, fontSize: `${0.92 * fontScale}rem` }}>Câu {q.number}</span>
        <button
          type="button"
          onClick={() => onMark(q.number)}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: P.sans, fontSize: `${0.76 * fontScale}rem`, fontWeight: 700, color: isMarked ? P.marked : P.muted, display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, padding: 0 }}
        >
          {isMarked ? "🏳 Đã đánh dấu" : "⚐ Đánh dấu"}
        </button>
      </div>

      {showText && q.prompt && (
        <p style={{ margin: "0 0 0.7rem", fontSize: `${0.92 * fontScale}rem`, lineHeight: 1.55 }}>{q.prompt}</p>
      )}

      {/* Part 1/2 không hiện chữ, nhưng vẫn xếp dọc từng dòng như các part khác */}
      <div style={{ display: "grid", gap: 6 }}>
        {letters.map((L) => {
          const text = showText ? q.options?.[L] : undefined;
          const on = picked === L;
          const isAnswer = reveal && q.answer === L;
          const isWrong = reveal && on && q.answer !== L;
          const border = isAnswer ? P.ok : isWrong ? P.bad : on ? P.primary : P.border;
          return (
            <button
              key={L}
              type="button"
              onClick={() => onPick(q.number, L)}
              style={{
                display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                padding: "0.6rem 0.8rem",
                borderRadius: 8, cursor: "pointer", fontFamily: P.sans,
                background: on || isAnswer ? P.primarySoft : "transparent",
                border: `${on || isAnswer || isWrong ? 2 : 1}px solid ${border}`,
                color: P.ink, fontSize: `${0.88 * fontScale}rem`,
              }}
            >
              <span style={{ width: 25 * fontScale, height: 25 * fontScale, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 800, fontSize: `${0.78 * fontScale}rem`, background: on ? P.primary : "transparent", color: on ? P.onPrimary : P.inkSoft, border: `1px solid ${on ? P.primary : P.border}` }}>
                {L}
              </span>
              {text && <span style={{ lineHeight: 1.45 }}>{text}</span>}
              {isAnswer && <span style={{ marginLeft: "auto", color: P.ok, fontWeight: 800, fontSize: `${0.8 * fontScale}rem` }}>✓</span>}
            </button>
          );
        })}
      </div>

      {reveal && exp && (
        <div style={{ marginTop: "0.8rem", paddingTop: "0.75rem", borderTop: `1px solid ${P.borderSoft}`, fontSize: `${0.84 * fontScale}rem`, lineHeight: 1.6, display: "grid", gap: "0.5rem" }}>
          {exp.reasoning && <p style={{ margin: 0, color: P.inkSoft, whiteSpace: "pre-wrap" }}>{exp.reasoning}</p>}
          {exp.translation && <p style={{ margin: 0, color: P.muted, whiteSpace: "pre-wrap" }}>{exp.translation}</p>}
          {exp.raw && !exp.reasoning && !exp.translation && (
            <p style={{ margin: 0, color: P.inkSoft, whiteSpace: "pre-wrap" }}>{exp.raw}</p>
          )}
          {exp.glossary && exp.glossary.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 3 }}>
              {exp.glossary.map((t, i) => (
                <li key={i} style={{ color: P.inkSoft }}>
                  <strong>{t.term}</strong>
                  {t.pos && <span style={{ color: P.muted }}> ({t.pos})</span>}
                  {t.ipa && <span style={{ color: P.muted }}> /{t.ipa}/</span>}
                  {": "}{t.meaning}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sidebar tiến độ ─────────────────────────────────────────────────────────

function ProgressSidebar({
  P, partsInPlay, visibleParts, groups, answers, marked, activePart, shownRange,
  jumpLocked, onJump,
}: {
  P: Palette;
  partsInPlay: { part: PartNumber; label: string; first: number; last: number }[];
  visibleParts: { part: PartNumber }[];
  groups: FullTestGroup[];
  answers: Record<number, string>;
  marked: Set<number>;
  activePart: PartNumber;
  shownRange: FullTestGroup | null;
  jumpLocked: boolean;
  onJump: (q: number) => void;
}) {
  const total = groups.flatMap((g) => g.questions).filter((q) => !q.broken);
  const done = total.filter((q) => answers[q.number]).length;
  const pct = total.length ? Math.round((done / total.length) * 100) : 0;

  return (
    <aside style={{ flex: "0 0 236px", overflowY: "auto", background: P.panel, borderLeft: `1px solid ${P.border}`, padding: "0.9rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: "0.93rem", fontWeight: 800 }}>Tiến độ</span>
        <span style={{ fontSize: "0.79rem", color: P.muted, fontVariantNumeric: "tabular-nums" }}>
          {done}/{total.length} ({pct}%)
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: P.panelAlt, marginBottom: "1rem", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: P.primary, transition: "width .2s" }} />
      </div>

      {partsInPlay.map((p) => {
        const open = visibleParts.some((v) => v.part === p.part);
        const qs = groups.filter((g) => g.part === p.part).flatMap((g) => g.questions);
        return (
          <div key={p.part} style={{ marginBottom: "0.9rem", opacity: open ? 1 : 0.5 }}>
            <p style={{ fontSize: "0.79rem", fontWeight: 700, color: p.part === activePart ? P.primary : P.muted, margin: "0 0 0.4rem" }}>
              {p.label} ({p.first}–{p.last}){!open && " 🔒"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
              {qs.map((q) => {
                const picked = Boolean(answers[q.number]);
                const flag = marked.has(q.number);
                const clickable = open && !q.broken && !jumpLocked;
                const onScreen =
                  shownRange != null &&
                  p.part === activePart &&
                  q.number >= shownRange.questionStart &&
                  q.number <= shownRange.questionEnd;
                return (
                  <button
                    key={q.number}
                    type="button"
                    disabled={!clickable}
                    onClick={() => onJump(q.number)}
                    title={q.broken ? "Câu bị thiếu nội dung" : jumpLocked ? "Không đi lại được ở phần Listening" : undefined}
                    style={{
                      padding: "4px 0", borderRadius: 5, fontFamily: P.sans,
                      fontSize: "0.76rem", fontWeight: 700,
                      cursor: clickable ? "pointer" : "not-allowed",
                      background: q.broken ? "transparent" : picked ? P.primary : P.panelAlt,
                      color: q.broken ? P.muted : picked ? P.onPrimary : P.inkSoft,
                      border: `1px solid ${flag ? P.marked : q.broken ? P.border : picked ? P.primary : P.border}`,
                      outline: onScreen ? `2px solid ${P.primary}` : undefined,
                      outlineOffset: 1,
                      textDecoration: q.broken ? "line-through" : undefined,
                    }}
                  >
                    {q.number}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: "grid", gap: 5, fontSize: "0.76rem", color: P.muted, borderTop: `1px solid ${P.borderSoft}`, paddingTop: "0.7rem" }}>
        <Legend bg={P.primary} border={P.primary} text="Đã trả lời" />
        <Legend bg={P.panelAlt} border={P.border} text="Chưa trả lời" />
        <Legend bg={P.panelAlt} border={P.marked} text="Đã đánh dấu" />
      </div>
    </aside>
  );
}

function Legend({ bg, border, text }: { bg: string; border: string; text: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 15, height: 13, borderRadius: 4, background: bg, border: `1px solid ${border}`, flexShrink: 0 }} />
      {text}
    </span>
  );
}
