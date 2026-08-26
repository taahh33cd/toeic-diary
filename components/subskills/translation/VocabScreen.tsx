"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  List,
  Layers,
  ListChecks,
  Keyboard,
  Check,
  X,
  RotateCcw,
  Play,
} from "lucide-react";
import type {
  VocabEntry,
  VocabProgressMap,
  TransLevelSlug,
} from "@/lib/subskills/translation/types";
import { VOCAB_KIND_LABELS, vocabKey } from "@/lib/subskills/translation/types";
import { FS, CONTAINER, PAD_X, FILL_SCREEN } from "@/components/grammar/scale";
import { CONTAINER_MAX } from "@/lib/ui/scale";

const GREEN = "#16a34a";
const RED = "#ef4444";

type Mode = "list" | "flashcard" | "quiz" | "fill";

const MODES: { id: Mode; label: string; icon: typeof List }[] = [
  { id: "list", label: "Danh sách", icon: List },
  { id: "flashcard", label: "Flashcard", icon: Layers },
  { id: "quiz", label: "Trắc nghiệm", icon: ListChecks },
  { id: "fill", label: "Điền từ", icon: Keyboard },
];

interface Props {
  entries: VocabEntry[];
  topicSlug: string;
  topicName: string;
  levelSlug: TransLevelSlug;
  levelName: string;
  initialProgress: VocabProgressMap;
  /** Số câu của bài — chỉ dùng cho nhãn nút "Bắt đầu làm bài" */
  questionCount?: number;
  /** Bỏ trống khi dùng ở màn ôn tập độc lập (không có bài nào để vào) */
  onStart?: () => void;
  heading?: string;
  subheading?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** So khớp câu trả lời gõ tay: bỏ hoa/thường, dấu câu thừa, khoảng trắng kép */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,;:!?"'’“”()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1rem 1.1rem",
};

