"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { Sheet } from "@/components/journal/paper/Sheet";
import DeckGrid from "@/components/vocab/DeckGrid";
import { useDecks } from "@/hooks/useDecks";
import { useVocabDue } from "@/hooks/useVocabDue";

export default function DecksPage() {
  const { decks, loading, error } = useDecks();
  const { stats } = useVocabDue();

  const tongThe = useMemo(() => decks.reduce((n, d) => n + d.cardCount, 0), [decks]);

  return (
    <div className="space-y-4">
      <PageHeading
        title="Bộ thẻ"
        note={
          loading
            ? "Đang tải…"
            : `${decks.length} bộ · ${tongThe} thẻ · ${stats.dueCount} từ đến hạn ôn`
        }
        actions={
          <>
            <Link
              href="/journal/vocab"
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
            >
              ← Tất cả từ
            </Link>
            <Link
              href="/journal/vocab/stats"
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
            >
              📈 Tiến độ
            </Link>
            <Link
              href="/journal/vocab/decks/new"
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              + Tạo bộ
            </Link>
          </>
        }
      />

      {error && (
        <Sheet className="text-center py-6">
          <p className="text-sm font-semibold" style={{ color: "var(--accent-red, #B94040)" }}>{error}</p>
        </Sheet>
      )}

      {loading ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : (
        <DeckGrid decks={decks} />
      )}
    </div>
  );
}
