"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FlipCard from "@/components/vocab/FlipCard";
import { LevelBadge, SpeakButton, chipStyle, fmtIpa } from "@/components/vocab/home/shared";
import { recordVocabReview } from "@/lib/vocab/review-client";
import { playWord } from "@/lib/vocab/audio";
import type { CardRow, ProgressRow, WordRow } from "@/lib/vocab/client";

/**
 * Phiên ôn của Sổ từ vựng.
 *
 * Chế độ Thông minh chọn dạng bài theo độ quen của từng từ:
 *   chưa gặp → lật thẻ · đã ôn 1–2 lần → trắc nghiệm nghĩa
 *   3–4 lần → nhìn nghĩa gõ từ · từ 5 lần → nghe rồi gõ
 * Từ sai quay lại cuối phiên bằng thẻ lật để học lại. Mỗi từ chỉ GHI tiến độ
 * ở lần gặp đầu trong phiên — lần học lại không phạt SRS thêm lần nữa.
 */

export interface SessionWord {
  wordKey: string;
  word: string;
  meaningVi: string | null;
  ipa: string | null;
  pos: string | null;
  example: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  level: string | null;
  repCount: number;
  seenCount: number;
}

export function fromWordRow(w: WordRow): SessionWord {
  return {
    wordKey: w.wordKey, word: w.word, meaningVi: w.meaningVi, ipa: w.ipa, pos: w.pos, example: w.example,
    audioUrl: w.audioUrl, imageUrl: w.imageUrl, level: w.level, repCount: w.repCount, seenCount: w.seenCount,
  };
}

export function fromCard(c: CardRow, p: ProgressRow | undefined, level?: string | null): SessionWord {
  return {
    wordKey: c.wordKey, word: c.word, meaningVi: c.meaningVi, ipa: c.ipa, pos: c.pos, example: c.example,
    audioUrl: c.audioUrl, imageUrl: c.imageUrl, level: level ?? null, repCount: p?.repCount ?? 0, seenCount: p?.seenCount ?? 0,
  };
}

export type Mode = "smart" | "flip" | "mcq" | "type" | "listen";
type Kind = Exclude<Mode, "smart">;

const MODES: { id: Mode; t: string; d: string }[] = [
  { id: "smart", t: "Thông minh", d: "Từ mới: lật thẻ → quen dần: trắc nghiệm → gõ từ → nghe – viết" },
  { id: "flip", t: "Lật thẻ", d: "Nhìn từ, tự đánh giá nhớ hay chưa" },
  { id: "mcq", t: "Trắc nghiệm", d: "Chọn nghĩa đúng trong 4 đáp án" },
  { id: "type", t: "Gõ từ", d: "Nhìn nghĩa tiếng Việt → gõ từ tiếng Anh" },
  { id: "listen", t: "Nghe – viết", d: "Nghe phát âm → gõ lại từ" },
];

const STAGE: Record<Kind, string> = {
  flip: "Lật thẻ",
  mcq: "Trắc nghiệm · chọn nghĩa",
  type: "Gõ từ · nhìn nghĩa",
  listen: "Nghe – viết",
};

const MODE_KEY = "vocab:sessionMode";
const SIZES = [10, 20, 30];

interface Item {
  w: SessionWord;
  kind: Kind;
  /** Lượt học lại sau khi sai — không ghi tiến độ nữa */
  retry: boolean;
}

interface KetQua {
  w: SessionWord;
  dung: boolean;
  dueAt: string | null;
}

