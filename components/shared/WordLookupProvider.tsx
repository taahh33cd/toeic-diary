"use client";

import { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { listDecks, lookupWord, quickAddWord, type DeckSummary, type LookupResponse } from "@/lib/vocab/client";
import { playWord } from "@/lib/vocab/audio";
import { getWordLookupSuppressed, subscribeWordLookupSuppressed } from "./word-lookup-suppress";

/**
 * Bôi đen (máy tính) hoặc chạm đúp (điện thoại) vào một từ tiếng Anh ở BẤT KỲ
 * trang học nào → tra nghĩa → lưu thẳng vào Sổ từ vựng (Postgres), kèm câu gốc
 * và link bài để trong sổ hiện "Gặp trong: …".
 *
 * Bật mặc định toàn site. Tắt ở:
 *   - trang không phải để học (đăng nhập, quản trị…) — TAT_O
 *   - lúc đang làm bài thi/quiz, kẻo tra từ là lộ đáp án — trang đó đặt <WordLookupOff />
 *   - lúc công cụ ghi chú (Annotate) đang cầm bút — word-lookup-suppress
 */

// ── Tắt theo trang ──────────────────────────────────────────────────────────

const OffCtx = createContext<React.Dispatch<React.SetStateAction<number>> | null>(null);

/** Đặt vào trang/màn đang làm bài để tạm tắt tra từ (vd. đang thi, đang quiz). */
export function WordLookupOff() {
  const set = useContext(OffCtx);
  useEffect(() => {
    set?.((n) => n + 1);
    return () => set?.((n) => n - 1);
  }, [set]);
  return null;
}

const TAT_O = /^\/(auth|admin|dev|invite|offline)(\/|$)/;

const DECK_KEY = "vocab:saveDeck";

// ── Helpers ─────────────────────────────────────────────────────────────────

function trongONhap(node: Node | null): boolean {
  const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element | null);
  return !!el?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true'], [data-no-lookup]");
}

function normalizeQuery(raw: string): string {
  return raw.replace(/[^a-zA-Z\s'’-]/g, "").replace(/’/g, "'").trim().replace(/\s+/g, " ");
}

function isValidQuery(text: string): boolean {
  if (!text || text.length < 2) return false;
  const n = text.split(" ").filter(Boolean).length;
  return n >= 1 && n <= 4;
}

/** Câu chứa từ được bôi — làm ví dụ "gặp trong bài". */
function cauChua(node: Node, text: string): string | undefined {
  const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element))?.closest(
    "p, li, td, th, blockquote, dd, h1, h2, h3, h4, h5, h6, div, span"
  );
  const full = (el?.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!full) return undefined;
  const cau = full.split(/(?<=[.!?])\s+/).find((c) => c.toLowerCase().includes(text.toLowerCase())) ?? full;
  const s = cau.trim().slice(0, 300);
  return s.split(" ").length >= 4 && s.toLowerCase() !== text.toLowerCase() ? s : undefined;
}

/** Bài đang học: đường dẫn nội bộ + tên bài. */
function nguon(): { url: string; label: string } {
  const label = (document.querySelector("main h1, h1")?.textContent || document.title || "").replace(/\s+/g, " ").trim();
  return { url: (location.pathname + location.search).slice(0, 300), label: label.slice(0, 120) };
}

