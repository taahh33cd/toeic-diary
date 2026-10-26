"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CardRow, ProgressRow } from "@/lib/vocab/client";
import { recordVocabReview } from "@/lib/vocab/review-client";
import { playWord } from "@/lib/vocab/audio";

const GREEN = "var(--accent-green, #4A7C59)";
const RED = "var(--accent-red, #B94040)";

interface Props {
  title: string;
  cards: CardRow[];
  progress: ProgressRow[];
  /** Chỉ học những từ đang đến hạn. */
  dueOnly?: boolean;
  onExit: () => void;
}

/**
 * Chế độ Học: lật thẻ rồi tự đánh dấu Thuộc / Chưa thuộc.
 *
 * Thẻ "Chưa thuộc" quay về cuối hàng đợi nên một lượt chỉ kết thúc khi mọi thẻ
 * đã được nhận là thuộc — cách này lấy từ FlashcardDeck của subskill Speaking.
 * Mỗi lượt đánh dấu gọi /api/flashcards/review để đẩy lịch ôn ngay, không chờ
 * đến cuối: học viên bỏ giữa chừng thì phần đã làm vẫn được tính.
 */
export default function StudyDeck({ title, cards, progress, dueOnly = false, onExit }: Props) {
  const progressByKey = useMemo(
    () => new Map(progress.map((p) => [p.wordKey, p])),
    [progress]
  );

  const banDau = useMemo(() => {
    const denHan = (c: CardRow) => {
      const p = progressByKey.get(c.wordKey);
      if (!p) return true; // chưa học lần nào
      if (p.mastered) return false;
      return p.dueAt === null || new Date(p.dueAt) <= new Date();
    };
    const pool = dueOnly ? cards.filter(denHan) : cards;
    // Từ đến hạn lên trước để học viên gặp đúng việc cần làm ngay
    return [...pool].sort((a, b) => Number(denHan(b)) - Number(denHan(a)));
  }, [cards, dueOnly, progressByKey]);

  const [queue, setQueue] = useState<CardRow[]>(banDau);
  const [flipped, setFlipped] = useState(false);
  const [thuoc, setThuoc] = useState<string[]>([]);
  const [latLai, setLatLai] = useState(0);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const card = queue[0];

  const danhDau = useCallback(
    async (known: boolean) => {
      if (!card || dangLuu) return;
      setDangLuu(true);
      setFlipped(false);
      const p = await recordVocabReview({
        outcome: { kind: "flip", word: card.word, known },
      });
      // Ghi thất bại thì vẫn cho học tiếp, nhưng nói rõ là chưa lưu được —
      // im lặng ở đây là tệ nhất: học viên tưởng đã tính mà thực ra không.
      setLoi(p ? null : "Chưa lưu được tiến độ (mất mạng?)");
      if (known) {
        setThuoc((l) => [...l, card.id]);
        setQueue((q) => q.slice(1));
      } else {
        setLatLai((n) => n + 1);
        setQueue((q) => [...q.slice(1), q[0]]);
      }
      setDangLuu(false);
    },
    [card, dangLuu]
  );

  // Bàn phím: Space lật, 1/2 đánh dấu — học nhanh không phải rời tay khỏi bàn phím
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === "1" || e.key === "2")) {
        e.preventDefault();
        danhDau(e.key === "2");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, danhDau]);

  if (banDau.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-2">✅</div>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Không có từ nào đến hạn ôn
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Quay lại sau nhé — hoặc học cả bộ để ôn sớm.
        </p>
        <button onClick={onExit} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
          ← Về bộ thẻ
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-2">🎓</div>
        <p className="font-bold text-lg" style={{ color: GREEN }}>
          Xong {banDau.length} thẻ!
        </p>
        <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
          {latLai > 0
            ? `Bạn lật lại ${latLai} lần. Những từ đó sẽ quay lại sớm hơn.`
            : "Không phải lật lại lần nào — lịch ôn đã giãn ra."}
        </p>
        <button onClick={onExit} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--accent-primary)", color: "#fff" }}>
          ← Về bộ thẻ
        </button>
      </div>
    );
  }

  const p = progressByKey.get(card.wordKey);
  const daLam = thuoc.length;
  const pct = Math.round((daLam / banDau.length) * 100);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onExit} className="text-sm px-2 py-1 rounded-lg"
          style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {daLam}/{banDau.length} thẻ · lật lại {latLai}
          </p>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: "var(--accent-primary)" }} />
      </div>

      {loi && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
          {loi} — tiến độ thẻ vừa rồi chưa được lưu.
        </p>
      )}

      {/* Thẻ: bấm để lật */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left rounded-2xl p-6 mb-4"
        style={{
          minHeight: 220,
          background: "var(--bg-elevated)",
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {!flipped ? (
          <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 170 }}>
            <p className="hand" style={{ fontSize: "2.2rem", color: "var(--accent-primary)", lineHeight: 1.1 }}>
              {card.word}
            </p>
            {card.ipa && (
              <p className="mt-1.5 font-mono text-sm" style={{ color: "var(--text-muted)" }}>{card.ipa}</p>
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); playWord(card.word, card.audioUrl ?? undefined); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); playWord(card.word, card.audioUrl ?? undefined); } }}
              className="mt-3 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            >
              🔊 Nghe
            </span>
            <p className="text-xs mt-4" style={{ color: "var(--text-light, var(--text-muted))" }}>
              Bấm thẻ hoặc Space để lật
            </p>
          </div>
        ) : (
          <div style={{ minHeight: 170 }}>
            <p className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              {card.meaningVi || <span style={{ color: "var(--text-muted)" }}>(chưa có nghĩa)</span>}
            </p>
            {card.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.imageUrl} alt={card.meaningVi ?? card.word}
                className="rounded-lg mb-2" style={{ maxHeight: 180, objectFit: "contain" }} />
            )}
            {card.example && (
              <p className="text-sm italic px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                “{card.example}”
              </p>
            )}
            {p && (
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                đã ôn ×{p.repCount}
                {p.intervalDays > 0 && ` · giãn cách ${p.intervalDays} ngày`}
                {p.wrongCount > 0 && ` · sai ${p.wrongCount} lần`}
              </p>
            )}
          </div>
        )}
      </button>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => danhDau(false)}
            disabled={dangLuu}
            className="py-3 rounded-xl font-bold text-sm"
            style={{ background: "rgba(185,64,64,.12)", color: RED, opacity: dangLuu ? 0.5 : 1 }}
          >
            Chưa thuộc <span className="font-normal opacity-60">(1)</span>
          </button>
          <button
            onClick={() => danhDau(true)}
            disabled={dangLuu}
            className="py-3 rounded-xl font-bold text-sm"
            style={{ background: GREEN, color: "#fff", opacity: dangLuu ? 0.5 : 1 }}
          >
            Thuộc <span className="font-normal opacity-70">(2)</span>
          </button>
        </div>
      )}
    </div>
  );
}
