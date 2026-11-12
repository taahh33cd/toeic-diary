"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PARTS, partMeta, suggestedMinutes } from "@/lib/full-tests/parts";
import type { ExamProgress } from "@/components/shared/useAttempt";
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
const FONT_LABELS = ["A−", "A", "A+", "A++"];
const FONT_DEFAULT = 1;
const SPLIT_KEY = "fulltest:split";

/**
 * Part có media riêng theo nhóm ⇒ phân trang từng nhóm một, hai khung scroll độc lập.
 * Part 2 và 5 mỗi câu độc lập, không có gì để ghép cặp ⇒ danh sách dọc.
 */
/** Số nhóm hiển thị mỗi trang. Infinity = không chia trang, cuộn một hơi. */
function pageSize(part: PartNumber): number {
  if (part === 2) return Infinity; // 25 câu ngắn, mỗi câu một audio — cuộn nhanh hơn bấm
  if (part === 5) return 10;       // 30 câu rời, chia 3 trang cho đỡ ngợp
  return 1;                        // mỗi đoạn audio / bài đọc một trang
}

function isPaginated(part: PartNumber) {
  return Number.isFinite(pageSize(part));
}

/** Part có media riêng ⇒ chia hai khung scroll độc lập. Part 2/5 thì không. */
function hasSplit(part: PartNumber) {
  return part !== 2 && part !== 5;
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
  initialSecondsLeft,
  initialProgress,
  saveState,
  onProgress,
  realLabel = "Thi thật",
  exitHref = "/skills/full-tests",
}: {
  test: FullTest;
  config: RunConfig;
  skin: Skin;
  onToggleSkin: () => void;
  onSubmit: (answers: Record<number, string>, marked: number[]) => void;
  initialAnswers?: Record<number, string>;
  initialMarked?: number[];
  /** Làm tiếp bài dở: đồng hồ còn lại lúc lưu (null = không bấm giờ / đang ở phần nghe) */
  initialSecondsLeft?: number | null;
  /** Làm tiếp bài dở ở chế độ thi thật: đang ở đoạn audio nào */
  initialProgress?: ExamProgress;
  saveState?: "idle" | "saving" | "saved" | "error";
  onProgress?: (
    answers: Record<number, string>,
    marked: number[],
    secondsLeft: number | null,
    opts?: { progress?: ExamProgress; now?: boolean },
  ) => void;
  /** Màn luyện một part gọi chế độ này là "Thi thử" thay vì "Thi thật" */
  realLabel?: string;
  /** Nút thoát giữa bài quay về đâu */
  exitHref?: string;
}) {
  const P = PALETTE[skin];
  const real = config.mode === "real";

  const chosen = useMemo(() => new Set(config.parts), [config.parts]);
  const groups = useMemo(() => test.groups.filter((g) => chosen.has(g.part)), [test.groups, chosen]);
  const partsInPlay = useMemo(() => PARTS.filter((p) => chosen.has(p.part)), [chosen]);
  const listeningParts = useMemo(() => partsInPlay.filter((p) => p.section === "listening"), [partsInPlay]);
  const readingParts = useMemo(() => partsInPlay.filter((p) => p.section === "reading"), [partsInPlay]);
  // Thi thật: đủ Part 5-7 là 75 phút như đề thật; chọn bớt part thì bớt giờ tương ứng.
  const readingSeconds = suggestedMinutes(readingParts.map((p) => p.part)) * 60;

  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers ?? {});
  const [marked, setMarked] = useState<Set<number>>(new Set(initialMarked ?? []));

  const playlist = useMemo(() => (real ? groups.filter((g) => g.audio) : []), [real, groups]);

  // Điểm xuất phát của chế độ thi thật. Làm tiếp bài dở thì lấy vị trí đã lưu
  // trên máy này; không có (đổi máy) thì suy ra: đồng hồ Reading đã chạy ⇒ đang
  // ở Reading, còn không thì nghe tiếp từ đoạn sau câu cuối cùng đã trả lời.
  const [start] = useState<ExamProgress>(() => {
    if (!real || !playlist.length) return { stage: "reading", playIndex: 0 };
    if (initialProgress) return initialProgress;
    const resuming = initialAnswers !== undefined && (
      initialSecondsLeft != null || Object.keys(initialAnswers).length > 0
    );
    if (!resuming) return { stage: "listening", playIndex: 0 };
    if (initialSecondsLeft != null) return { stage: "reading", playIndex: playlist.length };
    let last = -1;
    playlist.forEach((g, i) => {
      if (g.questions.some((q) => initialAnswers[q.number])) last = i;
    });
    const next = last + 1;
    return next >= playlist.length
      ? { stage: "reading", playIndex: playlist.length }
      : { stage: "listening", playIndex: next };
  });

  const [stage, setStage] = useState<Stage>(start.stage);
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
  /** Màn hẹp không có sidebar ⇒ mở danh sách câu dạng ngăn kéo */
  const [navOpen, setNavOpen] = useState(false);
  const [splitPct, setSplitPct] = useState(58);

  // Đồng hồ tính theo mốc giờ thật (deadline), không đếm từng nhịp setTimeout:
  // tab bị ẩn thì trình duyệt làm chậm timer, còn mỗi lần render lại cũng không
  // được làm lệch giờ. Làm tiếp bài dở thì chạy tiếp từ số giây đã lưu.
  const [deadline, setDeadline] = useState<number | null>(() => {
    const total = initialSecondsLeft != null
      ? initialSecondsLeft
      : real
        ? start.stage === "reading" && readingParts.length ? readingSeconds : null
        : config.minutes > 0 ? config.minutes * 60 : null;
    return total == null ? null : Date.now() + total * 1000;
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [deadline]);
  const secondsLeft = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    const saved = Number(localStorage.getItem(SPLIT_KEY));
    // localStorage chỉ đọc được sau khi mount (đọc lúc khởi tạo sẽ lệch hydration)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved >= 30 && saved <= 75) setSplitPct(saved);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Nộp đúng một lần: bấm hai lần, hoặc hết giờ đúng lúc đang bấm, đều chỉ gửi một request.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const submit = useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    onSubmit(answers, [...marked]);
  }, [answers, marked, onSubmit]);

  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; }, [submit]);
  useEffect(() => {
    if (secondsLeft === 0 && config.autoSubmit) submitRef.current();
  }, [secondsLeft, config.autoSubmit]);

  // Rời trang giữa bài: hỏi lại trước khi thoát (đóng tab, tải lại, gõ địa chỉ khác).
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (submittingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // Chỉ chọn part Listening thì hết audio vẫn giữ các part đó lại, không thì
  // màn hình trắng trơn chẳng còn gì bấm ngoài nút nộp bài.
  const visibleParts = real
    ? stage === "listening"
      ? listeningParts
      : readingParts.length ? readingParts : listeningParts
    : partsInPlay;

  useEffect(() => {
    if (visibleParts.length && !visibleParts.some((p) => p.part === activePart)) {
      // Sang Reading thì part đang mở bị khoá ⇒ chuyển sang part còn mở
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivePart(visibleParts[0].part);
      setGroupIndex(0);
    }
  }, [visibleParts, activePart]);

  const activeGroups = useMemo(() => groups.filter((g) => g.part === activePart), [groups, activePart]);
  const paginated = isPaginated(activePart);
  const size = pageSize(activePart);
  const pageCount = paginated ? Math.max(1, Math.ceil(activeGroups.length / size)) : 1;
  const page = Math.min(groupIndex, pageCount - 1);
  const shownGroups = paginated
    ? activeGroups.slice(page * size, page * size + size)
    : activeGroups;

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
      setGroupIndex(Math.max(0, Math.floor(idx / pageSize(part))));
      if (!isPaginated(part) || pageSize(part) > 1) {
        requestAnimationFrame(() =>
          document.getElementById(`q-${q}`)?.scrollIntoView({ block: "center", behavior: "smooth" }),
        );
      }
    },
    [groups],
  );

  // ── Audio ──────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playIndex, setPlayIndex] = useState(Math.min(start.playIndex, Math.max(0, playlist.length - 1)));
  const [playing, setPlaying] = useState(false);
  /** Trình duyệt chặn tự phát (thường gặp trên iOS) ⇒ cần người dùng bấm lại */
  const [blocked, setBlocked] = useState(false);
  const [audioIssue, setAudioIssue] = useState<string | null>(null);
  const [gap, setGap] = useState(0);
  // Chỉ nhảy đoạn khi đoạn hiện tại đã phát xong. Không suy từ gap === 0 được:
  // lúc mới bấm bắt đầu thì gap cũng đang 0 và sẽ nhảy mất đoạn đầu.
  const [pendingNext, setPendingNext] = useState(false);

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
    // Hết thời gian trả lời ⇒ sang đoạn kế: trạng thái suy từ đồng hồ gap
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingNext(false);
    const next = playIndex + 1;
    if (next >= playlist.length) {
      setPlaying(false);
      setStage("reading");
      setDeadline(readingParts.length ? Date.now() + readingSeconds * 1000 : null);
      return;
    }
    setPlayIndex(next);
  }, [gap, real, playing, pendingNext, playIndex, playlist.length, readingParts.length, readingSeconds]);

  // đoạn đang phát quyết định nhóm đang hiển thị
  const current = playlist[playIndex];
  useEffect(() => {
    if (!real || !current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    jumpToQuestion(current.questionStart);
  }, [real, current, jumpToQuestion]);

  // play() bị từ chối vì trình duyệt chặn tự phát ⇒ hiện nút cho người dùng bấm.
  // Lỗi tải file thì để onError lo (AbortError là do đổi src giữa chừng, bỏ qua).
  function playCurrent() {
    audioRef.current?.play().then(
      () => setBlocked(false),
      (err: unknown) => {
        if ((err as { name?: string })?.name === "NotAllowedError") setBlocked(true);
      },
    );
  }
  const playRef = useRef(playCurrent);
  useEffect(() => { playRef.current = playCurrent; });

  // đổi đoạn ⇒ phát ngay; autoPlay không kích lại khi chỉ src thay đổi
  useEffect(() => {
    if (!real || !playing) return;
    playRef.current();
  }, [real, playing, playIndex]);

  // File audio lỗi: thử tải lại một lần, vẫn lỗi thì bỏ qua đoạn đó (vẫn cho
  // thời gian trả lời) — không thì playlist đứng im, không bao giờ sang Reading.
  const failures = useRef({ index: -1, count: 0 });
  function onAudioError() {
    if (!playing) return;
    const f = failures.current;
    if (f.index !== playIndex) failures.current = { index: playIndex, count: 0 };
    failures.current.count++;
    if (failures.current.count === 1) {
      setTimeout(() => {
        const el = audioRef.current;
        if (!el) return;
        el.load();
        playRef.current();
      }, 1500);
      return;
    }
    if (failures.current.count === 2) {
      const cur = playlist[playIndex];
      setAudioIssue(cur ? `Không tải được audio ${rangeLabel(cur)} nên đã bỏ qua đoạn này.` : null);
      advance();
    }
  }

  // Lưu tiến độ: mỗi khi đáp án / đánh dấu / đoạn audio đổi, định kỳ khi đồng hồ
  // chạy (để làm tiếp không bị cộng lại giờ), và gửi ngay khi ẩn tab / đóng trang.
  const latest = useRef({ answers, marked, secondsLeft, stage, playIndex });
  useEffect(() => {
    latest.current = { answers, marked, secondsLeft, stage, playIndex };
  });
  const report = useCallback((immediate?: boolean) => {
    if (submittingRef.current) return;
    const l = latest.current;
    onProgress?.(l.answers, [...l.marked], l.secondsLeft, {
      progress: real ? { stage: l.stage, playIndex: l.playIndex } : undefined,
      now: immediate,
    });
  }, [onProgress, real]);

  useEffect(() => { report(); }, [answers, marked, stage, playIndex, report]);
  useEffect(() => {
    if (deadline === null) return;
    const t = setInterval(() => report(), 20000);
    return () => clearInterval(t);
  }, [deadline, report]);
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden") report(true);
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [report]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = real ? 1 : speed;
  }, [speed, real, playIndex]);

  /** letter rỗng = bỏ chọn */
  function pick(q: number, letter: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (letter) next[q] = letter;
      else delete next[q];
      return next;
    });
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

  // Chế độ thi thật, giai đoạn Listening: được xem trước các nhóm sắp phát (như
  // lật trước tờ đề), nhưng không quay lại nhóm đã nghe qua. Sang Reading thì
  // chuyển bài đọc tự do.
  const navLocked = real && stage === "listening";
  const lockedBefore = navLocked && current ? current.questionStart : 0;

  // điều hướng nhóm: hết nhóm thì sang part kế trong nhóm part đang mở
  const partPos = visibleParts.findIndex((p) => p.part === activePart);
  const canPrev = paginated && (page > 0 || partPos > 0)
    && (!navLocked || (shownGroups[0]?.questionStart ?? 0) > lockedBefore);
  const canNext = paginated && (page < pageCount - 1 || partPos < visibleParts.length - 1);

  function prevGroup() {
    if (page > 0) return setGroupIndex(page - 1);
    const prev = visibleParts[partPos - 1];
    if (!prev) return;
    const list = groups.filter((g) => g.part === prev.part);
    const lastPage = Math.max(0, Math.ceil(list.length / pageSize(prev.part)) - 1);
    goToPart(prev.part, lastPage);
  }
  function nextGroup() {
    if (page < pageCount - 1) return setGroupIndex(page + 1);
    const nxt = visibleParts[partPos + 1];
    if (nxt) goToPart(nxt.part, 0);
  }

  // Phím ←/→ chuyển nhóm (bỏ qua khi đang gõ trong ô nhập)
  const keyNav = useRef({ canPrev, canNext, prevGroup, nextGroup });
  useEffect(() => { keyNav.current = { canPrev, canNext, prevGroup, nextGroup }; });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = keyNav.current;
      if (e.key === "ArrowLeft" && k.canPrev) k.prevGroup();
      else if (e.key === "ArrowRight" && k.canNext) k.nextGroup();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    // Phủ toàn màn hình, che cả header của site: khỏi cuộn hai lớp, khỏi lỡ tay
    // bấm link ra ngoài giữa giờ thi. Thoát bằng nút ← ở góc trái.
    <div style={{ position: "fixed", inset: 0, zIndex: 55, background: P.bg, color: P.ink, fontFamily: P.sans, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.6rem 1rem", background: P.panel, borderBottom: `1px solid ${P.border}`, flexWrap: "wrap", flexShrink: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.02rem", minWidth: 0 }}>
          <Link
            href={exitHref}
            title="Thoát — bài làm được lưu, lần sau làm tiếp"
            onClick={(e) => {
              if (!window.confirm("Thoát khỏi bài thi? Bài làm đã được lưu, lần sau vào lại sẽ làm tiếp được.")) {
                e.preventDefault();
                return;
              }
              report(true);
            }}
            style={{ ...iconBtn(P), textDecoration: "none", fontSize: "1rem" }}
          >
            ←
          </Link>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{test.title}</span>
        </span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, background: P.primarySoft, color: P.primary, border: `1px solid ${P.primary}` }}>
          {real ? realLabel : "Luyện tập"}
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

          {saveState === "error" ? (
            <span title="Bài vẫn được giữ trên máy này và sẽ tự lưu lên server khi có mạng lại"
              style={{ fontSize: "0.78rem", fontWeight: 700, color: P.bad }}>
              ⚠ Chưa lưu được
            </span>
          ) : saveState === "saving" ? (
            <span style={{ fontSize: "0.78rem", color: P.muted }}>Đang lưu…</span>
          ) : saveState === "saved" ? (
            <span style={{ fontSize: "0.78rem", color: P.ok }}>✓ Đã lưu</span>
          ) : null}
          <button type="button" onClick={onToggleSkin} title="Sáng / tối" style={iconBtn(P)}>
            {skin === "light" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            onClick={() => setFontStep((s) => (s + 1) % FONT_STEPS.length)}
            title={`Cỡ chữ ${Math.round(fontScale * 100)}%`}
            style={iconBtn(P)}
          >
            {FONT_LABELS[fontStep]}
          </button>
          {narrow && (
            <button type="button" onClick={() => setNavOpen(true)} title="Danh sách câu" style={iconBtn(P)}>
              ☰
            </button>
          )}
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
          const open = visibleParts.some((v) => v.part === p.part) && p.last >= lockedBefore;
          const qs = groups.filter((g) => g.part === p.part).flatMap((g) => g.questions).filter((q) => !q.broken);
          const got = qs.filter((q) => answers[q.number]).length;
          return (
            <button
              key={p.part}
              type="button"
              disabled={!open}
              onClick={() => (lockedBefore >= p.first && lockedBefore <= p.last
                ? jumpToQuestion(lockedBefore)
                : goToPart(p.part))}
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
            preload="none"
            onEnded={advance}
            onError={onAudioError}
            style={{ display: "none" }}
          />
          {!playing || blocked ? (
            <button
              type="button"
              onClick={() => { setPlaying(true); playCurrent(); }}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, fontSize: "0.88rem", cursor: "pointer" }}
            >
              {playing || playIndex > 0 ? `▶ Nghe tiếp từ ${current ? rangeLabel(current) : ""}` : "▶ Bắt đầu phần nghe"}
            </button>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.86rem", fontWeight: 700 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: gap > 0 ? P.warn : P.ok }} />
              {gap > 0 ? `Thời gian trả lời — còn ${gap}s` : current ? `Đang phát ${rangeLabel(current)}` : ""}
            </span>
          )}
          <span style={{ fontSize: "0.78rem", color: audioIssue ? P.warn : P.muted }}>
            {audioIssue ?? "Audio chạy liền mạch một lần — không tua, không nghe lại."}
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
            {shownGroups.length > 0 && (
              shownGroups[0].questionStart === shownGroups[shownGroups.length - 1].questionEnd
                ? `Câu ${shownGroups[0].questionStart}`
                : `Câu ${shownGroups[0].questionStart}–${shownGroups[shownGroups.length - 1].questionEnd}`
            )}
            <span style={{ color: P.muted, fontWeight: 500 }}>
              {" "}· {page + 1}/{pageCount}
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
          split={hasSplit(activePart)}
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
          lockedBefore={lockedBefore}
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
            shownRange={paginated && shownGroups.length ? {
              questionStart: shownGroups[0].questionStart,
              questionEnd: shownGroups[shownGroups.length - 1].questionEnd,
            } : null}
            lockedBefore={lockedBefore}
            onJump={jumpToQuestion}
          />
        )}
      </div>

      {narrow && navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(6,10,20,.55)", zIndex: 65, display: "flex", justifyContent: "flex-end" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(300px, 86vw)", height: "100%", display: "flex" }}>
            <ProgressSidebar
              P={P}
              fill
              partsInPlay={partsInPlay}
              visibleParts={visibleParts}
              groups={groups}
              answers={answers}
              marked={marked}
              activePart={activePart}
              shownRange={paginated && shownGroups.length ? {
                questionStart: shownGroups[0].questionStart,
                questionEnd: shownGroups[shownGroups.length - 1].questionEnd,
              } : null}
              lockedBefore={lockedBefore}
              onJump={(q) => { jumpToQuestion(q); setMobilePane("questions"); setNavOpen(false); }}
            />
          </div>
        </div>
      )}

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
              <button type="button" onClick={submit} disabled={submitting} style={{ flex: 1, padding: "0.7rem", borderRadius: 9, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Đang nộp…" : "Nộp bài"}
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
  P, groups, split, real, config, answers, marked, onPick, onMark,
  fontScale, narrow, mobilePane, setMobilePane, audioBase, speed, setSpeed,
  onZoom, lockedBefore, splitPct, setSplitPct,
}: {
  P: Palette;
  groups: FullTestGroup[];
  split: boolean;
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
  /** Thi thật đang nghe: câu trước mốc này đã qua, không chọn lại được */
  lockedBefore: number;
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
        locked={q.number < lockedBefore}
      />
    ));

  // Part 2 / 5: không có media để ghép cặp ⇒ một cột dọc
  if (!split) {
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

  // Màn hẹp: chỉ bài đọc dài (Part 6/7) mới cần tách hai tab. Ảnh và audio
  // xếp chung một cột với câu hỏi — tách tab thì audio bị gỡ khỏi trang và tắt
  // tiếng ngay khi chuyển sang xem câu hỏi.
  if (narrow && !groups.some((g) => (g.passages?.length ?? 0) > 0)) {
    return (
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "1rem", background: P.bg }}>
        {groups.map((g) => (
          <div key={g.questionStart}>
            <MediaBlock P={P} g={g} real={real} audioBase={audioBase} speed={speed} setSpeed={setSpeed} fontScale={fontScale} onZoom={onZoom} />
            {questionCards(g)}
          </div>
        ))}
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
                {k === "media" ? "Bài đọc" : "Câu hỏi"}
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
  P, q, picked, isMarked, onPick, onMark, fontScale, reveal, locked,
}: {
  P: Palette;
  q: FullTestQuestion;
  picked?: string;
  isMarked: boolean;
  onPick: (q: number, l: string) => void;
  onMark: (q: number) => void;
  fontScale: number;
  reveal: boolean;
  /** Đoạn nghe đã qua (thi thật) */
  locked: boolean;
}) {
  // Đã hiện đáp án thì không đổi được nữa, không thì điểm luyện tập vô nghĩa.
  const frozen = locked || reveal;
  const letters = q.options ? Object.keys(q.options).sort() : ["A", "B", "C", "D"];
  const exp = q.explanation;
  // Part 1/2: đề bài và phương án chỉ có trong audio, không được hiện chữ khi
  // đang làm bài. Lúc review thì mở ra để đối chiếu với transcript.
  const showText = q.showText || reveal;

  if (q.broken) {
    return (
      <div id={`q-${q.number}`} style={{ border: `1px dashed ${P.border}`, borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "0.85rem", color: P.muted, fontSize: `${0.85 * fontScale}rem` }}>
        <strong>Câu {q.number}</strong> — thiếu nội dung câu này nên đã bỏ qua, không tính điểm.
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {picked && !frozen && (
          <button
            type="button"
            onClick={() => onPick(q.number, "")}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: P.sans, fontSize: `${0.76 * fontScale}rem`, fontWeight: 700, color: P.muted, padding: 0 }}
          >
            ✕ Bỏ chọn
          </button>
        )}
        <button
          type="button"
          onClick={() => onMark(q.number)}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: P.sans, fontSize: `${0.76 * fontScale}rem`, fontWeight: 700, color: isMarked ? P.marked : P.muted, display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, padding: 0 }}
        >
          {isMarked ? "🏳 Đã đánh dấu" : "⚐ Đánh dấu"}
        </button>
        </span>
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
              disabled={frozen}
              onClick={() => onPick(q.number, L)}
              title={locked ? "Đoạn nghe này đã qua" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                padding: "0.6rem 0.8rem",
                borderRadius: 8, cursor: frozen ? "default" : "pointer", fontFamily: P.sans,
                opacity: locked && !on ? 0.6 : 1,
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
  lockedBefore, onJump, fill = false,
}: {
  P: Palette;
  partsInPlay: { part: PartNumber; label: string; first: number; last: number }[];
  visibleParts: { part: PartNumber }[];
  groups: FullTestGroup[];
  answers: Record<number, string>;
  marked: Set<number>;
  activePart: PartNumber;
  shownRange: { questionStart: number; questionEnd: number } | null;
  /** Thi thật đang nghe: câu trước mốc này đã qua */
  lockedBefore: number;
  onJump: (q: number) => void;
  /** Dùng trong ngăn kéo màn hẹp: chiếm hết chiều rộng */
  fill?: boolean;
}) {
  const total = groups.flatMap((g) => g.questions).filter((q) => !q.broken);
  const done = total.filter((q) => answers[q.number]).length;
  const pct = total.length ? Math.round((done / total.length) * 100) : 0;

  return (
    <aside style={{ flex: fill ? 1 : "0 0 236px", overflowY: "auto", background: P.panel, borderLeft: `1px solid ${P.border}`, padding: "0.9rem" }}>
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
                const past = q.number < lockedBefore;
                const clickable = open && !q.broken && !past;
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
                    title={q.broken ? "Câu bị thiếu nội dung" : past ? "Đoạn nghe này đã qua" : undefined}
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