/** Từ nằm dưới điểm chạm — dùng cho chạm đúp trên điện thoại. */
function tuTaiDiem(x: number, y: number): Range | null {
  type CaretPos = { offsetNode: Node; offset: number };
  const d = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => CaretPos | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  let node: Node | null = null;
  let off = 0;
  const pos = d.caretPositionFromPoint?.(x, y);
  if (pos) {
    node = pos.offsetNode;
    off = pos.offset;
  } else {
    const r = d.caretRangeFromPoint?.(x, y);
    if (r) {
      node = r.startContainer;
      off = r.startOffset;
    }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const s = node.textContent ?? "";
  const laChu = (c: string) => /[A-Za-z'’-]/.test(c);
  let a = off;
  let b = off;
  while (a > 0 && laChu(s[a - 1])) a--;
  while (b < s.length && laChu(s[b])) b++;
  if (b - a < 2) return null;
  const range = document.createRange();
  range.setStart(node, a);
  range.setEnd(node, b);
  return range;
}

// ── Types ───────────────────────────────────────────────────────────────────

interface SelectionState {
  /** Trang + trạng thái bật lúc chọn — đổi trang thì vùng chọn cũ tự ẩn */
  k: string;
  text: string;
  cx: number; // tâm ngang của vùng chọn (viewport)
  top: number; // mép trên vùng chọn (viewport)
  bottom: number;
  context?: string;
}

interface AccessResult {
  canUse: boolean;
  reason: string;
}

// ── Provider ────────────────────────────────────────────────────────────────

const khongDoi = () => () => undefined;

export function WordLookupProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [offCount, setOffCount] = useState(0);
  // Annotate đang cầm công cụ → nhả selection cho nó
  const suppressed = useSyncExternalStore(subscribeWordLookupSuppressed, getWordLookupSuppressed, () => false);
  const enabled = !TAT_O.test(pathname) && offCount === 0 && !suppressed;

  const [sel, setSel] = useState<SelectionState | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupOpenRef = useRef(false);
  const iconRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(khongDoi, () => true, () => false);
  const [access, setAccess] = useState<AccessResult | null>(null);
  const key = `${pathname}|${enabled}`;
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    if (!enabled || access) return;
    fetch("/api/vocab/access")
      .then((r) => r.json() as Promise<AccessResult>)
      .then(setAccess)
      .catch(() => setAccess({ canUse: true, reason: "ok" })); // mạng lỗi thì cho qua
  }, [enabled, access]);

  useEffect(() => {
    popupOpenRef.current = popupOpen;
  }, [popupOpen]);

  const dismiss = useCallback(() => {
    setSel(null);
    setPopupOpen(false);
  }, []);

  useEffect(() => {
    if (!mounted || !enabled) return;

    function tuRange(range: Range, text: string, moNgay: boolean) {
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      setSel({ k: keyRef.current, text, cx: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom, context: cauChua(range.startContainer, text) });
      setPopupOpen(moNgay);
    }

    function tryCapture() {
      if (popupOpenRef.current) return;
      const s = window.getSelection();
      if (!s || s.isCollapsed || !s.rangeCount) return;
      const text = normalizeQuery(s.toString().trim());
      if (!isValidQuery(text)) return;
      if (trongONhap(s.anchorNode)) return;
      try {
        tuRange(s.getRangeAt(0), text, false);
      } catch {
        /* range đã rời DOM */
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (iconRef.current?.contains(e.target as Node)) return;
      if (popupRef.current?.contains(e.target as Node)) return;
      setTimeout(tryCapture, 10);
    };

    // Điện thoại: chạm đúp vào một từ thì tra ngay; nhấn giữ để bôi đen vẫn dùng được
    let lanCham: { t: number; x: number; y: number } | null = null;
    // Lượt dò vùng chọn hẹn từ cú chạm trước — phải huỷ khi nhận ra chạm đúp,
    // kẻo nó chạy sau và đóng popup vừa mở thành nút "Tra nghĩa".
    let henGio: ReturnType<typeof setTimeout> | undefined;
    const onTouchEnd = (e: TouchEvent) => {
      if (popupRef.current?.contains(e.target as Node) || iconRef.current?.contains(e.target as Node)) return;
      const t = e.changedTouches[0];
      if (!t || e.touches.length > 0) return;
      const now = Date.now();
      if (lanCham && now - lanCham.t < 320 && Math.hypot(t.clientX - lanCham.x, t.clientY - lanCham.y) < 30) {
        lanCham = null;
        clearTimeout(henGio);
        const target = document.elementFromPoint(t.clientX, t.clientY);
        if (!target || target.closest("a, button, label, input, textarea, select, [contenteditable='true'], [data-no-lookup]")) return;
        const range = tuTaiDiem(t.clientX, t.clientY);
        if (!range) return;
        const text = normalizeQuery(range.toString());
        if (!isValidQuery(text)) return;
        e.preventDefault();
        const s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(range);
        tuRange(range, text, true);
        return;
      }
      lanCham = { t: now, x: t.clientX, y: t.clientY };
      henGio = setTimeout(tryCapture, 150);
    };

    const onDocClick = (e: MouseEvent) => {
      if (popupOpenRef.current) return; // popup tự đóng qua lớp nền
      if (iconRef.current?.contains(e.target as Node)) return;
      if (window.getSelection()?.isCollapsed) setSel(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    const onScroll = () => {
      if (!popupOpenRef.current) setSel(null);
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
      clearTimeout(henGio);
    };
  }, [mounted, enabled, dismiss]);

  // Đổi trang hoặc bị tắt thì vùng chọn cũ không còn hiện
  const show = mounted && enabled && sel && sel.k === key;

  return (
    <OffCtx.Provider value={setOffCount}>
      {children}
      {show && !popupOpen && createPortal(<LookupIcon ref={iconRef} sel={sel} onClick={() => setPopupOpen(true)} />, document.body)}
      {show &&
        popupOpen &&
        createPortal(
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 99998 }} onMouseDown={dismiss} onTouchStart={dismiss} />
            {access?.canUse === false ? (
              <LockedPopup sel={sel} reason={access.reason} onDismiss={dismiss} />
            ) : (
              <LookupPopup ref={popupRef} sel={sel} onDismiss={dismiss} />
            )}
          </>,
          document.body
        )}
    </OffCtx.Provider>
  );
}

