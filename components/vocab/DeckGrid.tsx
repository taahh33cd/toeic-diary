"use client";

import Link from "next/link";
import { Sheet } from "@/components/journal/paper/Sheet";
import type { DeckSummary } from "@/lib/vocab/client";

const NGUON_NHAN: Record<string, string> = {
  migrated: "từ sổ cũ",
  ai_bulk: "AI điền",
  ai_content: "AI từ bài học",
};

export default function DeckGrid({
  decks,
  dueByDeck,
}: {
  decks: DeckSummary[];
  /** Số từ đến hạn trong từng bộ, nếu đã tính được. */
  dueByDeck?: Map<string, number>;
}) {
  if (decks.length === 0) {
    return (
      <Sheet className="text-center py-10">
        <div className="text-4xl mb-2">🗂️</div>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Chưa có bộ thẻ nào
        </p>
        <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
          Tạo bộ đầu tiên — dán danh sách từ rồi để AI điền nghĩa, IPA và ví dụ.
        </p>
        <Link
          href="/journal/vocab/decks/new"
          className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          + Tạo bộ thẻ
        </Link>
      </Sheet>
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}
    >
      {decks.map((d) => {
        const due = dueByDeck?.get(d.id) ?? 0;
        return (
          <Link key={d.id} href={`/journal/vocab/decks/${d.id}`} className="block">
            <Sheet fold lift className="h-full p-4 flex flex-col">
              <div className="flex-1">
                <div className="flex items-start gap-2 justify-between">
                  <h3 className="font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                    {d.title}
                  </h3>
                  {due > 0 && (
                    <span
                      className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--accent-primary)", color: "#fff" }}
                    >
                      {due} đến hạn
                    </span>
                  )}
                </div>
                {d.description && (
                  <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {d.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  {d.cardCount} thẻ
                </span>
                {d.part !== null && (
                  <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)" }}>
                    Part {d.part}
                  </span>
                )}
                {NGUON_NHAN[d.source] && <span>{NGUON_NHAN[d.source]}</span>}
                {d.visibility === "link" && <span title="Đang chia sẻ bằng link">🔗</span>}
              </div>
            </Sheet>
          </Link>
        );
      })}
    </div>
  );
}
