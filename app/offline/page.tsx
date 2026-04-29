export const metadata = { title: "Offline" };

import { OfflineReloadButton } from "./_reload-button";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center"
      style={{ background: "var(--bg-primary, #fff8f0)", color: "var(--text-primary, #2c1e0f)" }}
    >
      <div className="text-7xl select-none" aria-hidden>
        📡
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-2">Không có kết nối</h1>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary, #6b5340)" }}>
          Bạn đang offline. Kiểm tra lại kết nối internet và tải lại trang.
        </p>
      </div>
      <OfflineReloadButton />
      <p className="text-xs" style={{ color: "var(--text-muted, #a08070)" }}>
        mytoeicdiary — Anh Hiếu²
      </p>
    </div>
  );
}