const chuan = (s: string) => s.trim().toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ");

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export default function SessionRunner({
  words,
  pool,
  title,
  onExit,
  exitLabel = "← Về sổ từ vựng",
}: {
  words: SessionWord[];
  /** Kho để lấy đáp án nhiễu cho trắc nghiệm; mặc định = words */
  pool?: SessionWord[];
  title: string;
  onExit: () => void;
  exitLabel?: string;
}) {
  // Chụp lại danh sách lúc mở: kho từ tải lại sau mỗi lượt ôn không được làm xáo phiên
  const [ds] = useState(words);
  const [kho] = useState(() => (pool && pool.length > ds.length ? pool : ds));
  const [mode, setMode] = useState<Mode>(() => {
    try {
      const m = localStorage.getItem(MODE_KEY) as Mode | null;
      return m && MODES.some((x) => x.id === m) ? m : "smart";
    } catch {
      return "smart";
    }
  });
  const [size, setSize] = useState(() => Math.min(20, ds.length));
  const [phase, setPhase] = useState<"pick" | "run" | "done">("pick");
  const [queue, setQueue] = useState<Item[]>([]);
  const [pos, setPos] = useState(0);
  const [ketQua, setKetQua] = useState<Map<string, KetQua>>(new Map());
  const [canhBao, setCanhBao] = useState<string | null>(null);

  const coNghia = useMemo(() => kho.filter((w) => w.meaningVi), [kho]);

  const kindFor = useCallback(
    (w: SessionWord, m: Mode): Kind => {
      let k: Kind =
        m !== "smart" ? m : w.seenCount === 0 && w.repCount === 0 ? "flip" : w.repCount <= 2 ? "mcq" : w.repCount <= 4 ? "type" : "listen";
      // Không đủ dữ liệu cho dạng bài thì lùi về lật thẻ
      if (k === "mcq" && (!w.meaningVi || coNghia.filter((x) => x.wordKey !== w.wordKey).length < 3)) k = "flip";
      if (k === "type" && !w.meaningVi) k = "flip";
      return k;
    },
    [coNghia]
  );

  function batDau(list: SessionWord[] = ds.slice(0, size), m: Mode = mode) {
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* bỏ qua */
    }
    setQueue(list.map((w) => ({ w, kind: kindFor(w, m), retry: false })));
    setPos(0);
    setKetQua(new Map());
    setCanhBao(null);
    setPhase("run");
  }

  const item = queue[pos];
  const soTu = new Set(queue.map((q) => q.w.wordKey)).size;
  const xong = ketQua.size;

  /** Ghi kết quả một lượt rồi sang thẻ tiếp. */
  const traLoi = useCallback(
    async (dung: boolean, answerMs?: number) => {
      if (!item) return;
      if (!item.retry) {
        const outcome =
          item.kind === "flip"
            ? ({ kind: "flip", word: item.w.word, known: dung } as const)
            : ({
                kind: "quiz",
                word: item.w.word,
                correct: dung,
                answerMs,
                quizType: item.kind === "mcq" ? "word-to-meaning" : item.kind === "type" ? "meaning-to-typing" : "listen-to-typing",
              } as const);
        const r = await recordVocabReview({ outcome });
        if (r.trangThai === "cho-gui") setCanhBao("Mất mạng — kết quả đang giữ trên máy, sẽ tự gửi khi có mạng.");
        else if (r.trangThai === "loi") setCanhBao("Chưa lưu được kết quả lượt vừa rồi.");
        setKetQua((m) => new Map(m).set(item.w.wordKey, { w: item.w, dung, dueAt: r.trangThai === "ok" ? r.progress.dueAt : null }));
        if (!dung) setQueue((q) => [...q, { w: item.w, kind: "flip", retry: true }]);
      } else if (!dung) {
        // Học lại vẫn chưa nhớ: cho gặp thêm một lần nữa cuối phiên
        setQueue((q) => (q.filter((x) => x.w.wordKey === item.w.wordKey).length < 3 ? [...q, { w: item.w, kind: "flip", retry: true }] : q));
      }
      setPos((p) => p + 1);
    },
    [item]
  );

  useEffect(() => {
    if (phase === "run" && queue.length > 0 && pos >= queue.length) setPhase("done");
  }, [phase, pos, queue.length]);

  // ── Chọn chế độ ───────────────────────────────────────────────────────────
  if (phase === "pick") {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onExit} className="text-sm font-semibold" style={{ minHeight: 44, color: "var(--text-muted)" }}>
            {exitLabel}
          </button>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {ds.length} từ · khoảng {Math.max(1, Math.ceil((Math.min(size, ds.length) * 25) / 60))} phút
        </p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Chế độ ôn">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className="flex items-center gap-3 rounded-2xl p-3.5 text-left"
              style={{
                minHeight: 64,
                color: "var(--text-primary)",
                background: mode === m.id ? "rgba(196,98,45,.1)" : "var(--bg-elevated)",
                border: mode === m.id ? "2px solid var(--accent-primary)" : "1px solid var(--border)",
              }}
            >
              <span className="flex-1">
                <span className="block font-bold">{m.t}</span>
                <span className="block text-sm" style={{ color: "var(--text-muted)" }}>{m.d}</span>
              </span>
              {m.id === "smart" && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>Khuyên dùng</span>
              )}
            </button>
          ))}
        </div>
        {ds.length > 10 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>Số từ mỗi phiên</span>
            {SIZES.filter((n) => n < ds.length).concat(ds.length <= 30 ? [ds.length] : []).filter((n, i, a) => a.indexOf(n) === i).map((n) => (
              <button key={n} type="button" aria-pressed={size === n} onClick={() => setSize(n)} className="rounded-lg px-3 text-sm font-bold" style={{ minHeight: 40, minWidth: 48, ...chipStyle(size === n) }}>
                {n === ds.length && n > 30 ? "Tất cả" : n}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => batDau()}
          disabled={ds.length === 0}
          className="rounded-xl font-bold text-base disabled:opacity-50 mt-1"
          style={{ minHeight: 54, background: "var(--accent-primary)", color: "#fff" }}
        >
          Bắt đầu
        </button>
      </div>
    );
  }

  // ── Tổng kết ─────────────────────────────────────────────────────────────
  if (phase === "done" || !item) {
    const ds2 = [...ketQua.values()];
    const sai = ds2.filter((k) => !k.dung);
    const dung = ds2.length - sai.length;
    const soNgay = ds2
      .map((k) => (k.dueAt ? Math.ceil((new Date(k.dueAt).getTime() - Date.now()) / 86_400_000) : null))
      .filter((n): n is number => n !== null && n > 0);
    const ganNhat = soNgay.length ? Math.min(...soNgay) : null;
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-4 text-center">
        <h1 className="hand text-3xl mt-4" style={{ color: "var(--text-primary)" }}>Xong phiên ôn</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{ds2.length} từ</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl py-4" style={{ background: "rgba(74,124,89,.15)", color: "var(--accent-green)" }}>
            <p className="text-3xl font-bold">{dung}</p>
            <p className="text-sm">Nhớ / đúng</p>
          </div>
          <div className="rounded-2xl py-4" style={{ background: "rgba(196,98,45,.14)", color: "var(--accent-primary)" }}>
            <p className="text-3xl font-bold">{sai.length}</p>
            <p className="text-sm">Chưa nhớ / sai</p>
          </div>
        </div>
        {sai.length > 0 && (
          <div className="rounded-2xl p-4 text-left text-sm flex flex-col gap-1" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <p className="font-bold mb-1">Cần chú ý</p>
            {sai.map((k) => (
              <p key={k.w.wordKey}>
                <b style={{ fontFamily: "Lora, serif" }}>{k.w.word}</b> — {k.w.meaningVi ?? "—"}
              </p>
            ))}
          </div>
        )}
        {ganNhat !== null && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Lần ôn tới sớm nhất: {ganNhat <= 1 ? "ngày mai" : `sau ${ganNhat} ngày`}.
          </p>
        )}
        {canhBao && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{canhBao}</p>}
        {sai.length > 0 && (
          <button type="button" onClick={() => batDau(sai.map((k) => k.w), "flip")} className="rounded-xl font-bold" style={{ minHeight: 52, background: "var(--accent-primary)", color: "#fff" }}>
            Ôn lại {sai.length} từ chưa nhớ
          </button>
        )}
        <button type="button" onClick={onExit} className="rounded-xl font-semibold" style={{ minHeight: 48, border: "1px solid var(--border)", color: "var(--text-primary)" }}>
          {exitLabel}
        </button>
      </div>
    );
  }

  // ── Trong phiên ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setPhase(ketQua.size ? "done" : "pick")} aria-label="Dừng phiên" className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ color: "var(--text-primary)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full transition-all" style={{ width: `${(xong / soTu) * 100}%`, background: "var(--accent-primary)" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{xong}/{soTu}</span>
      </div>
      <p className="text-center text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {item.retry ? "Học lại" : STAGE[item.kind]}
      </p>
      {canhBao && <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>{canhBao}</p>}

      {item.kind === "flip" && <FlipEx key={pos} w={item.w} onDone={traLoi} />}
      {item.kind === "mcq" && <McqEx key={pos} w={item.w} pool={coNghia} onDone={traLoi} />}
      {item.kind === "type" && <TypeEx key={pos} w={item.w} listen={false} onDone={traLoi} />}
      {item.kind === "listen" && <TypeEx key={pos} w={item.w} listen onDone={traLoi} />}
    </div>
  );
}

