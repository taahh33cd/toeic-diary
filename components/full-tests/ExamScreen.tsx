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
const FONT_STEPS = [0.9, 1, 1.15, 1.3];

function mmss(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
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
  onProgress?: (answers: Record<number, string>, marked: number[], secondsLeft: number | null) => void;
}) {
  const P = PALETTE[skin];
  const real = config.mode === "real";

  const chosen = useMemo(() => new Set(config.parts), [config.parts]);
  const groups = useMemo(
    () => test.groups.filter((g) => chosen.has(g.part)),
    [test.groups, chosen],
  );
  const partsInPlay = useMemo(
    () => PARTS.filter((p) => chosen.has(p.part)),
    [chosen],
  );
  const listeningParts = partsInPlay.filter((p) => p.section === "listening");
  const readingParts = partsInPlay.filter((p) => p.section === "reading");

  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers ?? {});
  const [marked, setMarked] = useState<Set<number>>(new Set(initialMarked ?? []));
  const [stage, setStage] = useState<Stage>(
    real && listeningParts.length ? "listening" : "reading",
  );
  const [activePart, setActivePart] = useState<PartNumber>(
    (real && listeningParts.length ? listeningParts[0].part : partsInPlay[0]?.part) ?? 1,
  );
  const [fontStep, setFontStep] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [mobilePane, setMobilePane] = useState<"media" | "questions">("media");
  const [narrow, setNarrow] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [zoomed, setZoomed] = useState<string | null>(null);

  // Chế độ thi thật: Listening không đếm ngược (audio quyết định), Reading 75 phút.
  // Chế độ luyện tập: một đồng hồ theo cấu hình; 0 = không giới hạn.
  const countdownTotal = real
    ? (stage === "reading" && readingParts.length ? 75 * 60 : null)
    : (config.minutes > 0 ? config.minutes * 60 : null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(countdownTotal);

  // reset đồng hồ khi sang giai đoạn Reading của chế độ thi thật
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
    return () => mq.removeEventListener("change", on);
  }, []);

  const submit = useCallback(() => {
    onSubmit(answers, [...marked]);
  }, [answers, marked, onSubmit]);

  // đồng hồ đếm ngược
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (config.autoSubmit) submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, config.autoSubmit, submit]);

  // auto-save
  useEffect(() => {
    onProgress?.(answers, [...marked], secondsLeft);
    // secondsLeft thay đổi mỗi giây — chỉ lưu khi đáp án/đánh dấu đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, marked]);

  // Nếu chỉ chọn part Listening thì hết audio vẫn giữ các part đó lại,
  // không thì màn hình trắng trơn chẳng còn gì bấm ngoài nút nộp bài.
  const visibleParts = real
    ? stage === "listening"
      ? listeningParts
      : readingParts.length
        ? readingParts
        : listeningParts
    : partsInPlay;

  // giữ activePart luôn nằm trong nhóm part đang mở
  useEffect(() => {
    if (visibleParts.length && !visibleParts.some((p) => p.part === activePart)) {
      setActivePart(visibleParts[0].part);
    }
  }, [visibleParts, activePart]);

  const activeGroups = useMemo(
    () => groups.filter((g) => g.part === activePart),
    [groups, activePart],
  );

  // ── Audio ──────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playIndex, setPlayIndex] = useState(0); // chỉ dùng ở chế độ thi thật
  const [playing, setPlaying] = useState(false);
  const [gap, setGap] = useState(0);
  // Chỉ nhảy đoạn khi đoạn hiện tại đã phát xong. Không suy từ gap === 0 được:
  // lúc mới bấm bắt đầu thì gap cũng đang 0 và sẽ nhảy mất đoạn đầu.
  const [pendingNext, setPendingNext] = useState(false);

  // Playlist chế độ thi thật: nối 54 file rời thành chuỗi liền mạch, chèn khoảng nghỉ.
  const playlist = useMemo(
    () => (real ? groups.filter((g) => g.audio) : []),
    [real, groups],
  );

  // Hết một đoạn ⇒ mở khoảng nghỉ để trả lời (5s/câu ở P1-P2, 8s/câu ở P3-P4).
  const advance = useCallback(() => {
    const cur = playlist[playIndex];
    if (!cur) return;
    const count = cur.questionEnd - cur.questionStart + 1;
    setGap(partMeta(cur.part).gapSeconds * count);
    setPendingNext(true);
  }, [playlist, playIndex]);

  // đếm khoảng nghỉ
  useEffect(() => {
    if (!real || gap <= 0) return;
    const t = setTimeout(() => setGap((g) => g - 1), 1000);
    return () => clearTimeout(t);
  }, [real, gap]);

  // hết nghỉ ⇒ sang đoạn kế; hết playlist ⇒ khoá Listening, sang Reading
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

  // đổi đoạn ⇒ phát ngay; thuộc tính autoPlay không kích lại khi chỉ src thay đổi
  useEffect(() => {
    if (!real || !playing) return;
    const el = audioRef.current;
    if (el) el.play().catch(() => {});
  }, [real, playing, playIndex]);

  // theo dõi đoạn đang phát để tự nhảy part + cuộn tới câu
  const current = playlist[playIndex];
  useEffect(() => {
    if (!real || !current) return;
    if (current.part !== activePart) setActivePart(current.part);
    document.getElementById(`q-${current.questionStart}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [real, current, activePart]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = real ? 1 : speed;
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

  return (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.ink, fontFamily: P.sans, display: "flex", flexDirection: "column" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.6rem 1rem", background: P.panel, borderBottom: `1px solid ${P.border}`, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "0.95rem", minWidth: 0 }}>
          <span style={{ color: P.primary }}>✳</span>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{test.title}</span>
        </span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, background: P.primarySoft, color: P.primary, border: `1px solid ${P.primary}` }}>
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
            A{fontStep >= 2 ? "+" : fontStep === 0 ? "−" : ""}
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
      <nav style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", background: P.panelAlt, borderBottom: `1px solid ${P.border}`, overflowX: "auto" }}>
        {partsInPlay.map((p) => {
          const on = p.part === activePart;
          const open = visibleParts.some((v) => v.part === p.part);
          const done = groups
            .filter((g) => g.part === p.part)
            .flatMap((g) => g.questions)
            .filter((q) => !q.broken);
          const got = done.filter((q) => answers[q.number]).length;
          return (
            <button
              key={p.part}
              type="button"
              disabled={!open}
              onClick={() => { setActivePart(p.part); setMobilePane("media"); }}
              title={open ? p.labelVi : "Phần này đã khoá"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0,
                padding: "6px 13px", borderRadius: 8, fontFamily: P.sans,
                fontSize: "0.85rem", fontWeight: 700, cursor: open ? "pointer" : "not-allowed",
                background: on ? P.primary : "transparent",
                color: on ? P.onPrimary : open ? P.inkSoft : P.muted,
                border: `1px solid ${on ? P.primary : P.border}`,
                opacity: open ? 1 : 0.45,
              }}
            >
              {p.label}
              <span style={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>
                {got}/{done.length}
              </span>
              {!open && <span style={{ fontSize: "0.7rem" }}>🔒</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Thân ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <MainPane
          P={P}
          groups={activeGroups}
          part={activePart}
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
          audioRef={audioRef}
          audioBase={test.audioBase}
          playlistGroup={current}
          playing={playing}
          gap={gap}
          speed={speed}
          setSpeed={setSpeed}
          onStartPlaylist={() => { setPlaying(true); audioRef.current?.play().catch(() => {}); }}
          onAudioEnded={advance}
          onZoom={setZoomed}
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
            onJump={(part, q) => {
              setActivePart(part);
              setMobilePane("questions");
              requestAnimationFrame(() =>
                document.getElementById(`q-${q}`)?.scrollIntoView({ block: "center", behavior: "smooth" }),
              );
            }}
          />
        )}
      </div>

      {/* ── Zoom ảnh ───────────────────────────────────────────────────── */}
      {zoomed && (
        <div
          onClick={() => setZoomed(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(6,10,20,.82)", zIndex: 60, display: "grid", placeItems: "center", padding: "2rem", cursor: "zoom-out" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomed} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, background: "#fff" }} />
        </div>
      )}

      {/* ── Xác nhận nộp ───────────────────────────────────────────────── */}
      {confirming && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,10,20,.6)", zIndex: 70, display: "grid", placeItems: "center", padding: "1.5rem" }}>
          <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, padding: "1.4rem", maxWidth: 420, width: "100%", color: P.ink }}>
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
              <button
                type="button"
                onClick={() => setConfirming(false)}
                style={{ flex: 1, padding: "0.7rem", borderRadius: 9, border: `1px solid ${P.border}`, background: "transparent", color: P.inkSoft, fontWeight: 700, fontFamily: P.sans, cursor: "pointer" }}
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={submit}
                style={{ flex: 1, padding: "0.7rem", borderRadius: 9, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, cursor: "pointer" }}
              >
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
    width: 32, height: 32, borderRadius: 8, cursor: "pointer",
    border: `1px solid ${P.border}`, background: "transparent",
    color: P.inkSoft, fontSize: "0.85rem", fontFamily: P.sans,
    display: "inline-grid", placeItems: "center",
  };
}

// ── Khung chính: media/passage bên trái, câu hỏi bên phải ────────────────────

function MainPane({
  P, groups, part, real, config, answers, marked, onPick, onMark, fontScale,
  narrow, mobilePane, setMobilePane, audioRef, audioBase, playlistGroup, playing,
  gap, speed, setSpeed, onStartPlaylist, onAudioEnded, onZoom,
}: {
  P: Palette;
  groups: FullTestGroup[];
  part: PartNumber;
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
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioBase: string;
  playlistGroup?: FullTestGroup;
  playing: boolean;
  gap: number;
  speed: number;
  setSpeed: (s: number) => void;
  onStartPlaylist: () => void;
  onAudioEnded: () => void;
  onZoom: (src: string | null) => void;
}) {
  const meta = partMeta(part);
  // Part 2 và Part 5 không có gì để hiển thị bên trái
  const splitPane = part !== 2 && part !== 5;

  const mediaVisible = !narrow || mobilePane === "media";
  const questionsVisible = !narrow || mobilePane === "questions";

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      {narrow && splitPane && (
        <div style={{ display: "flex", gap: 6, padding: "0.5rem 0.75rem", background: P.panel, borderBottom: `1px solid ${P.border}` }}>
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

      {/* Chế độ thi thật: một player duy nhất cho cả section, điều khiển bị chặn */}
      {real && meta.hasAudio && (
        <div style={{ padding: "0.7rem 1rem", background: P.panelAlt, borderBottom: `1px solid ${P.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <audio
            ref={audioRef}
            src={playlistGroup?.audio ? `${audioBase}/${playlistGroup.audio}` : undefined}
            onEnded={onAudioEnded}
            style={{ display: "none" }}
          />
          {!playing ? (
            <button
              type="button"
              onClick={onStartPlaylist}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, fontSize: "0.88rem", cursor: "pointer" }}
            >
              ▶ Bắt đầu phần nghe
            </button>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.86rem", fontWeight: 700, color: P.ink }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: gap > 0 ? P.warn : P.ok }} />
              {gap > 0
                ? `Thời gian trả lời — còn ${gap}s`
                : `Đang phát câu ${playlistGroup?.questionStart}${playlistGroup && playlistGroup.questionEnd > playlistGroup.questionStart ? `–${playlistGroup.questionEnd}` : ""}`}
            </span>
          )}
          <span style={{ fontSize: "0.78rem", color: P.muted }}>
            Audio chạy liền mạch một lần — không tua, không nghe lại.
          </span>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Khung trái: ảnh / passage — cuộn độc lập */}
        {splitPane && mediaVisible && (
          <section style={{ flex: narrow ? 1 : "0 0 46%", minWidth: 0, overflowY: "auto", padding: "1rem", borderRight: narrow ? undefined : `1px solid ${P.border}`, background: P.bg }}>
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

        {/* Khung phải: câu hỏi — cuộn độc lập */}
        {questionsVisible && (
          <section style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "1rem", background: P.bg }}>
            {groups.map((g) => (
              <div key={g.questionStart}>
                {!real && !splitPane && g.audio && (
                  <AudioRow P={P} src={`${audioBase}/${g.audio}`} speed={speed} setSpeed={setSpeed} />
                )}
                {g.questions.map((q) => (
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
                ))}
              </div>
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
    <div style={{ marginBottom: "1.4rem" }}>
      {g.intro && (
        <p style={{ fontSize: `${0.78 * fontScale}rem`, fontStyle: "italic", color: P.muted, margin: "0 0 0.6rem" }}>
          {g.intro}
        </p>
      )}

      {g.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={g.image}
          alt={`Hình câu ${g.questionStart}`}
          onClick={() => onZoom(g.image!)}
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, border: `1px solid ${P.border}`, background: "#fff", cursor: "zoom-in", marginBottom: "0.7rem" }}
        />
      )}

      {!real && g.audio && (
        <AudioRow P={P} src={`${audioBase}/${g.audio}`} speed={speed} setSpeed={setSpeed} />
      )}

      {g.passages?.map((ps, i) => (
        <article
          key={i}
          style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 10, padding: "0.95rem 1.05rem", marginBottom: "0.7rem" }}
        >
          {(g.passages?.length ?? 0) > 1 && (
            <p style={{ fontSize: `${0.68 * fontScale}rem`, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: P.primary, margin: "0 0 0.55rem" }}>
              {ps.label}
            </p>
          )}
          <div style={{ fontSize: `${0.9 * fontScale}rem`, lineHeight: 1.68, whiteSpace: "pre-wrap", color: P.ink }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.8rem", flexWrap: "wrap" }}>
      <audio ref={ref} src={src} controls preload="none" style={{ flex: 1, minWidth: 200, height: 36 }} />
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
      style={{ background: P.panel, border: `1px solid ${isMarked ? P.marked : P.border}`, borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "0.85rem", scrollMarginTop: 110 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: q.prompt ? "0.6rem" : "0.5rem" }}>
        <span style={{ fontWeight: 800, fontSize: `${0.92 * fontScale}rem` }}>Câu {q.number}</span>
        <button
          type="button"
          onClick={() => onMark(q.number)}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: P.sans, fontSize: `${0.76 * fontScale}rem`, fontWeight: 700, color: isMarked ? P.marked : P.muted, display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, padding: 0 }}
        >
          {isMarked ? "🏳 Đã đánh dấu" : "⚐ Đánh dấu"}
        </button>
      </div>

      {q.prompt && (
        <p style={{ margin: "0 0 0.7rem", fontSize: `${0.92 * fontScale}rem`, lineHeight: 1.55, color: P.ink }}>
          {q.prompt}
        </p>
      )}

      <div style={{ display: "grid", gap: 6 }}>
        {letters.map((L) => {
          const text = q.options?.[L];
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
                padding: text ? "0.6rem 0.8rem" : "0.55rem 0.9rem",
                borderRadius: 8, cursor: "pointer", fontFamily: P.sans,
                background: isAnswer ? P.primarySoft : on ? P.primarySoft : "transparent",
                border: `${on || isAnswer || isWrong ? 2 : 1}px solid ${border}`,
                color: P.ink, fontSize: `${0.88 * fontScale}rem`,
              }}
            >
              <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 800, fontSize: `${0.76 * fontScale}rem`, background: on ? P.primary : "transparent", color: on ? P.onPrimary : P.inkSoft, border: `1px solid ${on ? P.primary : P.border}` }}>
                {L}
              </span>
              {text && <span style={{ lineHeight: 1.45 }}>{text}</span>}
              {isAnswer && <span style={{ marginLeft: "auto", color: P.ok, fontWeight: 800, fontSize: "0.8rem" }}>✓</span>}
            </button>
          );
        })}
      </div>

      {reveal && exp && (
        <div style={{ marginTop: "0.8rem", paddingTop: "0.75rem", borderTop: `1px solid ${P.borderSoft}`, fontSize: `${0.84 * fontScale}rem`, lineHeight: 1.6, display: "grid", gap: "0.5rem" }}>
          {exp.reasoning && <p style={{ margin: 0, color: P.inkSoft, whiteSpace: "pre-wrap" }}>{exp.reasoning}</p>}
          {exp.translation && (
            <p style={{ margin: 0, color: P.muted, whiteSpace: "pre-wrap" }}>{exp.translation}</p>
          )}
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
  P, partsInPlay, visibleParts, groups, answers, marked, activePart, onJump,
}: {
  P: Palette;
  partsInPlay: { part: PartNumber; label: string; first: number; last: number }[];
  visibleParts: { part: PartNumber }[];
  groups: FullTestGroup[];
  answers: Record<number, string>;
  marked: Set<number>;
  activePart: PartNumber;
  onJump: (part: PartNumber, q: number) => void;
}) {
  const total = groups.flatMap((g) => g.questions).filter((q) => !q.broken);
  const done = total.filter((q) => answers[q.number]).length;
  const pct = total.length ? Math.round((done / total.length) * 100) : 0;

  return (
    <aside style={{ flex: "0 0 232px", overflowY: "auto", background: P.panel, borderLeft: `1px solid ${P.border}`, padding: "0.9rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: "0.86rem", fontWeight: 800 }}>Tiến độ</span>
        <span style={{ fontSize: "0.74rem", color: P.muted, fontVariantNumeric: "tabular-nums" }}>
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
            <p style={{ fontSize: "0.74rem", fontWeight: 700, color: p.part === activePart ? P.primary : P.muted, margin: "0 0 0.4rem" }}>
              {p.label} ({p.first}–{p.last}){!open && " 🔒"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
              {qs.map((q) => {
                const picked = Boolean(answers[q.number]);
                const flag = marked.has(q.number);
                return (
                  <button
                    key={q.number}
                    type="button"
                    disabled={!open || q.broken}
                    onClick={() => onJump(p.part, q.number)}
                    title={q.broken ? "Câu bị thiếu nội dung" : undefined}
                    style={{
                      padding: "4px 0", borderRadius: 5, fontFamily: P.sans,
                      fontSize: "0.7rem", fontWeight: 700,
                      cursor: open && !q.broken ? "pointer" : "not-allowed",
                      background: q.broken ? "transparent" : picked ? P.primary : P.panelAlt,
                      color: q.broken ? P.muted : picked ? P.onPrimary : P.inkSoft,
                      border: `1px solid ${flag ? P.marked : q.broken ? P.border : picked ? P.primary : P.border}`,
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

      <div style={{ display: "grid", gap: 5, fontSize: "0.7rem", color: P.muted, borderTop: `1px solid ${P.borderSoft}`, paddingTop: "0.7rem" }}>
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
