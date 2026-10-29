"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";

const RED = "var(--accent-red, #B94040)";

interface Anh {
  url: string;
  thumb: string;
  tacGia: string;
}

/**
 * Chọn ảnh cho một thẻ. Ba đường, vì không đường nào luôn sẵn:
 *   1. Tìm trên Pexels — cần PEXELS_API_KEY ở server
 *   2. Tải ảnh lên — cần cấu hình Cloudinary
 *   3. Dán link ảnh — luôn chạy, không cần cấu hình gì
 *
 * Thiếu cấu hình thì nói thẳng và chỉ sang đường còn lại, chứ không hiện ô tìm
 * kiếm rỗng để người dùng ngồi thử từ khoá mãi.
 */
export default function ImagePicker({
  tuKhoa,
  anhHienTai,
  onChon,
  onDong,
}: {
  tuKhoa: string;
  anhHienTai?: string;
  onChon: (url: string, publicId?: string) => void;
  onDong: () => void;
}) {
  const [q, setQ] = useState(tuKhoa);
  const [ds, setDs] = useState<Anh[] | null>(null);
  const [dangTim, setDangTim] = useState(false);
  const [loiTim, setLoiTim] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const oFile = useRef<HTMLInputElement>(null);

  const tim = useCallback(async (tu: string) => {
    if (!tu.trim()) return;
    setDangTim(true);
    setLoiTim(null);
    try {
      const res = await fetch(`/api/flashcards/images?q=${encodeURIComponent(tu)}`, { cache: "no-store" });
      const d = (await res.json()) as { anh?: Anh[]; error?: string };
      if (!res.ok) throw new Error(d.error ?? "Không tìm được ảnh");
      setDs(d.anh ?? []);
    } catch (e) {
      setLoiTim(e instanceof Error ? e.message : "Không tìm được ảnh");
      setDs([]);
    } finally {
      setDangTim(false);
    }
  }, []);

  useEffect(() => {
    if (tuKhoa.trim()) tim(tuKhoa);
  }, [tuKhoa, tim]);

  async function taiLen(f: File) {
    if (!f.type.startsWith("image/")) {
      setLoi("Chỉ nhận file ảnh.");
      return;
    }
    setDangTai(true);
    setLoi(null);
    try {
      // Nén trước khi gửi: ảnh điện thoại 4MB làm thẻ tải chậm mà chẳng nét hơn
      const { default: nen } = await import("browser-image-compression");
      const nho = await nen(f, { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true });
      const { url, publicId } = await uploadToCloudinary(nho);
      onChon(url, publicId);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Tải ảnh lên thất bại");
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onDong}
    >
      <div
        className="rounded-2xl p-4 w-full"
        style={{ maxWidth: 560, maxHeight: "86vh", overflowY: "auto", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            Ảnh cho thẻ “{tuKhoa || "—"}”
          </p>
          <button onClick={onDong} className="px-2 text-sm" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>

        {anhHienTai && (
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={anhHienTai} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6 }} />
            <span className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>Ảnh hiện tại</span>
            <button
              onClick={() => onChon("", undefined)}
              className="text-xs px-2 py-1 rounded"
              style={{ background: "rgba(185,64,64,.1)", color: RED }}
            >
              Bỏ ảnh
            </button>
          </div>
        )}

        {/* 1. Tìm ảnh */}
        <div className="flex gap-2 mb-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tim(q)}
            placeholder="Tìm ảnh theo từ khoá…"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <button
            onClick={() => tim(q)}
            disabled={dangTim}
            className="px-3 py-2 rounded-lg text-sm font-bold"
            style={{ background: "var(--accent-primary)", color: "#fff", opacity: dangTim ? 0.6 : 1 }}
          >
            {dangTim ? "…" : "Tìm"}
          </button>
        </div>

        {loiTim && (
          <p className="text-xs mb-2 px-2 py-1.5 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
            {loiTim}
          </p>
        )}

        {ds && ds.length > 0 && (
          <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}>
            {ds.map((a) => (
              <button
                key={a.url}
                onClick={() => onChon(a.url)}
                title={a.tacGia ? `Ảnh: ${a.tacGia}` : undefined}
                className="rounded-lg overflow-hidden"
                style={{ aspectRatio: "1", border: "2px solid transparent" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.thumb || a.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
        {ds && ds.length === 0 && !loiTim && (
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Không có ảnh nào khớp.</p>
        )}

        {/* 2 + 3. Tải lên hoặc dán link */}
        <div className="pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && link.trim() && onChon(link.trim())}
              placeholder="Hoặc dán link ảnh (https://…)"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => link.trim() && onChon(link.trim())}
              disabled={!link.trim()}
              className="px-3 py-2 rounded-lg text-sm font-bold"
              style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", opacity: link.trim() ? 1 : 0.5 }}
            >
              Dùng link
            </button>
          </div>

          <input
            ref={oFile}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) taiLen(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => oFile.current?.click()}
            disabled={dangTai}
            className="w-full py-2 rounded-lg text-sm font-bold"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", opacity: dangTai ? 0.6 : 1 }}
          >
            {dangTai ? "Đang tải lên…" : "📤 Tải ảnh từ máy"}
          </button>

          {loi && (
            <p className="text-xs px-2 py-1.5 rounded" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
              {loi}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
