"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeckSummary } from "@/lib/vocab/client";

const RED = "var(--accent-red, #B94040)";

/**
 * Chọn một bộ thẻ của chính giáo viên để chèn vào bài tập.
 *
 * Không tự tạo assignment ở đây: bài tập chỉ tồn tại sau khi giáo viên bấm
 * lưu, nên assignment được tạo cùng lúc đó với đúng homeworkId. Ở bước này chỉ
 * trả về bộ đã chọn cho form giữ lại.
 */
export default function DeckAssignPicker({
  onPick,
}: {
  onPick: (deck: DeckSummary) => void;
}) {
  const [mo, setMo] = useState(false);
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    try {
      const res = await fetch("/api/flashcards/decks", { cache: "no-store" });
      const d = (await res.json()) as { decks?: DeckSummary[]; error?: string };
      if (!res.ok) throw new Error(d.error ?? "Không tải được");
      setDecks((d.decks ?? []).filter((x) => x.cardCount > 0));
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được bộ thẻ");
      setDecks([]);
    }
  }, []);

  useEffect(() => {
    if (mo && decks === null) tai();
  }, [mo, decks, tai]);

  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => setMo(true)}
        className="text-[11px] px-2 py-1 min-h-[44px] rounded"
        style={{ color: "var(--accent-primary)", background: "rgba(196,98,45,0.08)" }}
      >
        🗂️ Chèn bộ thẻ
      </button>
    );
  }

  return (
    <div
      className="rounded-lg p-2 mt-1"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", maxWidth: 420 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
          Chọn bộ thẻ của bạn
        </span>
        <button
          type="button"
          onClick={() => setMo(false)}
          className="text-[11px] px-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>

      {decks === null ? (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Đang tải…</p>
      ) : decks.length === 0 ? (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Bạn chưa có bộ thẻ nào có thẻ. Tạo ở Sổ từ vựng → Bộ thẻ.
        </p>
      ) : (
        <ul className="space-y-1" style={{ maxHeight: 200, overflowY: "auto" }}>
          {decks.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(d);
                  setMo(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded text-xs"
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              >
                {d.title}
                <span className="ml-2" style={{ color: "var(--text-muted)" }}>
                  {d.cardCount} thẻ
                  {d.visibility !== "link" && " · sẽ bật chia sẻ khi giao"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {loi && <p className="text-[11px] mt-1" style={{ color: RED }}>{loi}</p>}
    </div>
  );
}
