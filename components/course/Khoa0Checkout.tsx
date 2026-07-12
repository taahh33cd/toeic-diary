"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const CREAM = "#FFFDF6";
const BEIGE = "#FAE8DB";
const INK = "#3D2B1F";
const SEPIA = "#6B4C2A";
const TERRA = "#C4622D";
const MUTED = "#9A8672";
const BORDER = "#D9C9B8";
const SERIF = "var(--font-display,'Lora',Georgia,serif)";

type Order = {
  code: string;
  amount: number;
  qrUrl: string;
  bank: { label: string; account: string; owner: string };
};

type Phase = "loading" | "pending" | "submitted" | "paid" | "rejected" | "error";

function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function Khoa0Checkout() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create (or re-use) the open order on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/payment/khoa-0", { method: "POST" });
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "already_owned" || data.status === "paid") {
          setPhase("paid");
        } else if (data.code) {
          setOrder(data as Order);
          setPhase(data.status === "submitted" ? "submitted" : "pending");
        } else {
          setPhase("error");
        }
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll for admin confirmation while waiting.
  useEffect(() => {
    if (phase !== "pending" && phase !== "submitted") return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch("/api/payment/khoa-0/status");
        const data = await res.json();
        if (data.status === "paid") setPhase("paid");
        else if (data.status === "rejected") setPhase("rejected");
      } catch {
        /* keep polling */
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [phase]);

  // On-page buyers already see this success screen, so mark the app-wide
  // celebration popup as seen to avoid showing it again on the next navigation.
  useEffect(() => {
    if (phase === "paid") {
      fetch("/api/me/course-unlock", { method: "POST" }).catch(() => {});
    }
  }, [phase]);

  const copy = useCallback((label: string, value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/khoa-0/submit", { method: "POST" });
      if (res.ok) setPhase("submitted");
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Success ───────────────────────────────────────────────────────────────
  if (phase === "paid") {
    return (
      <div style={{ maxWidth: 440, textAlign: "center", paddingTop: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
        <h1 style={{ fontFamily: SERIF, fontSize: "1.5rem", fontWeight: 700, color: INK, marginBottom: "0.5rem" }}>
          Đã mở khoá thành công!
        </h1>
        <p style={{ fontSize: "0.9rem", color: SEPIA, lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Khoá 0 đã được mở khoá vĩnh viễn cho tài khoản của bạn. Toàn bộ bài luyện
          nghe, ngữ pháp và đọc hiểu giờ đã sẵn sàng.
        </p>
        <Link
          href="/dictation"
          style={{
            display: "inline-block", padding: "12px 28px", borderRadius: 8,
            background: TERRA, color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
          }}
        >
          Vào học ngay →
        </Link>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return <div style={{ paddingTop: "3rem", color: MUTED, fontSize: "0.9rem" }}>Đang tạo đơn thanh toán…</div>;
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === "error" || !order) {
    return (
      <div style={{ maxWidth: 420, textAlign: "center", paddingTop: "2rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
        <p style={{ fontSize: "0.9rem", color: SEPIA, marginBottom: "1.25rem" }}>
          Không tạo được đơn thanh toán. Vui lòng thử lại.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "10px 22px", borderRadius: 8, border: `2px solid ${TERRA}`, background: "transparent", color: TERRA, fontWeight: 700, cursor: "pointer" }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  // ── Rejected ────────────────────────────────────────────────────────────────
  if (phase === "rejected") {
    return (
      <div style={{ maxWidth: 420, textAlign: "center", paddingTop: "2rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>❌</div>
        <h1 style={{ fontFamily: SERIF, fontSize: "1.25rem", fontWeight: 700, color: INK, marginBottom: "0.5rem" }}>
          Đơn chưa được xác nhận
        </h1>
        <p style={{ fontSize: "0.88rem", color: SEPIA, lineHeight: 1.7 }}>
          Admin chưa xác nhận được khoản chuyển của bạn. Vui lòng kiểm tra lại hoặc
          liên hệ thầy/cô để được hỗ trợ.
        </p>
      </div>
    );
  }

  // ── Awaiting admin review ─────────────────────────────────────────────────────
  if (phase === "submitted") {
    return (
      <div style={{ maxWidth: 440, textAlign: "center", paddingTop: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⏳</div>
        <h1 style={{ fontFamily: SERIF, fontSize: "1.35rem", fontWeight: 700, color: INK, marginBottom: "0.5rem" }}>
          Đang chờ xác nhận
        </h1>
        <p style={{ fontSize: "0.9rem", color: SEPIA, lineHeight: 1.7, marginBottom: "1rem" }}>
          Cảm ơn bạn! Chúng tôi đã nhận được yêu cầu. Ngay khi kiểm tra được khoản
          chuyển khoản (mã <strong>{order.code}</strong>), tài khoản của bạn sẽ được
          mở khoá tự động — trang này sẽ tự cập nhật.
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: MUTED }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: TERRA, display: "inline-block", animation: "khoa0-pulse 1.2s ease-in-out infinite" }} />
          Đang chờ admin duyệt…
        </div>
        <style>{`@keyframes khoa0-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }`}</style>
      </div>
    );
  }

  // ── Pending — show QR + bank details ────────────────────────────────────────
  const rows: { label: string; value: string; copyable?: boolean; highlight?: boolean }[] = [
    { label: "Ngân hàng", value: order.bank.label },
    { label: "Chủ tài khoản", value: order.bank.owner },
    { label: "Số tài khoản", value: order.bank.account, copyable: true },
    { label: "Số tiền", value: fmtVnd(order.amount), copyable: true, highlight: true },
    { label: "Nội dung CK", value: order.code, copyable: true, highlight: true },
  ];

  return (
    <div style={{ maxWidth: 460, width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: "1.35rem", fontWeight: 700, color: INK, marginBottom: "0.35rem" }}>
          Mở khoá Khoá 0 ☕
        </h1>
        <p style={{ fontSize: "0.85rem", color: SEPIA, lineHeight: 1.6 }}>
          Quét mã QR hoặc chuyển khoản đúng nội dung bên dưới. Sau khi chuyển, bấm
          <strong> “Tôi đã chuyển khoản”</strong> — admin xác nhận là tài khoản của bạn
          được mở khoá ngay.
        </p>
      </div>

      <div
        style={{
          background: CREAM, border: `1.5px solid ${TERRA}55`, borderTop: `3px solid ${TERRA}`,
          borderRadius: 12, padding: "1.5rem", boxShadow: "0 8px 32px rgba(196,98,45,0.12)",
        }}
      >
        {/* QR */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.qrUrl}
            alt="QR chuyển khoản Techcombank"
            style={{ width: 240, maxWidth: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff" }}
          />
        </div>

        {/* Bank rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                padding: "8px 12px", borderRadius: 8,
                background: r.highlight ? BEIGE : "transparent",
                border: `1px ${r.highlight ? "dashed" : "solid"} ${r.highlight ? `${TERRA}55` : BORDER}`,
              }}
            >
              <span style={{ fontSize: "0.72rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                {r.label}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: "0.86rem", fontWeight: 700, color: r.highlight ? TERRA : INK, wordBreak: "break-all", textAlign: "right" }}>
                  {r.value}
                </span>
                {r.copyable && (
                  <button
                    onClick={() => copy(r.label, r.value)}
                    style={{ flexShrink: 0, fontSize: "0.68rem", padding: "3px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", color: SEPIA, cursor: "pointer" }}
                  >
                    {copied === r.label ? "✓" : "Copy"}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Confirm button */}
        <button
          onClick={submit}
          disabled={submitting}
          style={{
            width: "100%", marginTop: "1.25rem", padding: "12px 16px", borderRadius: 8,
            background: TERRA, color: "#fff", fontWeight: 700, fontSize: "0.9rem",
            border: "none", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Đang gửi…" : "Tôi đã chuyển khoản →"}
        </button>
      </div>

      <p style={{ fontSize: "0.72rem", color: MUTED, textAlign: "center", lineHeight: 1.6, marginTop: "1rem" }}>
        ⚠️ Vui lòng giữ đúng nội dung chuyển khoản <strong>{order.code}</strong> để admin đối soát đúng đơn của bạn.
      </p>
    </div>
  );
}
