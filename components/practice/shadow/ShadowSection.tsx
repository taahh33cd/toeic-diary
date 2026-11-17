"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Ear, Headphones, Maximize2, Mic, Minimize2,
  Play, Repeat, Square, Star, Volume2, Waves, Zap, CheckCircle2,
} from "lucide-react";
import { analyzeProsody, splitDisplayWords } from "@/lib/shadow/prosody";
import { pickStarred } from "@/lib/shadow/stars";
import { activeWordIndex, referenceSeconds, usableTimings, type WordTiming } from "@/lib/shadow/timing";
import { analyzeBlob, passesVoiceCheck, type VoiceAnalysis } from "@/lib/shadow/voice";
import { buildSegmentWindows, type SegmentWindow } from "@/lib/practice/segment";
import { IntonationText } from "./IntonationText";
import { useRecorder } from "./useRecorder";

export interface ShadowSentence {
  id: string;
  content: string;
  startTime: number;
  endTime: number;
  speaker: string | null;
  optionLabel?: string | null;
  /** Mốc từng từ theo `splitDisplayWords(content)` — có từ giai đoạn 2. */
  wordTimings?: WordTiming[] | null;
}

export interface ShadowInput {
  audioUrl: string;
  /** Độ dài file (giây); bỏ trống thì đọc từ thẻ audio khi tải xong. */
  audioDuration?: number;
  partNumber: number;
  sentences: ShadowSentence[];
  correctOption?: string | null;
  /** Số lỗi dictation theo id câu, để chọn câu ⭐. */
  errorsBySentence?: Record<string, number>;
}

export const SHADOW_SECTION_ID = "shadow-practice";

type Mode = "sentence" | "all";
type Style = "repeat" | "overlap";
type Phase = "idle" | "playing" | "recording" | "analyzing" | "user";

interface Take {
  url: string;
  analysis: VoiceAnalysis | null;
  ok: boolean;
  refSec: number;
}

const RATES = [1, 0.75, 0.5] as const;
const STYLE_KEY = "shadow-style";

/** Câu ⭐ và số phút ước tính cho CTA "Shadow 3 câu (~2 phút)". */
export function shadowPlan(input: ShadowInput) {
  const stars = pickStarred(input.sentences, {
    errorsBySentence: input.errorsBySentence,
    correctOption: input.correctOption,
  });
  const windows = buildSegmentWindows(input.sentences, input.audioDuration ?? 0);
  const secs = input.sentences.reduce((sum, s, i) => {
    if (!stars.includes(s.id)) return sum;
    const w = windows[i];
    const len = Number.isFinite(w.end) ? w.end - w.start : 4;
    return sum + len * 4 + 6; // nghe + ghi + nghe lại + thao tác
  }, 0);
  return { stars, minutes: Math.max(1, Math.round(secs / 60)) };
}

function speakerTag(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  if (s === "NARRATOR") return null;
  if (s.startsWith("WOMAN") || s.startsWith("W")) return "W" + (s.includes("-") ? " · " + s.split("-")[1] : "");
  if (s.startsWith("MAN") || s.startsWith("M")) return "M" + (s.includes("-") ? " · " + s.split("-")[1] : "");
  return raw;
}

