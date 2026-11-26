"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, MoreHorizontal, Pencil, X } from "lucide-react";
import { useClasses } from "@/hooks/firebase/useClasses";
import { setStudentFrozen, updateStudent } from "@/lib/firebase/helpers";
import type { Student } from "@/lib/firebase/types";
import type { StudentOverview } from "@/app/api/admin/students/[code]/overview/route";

const COURSE_LABEL: Record<NonNullable<Student["courseType"]>, string> = {
  "per-session": "1-1 theo buổi",
  group: "Lớp nhóm",
  package: "1-1 trọn gói",
};

const chip: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)",
};

function vnd(n: number) {
  return `${n.toLocaleString("vi-VN")}đ`;
}

function daysSince(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - then.getTime()) / 86_400_000);
}

/** Dòng "tình hình gần đây" — đỏ khi HV quá 7 ngày không vào app. */
function RecentLine({ overview }: { overview: StudentOverview | null }) {
  if (!overview) return <p className="text-xs h-4" />;
  const a = overview.account;
  if (!a) return <p className="text-xs" style={{ color: "var(--text-muted)" }}>HV chưa đăng nhập lần nào (chưa có tài khoản gắn mã).</p>;
  const gap = a.lastActiveDate ? daysSince(a.lastActiveDate) : null;
  const stale = gap === null || gap > 7;
  const mock = overview.mocks[0];
  return (
    <p className="text-xs flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: "var(--text-muted)" }}>
      <span style={stale ? { color: "#dc2626", fontWeight: 600 } : undefined}>
        {gap === null ? "Chưa ghi nhận lần học nào" : gap === 0 ? "Học hôm nay" : `Học gần nhất ${gap} ngày trước`}
      </span>
      <span>🔥 {a.currentStreak} ngày liền</span>
      <span>Lv.{a.level} · {a.totalXp} XP</span>
      {mock && <span>Thi thử gần nhất {mock.total} ({mock.date.slice(8, 10)}/{mock.date.slice(5, 7)})</span>}
    </p>
  );
}