function KindTag({ entry }: { entry: VocabEntry }) {
  return (
    <span
      style={{
        padding: "1px 7px",
        borderRadius: 99,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        fontSize: FS.xs,
        fontWeight: 600,
        color: "var(--text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {entry.pos ? `${entry.pos}.` : VOCAB_KIND_LABELS[entry.kind]}
    </span>
  );
}

// ── Chế độ 1: Danh sách ──────────────────────────────────────────────────────

function ListMode({
  entries,
  progress,
  onToggleKnown,
}: {
  entries: VocabEntry[];
  progress: VocabProgressMap;
  onToggleKnown: (en: string, known: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      {entries.map((e) => {
        const known = progress[vocabKey(e.en)]?.known ?? false;
        return (
          <div
            key={e.en}
            style={{
              ...card,
              borderColor: known ? "#86efac" : "var(--border)",
              background: known ? "rgba(22,163,74,0.05)" : "var(--bg-elevated)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>
                    {e.en}
                  </span>
                  <KindTag entry={e} />
                </div>
                <p style={{ fontSize: FS.sm, color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
                  {e.vi}
                </p>
                {e.example && (
                  <p
                    style={{
                      fontSize: FS.xs,
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      margin: "0.35rem 0 0",
                      paddingLeft: "0.6rem",
                      borderLeft: "2px solid var(--border)",
                    }}
                  >
                    {e.example}
                  </p>
                )}
                {e.note && (
                  <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0.35rem 0 0" }}>
                    ⚠ {e.note}
                  </p>
                )}
              </div>

              <button
                onClick={() => onToggleKnown(e.en, !known)}
                title={known ? "Bỏ đánh dấu đã thuộc" : "Đánh dấu đã thuộc"}
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: `1px solid ${known ? GREEN : "var(--border)"}`,
                  background: known ? GREEN : "transparent",
                  color: known ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chế độ 2: Flashcard ──────────────────────────────────────────────────────

function FlashcardMode({
  entries,
  progress,
  onToggleKnown,
}: {
  entries: VocabEntry[];
  progress: VocabProgressMap;
  onToggleKnown: (en: string, known: boolean) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const e = entries[idx];
  if (!e) return null;
  const known = progress[vocabKey(e.en)]?.known ?? false;

  const go = (d: number) => {
    setFlipped(false);
    setIdx((i) => Math.min(entries.length - 1, Math.max(0, i + d)));
  };

  return (
    <div>
      <div style={{ fontSize: FS.xs, color: "var(--text-muted)", textAlign: "center", marginBottom: "0.6rem" }}>
        Thẻ {idx + 1}/{entries.length}
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        style={{
          width: "100%",
          minHeight: 190,
          borderRadius: 14,
          border: `1.5px solid ${known ? "#86efac" : "var(--border)"}`,
          background: "var(--bg-elevated)",
          cursor: "pointer",
          padding: "1.5rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          fontFamily: "var(--font-sans)",
          textAlign: "center",
        }}
      >
        {!flipped ? (
          <>
            <span style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)" }}>{e.en}</span>
            <KindTag entry={e} />
            <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Bấm để lật</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: FS.lg, fontWeight: 600, color: "var(--text-primary)" }}>{e.vi}</span>
            {e.example && (
              <span style={{ fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
                {e.example}
              </span>
            )}
            {e.note && (
              <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>⚠ {e.note}</span>
            )}
          </>
        )}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.9rem" }}>
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: idx === 0 ? "var(--text-muted)" : "var(--text-secondary)",
            cursor: idx === 0 ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          <ArrowLeft size={15} />
        </button>

        <button
          onClick={() => onToggleKnown(e.en, !known)}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 8,
            border: `1px solid ${known ? GREEN : "var(--border)"}`,
            background: known ? "rgba(22,163,74,0.1)" : "transparent",
            color: known ? "#15803d" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: FS.sm,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          {known ? "✓ Đã thuộc" : "Đánh dấu đã thuộc"}
        </button>

        <button
          onClick={() => go(1)}
          disabled={idx === entries.length - 1}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: idx === entries.length - 1 ? "var(--text-muted)" : "var(--text-secondary)",
            cursor: idx === entries.length - 1 ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Chế độ 3: Trắc nghiệm (Anh → Việt) ───────────────────────────────────────

function QuizMode({
  entries,
  onWrong,
  onRight,
}: {
  entries: VocabEntry[];
  onWrong: (en: string) => void;
  onRight: (en: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const order = useMemo(() => shuffle(entries, `quiz-${entries.length}`), [entries]);
  const e = order[idx];

  const options = useMemo(() => {
    if (!e) return [];
    const others = entries.filter((x) => x.en !== e.en);
    const distractors = shuffle(others, `d-${e.en}`).slice(0, 3).map((x) => x.vi);
    return shuffle([e.vi, ...distractors], `o-${e.en}`);
  }, [e, entries]);

  if (!e) return null;

  if (done) {
    const pct = Math.round((score / order.length) * 100);
    return (
      <div style={{ ...card, textAlign: "center", padding: "2rem 1.25rem" }}>
        <div style={{ fontSize: FS.xl, fontWeight: 800, color: pct >= 80 ? GREEN : "#d97706" }}>{pct}%</div>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", margin: "0.3rem 0 1.1rem" }}>
          {score}/{order.length} từ đúng
        </p>
        <button
          onClick={() => {
            setIdx(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: FS.sm,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          <RotateCcw size={14} /> Làm lại
        </button>
      </div>
    );
  }

  const answered = picked !== null;

  return (
    <div>
      <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.6rem" }}>
        Câu {idx + 1}/{order.length}
      </div>

      <div style={{ ...card, marginBottom: "0.9rem", textAlign: "center" }}>
        <div style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)" }}>{e.en}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {options.map((opt, i) => {
          const isCorrect = opt === e.vi;
          const isPicked = picked === i;
          let border = "1px solid var(--border)";
          let bg = "var(--bg-elevated)";
          if (answered) {
            if (isCorrect) {
              border = `1.5px solid ${GREEN}`;
              bg = "rgba(22,163,74,0.07)";
            } else if (isPicked) {
              border = `1.5px solid ${RED}`;
              bg = "rgba(239,68,68,0.07)";
            }
          }
          return (
            <button
              key={i}
              onClick={() => {
                if (answered) return;
                setPicked(i);
                if (isCorrect) {
                  setScore((s) => s + 1);
                  onRight(e.en);
                } else {
                  onWrong(e.en);
                }
              }}
              disabled={answered}
              style={{
                textAlign: "left",
                padding: "0.65rem 0.85rem",
                borderRadius: 8,
                border,
                background: bg,
                color: "var(--text-primary)",
                fontSize: FS.sm,
                lineHeight: 1.5,
                cursor: answered ? "default" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <button
          onClick={() => {
            if (idx === order.length - 1) setDone(true);
            else {
              setIdx((i) => i + 1);
              setPicked(null);
            }
          }}
          style={{
            marginTop: "0.9rem",
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: FS.sm,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          {idx === order.length - 1 ? "Xem kết quả" : "Câu tiếp"}
        </button>
      )}
    </div>
  );
}

// ── Chế độ 4: Điền từ (Việt → Anh) ───────────────────────────────────────────

function FillMode({
  entries,
  onWrong,
  onRight,
}: {
  entries: VocabEntry[];
  onWrong: (en: string) => void;
  onRight: (en: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"typing" | "right" | "wrong">("typing");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const order = useMemo(() => shuffle(entries, `fill-${entries.length}`), [entries]);
  const e = order[idx];
  if (!e) return null;

  if (done) {
    const pct = Math.round((score / order.length) * 100);
    return (
      <div style={{ ...card, textAlign: "center", padding: "2rem 1.25rem" }}>
        <div style={{ fontSize: FS.xl, fontWeight: 800, color: pct >= 80 ? GREEN : "#d97706" }}>{pct}%</div>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", margin: "0.3rem 0 1.1rem" }}>
          {score}/{order.length} từ viết đúng
        </p>
        <button
          onClick={() => {
            setIdx(0);
            setValue("");
            setState("typing");
            setScore(0);
            setDone(false);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: FS.sm,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          <RotateCcw size={14} /> Làm lại
        </button>
      </div>
    );
  }

  const check = () => {
    if (state !== "typing" || !value.trim()) return;
    const ok = normalize(value) === normalize(e.en);
    setState(ok ? "right" : "wrong");
    if (ok) {
      setScore((s) => s + 1);
      onRight(e.en);
    } else {
      onWrong(e.en);
    }
  };

  const next = () => {
    if (idx === order.length - 1) setDone(true);
    else {
      setIdx((i) => i + 1);
      setValue("");
      setState("typing");
    }
  };

  return (
    <div>
      <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.6rem" }}>
        Câu {idx + 1}/{order.length} · gõ tiếng Anh
      </div>

      <div style={{ ...card, marginBottom: "0.9rem", textAlign: "center" }}>
        <div style={{ fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)" }}>{e.vi}</div>
        <div style={{ marginTop: "0.4rem" }}>
          <KindTag entry={e} />
        </div>
      </div>

      <input
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key !== "Enter") return;
          ev.preventDefault();
          if (state === "typing") check();
          else next();
        }}
        disabled={state !== "typing"}
        placeholder="Gõ từ/cụm tiếng Anh…"
        autoComplete="off"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "0.7rem 0.9rem",
          borderRadius: 8,
          border: `1.5px solid ${
            state === "right" ? GREEN : state === "wrong" ? RED : "var(--border)"
          }`,
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          fontSize: FS.md,
          fontFamily: "var(--font-sans)",
        }}
      />

      {state !== "typing" && (
        <div
          style={{
            marginTop: "0.7rem",
            padding: "0.7rem 0.85rem",
            borderRadius: 8,
            background: "var(--bg-secondary)",
            borderLeft: `3px solid ${state === "right" ? GREEN : RED}`,
            fontSize: FS.sm,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {state === "right" ? <Check size={15} color={GREEN} /> : <X size={15} color={RED} />}
          <span>
            {state === "right" ? "Chính xác" : "Đáp án:"} <strong>{e.en}</strong>
          </span>
        </div>
      )}

      <button
        onClick={state === "typing" ? check : next}
        disabled={state === "typing" && !value.trim()}
        style={{
          marginTop: "0.9rem",
          width: "100%",
          padding: "10px 0",
          borderRadius: 8,
          border: "none",
          background:
            state === "typing" && !value.trim() ? "var(--bg-secondary)" : "var(--accent-primary)",
          color: state === "typing" && !value.trim() ? "var(--text-muted)" : "#fff",
          fontWeight: 700,
          fontSize: FS.sm,
          cursor: state === "typing" && !value.trim() ? "default" : "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        {state === "typing" ? "Kiểm tra" : idx === order.length - 1 ? "Xem kết quả" : "Câu tiếp"}
      </button>
    </div>
  );
}

// ── Màn chính ────────────────────────────────────────────────────────────────

export function VocabScreen({
  entries,
  topicSlug,
  topicName,
  levelSlug,
  levelName,
  questionCount,
  initialProgress,
  onStart,
  heading,
  subheading,
}: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [progress, setProgress] = useState<VocabProgressMap>(initialProgress);

  /** Gom thay đổi rồi gửi một lượt — tránh gọi API mỗi lần bấm */
  const pending = useRef<Map<string, { known?: boolean; wrong: number; seen: number }>>(new Map());

  const flush = useCallback(() => {
    if (pending.current.size === 0) return;
    const updates = [...pending.current.entries()].map(([word, v]) => ({
      word,
      ...(v.known === undefined ? {} : { known: v.known }),
      ...(v.wrong > 0 ? { wrong: true } : {}),
      ...(v.seen > 0 ? { seen: true } : {}),
    }));
    pending.current = new Map();
    void fetch("/api/subskills/vocab-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topicSlug, level: levelSlug, updates }),
    }).catch(() => {});
  }, [topicSlug, levelSlug]);

  const queue = useCallback(
    (en: string, patch: { known?: boolean; wrong?: boolean; seen?: boolean }) => {
      const key = vocabKey(en);
      const cur = pending.current.get(key) ?? { wrong: 0, seen: 0 };
      pending.current.set(key, {
        known: patch.known ?? cur.known,
        wrong: cur.wrong + (patch.wrong ? 1 : 0),
        seen: cur.seen + (patch.seen ? 1 : 0),
      });
    },
    [],
  );

  const toggleKnown = useCallback(
    (en: string, known: boolean) => {
      const key = vocabKey(en);
      setProgress((p) => ({
        ...p,
        [key]: { known, wrongCount: p[key]?.wrongCount ?? 0, seenCount: p[key]?.seenCount ?? 0 },
      }));
      queue(en, { known });
    },
    [queue],
  );

  const markWrong = useCallback((en: string) => queue(en, { wrong: true, seen: true }), [queue]);
  const markRight = useCallback((en: string) => queue(en, { seen: true }), [queue]);

  const knownCount = entries.filter((e) => progress[vocabKey(e.en)]?.known).length;

  const start = () => {
    flush();
    onStart?.();
  };

  return (
    <div style={{ ...CONTAINER, ...FILL_SCREEN, background: "var(--bg-primary)", fontFamily: "var(--font-sans)" }}>
      <div style={{ flex: 1, padding: `clamp(1.25rem, 3vw, 2.25rem) ${PAD_X}` }}>
      <div style={{ maxWidth: CONTAINER_MAX, margin: "0 auto" }}>
        <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0 0 0.3rem" }}>
          {topicName} · {levelName}
        </p>
        <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.35rem" }}>
          {heading ?? "Từ vựng của bài"}
        </h1>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.65, margin: "0 0 0.9rem" }}>
          {subheading ??
            `${entries.length} mục từ rút từ chính ngữ liệu của level này. Nắm trước thì lúc dịch đỡ phải đoán.`}
        </p>

        {/* Tiến độ đã thuộc */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1.1rem" }}>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${entries.length ? (knownCount / entries.length) * 100 : 0}%`,
                background: GREEN,
                borderRadius: 99,
                transition: "width 0.25s",
              }}
            />
          </div>
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Đã thuộc {knownCount}/{entries.length}
          </span>
        </div>

        {/* Chọn chế độ */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.1rem", flexWrap: "wrap" }}>
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "7px 13px",
                  borderRadius: 99,
                  border: `1px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
                  background: active ? "var(--accent-primary)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  fontSize: FS.sm,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <Icon size={13} /> {m.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          {mode === "list" && (
            <ListMode entries={entries} progress={progress} onToggleKnown={toggleKnown} />
          )}
          {mode === "flashcard" && (
            <FlashcardMode entries={entries} progress={progress} onToggleKnown={toggleKnown} />
          )}
          {mode === "quiz" && <QuizMode entries={entries} onWrong={markWrong} onRight={markRight} />}
          {mode === "fill" && <FillMode entries={entries} onWrong={markWrong} onRight={markRight} />}
        </div>

        {/* Vào bài */}
        {onStart && (
        <button
          onClick={start}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem",
            padding: "12px 0",
            borderRadius: 10,
            border: "none",
            background: "var(--accent-primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: FS.md,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          <Play size={15} /> Bắt đầu làm bài ({questionCount} câu)
        </button>
        )}
      </div>
      </div>
    </div>
  );
}
