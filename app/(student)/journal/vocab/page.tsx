"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useVocab } from "@/hooks/firebase/useVocab";
import { saveVocabWord, updateVocabWord, deleteVocabWord } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import { useLocale } from "@/hooks/useLocale";
import type { VocabWord } from "@/lib/firebase/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const POS_COLOR: Record<string, string> = {
  n:   "#3B82F6",
  v:   "#10B981",
  adj: "#F59E0B",
  adv: "#8B5CF6",
};

const MASTERY_THRESHOLD = 10;

const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60];

function getNextDue(lastReview: string | undefined, repCount: number): Date {
  if (!lastReview) return new Date(0);
  const last = new Date(lastReview + "T00:00:00");
  const interval = SRS_INTERVALS[Math.min(repCount, SRS_INTERVALS.length - 1)];
  const due = new Date(last);
  due.setDate(due.getDate() + interval);
  return due;
}

function isWordDue(word: VocabWord, todayStr: string): boolean {
  const today = new Date(todayStr + "T00:00:00");
  return getNextDue(word.lastReview, word.repCount ?? 0) <= today;
}

// ─── TTS / Audio helper ───────────────────────────────────────────────────────

async function playWord(word: string, audioUrl?: string) {
  // 1. Prefer audioUrl from dictionary lookup (free, no API key needed)
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => playWebSpeech(word));
    return;
  }
  // 2. Try Google TTS via our API route (high quality, 0.85x speed)
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word }),
    });
    if (res.ok) {
      const { audioContent } = (await res.json()) as { audioContent?: string };
      if (audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        await audio.play();
        return;
      }
    }
  } catch {
    // fall through
  }
  // 3. Fallback: browser Web Speech API
  playWebSpeech(word);
}

