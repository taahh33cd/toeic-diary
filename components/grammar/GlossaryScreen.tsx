"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  ListChecks,
  Keyboard,
  Volume2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { GlossaryEntry } from "@/lib/grammar/glossary";

interface Props {
  focus: GlossaryEntry[];
  extra: GlossaryEntry[];
  topicName: string;
  testNumber: number;
  questionCount: number;
  onStart: () => void;
}

type Mode = "list" | "flashcard" | "quiz" | "fill";

const GREEN = "#4DA86A";
const CREAM = "#FFD66B";
const INK = "#2e5049";

const MODES: Array<{ id: Mode; label: string; icon: typeof BookOpen }> = [
  { id: "list", label: "Tra cứu", icon: BookOpen },
  { id: "flashcard", label: "Flashcard", icon: Layers },
  { id: "quiz", label: "Trắc nghiệm", icon: ListChecks },
  { id: "fill", label: "Điền từ", icon: Keyboard },
];

// ── Phát âm: audio từ điển → /api/tts → speechSynthesis ────────────────
async function playWord(word: string, audioUrl?: string) {
  if (audioUrl) {
    try {
      await new Audio(audioUrl).play();
      return;
    } catch {
      /* rơi xuống TTS */
    }
  }
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word }),
    });
    if (res.ok) {
      const { audioContent } = (await res.json()) as { audioContent?: string };
      if (audioContent) {
        await new Audio(`data:audio/mp3;base64,${audioContent}`).play();
        return;
      }
    }
  } catch {
    /* rơi xuống speechSynthesis */
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }
}

/** Tra IPA + audio thật của một từ (cụm từ thì bỏ qua, API chỉ có từ đơn). */
function useDictionary(word: string, enabled: boolean) {
  // Gắn kết quả với từ đã tra, để đổi từ là hiển thị rỗng ngay mà không cần reset state.
  const [found, setFound] = useState<{ word: string; ipa: string; audioUrl?: string }>({
    word: "",
    ipa: "",
  });

  useEffect(() => {
    if (!enabled || !word || word.includes(" ")) return;

    let cancelled = false;
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data) || !data[0]) return;
        const entry = data[0] as {
          phonetic?: string;
          phonetics?: Array<{ text?: string; audio?: string }>;
        };
        setFound({
          word,
          ipa: entry.phonetic ?? entry.phonetics?.find((p) => p.text)?.text ?? "",
          audioUrl: entry.phonetics?.find((p) => p.audio)?.audio,
        });
      })
      .catch(() => {
        /* không có IPA thì thôi, phát âm vẫn chạy qua TTS */
      });

    return () => {
      cancelled = true;
    };
  }, [word, enabled]);

  const hit = found.word === word;
  return { ipa: hit ? found.ipa : "", audioUrl: hit ? found.audioUrl : undefined };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** So khớp đáp án điền từ: bỏ hoa/thường, dấu câu thừa, khoảng trắng lặp. */
function normalize(s: string) {
  return s.toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();
}

