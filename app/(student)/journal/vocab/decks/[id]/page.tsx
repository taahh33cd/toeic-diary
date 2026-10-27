"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { Sheet } from "@/components/journal/paper/Sheet";
import StudyDeck from "@/components/vocab/StudyDeck";
import DeckEditor from "@/components/vocab/DeckEditor";
import { deleteDeck, getDeck, type DeckDetail } from "@/lib/vocab/client";
import { playWord } from "@/lib/vocab/audio";

type Man = "danhsach" | "hoc" | "hoc-den-han" | "sua";

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DeckDetail | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [man, setMan] = useState<Man>("danhsach");

  const load = useCallback(async () => {
    try {
      setData(await getDeck(id));
      setLoi(null);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được bộ thẻ");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Tải lại khi rời chế độ học để số "đến hạn" trên trang khớp với vừa ôn
  useEffect(() => {
    if (man === "danhsach" && data) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [man]);

  if (loi) {
    return (
      <Sheet className="text-center py-10">
        <p className="font-semibold" style={{ color: "var(--accent-red, #B94040)" }}>{loi}</p>
        <Link href="/journal/vocab" className="inline-block mt-3 text-sm underline"
          style={{ color: "var(--text-muted)" }}>
          ← Về sổ từ vựng
        </Link>
      </Sheet>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-48 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
      </div>
    );
  }

  const { deck, progress } = data;
  const tdTheoKey = new Map(progress.map((p) => [p.wordKey, p]));
  const denHan = deck.cards.filter((c) => {
    const p = tdTheoKey.get(c.wordKey);
    if (!p) return true;
    if (p.mastered) return false;
    return p.dueAt === null || new Date(p.dueAt) <= new Date();
  });
  const daThuoc = deck.cards.filter((c) => tdTheoKey.get(c.wordKey)?.mastered).length;

  if (man === "sua") {
    return (
      <DeckEditor
        deck={deck}
        cards={deck.cards}
        onDone={() => {
          setMan("danhsach");
          load();
        }}
        onCancel={() => setMan("danhsach")}
      />
    );
  }

  if (man !== "danhsach") {
    return (
      <StudyDeck
        title={deck.title}
        cards={deck.cards}
        progress={progress}
        dueOnly={man === "hoc-den-han"}
        onExit={() => setMan("danhsach")}
      />
    );
  }

  async function xoaBo() {
    if (!window.confirm(`Xoá bộ "${deck.title}"? Tiến độ ôn các từ vẫn được giữ.`)) return;
    try {
      await deleteDeck(deck.id);
      window.dispatchEvent(new Event("decks:changed"));
      router.push("/journal/vocab");
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không xoá được");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title={deck.title}
        note={`${deck.cardCount} thẻ · ${denHan.length} đến hạn · ${daThuoc} đã thuộc`}
        actions={
          <>
            <Link
              href="/journal/vocab"
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
            >
              ← Sổ từ vựng
            </Link>
            <button
              onClick={() => setMan("sua")}
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              ✏️ Sửa thẻ
            </button>
            <button
              onClick={xoaBo}
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(185,64,64,.1)", color: "var(--accent-red, #B94040)" }}
            >
              Xoá bộ
            </button>
          </>
        }
      />

      {deck.description && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{deck.description}</p>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setMan("hoc-den-han")}
          disabled={denHan.length === 0}
          className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: denHan.length ? "var(--accent-primary)" : "var(--bg-elevated)",
            color: denHan.length ? "#fff" : "var(--text-muted)",
          }}
        >
          🃏 Ôn {denHan.length} từ đến hạn
        </button>
        <button
          onClick={() => setMan("hoc")}
          className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
        >
          Học cả bộ ({deck.cardCount})
        </button>
      </div>

      <Sheet stack className="p-0 overflow-hidden">
        <ul>
          {deck.cards.map((c, i) => {
            const p = tdTheoKey.get(c.wordKey);
            const due = !p || (!p.mastered && (p.dueAt === null || new Date(p.dueAt) <= new Date()));
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}
              >
                <button
                  onClick={() => playWord(c.word, c.audioUrl ?? undefined)}
                  className="shrink-0 w-8 h-8 rounded-full text-sm"
                  style={{ background: "var(--bg-secondary)" }}
                  title="Nghe phát âm"
                >
                  🔊
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {c.word}
                    {c.ipa && (
                      <span className="ml-2 font-mono text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                        {c.ipa}
                      </span>
                    )}
                  </p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                    {c.meaningVi ?? "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                  <div>×{p?.repCount ?? 0}</div>
                  {p?.mastered ? (
                    <div style={{ color: "var(--accent-green, #4A7C59)" }}>đã thuộc</div>
                  ) : due ? (
                    <div style={{ color: "var(--accent-primary)" }}>đến hạn</div>
                  ) : (
                    <div>{p?.intervalDays ?? 0}ng</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
