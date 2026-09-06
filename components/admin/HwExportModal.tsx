"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Homework } from "@/lib/firebase/types";

// Dùng chung cho trang lớp và trang học viên: cùng một BTVN phải ra cùng một
// ảnh dù giáo viên xuất từ đâu.

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

type ExportCatKey = "vocab" | "reading" | "listening" | "other" | "practice";

const HW_CATS: { key: ExportCatKey; label: string; color: string }[] = [
  { key: "vocab",     label: "Từ vựng",      color: "#3B82F6" },
  { key: "reading",   label: "Đọc",          color: "#10B981" },
  { key: "listening", label: "Nghe",         color: "#F97316" },
  { key: "other",     label: "Khác",         color: "#8B5CF6" },
  { key: "practice",  label: "Đề luyện thi", color: "#EF4444" },
];

// ─── Xuất ảnh BTVN ────────────────────────────────────────────────────────────

/** Bề ngang cố định của ảnh xuất ra — đủ rộng để đọc trên điện thoại. */
const EXPORT_WIDTH = 720;

/**
 * Ảnh gửi cho học viên KHÔNG kèm tiến độ từng người: cùng một ảnh chia vào
 * nhóm lớp thì tiến độ của mỗi HV thành chuyện công khai. Ở đây chỉ dựng lại
 * phần đề bài, dùng màu cố định thay vì biến CSS theo theme để ảnh luôn ra nền
 * sáng dù admin đang xem ở theme nào.
 */
function HwExportCanvas({
  hw,
  nodeRef,
}: {
  hw: Homework;
  nodeRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={nodeRef}
      style={{
        position: "fixed",
        left: -99999,
        top: 0,
        width: EXPORT_WIDTH,
        background: "#ffffff",
        padding: 28,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: "#1a1a1a",
      }}
    >
      {/* Đầu đề thương hiệu */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "#4441c4",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          H²
        </span>
        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-.01em" }}>Anh Hiếu²</span>
      </div>

      {hw.title && (
        <p style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3, margin: "0 0 4px" }}>{hw.title}</p>
      )}
      <p style={{ fontSize: 14, fontWeight: 600, color: "#8a7a68", margin: "0 0 18px" }}>
        {fmtDate(hw.date)}
        {hw.endDate ? ` → ${fmtDate(hw.endDate)}` : ""}
      </p>

      {HW_CATS.map(({ key, label, color }) => {
        const items = hw[key];
        if (!items?.length) return null;
        return (
          <div
            key={key}
            style={{ border: `1.5px solid ${color}40`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${color}18` }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: color }} />
              <span
                style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color, textTransform: "uppercase" }}
              >
                {label}
              </span>
            </div>
            <div style={{ padding: "10px 12px" }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 9,
                    alignItems: "flex-start",
                    marginBottom: i === items.length - 1 ? 0 : 12,
                  }}
                >
                  <span style={{ marginTop: 7, width: 6, height: 6, borderRadius: 99, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        lineHeight: 1.45,
                        color: item.link ? color : "#1a1a1a",
                        wordBreak: "break-word",
                      }}
                      dangerouslySetInnerHTML={{ __html: item.text }}
                    />
                    {item.desc && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          lineHeight: 1.55,
                          padding: "7px 9px",
                          borderRadius: 8,
                          background: `${color}0D`,
                          borderLeft: `3px solid ${color}55`,
                          color: "#3d3d3d",
                          wordBreak: "break-word",
                        }}
                        dangerouslySetInnerHTML={{ __html: item.desc }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HwExportModal({
  hw,
  label,
  onClose,
}: {
  hw: Homework;
  label: string;
  onClose: () => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Nạp động: thư viện chỉ cần khi thực sự xuất ảnh, không nhét vào bundle trang.
        const { toPng } = await import("html-to-image");
        // Chờ trình duyệt vẽ xong node canvas, không thì chụp phải bố cục dở.
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        if (!nodeRef.current) return;
        // Node gốc nằm lệch khỏi màn hình bằng position:fixed. html-to-image
        // clone nguyên style đó vào foreignObject nên phải kéo bản clone về
        // gốc toạ độ, không thì ảnh ra trắng trơn.
        const capture = toPng(nodeRef.current, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          width: EXPORT_WIDTH,
          // Canvas chỉ dùng font hệ thống. Không skip thì thư viện cố đọc mọi
          // stylesheet để nhúng font và ném SecurityError ở Google Fonts
          // (cross-origin), vừa chậm vừa rác console.
          skipFonts: true,
          style: { position: "static", left: "0", top: "0", margin: "0" },
        });
        // Không để hộp thoại kẹt mãi ở "Đang tạo ảnh…" nếu thư viện không trả về.
        const url = await Promise.race([
          capture,
          new Promise<never>((_, rj) =>
            setTimeout(() => rj(new Error("Tạo ảnh quá lâu. Thử đóng bớt tab rồi bấm lại.")), 20000)
          ),
        ]);
        if (!cancelled) setDataUrl(url);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fileName = `BTVN_${label.replace(/[^\p{L}\p{N}]+/gu, "-")}_${hw.date}.png`;

  async function handleCopy() {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Trình duyệt không cho copy ảnh. Dùng nút Tải ảnh rồi đính kèm thủ công.");
    }
  }

  return (
    <>
      <HwExportCanvas hw={hw} nodeRef={nodeRef} />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={onClose}
      >
        <div
          className="rounded-2xl border flex flex-col"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            maxWidth: 560,
            width: "100%",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              🖼 Ảnh BTVN
            </h3>
            <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
              <X size={16} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
            {error ? (
              <p className="text-xs text-center py-6" style={{ color: "rgb(220,38,38)" }}>
                {error}
              </p>
            ) : dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt="Ảnh BTVN"
                style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }}
              />
            ) : (
              <p className="text-xs text-center py-10" style={{ color: "var(--text-muted)" }}>
                Đang tạo ảnh…
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={handleCopy}
              disabled={!dataUrl}
              className="px-4 py-2 rounded-xl text-sm font-semibold border disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {copied ? "✓ Đã copy" : "Copy ảnh"}
            </button>
            <a
              href={dataUrl ?? undefined}
              download={fileName}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "var(--accent-primary)",
                color: "#fff",
                opacity: dataUrl ? 1 : 0.5,
                pointerEvents: dataUrl ? "auto" : "none",
              }}
            >
              Tải ảnh
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