function playWebSpeech(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

// ─── Quick Add Bar ────────────────────────────────────────────────────────────

type AddPhase = "search" | "loading" | "preview" | "saving" | "saved";

const POS_LABELS: Record<string, string> = { n: "noun", v: "verb", adj: "adj", adv: "adv" };

function QuickAddBar({ studentCode, onSaved }: { studentCode: string; onSaved?: (word: string) => void }) {
  const { t } = useLocale();
  const today = new Date().toISOString().slice(0, 10);
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<AddPhase>("search");
  const [word, setWord] = useState("");
  const [vi, setVi] = useState("");
  const [ipa, setIpa] = useState("");
  const [pos, setPos] = useState<"n" | "v" | "adj" | "adv" | "">("");
  const [def, setDef] = useState("");
  const [example, setExample] = useState("");
  const [part, setPart] = useState<number>(5);
  const [audioUrl, setAudioUrl] = useState("");
  const [editingVi, setEditingVi] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [viLoading, setViLoading] = useState(false);

  function reset() {
    setPhase("search");
    setWord(""); setVi(""); setIpa(""); setPos(""); setDef("");
    setExample(""); setPart(5); setAudioUrl("");
    setEditingVi(false); setShowDetails(false); setViLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleLookup() {
    const w = word.trim();
    if (!w || phase === "loading") return;
    setPhase("loading");

    const posMap: Record<string, "n" | "v" | "adj" | "adv"> = {
      noun: "n", verb: "v", adjective: "adj", adverb: "adv",
    };
    let dictPos = "";
    let dictDef = "";
    let fetchedAudioUrl = "";

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[] = await res.json();
        const entry = data[0] ?? {};
        const m0 = entry.meanings?.[0] ?? {};
        const def0 = m0.definitions?.[0] ?? {};
        const rawPos: string = m0.partOfSpeech ?? "";
        setIpa(entry.phonetic ?? entry.phonetics?.find((p: { text?: string }) => p.text)?.text ?? "");
        dictPos = posMap[rawPos] ?? "";
        setPos(dictPos as "n" | "v" | "adj" | "adv" | "");
        dictDef = def0.definition ?? "";
        setDef(dictDef);
        fetchedAudioUrl = entry.phonetics?.find((p: { audio?: string }) => p.audio)?.audio ?? "";
        setAudioUrl(fetchedAudioUrl);
      }
    } catch { /* continue */ }

    // Show card immediately after dictionary — don't wait for Gemini
    setPhase("preview");
    setViLoading(true);
    playWord(w, fetchedAudioUrl);

    // Gemini runs in background, updates vi when ready
    try {
      const aiRes = await fetch("/api/ai/word-meaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: w, pos: dictPos, definition: dictDef }),
      });
      if (aiRes.ok) {
        const { vi: viMeaning, example: aiExample } = await aiRes.json() as { vi?: string; example?: string };
        if (viMeaning) setVi(viMeaning);
        if (aiExample) setExample(aiExample);
      }
    } catch { /* silently fail */ }

    setViLoading(false);
  }

  async function handleSave() {
    if (!word.trim() || phase === "saving") return;
    setPhase("saving");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await saveVocabWord(studentCode, {
        word: word.trim(),
        vi: vi.trim() || undefined,
        ipa: ipa.trim() || undefined,
        pos: pos || undefined,
        def: def.trim() || undefined,
        example: example.trim() || undefined,
        part,
        addedDate: today,
        repCount: 0,
      } as any);
      const savedWord = word.trim();
      setPhase("saved");
      onSaved?.(savedWord);
      setTimeout(() => reset(), 1800);
    } catch {
      setPhase("preview");
    }
  }

  const isLoading = phase === "loading";
  const showCard = phase === "loading" || phase === "preview" || phase === "saving" || phase === "saved";

  return (
    <section style={{ background: "linear-gradient(160deg, #fdf8f2 0%, #f5ecdc 100%)", border: "1.5px solid rgba(196,98,45,0.35)", borderRadius: 16, overflow: "hidden" }}>
      {/* Header label */}
      <div style={{ padding: "14px 18px 2px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: ".68rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(196,98,45,0.85)" }}>✦ Thêm từ vựng mới</span>
      </div>
      {/* Search input */}
      <div style={{ padding: "8px 18px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder={t("Nhập từ tiếng Anh… (↵ Enter để tra nghĩa)", "Type a word… (↵ Enter to look up)")}
          value={word}
          onChange={(e) => { setWord(e.target.value); if (phase !== "search") setPhase("search"); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (phase === "preview") handleSave();
              else if (word.trim()) handleLookup();
            }
            if (e.key === "Escape") reset();
          }}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "'Lora', Georgia, serif",
          }}
          autoComplete="off"
          spellCheck={false}
        />
        {word && (
          <button
            type="button"
            onClick={reset}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: ".9rem", flexShrink: 0, padding: 2 }}
            title="Xoá"
          >✕</button>
        )}
      </div>

      {/* Hint text when empty */}
      {!word && phase === "search" && (
        <div style={{ padding: "0 18px 16px 50px", fontSize: ".72rem", color: "var(--text-muted)" }}>
          {t("Nhập từ và nhấn Enter → nghĩa tiếng Việt được tra tự động", "Type a word and press Enter → Vietnamese meaning auto-filled")}
        </div>
      )}

      {/* Preview / loading card */}
      {showCard && (
        <div style={{
          margin: "0 12px 12px",
          borderRadius: 10,
          overflow: "hidden",
          border: phase === "saved"
            ? "1.5px solid rgba(74,124,89,.4)"
            : "1px solid var(--border)",
          background: phase === "saved"
            ? "rgba(74,124,89,.06)"
            : "var(--bg-primary)",
          transition: "all .25s",
        }}>

          {phase === "saved" ? (
            /* ── Saved state ── */
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.4rem" }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: ".95rem", color: "rgba(74,124,89,1)" }}>
                  {t(`Đã lưu "${word}"`, `Saved "${word}"`)}
                </div>
                {vi && <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: 2 }}>{vi}</div>}
              </div>
            </div>
          ) : (
            /* ── Loading / Preview state ── */
            <div style={{ padding: "14px 16px" }}>
              {/* Word header */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}>
                  {word}
                </span>
                {pos && !isLoading && (
                  <span style={{
                    fontSize: ".65rem", fontWeight: 700, padding: "2px 7px",
                    borderRadius: 99, textTransform: "uppercase", letterSpacing: ".06em",
                    background: POS_COLOR[pos] ? `${POS_COLOR[pos]}22` : "var(--border)",
                    color: POS_COLOR[pos] ?? "var(--text-muted)",
                    border: `1px solid ${POS_COLOR[pos] ? `${POS_COLOR[pos]}44` : "var(--border)"}`,
                  }}>
                    {POS_LABELS[pos] ?? pos}
                  </span>
                )}
                {ipa && !isLoading && (
                  <span style={{ fontSize: ".78rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {ipa}
                  </span>
                )}
                {!isLoading && (
                  <button
                    type="button"
                    onClick={() => playWord(word.trim(), audioUrl || undefined)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: ".85rem", padding: 2, color: "var(--text-muted)", marginLeft: 2 }}
                    title="Phát âm"
                  >🔊</button>
                )}
                {isLoading && (
                  <span style={{ fontSize: ".72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    {t("Đang tra…", "Looking up…")}
                  </span>
                )}
              </div>

              {/* Vietnamese meaning — inline editable */}
              <div style={{ marginBottom: 8 }}>
                {editingVi ? (
                  <input
                    autoFocus
                    type="text"
                    value={vi}
                    onChange={(e) => setVi(e.target.value)}
                    onBlur={() => setEditingVi(false)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setEditingVi(false); handleSave(); } if (e.key === "Escape") setEditingVi(false); }}
                    placeholder={t("Nghĩa tiếng Việt…", "Vietnamese meaning…")}
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1.5px solid var(--orange)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: ".88rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                ) : (
                  <div
                    onClick={() => !isLoading && setEditingVi(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: isLoading ? "default" : "text",
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "rgba(196,98,45,.07)",
                      border: "1px dashed rgba(196,98,45,.25)",
                      minHeight: 34,
                    }}
                  >
                    {viLoading ? (
                      <span style={{ fontSize: ".78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        ✨ {t("Đang tạo nghĩa tiếng Việt…", "Generating Vietnamese meaning…")}
                      </span>
                    ) : vi ? (
                      <>
                        <span style={{ flex: 1, fontSize: ".9rem", fontWeight: 700, color: "var(--orange)" }}>{vi}</span>
                        <span style={{ fontSize: ".65rem", color: "var(--text-muted)" }}>{t("nhấn để sửa", "click to edit")}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: ".78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        {t("+ Thêm nghĩa tiếng Việt…", "+ Add Vietnamese meaning…")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Example sentence */}
              {example && !isLoading && (
                <div style={{
                  fontSize: ".75rem",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  padding: "4px 10px",
                  marginBottom: 10,
                  borderLeft: "2px solid var(--border)",
                }}>
                  "{example}"
                </div>
              )}

              {/* Part pills + details toggle */}
              {!isLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={{ fontSize: ".65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Part:
                  </span>
                  {[1,2,3,4,5,6,7].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPart(p)}
                      style={{
                        width: 26, height: 26,
                        borderRadius: 6,
                        fontSize: ".72rem",
                        fontWeight: part === p ? 700 : 500,
                        border: part === p ? "1.5px solid var(--orange)" : "1px solid var(--border)",
                        background: part === p ? "rgba(196,98,45,.12)" : "var(--bg-elevated)",
                        color: part === p ? "var(--orange)" : "var(--text-muted)",
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowDetails((v) => !v)}
                    style={{
                      marginLeft: "auto",
                      fontSize: ".65rem",
                      color: "var(--text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      textDecoration: "underline",
                    }}
                  >
                    {showDetails ? t("Thu gọn ▲", "Less ▲") : t("IPA / Định nghĩa ▼", "IPA / Definition ▼")}
                  </button>
                </div>
              )}

              {/* Collapsible details */}
              {showDetails && !isLoading && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                  padding: "10px 0",
                  borderTop: "1px solid var(--border)",
                  marginBottom: 10,
                }}>
                  <div>
                    <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>IPA</div>
                    <input
                      type="text"
                      value={ipa}
                      onChange={(e) => setIpa(e.target.value)}
                      placeholder="/ɪˈɡzæmpəl/"
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: ".78rem", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", outline: "none" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{t("Từ loại", "POS")}</div>
                    <select
                      value={pos}
                      onChange={(e) => setPos(e.target.value as typeof pos)}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: ".78rem", color: "var(--text-primary)", outline: "none" }}
                    >
                      <option value="">—</option>
                      <option value="n">noun</option>
                      <option value="v">verb</option>
                      <option value="adj">adjective</option>
                      <option value="adv">adverb</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{t("Ví dụ", "Example")}</div>
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                      placeholder="She accomplished the task in record time."
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: ".78rem", color: "var(--text-primary)", outline: "none" }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isLoading && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={phase === "saving"}
                    style={{
                      flex: 1,
                      padding: "9px 16px",
                      borderRadius: 8,
                      background: "var(--orange)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: ".88rem",
                      border: "none",
                      cursor: phase === "saving" ? "default" : "pointer",
                      opacity: phase === "saving" ? 0.7 : 1,
                      transition: "opacity .15s",
                    }}
                  >
                    {phase === "saving"
                      ? t("Đang lưu…", "Saving…")
                      : t("✓ Lưu từ này  ↵", "✓ Save word  ↵")}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 8,
                      background: "none",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      fontSize: ".82rem",
                      cursor: "pointer",
                    }}
                  >
                    {t("Tìm từ khác", "Search again")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Inline Flashcard ────────────────────────────────────────────────────────

function InlineFlashcard({
  words,
  idx,
  setIdx,
  flipped,
  setFlipped,
  todayStr,
}: {
  words: VocabWord[];
  idx: number;
  setIdx: (i: number) => void;
  flipped: boolean;
  setFlipped: (f: boolean) => void;
  todayStr: string;
}) {
  const { t } = useLocale();
  const word = words[Math.min(idx, words.length - 1)];
  if (!word) return null;
  const isDue = isWordDue(word, todayStr) && (word.repCount ?? 0) < MASTERY_THRESHOLD;

  function prev(e: React.MouseEvent) { e.stopPropagation(); setIdx((idx - 1 + words.length) % words.length); setFlipped(false); }
  function next(e: React.MouseEvent) { e.stopPropagation(); setIdx((idx + 1) % words.length); setFlipped(false); }

  return (
    <div>
      <style>{`
        .fc-inner{transition:transform .45s cubic-bezier(.4,0,.2,1);transform-style:preserve-3d;position:relative;}
        .fc-inner.flipped{transform:rotateY(180deg);}
        .fc-face{backface-visibility:hidden;-webkit-backface-visibility:hidden;}
        .fc-back{transform:rotateY(180deg);}
      `}</style>
      <div style={{ perspective: 1000, cursor: "pointer", userSelect: "none" }} onClick={() => setFlipped(!flipped)}>
        <div className={`fc-inner${flipped ? " flipped" : ""}`} style={{ height: 220, position: "relative" }}>
          {/* Front */}
          <div className="fc-face" style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #2C1E0F 0%, #3D2A16 100%)",
            borderRadius: 14, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: "24px 32px", gap: 8,
          }}>
            {isDue && (
              <span style={{ position: "absolute", top: 12, right: 14, fontSize: ".6rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", background: "rgba(196,98,45,0.9)", color: "#fff", padding: "2px 8px", borderRadius: 99 }}>
                ĐẾN HẠN
              </span>
            )}
            {word.part && (
              <span style={{ fontSize: ".6rem", fontWeight: 700, color: "rgba(240,226,204,0.45)", letterSpacing: ".1em", textTransform: "uppercase" }}>PART {word.part}</span>
            )}
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "2.2rem", fontWeight: 700, color: "#f0e2cc", textAlign: "center", lineHeight: 1.2 }}>{word.word}</p>
            {word.ipa && <p style={{ fontFamily: "monospace", fontSize: ".88rem", color: "rgba(240,226,204,0.5)" }}>/{word.ipa}/</p>}
            <p style={{ fontSize: ".68rem", color: "rgba(240,226,204,0.3)", marginTop: 12 }}>{t("Nhấn để xem nghĩa →", "Tap to reveal →")}</p>
          </div>
          {/* Back */}
          <div className="fc-face fc-back" style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #fdf8f2 0%, #f5ecdc 100%)",
            borderRadius: 14, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: "24px 32px", gap: 10,
            border: "1.5px solid rgba(196,98,45,0.2)",
          }}>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: "#2C1E0F", textAlign: "center" }}>
              {word.vi || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
            </p>
            {word.pos && (
              <span style={{ fontSize: ".65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: POS_COLOR[word.pos] ? `${POS_COLOR[word.pos]}22` : "var(--border)", color: POS_COLOR[word.pos] ?? "var(--text-muted)", border: `1px solid ${POS_COLOR[word.pos] ? `${POS_COLOR[word.pos]}44` : "var(--border)"}` }}>
                {POS_LABELS[word.pos] ?? word.pos}
              </span>
            )}
            {word.example && (
              <p style={{ fontSize: ".78rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", paddingTop: 10, borderTop: "1px solid rgba(196,98,45,0.15)", maxWidth: "90%" }}>
                &ldquo;{word.example}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 12 }}>
        <button onClick={prev} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 16px", cursor: "pointer", color: "var(--text-muted)", fontSize: ".9rem" }}>◀</button>
        <span style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--text-muted)", minWidth: 64, textAlign: "center" }}>{idx + 1} / {words.length}</span>
        <button onClick={next} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 16px", cursor: "pointer", color: "var(--text-muted)", fontSize: ".9rem" }}>▶</button>
      </div>
    </div>
  );
}

