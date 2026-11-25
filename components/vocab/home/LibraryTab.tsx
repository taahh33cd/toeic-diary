"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cloneDeck, type LibraryDeck } from "@/lib/vocab/client";
import { useLibrary } from "@/hooks/useLibrary";
import { LEVELS, LevelBadge, chipStyle, levelLabel } from "./shared";

/** Thư viện bộ mẫu admin đăng — lọc theo cấp độ và Part, lấy về một chạm. */
export default function LibraryTab() {
  const router = useRouter();
  const { decks: tatCa, loading, error } = useLibrary();
  const [lv, setLv] = useState("all");
  const [part, setPart] = useState<number | null>(null);
  const [dangLay, setDangLay] = useState<string | null>(null);
  const [loiLay, setLoiLay] = useState<string | null>(null);

  const decks = tatCa.filter((d) => (lv === "all" || d.level === lv) && (part === null || d.part === part));
  const parts = [...new Set(tatCa.map((d) => d.part).filter((p): p is number => !!p))].sort();

  async function lay(d: LibraryDeck) {
    if (dangLay) return;
    setDangLay(d.id);
    setLoiLay(null);
    try {
      const { deckId } = await cloneDeck(d.id);
      router.push(`/journal/vocab/decks/${deckId}`);
    } catch (e) {
      setLoiLay(e instanceof Error ? e.message : "Không lấy được bộ thẻ");
      setDangLay(null);
    }
  }

  const loi = loiLay ?? error;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Bộ mẫu do admin soạn. Lấy về là thành bộ của bạn, sửa tuỳ ý — từ nào đã học thì tiến độ giữ nguyên.
      </p>
      <div className="flex gap-1.5 flex-wrap items-center" role="group" aria-label="Lọc thư viện">
        {["all", ...LEVELS].map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lv === l}
            onClick={() => setLv(l)}
            className="rounded-full px-3 text-sm font-semibold"
            style={{ minHeight: 38, ...chipStyle(lv === l) }}
          >
            {l === "all" ? "Mọi cấp" : levelLabel(l)}
          </button>
        ))}
        {parts.length > 1 && (
          <select
            aria-label="Lọc theo Part"
            value={part ?? ""}
            onChange={(e) => setPart(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg px-2 text-sm sm:ml-auto"
            style={{ minHeight: 38, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            <option value="">Mọi Part</option>
            {parts.map((p) => (
              <option key={p} value={p}>Part {p}</option>
            ))}
          </select>
        )}
      </div>

      {loi && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: "var(--accent-red, #B94040)" }}>{loi}</p>
      )}

      {loading ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {tatCa.length === 0 ? "Thư viện chưa có bộ nào" : "Không có bộ nào khớp bộ lọc"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Admin đăng bộ mẫu lên đây để cả lớp dùng chung.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}>
          {decks.map((d) => (
            <div key={d.id} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div className="flex gap-1.5 flex-wrap">
                <LevelBadge level={d.level} prefix />
                {d.part !== null && (
                  <span className="text-[11px] font-bold px-1.5 py-px rounded-md" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    Part {d.part}
                  </span>
                )}
              </div>
              <p className="font-bold leading-snug" style={{ color: "var(--text-primary)" }}>{d.title}</p>
              {d.description && <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{d.description}</p>}
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {d.cardCount} thẻ{d.tacGia ? ` · ${d.tacGia}` : ""}
                {d.daHocTrongBo > 0 && ` · bạn đã học ${d.daHocTrongBo}/${d.cardCount}`}
              </p>
              <div className="flex gap-2 mt-auto pt-1">
                <Link
                  href={`/flashcards/d/${d.slug}`}
                  className="rounded-lg px-3 text-sm font-semibold flex items-center"
                  style={{ minHeight: 40, border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  Xem trước
                </Link>
                {d.banSaoCuaToi ? (
                  <Link
                    href={`/journal/vocab/decks/${d.banSaoCuaToi}`}
                    className="flex-1 rounded-lg px-3 text-sm font-bold flex items-center justify-center"
                    style={{ minHeight: 40, background: "rgba(74,124,89,.15)", color: "var(--accent-green)" }}
                  >
                    Đã có · mở bộ
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => lay(d)}
                    disabled={dangLay !== null}
                    className="flex-1 rounded-lg px-3 text-sm font-bold disabled:opacity-60"
                    style={{ minHeight: 40, background: "var(--accent-primary)", color: "#fff" }}
                  >
                    {dangLay === d.id ? "Đang lấy…" : "Lấy về"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
