"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CardRow, ProgressRow } from "@/lib/vocab/client";
import { recordVocabReview } from "@/lib/vocab/review-client";
import { playWord } from "@/lib/vocab/audio";
import FlipCard from "./FlipCard";

const GREEN = "var(--accent-green, #4A7C59)";
const RED = "var(--accent-red, #B94040)";

interface Props {
  title: string;
  cards: CardRow[];
  progress: ProgressRow[];
  /** Chỉ học những từ đang đến hạn. */
  dueOnly?: boolean;
  onExit: () => void;
  /**
   * Cách ghi một lượt đánh dấu. Mặc định ghi vào Postgres qua API (cần đăng
   * nhập). Trang chia sẻ công khai truyền hàm ghi localStorage vào đây, nên
   * khách không đăng nhập vẫn học được mà không phải viết lại cả màn lật thẻ.
   * Trả false khi ghi hỏng.
   */
  onReview?: (word: string, known: boolean) => Promise<boolean>;
  /** Hiện ở màn kết thúc — dùng cho lời mời đăng ký trên trang công khai. */
  ketThuc?: React.ReactNode;
  /** Chữ trên nút thoát ở màn kết thúc. */
  exitLabel?: string;
}

/**
 * Chế độ Học: lật thẻ rồi tự đánh dấu Thuộc / Chưa thuộc.
 *
 * Thẻ "Chưa thuộc" quay về cuối hàng đợi nên một lượt chỉ kết thúc khi mọi thẻ
 * đã được nhận là thuộc — cách này lấy từ FlashcardDeck của subskill Speaking.
 * Mỗi lượt đánh dấu gọi /api/flashcards/review để đẩy lịch ôn ngay, không chờ
 * đến cuối: học viên bỏ giữa chừng thì phần đã làm vẫn được tính.
 */
export default function StudyDeck({
  title,
  cards,
  progress,
  dueOnly = false,
  onExit,
  onReview,
  ketThuc,
  exitLabel = "← Về bộ thẻ",
}: Props) {
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
  /** Tăng mỗi lượt đánh dấu — làm khoá cho thẻ để thẻ kế tiếp vào ở mặt trước. */
  const [luot, setLuot] = useState(0);
  /**
   * Thông báo sau khi ghi tiến độ.
   *
   * Phải phân biệt "mất rồi" với "đang giữ, sẽ gửi sau" — hai chuyện khác
   * hẳn nhau. Trước đây chỉ có một chuỗi, và khung hiển thị tự nối thêm
   * "— tiến độ thẻ vừa rồi chưa được lưu", nên câu báo đang-giữ hoá ra tự
   * mâu thuẫn và vẫn doạ học viên ngồi lật lại cả bộ.
   */
  const [loi, setLoi] = useState<{ text: string; mat: boolean } | null>(null);

  const card = queue[0];

  const danhDau = useCallback(
    async (known: boolean) => {
      if (!card || dangLuu) return;
      setDangLuu(true);
      setFlipped(false);
      let bao: { text: string; mat: boolean } | null = null;
      if (onReview) {
        bao = (await onReview(card.word, known))
          ? null
          : { text: "Chưa lưu được tiến độ (mất mạng?)", mat: true };
      } else {
        const r = await recordVocabReview({ outcome: { kind: "flip", word: card.word, known } });
        // Mất mạng mà đã giữ lại được thì ĐỪNG báo đỏ: học viên thấy "chưa
        // lưu" sẽ ngồi lật lại cả bộ, trong khi kết quả vẫn nguyên trong hàng.
        bao =
          r.trangThai === "ok"
            ? null
            : r.trangThai === "cho-gui"
              ? { text: "Mất mạng — tiến độ đang giữ trên máy, sẽ tự gửi khi có mạng.", mat: false }
              : { text: "Chưa lưu được tiến độ (mất mạng?)", mat: true };
      }
      setLoi(bao);
      setLuot((n) => n + 1);
      if (known) {
        setThuoc((l) => [...l, card.id]);
        setQueue((q) => q.slice(1));
      } else {
        setLatLai((n) => n + 1);
        setQueue((q) => [...q.slice(1), q[0]]);
      }
      setDangLuu(false);
    },
    [card, dangLuu, onReview]
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
          {exitLabel}
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
        {ketThuc}
        <button onClick={onExit} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--accent-primary)", color: "#fff" }}>
          {exitLabel}
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
        <p
          className="text-xs mb-3 px-3 py-2 rounded-lg"
          style={
            loi.mat
              ? { background: "rgba(185,64,64,.1)", color: RED }
              : { background: "rgba(74,124,89,.12)", color: GREEN }
          }
        >
          {loi.mat ? `${loi.text} — tiến độ thẻ vừa rồi chưa được lưu.` : loi.text}
        </p>
      )}

      {/* Thẻ: bấm để lật — lật quanh trục ngang như Quizlet */}
      <div className="mb-4">
        <FlipCard
          cardKey={`${card.id}-${luot}`}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          height={card.imageUrl ? 360 : 300}
          overlay={
            <button
              type="button"
              onClick={() => playWord(card.word, card.audioUrl ?? undefined)}
              aria-label={`Nghe ${card.word}`}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M16 9a4 4 0 010 6" /></svg>
            </button>
          }
          front={
            <>
              <span className="hand" style={{ fontSize: "2.4rem", color: "var(--accent-primary)", lineHeight: 1.1 }}>
                {card.word}
              </span>
              {card.ipa && (
                <span className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>{card.ipa}</span>
              )}
              <span className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Bấm thẻ hoặc Space để lật
              </span>
            </>
          }
          back={
            <>
              <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {card.meaningVi || <span style={{ color: "var(--text-muted)" }}>(chưa có nghĩa)</span>}
              </span>
              {card.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.imageUrl} alt="" className="rounded-lg" style={{ maxHeight: 140, objectFit: "contain" }} />
              )}
              {card.example && (
                <span className="text-sm italic px-3 py-2 rounded-lg"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                  “{card.example}”
                </span>
              )}
              {p && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  đã ôn ×{p.repCount}
                  {p.intervalDays > 0 && ` · giãn cách ${p.intervalDays} ngày`}
                  {p.wrongCount > 0 && ` · sai ${p.wrongCount} lần`}
                </span>
              )}
            </>
          }
        />
      </div>

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
