"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore, forwardRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { useProfile } from "@/hooks/useProfile";
import {
  getWordLookupSuppressed,
  subscribeWordLookupSuppressed,
} from "./word-lookup-suppress";

// ── Opt-in context (pages call <WordLookupActive /> to enable) ────────────────

type SetActive = React.Dispatch<React.SetStateAction<boolean>>;
const SetActiveCtx = createContext<SetActive | null>(null);

/** Drop this into any page/layout to enable word lookup on that route. */
export function WordLookupActive() {
  const setActive = useContext(SetActiveCtx);
  useEffect(() => {
    setActive?.(true);
    return () => setActive?.(false);
  }, [setActive]);
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isInEditableElement(node: Node | null): boolean {
  let el: Element | null =
    node?.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : (node as Element | null);
  while (el) {
    const tag = el.tagName?.toLowerCase();
    if (
      tag === "input" ||
      tag === "textarea" ||
      (el as HTMLElement).isContentEditable
    )
      return true;
    el = el.parentElement;
  }
  return false;
}

function normalizeQuery(raw: string): string {
  return raw.replace(/[^a-zA-Z\s'-]/g, "").trim().replace(/\s+/g, " ");
}

function isValidQuery(text: string): boolean {
  if (!text || text.length < 2) return false;
  const words = text.split(" ").filter(Boolean);
  return words.length >= 1 && words.length <= 4;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SelectionState {
  text: string;
  cx: number;  // viewport center-x of selection
  top: number; // viewport top-y of selection
}

interface DictResult {
  ipa: string;
  pos: string;
  def: string;
  audioUrl: string;
}

const POS_COLOR: Record<string, string> = {
  n: "#3B82F6", v: "#10B981", adj: "#F59E0B", adv: "#8B5CF6",
};

const POS_MAP: Record<string, string> = {
  noun: "n", verb: "v", adjective: "adj", adverb: "adv",
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchDict(word: string): Promise<Partial<DictResult>> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    const entry = data[0] ?? {};
    const m0 = entry.meanings?.[0] ?? {};
    const def0 = m0.definitions?.[0] ?? {};
    return {
      ipa:
        entry.phonetic ??
        entry.phonetics?.find((p: { text?: string }) => p.text)?.text ??
        "",
      pos: POS_MAP[m0.partOfSpeech ?? ""] ?? "",
      def: def0.definition ?? "",
      audioUrl:
        entry.phonetics?.find((p: { audio?: string }) => p.audio)?.audio ?? "",
    };
  } catch {
    return {};
  }
}

async function fetchMeaning(
  word: string,
  pos: string,
  definition: string,
): Promise<{ vi: string; example: string }> {
  try {
    const res = await fetch("/api/ai/word-meaning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, pos, definition }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { vi: "", example: "" };
    return (await res.json()) as { vi: string; example: string };
  } catch {
    return { vi: "", example: "" };
  }
}

// ── Access check ─────────────────────────────────────────────────────────────

interface AccessResult {
  canUse: boolean;
  reason: string;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function WordLookupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  // Annotate đang cầm công cụ → nhả selection cho nó
  const suppressed = useSyncExternalStore(
    subscribeWordLookupSuppressed,
    getWordLookupSuppressed,
    () => false,
  );

  const [sel, setSel] = useState<SelectionState | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupOpenRef = useRef(false);
  const iconRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [access, setAccess] = useState<AccessResult | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) return;
    fetch("/api/vocab/access")
      .then((r) => r.json() as Promise<AccessResult>)
      .then(setAccess)
      .catch(() => setAccess({ canUse: true, reason: "ok" })); // fail open on network error
  }, [active]);
  useEffect(() => {
    popupOpenRef.current = popupOpen;
  }, [popupOpen]);

  const dismiss = useCallback(() => {
    setSel(null);
    setPopupOpen(false);
  }, []);

  useEffect(() => {
    if (!mounted || !active || suppressed) return;

    function tryCapture() {
      const s = window.getSelection();
      if (!s || s.isCollapsed || !s.rangeCount) return;
      const text = normalizeQuery(s.toString().trim());
      if (!isValidQuery(text)) return;
      if (isInEditableElement(s.anchorNode)) return;
      try {
        const rect = s.getRangeAt(0).getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        setSel({ text, cx: rect.left + rect.width / 2, top: rect.top });
        setPopupOpen(false);
      } catch {
        /* detached range */
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (iconRef.current?.contains(e.target as Node)) return;
      if (popupRef.current?.contains(e.target as Node)) return;
      setTimeout(tryCapture, 10);
    };
    // Phase 4: mobile touch — longer delay for selection to settle
    const onTouchEnd = () => setTimeout(tryCapture, 120);
    // Only dismiss icon on outside click — popup uses backdrop instead
    const onDocClick = (e: MouseEvent) => {
      if (popupOpenRef.current) return; // popup handles its own dismiss via backdrop
      if (iconRef.current?.contains(e.target as Node)) return;
      dismiss();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    // Dismiss icon on scroll; keep popup open so user can still read it
    const onScroll = () => {
      if (!popupOpenRef.current) dismiss();
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [mounted, active, suppressed, dismiss]);

  return (
    <SetActiveCtx.Provider value={setActive}>
      {children}
      {mounted && sel && !suppressed && !popupOpen &&
        createPortal(
          <LookupIcon ref={iconRef} sel={sel} onClick={() => setPopupOpen(true)} />,
          document.body,
        )}
      {mounted && sel && !suppressed && popupOpen &&
        createPortal(
          <>
            {/* Backdrop: onMouseDown (not onClick) to dismiss before popup gets the click */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 99998 }}
              onMouseDown={dismiss}
            />
            {access?.canUse === false
              ? <LockedPopup sel={sel} reason={access.reason} onDismiss={dismiss} />
              : <LookupPopup ref={popupRef} sel={sel} onDismiss={dismiss} />
            }
          </>,
          document.body,
        )}
    </SetActiveCtx.Provider>
  );
}

// ── Floating icon ─────────────────────────────────────────────────────────────

const LookupIcon = forwardRef<
  HTMLButtonElement,
  { sel: SelectionState; onClick: () => void }
>(function LookupIcon({ sel, onClick }, ref) {
  return (
    <button
      ref={ref}
      onMouseDown={(e) => e.preventDefault()} // preserve selection on click
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "fixed",
        left: sel.cx,
        top: Math.max(6, sel.top - 40),
        transform: "translateX(-50%)",
        zIndex: 99999,
        background: "#2C1E0F",
        color: "#f0e2cc",
        border: "none",
        borderRadius: 99,
        padding: "5px 12px",
        fontSize: ".73rem",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        boxShadow: "0 3px 12px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        userSelect: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "wl-pop .12s ease-out",
      }}
    >
      <style>{`@keyframes wl-pop{from{opacity:0;transform:translateX(-50%) scale(.8)}to{opacity:1;transform:translateX(-50%) scale(1)}}`}</style>
      🔍 Tra nghĩa
    </button>
  );
});

// ── Lookup popup (Phase 2 + 3) ────────────────────────────────────────────────

const POPUP_W = 340;

const LookupPopup = forwardRef<
  HTMLDivElement,
  { sel: SelectionState; onDismiss: () => void }
>(function LookupPopup({ sel, onDismiss }, ref) {
  const { profile } = useProfile();
  // studentCode is string | null from UserProfile; treat null as undefined for save guard
  const studentCode: string | undefined = profile?.studentCode ?? undefined;

  const [dict, setDict] = useState<Partial<DictResult>>({});
  const [vi, setVi] = useState("");
  const [example, setExample] = useState("");
  const [viLoading, setViLoading] = useState(true);
  const [part, setPart] = useState(5);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const isPhrase = sel.text.includes(" ");

  useEffect(() => {
    let cancelled = false;
    setDict({});
    setVi("");
    setExample("");
    setViLoading(true);
    setSaveState("idle");

    async function run() {
      const dictData = isPhrase ? {} : await fetchDict(sel.text);
      if (cancelled) return;
      setDict(dictData);

      const { vi: viText, example: exText } = await fetchMeaning(
        sel.text,
        dictData.pos ?? "",
        dictData.def ?? "",
      );
      if (cancelled) return;
      setVi(viText);
      setExample(exText);
      setViLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sel.text, isPhrase]);

  async function handleSave() {
    if (!studentCode || saveState !== "idle") return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/vocab/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: sel.text,
          vi: vi || undefined,
          ipa: dict.ipa || undefined,
          pos: dict.pos || undefined,
          def: dict.def || undefined,
          example: example || undefined,
          part,
          addedDate: new Date().toISOString().slice(0, 10),
          repCount: 0,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error ?? res.statusText);
      }
      setSaveState("saved");
      setTimeout(onDismiss, 2000);
    } catch (err) {
      console.error("[WordLookup] save failed:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  function playAudio() {
    if (dict.audioUrl) {
      new Audio(dict.audioUrl).play().catch(() => {});
    } else {
      const u = new SpeechSynthesisUtterance(sel.text);
      u.lang = "en-US";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }

  // Viewport-aware position: prefer below selection, flip above if not enough space
  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;
  const left = Math.max(8, Math.min(sel.cx - POPUP_W / 2, vw - POPUP_W - 8));
  const spaceBelow = vh - sel.top;
  const top = spaceBelow > 320 ? sel.top + 28 : Math.max(8, sel.top - 320);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left,
        top,
        width: POPUP_W,
        maxWidth: "calc(100vw - 16px)",
        zIndex: 99999,
        background: "var(--bg-elevated, #fff)",
        border: "1.5px solid rgba(196,98,45,0.3)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "wl-slide .15s ease-out",
      }}
    >
      <style>{`@keyframes wl-slide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px 8px", borderBottom: "1px solid rgba(196,98,45,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "'Lora',Georgia,serif", fontWeight: 700, fontSize: "1.05rem",
            color: "var(--text-primary,#1a1a1a)",
          }}>
            {sel.text}
          </span>
          {dict.ipa && (
            <span style={{ fontSize: ".7rem", color: "var(--text-muted,#888)", fontFamily: "monospace" }}>
              {dict.ipa}
            </span>
          )}
          {dict.pos && (
            <span style={{
              fontSize: ".58rem", fontWeight: 700, padding: "1px 6px", borderRadius: 99,
              textTransform: "uppercase", letterSpacing: ".06em",
              background: POS_COLOR[dict.pos] ? `${POS_COLOR[dict.pos]}22` : "#eee",
              color: POS_COLOR[dict.pos] ?? "#888",
              border: `1px solid ${POS_COLOR[dict.pos] ? `${POS_COLOR[dict.pos]}44` : "#ddd"}`,
            }}>
              {dict.pos}
            </span>
          )}
          <button
            onClick={playAudio}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: ".8rem", padding: 2, color: "var(--text-muted,#888)" }}
            title="Phát âm"
          >
            🔊
          </button>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#888)", fontSize: ".88rem", padding: "2px 4px", marginLeft: 6, flexShrink: 0 }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 14px 12px" }}>
        {/* Vietnamese meaning */}
        <div style={{
          padding: "8px 10px", borderRadius: 8,
          background: "rgba(196,98,45,.07)", border: "1px dashed rgba(196,98,45,.25)",
          marginBottom: 8, minHeight: 38, display: "flex", alignItems: "center",
        }}>
          {vi ? (
            <span style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--orange,#C4622D)" }}>
              {vi}
            </span>
          ) : (
            <span style={{ fontSize: ".78rem", color: "var(--text-muted,#888)", fontStyle: "italic" }}>
              {viLoading ? "✨ Đang tra nghĩa…" : "Không tìm thấy nghĩa"}
            </span>
          )}
        </div>

        {/* Example sentence */}
        {example && (
          <p style={{
            fontSize: ".72rem", color: "var(--text-muted,#888)", fontStyle: "italic",
            paddingLeft: 8, borderLeft: "2px solid rgba(196,98,45,.2)",
            marginBottom: 10, lineHeight: 1.5,
          }}>
            &ldquo;{example}&rdquo;
          </p>
        )}

        {/* Part selector — always visible */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: ".6rem", color: "var(--text-muted,#888)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
            Part:
          </span>
          {[1, 2, 3, 4, 5, 6, 7].map((p) => (
            <button
              key={p}
              onClick={() => setPart(p)}
              style={{
                width: 26, height: 26, borderRadius: 6, fontSize: ".7rem",
                fontWeight: part === p ? 700 : 500,
                border: part === p ? "1.5px solid var(--orange,#C4622D)" : "1px solid var(--border,#ddd)",
                background: part === p ? "rgba(196,98,45,.12)" : "transparent",
                color: part === p ? "var(--orange,#C4622D)" : "var(--text-muted,#888)",
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Save button — state transitions in-place */}
        <button
          onMouseDown={(e) => e.stopPropagation()} // prevent backdrop from firing
          onClick={handleSave}
          disabled={!studentCode || saveState === "saving" || saveState === "saved"}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
            fontWeight: 700, fontSize: ".85rem",
            cursor: (studentCode && saveState === "idle") ? "pointer" : "default",
            transition: "background .25s, transform .15s",
            transform: saveState === "saved" ? "scale(1.02)" : "scale(1)",
            background:
              !studentCode        ? "#e5e5e5" :
              saveState === "saved"  ? "#4A7C59" :
              saveState === "error"  ? "#e05c5c" :
              "var(--orange,#C4622D)",
            color: studentCode ? "#fff" : "#aaa",
            opacity: saveState === "saving" ? 0.75 : 1,
          }}
        >
          {!studentCode       ? "Đăng nhập để lưu từ" :
           saveState === "saving" ? "⏳ Đang lưu…" :
           saveState === "saved"  ? "✅ Đã lưu vào Vocab!" :
           saveState === "error"  ? "❌ Lỗi — thử lại" :
                                    "✓ Lưu vào Vocab"}
        </button>
      </div>
    </div>
  );
});

// ── Locked popup ──────────────────────────────────────────────────────────────

const LOCK_MESSAGES: Record<string, { icon: string; title: string; body: string }> = {
  frozen: {
    icon: "🔒",
    title: "Tài khoản tạm khóa",
    body: "Tài khoản của bạn đang bị tạm khóa. Liên hệ giáo viên để được hỗ trợ.",
  },
  not_logged_in: {
    icon: "🔑",
    title: "Chưa đăng nhập",
    body: "Đăng nhập để sử dụng tính năng tra nghĩa từ.",
  },
  free: {
    icon: "⭐",
    title: "Tính năng học viên",
    body: "Chỉ học viên đã đăng ký khoá học mới có thể sử dụng tính năng tra nghĩa từ.",
  },
};

function LockedPopup({
  sel,
  reason,
  onDismiss,
}: {
  sel: SelectionState;
  reason: string;
  onDismiss: () => void;
}) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;
  const left = Math.max(8, Math.min(sel.cx - POPUP_W / 2, vw - POPUP_W - 8));
  const spaceBelow = vh - sel.top;
  const top = spaceBelow > 150 ? sel.top + 28 : Math.max(8, sel.top - 150);

  const msg = LOCK_MESSAGES[reason] ?? LOCK_MESSAGES.free;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left,
        top,
        width: POPUP_W,
        maxWidth: "calc(100vw - 16px)",
        zIndex: 99999,
        background: "var(--bg-elevated, #fff)",
        border: "1.5px solid rgba(196,98,45,0.3)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "wl-slide .15s ease-out",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes wl-slide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px 8px", borderBottom: "1px solid rgba(196,98,45,0.12)",
      }}>
        <span style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text-primary,#1a1a1a)" }}>
          {msg.icon} {msg.title}
        </span>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#888)", fontSize: ".88rem", padding: "2px 4px" }}
        >
          ✕
        </button>
      </div>
      <p style={{
        padding: "10px 14px 12px", margin: 0,
        fontSize: ".82rem", color: "var(--text-muted,#666)", lineHeight: 1.5,
      }}>
        {msg.body}
      </p>
    </div>
  );
}