// ── Các dạng bài ───────────────────────────────────────────────────────────

type Done = (dung: boolean, answerMs?: number) => void;

function useKeys(handler: (e: KeyboardEvent) => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      ref.current(e);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
}

function AnswerPanel({ w }: { w: SessionWord }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
      <p className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xl font-bold" style={{ fontFamily: "Lora, serif" }}>{w.word}</span>
        {fmtIpa(w.ipa) && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{fmtIpa(w.ipa)}</span>}
        <SpeakButton word={w.word} audioUrl={w.audioUrl} size={36} />
      </p>
      {w.meaningVi && <p className="font-semibold">{w.meaningVi}</p>}
      {w.example && <p className="text-sm italic">“{w.example}”</p>}
    </div>
  );
}

function FlipEx({ w, onDone }: { w: SessionWord; onDone: Done }) {
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const chot = async (known: boolean) => {
    if (busy || !flipped) return;
    setBusy(true);
    await onDone(known);
  };
  useKeys((e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setFlipped((f) => !f);
    } else if (flipped && (e.key === "1" || e.key === "2")) {
      e.preventDefault();
      chot(e.key === "2");
    }
  });
  return (
    <>
      <FlipCard
        cardKey={w.wordKey}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        height={w.imageUrl ? 340 : 290}
        overlay={<SpeakButton word={w.word} audioUrl={w.audioUrl} size={44} />}
        front={
          <>
            <span className="hand" style={{ fontSize: "2.4rem", color: "var(--accent-primary)", lineHeight: 1.1 }}>{w.word}</span>
            {fmtIpa(w.ipa) && <span className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>{fmtIpa(w.ipa)}</span>}
            <LevelBadge level={w.level} prefix />
            <span className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>Bấm thẻ hoặc Space để lật</span>
          </>
        }
        back={
          <>
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{w.meaningVi || "(chưa có nghĩa)"}</span>
            {w.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={w.imageUrl} alt="" className="rounded-lg" style={{ maxHeight: 130, objectFit: "contain" }} />
            )}
            {w.example && (
              <span className="text-sm italic px-3 py-2 rounded-lg" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>“{w.example}”</span>
            )}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => chot(false)} disabled={!flipped || busy} className="rounded-xl font-bold disabled:opacity-40" style={{ minHeight: 56, background: "rgba(196,98,45,.14)", color: "var(--accent-primary)" }}>
          Chưa nhớ <span className="font-normal opacity-70">(1)</span>
        </button>
        <button type="button" onClick={() => chot(true)} disabled={!flipped || busy} className="rounded-xl font-bold disabled:opacity-40" style={{ minHeight: 56, background: "var(--accent-green)", color: "#fff" }}>
          Nhớ rồi <span className="font-normal opacity-80">(2)</span>
        </button>
      </div>
      {!flipped && <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>Lật thẻ rồi tự đánh giá</p>}
    </>
  );
}

