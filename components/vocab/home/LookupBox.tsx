"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  lookupWord,
  quickAddWord,
  type DeckSummary,
  type LexEntry,
  type LookupResponse,
  type WordRow,
} from "@/lib/vocab/client";
import { normalizeWord } from "@/lib/vocab/normalize";
import { LevelBadge, SpeakButton, StatusPill, fmtIpa } from "./shared";

const RECENT_KEY = "vocab:recentLookups";
const DECK_KEY = "vocab:saveDeck";
const VN_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* chế độ riêng tư — bỏ qua */
  }
}

type Phase = { kind: "idle" } | { kind: "loading" } | { kind: "done"; res: LookupResponse } | { kind: "error"; msg: string };

/**
 * Ô tra từ duy nhất của Sổ từ vựng.
 *   - Gõ đến đâu lọc sổ đến đó (không tốn gì).
 *   - Enter mới tra từ điển (có thể gọi AI) — không tra theo từng phím để khỏi
 *     đốt lượt AI cho từ gõ dở như "nego".
 *   - Gõ chữ có dấu tiếng Việt thì tự chuyển sang chiều Việt → Anh.
 */
export default function LookupBox({
  words,
  decks,
  onStudyWord,
}: {
  words: WordRow[];
  decks: DeckSummary[];
  onStudyWord: (w: WordRow) => void;
}) {
  const [q, setQ] = useState("");
  const [dir, setDir] = useState<"en" | "vi">("en");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [recent, setRecent] = useState<string[]>([]);
  const [deckId, setDeckId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ word: string; deckTitle: string } | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setRecent(JSON.parse(readLS(RECENT_KEY) ?? "[]"));
    } catch {
      /* hỏng thì bỏ */
    }
    setDeckId(readLS(DECK_KEY) ?? "");
  }, []);

  // Bộ đã nhớ bị xoá thì quay về mặc định
  const deckValid = !deckId || decks.some((d) => d.id === deckId);
  const deckSel = deckValid ? deckId : "";

  const query = q.trim();
  const byKey = useMemo(() => new Map(words.map((w) => [w.wordKey, w])), [words]);
  const matches = useMemo(() => {
    if (!query) return [];
    const s = query.toLowerCase();
    return words
      .filter((w) => w.word.toLowerCase().includes(s) || (w.meaningVi ?? "").toLowerCase().includes(s))
      .sort((a, b) => Number(b.word.toLowerCase().startsWith(s)) - Number(a.word.toLowerCase().startsWith(s)))
      .slice(0, 5);
  }, [words, query]);

  function onChange(v: string) {
    setQ(v);
    setSaved(null);
    setSaveErr(null);
    if (phase.kind !== "idle") setPhase({ kind: "idle" });
    if (dir === "en" && VN_CHARS.test(v)) setDir("vi");
  }

  async function tra(text = query, d = dir) {
    const t = text.trim();
    if (!t) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setQ(t);
    setDir(d);
    setSaved(null);
    setSaveErr(null);
    setPhase({ kind: "loading" });
    try {
      const res = await lookupWord(t, d, ac.signal);
      setPhase({ kind: "done", res });
      const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6);
      setRecent(next);
      writeLS(RECENT_KEY, JSON.stringify(next));
    } catch (e) {
      if (ac.signal.aborted) return;
      setPhase({ kind: "error", msg: e instanceof Error ? e.message : "Không tra được" });
    }
  }

  function clear() {
    abortRef.current?.abort();
    setQ("");
    setPhase({ kind: "idle" });
    setSaved(null);
    inputRef.current?.focus();
  }

  async function luu(entry: LexEntry) {
    if (saving) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const r = await quickAddWord({
        word: entry.word,
        vi: entry.meaningVi ?? undefined,
        ipa: entry.ipa ?? undefined,
        pos: entry.pos ?? undefined,
        def: entry.definition ?? undefined,
        example: entry.example ?? undefined,
        audioUrl: entry.audioUs ?? entry.audioUk ?? undefined,
        deckId: deckSel || undefined,
      });
      writeLS(DECK_KEY, deckSel);
      setSaved({ word: entry.word, deckTitle: r.deckTitle });
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Không lưu được");
    } finally {
      setSaving(false);
    }
  }

  const res = phase.kind === "done" ? phase.res : null;
  const entry = res && res.dir === "en" && res.found ? res.entry : null;
  const daCo = entry ? byKey.get(normalizeWord(entry.word)) : undefined;
  const deckTitle = (id: string) => decks.find((d) => d.id === id)?.title;

  return (
    <section
      className="rounded-2xl p-3 sm:p-4 flex flex-col gap-3"
      style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)" }}
      aria-label="Tra từ"
    >
      <div className="flex gap-2 items-stretch flex-wrap">
        <div
          className="flex-1 flex items-center gap-2 rounded-xl px-3"
          style={{ background: "var(--bg-primary)", minHeight: 52, flexBasis: 260 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <label htmlFor="vocab-lookup" className="sr-only">Tra từ hoặc tìm trong sổ</label>
          <input
            id="vocab-lookup"
            ref={inputRef}
            value={q}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                tra();
              } else if (e.key === "Escape") clear();
            }}
            placeholder={dir === "en" ? "Tra từ tiếng Anh hoặc tìm trong sổ…" : "Gõ nghĩa tiếng Việt, ví dụ: hợp đồng…"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent outline-none text-base"
            style={{ color: "var(--text-primary)", minHeight: 48 }}
          />
          {q && (
            <button type="button" onClick={clear} aria-label="Xoá ô tìm" className="w-9 h-9 text-lg" style={{ color: "var(--text-muted)" }}>
              ×
            </button>
          )}
        </div>
        <div role="group" aria-label="Chiều tra" className="flex rounded-xl p-1 gap-1" style={{ background: "var(--bg-primary)" }}>
          {(["en", "vi"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dir === d}
              onClick={() => {
                setDir(d);
                if (phase.kind !== "idle") setPhase({ kind: "idle" });
              }}
              className="px-3 rounded-lg text-sm font-semibold"
              style={
                dir === d
                  ? { background: "var(--bg-elevated)", color: "var(--text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,.08)" }
                  : { color: "var(--text-muted)" }
              }
            >
              {d === "en" ? "Anh → Việt" : "Việt → Anh"}
            </button>
          ))}
        </div>
      </div>

      {!query && (
        <div className="flex gap-2 items-center flex-wrap text-xs" style={{ color: "var(--text-muted)" }}>
          {recent.length > 0 ? (
            <>
              <span>Tra gần đây:</span>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => tra(r, VN_CHARS.test(r) ? "vi" : "en")}
                  className="px-2.5 py-1 rounded-full"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  {r}
                </button>
              ))}
            </>
          ) : (
            <span>Gõ là lọc sổ ngay · nhấn Enter để tra từ điển · gõ tiếng Việt có dấu để tra ngược</span>
          )}
        </div>
      )}

      {query && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
          {/* Trong sổ */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Trong sổ của bạn · {matches.length}
            </p>
            {matches.length === 0 ? (
              <p className="text-sm rounded-xl p-3" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                Chưa có từ nào khớp “{query}”.
              </p>
            ) : (
              matches.map((w) => (
                <div key={w.wordKey} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg-primary)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ fontFamily: "Lora, serif", color: "var(--text-primary)" }}>{w.word}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{w.meaningVi ?? "—"}</p>
                  </div>
                  <StatusPill w={w} short />
                  <button
                    type="button"
                    onClick={() => onStudyWord(w)}
                    className="text-xs font-semibold px-3 rounded-lg"
                    style={{ minHeight: 36, border: "1px solid var(--accent-primary)", color: "var(--accent-primary)" }}
                  >
                    Ôn
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Từ điển */}
          <div className="flex flex-col gap-2" aria-live="polite">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {dir === "en" ? "Từ điển" : `Tiếng Anh của “${query}”`}
            </p>

            {phase.kind === "idle" && (
              <button
                type="button"
                onClick={() => tra()}
                className="rounded-xl p-3 text-sm text-left"
                style={{ border: "1px dashed var(--border)", color: "var(--text-muted)", minHeight: 48 }}
              >
                Nhấn <b style={{ color: "var(--text-primary)" }}>Enter</b> hoặc bấm đây để tra “{query}”
              </button>
            )}

            {phase.kind === "loading" && (
              <div className="rounded-xl p-4 animate-pulse space-y-2" style={{ background: "var(--bg-primary)" }}>
                <div className="h-6 w-1/2 rounded" style={{ background: "var(--border)" }} />
                <div className="h-4 w-3/4 rounded" style={{ background: "var(--border)" }} />
                <div className="h-4 w-2/3 rounded" style={{ background: "var(--border)" }} />
              </div>
            )}

            {phase.kind === "error" && (
              <p className="text-sm rounded-xl p-3" style={{ background: "rgba(185,64,64,.1)", color: "var(--accent-red, #B94040)" }}>
                {phase.msg}
              </p>
            )}

            {res && res.dir === "en" && !res.found && (
              <p className="text-sm rounded-xl p-3" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>{res.reason}</p>
            )}
            {res && res.dir === "vi" && !res.ok && (
              <p className="text-sm rounded-xl p-3" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>{res.reason}</p>
            )}

            {res && res.dir === "vi" && res.ok && (
              res.candidates.length === 0 ? (
                <p className="text-sm rounded-xl p-3" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>Không tìm được từ phù hợp.</p>
              ) : (
                res.candidates.map((c) => {
                  const own = byKey.get(normalizeWord(c.word));
                  return (
                    <div key={c.word} className="flex items-center gap-2 rounded-xl p-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-lg" style={{ fontFamily: "Lora, serif", color: "var(--text-primary)" }}>{c.word}</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.pos}</span>
                          <LevelBadge level={c.level} />
                        </p>
                        {c.note && <p className="text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>{c.note}</p>}
                      </div>
                      {own ? (
                        <StatusPill w={own} short />
                      ) : (
                        <button
                          type="button"
                          onClick={() => tra(c.word, "en")}
                          className="text-sm font-semibold px-3 rounded-lg"
                          style={{ minHeight: 40, border: "1px solid var(--accent-primary)", color: "var(--accent-primary)" }}
                        >
                          Xem & lưu
                        </button>
                      )}
                    </div>
                  );
                })
              )
            )}

            {entry && (
              <div className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold" style={{ fontFamily: "Lora, serif", color: "var(--text-primary)" }}>{entry.word}</span>
                  {fmtIpa(entry.ipa) && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{fmtIpa(entry.ipa)}</span>}
                  {entry.pos && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                      {entry.pos}
                    </span>
                  )}
                  <LevelBadge level={entry.level} prefix />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {entry.audioUk && <SpeakButton word={entry.word} audioUrl={entry.audioUk} label="UK" size={36} />}
                  <SpeakButton word={entry.word} audioUrl={entry.audioUs} label={entry.audioUk ? "US" : "Nghe"} size={36} />
                </div>
                {entry.meaningVi && <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{entry.meaningVi}</p>}
                {entry.example && <p className="text-sm italic" style={{ color: "var(--text-primary)" }}>“{entry.example}”</p>}
                {(entry.collocations.length > 0 || entry.family.length > 0) && (
                  <div className="grid gap-3 text-sm" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                    {entry.collocations.length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>Cụm hay gặp trong đề</p>
                        {entry.collocations.map((c) => (
                          <p key={c} style={{ color: "var(--text-primary)" }}>{c}</p>
                        ))}
                      </div>
                    )}
                    {entry.family.length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>Họ từ</p>
                        {entry.family.map((c) => (
                          <p key={c} style={{ color: "var(--text-primary)" }}>{c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {res && res.dir === "en" && res.found && res.aiNote && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{res.aiNote}</p>
                )}

                <div className="h-px" style={{ background: "var(--border)" }} />

                {saved ? (
                  <p className="text-sm font-semibold" style={{ color: "var(--accent-green)" }}>
                    ✓ Đã lưu vào “{saved.deckTitle}” · có trong lượt ôn hôm nay
                  </p>
                ) : daCo ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold flex-1" style={{ color: "var(--accent-green)" }}>
                      Đã có trong sổ{daCo.deckIds[0] && deckTitle(daCo.deckIds[0]) ? ` · ${deckTitle(daCo.deckIds[0])}` : ""}
                    </span>
                    <StatusPill w={daCo} />
                    <button
                      type="button"
                      onClick={() => onStudyWord(daCo)}
                      className="px-4 rounded-lg text-sm font-bold"
                      style={{ minHeight: 44, background: "var(--accent-primary)", color: "#fff" }}
                    >
                      Ôn từ này
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <label htmlFor="vocab-save-deck" className="text-sm" style={{ color: "var(--text-muted)" }}>Lưu vào</label>
                    <select
                      id="vocab-save-deck"
                      value={deckSel}
                      onChange={(e) => setDeckId(e.target.value)}
                      className="rounded-lg px-2 text-sm flex-1"
                      style={{ minHeight: 44, minWidth: 140, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                    >
                      <option value="">Từ mới (mặc định)</option>
                      {decks
                        .filter((d) => d.title !== "Từ mới")
                        .map((d) => (
                          <option key={d.id} value={d.id}>{d.title}</option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => luu(entry)}
                      disabled={saving}
                      className="px-5 rounded-lg text-sm font-bold disabled:opacity-60"
                      style={{ minHeight: 44, background: "var(--accent-primary)", color: "#fff" }}
                    >
                      {saving ? "Đang lưu…" : "Lưu từ"}
                    </button>
                  </div>
                )}
                {saveErr && <p className="text-sm" style={{ color: "var(--accent-red, #B94040)" }}>{saveErr}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
