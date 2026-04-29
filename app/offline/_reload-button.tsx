"use client";

export function OfflineReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
      style={{ background: "#c4622d", color: "#fff8f0" }}
    >
      Thử lại
    </button>
  );
}
