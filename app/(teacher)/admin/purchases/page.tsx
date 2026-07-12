"use client";

import { useState, useEffect, useCallback } from "react";

type Purchase = {
  id: string;
  email: string | null;
  code: string;
  amount: number;
  status: "pending" | "submitted";
  submittedAt: string | null;
  createdAt: string;
};

function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/purchases");
      const data = await res.json();
      setPurchases(data.purchases ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm("Từ chối đơn này? Học viên sẽ không được mở khoá.")) return;
    setBusy(id);
    try {
      await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      // Cập nhật ngay indicator "Mở khoá" trên nav
      window.dispatchEvent(new Event("purchases:changed"));
    } catch {
      alert("Thao tác thất bại, thử lại.");
    } finally {
      setBusy(null);
    }
  }

  const submitted = purchases.filter((p) => p.status === "submitted");
  const pending = purchases.filter((p) => p.status === "pending");

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          💳 Mở khoá — Khoá 0
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Kiểm tra tiền về tài khoản Techcombank rồi bấm <strong>Duyệt</strong> để mở khoá cho học viên.
        </p>
      </div>

      {/* Awaiting review */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Chờ xác nhận ({submitted.length})
        </h2>
        {submitted.length === 0 ? (
          <div
            className="rounded-xl p-6 border text-center text-sm"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Không có đơn nào đang chờ xác nhận.
          </div>
        ) : (
          submitted.map((p) => (
            <PurchaseRow key={p.id} p={p} busy={busy === p.id} onApprove={() => act(p.id, "approve")} onReject={() => act(p.id, "reject")} highlight />
          ))
        )}
      </section>

      {/* Created but not yet claimed */}
      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Đã tạo mã, chưa báo chuyển khoản ({pending.length})
          </h2>
          {pending.map((p) => (
            <PurchaseRow key={p.id} p={p} busy={busy === p.id} onApprove={() => act(p.id, "approve")} onReject={() => act(p.id, "reject")} />
          ))}
        </section>
      )}
    </div>
  );
}

function PurchaseRow({
  p,
  busy,
  onApprove,
  onReject,
  highlight,
}: {
  p: Purchase;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 border flex items-start gap-3 flex-wrap"
      style={{
        background: "var(--bg-elevated)",
        borderColor: highlight ? "rgba(16,185,129,0.35)" : "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {p.email ?? "(không có email)"}
          </span>
          <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
            {p.code}
          </code>
        </div>
        <div className="flex gap-4 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>{fmtVnd(p.amount)}</span>
          <span>{p.status === "submitted" ? `Báo CK: ${fmtTime(p.submittedAt)}` : `Tạo: ${fmtTime(p.createdAt)}`}</span>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={onApprove}
          disabled={busy}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-60"
          style={{ background: "rgb(16,185,129)" }}
        >
          {busy ? "..." : "✓ Duyệt"}
        </button>
        <button
          onClick={onReject}
          disabled={busy}
          className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-60"
          style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgb(220,38,38)", background: "rgba(239,68,68,0.06)" }}
        >
          Từ chối
        </button>
      </div>
    </div>
  );
}