// ── Nút nổi "Tra nghĩa" ─────────────────────────────────────────────────────

const LookupIcon = forwardRef<HTMLButtonElement, { sel: SelectionState; onClick: () => void }>(function LookupIcon(
  { sel, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onMouseDown={(e) => e.preventDefault()} // giữ vùng chọn khi bấm
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "fixed",
        left: sel.cx,
        top: Math.max(6, sel.top - 44),
        transform: "translateX(-50%)",
        zIndex: 99999,
        background: "#2C1E0F",
        color: "#f0e2cc",
        border: "none",
        borderRadius: 99,
        padding: "0 14px",
        minHeight: 36,
        fontSize: ".8rem",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 3px 12px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        userSelect: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "wl-pop .12s ease-out",
      }}
    >
      <style>{`@keyframes wl-pop{from{opacity:0;transform:translateX(-50%) scale(.8)}to{opacity:1;transform:translateX(-50%) scale(1)}}`}</style>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      Tra nghĩa
    </button>
  );
});

// ── Popup tra & lưu ─────────────────────────────────────────────────────────

const POPUP_W = 360;
const C = {
  bg: "var(--bg-elevated, #fff)",
  soft: "var(--bg-secondary, #FBF6EE)",
  text: "var(--text-primary, #2B2118)",
  muted: "var(--text-muted, #6E5B4B)",
  border: "var(--border, #E4D6C3)",
  accent: "#B4541F",
  green: "#3F7A4F",
  red: "#B94040",
};

function viTri(sel: SelectionState, cao: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(POPUP_W, vw - 16);
  const left = Math.max(8, Math.min(sel.cx - w / 2, vw - w - 8));
  const top = vh - sel.bottom > cao + 16 ? sel.bottom + 10 : Math.max(8, sel.top - cao - 10);
  return { left, top, width: w };
}

