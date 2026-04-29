"use client";

import { useEffect, useState } from "react";

type Platform = "android" | "ios" | null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return null;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as Record<string, unknown>).standalone === true)
  );
}

const DISMISSED_KEY = "pwa-install-dismissed-v1";

/**
 * Install prompt bubble — bottom-left, compact, dismissible.
 * - Android/Chrome: intercepts the native beforeinstallprompt event
 * - iOS/Safari: shows manual guide (Add to Home Screen)
 * - Hidden once dismissed (persisted in localStorage)
 * - Hidden if already installed (standalone mode)
 */
export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === "android") {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }

    if (p === "ios") {
      // Show iOS guide after a short delay
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 z-50 max-w-xs w-[calc(100vw-2rem)] md:w-72 rounded-2xl border p-4 shadow-lg"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "0 8px 32px rgba(44,30,15,0.15)",
      }}
      role="region"
      aria-label="Cài ứng dụng"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="Anh Hiếu²" className="w-10 h-10 rounded-xl shrink-0" />
          <div>
            <p className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
              Cài ứng dụng
            </p>
            <p className="text-xs leading-snug mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Anh Hiếu² — mytoeicdiary
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-lg opacity-50 hover:opacity-80 transition leading-none shrink-0 mt-0.5"
          aria-label="Đóng"
          style={{ color: "var(--text-muted)" }}
        >
          ×
        </button>
      </div>

      {/* iOS guide */}
      {platform === "ios" && !showIosGuide && (
        <button
          type="button"
          onClick={() => setShowIosGuide(true)}
          className="mt-3 w-full text-sm font-medium py-2 rounded-xl transition-opacity hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "#fff8f0" }}
        >
          Hướng dẫn cài đặt
        </button>
      )}

      {platform === "ios" && showIosGuide && (
        <ol
          className="mt-3 space-y-1.5 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          <li>1. Nhấn nút <strong>Chia sẻ</strong> ⎙ ở thanh địa chỉ Safari</li>
          <li>2. Chọn <strong>"Thêm vào màn hình chính"</strong></li>
          <li>3. Nhấn <strong>Thêm</strong> ở góc trên phải</li>
        </ol>
      )}

      {/* Android prompt */}
      {platform === "android" && (
        <button
          type="button"
          onClick={install}
          className="mt-3 w-full text-sm font-medium py-2 rounded-xl transition-opacity hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "#fff8f0" }}
        >
          Cài ngay
        </button>
      )}
    </div>
  );
}
