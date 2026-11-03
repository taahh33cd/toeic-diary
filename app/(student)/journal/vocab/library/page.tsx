"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { Sheet } from "@/components/journal/paper/Sheet";
import { cloneDeck, type LibraryDeck } from "@/lib/vocab/client";
import { useLibrary } from "@/hooks/useLibrary";

const GREEN = "var(--accent-green, #4A7C59)";
const RED = "var(--accent-red, #B94040)";

export default function LibraryPage() {
  const router = useRouter();
  const [part, setPart] = useState<number | null>(null);
  const [dangLay, setDangLay] = useState<string | null>(null);
  const [loiLay, setLoiLay] = useState<string | null>(null);
  const { decks: tatCa, loading, error } = useLibrary();
  const loi = loiLay ?? error;
  // Lọc tại chỗ: thư viện nhỏ, không đáng gọi lại server mỗi lần bấm tab.
  const decks = part === null ? tatCa : tatCa.filter((d) => d.part === part);

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

  return (
    <div className="space-y-4">
      <PageHeading
        title="Thư viện bộ mẫu"
        note="Bộ từ do thầy soạn — lấy về kho của bạn rồi sửa theo ý mình"
        actions={
          <>
            <Link href="/journal/vocab/decks" className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
              ← Bộ thẻ của tôi
            </Link>
          </>
        }
      />

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setPart(null)}
          className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: part === null ? "var(--accent-primary)" : "var(--bg-elevated)",
            color: part === null ? "#fff" : "var(--text-muted)",
          }}
        >
          Tất cả
        </button>
        {[1, 2, 3, 4, 5, 6, 7].map((p) => {
          const n = tatCa.filter((d) => d.part === p).length;
          return (
            <button
              key={p}
              onClick={() => setPart(p)}
              disabled={!loading && n === 0}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: part === p ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: part === p ? "#fff" : "var(--text-muted)",
                opacity: !loading && n === 0 ? 0.4 : 1,
              }}
            >
              Part {p}
              {n > 0 && ` · ${n}`}
            </button>
          );
        })}
      </div>

      {loi && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
          {loi}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <Sheet className="text-center py-10">
          <div className="text-4xl mb-2">📚</div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Thư viện chưa có bộ nào{part ? ` cho Part ${part}` : ""}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Thầy đăng bộ mẫu lên đây để cả lớp dùng chung.
          </p>
        </Sheet>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}>
          {decks.map((d) => (
            <Sheet key={d.id} fold className="h-full p-4 flex flex-col">
              <div className="flex-1">
                <h3 className="font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                  {d.title}
                </h3>
                {d.description && (
                  <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {d.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)" }}>
                    {d.cardCount} thẻ
                  </span>
                  {d.part !== null && (
                    <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)" }}>
                      Part {d.part}
                    </span>
                  )}
                  {d.tacGia && <span>· {d.tacGia}</span>}
                </div>
                {d.daHocTrongBo > 0 && (
                  <p className="text-xs mt-2" style={{ color: GREEN }}>
                    Bạn đã học {d.daHocTrongBo}/{d.cardCount} từ trong bộ này — tiến độ được giữ nguyên.
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href={`/flashcards/d/${d.slug}`}
                  className="px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                >
                  Xem trước
                </Link>
                {d.banSaoCuaToi ? (
                  <Link
                    href={`/journal/vocab/decks/${d.banSaoCuaToi}`}
                    className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(74,124,89,.15)", color: GREEN }}
                  >
                    ✓ Đã có trong kho — mở
                  </Link>
                ) : (
                  <button
                    onClick={() => lay(d)}
                    disabled={dangLay !== null}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold"
                    style={{
                      background: "var(--accent-primary)",
                      color: "#fff",
                      opacity: dangLay === d.id ? 0.6 : 1,
                    }}
                  >
                    {dangLay === d.id ? "Đang lấy…" : "+ Thêm vào kho của tôi"}
                  </button>
                )}
              </div>
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}