function readLS(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

const LookupPopup = forwardRef<HTMLDivElement, { sel: SelectionState; onDismiss: () => void }>(function LookupPopup(
  { sel, onDismiss },
  ref
) {
  const [res, setRes] = useState<LookupResponse | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [deckId, setDeckId] = useState(() => readLS(DECK_KEY) ?? "");
  const [luu, setLuu] = useState<"idle" | "saving" | "error">("idle");
  const [daLuu, setDaLuu] = useState<string | null>(null);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    lookupWord(sel.text, "en", ac.signal)
      .then(setRes)
      .catch((e) => !ac.signal.aborted && setLoi(e instanceof Error ? e.message : "Không tra được"));
    listDecks()
      .then((d) => setDecks(d.decks))
      .catch(() => undefined);
    return () => ac.abort();
  }, [sel.text]);

  const entry = res && res.dir === "en" && res.found ? res.entry : null;
  const owned = res && res.dir === "en" && res.found ? res.owned : null;
  const deckSel = decks.some((d) => d.id === deckId) ? deckId : "";

  async function luuTu() {
    if (!entry || luu === "saving") return;
    setLuu("saving");
    setLoiLuu(null);
    try {
      const n = nguon();
      const r = await quickAddWord({
        word: entry.word,
        vi: entry.meaningVi ?? undefined,
        ipa: entry.ipa ?? undefined,
        pos: entry.pos ?? undefined,
        def: entry.definition ?? undefined,
        example: entry.example ?? undefined,
        audioUrl: entry.audioUs ?? entry.audioUk ?? undefined,
        deckId: deckSel || undefined,
        context: sel.context,
        sourceUrl: n.url,
        sourceLabel: n.label || undefined,
      });
      try {
        localStorage.setItem(DECK_KEY, deckSel);
      } catch {
        /* bỏ qua */
      }
      setDaLuu(r.deckTitle);
      setLuu("idle");
    } catch (e) {
      setLoiLuu(e instanceof Error ? e.message : "Không lưu được");
      setLuu("error");
    }
  }

  const pos = typeof window !== "undefined" ? viTri(sel, 380) : { left: 8, top: 8, width: POPUP_W };
  const btn: React.CSSProperties = { border: `1px solid ${C.border}`, background: C.bg, color: C.text, borderRadius: 99, padding: "0 10px", minHeight: 32, fontSize: ".75rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Tra từ ${sel.text}`}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        ...pos,
        maxHeight: "min(70vh, 480px)",
        overflowY: "auto",
        zIndex: 99999,
        background: C.bg,
        color: C.text,
        border: `1.5px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "wl-slide .15s ease-out",
      }}
    >
      <style>{`@keyframes wl-slide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px 6px" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 700, fontSize: "1.2rem" }}>{entry?.word ?? sel.text}</span>
          {entry?.ipa && <span style={{ fontSize: ".78rem", color: C.muted }}>{entry.ipa}</span>}
          {entry?.pos && <span style={{ fontSize: ".7rem", fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: C.soft }}>{entry.pos}</span>}
          {entry?.level && (
            <span style={{ fontSize: ".7rem", fontWeight: 700, padding: "1px 6px", borderRadius: 6, border: `1px solid ${C.border}` }}>
              Cấp {entry.level === "850" ? "850+" : entry.level}
            </span>
          )}
        </div>
        <button type="button" onClick={onDismiss} aria-label="Đóng" style={{ border: "none", background: "none", color: C.muted, fontSize: "1.1rem", width: 32, height: 32, cursor: "pointer", flexShrink: 0 }}>
          ×
        </button>
      </div>

      <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {!res && !loi && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }} aria-live="polite">
            <div style={{ height: 18, width: "60%", borderRadius: 6, background: C.soft }} />
            <div style={{ height: 14, width: "85%", borderRadius: 6, background: C.soft }} />
            <span style={{ fontSize: ".75rem", color: C.muted }}>Đang tra…</span>
          </div>
        )}
        {loi && <p style={{ margin: 0, fontSize: ".85rem", color: C.red }}>{loi}</p>}
        {res && res.dir === "en" && !res.found && <p style={{ margin: 0, fontSize: ".85rem", color: C.muted }}>{res.reason}</p>}

        {entry && (
          <>
            <div style={{ display: "flex", gap: 6 }}>
              {entry.audioUk && (
                <button type="button" style={btn} onClick={() => playWord(entry.word, entry.audioUk ?? undefined)}>
                  🔊 UK
                </button>
              )}
              <button type="button" style={btn} onClick={() => playWord(entry.word, entry.audioUs ?? undefined)}>
                🔊 {entry.audioUk ? "US" : "Nghe"}
              </button>
            </div>
            {entry.meaningVi && <p style={{ margin: 0, fontSize: "1.02rem", fontWeight: 700, color: C.accent }}>{entry.meaningVi}</p>}
            {entry.example && <p style={{ margin: 0, fontSize: ".8rem", fontStyle: "italic", color: C.muted }}>“{entry.example}”</p>}
            {sel.context && (
              <p style={{ margin: 0, fontSize: ".78rem", padding: "6px 8px", borderRadius: 8, background: C.soft }}>
                <b style={{ fontStyle: "normal" }}>Trong bài: </b>
                <span style={{ fontStyle: "italic" }}>{sel.context}</span>
              </p>
            )}
            {(entry.collocations.length > 0 || entry.family.length > 0) && (
              <div style={{ fontSize: ".78rem", display: "flex", flexDirection: "column", gap: 3 }}>
                {entry.collocations.length > 0 && (
                  <span>
                    <b style={{ color: C.muted }}>Cụm hay gặp: </b>
                    {entry.collocations.join(" · ")}
                  </span>
                )}
                {entry.family.length > 0 && (
                  <span>
                    <b style={{ color: C.muted }}>Họ từ: </b>
                    {entry.family.join(" · ")}
                  </span>
                )}
              </div>
            )}
            {res && res.dir === "en" && res.found && res.aiNote && <p style={{ margin: 0, fontSize: ".7rem", color: C.muted }}>{res.aiNote}</p>}

            <div style={{ height: 1, background: C.border, margin: "2px 0" }} />

            {daLuu ? (
              <p style={{ margin: 0, fontSize: ".85rem", fontWeight: 600, color: C.green }}>
                ✓ Đã lưu vào “{daLuu}” ·{" "}
                <a href="/journal/vocab" style={{ color: C.accent }}>Xem sổ</a>
              </p>
            ) : owned ? (
              <p style={{ margin: 0, fontSize: ".85rem", fontWeight: 600, color: C.green }}>
                ✓ Đã có trong sổ · {owned.title} ·{" "}
                <a href={`/journal/vocab/decks/${owned.id}`} style={{ color: C.accent }}>Mở bộ</a>
              </p>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <label htmlFor="wl-deck" style={{ fontSize: ".75rem", color: C.muted, whiteSpace: "nowrap" }}>Lưu vào</label>
                <select
                  id="wl-deck"
                  value={deckSel}
                  onChange={(e) => setDeckId(e.target.value)}
                  style={{ flex: 1, minWidth: 0, minHeight: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: ".8rem", padding: "0 6px" }}
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
                  onClick={luuTu}
                  disabled={luu === "saving"}
                  style={{ minHeight: 40, borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: ".85rem", padding: "0 14px", cursor: "pointer", opacity: luu === "saving" ? 0.7 : 1 }}
                >
                  {luu === "saving" ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            )}
            {loiLuu && <p style={{ margin: 0, fontSize: ".78rem", color: C.red }}>{loiLuu}</p>}
          </>
        )}
      </div>
    </div>
  );
});