const SPEAKER_COLORS = {
  W: "bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/30",
  M: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  /** Người nói thứ hai cùng giới, hoặc không rõ giới. */
  other: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

function optionTag(part: number, s: ShadowSentence, i: number): string | null {
  if (s.optionLabel) return `(${s.optionLabel})`;
  if (part === 1) return `(${"ABCD"[i] ?? "?"})`;
  if (part === 2) return i === 0 ? "Câu hỏi" : `(${"ABC"[i - 1] ?? "?"})`;
  return null;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ShadowSection(input: ShadowInput) {
  const { audioUrl, partNumber, sentences } = input;
  const n = sentences.length;
  const [loadedDuration, setLoadedDuration] = useState(0);
  const audioDuration = input.audioDuration || loadedDuration;

  const windows = useMemo<SegmentWindow[]>(() => buildSegmentWindows(sentences, audioDuration), [sentences, audioDuration]);
  const prosodies = useMemo(() => sentences.map((s) => analyzeProsody(s.content)), [sentences]);
  const timings = useMemo(
    () => sentences.map((s) => usableTimings(s.wordTimings, splitDisplayWords(s.content).length)),
    [sentences]
  );
  const { stars } = useMemo(() => shadowPlan(input), [input]);
  const starSet = useMemo(() => new Set(stars), [stars]);
  const speakerColor = useMemo(() => {
    const map = new Map<string, string>();
    const used = new Set<string>();
    sentences.forEach((s) => {
      if (!s.speaker || map.has(s.speaker)) return;
      const g = speakerTag(s.speaker)?.[0];
      const key = (g === "W" || g === "M") && !used.has(g) ? g : "other";
      used.add(key);
      map.set(s.speaker, SPEAKER_COLORS[key as keyof typeof SPEAKER_COLORS]);
    });
    return (sp: string | null) => (sp ? map.get(sp) ?? "" : "");
  }, [sentences]);

  const [mode, setMode] = useState<Mode>("sentence");
  const [style, setStyleState] = useState<Style>("repeat");
  const [idx, setIdx] = useState(() => {
    const first = sentences.findIndex((s) => starSet.has(s.id));
    return first >= 0 ? first : 0;
  });
  const [showCurve, setShowCurve] = useState(true);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const [autoRun, setAutoRun] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [playing, setPlaying] = useState<{ sentence: number; word: number }>({ sentence: -1, word: -1 });
  const [takes, setTakes] = useState<Record<number, Take>>({});
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const [fullscreen, setFullscreen] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const runRef = useRef(0); // tăng mỗi lần dừng: mọi chuỗi async cũ tự hủy
  const rafRef = useRef(0);
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const rec = useRecorder();
  const micBlocked = rec.state === "denied" || rec.state === "unsupported";

  useEffect(() => {
    try {
      const v = localStorage.getItem(STYLE_KEY);
      if (v === "repeat" || v === "overlap") setStyleState(v);
    } catch {}
  }, []);
  const setStyle = (s: Style) => {
    setStyleState(s);
    try { localStorage.setItem(STYLE_KEY, s); } catch {}
  };

  // ── Dừng mọi thứ ────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    runRef.current++;
    cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    userAudioRef.current?.pause();
    rec.stop();
    setPlaying({ sentence: -1, word: -1 });
    setPhase("idle");
  }, [rec]);

  useEffect(() => () => { runRef.current++; cancelAnimationFrame(rafRef.current); audioRef.current?.pause(); userAudioRef.current?.pause(); }, []);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);

  // ── Phát audio gốc ──────────────────────────────────────────────────────────
  /** Phát một câu; true nếu phát hết, false nếu bị dừng giữa chừng. */
  const playSentence = useCallback((i: number, run: number): Promise<boolean> => {
    const a = audioRef.current;
    const w = windows[i];
    if (!a || !w) return Promise.resolve(false);
    return new Promise((resolve) => {
      a.currentTime = w.start;
      a.playbackRate = rateRef.current;
      setPhase("playing");
      let lastWord = -2;
      const finish = (ok: boolean) => {
        cancelAnimationFrame(rafRef.current);
        a.removeEventListener("ended", onEnded);
        setPlaying({ sentence: -1, word: -1 });
        resolve(ok);
      };
      const onEnded = () => finish(runRef.current === run);
      a.addEventListener("ended", onEnded);
      const tick = () => {
        if (runRef.current !== run) { finish(false); return; }
        const t = a.currentTime;
        if (t >= w.end) { a.pause(); finish(true); return; }
        const tm = timings[i];
        const word = tm ? activeWordIndex(tm, t) : -1;
        if (word !== lastWord) { lastWord = word; setPlaying({ sentence: i, word }); }
        rafRef.current = requestAnimationFrame(tick);
      };
      a.play().then(() => { rafRef.current = requestAnimationFrame(tick); }).catch(() => finish(false));
    });
  }, [windows, timings]);

  const takesRef = useRef(takes);
  takesRef.current = takes;
  const playUser = useCallback((i: number, run: number, fresh?: Take): Promise<boolean> => {
    const take = fresh ?? takesRef.current[i];
    if (!take) return Promise.resolve(false);
    userAudioRef.current?.pause();
    const u = new Audio(take.url);
    userAudioRef.current = u;
    setPhase("user");
    return new Promise((resolve) => {
      const done = (ok: boolean) => { if (runRef.current === run) setPhase("idle"); resolve(ok); };
      u.onended = () => done(true);
      u.onerror = () => done(false);
      u.play().catch(() => done(false));
    });
  }, []);

  // ── Ghi âm một câu ──────────────────────────────────────────────────────────
  const practice = useCallback(async (i: number, run: number): Promise<Take | null> => {
    const refSec = referenceSeconds(windows[i], timings[i]);
    let recording;
    if (style === "repeat") {
      const heard = await playSentence(i, run);
      if (!heard || runRef.current !== run) return null;
      setPhase("recording");
      recording = await rec.start({ maxSec: refSec * 2 + 3, stopOnSilenceMs: 1100, noSpeechTimeoutSec: 5 });
    } else {
      setPhase("recording");
      const recP = rec.start({ maxSec: refSec * 3 + 5 });
      await wait(150); // để mic kịp mở trước tiếng đầu câu
      const heard = await playSentence(i, run);
      if (heard) await wait(600);
      rec.stop();
      recording = await recP;
    }
    if (!recording || runRef.current !== run) { if (runRef.current === run) setPhase("idle"); return null; }
    setPhase("analyzing");
    const analysis = await analyzeBlob(recording.blob);
    const ok = analysis ? passesVoiceCheck(analysis, refSec) : recording.durationSec >= refSec * 0.5;
    const take: Take = { url: recording.url, analysis, ok, refSec };
    setTakes((t) => ({ ...t, [i]: take }));
    if (ok) setDone((d) => new Set(d).add(i));
    if (runRef.current === run) setPhase("idle");
    return take;
  }, [style, windows, timings, playSentence, rec]);

  // ── Hành động của nút ───────────────────────────────────────────────────────
  const onListen = (i = idx) => { stopAll(); const run = runRef.current; playSentence(i, run).then(() => { if (runRef.current === run) setPhase("idle"); }); };
  const onPractice = (i = idx) => { stopAll(); practice(i, runRef.current); };
  const onPlayUser = (i = idx) => { stopAll(); playUser(i, runRef.current); };
  const onCompare = async (i = idx) => {
    stopAll();
    const run = runRef.current;
    if (await playSentence(i, run)) { await wait(300); if (runRef.current === run) await playUser(i, run); }
    if (runRef.current === run) setPhase("idle");
  };
  const go = (i: number) => { stopAll(); setIdx(Math.max(0, Math.min(n - 1, i))); };

  const onPlayAll = () => {
    stopAll();
    const run = runRef.current;
    const a = audioRef.current;
    if (!a || !n) return;
    a.currentTime = windows[0].start;
    a.playbackRate = rateRef.current;
    setPhase("playing");
    let last = { sentence: -2, word: -2 };
    const lastEnd = windows[n - 1].end;
    const end = () => { cancelAnimationFrame(rafRef.current); a.pause(); if (runRef.current === run) { setPlaying({ sentence: -1, word: -1 }); setPhase("idle"); } };
    a.onended = end;
    const tick = () => {
      if (runRef.current !== run) return;
      const t = a.currentTime;
      if (Number.isFinite(lastEnd) && t >= lastEnd) { end(); return; }
      let s = -1;
      for (let k = 0; k < n; k++) if (windows[k].start <= t) s = k;
      const tm = s >= 0 ? timings[s] : null;
      const word = tm ? activeWordIndex(tm, t) : -1;
      if (s !== last.sentence || word !== last.word) {
        if (s !== last.sentence && s >= 0) {
          document.getElementById(`shadow-row-${s}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        last = { sentence: s, word };
        setPlaying({ sentence: s, word });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    a.play().then(() => { rafRef.current = requestAnimationFrame(tick); }).catch(end);
  };

  // ── Tự chạy: nghe → ghi → nghe lại → câu tiếp ───────────────────────────────
  useEffect(() => {
    if (!autoRun || mode !== "sentence") return;
    stopAll();
    const runs = runRef;
    const run = runs.current;
    (async () => {
      for (let i = idx; i < n; i++) {
        if (runRef.current !== run) return;
        setIdx(i);
        const take = await practice(i, run);
        if (!take || runRef.current !== run) break;
        await wait(250);
        await playUser(i, run, take);
        await wait(500);
      }
      if (runRef.current === run) { setAutoRun(false); setPhase("idle"); }
    })();
    return () => { runs.current++; };
    // Chỉ chạy lại khi bật/tắt Tự chạy hoặc đổi chế độ; idx đổi bên trong vòng lặp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, mode]);

  useEffect(() => { if (micBlocked) setAutoRun(false); }, [micBlocked]);

  // ── Phím tắt: chỉ khi khu Shadow đang trên màn hình ─────────────────────────
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio > 0.35), { threshold: [0, 0.35, 0.6] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const keyActions = useRef({ onListen, onPractice, onPlayUser, go, stopAll, phase, idx, mode, onPlayAll });
  keyActions.current = { onListen, onPractice, onPlayUser, go, stopAll, phase, idx, mode, onPlayAll };
  useEffect(() => {
    if (!(visible || fullscreen)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      const k = keyActions.current;
      if (e.code === "Space") {
        e.preventDefault();
        if (k.phase !== "idle") k.stopAll();
        else if (k.mode === "all") k.onPlayAll();
        else k.onListen();
      } else if (e.key === "r" || e.key === "R") {
        if (k.mode !== "sentence") return;
        e.preventDefault();
        if (k.phase === "recording") rec.stop(); else k.onPractice();
      } else if (e.key === "p" || e.key === "P") {
        if (k.mode !== "sentence") return;
        e.preventDefault();
        k.onPlayUser();
      } else if (e.key === "ArrowRight" && k.mode === "sentence") { e.preventDefault(); k.go(k.idx + 1); }
      else if (e.key === "ArrowLeft" && k.mode === "sentence") { e.preventDefault(); k.go(k.idx - 1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, fullscreen, rec]);

  // ── Toàn màn hình ───────────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === sectionRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else sectionRef.current?.requestFullscreen?.().catch(() => {});
  };

  // ── Hiển thị ────────────────────────────────────────────────────────────────
  const starsDone = stars.filter((id) => done.has(sentences.findIndex((s) => s.id === id))).length;
  const lessonDone = stars.length > 0 && starsDone === stars.length;
  const cur = sentences[idx];
  const take = takes[idx];
  const busy = phase !== "idle";
  const noWordTiming = timings.every((t) => !t);
  const keep = (e: React.MouseEvent) => e.preventDefault(); // nút không giữ focus → Space không bấm lại nút

  const btn = "inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold px-3 sm:px-3.5 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const seg = (on: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${on ? "bg-[var(--practice-accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--practice-accent)]"}`;

  return (
    <section
      id={SHADOW_SECTION_ID}
      ref={sectionRef}
      className={`scroll-mt-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:p-6 flex flex-col gap-4 ${fullscreen ? "overflow-y-auto bg-[var(--bg-primary)] !rounded-none p-6 md:p-10" : ""}`}
      aria-label="Luyện đọc theo (Shadow)"
    >
      <audio ref={audioRef} src={audioUrl} preload="auto" onLoadedMetadata={(e) => setLoadedDuration(e.currentTarget.duration || 0)} />

      {/* Tiêu đề + tiến độ */}
      <header className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <span className="w-9 h-9 rounded-xl bg-[var(--practice-accent)]/15 text-[var(--practice-accent)] flex items-center justify-center flex-shrink-0"><Mic size={18} /></span>
          <div className="min-w-0">
            <h2 className="font-bold text-[var(--text-primary)] leading-tight">Luyện đọc theo (Shadow)</h2>
            <p className="text-xs text-[var(--text-muted)]">Nghe câu gốc, bắt chước ngữ điệu rồi so với giọng bạn</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border tabular-nums ${lessonDone ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
            {lessonDone ? "✓ Xong bài · " : "⭐ "}{starsDone}/{stars.length} câu gợi ý · {done.size}/{n} câu
          </span>
          <button onMouseDown={keep} onClick={toggleFullscreen} className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--practice-accent)]" aria-label={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}>
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* Tùy chọn */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]/50" role="group" aria-label="Chế độ">
          <button onMouseDown={keep} onClick={() => { stopAll(); setAutoRun(false); setMode("sentence"); }} className={seg(mode === "sentence")}>Từng câu</button>
          <button onMouseDown={keep} onClick={() => { stopAll(); setAutoRun(false); setMode("all"); }} className={seg(mode === "all")}>Cả bài</button>
        </div>
        {mode === "sentence" && (
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]/50" role="group" aria-label="Kiểu ghi âm">
            <button onMouseDown={keep} onClick={() => setStyle("repeat")} className={seg(style === "repeat")} title="Nghe hết câu gốc rồi nói lại">
              <Repeat size={12} className="inline -mt-0.5 mr-1" />Nghe rồi lặp lại
            </button>
            <button onMouseDown={keep} onClick={() => setStyle("overlap")} className={seg(style === "overlap")} title="Nói cùng lúc với audio gốc">
              <Headphones size={12} className="inline -mt-0.5 mr-1" />Đọc đồng thời
            </button>
          </div>
        )}
        <button onMouseDown={keep} onClick={() => setShowCurve((v) => !v)} aria-pressed={showCurve}
          className={`${seg(showCurve)} border border-[var(--border)]/50`}>
          <Waves size={12} className="inline -mt-0.5 mr-1" />Ngữ điệu
        </button>
        {mode === "sentence" && (
          <button onMouseDown={keep} disabled={micBlocked} onClick={() => setAutoRun((v) => !v)} aria-pressed={autoRun}
            className={`${seg(autoRun)} border border-[var(--border)]/50 disabled:opacity-40`} title="Tự đi vòng nghe → ghi → nghe lại → câu tiếp">
            <Zap size={12} className="inline -mt-0.5 mr-1" />{autoRun ? "Đang tự chạy" : "Tự chạy"}
          </button>
        )}
      </div>

      {showCurve && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-extrabold text-[var(--text-primary)]">NHẤN MẠNH</span>
          <span className="font-semibold text-[var(--text-primary)]">nhấn nhẹ</span>
          <span className="font-medium text-[var(--text-muted)]">đọc lướt</span>
          <span className="text-[var(--text-muted)] italic">Đỉnh sóng đỏ = từ được nhấn · đáy sóng = từ chức năng đọc nhẹ{takes[idx]?.analysis ? " · nét đứt xanh = giọng bạn" : ""}</span>
        </p>
      )}

      {style === "overlap" && mode === "sentence" && (
        <p className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <Headphones size={14} /> Đeo tai nghe để tiếng audio gốc không lọt vào bản ghi của bạn.
        </p>
      )}

      {micBlocked && (
        <p className="text-xs rounded-lg px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
          {rec.state === "denied"
            ? "Bạn chưa cho phép dùng micro nên chưa ghi âm được. Bấm biểu tượng ổ khóa cạnh thanh địa chỉ → Micro → Cho phép, rồi tải lại trang. Bạn vẫn nghe và đọc theo được."
            : "Trình duyệt này không hỗ trợ ghi âm. Bạn vẫn nghe và đọc theo được; hãy dùng Chrome, Edge hoặc Safari bản mới để ghi âm."}
        </p>
      )}

      {mode === "sentence" && cur ? (
        <>
          {/* Điều hướng câu */}
          <div className="flex items-center justify-center gap-3">
            <button onMouseDown={keep} onClick={() => go(idx - 1)} disabled={idx === 0} className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] disabled:opacity-30" aria-label="Câu trước"><ChevronLeft size={18} /></button>
            <span className="font-bold text-[var(--practice-accent)] tabular-nums">Câu {idx + 1}/{n}</span>
            <button onMouseDown={keep} onClick={() => go(idx + 1)} disabled={idx === n - 1} className="p-2.5 rounded-xl bg-[var(--practice-accent)] text-white disabled:opacity-30" aria-label="Câu sau"><ChevronRight size={18} /></button>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5" aria-label="Danh sách câu">
            {sentences.map((s, i) => (
              <button key={s.id} onMouseDown={keep} onClick={() => go(i)}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold tabular-nums border transition-all ${
                  i === idx ? "border-[var(--practice-accent)] text-[var(--practice-accent)] bg-[var(--practice-accent)]/10"
                  : done.has(i) ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                  : "border-[var(--border)] text-[var(--text-muted)]"}`}
                aria-label={`Câu ${i + 1}${starSet.has(s.id) ? ", gợi ý" : ""}${done.has(i) ? ", đã shadow" : ""}`}>
                {done.has(i) ? "✓" : i + 1}{starSet.has(s.id) && <Star size={10} className="inline ml-0.5 -mt-0.5 fill-amber-400 text-amber-400" />}
              </button>
            ))}
          </div>

          {/* Câu đang luyện */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 md:px-8 pt-10 pb-6">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs">
              {optionTag(partNumber, cur, idx) && <span className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] font-semibold text-[var(--text-secondary)]">{optionTag(partNumber, cur, idx)}</span>}
              {speakerTag(cur.speaker) && <span className={`px-2 py-0.5 rounded-md border font-semibold ${speakerColor(cur.speaker)}`}>{speakerTag(cur.speaker)}</span>}
              {starSet.has(cur.id) && <span className="px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-700 dark:text-amber-300 font-semibold">⭐ Nên luyện</span>}
            </div>
            <IntonationText
              prosody={prosodies[idx]}
              activeIndex={playing.sentence === idx ? playing.word : -1}
              wholeActive={playing.sentence === idx && !timings[idx]}
              showCurve={showCurve}
              userPitch={take?.analysis && take.analysis.pitch.length > 2 ? { points: take.analysis.pitch, start: take.analysis.speechStart, end: take.analysis.speechEnd } : null}
            />
          </div>

          {/* Trạng thái ghi âm */}
          <div className="min-h-6 text-sm text-center" aria-live="polite">
            {phase === "recording" && (
              <span className="inline-flex items-center gap-2 text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                {style === "repeat" ? "Đang ghi — nói lại câu vừa nghe" : "Đang ghi — nói cùng audio"}
                <span className="w-20 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden"><span className="block h-full bg-rose-500 transition-[width] duration-75" style={{ width: `${rec.level * 100}%` }} /></span>
              </span>
            )}
            {phase === "analyzing" && <span className="text-[var(--text-muted)]">Đang xem bản ghi…</span>}
            {phase === "idle" && take && (take.ok
              ? <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300 font-semibold"><CheckCircle2 size={15} /> Đã shadow câu này. Bấm So sánh để nghe câu gốc rồi giọng bạn.</span>
              : <span className="text-amber-600 dark:text-amber-300">Chưa nghe rõ tiếng nói ({(take.analysis?.voicedSec ?? 0).toFixed(1)}s / cần {(take.refSec * 0.5).toFixed(1)}s). Nói to và rõ hơn rồi thử lại.</span>)}
          </div>

          {/* Nút điều khiển — dính đáy màn hình trên mobile */}
          <div className="sticky md:static bottom-0 z-10 -mx-4 md:mx-0 px-4 md:px-0 py-3 md:py-0 bg-[var(--bg-elevated)]/95 md:bg-transparent backdrop-blur md:backdrop-blur-none border-t md:border-0 border-[var(--border)] pb-[max(12px,env(safe-area-inset-bottom))] md:pb-0">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <button onMouseDown={keep} onClick={() => (busy ? stopAll() : onListen())} className={`${btn} bg-[var(--practice-accent)] text-white`}>
                {phase === "playing" ? <Square size={15} /> : <Volume2 size={16} />}{phase === "playing" ? "Dừng" : "Nghe"}
              </button>
              <button onMouseDown={keep} disabled={micBlocked || (busy && phase !== "recording")}
                onClick={() => (phase === "recording" ? rec.stop() : onPractice())}
                className={`${btn} ${phase === "recording" ? "bg-rose-600" : "bg-rose-500"} text-white`}>
                {phase === "recording" ? <Square size={15} /> : <Mic size={16} />}
                {phase === "recording" ? "Dừng ghi" : style === "repeat"
                  ? <><span className="sm:hidden">Nói lại</span><span className="hidden sm:inline">Nghe &amp; nói lại</span></>
                  : "Đọc cùng"}
              </button>
              <button onMouseDown={keep} disabled={!take || busy} onClick={() => onPlayUser()} aria-label="Nghe giọng bạn" className={`${btn} border border-[var(--border)] text-[var(--text-primary)]`}>
                <Play size={14} /><span className="hidden sm:inline">Giọng bạn</span>
              </button>
              <button onMouseDown={keep} disabled={!take || busy} onClick={() => onCompare()} aria-label="So sánh" className={`${btn} border border-[var(--border)] text-[var(--text-primary)]`}>
                <Ear size={15} /><span className="hidden sm:inline">So sánh</span>
              </button>
              <button onMouseDown={keep} onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])} aria-label={`Tốc độ ${rate}×`}
                className={`${btn} sm:hidden border border-[var(--border)] font-mono text-[var(--text-primary)]`}>{rate}×</button>
              <div className="hidden sm:flex items-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]/50" role="group" aria-label="Tốc độ">
                {RATES.map((r) => (
                  <button key={r} onMouseDown={keep} onClick={() => setRate(r)} className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg ${rate === r ? "bg-[var(--practice-accent)] text-white" : "text-[var(--text-secondary)]"}`}>{r}×</button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Cả bài */
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button onMouseDown={keep} onClick={() => (busy ? stopAll() : onPlayAll())} className={`${btn} bg-[var(--practice-accent)] text-white`}>
              {busy ? <Square size={15} /> : <Play size={15} />}{busy ? "Dừng" : "Nghe cả bài"}
            </button>
            <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]/50" role="group" aria-label="Tốc độ">
              {RATES.map((r) => (
                <button key={r} onMouseDown={keep} onClick={() => setRate(r)} className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg ${rate === r ? "bg-[var(--practice-accent)] text-white" : "text-[var(--text-secondary)]"}`}>{r}×</button>
              ))}
            </div>
            <span className="text-xs text-[var(--text-muted)]">Đọc theo khi audio chạy. Muốn ghi âm, chuyển sang Từng câu.</span>
          </div>
          <div className="flex flex-col gap-2">
            {sentences.map((s, i) => (
              <div key={s.id} id={`shadow-row-${i}`}
                className={`rounded-xl px-3 md:px-5 pt-6 pb-2 border transition-colors ${playing.sentence === i ? "border-[var(--practice-accent)] bg-[var(--practice-accent)]/5" : "border-transparent"}`}>
                <div className="flex items-center gap-2 text-[11px] mb-0.5">
                  {optionTag(partNumber, s, i) && <span className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] font-semibold text-[var(--text-secondary)]">{optionTag(partNumber, s, i)}</span>}
                  {speakerTag(s.speaker) && <span className={`px-1.5 py-0.5 rounded border font-semibold ${speakerColor(s.speaker)}`}>{speakerTag(s.speaker)}</span>}
                </div>
                <IntonationText
                  size="md"
                  prosody={prosodies[i]}
                  activeIndex={playing.sentence === i ? playing.word : -1}
                  wholeActive={playing.sentence === i && !timings[i]}
                  showCurve={showCurve}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Phím tắt */}
      <div className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)] border-t border-[var(--border)]/60 pt-3">
        {[["Space", mode === "all" ? "nghe cả bài / dừng" : "nghe / dừng"], ...(mode === "sentence" ? [["R", "ghi / dừng ghi"], ["P", "nghe giọng bạn"], ["← →", "câu trước / sau"]] : [])].map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] font-mono font-semibold text-[var(--text-secondary)]">{k}</kbd>{l}
          </span>
        ))}
        {noWordTiming && <span className="ml-auto italic">Bài này chưa có mốc từng từ nên chỉ làm nổi cả câu.</span>}
      </div>
    </section>
  );
}
