"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 8;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Ảnh xem được bằng cuộn chuột, nút +/−, và chụm hai ngón; kéo để di khi đã
 * phóng to. Dùng trong modal xem bài nộp — học viên hay chụp màn hình chữ nhỏ.
 *
 * Component tự giữ state zoom, nên nơi dùng chỉ cần đặt `key={src}` là đổi file
 * sẽ tự về 100% mà không phải viết effect reset.
 */
export function ZoomableImage({ src, alt = "" }: { src: string; alt?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragging, setDragging] = useState(false);

  // pointerId → vị trí, để phân biệt kéo một ngón (di ảnh) với chụm hai ngón (zoom)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  /** Phóng to quanh một điểm neo (toạ độ so với tâm khung), giữ điểm đó đứng yên. */
  const zoomAt = useCallback((nextScaleRaw: number, ax: number, ay: number) => {
    setScale((prev) => {
      const next = clamp(nextScaleRaw, MIN_SCALE, MAX_SCALE);
      const ratio = next / prev;
      setTx((prevTx) => (next === MIN_SCALE ? 0 : ax - (ax - prevTx) * ratio));
      setTy((prevTy) => (next === MIN_SCALE ? 0 : ay - (ay - prevTy) * ratio));
      return next;
    });
  }, []);

  // Wheel phải gắn tay với passive:false — React gắn listener thụ động nên
  // preventDefault trong onWheel không chặn được cuộn trang.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = box!.getBoundingClientRect();
      const ax = e.clientX - rect.left - rect.width / 2;
      const ay = e.clientY - rect.top - rect.height / 2;
      setScale((prev) => {
        const next = clamp(prev * (1 - e.deltaY * 0.0018), MIN_SCALE, MAX_SCALE);
        const ratio = next / prev;
        setTx((prevTx) => (next === MIN_SCALE ? 0 : ax - (ax - prevTx) * ratio));
        setTy((prevTy) => (next === MIN_SCALE ? 0 : ay - (ay - prevTy) * ratio));
        return next;
      });
    }
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
    } else if (scale > 1) {
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const pointers = pointersRef.current;
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2 && pinchRef.current) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ax = (a.x + b.x) / 2 - rect.left - rect.width / 2;
      const ay = (a.y + b.y) / 2 - rect.top - rect.height / 2;
      zoomAt((pinchRef.current.scale * dist) / pinchRef.current.dist, ax, ay);
      return;
    }

    if (dragging && scale > 1) {
      setTx((v) => v + (e.clientX - prev.x));
      setTy((v) => v + (e.clientY - prev.y));
    }
  }

  function endPointer(e: React.PointerEvent) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) setDragging(false);
  }

  /**
   * Khi đã phóng to, cử chỉ một ngón là di ảnh — chặn không cho nổi bọt lên
   * handler vuốt-đổi-file của modal, không thì vừa kéo vừa nhảy sang ảnh khác.
   */
  function stopSwipeWhenZoomed(e: React.TouchEvent) {
    if (scale > 1 || e.touches.length > 1) e.stopPropagation();
  }

  const btn: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 6,
    background: "rgba(255,255,255,.15)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: ".95rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onTouchStart={stopSwipeWhenZoomed}
        onTouchMove={stopSwipeWhenZoomed}
        onTouchEnd={stopSwipeWhenZoomed}
        style={{
          width: "100%",
          height: "65vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: scale > 1 ? "none" : "pan-y",
          cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: dragging ? "none" : "transform .12s ease-out",
            userSelect: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: ".35rem", marginTop: ".5rem" }}>
        <button type="button" style={btn} onClick={() => zoomAt(scale - 0.5, 0, 0)} aria-label="Thu nhỏ">−</button>
        <button
          type="button"
          onClick={reset}
          style={{ ...btn, width: "auto", padding: "0 .6rem", fontSize: ".75rem", fontWeight: 600 }}
          title="Về 100%"
        >
          {Math.round(scale * 100)}%
        </button>
        <button type="button" style={btn} onClick={() => zoomAt(scale + 0.5, 0, 0)} aria-label="Phóng to">+</button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btn, width: "auto", padding: "0 .6rem", fontSize: ".72rem", fontWeight: 600, textDecoration: "none" }}
          title="Mở ảnh gốc trong tab mới"
        >
          Ảnh gốc ↗
        </a>
      </div>
    </div>
  );
}
