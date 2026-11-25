"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import HomeworkEditor from "@/components/admin/homework/HomeworkEditor";
import { contentOf, itemCount, totalMinutes, type HwContent } from "@/lib/homework/content";
import { HW_CATS, fmtDayShort, vnTodayKey } from "@/lib/homework/library";

type Draft = {
  id: string;
  lessonNo: number;
  date: string;
  endDate: string | null;
  title: string | null;
  content: HwContent;
  edited: boolean;
  status: "draft" | "approved" | "assigned" | "skipped";
  homeworkId: string | null;
  run: {
    id: string;
    targetType: "class" | "student";
    targetId: string;
    targetLabel: string;
    autoAssign: boolean;
    curriculum: { id: string; title: string };
  };
};

const DAY = 86_400_000;
const addDays = (k: string, n: number) => new Date(new Date(k + "T00:00:00Z").getTime() + n * DAY).toISOString().slice(0, 10);
/** Thứ Hai của tuần chứa ngày `k`. */
const monday = (k: string) => addDays(k, -((new Date(k + "T00:00:00Z").getUTCDay() + 6) % 7));
const OPEN = new Set(["draft", "approved"]);

const btn = "text-xs px-2.5 py-1.5 rounded-lg border whitespace-nowrap disabled:opacity-50";
const btnStyle = { borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-elevated)" };

/**
 * Nháp BTVN tuần này — sinh sẵn từ giáo trình + lịch học của từng lớp/HV.
 * Giáo viên xem, sửa nếu cần, duyệt rồi giao (hoặc để tự giao 20:30 ngày học).
 */