// ── Popup bị khoá ───────────────────────────────────────────────────────────

const LOCK_MESSAGES: Record<string, { title: string; body: string }> = {
  frozen: { title: "Tài khoản tạm khóa", body: "Tài khoản của bạn đang bị tạm khóa. Liên hệ giáo viên để được hỗ trợ." },
  not_logged_in: { title: "Chưa đăng nhập", body: "Đăng nhập để tra nghĩa và lưu từ vào sổ." },
  free: { title: "Tính năng học viên", body: "Chỉ học viên đã đăng ký khoá học mới tra nghĩa và lưu từ được." },
};

function LockedPopup({ sel, reason, onDismiss }: { sel: SelectionState; reason: string; onDismiss: () => void }) {
  const msg = LOCK_MESSAGES[reason] ?? LOCK_MESSAGES.free;
  const pos = viTri(sel, 130);
  return (
    <div
      role="dialog"
      aria-label={msg.title}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        ...pos,
        zIndex: 99999,
        background: C.bg,
        color: C.text,
        border: `1.5px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <b>{msg.title}</b>
        <button type="button" onClick={onDismiss} aria-label="Đóng" style={{ border: "none", background: "none", color: C.muted, fontSize: "1.1rem", width: 32, height: 32, cursor: "pointer" }}>
          ×
        </button>
      </div>
      <p style={{ margin: "4px 0 0", fontSize: ".85rem", color: C.muted, lineHeight: 1.5 }}>{msg.body}</p>
    </div>
  );
}
