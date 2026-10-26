"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bìa sổ + tab chương dính trên đầu.
 *
 * Cuộn xuống thì bìa sổ thu lại (tab chương vẫn còn), cuộn lên hiện lại —
 * lấy lại ~56px chiều cao khi đang đọc, đáng nhất trên điện thoại.
 * Không thu khi còn ở sát đỉnh trang, và tôn trọng prefers-reduced-motion.
 */
export function StickyHeader({
  cover,
  tabs,
}: {
  cover: React.ReactNode;
  tabs: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        // Ngưỡng 8px để rung tay không làm bìa sổ nhấp nháy
        if (Math.abs(delta) > 8) {
          setHidden(y > 140 && delta > 0);
          lastY.current = y;
        }
        ticking.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-40">
      <div
        className="journal-cover-shell"
        data-hidden={hidden ? "true" : undefined}
        aria-hidden={hidden}
      >
        {cover}
      </div>
      {tabs}
    </div>
  );
}
