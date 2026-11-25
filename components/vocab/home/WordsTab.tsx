"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createDeck,
  deleteWord,
  quickAddWord,
  wordIsDue,
  type DeckSummary,
  type WordRow,
} from "@/lib/vocab/client";
import {
  LEVELS,
  LevelBadge,
  SpeakButton,
  StatusPill,
  chipStyle,
  fmtIpa,
  isLeech,
  levelLabel,
  statusOf,
} from "./shared";

const PER_PAGE = 20;

type StatusFilter = "all" | "due" | "learning" | "mastered" | "leech";
type Sort = "due" | "recent" | "az" | "leech";

const SORTS: { id: Sort; label: string }[] = [
  { id: "due", label: "Đến hạn trước" },
  { id: "recent", label: "Mới lưu" },
  { id: "az", label: "A → Z" },
  { id: "leech", label: "Hay quên nhất" },
];

/** Danh sách trang: 1 … 4 5 6 … 12 */
function pageList(n: number, cur: number): (number | "…")[] {
  if (n <= 7) return Array.from({ length: n }, (_, i) => i);
  const out: (number | "…")[] = [0];
  const from = Math.max(1, cur - 1);
  const to = Math.min(n - 2, cur + 1);
  if (from > 1) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < n - 2) out.push("…");
  out.push(n - 1);
  return out;
}

