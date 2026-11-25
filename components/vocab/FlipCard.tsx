"use client";

/**
 * Thẻ lật kiểu Quizlet: lật quanh trục ngang (rotateX), hai mặt cùng kích
 * thước, thẻ mới trượt vào từ bên phải.
 *
 * Chỉ lo phần hình: nơi dùng giữ trạng thái `flipped` và xử lý bàn phím.
 * Đổi `cardKey` khi sang thẻ khác để thẻ mới vào ở mặt trước mà không lật
 * ngược lại cho người học thấy đáp án thẻ cũ.
 *
 * Bên trong hai mặt KHÔNG đặt nút bấm (thẻ đã là một <button>); nút phát âm
 * hay đánh dấu sao đặt bằng `overlay`, nằm đè lên góc thẻ nhưng ngoài vùng lật.
 */
export default function FlipCard({
  flipped,
  onFlip,
  front,
  back,
  cardKey,
  overlay,
  height = 300,
  label = "Thẻ từ vựng — bấm để lật",
}: {
  flipped: boolean;
  onFlip: () => void;
  front: React.ReactNode;
  back: React.ReactNode;
  cardKey: string;
  overlay?: React.ReactNode;
  height?: number;
  label?: string;
}) {
  return (
    <div className="fc-wrap" style={{ height }} key={cardKey}>
      <style>{CSS}</style>
      <button
        type="button"
        onClick={onFlip}
        aria-label={label}
        aria-pressed={flipped}
        className={`fc-card${flipped ? " fc-flipped" : ""}`}
      >
        <span className="fc-face fc-front">{front}</span>
        <span className="fc-face fc-back" aria-hidden={!flipped}>{back}</span>
      </button>
      {overlay && <div className="fc-overlay">{overlay}</div>}
    </div>
  );
}

const CSS = `
.fc-wrap{position:relative;perspective:1400px;animation:fc-in .28s ease-out}
.fc-card{position:relative;display:block;width:100%;height:100%;padding:0;border:0;background:none;cursor:pointer;
  transform-style:preserve-3d;transition:transform .5s cubic-bezier(.4,.2,.2,1);font:inherit;color:inherit;text-align:center}
.fc-card:focus-visible{outline:3px solid var(--accent-primary);outline-offset:4px;border-radius:20px}
.fc-flipped{transform:rotateX(180deg)}
.fc-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:28px 24px;border-radius:20px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:auto;
  background:var(--bg-elevated);border:1.5px solid var(--border);box-shadow:0 10px 28px -12px rgba(43,33,24,.35)}
.fc-back{transform:rotateX(180deg)}
.fc-overlay{position:absolute;top:12px;right:12px;display:flex;gap:6px;z-index:2}
@keyframes fc-in{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .fc-wrap{animation:none}
  .fc-card{transition:none;transform:none}
  .fc-face{backface-visibility:visible;-webkit-backface-visibility:visible;transition:opacity .15s}
  .fc-back{transform:none;opacity:0}
  .fc-flipped .fc-front{opacity:0}
  .fc-flipped .fc-back{opacity:1}
}
`;
