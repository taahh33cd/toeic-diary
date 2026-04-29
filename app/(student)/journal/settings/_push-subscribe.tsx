"use client";

import { usePushSubscription } from "@/hooks/usePushSubscription";

const LABEL: Record<string, string> = {
  loading: "Đang kiểm tra…",
  unsupported: "Thiết bị không hỗ trợ",
  denied: "Đã bị chặn bởi trình duyệt",
  subscribed: "Đang bật",
  unsubscribed: "Đang tắt",
};

const DESCRIPTION: Record<string, string> = {
  unsupported: "Trình duyệt của bạn không hỗ trợ Web Push. Hãy dùng Chrome hoặc Edge.",
  denied:
    'Bạn đã từ chối thông báo. Vào Cài đặt trình duyệt → Quyền trang web → Thông báo để bật lại.',
  subscribed: "Bạn sẽ nhận thông báo khi có bài tập mới, lịch học được xác nhận, hoặc nhận xét mới từ thầy.",
  unsubscribed: "Bật để nhận thông báo khi có bài tập mới, lịch học được xác nhận, hoặc nhận xét từ thầy.",
  loading: "",
};

export function PushSubscribeCard() {
  const { state, error, subscribe, unsubscribe } = usePushSubscription();

  const isDisabled = state === "loading" || state === "unsupported" || state === "denied";

  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
            🔔 Thông báo đẩy (Push)
          </h2>
          <p
            id="push-desc"
            className="mt-1 text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {DESCRIPTION[state] ?? ""}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-xs" style={{ color: "rgb(239,68,68)" }}>
              {error}
            </p>
          )}
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={state === "subscribed" ? unsubscribe : subscribe}
          disabled={isDisabled}
          className="shrink-0 relative w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: state === "subscribed" ? "var(--accent-primary)" : "var(--border)",
          }}
          aria-label={state === "subscribed" ? "Tắt thông báo" : "Bật thông báo"}
          aria-pressed={state === "subscribed"}
          aria-describedby="push-desc"
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm"
            style={{
              transform: state === "subscribed" ? "translateX(20px)" : "translateX(0)",
            }}
          />
        </button>
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Trạng thái: <span className="font-medium">{LABEL[state] ?? state}</span>
      </p>
    </div>
  );
}
