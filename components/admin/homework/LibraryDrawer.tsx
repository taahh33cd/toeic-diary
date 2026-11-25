"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClasses } from "@/hooks/firebase/useClasses";
import { loadDecks, loadLibrary } from "@/lib/homework/client";
import { HW_CATS, KIND_LABEL, sectionForLib, type HwCatKey, type LibItem } from "@/lib/homework/library";
import type { Homework, HwItem } from "@/lib/firebase/types";
import type { DeckSummary } from "@/lib/vocab/client";
import { ddmm, fold, usedDate, type NewDraft } from "./draft";

type Source = "web" | "deck" | "ext";

/** Một kết quả trong khung, đã quy về dạng chung để chọn/thêm. */
type Row = {
  key: string;
  title: string;
  sub: string[];
  draft: NewDraft;
  used: string | null;
  auto: boolean;
};

const MAX_ROWS = 120;
const PARTS = [1, 2, 3, 4, 5, 6, 7];
const KINDS: LibItem["kind"][] = ["subskill", "grammar", "part_practice", "full_test", "ipa", "shadow", "submission"];

export default function LibraryDrawer({
  section,
  initialQuery = "",
  used,
  onAdd,
  onClose,
}: {
  section: HwCatKey;
  initialQuery?: string;
  /** Bài đã giao trước đây cho đối tượng này: khoá → ngày. */
  used: Map<string, string>;
  onAdd: (drafts: NewDraft[]) => void;
  onClose: () => void;
}) {
  const [src, setSrc] = useState<Source>(section === "vocab" && !initialQuery ? "deck" : "web");
  const [q, setQ] = useState(initialQuery);
  const [part, setPart] = useState<number | null>(null);
  const [kind, setKind] = useState<LibItem["kind"] | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);
  const [picked, setPicked] = useState<Map<string, NewDraft>>(new Map());

  const [lib, setLib] = useState<LibItem[] | null>(null);
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (src === "web" && lib === null) {
      loadLibrary().then(setLib, (e: Error) => {
        setErr(e.message);
        setLib([]);
      });
    }
    if (src === "deck" && decks === null) {
      loadDecks().then(setDecks, (e: Error) => {
        setErr(e.message);
        setDecks([]);
      });
    }
  }, [src, lib, decks]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fq = fold(q.trim());

  const webRows = useMemo<Row[]>(() => {
    if (!lib) return [];
    return lib
      .filter((i) => (part ? i.parts.includes(part) : true))
      .filter((i) => (kind ? i.kind === kind : true))
      .filter((i) => (fq ? fold(i.title).includes(fq) || i.href.toLowerCase().includes(fq) : true))
      // Bài đúng mục đang thêm (vd mục Nghe → bài nghe) lên trước; còn lại giữ thứ tự kho.
      .map((i, idx) => ({ i, idx, rank: sectionForLib(i) === section ? 0 : 1 }))
      .sort((a, b) => a.rank - b.rank || a.idx - b.idx)
      .map(({ i }) => {
        const draft: NewDraft = {
          text: i.title,
          link: i.href,
          desc: "",
          catalogId: i.id,
          minutes: i.minutes,
          srcLink: i.href,
        };
        const parts =
          i.parts.length === 7 ? "Part 1–7" : i.parts.length ? `Part ${i.parts.join(", ")}` : null;
        return {
          key: `c:${i.id}`,
          title: i.title,
          sub: [KIND_LABEL[i.kind], ...(parts ? [parts] : []), `${i.minutes}′`],
          draft,
          used: usedDate(used, draft),
          auto: true,
        };
      })
      .filter((r) => (onlyNew ? !r.used : true));
  }, [lib, part, kind, fq, used, onlyNew, section]);

  const deckRows = useMemo<Row[]>(() => {
    if (!decks) return [];
    return decks
      .filter((d) => (fq ? fold(d.title).includes(fq) : true))
      .map((d) => {
        const link = `/flashcards/d/${d.slug}`;
        const draft: NewDraft = {
          text: `Flashcard: ${d.title} (${d.cardCount} thẻ)`,
          link,
          desc: "",
          deckId: d.id,
          minutes: Math.max(5, Math.round(d.cardCount * 0.75)),
          srcLink: link,
        };
        return {
          key: `d:${d.id}`,
          title: d.title,
          sub: [`${d.cardCount} thẻ`],
          draft,
          used: usedDate(used, draft),
          auto: true,
        };
      })
      .filter((r) => (onlyNew ? !r.used : true));
  }, [decks, fq, used, onlyNew]);

  const toggle = (r: Row) =>
    setPicked((m) => {
      const n = new Map(m);
      if (n.has(r.key)) n.delete(r.key);
      else n.set(r.key, r.draft);
      return n;
    });

  const sectionLabel = HW_CATS.find((c) => c.key === section)?.label ?? "";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <aside
        className="h-full w-full max-w-[560px] flex flex-col shadow-2xl"
        style={{ background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Kho bài"
      >
        <div className="px-4 pt-4 pb-3 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Thêm vào: <span style={{ color: "var(--accent-primary)" }}>{sectionLabel}</span>
            </p>
            <button onClick={onClose} className="p-1" style={{ color: "var(--text-muted)" }} aria-label="Đóng">
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-primary)" }}>
            {(
              [
                ["web", `Kho bài web${lib ? ` (${lib.length})` : ""}`],
                ["deck", "Bộ flashcard"],
                ["ext", "Link ngoài đã dùng"],
              ] as [Source, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSrc(k)}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg"
                style={
                  src === k
                    ? { background: "var(--bg-elevated)", color: "var(--text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,.1)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={src === "web" ? "Tìm: thì, part 2 where, full test…" : "Tìm…"}
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />

          <div className="flex flex-wrap gap-1.5">
            {src === "web" && (
              <>
                {PARTS.map((p) => (
                  <Chip key={p} on={part === p} onClick={() => setPart(part === p ? null : p)}>
                    Part {p}
                  </Chip>
                ))}
                {KINDS.map((k) => (
                  <Chip key={k} on={kind === k} onClick={() => setKind(kind === k ? null : k)}>
                    {KIND_LABEL[k]}
                  </Chip>
                ))}
              </>
            )}
            <Chip on={onlyNew} onClick={() => setOnlyNew(!onlyNew)}>
              Chưa giao
            </Chip>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {err && (
            <p className="text-xs py-3" style={{ color: "rgb(220,38,38)" }}>
              {err}
            </p>
          )}
          {src === "web" &&
            (lib === null ? <Loading /> : <Rows rows={webRows} picked={picked} toggle={toggle} />)}
          {src === "deck" &&
            (decks === null ? (
              <Loading />
            ) : decks.length === 0 && !err ? (
              <p className="text-xs py-4" style={{ color: "var(--text-muted)" }}>
                Bạn chưa có bộ thẻ nào có thẻ. Tạo ở Sổ từ vựng → Bộ thẻ.
              </p>
            ) : (
              <Rows rows={deckRows} picked={picked} toggle={toggle} />
            ))}
          {src === "ext" && <ExternalRows fq={fq} used={used} onlyNew={onlyNew} picked={picked} toggle={toggle} />}
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {picked.size ? `Đã chọn ${picked.size} bài` : "Chưa chọn bài nào"}
          </span>
          <button
            disabled={picked.size === 0}
            onClick={() => onAdd([...picked.values()])}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            Thêm vào BTVN
          </button>
        </div>
      </aside>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] px-2.5 py-1 rounded-full border"
      style={
        on
          ? { background: "var(--accent-primary)", borderColor: "var(--accent-primary)", color: "#fff" }
          : { background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-secondary)" }
      }
    >
      {children}
    </button>
  );
}

function Loading() {
  return (
    <div className="space-y-2 py-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}

function Rows({
  rows,
  picked,
  toggle,
}: {
  rows: Row[];
  picked: Map<string, NewDraft>;
  toggle: (r: Row) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-xs py-4" style={{ color: "var(--text-muted)" }}>
        Không có kết quả.
      </p>
    );
  }
  return (
    <div>
      {rows.slice(0, MAX_ROWS).map((r) => (
        <label
          key={r.key}
          className="flex gap-3 items-start py-2.5 border-b cursor-pointer"
          style={{ borderColor: "var(--border)" }}
        >
          <input
            type="checkbox"
            checked={picked.has(r.key)}
            onChange={() => toggle(r)}
            className="mt-0.5 w-4 h-4 shrink-0"
            style={{ accentColor: "var(--accent-primary)" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug break-words" style={{ color: "var(--text-primary)" }}>
              {r.title}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {r.sub.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
              {r.auto ? <Tag tone="ok">Tự chấm</Tag> : <Tag tone="warn">HV tự tick</Tag>}
              {r.used && <Tag tone="warn">Đã giao {ddmm(r.used)}</Tag>}
            </div>
          </div>
        </label>
      ))}
      {rows.length > MAX_ROWS && (
        <p className="text-xs py-3" style={{ color: "var(--text-muted)" }}>
          Còn {rows.length - MAX_ROWS} bài nữa, gõ thêm để lọc.
        </p>
      )}
    </div>
  );
}

export function Tag({ children, tone }: { children: React.ReactNode; tone?: "ok" | "warn" | "info" }) {
  const style =
    tone === "ok"
      ? { background: "rgba(74,124,89,.12)", color: "#4A7C59" }
      : tone === "warn"
        ? { background: "rgba(176,122,26,.12)", color: "#9A6A12" }
        : tone === "info"
          ? { background: "rgba(59,110,168,.1)", color: "#3B6EA8" }
          : { background: "var(--bg-primary)", color: "var(--text-secondary)" };
  return (
    <span className="text-[10.5px] font-semibold px-1.5 py-px rounded whitespace-nowrap" style={style}>
      {children}
    </span>
  );
}

/**
 * Link ngoài đã từng giao — gom từ BTVN của mọi HV và mọi lớp, không cần lưu
 * thêm ở đâu. Link dùng gần nhất lên đầu.
 */
function ExternalRows({
  fq,
  used,
  onlyNew,
  picked,
  toggle,
}: {
  fq: string;
  used: Map<string, string>;
  onlyNew: boolean;
  picked: Map<string, NewDraft>;
  toggle: (r: Row) => void;
}) {
  const { students, loading: l1 } = useAllStudents();
  const { classes, loading: l2 } = useClasses();

  const rows = useMemo<Row[]>(() => {
    const byLink = new Map<string, { text: string; date: string; count: number; section: HwCatKey }>();
    const asList = (h: unknown): Homework[] =>
      Array.isArray(h) ? h : h && typeof h === "object" ? (Object.values(h) as Homework[]) : [];
    const all: Homework[] = [
      ...students.flatMap((s) => asList(s.homework)),
      ...classes.flatMap((c) => asList(c.homework)),
    ];
    for (const hw of all) {
      if (!hw?.date) continue;
      for (const { key } of HW_CATS) {
        for (const it of (hw[key] as HwItem[] | undefined) ?? []) {
          const link = it?.link?.trim();
          if (!link || !/^https?:\/\//i.test(link) || it.catalogId || it.deckId) continue;
          if (/toeic-dictation-diary\.vercel\.app/i.test(link)) continue;
          const cur = byLink.get(link);
          if (!cur) byLink.set(link, { text: it.text, date: hw.date, count: 1, section: key });
          else {
            cur.count += 1;
            if (hw.date > cur.date) {
              cur.date = hw.date;
              cur.text = it.text;
            }
          }
        }
      }
    }
    return [...byLink.entries()]
      .sort((a, b) => b[1].date.localeCompare(a[1].date))
      .map(([link, v]) => {
        const plain = v.text.replace(/<[^>]+>/g, "");
        let host = "";
        try {
          host = new URL(link).hostname.replace(/^www\./, "");
        } catch {}
        const draft: NewDraft = { text: plain, link, desc: "" };
        return {
          key: `l:${link}`,
          title: plain,
          sub: [host, `dùng ${v.count} lần`, `gần nhất ${ddmm(v.date)}`],
          draft,
          used: usedDate(used, draft),
          auto: false,
        };
      })
      .filter((r) => (fq ? fold(r.title).includes(fq) || r.draft.link.toLowerCase().includes(fq) : true))
      .filter((r) => (onlyNew ? !r.used : true));
  }, [students, classes, fq, used, onlyNew]);

  if (l1 || l2) return <Loading />;
  return <Rows rows={rows} picked={picked} toggle={toggle} />;
}