export default function DraftsPage() {
  const today = vnTodayKey();
  const [week, setWeek] = useState(() => monday(today));
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);

  const weekEnd = addDays(week, 6);
  const isThisWeek = week === monday(today);

  const load = useCallback(() => {
    // Tuần hiện tại: lấy thêm 2 tuần trước để hiện nháp còn tồn chưa giao.
    const from = isThisWeek ? addDays(week, -14) : week;
    return fetch(`/api/admin/hw-drafts?from=${from}&to=${weekEnd}`, { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as { drafts?: Draft[]; error?: string };
        if (!r.ok) throw new Error(d.error ?? "Không tải được nháp");
        setErr(null);
        setDrafts(d.drafts ?? []);
      })
      .catch((e: Error) => setErr(e.message));
  }, [week, weekEnd, isThisWeek]);

  useEffect(() => {
    load();
  }, [load]);

  function goWeek(w: string) {
    setDrafts(null);
    setWeek(w);
  }

  async function patch(id: string, body: object) {
    setBusy(id);
    const r = await fetch(`/api/admin/hw-drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!r.ok) alert(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Cập nhật thất bại");
    await load();
  }

  async function assign(d: Draft, silent = false): Promise<boolean> {
    if (!silent && !confirm(`Giao “${d.title ?? `Buổi ${d.lessonNo}`}” cho ${d.run.targetLabel} ngay bây giờ?`)) return false;
    setBusy(d.id);
    const r = await fetch(`/api/admin/hw-drafts/${d.id}/assign`, { method: "POST" });
    setBusy(null);
    if (!r.ok) {
      alert(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Giao thất bại");
      return false;
    }
    if (!silent) await load();
    return true;
  }

  const { carry, byDay } = useMemo(() => {
    const carry: Draft[] = [];
    const byDay = new Map<string, Draft[]>();
    for (const d of drafts ?? []) {
      if (d.date < week) {
        if (OPEN.has(d.status)) carry.push(d);
        continue;
      }
      if (!byDay.has(d.date)) byDay.set(d.date, []);
      byDay.get(d.date)!.push(d);
    }
    return { carry, byDay };
  }, [drafts, week]);

  const visible = [...carry, ...[...byDay.values()].flat()];
  const approved = visible.filter((d) => d.status === "approved" && itemCount(d.content) > 0);
  const pending = visible.filter((d) => d.status === "draft" && itemCount(d.content) > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => goWeek(addDays(week, -7))} className={btn} style={btnStyle}>‹ Tuần trước</button>
          <b className="text-sm" style={{ color: "var(--text-primary)" }}>
            {fmtDayShort(week)} – {fmtDayShort(weekEnd)}
          </b>
          <button onClick={() => goWeek(addDays(week, 7))} className={btn} style={btnStyle}>Tuần sau ›</button>
          {!isThisWeek && (
            <button onClick={() => goWeek(monday(today))} className={btn} style={btnStyle}>Tuần này</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={pending.length === 0 || !!busy}
            onClick={async () => {
              setBusy("bulk");
              await Promise.all(pending.map((d) => fetch(`/api/admin/hw-drafts/${d.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "approved" }),
              })));
              setBusy(null);
              load();
            }}
            className={btn}
            style={btnStyle}
          >
            ✓ Duyệt tất cả ({pending.length})
          </button>
          <button
            disabled={approved.length === 0 || !!busy}
            onClick={async () => {
              if (!confirm(`Giao ngay ${approved.length} nháp đã duyệt?`)) return;
              setBusy("bulk");
              for (const d of approved) await assign(d, true);
              setBusy(null);
              load();
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            Giao tất cả đã duyệt ({approved.length})
          </button>
        </div>
      </div>

      {err && <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{err}</p>}

      {drafts === null && !err ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm space-y-2" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <p>Tuần này không có nháp nào.</p>
          <p>
            Nháp được tạo từ giáo trình đã gắn cho lớp/HV —{" "}
            <Link href="/admin/homework/curricula" className="underline" style={{ color: "var(--accent-primary)" }}>mở Giáo trình</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {carry.length > 0 && (
            <Group title="⚠ Còn tồn từ trước — chưa giao">
              {carry.map((d) => <Card key={d.id} d={d} busy={busy} today={today} onPatch={patch} onAssign={assign} onEdit={setEditing} />)}
            </Group>
          )}
          {[...byDay.entries()].map(([day, list]) => (
            <Group key={day} title={`${fmtDayShort(day)}${day === today ? " · hôm nay" : ""}`}>
              {list.map((d) => <Card key={d.id} d={d} busy={busy} today={today} onPatch={patch} onAssign={assign} onEdit={setEditing} />)}
            </Group>
          ))}
        </div>
      )}

      {editing && (
        <HomeworkEditor
          heading={`Sửa nháp — ${editing.run.targetLabel}`}
          targetLabel={`${editing.run.curriculum.title} · Buổi ${editing.lessonNo}`}
          initial={{
            id: editing.homeworkId ?? "draft",
            date: editing.date,
            ...(editing.endDate ? { endDate: editing.endDate } : {}),
            ...(editing.title ? { title: editing.title } : {}),
            ...editing.content,
          }}
          isEdit
          saveLabel="💾 Lưu nháp"
          onSave={async (hw) => {
            const r = await fetch(`/api/admin/hw-drafts/${editing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: contentOf(hw),
                date: hw.date,
                endDate: hw.endDate ?? null,
                title: hw.title ?? "",
              }),
            });
            if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Lưu thất bại");
            await load();
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{title}</h3>
      {children}
    </section>
  );
}

function Card({
  d,
  busy,
  today,
  onPatch,
  onAssign,
  onEdit,
}: {
  d: Draft;
  busy: string | null;
  today: string;
  onPatch: (id: string, body: object) => void;
  onAssign: (d: Draft) => Promise<boolean>;
  onEdit: (d: Draft) => void;
}) {
  const n = itemCount(d.content);
  const m = totalMinutes(d.content);
  const empty = n === 0;
  const dis = busy === d.id || busy === "bulk";
  const badge =
    d.status === "assigned"
      ? { text: "Đã giao", bg: "rgba(74,124,89,.12)", c: "#4A7C59" }
      : d.status === "skipped"
        ? { text: "Bỏ qua", bg: "var(--bg-primary)", c: "var(--text-muted)" }
        : empty
          ? { text: "Trống — cần soạn", bg: "rgba(176,122,26,.12)", c: "#9A6A12" }
          : d.status === "approved"
            ? { text: d.run.autoAssign ? "Đã duyệt · tự giao 20:30" : "Đã duyệt", bg: "rgba(59,110,168,.1)", c: "#3B6EA8" }
            : { text: "Nháp · chưa duyệt", bg: "var(--bg-primary)", c: "var(--text-secondary)" };

  return (
    <div
      className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-start gap-3"
      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", opacity: d.status === "skipped" ? 0.6 : 1 }}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <b className="text-sm" style={{ color: "var(--text-primary)" }}>
            {d.run.targetType === "class" ? "👥" : "👤"} {d.run.targetLabel}
          </b>
          <span className="text-[10.5px] font-semibold px-1.5 py-px rounded" style={{ background: badge.bg, color: badge.c }}>{badge.text}</span>
          {d.edited && d.status !== "assigned" && (
            <span className="text-[10.5px] px-1.5 py-px rounded" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>đã sửa riêng</span>
          )}
        </div>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{d.title ?? `Buổi ${d.lessonNo}`}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {d.run.curriculum.title} · giao {fmtDayShort(d.date)}
          {d.endDate ? ` · hạn ${fmtDayShort(d.endDate)}` : ""}
          {n ? ` · ${n} bài${m ? ` · ${m}′` : ""}` : ""}
          {d.date < today && OPEN.has(d.status) ? " · đã qua ngày giao" : ""}
        </p>
        {n > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {HW_CATS.filter((c) => d.content[c.key]?.length).map((c) => (
              <span key={c.key} className="text-[10.5px] font-semibold px-1.5 py-px rounded" style={{ background: `${c.color}18`, color: c.color }}>
                {c.label} {d.content[c.key]!.length}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {d.status === "assigned" ? (
          <Link
            href={d.run.targetType === "class" ? `/admin/classes/${d.run.targetId}` : `/admin/students/${d.run.targetId}`}
            className={btn}
            style={btnStyle}
          >
            Xem ở {d.run.targetType === "class" ? "trang lớp" : "trang HV"} →
          </Link>
        ) : d.status === "skipped" ? (
          <button disabled={dis} onClick={() => onPatch(d.id, { status: "draft" })} className={btn} style={btnStyle}>Khôi phục</button>
        ) : (
          <>
            <button disabled={dis} onClick={() => onEdit(d)} className={btn} style={btnStyle}>{empty ? "Soạn" : "Mở sửa"}</button>
            {!empty &&
              (d.status === "draft" ? (
                <button disabled={dis} onClick={() => onPatch(d.id, { status: "approved" })} className={btn} style={btnStyle}>✓ Duyệt</button>
              ) : (
                <button disabled={dis} onClick={() => onPatch(d.id, { status: "draft" })} className={btn} style={btnStyle}>Bỏ duyệt</button>
              ))}
            {!empty && (
              <button
                disabled={dis}
                onClick={() => onAssign(d)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "#fff" }}
              >
                Giao ngay
              </button>
            )}
            <button disabled={dis} onClick={() => onPatch(d.id, { status: "skipped" })} className={btn} style={btnStyle}>Bỏ qua</button>
          </>
        )}
      </div>
    </div>
  );
}
