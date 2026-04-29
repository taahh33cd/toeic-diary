"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; emoji: string }> = {
  info: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.4)", emoji: "ℹ️" },
  success: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.4)", emoji: "✓" },
  warning: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.4)", emoji: "⚠️" },
  error: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", emoji: "✕" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, opts?: { variant?: ToastVariant; duration?: number }) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const next: Toast = {
        id,
        message,
        variant: opts?.variant ?? "info",
        duration: opts?.duration ?? 3500,
      };
      setToasts((prev) => [...prev, next]);
      return id;
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100vw-2rem)]"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const style = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    if (toast.duration <= 0) return;
    const id = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(id);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className="pointer-events-auto rounded-xl px-4 py-3 border flex items-start gap-3 text-sm animate-in slide-in-from-right"
      role={toast.variant === "error" ? "alert" : "status"}
      aria-atomic="true"
      style={{
        background: style.bg,
        borderColor: style.border,
        backdropFilter: "blur(8px)",
        boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))",
        color: "var(--text-primary)",
      }}
    >
      <span className="text-base shrink-0" aria-hidden="true">
        {style.emoji}
      </span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
        aria-label={`Đóng thông báo: ${toast.message}`}
        style={{ color: "var(--text-muted)" }}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