const btnPrimary: React.CSSProperties = {
  background: GREEN,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "0.7rem 1.4rem",
  fontWeight: 700,
  fontSize: "0.92rem",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

const btnGhost: React.CSSProperties = {
  background: "#fff",
  color: INK,
  border: "1.5px solid #B8E6C8",
  borderRadius: 6,
  padding: "0.7rem 1.4rem",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

const speakerBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "#eef7f1",
  color: GREEN,
  border: "1px solid #B8E6C8",
  borderRadius: 5,
  padding: "5px 10px",
  fontSize: "0.78rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

export function GlossaryScreen({
  focus,
  extra,
  topicName,
  testNumber,
  questionCount,
  onStart,
}: Props) {
  const [mode, setMode] = useState<Mode>("list");

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        paddingBottom: "3rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Header strip (đồng bộ với màn hình làm bài) ── */}
      <div
        style={{
          background: GREEN,
          padding: "0 1.5rem",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: CREAM, whiteSpace: "nowrap" }}>
          Từ vựng &nbsp;·&nbsp; {topicName} — Test {testNumber}
        </span>
        <button
          onClick={onStart}
          style={{
            padding: "0.35rem 1rem",
            borderRadius: 4,
            border: `1.5px solid rgba(255,239,179,0.5)`,
            background: "transparent",
            color: CREAM,
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-sans)",
          }}
        >
          Vào làm bài →
        </button>
      </div>

      {/* ── Directions bar ── */}
      <div
        style={{
          background: "#e4ede8",
          padding: "0.55rem 1.5rem",
          borderBottom: "1px solid #B8E6C8",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: INK,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Trước khi làm bài:
        </span>
        <span style={{ fontSize: "0.72rem", color: "#5A8A6A", marginLeft: "0.4rem" }}>
          Lướt qua {focus.length} từ trọng điểm của {questionCount} câu trong đề. Học kỹ bằng
          flashcard hoặc bài tập rồi hãy vào làm bài.
        </span>
      </div>

      {/* ── Mode tabs ── */}
      <div
        style={{
          background: "#fff",
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #e5e7eb",
          overflowX: "auto",
        }}
      >
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: "1 0 auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0.7rem 1rem",
                border: "none",
                borderBottom: `2.5px solid ${active ? GREEN : "transparent"}`,
                background: "transparent",
                color: active ? GREEN : "#9ca3af",
                fontSize: "0.82rem",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-sans)",
              }}
            >
              <Icon size={15} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* ── Nội dung theo chế độ ── */}
      <div style={{ background: "#fff", padding: "1.5rem 1.75rem 2rem" }}>
        {mode === "list" && <ListMode focus={focus} extra={extra} />}
        {mode === "flashcard" && <FlashcardMode entries={focus} />}
        {mode === "quiz" && <QuizMode entries={focus} />}
        {mode === "fill" && <FillMode entries={focus} />}
      </div>

      {/* ── Chân trang ── */}
      <div
        style={{
          background: "#e4ede8",
          padding: "1rem 1.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/grammar" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Danh sách đề
        </Link>
        <button onClick={onStart} style={btnPrimary}>
          Bắt đầu làm bài ({questionCount} câu) →
        </button>
      </div>
    </div>
  );
}

// ── 1. Tra cứu ─────────────────────────────────────────────────────────
function WordRow({ e }: { e: GlossaryEntry }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "0.6rem",
        padding: "0.65rem 0.25rem",
        borderBottom: "1px solid #f1f5f3",
      }}
    >
      <div style={{ flex: "0 0 34%", minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: INK, fontSize: "0.92rem" }}>{e.word}</span>
        {e.type && (
          <span style={{ marginLeft: 6, fontSize: "0.72rem", color: "#9ca3af", fontStyle: "italic" }}>
            {e.type}
          </span>
        )}
      </div>
      <div style={{ flex: 1, fontSize: "0.88rem", color: "#374151" }}>{e.meaning}</div>
      <button onClick={() => playWord(e.word)} style={speakerBtn} aria-label={`Nghe ${e.word}`}>
        <Volume2 size={13} />
      </button>
    </div>
  );
}

