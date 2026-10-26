"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";

export type RailCard = { id: string; node: React.ReactNode };

const RAIL_WIDTH = 300;
const CARD_GAP = 10;
/** Dưới ngưỡng này thì lề comment không đủ chỗ → đổ xuống dưới bài. */
const NARROW_AT = 1000;

const NARROW_QUERY = `(max-width: ${NARROW_AT}px)`;

/**
 * Màn hẹp HOẶC đang in đều phải bỏ lề comment. Đọc thẳng từ matchMedia thay vì
 * nuôi state riêng — khỏi phải setState trong effect và khỏi lệch một nhịp render.
 */
function subscribeLayout(onChange: () => void) {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", onChange);
  window.addEventListener("beforeprint", onChange);
  window.addEventListener("afterprint", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("beforeprint", onChange);
    window.removeEventListener("afterprint", onChange);
  };
}

function readLayout(): boolean {
  return window.matchMedia(NARROW_QUERY).matches || window.matchMedia("print").matches;
}

/**
 * Bố cục "tờ giấy + lề comment" kiểu Google Docs.
 *
 * Trang giấy chứa toàn bộ bài viết; mỗi comment ở lề phải được canh ngang tầm
 * với đoạn chữ nó neo vào (tìm qua `[data-annotation-id]`), và tự đẩy xuống khi
 * hai comment đè nhau. Màn hẹp hoặc lúc in thì comment đổ xuống dưới bài.
 */
export function DocumentSheet({
  toolbar,
  cards,
  activeId,
  children,
}: {
  /** Thanh công cụ dính trên cùng — tự ẩn khi in. */
  toolbar?: React.ReactNode;
  cards: RailCard[];
  activeId?: string | null;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  /** Lần canh đầu tiên phải nhảy thẳng vào chỗ, đừng để thẻ "bay" từ đỉnh xuống. */
  const settled = useRef(false);
  const rafRef = useRef(0);
  // Server render mặc định bố cục rộng; client tự chỉnh lại ngay lần hydrate.
  const narrow = useSyncExternalStore(subscribeLayout, readLayout, () => false);

  /**
   * `cards` là mảng mới ở mỗi lần cha render (mỗi phím gõ), nên không đưa nó vào
   * deps: measure chỉ cần biết có những thẻ nào. Giữ danh sách id dạng chuỗi để
   * identity của measure chỉ đổi khi thẻ thêm/bớt — trước đây nó đổi mỗi ký tự,
   * kéo theo đo lại toàn bộ và dựng lại ResizeObserver, gõ nhiều nhận xét là lag.
   */
  const ids = cards.map((c) => c.id).join("|");

  /**
   * Ghi vị trí thẳng vào DOM thay vì qua state: canh comment là việc của layout,
   * không cần render lại React — tránh vòng lặp đo → setState → đo.
   * Đọc hết rồi mới ghi để không xen kẽ đọc/ghi layout trong vòng lặp.
   */
  const measure = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet || narrow) return;
    const base = sheet.getBoundingClientRect().top;

    const wanted = ids.split("|").filter(Boolean).map((id) => {
      const anchor = sheet.querySelector(`[data-annotation-id="${CSS.escape(id)}"]`);
      const top = anchor ? anchor.getBoundingClientRect().top - base : Number.MAX_SAFE_INTEGER;
      return { id, top, el: cardRefs.current.get(id) };
    });

    // Xếp từ trên xuống, comment sau không được đè lên comment trước.
    wanted.sort((a, b) => a.top - b.top);
    const heights = wanted.map((w) => w.el?.offsetHeight ?? 0);

    const transition = settled.current ? "transform 160ms ease" : "none";
    let cursor = 0;
    wanted.forEach((w, i) => {
      if (!w.el) return;
      const y = Math.max(w.top === Number.MAX_SAFE_INTEGER ? cursor : w.top, cursor);
      w.el.style.transition = transition;
      w.el.style.transform = `translateY(${y}px)`;
      w.el.style.zIndex = activeId === w.id ? "2" : "1";
      cursor = y + heights[i] + CARD_GAP;
    });
    settled.current = true;
  }, [ids, narrow, activeId]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(measure);
  }, [measure]);

  // Thẻ thêm/bớt hoặc đổi thẻ đang chọn: canh ngay, trước khi trình duyệt vẽ.
  useLayoutEffect(() => { measure(); }, [measure]);

  /**
   * Mốc neo xê dịch khi bài dài ra, ảnh tải xong, đổi cỡ cửa sổ, đổi chế độ xem
   * hoặc thầy gõ chữ đề xuất (MutationObserver); thẻ cao lên khi có trả lời
   * mới (ResizeObserver từng thẻ). Gõ vào ô nhận xét không đụng cái nào trong
   * đó nên không còn đo lại.
   */
  useEffect(() => {
    const wrap = wrapRef.current;
    const sheet = sheetRef.current;
    if (!wrap || !sheet || narrow) return;
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    ro.observe(sheet);
    cardRefs.current.forEach((el) => ro.observe(el));
    const mo = new MutationObserver(schedule);
    mo.observe(sheet, { childList: true, subtree: true, characterData: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [schedule, narrow, ids]);

  return (
    <div ref={wrapRef} className="w-full">
      {toolbar && (
        <div
          className="sticky top-0 z-20 print:hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          {toolbar}
        </div>
      )}

      <div
        className="flex justify-center gap-6 px-3 md:px-6 py-6 print:p-0 print:block"
        style={{ alignItems: "flex-start" }}
      >
        {/* Tờ giấy */}
        <div
          ref={sheetRef}
          className="w-full print:shadow-none print:border-0 print:max-w-none"
          style={{
            maxWidth: 780,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "var(--shadow-sm)",
            padding: "clamp(1.6rem, 4vw, 3rem) clamp(1.4rem, 4vw, 3.2rem)",
          }}
        >
          {children}

          {/* Màn hẹp (và lúc in — xem listener beforeprint): comment đổ xuống dưới bài */}
          {narrow && cards.length > 0 && (
            <div className="mt-8 flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--text-muted)" }}>
                Nhận xét ({cards.length})
              </p>
              {cards.map((c) => <div key={c.id}>{c.node}</div>)}
            </div>
          )}
        </div>

        {/* Lề comment */}
        {!narrow && (
          <div
            className="relative shrink-0 print:hidden"
            style={{ width: RAIL_WIDTH, minHeight: 1 }}
          >
            {cards.map((c) => (
              <div
                key={c.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(c.id, el);
                  else cardRefs.current.delete(c.id);
                }}
                // Vị trí do measure() ghi trực tiếp vào style (transform/zIndex).
                className="absolute left-0 top-0 w-full"
              >
                {c.node}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
