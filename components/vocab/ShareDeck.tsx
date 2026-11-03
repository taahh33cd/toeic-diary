"use client";

import { useState } from "react";
import { setShare, setVisibility } from "@/lib/vocab/client";

const RED = "var(--accent-red, #B94040)";

/**
 * Bật/tắt link chia sẻ của một bộ.
 *
 * Tắt rồi bật lại sinh slug mới, nên nói rõ cho học viên biết link cũ chết —
 * nếu không họ tưởng tắt chỉ là tạm ẩn.
 */
export default function ShareDeck({
  deckId,
  visibility,
  slug,
  laGiaoVien = false,
}: {
  deckId: string;
  visibility: string;
  slug: string;
  /** Chỉ giáo viên mới đăng được lên thư viện bộ mẫu. */
  laGiaoVien?: boolean;
}) {
  const [mucHienTai, setMucHienTai] = useState(visibility);
  const [bat, setBat] = useState(visibility === "link" || visibility === "library");
  const [slugHienTai, setSlugHienTai] = useState(slug);
  const [dangDoi, setDangDoi] = useState(false);
  const [daChep, setDaChep] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/flashcards/d/${slugHienTai}` : "";

  async function doi(giaTri: boolean) {
    if (dangDoi) return;
    if (!giaTri && !window.confirm("Tắt chia sẻ? Link hiện tại sẽ ngừng hoạt động vĩnh viễn — bật lại sẽ ra link mới.")) {
      return;
    }
    setDangDoi(true);
    setLoi(null);
    try {
      const r = await setShare(deckId, giaTri);
      setBat(r.visibility !== "private");
      setMucHienTai(r.visibility);
      if (r.slug) setSlugHienTai(r.slug);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đổi được");
    } finally {
      setDangDoi(false);
    }
  }

  async function chep() {
    try {
      await navigator.clipboard.writeText(link);
      setDaChep(true);
      setTimeout(() => setDaChep(false), 2000);
    } catch {
      setLoi("Trình duyệt không cho chép tự động — bạn bôi đen rồi copy nhé.");
    }
  }

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            🔗 Chia sẻ bộ thẻ
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {bat
              ? "Ai có link đều học được, không cần tài khoản."
              : "Bật để gửi link cho bạn bè hoặc học viên khác."}
          </p>
        </div>
        <button
          onClick={() => doi(!bat)}
          disabled={dangDoi}
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            background: bat ? "rgba(185,64,64,.1)" : "var(--accent-primary)",
            color: bat ? RED : "#fff",
            opacity: dangDoi ? 0.6 : 1,
          }}
        >
          {dangDoi ? "…" : bat ? "Tắt chia sẻ" : "Bật chia sẻ"}
        </button>
      </div>

      {bat && (
        <div className="flex gap-2 mt-3">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono outline-none"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <button
            onClick={chep}
            className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          >
            {daChep ? "✓ Đã chép" : "Chép link"}
          </button>
        </div>
      )}

      {laGiaoVien && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                📚 Thư viện bộ mẫu
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {mucHienTai === "library"
                  ? "Mọi học viên thấy bộ này và lấy về kho riêng được."
                  : "Đăng lên để cả lớp lấy về dùng."}
              </p>
            </div>
            <button
              onClick={async () => {
                if (dangDoi) return;
                setDangDoi(true);
                setLoi(null);
                try {
                  const r = await setVisibility(
                    deckId,
                    mucHienTai === "library" ? "link" : "library"
                  );
                  setMucHienTai(r.visibility);
                  setBat(r.visibility !== "private");
                } catch (e) {
                  setLoi(e instanceof Error ? e.message : "Không đổi được");
                } finally {
                  setDangDoi(false);
                }
              }}
              disabled={dangDoi}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: mucHienTai === "library" ? "rgba(185,64,64,.1)" : "var(--accent-primary)",
                color: mucHienTai === "library" ? RED : "#fff",
                opacity: dangDoi ? 0.6 : 1,
              }}
            >
              {dangDoi ? "…" : mucHienTai === "library" ? "Gỡ khỏi thư viện" : "Đăng lên thư viện"}
            </button>
          </div>
        </div>
      )}

      {loi && (
        <p className="text-xs mt-2" style={{ color: RED }}>{loi}</p>
      )}
    </div>
  );
}