export default function WordsTab({
  words,
  decks,
  onStudy,
}: {
  words: WordRow[];
  decks: DeckSummary[];
  onStudy: (words: WordRow[]) => void;
}) {
  const [st, setSt] = useState<StatusFilter>("all");
  const [lv, setLv] = useState<string>("all");
  const [part, setPart] = useState<string>("all");
  const [deck, setDeck] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("due");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | "add" | "create">(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);

  const counts = useMemo(
    () => ({
      due: words.filter(wordIsDue).length,
      learning: words.filter((w) => statusOf(w) === "learning").length,
      mastered: words.filter((w) => w.mastered).length,
      leech: words.filter(isLeech).length,
    }),
    [words]
  );
  const parts = useMemo(() => [...new Set(words.map((w) => w.part).filter((p): p is number => !!p))].sort(), [words]);

  const filtered = useMemo(() => {
    const f = words.filter(
      (w) =>
        (st === "all" ||
          (st === "due" && wordIsDue(w)) ||
          (st === "learning" && statusOf(w) === "learning") ||
          (st === "mastered" && w.mastered) ||
          (st === "leech" && isLeech(w))) &&
        (lv === "all" || w.level === lv) &&
        (part === "all" || String(w.part) === part) &&
        (deck === "all" || w.deckIds.includes(deck))
    );
    const dueTime = (w: WordRow) => (w.mastered ? Infinity : w.dueAt ? new Date(w.dueAt).getTime() : 0);
    return f.sort((a, b) =>
      sort === "az"
        ? a.word.localeCompare(b.word)
        : sort === "recent"
          ? b.addedDate.localeCompare(a.addedDate)
          : sort === "leech"
            ? b.wrongCount - a.wrongCount
            : dueTime(a) - dueTime(b)
    );
  }, [words, st, lv, part, deck, sort]);

  const nPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, nPages - 1);
  const rows = filtered.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);

  // Bỏ chọn những từ đã biến mất (vừa xoá)
  useEffect(() => {
    setSel((s) => {
      const keys = new Set(words.map((w) => w.wordKey));
      const n = new Set([...s].filter((k) => keys.has(k)));
      return n.size === s.size ? s : n;
    });
  }, [words]);

  const selWords = words.filter((w) => sel.has(w.wordKey));
  const toggle = (k: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const allOnPage = rows.length > 0 && rows.every((w) => sel.has(w.wordKey));
  const togglePage = () =>
    setSel((s) => {
      const n = new Set(s);
      rows.forEach((w) => (allOnPage ? n.delete(w.wordKey) : n.add(w.wordKey)));
      return n;
    });

  const setFilter = (fn: () => void) => {
    fn();
    setPage(0);
  };

  async function xoa(list: WordRow[]) {
    const ten = list.length === 1 ? `“${list[0].word}”` : `${list.length} từ`;
    if (!window.confirm(`Xoá ${ten} khỏi sổ? Từ sẽ bị gỡ khỏi mọi bộ và mất tiến độ ôn.`)) return;
    setBusy(true);
    let loi = 0;
    for (const w of list) {
      try {
        await deleteWord(w.word);
      } catch {
        loi++;
      }
    }
    setBusy(false);
    setSel(new Set());
    setMsg(loi ? { text: `Không xoá được ${loi} từ.`, err: true } : { text: `Đã xoá ${ten}.` });
  }

  async function themVaoBo(deckId: string) {
    setBusy(true);
    let them = 0;
    let trung = 0;
    for (const w of selWords) {
      try {
        await quickAddWord({
          word: w.word,
          vi: w.meaningVi ?? undefined,
          ipa: w.ipa ?? undefined,
          pos: w.pos ?? undefined,
          def: w.definition ?? undefined,
          example: w.example ?? undefined,
          audioUrl: w.audioUrl ?? undefined,
          deckId,
        });
        them++;
      } catch {
        trung++;
      }
    }
    setBusy(false);
    setDialog(null);
    setSel(new Set());
    const ten = decks.find((d) => d.id === deckId)?.title ?? "bộ";
    setMsg({ text: `Đã thêm ${them} từ vào “${ten}”${trung ? ` · ${trung} từ đã có sẵn` : ""}.` });
  }

  async function taoBo(title: string) {
    setBusy(true);
    try {
      await createDeck({
        title,
        source: "manual",
        cards: selWords.map((w) => ({
          word: w.word,
          meaningVi: w.meaningVi ?? undefined,
          ipa: w.ipa ?? undefined,
          pos: w.pos ?? undefined,
          definition: w.definition ?? undefined,
          example: w.example ?? undefined,
          imageUrl: w.imageUrl ?? undefined,
          audioUrl: w.audioUrl ?? undefined,
        })),
      });
      window.dispatchEvent(new Event("decks:changed"));
      window.dispatchEvent(new Event("vocab:changed"));
      setMsg({ text: `Đã tạo bộ “${title}” với ${selWords.length} từ.` });
      setSel(new Set());
      setDialog(null);
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Không tạo được bộ", err: true });
    } finally {
      setBusy(false);
    }
  }

  const deckTitle = (id: string) => decks.find((d) => d.id === id)?.title;
  const selectStyle: React.CSSProperties = {
    minHeight: 40,
    border: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Bộ lọc */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="Lọc theo trạng thái">
        {(
          [
            ["all", `Tất cả · ${words.length}`],
            ["due", `Đến hạn · ${counts.due}`],
            ["learning", `Đang học · ${counts.learning}`],
            ["mastered", `Đã thuộc · ${counts.mastered}`],
            ["leech", `Hay quên · ${counts.leech}`],
          ] as [StatusFilter, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={st === k}
            onClick={() => setFilter(() => setSt(k))}
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold"
            style={{ minHeight: 38, ...chipStyle(st === k) }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Lọc theo cấp độ">
          {["all", ...LEVELS].map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lv === l}
              onClick={() => setFilter(() => setLv(l))}
              className="rounded-full px-3 text-xs font-semibold"
              style={{ minHeight: 34, ...chipStyle(lv === l) }}
            >
              {l === "all" ? "Mọi cấp" : levelLabel(l)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap sm:ml-auto">
          <select aria-label="Lọc theo Part" value={part} onChange={(e) => setFilter(() => setPart(e.target.value))} className="rounded-lg px-2 text-sm" style={selectStyle}>
            <option value="all">Mọi Part</option>
            {parts.map((p) => (
              <option key={p} value={String(p)}>Part {p}</option>
            ))}
          </select>
          <select aria-label="Lọc theo bộ" value={deck} onChange={(e) => setFilter(() => setDeck(e.target.value))} className="rounded-lg px-2 text-sm" style={{ ...selectStyle, maxWidth: 170 }}>
            <option value="all">Mọi bộ</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <select aria-label="Sắp xếp" value={sort} onChange={(e) => setFilter(() => setSort(e.target.value as Sort))} className="rounded-lg px-2 text-sm" style={selectStyle}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {msg && (
        <p
          role="status"
          className="text-sm rounded-xl px-3 py-2 flex items-center gap-2"
          style={msg.err ? { background: "rgba(185,64,64,.1)", color: "var(--accent-red, #B94040)" } : { background: "rgba(74,124,89,.12)", color: "var(--accent-green)" }}
        >
          <span className="flex-1">{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} aria-label="Đóng thông báo" className="px-2">×</button>
        </p>
      )}

      {/* Thanh thao tác hàng loạt */}
      {sel.size > 0 && (
        <div className="sticky top-2 z-10 flex items-center gap-2 flex-wrap rounded-xl px-3 py-2" style={{ background: "#2F5D80", color: "#fff" }}>
          <span className="text-sm font-semibold mr-auto">{sel.size} từ đã chọn</span>
          <button type="button" onClick={() => onStudy(selWords)} className="rounded-lg px-3 text-sm font-bold" style={{ minHeight: 38, background: "#fff", color: "#2F5D80" }}>
            Học các từ này
          </button>
          <button type="button" disabled={busy} onClick={() => setDialog("add")} className="rounded-lg px-3 text-sm font-semibold" style={{ minHeight: 38, border: "1px solid #fff" }}>
            Thêm vào bộ…
          </button>
          <button type="button" disabled={busy} onClick={() => setDialog("create")} className="rounded-lg px-3 text-sm font-semibold" style={{ minHeight: 38, border: "1px solid #fff" }}>
            Tạo bộ mới
          </button>
          <button type="button" disabled={busy} onClick={() => xoa(selWords)} className="rounded-lg px-2 text-sm underline" style={{ minHeight: 38 }}>
            Xoá
          </button>
          <button type="button" onClick={() => setSel(new Set())} className="rounded-lg px-2 text-sm" style={{ minHeight: 38 }}>
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Danh sách */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <div
          className="hidden md:grid items-center gap-x-2 px-3 py-2 text-xs font-bold uppercase tracking-wider md:grid-cols-[36px_1.3fr_1.6fr_64px_160px_44px]"
          style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
        >
          <input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Chọn cả trang" className="w-5 h-5" style={{ accentColor: "#2F5D80" }} />
          <span>Từ</span>
          <span>Nghĩa</span>
          <span>Cấp</span>
          <span>Trạng thái</span>
          <span />
        </div>

        {rows.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>
            {words.length === 0 ? "Sổ còn trống — tra một từ ở ô phía trên rồi bấm Lưu." : "Không có từ nào khớp bộ lọc."}
          </p>
        )}

        {rows.map((w) => {
          const isOpen = open === w.wordKey;
          const ipa = fmtIpa(w.ipa);
          return (
            <div key={w.wordKey} style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="grid items-center gap-x-2 px-3 py-2 cursor-pointer grid-cols-[32px_1fr_auto_44px] md:grid-cols-[36px_1.3fr_1.6fr_64px_160px_44px]"
                style={{ minHeight: 60 }}
                onClick={() => setOpen(isOpen ? null : w.wordKey)}
              >
                <input
                  type="checkbox"
                  checked={sel.has(w.wordKey)}
                  onChange={() => toggle(w.wordKey)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Chọn ${w.word}`}
                  className="w-5 h-5"
                  style={{ accentColor: "#2F5D80" }}
                />
                <div className="min-w-0">
                  <p className="flex items-baseline gap-1.5 min-w-0">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(isOpen ? null : w.wordKey);
                      }}
                      className="font-bold text-base truncate text-left"
                      style={{ fontFamily: "Lora, serif", color: "var(--text-primary)" }}
                    >
                      {w.word}
                    </button>
                    <span className="md:hidden"><LevelBadge level={w.level} /></span>
                  </p>
                  <p className="text-xs truncate md:hidden" style={{ color: "var(--text-muted)" }}>{w.meaningVi ?? "—"}</p>
                  <p className="text-xs truncate hidden md:block" style={{ color: "var(--text-muted)" }}>
                    {[ipa, w.pos, w.part ? `P${w.part}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="hidden md:block text-sm" style={{ color: "var(--text-primary)" }}>{w.meaningVi ?? "—"}</p>
                <span className="hidden md:block"><LevelBadge level={w.level} /></span>
                <div className="flex flex-col items-end md:items-start gap-0.5">
                  <span className="md:hidden"><StatusPill w={w} short /></span>
                  <span className="hidden md:inline"><StatusPill w={w} /></span>
                  {isLeech(w) && (
                    <span className="text-[11px] font-semibold" style={{ color: "var(--accent-red, #B94040)" }}>
                      Hay quên · sai {w.wrongCount}
                    </span>
                  )}
                </div>
                <SpeakButton word={w.word} audioUrl={w.audioUrl} />
              </div>

              {isOpen && (
                <div className="px-4 pb-3 pt-1 flex flex-col gap-2 text-sm md:pl-12" style={{ color: "var(--text-primary)" }}>
                  {ipa && <p className="md:hidden" style={{ color: "var(--text-muted)" }}>{ipa}{w.pos ? ` · ${w.pos}` : ""}</p>}
                  {w.definition && <p style={{ color: "var(--text-muted)" }}>{w.definition}</p>}
                  {w.example && <p className="italic">“{w.example}”</p>}
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Lưu ngày {w.addedDate}
                    {w.deckIds.length > 0 && ` · Bộ: ${w.deckIds.map(deckTitle).filter(Boolean).join(", ")}`}
                    {w.seenCount > 0 && ` · đã ôn ${w.seenCount} lần, sai ${w.wrongCount}`}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => onStudy([w])} className="rounded-lg px-4 text-sm font-bold" style={{ minHeight: 40, background: "var(--accent-primary)", color: "#fff" }}>
                      Ôn từ này
                    </button>
                    {w.deckIds[0] && (
                      <Link href={`/journal/vocab/decks/${w.deckIds[0]}`} className="rounded-lg px-4 text-sm font-semibold flex items-center" style={{ minHeight: 40, border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                        Mở bộ chứa từ
                      </Link>
                    )}
                    <button type="button" onClick={() => xoa([w])} disabled={busy} className="rounded-lg px-4 text-sm font-semibold" style={{ minHeight: 40, color: "var(--accent-red, #B94040)" }}>
                      Xoá khỏi sổ
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Phân trang */}
      {filtered.length > 0 && (
        <nav className="flex items-center gap-2 flex-wrap" aria-label="Phân trang">
          <span className="text-sm mr-auto" style={{ color: "var(--text-muted)" }}>
            {cur * PER_PAGE + 1}–{Math.min(filtered.length, cur * PER_PAGE + PER_PAGE)} trong {filtered.length} từ
          </span>
          {nPages > 1 && (
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setPage(Math.max(0, cur - 1))} disabled={cur === 0} aria-label="Trang trước" className="w-10 h-10 rounded-lg disabled:opacity-40" style={chipStyle(false)}>‹</button>
              {pageList(nPages, cur).map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="w-6 text-center self-center" style={{ color: "var(--text-muted)" }}>…</span>
                ) : (
                  <button key={p} type="button" onClick={() => setPage(p)} aria-current={p === cur ? "page" : undefined} className="w-10 h-10 rounded-lg text-sm font-bold" style={chipStyle(p === cur)}>
                    {p + 1}
                  </button>
                )
              )}
              <button type="button" onClick={() => setPage(Math.min(nPages - 1, cur + 1))} disabled={cur === nPages - 1} aria-label="Trang sau" className="w-10 h-10 rounded-lg disabled:opacity-40" style={chipStyle(false)}>›</button>
            </div>
          )}
        </nav>
      )}

      {dialog && (
        <DeckDialog
          mode={dialog}
          count={selWords.length}
          decks={decks}
          busy={busy}
          onClose={() => setDialog(null)}
          onAdd={themVaoBo}
          onCreate={taoBo}
        />
      )}
    </div>
  );
}

function DeckDialog({
  mode,
  count,
  decks,
  busy,
  onClose,
  onAdd,
  onCreate,
}: {
  mode: "add" | "create";
  count: number;
  decks: DeckSummary[];
  busy: boolean;
  onClose: () => void;
  onAdd: (deckId: string) => void;
  onCreate: (title: string) => void;
}) {
  const [deckId, setDeckId] = useState(decks[0]?.id ?? "");
  const [title, setTitle] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(43,33,24,.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "add" ? "Thêm vào bộ" : "Tạo bộ mới"}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
      >
        <p className="text-lg font-bold">{mode === "add" ? `Thêm ${count} từ vào bộ` : `Tạo bộ mới từ ${count} từ`}</p>
        {mode === "add" ? (
          decks.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bạn chưa có bộ nào — chọn “Tạo bộ mới” thay vào đó.</p>
          ) : (
            <select value={deckId} onChange={(e) => setDeckId(e.target.value)} aria-label="Chọn bộ" className="rounded-lg px-3" style={{ minHeight: 48, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>{d.title} · {d.cardCount} thẻ</option>
              ))}
            </select>
          )
        ) : (
          <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Tên bộ
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Từ hay quên tuần này"
              maxLength={120}
              className="rounded-lg px-3 text-base font-normal"
              style={{ minHeight: 48, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
            />
          </label>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg px-4 text-sm font-semibold" style={{ minHeight: 44, color: "var(--text-muted)" }}>Huỷ</button>
          <button
            type="button"
            disabled={busy || (mode === "add" ? !deckId : !title.trim())}
            onClick={() => (mode === "add" ? onAdd(deckId) : onCreate(title.trim()))}
            className="rounded-lg px-5 text-sm font-bold disabled:opacity-50"
            style={{ minHeight: 44, background: "var(--accent-primary)", color: "#fff" }}
          >
            {busy ? "Đang lưu…" : mode === "add" ? "Thêm" : "Tạo bộ"}
          </button>
        </div>
      </div>
    </div>
  );
}
