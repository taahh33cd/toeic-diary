"use client";

import { useMemo } from "react";
import Link from "next/link";
import { wordIsDue, type DeckSummary, type WordRow } from "@/lib/vocab/client";
import { isLeech, levelLabel } from "./shared";

const WEEK = 7 * 86_400_000;

/** Từ lưu trong 7 ngày gần đây (addedDate dạng YYYY-MM-DD). */
function luuTuanNay(w: WordRow): boolean {
  return Date.now() - new Date(w.addedDate).getTime() < WEEK;
}

export interface DeckStats {
  total: number;
  mastered: number;
  learning: number;
  due: number;
  levelRange: string | null;
}

/** Tiến độ từng bộ tính từ kho từ (mỗi từ biết mình nằm ở bộ nào). */
export function statsByDeck(words: WordRow[]): Map<string, DeckStats & { words: WordRow[] }> {
  const m = new Map<string, DeckStats & { words: WordRow[] }>();
  for (const w of words) {
    for (const id of w.deckIds) {
      const s = m.get(id) ?? { total: 0, mastered: 0, learning: 0, due: 0, levelRange: null, words: [] };
      s.total++;
      s.words.push(w);
      if (w.mastered) s.mastered++;
      else if (wordIsDue(w)) s.due++;
      else s.learning++;
      m.set(id, s);
    }
  }
  for (const s of m.values()) {
    const lv = s.words.map((w) => w.level).filter((l): l is string => !!l).sort();
    if (lv.length) s.levelRange = lv[0] === lv[lv.length - 1] ? levelLabel(lv[0]) : `${lv[0]}–${levelLabel(lv[lv.length - 1])}`;
  }
  return m;
}

export function ProgressBar({ s, height = 8 }: { s: Pick<DeckStats, "total" | "mastered" | "learning" | "due">; height?: number }) {
  const pc = (x: number) => (s.total ? `${(x / s.total) * 100}%` : "0%");
  return (
    <div
      className="flex rounded-full overflow-hidden"
      style={{ height, background: "var(--border)" }}
      role="img"
      aria-label={`${s.mastered} đã thuộc, ${s.learning} đang học, ${s.due} cần ôn`}
    >
      <div style={{ width: pc(s.mastered), background: "var(--accent-green)" }} />
      <div style={{ width: pc(s.learning), background: "#2F5D80" }} />
      <div style={{ width: pc(s.due), background: "#D9773F" }} />
    </div>
  );
}

export default function DecksTab({
  words,
  decks,
  onStudy,
}: {
  words: WordRow[];
  decks: DeckSummary[];
  onStudy: (list: WordRow[], title: string) => void;
}) {
  const stats = useMemo(() => statsByDeck(words), [words]);

  const auto = useMemo(() => {
    return [
      { title: "Đến hạn hôm nay", list: words.filter(wordIsDue), note: "từ mọi bộ" },
      { title: "Hay quên", list: words.filter(isLeech), note: "sai từ 3 lần trở lên" },
      {
        title: "Mới lưu tuần này",
        list: words.filter(luuTuanNay),
        note: "từ vừa tra & lưu",
      },
    ];
  }, [words]);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2" aria-label="Bộ tự động">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Bộ tự động</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))" }}>
          {auto.map((a) => (
            <button
              key={a.title}
              type="button"
              disabled={a.list.length === 0}
              onClick={() => onStudy(a.list, a.title)}
              className="text-left rounded-2xl px-4 py-3 flex flex-col gap-0.5 disabled:opacity-50"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", minHeight: 72 }}
            >
              <span className="font-bold">{a.title} · {a.list.length}</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {a.list.length ? `Học ngay · ${a.note}` : "Chưa có từ nào"}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2" aria-label="Bộ của tôi">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wider mr-auto" style={{ color: "var(--text-muted)" }}>Bộ của tôi</p>
          <Link
            href="/journal/vocab/decks/new"
            className="px-4 rounded-lg text-sm font-bold flex items-center"
            style={{ minHeight: 44, background: "var(--accent-primary)", color: "#fff" }}
          >
            + Tạo bộ
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Chưa có bộ thẻ nào</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Tạo bộ từ từ đã lưu, dán danh sách, bài đã học hoặc để AI gợi ý theo chủ đề.
            </p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}>
            {decks.map((d) => {
              const s = stats.get(d.id) ?? { total: d.cardCount, mastered: 0, learning: 0, due: 0, levelRange: null, words: [] };
              const hoc = s.due > 0 ? s.words.filter(wordIsDue) : s.words.filter((w) => !w.mastered);
              return (
                <div
                  key={d.id}
                  className="rounded-2xl p-4 flex flex-col gap-2.5"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-2">
                    <Link href={`/journal/vocab/decks/${d.id}`} className="flex-1 font-bold leading-snug hover:underline" style={{ color: "var(--text-primary)" }}>
                      {d.title}
                    </Link>
                    {s.due > 0 && (
                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-primary)", color: "#fff" }}>
                        {s.due} đến hạn
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {[`${d.cardCount} thẻ`, d.part ? `Part ${d.part}` : null, s.levelRange ? `cấp ${s.levelRange}` : null, d.visibility === "link" ? "đang chia sẻ" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <ProgressBar s={s} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {s.mastered} đã thuộc · {s.learning} đang học · {s.due} cần ôn
                  </p>
                  <div className="flex gap-2 mt-auto">
                    <button
                      type="button"
                      disabled={hoc.length === 0}
                      onClick={() => onStudy(hoc, d.title)}
                      className="rounded-lg px-4 text-sm font-bold disabled:opacity-50"
                      style={{ minHeight: 40, border: "1px solid var(--accent-primary)", color: "var(--accent-primary)" }}
                    >
                      {s.due > 0 ? `Ôn ${Math.min(s.due, 20)}` : hoc.length ? "Học" : "Đã thuộc hết"}
                    </button>
                    <Link
                      href={`/journal/vocab/decks/${d.id}`}
                      className="rounded-lg px-3 text-sm font-semibold flex items-center"
                      style={{ minHeight: 40, color: "var(--text-muted)" }}
                    >
                      Xem bộ ›
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