/** Header gọn, dính đầu trang khi cuộn: tên + chip + thao tác. */
export function StudentHeader({ code, student, overview, onDelete, deleting }: {
  code: string;
  student: Student;
  overview: StudentOverview | null;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { classes } = useClasses();
  const myClasses = classes.filter((c) => c.members?.includes(code));
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const debt = student.courseType === "package" && student.totalFee
    ? student.totalFee - (student.paidAmount ?? 0) : 0;

  async function copyLink() {
    const url = `${process.env.NEXT_PUBLIC_STUDENT_URL ?? "https://toeic-dictation-diary.vercel.app"}/auth/login?auto=${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function setFrozen(frozen: boolean) {
    setFreezing(true);
    try { await setStudentFrozen(code, frozen); } finally { setFreezing(false); setMenu(false); }
  }

  const btn = "text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5";

  return (
    <>
      <div className="sticky top-0 z-20 -mx-6 md:-mx-8 px-6 md:px-8 py-3 space-y-1.5"
        style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/students" aria-label="Về danh sách học viên" className="p-1 -ml-1 rounded hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold mr-1" style={{ color: "var(--text-primary)" }}>{student.name}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full tabular-nums" style={chip}>{code}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={chip}>Tuần {student.currentWeek ?? 1}</span>
          {myClasses.map((c) => (
            <Link key={c.id} href={`/admin/classes/${c.id}`} className="text-xs px-2 py-0.5 rounded-full hover:opacity-80"
              style={{ ...chip, color: "var(--accent-primary)" }}>🏫 {c.name}</Link>
          ))}
          {student.courseType && <span className="text-xs px-2 py-0.5 rounded-full" style={chip}>{COURSE_LABEL[student.courseType]}</span>}
          {debt > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.3)" }}>
              Còn nợ {vnd(debt)}
            </span>
          )}

          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <button type="button" onClick={() => setDrawer(true)} className={btn} style={chip}><Pencil size={13} /> Sửa thông tin</button>
            <button type="button" onClick={copyLink} className={btn} style={chip}>
              {copied ? <><Check size={13} /> Đã copy</> : <><Copy size={13} /> Copy link HV</>}
            </button>
            <Link href={`/admin/students/${code}/roadmap`} className={btn} style={chip}>Lộ trình học</Link>
            <Link href={`/admin/students/${code}/results`} className={btn} style={chip}>Kết quả luyện đề</Link>
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenu((v) => !v)} aria-label="Thêm thao tác" aria-expanded={menu}
                className="p-1.5 rounded-lg" style={chip}><MoreHorizontal size={16} /></button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-1 w-48 rounded-xl py-1 shadow-lg z-30"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  {!student.frozen && (
                    <button type="button" role="menuitem" disabled={freezing} onClick={() => setFrozen(true)}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80" style={{ color: "var(--text-primary)" }}>
                      ❄️ Đóng băng
                    </button>
                  )}
                  <button type="button" role="menuitem" disabled={deleting} onClick={() => { setMenu(false); onDelete(); }}
                    className="w-full text-left px-3 py-2 text-sm hover:opacity-80" style={{ color: "#dc2626" }}>
                    🗑 Xoá học viên
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <RecentLine overview={overview} />
      </div>

      {student.frozen && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 flex-wrap"
          style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.35)" }}>
          <span className="text-sm font-semibold flex-1" style={{ color: "#b45309" }}>❄️ Tài khoản đang đóng băng — HV không học được.</span>
          <button type="button" disabled={freezing} onClick={() => setFrozen(false)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "#16a34a", color: "#fff" }}>
            Mở lại
          </button>
        </div>
      )}

      {drawer && <InfoDrawer code={code} student={student} onClose={() => setDrawer(false)} />}
    </>
  );
}

// ─── Ngăn kéo thông tin cơ bản — tự lưu ──────────────────────────────────────

type Form = { name: string; week: string; courseType: NonNullable<Student["courseType"]>; price: string; totalFee: string; paid: string };

function fromStudent(s: Student): Form {
  return {
    name: s.name ?? "",
    week: String(s.currentWeek ?? 1),
    courseType: s.courseType ?? "per-session",
    price: s.pricePerSession != null ? String(s.pricePerSession) : "",
    totalFee: s.totalFee != null ? String(s.totalFee) : "",
    paid: s.paidAmount != null ? String(s.paidAmount) : "",
  };
}

const nonNeg = (v: string) => v === "" || (/^\d+$/.test(v));

function invalidFields(f: Form): Set<keyof Form> {
  const bad = new Set<keyof Form>();
  if (!f.name.trim()) bad.add("name");
  if (!/^\d+$/.test(f.week) || Number(f.week) < 1) bad.add("week");
  if (!nonNeg(f.price)) bad.add("price");
  if (!nonNeg(f.totalFee)) bad.add("totalFee");
  if (!nonNeg(f.paid)) bad.add("paid");
  return bad;
}

/**
 * Sửa thông tin cơ bản, tự lưu sau 1 giây ngừng gõ. Ô sai thì không lưu ô đó
 * (giữ giá trị cũ trên hệ thống). Đổi loại khoá không xoá số liệu của loại cũ —
 * chỉ ẩn đi, đổi lại vẫn còn.
 */
function InfoDrawer({ code, student, onClose }: { code: string; student: Student; onClose: () => void }) {
  const [form, setForm] = useState<Form>(() => fromStudent(student));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedRef = useRef<Form>(fromStudent(student));
  const bad = invalidFields(form);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const prev = savedRef.current;
      const invalid = invalidFields(form);
      const patch: Partial<Student> = {};
      if (form.name !== prev.name && !invalid.has("name")) patch.name = form.name.trim();
      if (form.week !== prev.week && !invalid.has("week")) patch.currentWeek = Number(form.week);
      if (form.courseType !== prev.courseType) patch.courseType = form.courseType;
      if (form.price !== prev.price && !invalid.has("price") && form.price !== "") patch.pricePerSession = Number(form.price);
      if (form.totalFee !== prev.totalFee && !invalid.has("totalFee") && form.totalFee !== "") patch.totalFee = Number(form.totalFee);
      if (form.paid !== prev.paid && !invalid.has("paid") && form.paid !== "") patch.paidAmount = Number(form.paid);
      if (Object.keys(patch).length === 0) return;
      setStatus("saving");
      try {
        await updateStudent(code, patch);
        savedRef.current = {
          ...prev,
          ...(patch.name !== undefined && { name: form.name }),
          ...(patch.currentWeek !== undefined && { week: form.week }),
          ...(patch.courseType !== undefined && { courseType: form.courseType }),
          ...(patch.pricePerSession !== undefined && { price: form.price }),
          ...(patch.totalFee !== undefined && { totalFee: form.totalFee }),
          ...(patch.paidAmount !== undefined && { paid: form.paid }),
        };
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [form, code]);

  function field(key: keyof Form, label: string, type: "text" | "number" = "text", placeholder = "") {
    return (
      <label className="block">
        <span className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <input type={type} inputMode={type === "number" ? "numeric" : undefined} value={form[key]} placeholder={placeholder}
          onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setStatus("idle"); }}
          aria-invalid={bad.has(key)}
          className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
          style={{ background: "var(--bg-primary)", borderColor: bad.has(key) ? "#dc2626" : "var(--border)", color: "var(--text-primary)" }} />
      </label>
    );
  }

  const fee = Number(form.totalFee || 0) - Number(form.paid || 0);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Thông tin cơ bản" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full overflow-auto p-5 space-y-4"
        style={{ background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>📋 Thông tin cơ bản</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs" aria-live="polite" style={{ color: status === "error" ? "#dc2626" : "var(--text-muted)" }}>
              {status === "saving" ? "Đang lưu…" : status === "saved" ? "Đã lưu ✓" : status === "error" ? "Lưu lỗi — thử lại" : bad.size ? "Ô viền đỏ chưa được lưu" : "Tự lưu khi sửa"}
            </span>
            <button type="button" onClick={onClose} aria-label="Đóng" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
        </div>

        {field("name", "Họ và tên")}
        <label className="block">
          <span className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Mã học viên</span>
          <input value={code} disabled className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ background: "var(--border)", borderColor: "var(--border)", color: "var(--text-muted)" }} />
        </label>
        {field("week", "Tuần hiện tại", "number")}
        <label className="block">
          <span className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Loại khoá học</span>
          <select value={form.courseType}
            onChange={(e) => { setForm((f) => ({ ...f, courseType: e.target.value as Form["courseType"] })); setStatus("idle"); }}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <option value="per-session">1-1 theo buổi</option>
            <option value="group">Lớp nhóm</option>
            <option value="package">1-1 trọn gói</option>
          </select>
        </label>
        {form.courseType !== "package" ? (
          field("price", "Đơn giá / buổi (VND)", "number", "vd. 150000")
        ) : (
          <>
            {field("totalFee", "Tổng học phí (VND)", "number", "vd. 3000000")}
            {field("paid", "Đã thanh toán (VND)", "number", "vd. 1500000")}
            {form.totalFee !== "" && (
              <p className="text-sm" style={{ color: fee > 0 ? "#dc2626" : "#16a34a" }}>
                {fee > 0 ? `Còn nợ ${vnd(fee)}` : "Đã đóng đủ học phí"}
              </p>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