// ─── Word List Row ────────────────────────────────────────────────────────────

function WordListRow({ word, studentCode, todayStr }: { word: VocabWord; studentCode: string; todayStr: string }) {
  const { t } = useLocale();
  const [reviewing, setReviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const due = isWordDue(word, todayStr) && (word.repCount ?? 0) < MASTERY_THRESHOLD;
  const isMastered = (word.repCount ?? 0) >= MASTERY_THRESHOLD;

  async function handleReview(e: React.MouseEvent) {
    e.stopPropagation();
    if (reviewing) return;
    setReviewing(true);
    const newCount = (word.repCount ?? 0) + 1;
    await updateVocabWord(studentCode, word.id, { repCount: newCount, lastReview: todayStr });
    await awardXp("vocab_review", { wordId: word.id });
    if (newCount >= MASTERY_THRESHOLD && (word.repCount ?? 0) < MASTERY_THRESHOLD) {
      await awardXp("vocab_master", { wordId: word.id });
    }
    setReviewing(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Xoá từ "${word.word}"?`)) return;
    setDeleting(true);
    await deleteVocabWord(studentCode, word.id);
  }

  if (deleting) return null;

  return (
    <>
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          alignItems: "center",
          gap: 12,
          padding: "11px 16px",
          borderBottom: "1px solid var(--border)",
          borderLeft: due ? "3px solid var(--orange)" : isMastered ? "3px solid var(--accent-green)" : "3px solid transparent",
          background: expanded ? "var(--bg-elevated)" : "transparent",
          cursor: "pointer",
          transition: "background .12s",
        }}
      >
        {/* Word + IPA */}
        <div>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 700, fontSize: ".95rem", color: "var(--text-primary)" }}>{word.word}</p>
          {word.ipa && <p style={{ fontFamily: "monospace", fontSize: ".68rem", color: "var(--text-muted)", marginTop: 1 }}>/{word.ipa}/</p>}
        </div>
        {/* Vietnamese + pos */}
        <div>
          <p style={{ fontSize: ".85rem", color: "var(--text-secondary)" }}>{word.vi || <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>—</span>}</p>
          {word.pos && <span style={{ fontSize: ".62rem", fontWeight: 700, color: POS_COLOR[word.pos] ?? "var(--text-muted)" }}>{word.pos}</span>}
        </div>
        {/* Badges + action */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {word.part && (
            <span style={{ fontSize: ".62rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(196,98,45,0.1)", color: "var(--orange)" }}>P{word.part}</span>
          )}
          {isMastered ? (
            <span style={{ fontSize: ".62rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(74,124,89,0.12)", color: "var(--accent-green)" }}>✓ {t("Thành thạo", "Mastered")}</span>
          ) : due ? (
            <button
              onClick={handleReview}
              disabled={reviewing}
              style={{ fontSize: ".72rem", fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: "var(--orange)", color: "#fff", border: "none", cursor: reviewing ? "default" : "pointer", opacity: reviewing ? 0.6 : 1 }}
            >
              {reviewing ? "…" : t("Ôn ngay", "Review")}
            </button>
          ) : (
            <span style={{ fontSize: ".62rem", color: "var(--text-muted)" }}>×{word.repCount ?? 0}/{MASTERY_THRESHOLD}</span>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "10px 16px 12px 20px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
          {word.def && <p style={{ fontSize: ".78rem", color: "var(--text-secondary)", marginBottom: 4 }}>{word.def}</p>}
          {word.example && <p style={{ fontSize: ".75rem", fontStyle: "italic", color: "var(--text-muted)", borderLeft: "2px solid var(--border)", paddingLeft: 8 }}>&ldquo;{word.example}&rdquo;</p>}
          <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: 6 }}>×{word.repCount ?? 0}/{MASTERY_THRESHOLD} · {word.addedDate}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={(e) => { e.stopPropagation(); playWord(word.word, word.audioUrl); }} style={{ fontSize: ".72rem", background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: "var(--text-muted)" }}>🔊 {t("Phát âm", "Play")}</button>
            <button onClick={handleDelete} style={{ fontSize: ".72rem", background: "none", border: "1px solid rgba(224,92,92,0.4)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: "#e05c5c" }}>{t("Xoá", "Delete")}</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Flashcard Modal ──────────────────────────────────────────────────────────

type FlashcardMode = "word_to_meaning" | "meaning_to_word";

function FlashcardModal({
  words,
  studentCode,
  onClose,
  mode = "word_to_meaning",
}: {
  words: VocabWord[];
  studentCode: string;
  onClose: () => void;
  mode?: FlashcardMode;
}) {
  const { t } = useLocale();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const card = words[idx];

  async function handleKnow() {
    setSaving(true);
    const newCount = (card.repCount ?? 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    await updateVocabWord(studentCode, card.id, { repCount: newCount, lastReview: today });
    await awardXp("vocab_review", { wordId: card.id });
    if (newCount >= MASTERY_THRESHOLD && (card.repCount ?? 0) < MASTERY_THRESHOLD) {
      await awardXp("vocab_master", { wordId: card.id });
    }
    setSaving(false);
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  function handleSkip() {
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          width: "100%", maxWidth: 420,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Flashcard {done ? words.length : idx + 1} / {words.length}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-green)", marginBottom: 8 }}>
              {t("Xong! 🎉", "Done! 🎉")}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              {t(`Đã ôn ${words.length} từ.`, `Reviewed ${words.length} words.`)}
            </p>
            <button onClick={onClose} className="journal-btn-primary" style={{ padding: "10px 24px" }}>
              {t("Đóng", "Close")}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Card front */}
            <div
              className="text-center p-6 rounded-lg"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", minHeight: 120 }}
            >
              {mode === "meaning_to_word" ? (
                /* F16: front = meaning/definition */
                <>
                  {card.part && (
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Part {card.part}
                    </span>
                  )}
                  {card.vi && (
                    <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginTop: 8 }}>
                      {card.vi}
                    </p>
                  )}
                  {card.def && (
                    <p className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
                      {card.def}
                    </p>
                  )}
                </>
              ) : (
                /* Default: front = word */
                <>
                  <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {card.word}
                  </p>
                  {card.ipa && (
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      /{card.ipa}/
                    </p>
                  )}
                  {card.pos && (
                    <span className="text-xs font-semibold" style={{ color: POS_COLOR[card.pos] ?? "var(--text-muted)" }}>
                      {card.pos}
                    </span>
                  )}
                  {/* F7: play audio in flashcard */}
                  <button
                    onClick={() => playWord(card.word, card.audioUrl)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", marginTop: 6, display: "block", marginInline: "auto" }}
                    title="Phát âm"
                  >🔊</button>
                </>
              )}
            </div>

            {/* Card reveal / actions */}
            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="w-full journal-btn-outline" style={{ padding: "10px 16px" }}>
                {mode === "meaning_to_word" ? t("Xem từ", "Reveal word") : t("Xem nghĩa", "Reveal meaning")}
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  className="p-4 text-center rounded-lg"
                  style={{ background: "rgba(196,98,45,0.05)", border: "1px solid rgba(196,98,45,0.2)" }}
                >
                  {mode === "meaning_to_word" ? (
                    /* F16: back = word + IPA */
                    <>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {card.word}
                      </p>
                      {card.ipa && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>/{card.ipa}/</p>}
                    </>
                  ) : (
                    /* Default: back = meaning */
                    <>
                      {card.vi && <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{card.vi}</p>}
                      {card.def && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{card.def}</p>}
                      {card.example && <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>"{card.example}"</p>}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSkip} className="flex-1 journal-btn-outline" style={{ padding: "10px 16px" }}>
                    {t("Bỏ qua", "Skip")}
                  </button>
                  <button onClick={handleKnow} disabled={saving} className="flex-1 journal-btn-primary" style={{ padding: "10px 16px" }}>
                    {saving ? "…" : t("Biết rồi +2 XP", "Got it +2 XP")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── F15: Listen-Write Modal ─────────────────────────────────────────────────

function ListenWriteModal({
  words,
  studentCode,
  onClose,
}: {
  words: VocabWord[];
  studentCode: string;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [playing, setPlaying] = useState(false);

  const card = words[idx];

  async function handlePlay() {
    if (playing) return;
    setPlaying(true);
    await playWord(card.word, card.audioUrl).catch(() => {});
    setPlaying(false);
  }

  // Auto-play when card changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { handlePlay(); }, [idx]);

  function advance() {
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setInput("");
      setResult(null);
      // Auto-play next word after a tiny delay
      setTimeout(() => handlePlay(), 300);
    }
  }

  async function handleCheck() {
    if (!input.trim()) return;
    const isCorrect = input.trim().toLowerCase() === card.word.toLowerCase();
    setResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      const newCount = (card.repCount ?? 0) + 1;
      const today = new Date().toISOString().slice(0, 10);
      await updateVocabWord(studentCode, card.id, { repCount: newCount, lastReview: today });
      await awardXp("vocab_review", { wordId: card.id });
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-xl overflow-hidden" style={{ width: "100%", maxWidth: 420, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            🎧 {t("Nghe–viết", "Listen & type")} {done ? words.length : idx + 1}/{words.length}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>✕</button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-green)", marginBottom: 8 }}>
              {t("Xong! 🎉", "Done! 🎉")}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              {t(`Đúng ${correctCount}/${words.length} từ.`, `Correct ${correctCount}/${words.length} words.`)}
            </p>
            <button onClick={onClose} className="journal-btn-primary" style={{ padding: "10px 24px" }}>{t("Đóng", "Close")}</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Play area */}
            <div className="text-center p-6 rounded-lg" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", minHeight: 100 }}>
              <button
                onClick={handlePlay}
                disabled={playing}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl transition-all"
                style={{ background: playing ? "var(--border)" : "var(--orange)", color: "white", border: "none", cursor: playing ? "default" : "pointer" }}
                title={t("Phát âm", "Play")}
              >
                {playing ? "⏳" : "🔊"}
              </button>
              {card.part && (
                <p className="text-xs mt-3 font-semibold" style={{ color: "var(--text-muted)" }}>Part {card.part}</p>
              )}
              {result && (
                <div className="mt-3">
                  <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: result === "correct" ? "var(--accent-green)" : "#e05c5c" }}>
                    {card.word}
                  </p>
                  {card.ipa && <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>/{card.ipa}/</p>}
                </div>
              )}
            </div>

            {/* Input */}
            {!result ? (
              <div className="space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder={t("Gõ từ bạn vừa nghe…", "Type the word you heard…")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCheck(); }}
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
                <button
                  onClick={handleCheck}
                  disabled={!input.trim()}
                  className="w-full journal-btn-primary disabled:opacity-50"
                  style={{ padding: "10px 16px" }}
                >
                  {t("Kiểm tra", "Check")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg text-center" style={{ background: result === "correct" ? "rgba(74,124,89,0.1)" : "rgba(224,92,92,0.1)", border: `1px solid ${result === "correct" ? "rgba(74,124,89,0.3)" : "rgba(224,92,92,0.3)"}` }}>
                  <p className="text-sm font-semibold" style={{ color: result === "correct" ? "var(--accent-green)" : "#e05c5c" }}>
                    {result === "correct" ? t("✓ Đúng! +2 XP", "✓ Correct! +2 XP") : t(`✗ Sai — đáp án: "${card.word}"`, `✗ Wrong — answer: "${card.word}"`)}
                  </p>
                  {card.vi && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{card.vi}</p>}
                </div>
                <button onClick={advance} className="w-full journal-btn-primary" style={{ padding: "10px 16px" }}>
                  {idx + 1 >= words.length ? t("Xem kết quả", "See results") : t("Tiếp theo →", "Next →")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Word Card (Bento style) ──────────────────────────────────────────────────

function WordCard({
  word,
  studentCode,
  todayStr,
}: {
  word: VocabWord;
  studentCode: string;
  todayStr: string;
}) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [repCount, setRepCount] = useState(word.repCount ?? 0);
  const [lastReview, setLastReview] = useState(word.lastReview);
  const [reviewing, setReviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMastered = repCount >= MASTERY_THRESHOLD;
  const due = isWordDue({ ...word, repCount, lastReview }, todayStr);

  async function handleReview(e: React.MouseEvent) {
    e.stopPropagation();
    if (reviewing) return;
    setReviewing(true);
    const newCount = repCount + 1;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await updateVocabWord(studentCode, word.id, { repCount: newCount, lastReview: today });
      setRepCount(newCount);
      setLastReview(today);
      await awardXp("vocab_review", { wordId: word.id });
      if (newCount >= MASTERY_THRESHOLD && repCount < MASTERY_THRESHOLD) {
        await awardXp("vocab_master", { wordId: word.id });
      }
    } finally {
      setReviewing(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Xoá từ "${word.word}"?`)) return;
    setDeleting(true);
    await deleteVocabWord(studentCode, word.id);
  }

  if (deleting) return null;

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="rounded-xl p-4 flex flex-col cursor-pointer transition-all duration-200 overflow-hidden"
      style={{
        background: "var(--bg-primary)",
        border: `1px solid ${due && !isMastered ? "rgba(196,98,45,0.4)" : expanded ? "var(--orange)" : "rgba(196,98,45,0.12)"}`,
        transform: expanded ? "translateY(-2px)" : undefined,
        boxShadow: expanded ? "0 4px 12px rgba(196,98,45,0.12)" : undefined,
        minWidth: 0,
      }}
    >
      {/* Word */}
      <h4
        className="font-bold text-base leading-snug"
        style={{
          fontFamily: "'Lora', Georgia, serif",
          color: "var(--text-primary)",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {word.word}
      </h4>

      {/* IPA + POS on separate line */}
      {(word.ipa || word.pos) && (
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
          {word.ipa && (
            <span style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)", fontStyle: "italic" }}>
              /{word.ipa}/
            </span>
          )}
          {word.pos && (
            <span
              className="font-semibold ml-1"
              style={{ color: POS_COLOR[word.pos] ?? "var(--text-muted)", fontStyle: "normal" }}
            >
              {word.pos}
            </span>
          )}
        </p>
      )}

      {/* Vietnamese meaning */}
      <p className="text-sm mt-1 flex-grow" style={{ color: "var(--text-secondary)" }}>
        {word.vi || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3">
        {isMastered ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded font-bold uppercase"
            style={{ background: "rgba(74,124,89,0.12)", color: "var(--accent-green)" }}
          >
            {t("Thành thạo", "Mastered")} ✓
          </span>
        ) : (
          <span
            className="text-[10px] px-2 py-0.5 rounded font-bold uppercase"
            style={{ background: "rgba(196,98,45,0.1)", color: "var(--orange)" }}
          >
            {t("Chưa ôn", "Not reviewed")}
          </span>
        )}

        {due && !isMastered && (
          <button
            onClick={handleReview}
            disabled={reviewing}
            className="text-[10px] px-2 py-1 rounded font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--orange)" }}
          >
            {reviewing ? "…" : t("Ôn ngay", "Review")}
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="mt-3 pt-3 space-y-1.5 text-xs"
          style={{ borderTop: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {word.def && (
            <p style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginRight: 6 }}>Def</span>
              {word.def}
            </p>
          )}
          {word.example && (
            <p className="italic" style={{ color: "var(--text-muted)", borderLeft: "2px solid var(--border)", paddingLeft: 8 }}>
              "{word.example}"
            </p>
          )}
          <p style={{ color: "var(--text-muted)" }}>
            ×{repCount}/{MASTERY_THRESHOLD} · {word.addedDate}{lastReview ? ` · ${t("Ôn:", "Reviewed:")} ${lastReview}` : ""}
          </p>
          <div className="flex gap-2 pt-1 flex-wrap">
            {/* F7: play pronunciation */}
            <button
              onClick={(e) => { e.stopPropagation(); playWord(word.word, word.audioUrl); }}
              title="Phát âm"
              className="text-[11px]"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px 8px",
                borderRadius: 6,
              }}
            >
              🔊
            </button>
            {!due && !isMastered && (
              <button
                onClick={handleReview}
                disabled={reviewing}
                className="journal-btn-outline text-[11px]"
                style={{ padding: "4px 10px" }}
              >
                {reviewing ? "…" : t(`Ôn lại +2 XP`, `Review +2 XP`)}
              </button>
            )}
            {isMastered && (
              <button
                onClick={handleReview}
                disabled={reviewing}
                className="journal-btn-outline text-[11px]"
                style={{ padding: "4px 10px" }}
              >
                {reviewing ? "…" : t("Ôn lại +2 XP", "Review +2 XP")}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-[11px] ml-auto"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              {t("Xoá", "Delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Part Bento Card ──────────────────────────────────────────────────────────

function PartBentoCard({
  label,
  words,
  studentCode,
  todayStr,
}: {
  label: string;
  words: VocabWord[];
  studentCode: string;
  todayStr: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid rgba(196,98,45,0.08)",
      }}
    >
      <h3
        className="text-base font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--text-primary)" }}
      >
        {label.toUpperCase()}
        <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
          {words.length} từ
        </span>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {words.map((w) => (
          <WordCard key={w.id} word={w} studentCode={studentCode} todayStr={todayStr} />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar: Top Difficult Words ────────────────────────────────────────────

function DifficultWordsSidebar({ words }: { words: VocabWord[] }) {
  const { t } = useLocale();

  // Sort by repCount ascending (least reviewed = most difficult), exclude mastered
  const difficult = useMemo(
    () =>
      [...words]
        .filter((w) => (w.repCount ?? 0) < MASTERY_THRESHOLD)
        .sort((a, b) => (a.repCount ?? 0) - (b.repCount ?? 0))
        .slice(0, 8),
    [words]
  );

  return (
    <aside className="w-full md:w-80 md:shrink-0">
      <div
        className="rounded-xl p-6 sticky top-6"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid rgba(196,98,45,0.08)",
        }}
      >
        <h3
          className="text-base font-bold mb-5"
          style={{ color: "var(--text-primary)" }}
        >
          {t("Từ khó nhất", "Top Difficult Words")}
        </h3>

        {difficult.length === 0 ? (
          <p className="text-sm italic text-center py-4" style={{ color: "var(--text-muted)" }}>
            {t("Chưa có từ nào.", "No words yet.")}
          </p>
        ) : (
          <div className="space-y-4">
            {difficult.map((w) => {
              const pct = Math.round(((w.repCount ?? 0) / MASTERY_THRESHOLD) * 100);
              return (
                <div key={w.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-sm truncate max-w-[60%]" style={{ color: "var(--text-primary)" }}>
                      {w.word}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                      {w.part ? `P${w.part}` : ""} ×{w.repCount ?? 0}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div
                    className="w-full rounded-full"
                    style={{ height: 6, background: "var(--border)" }}
                  >
                    <div
                      className="rounded-full transition-all"
                      style={{
                        height: 6,
                        width: `${Math.max(pct, 4)}%`,
                        background: "var(--orange)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats summary */}
        {words.length > 0 && (
          <div
            className="mt-6 pt-4 grid grid-cols-3 gap-2 text-center"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {[
              { label: t("Tổng", "Total"), value: words.length, color: "var(--text-primary)" },
              {
                label: t("Đến hạn", "Due"),
                value: words.filter((w) => isWordDue(w, new Date().toISOString().slice(0, 10)) && (w.repCount ?? 0) < MASTERY_THRESHOLD).length,
                color: "var(--orange)",
              },
              {
                label: t("Thành thạo", "Mastered"),
                value: words.filter((w) => (w.repCount ?? 0) >= MASTERY_THRESHOLD).length,
                color: "var(--accent-green)",
              },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="text-xl font-bold leading-tight"
                  style={{ fontFamily: "'Lora', Georgia, serif", color: s.color }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VocabPage() {
  const { t } = useLocale();
  const { profile, loading: profileLoading } = useProfile();
  const { words, loading: vocabLoading } = useVocab(profile?.studentCode);
  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [filterDue, setFilterDue] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState<{ mode: FlashcardMode; words: VocabWord[] } | null>(null);
  const [listenWriteWords, setListenWriteWords] = useState<VocabWord[] | null>(null);
  const [inlineIdx, setInlineIdx] = useState(0);
  const [inlineFlipped, setInlineFlipped] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const loading = profileLoading || vocabLoading;

  const dueWords = useMemo(
    () => words.filter((w) => isWordDue(w, todayStr) && (w.repCount ?? 0) < MASTERY_THRESHOLD),
    [words, todayStr]
  );

  const filtered = useMemo(
    () =>
      words.filter((w) => {
        const matchSearch =
          !search ||
          w.word.toLowerCase().includes(search.toLowerCase()) ||
          (w.vi ?? "").toLowerCase().includes(search.toLowerCase());
        const matchPart = selectedPart === null || w.part === selectedPart;
        const matchDue = !filterDue || isWordDue(w, todayStr);
        return matchSearch && matchPart && matchDue;
      }),
    [words, search, selectedPart, filterDue, todayStr]
  );

  // Words for inline flashcard: current part, due words first
  const inlineWords = useMemo(() => {
    const base = selectedPart === null ? words : words.filter((w) => w.part === selectedPart);
    const due = base.filter((w) => isWordDue(w, todayStr) && (w.repCount ?? 0) < MASTERY_THRESHOLD);
    const rest = base.filter((w) => !isWordDue(w, todayStr) || (w.repCount ?? 0) >= MASTERY_THRESHOLD);
    return [...due, ...rest];
  }, [words, selectedPart, todayStr]);

  // Word list: due first, then grouped by part (when all) or flat (when specific part)
  const filteredDue = useMemo(
    () => filtered.filter((w) => isWordDue(w, todayStr) && (w.repCount ?? 0) < MASTERY_THRESHOLD),
    [filtered, todayStr]
  );
  const filteredNotDue = useMemo(
    () => filtered.filter((w) => !isWordDue(w, todayStr) || (w.repCount ?? 0) >= MASTERY_THRESHOLD),
    [filtered, todayStr]
  );
  const groupedNotDue = useMemo(() => {
    if (selectedPart !== null) return [];
    const groups: Record<string, VocabWord[]> = {};
    for (const w of filteredNotDue) {
      const key = w.part ? `Part ${w.part}` : "Khác";
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    }
    const order = [1, 2, 3, 4, 5, 6, 7].map((n) => `Part ${n}`).concat(["Khác"]);
    return order.filter((k) => groups[k]).map((k) => ({ label: k, words: groups[k] }));
  }, [filteredNotDue, selectedPart]);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4 animate-pulse">
          <div className="h-24 rounded-xl" style={{ background: "var(--orange)", opacity: 0.3 }} />
          <div className="h-14 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
            ))}
          </div>
        </div>
        <div className="w-full md:w-80 md:shrink-0">
          <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
        </div>
      </div>
    );
  }

  if (!profile?.studentCode) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-semibold">{t("Chưa có hồ sơ học viên", "No student profile")}</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {t("Tài khoản chưa được liên kết mã học viên.", "Account not linked to a student code.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Quick Add Bar */}
        <QuickAddBar studentCode={profile.studentCode} />

        {/* F11: SRS Status Banner */}
        {dueWords.length > 0 && (
          <section
            className="rounded-xl p-4 flex items-center justify-between gap-3"
            style={{ background: "var(--orange)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-bold text-white">
                {t(`${dueWords.length} từ đến hạn ôn tập hôm nay!`, `${dueWords.length} words due for review today!`)}
              </p>
            </div>
            <button
              onClick={() => setFlashcardMode({ mode: "word_to_meaning", words: dueWords })}
              className="px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors hover:bg-orange-50"
              style={{ background: "white", color: "var(--orange)", flexShrink: 0 }}
            >
              {t("Ôn ngay", "Review now")}
            </button>
          </section>
        )}

        {/* F12: 4-mode Flashcard Picker */}
        {words.length > 0 && (
          <section style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }} className="rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              {t("Chế độ luyện Flashcard", "Flashcard Modes")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Mode 1: SRS due */}
              <button
                onClick={() => setFlashcardMode({ mode: "word_to_meaning", words: dueWords })}
                disabled={dueWords.length === 0}
                style={{
                  padding: ".75rem",
                  border: `1px solid ${dueWords.length > 0 ? "rgba(196,98,45,.35)" : "var(--border)"}`,
                  background: dueWords.length > 0 ? "rgba(196,98,45,.06)" : "var(--bg-primary)",
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: dueWords.length > 0 ? "pointer" : "not-allowed",
                  opacity: dueWords.length > 0 ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#C4622D", marginBottom: ".2rem" }}>
                  ① {t("Đến hạn ôn hôm nay", "Due today")}
                </div>
                <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                  {dueWords.length > 0 ? `${dueWords.length} ${t("từ", "words")}` : t("Không có từ đến hạn", "No due words")}
                </div>
              </button>

              {/* Mode 2: All words */}
              <button
                onClick={() => setFlashcardMode({ mode: "word_to_meaning", words })}
                style={{
                  padding: ".75rem",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#2C1E0F", marginBottom: ".2rem" }}>
                  ② {t("Tất cả từ vựng", "All words")}
                </div>
                <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                  {words.length} {t("từ", "words")} · từ → nghĩa
                </div>
              </button>

              {/* Mode 3: F15 Listen-write (Parts 1–4, enabled via /api/tts) */}
              {(() => {
                const p14 = words.filter((w) => (w.part ?? 0) >= 1 && (w.part ?? 0) <= 4);
                return (
                  <button
                    onClick={() => setListenWriteWords(p14)}
                    disabled={p14.length === 0}
                    style={{
                      padding: ".75rem",
                      border: `1px solid ${p14.length > 0 ? "rgba(40,96,168,.35)" : "var(--border)"}`,
                      background: p14.length > 0 ? "rgba(40,96,168,.06)" : "var(--bg-primary)",
                      borderRadius: 8,
                      textAlign: "left",
                      cursor: p14.length > 0 ? "pointer" : "not-allowed",
                      opacity: p14.length > 0 ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#2860A8", marginBottom: ".2rem" }}>
                      ③ {t("Nghe–viết (P1–4)", "Listen & type (P1–4)")}
                    </div>
                    <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                      {p14.length > 0 ? `${p14.length} ${t("từ", "words")}` : t("Chưa có từ Part 1–4", "No Part 1–4 words")}
                    </div>
                  </button>
                );
              })()}

              {/* Mode 4: Meaning to word (F16) */}
              <button
                onClick={() => setFlashcardMode({ mode: "meaning_to_word", words: words.filter(w => (w.part ?? 0) >= 5) })}
                disabled={words.filter(w => (w.part ?? 0) >= 5).length === 0}
                style={{
                  padding: ".75rem",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: words.filter(w => (w.part ?? 0) >= 5).length > 0 ? "pointer" : "not-allowed",
                  opacity: words.filter(w => (w.part ?? 0) >= 5).length > 0 ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#2C1E0F", marginBottom: ".2rem" }}>
                  ④ {t("Nghĩa → từ (P5–7)", "Meaning → word (P5–7)")}
                </div>
                <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                  {words.filter(w => (w.part ?? 0) >= 5).length} {t("từ", "words")}
                </div>
              </button>
            </div>
          </section>
        )}

        {words.length > 0 && (
          <>
            {/* Part selector pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => { setSelectedPart(null); setInlineIdx(0); setInlineFlipped(false); }}
                style={{
                  fontSize: ".78rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99, cursor: "pointer", transition: "all .15s",
                  background: selectedPart === null ? "var(--orange)" : "var(--bg-elevated)",
                  color: selectedPart === null ? "#fff" : "var(--text-muted)",
                  border: selectedPart === null ? "1px solid var(--orange)" : "1px solid var(--border)",
                }}
              >
                {t("Tất cả", "All")} · {words.length}
              </button>
              {[1, 2, 3, 4, 5, 6, 7].filter((p) => words.some((w) => w.part === p)).map((p) => (
                <button
                  key={p}
                  onClick={() => { setSelectedPart(p); setInlineIdx(0); setInlineFlipped(false); }}
                  style={{
                    fontSize: ".78rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99, cursor: "pointer", transition: "all .15s",
                    background: selectedPart === p ? "var(--orange)" : "var(--bg-elevated)",
                    color: selectedPart === p ? "#fff" : "var(--text-muted)",
                    border: selectedPart === p ? "1px solid var(--orange)" : "1px solid var(--border)",
                  }}
                >
                  P{p} · {words.filter((w) => w.part === p).length}
                </button>
              ))}
            </div>

            {/* Inline Flashcard */}
            {inlineWords.length > 0 && (
              <InlineFlashcard
                words={inlineWords}
                idx={inlineIdx}
                setIdx={setInlineIdx}
                flipped={inlineFlipped}
                setFlipped={setInlineFlipped}
                todayStr={todayStr}
              />
            )}

            {/* Search bar */}
            <section style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="search"
                placeholder={t("Tìm từ trong danh sách…", "Search words…")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, borderRadius: 10, padding: "8px 14px", fontSize: ".85rem", outline: "none", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => setFilterDue((v) => !v)}
                style={{
                  fontSize: ".78rem", fontWeight: 700, padding: "8px 16px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
                  background: filterDue ? "var(--orange)" : "var(--bg-elevated)",
                  color: filterDue ? "white" : "var(--text-muted)",
                  border: filterDue ? "1px solid var(--orange)" : "1px solid var(--border)",
                }}
              >
                {t("Đến hạn", "Due")}
              </button>
            </section>

            {/* Word list */}
            {filtered.length === 0 ? (
              <p style={{ fontSize: ".85rem", textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                {t("Không tìm thấy từ nào.", "No words found.")}
              </p>
            ) : (
              <div style={{ background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* Due section */}
                {filteredDue.length > 0 && (
                  <>
                    <div style={{ padding: "8px 16px", background: "rgba(196,98,45,0.06)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: ".62rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--orange)" }}>⏰ {t("Đến hạn ôn", "Due for review")} · {filteredDue.length}</span>
                    </div>
                    {filteredDue.map((w) => (
                      <WordListRow key={w.id} word={w} studentCode={profile.studentCode!} todayStr={todayStr} />
                    ))}
                  </>
                )}
                {/* Remaining: flat list (specific part) or grouped (all parts) */}
                {selectedPart !== null ? (
                  filteredNotDue.map((w) => (
                    <WordListRow key={w.id} word={w} studentCode={profile.studentCode!} todayStr={todayStr} />
                  ))
                ) : (
                  groupedNotDue.map(({ label, words: gWords }) => (
                    <div key={label}>
                      <div style={{ padding: "8px 16px", background: "var(--bg-primary)", borderTop: filteredDue.length > 0 ? "1px solid var(--border)" : undefined, borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: ".62rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label} · {gWords.length}</span>
                      </div>
                      {gWords.map((w) => (
                        <WordListRow key={w.id} word={w} studentCode={profile.studentCode!} todayStr={todayStr} />
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {words.length === 0 && (
          <div
            className="p-10 text-center rounded-xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <p className="text-4xl mb-3">📖</p>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("Chưa có từ vựng", "No vocabulary yet")}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {t("Thêm từ vựng mới bằng form ở trên.", "Add new words using the form above.")}
            </p>
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <DifficultWordsSidebar words={words} />

      {/* F12/F16: Flashcard modal (multi-mode) */}
      {flashcardMode && (
        <FlashcardModal
          words={flashcardMode.words}
          studentCode={profile.studentCode}
          onClose={() => setFlashcardMode(null)}
          mode={flashcardMode.mode}
        />
      )}

      {/* F15: Listen-write modal */}
      {listenWriteWords && (
        <ListenWriteModal
          words={listenWriteWords}
          studentCode={profile.studentCode}
          onClose={() => setListenWriteWords(null)}
        />
      )}
    </div>
  );
}