function McqEx({ w, pool, onDone }: { w: SessionWord; pool: SessionWord[]; onDone: Done }) {
  const [t0] = useState(() => Date.now());
  const [opts] = useState(() => {
    const khac = pool.filter((x) => x.wordKey !== w.wordKey && x.meaningVi && x.meaningVi !== w.meaningVi);
    const cungLoai = shuffle(khac.filter((x) => x.pos && x.pos === w.pos));
    const conLai = shuffle(khac.filter((x) => !cungLoai.includes(x)));
    const nhieu = [...cungLoai, ...conLai].slice(0, 3).map((x) => x.meaningVi!);
    return shuffle([w.meaningVi!, ...nhieu]);
  });
  const [chon, setChon] = useState<number | null>(null);
  const dungIdx = opts.indexOf(w.meaningVi!);

  const pick = (i: number) => {
    if (chon !== null) return;
    setChon(i);
  };
  const tiep = () => chon !== null && onDone(chon === dungIdx, Date.now() - t0);
  useKeys((e) => {
    const n = Number(e.key);
    if (chon === null && n >= 1 && n <= opts.length) pick(n - 1);
    else if (chon !== null && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      tiep();
    }
  });

  return (
    <>
      <div className="rounded-2xl p-6 text-center flex flex-col items-center gap-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <span className="text-3xl font-bold" style={{ fontFamily: "Lora, serif", color: "var(--text-primary)" }}>{w.word}</span>
        <div className="flex items-center gap-2">
          {fmtIpa(w.ipa) && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{fmtIpa(w.ipa)}</span>}
          <SpeakButton word={w.word} audioUrl={w.audioUrl} size={36} />
        </div>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>Chọn nghĩa đúng</span>
      </div>
      <div className="flex flex-col gap-2">
        {opts.map((o, i) => {
          const st =
            chon === null
              ? { border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)" }
              : i === dungIdx
                ? { border: "2px solid var(--accent-green)", background: "rgba(74,124,89,.15)", color: "var(--text-primary)", fontWeight: 700 }
                : i === chon
                  ? { border: "2px solid var(--accent-red, #B94040)", background: "rgba(185,64,64,.1)", color: "var(--text-primary)" }
                  : { border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" };
          return (
            <button key={i} type="button" onClick={() => pick(i)} className="rounded-xl px-4 text-left flex items-center gap-3" style={{ minHeight: 54, ...st }}>
              <span className="text-xs font-bold opacity-60">{i + 1}</span>
              <span className="flex-1">{o}</span>
            </button>
          );
        })}
      </div>
      {chon !== null && (
        <>
          {chon !== dungIdx && <AnswerPanel w={w} />}
          <button type="button" autoFocus onClick={tiep} className="rounded-xl font-bold" style={{ minHeight: 52, background: "var(--accent-primary)", color: "#fff" }}>
            Tiếp <span className="font-normal opacity-80">(Enter)</span>
          </button>
        </>
      )}
    </>
  );
}

function TypeEx({ w, listen, onDone }: { w: SessionWord; listen: boolean; onDone: Done }) {
  const [t0] = useState(() => Date.now());
  const [val, setVal] = useState("");
  const [ketQua, setKetQua] = useState<null | boolean>(null);
  const [goiY, setGoiY] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (listen) playWord(w.word, w.audioUrl ?? undefined).catch(() => undefined);
    inputRef.current?.focus();
  }, [listen, w]);

  const kiemTra = () => {
    if (ketQua !== null) {
      onDone(ketQua, Date.now() - t0);
      return;
    }
    if (!val.trim()) return;
    setKetQua(chuan(val) === chuan(w.word));
  };
  const goiYText = w.word.split(" ").map((p) => p[0] + " _".repeat(Math.max(0, p.length - 1))).join("   ");

  return (
    <>
      <div className="rounded-2xl p-6 text-center flex flex-col items-center gap-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {listen ? (
          <>
            <button
              type="button"
              onClick={() => playWord(w.word, w.audioUrl ?? undefined)}
              aria-label="Nghe lại"
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#3A2A1F", color: "#F0A36B" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M16 9a4 4 0 010 6M19 6a8 8 0 010 12" /></svg>
            </button>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Nghe rồi gõ lại từ · bấm loa để nghe lại</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{w.meaningVi}</span>
            {w.pos && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{w.pos}</span>}
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Gõ từ tiếng Anh</span>
          </>
        )}
        {goiY && ketQua === null && <span className="font-mono tracking-wider" style={{ color: "var(--text-primary)" }}>{goiYText}</span>}
      </div>
      <label htmlFor="session-answer" className="sr-only">Đáp án</label>
      <input
        id="session-answer"
        ref={inputRef}
        value={val}
        onChange={(e) => ketQua === null && setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            kiemTra();
          }
        }}
        readOnly={ketQua !== null}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={listen ? "Gõ từ bạn nghe được…" : "Gõ đáp án…"}
        className="rounded-xl px-4 text-lg outline-none"
        style={{
          minHeight: 56,
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: ketQua === null ? "1.5px solid var(--border)" : ketQua ? "2px solid var(--accent-green)" : "2px solid var(--accent-red, #B94040)",
        }}
      />
      {ketQua !== null && (
        <>
          <p className="text-center font-semibold" style={{ color: ketQua ? "var(--accent-green)" : "var(--accent-red, #B94040)" }}>
            {ketQua ? "Đúng rồi!" : "Chưa đúng — đáp án:"}
          </p>
          <AnswerPanel w={w} />
        </>
      )}
      <div className="flex gap-2">
        {ketQua === null && !goiY && (
          <button type="button" onClick={() => setGoiY(true)} className="rounded-xl px-4 text-sm font-semibold" style={{ minHeight: 52, border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            Gợi ý
          </button>
        )}
        <button type="button" onClick={kiemTra} disabled={ketQua === null && !val.trim()} className="flex-1 rounded-xl font-bold disabled:opacity-50" style={{ minHeight: 52, background: "var(--accent-primary)", color: "#fff" }}>
          {ketQua === null ? "Kiểm tra (Enter)" : "Tiếp (Enter)"}
        </button>
      </div>
    </>
  );
}