function ListMode({ focus, extra }: { focus: GlossaryEntry[]; extra: GlossaryEntry[] }) {
  const [showExtra, setShowExtra] = useState(false);

  return (
    <div>
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: "0.5rem",
        }}
      >
        {focus.length} từ trọng điểm
      </div>
      {focus.map((e) => (
        <WordRow key={e.word} e={e} />
      ))}

      {extra.length > 0 && (
        <>
          <button
            onClick={() => setShowExtra((v) => !v)}
            style={{
              ...btnGhost,
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              fontSize: "0.82rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {showExtra ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showExtra ? "Ẩn" : `Xem thêm ${extra.length} từ khác trong đề`}
          </button>
          {showExtra && (
            <div style={{ marginTop: "0.75rem" }}>
              {extra.map((e) => (
                <WordRow key={e.word} e={e} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── 2. Flashcard ───────────────────────────────────────────────────────
function FlashcardMode({ entries }: { entries: GlossaryEntry[] }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = entries[idx];
  const { ipa, audioUrl } = useDictionary(current?.word ?? "", true);

  if (!current) return null;

  const go = (delta: number) => {
    setIdx((i) => (i + delta + entries.length) % entries.length);
    setFlipped(false);
  };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#9ca3af",
          textAlign: "center",
          marginBottom: "0.75rem",
        }}
      >
        Thẻ {idx + 1} / {entries.length}
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        style={{
          width: "100%",
          minHeight: 190,
          background: flipped ? "#eef7f1" : "#f9fafb",
          border: `1.5px solid ${flipped ? "#B8E6C8" : "#e5e7eb"}`,
          borderRadius: 10,
          padding: "1.75rem 1.25rem",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          fontFamily: "var(--font-sans)",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <div style={{ fontSize: "1.45rem", fontWeight: 800, color: INK }}>{current.word}</div>
        {current.type && (
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>
            {current.type}
          </div>
        )}
        <div style={{ fontSize: "0.8rem", color: "#9ca3af", minHeight: "1.1em" }}>{ipa}</div>
        {flipped ? (
          <div style={{ fontSize: "1rem", color: GREEN, fontWeight: 700, marginTop: "0.5rem" }}>
            {current.meaning}
          </div>
        ) : (
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.5rem" }}>
            Bấm để xem nghĩa
          </div>
        )}
      </button>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
        <button onClick={() => go(-1)} style={{ ...btnGhost, flex: 1 }}>
          ← Trước
        </button>
        <button
          onClick={() => playWord(current.word, audioUrl)}
          style={{ ...speakerBtn, padding: "0.7rem 1rem" }}
        >
          <Volume2 size={15} /> Nghe
        </button>
        <button onClick={() => go(1)} style={{ ...btnPrimary, flex: 1 }}>
          Sau →
        </button>
      </div>
    </div>
  );
}

// ── 3. Trắc nghiệm nghĩa ───────────────────────────────────────────────
interface QuizItem {
  entry: GlossaryEntry;
  options: string[];
}

function buildQuizItems(entries: GlossaryEntry[]): QuizItem[] {
  return shuffle(entries).map((entry) => {
    const distractors = shuffle(entries.filter((e) => e.word !== entry.word))
      .slice(0, 3)
      .map((e) => e.meaning);
    return { entry, options: shuffle([entry.meaning, ...distractors]) };
  });
}

function QuizMode({ entries }: { entries: GlossaryEntry[] }) {
  const [items, setItems] = useState<QuizItem[]>(() => buildQuizItems(entries));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  const reset = useCallback(() => {
    setItems(buildQuizItems(entries));
    setIdx(0);
    setChosen(null);
    setCorrect(0);
  }, [entries]);

  const current = items[idx];
  if (items.length === 0) return null;
  if (!current) return <Summary correct={correct} total={items.length} onRetry={reset} />;

  const select = (opt: string) => {
    if (chosen !== null) return;
    setChosen(opt);
    if (opt === current.entry.meaning) setCorrect((c) => c + 1);
    setTimeout(() => {
      setIdx((i) => i + 1);
      setChosen(null);
    }, 850);
  };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: "0.75rem",
        }}
      >
        Câu {idx + 1} / {items.length} &nbsp;·&nbsp; Đúng {correct}
      </div>

      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "1.2rem", fontWeight: 800, color: INK }}>
          {current.entry.word}
        </span>
        {current.entry.type && (
          <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>
            {current.entry.type}
          </span>
        )}
        <button onClick={() => playWord(current.entry.word)} style={speakerBtn}>
          <Volume2 size={13} />
        </button>
      </div>

      {current.options.map((opt) => {
        const revealed = chosen !== null;
        const isCorrect = opt === current.entry.meaning;
        const isSelected = chosen === opt;

        let bg = "#f9fafb";
        let border = "#e5e7eb";
        let color = "#374151";
        let weight: React.CSSProperties["fontWeight"] = 400;

        if (revealed) {
          if (isCorrect) {
            bg = "#f0fdf4";
            border = "#4ade80";
            color = "#166534";
            weight = 700;
          } else if (isSelected) {
            bg = "#fef2f2";
            border = "#fca5a5";
            color = "#991b1b";
          }
        }

        return (
          <button
            key={opt}
            onClick={() => select(opt)}
            disabled={revealed}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.65rem 0.9rem",
              marginBottom: "0.5rem",
              border: `1.5px solid ${border}`,
              borderRadius: 6,
              background: bg,
              color,
              fontWeight: weight,
              fontSize: "0.9rem",
              lineHeight: 1.4,
              cursor: revealed ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {revealed && isCorrect ? "✓ " : ""}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── 4. Điền từ ─────────────────────────────────────────────────────────
function FillMode({ entries }: { entries: GlossaryEntry[] }) {
  const [items, setItems] = useState<GlossaryEntry[]>(() => shuffle(entries));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [state, setState] = useState<"typing" | "right" | "wrong">("typing");
  const [correct, setCorrect] = useState(0);

  const reset = useCallback(() => {
    setItems(shuffle(entries));
    setIdx(0);
    setInput("");
    setState("typing");
    setCorrect(0);
  }, [entries]);

  const current = items[idx];
  const hint = useMemo(() => {
    if (!current) return "";
    return current.word
      .split(" ")
      .map((w, i) => (i === 0 ? w[0] + "_".repeat(Math.max(0, w.length - 1)) : "_".repeat(w.length)))
      .join(" ");
  }, [current]);

  if (items.length === 0) return null;
  if (!current) return <Summary correct={correct} total={items.length} onRetry={reset} />;

  const check = () => {
    if (state !== "typing") return;
    const ok = normalize(input) === normalize(current.word);
    setState(ok ? "right" : "wrong");
    if (ok) setCorrect((c) => c + 1);
  };

  const next = () => {
    setIdx((i) => i + 1);
    setInput("");
    setState("typing");
  };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: "0.75rem",
        }}
      >
        Từ {idx + 1} / {items.length} &nbsp;·&nbsp; Đúng {correct}
      </div>

      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "1rem 1.1rem",
          marginBottom: "0.85rem",
        }}
      >
        <div style={{ fontSize: "1rem", fontWeight: 700, color: INK }}>{current.meaning}</div>
        <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.35rem" }}>
          {current.type && <span style={{ fontStyle: "italic", marginRight: 8 }}>{current.type}</span>}
          <span style={{ letterSpacing: "0.15em", fontFamily: "monospace" }}>{hint}</span>
        </div>
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          if (state === "typing") check();
          else next();
        }}
        disabled={state !== "typing"}
        placeholder="Gõ từ tiếng Anh…"
        autoFocus
        style={{
          width: "100%",
          padding: "0.7rem 0.9rem",
          borderRadius: 6,
          border: `1.5px solid ${
            state === "right" ? "#4ade80" : state === "wrong" ? "#fca5a5" : "#e5e7eb"
          }`,
          background: state === "right" ? "#f0fdf4" : state === "wrong" ? "#fef2f2" : "#fff",
          fontSize: "0.95rem",
          color: INK,
          fontFamily: "var(--font-sans)",
          outline: "none",
        }}
      />

      {state !== "typing" && (
        <div
          style={{
            marginTop: "0.6rem",
            fontSize: "0.85rem",
            color: state === "right" ? "#166534" : "#991b1b",
            fontWeight: 600,
          }}
        >
          {state === "right" ? "✓ Chính xác!" : `✗ Đáp án: ${current.word}`}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
        {state === "typing" ? (
          <button onClick={check} disabled={!input.trim()} style={{ ...btnPrimary, flex: 1, opacity: input.trim() ? 1 : 0.5 }}>
            Kiểm tra
          </button>
        ) : (
          <button onClick={next} style={{ ...btnPrimary, flex: 1 }}>
            {idx + 1 >= items.length ? "Xem kết quả →" : "Từ tiếp theo →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Màn hình tổng kết dùng chung cho trắc nghiệm & điền từ ─────────────
function Summary({
  correct,
  total,
  onRetry,
}: {
  correct: number;
  total: number;
  onRetry: () => void;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "center", padding: "1.5rem 0" }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, color: GREEN }}>{pct}%</div>
      <div style={{ fontSize: "0.88rem", color: "#6b7280", marginTop: "0.25rem" }}>
        Thuộc {correct}/{total} từ
      </div>
      <button
        onClick={onRetry}
        style={{
          ...btnGhost,
          marginTop: "1.25rem",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <RotateCcw size={15} /> Làm lại
      </button>
    </div>
  );
}
