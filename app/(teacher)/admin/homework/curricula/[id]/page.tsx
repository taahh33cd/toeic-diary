"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Trash2 } from "lucide-react";

import HomeworkEditor from "@/components/admin/homework/HomeworkEditor";
import TemplatePicker from "@/components/admin/homework/TemplatePicker";
import TargetPicker, { type PickedTarget } from "@/components/admin/homework/TargetPicker";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClasses } from "@/hooks/firebase/useClasses";
import { contentOf, itemCount, mergeContent, totalMinutes, type HwContent } from "@/lib/homework/content";
import { HW_CATS, fmtDayShort, vnTodayKey } from "@/lib/homework/library";
import { lessonDates } from "@/lib/homework/schedule";

type Lesson = { id: string; topic: string; content: HwContent };
type Run = {
  id: string;
  targetType: "class" | "student";
  targetId: string;
  targetLabel: string;
  startDate: string;
  startLesson: number;
  skipDates: string[];
  autoAssign: boolean;
  status: string;
};

const btn = "text-xs px-2.5 py-1.5 rounded-lg border";
const btnStyle = { borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-elevated)" };

export default function CurriculumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [tplFor, setTplFor] = useState<number | null>(null);
  const [attach, setAttach] = useState<PickedTarget | null>(null);
  const [picking, setPicking] = useState(false);

  const load = useCallback(
    () =>
      fetch(`/api/admin/hw-curricula/${id}`, { cache: "no-store" })
        .then(async (r) => {
          const d = (await r.json()) as { curriculum?: { title: string; lessons: Lesson[] }; runs?: Run[]; error?: string };
          if (!r.ok || !d.curriculum) throw new Error(d.error ?? "Không tải được");
          setTitle(d.curriculum.title);
          setLessons(d.curriculum.lessons);
          setRuns(d.runs ?? []);
        })
        .catch((e: Error) => setErr(e.message)),
    [id],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function persist(next: Lesson[]) {
    setLessons(next);
    setSaving(true);
    const r = await fetch(`/api/admin/hw-curricula/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessons: next }),
    });
    setSaving(false);
    if (!r.ok) alert(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Lưu thất bại");
  }

  async function rename() {
    const t = window.prompt("Tên giáo trình:", title);
    if (!t?.trim() || t.trim() === title) return;
    setTitle(t.trim());
    await fetch(`/api/admin/hw-curricula/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t.trim() }),
    });
  }

  async function removeCurriculum() {
    if (!confirm(`Xoá giáo trình “${title}”? Nháp chưa giao sẽ mất, BTVN đã giao giữ nguyên.`)) return;
    await fetch(`/api/admin/hw-curricula/${id}`, { method: "DELETE" });
    router.push("/admin/homework/curricula");
  }

  async function patchRun(runId: string, body: object) {
    const r = await fetch(`/api/admin/hw-runs/${runId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) alert("Cập nhật thất bại");
    load();
  }

  if (err) return <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{err}</p>;
  if (!lessons) return <div className="h-40 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />;

  const active = runs.filter((r) => r.status === "active");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/admin/homework/curricula" className="p-1.5 rounded-lg border" style={btnStyle} aria-label="Quay lại">
            <ArrowLeft size={14} />
          </Link>
          <button onClick={rename} className="text-lg font-bold text-left truncate" style={{ color: "var(--text-primary)" }} title="Đổi tên">
            {title}
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {lessons.length} buổi{saving ? " · đang lưu…" : ""}
          </span>
        </div>
        <button onClick={removeCurriculum} className={btn} style={{ ...btnStyle, color: "rgb(220,38,38)" }}>
          Xoá giáo trình
        </button>
      </div>

      {/* Lớp/HV đang dùng */}
      <section className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Đang dùng cho</h2>
          <button onClick={() => setPicking(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--accent-primary)", color: "#fff" }}>
            ＋ Gắn cho lớp / HV
          </button>
        </div>
        {active.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Chưa gắn cho lớp nào. Gắn xong, nháp BTVN các buổi sắp tới sẽ hiện ở tab Nháp tuần này.
          </p>
        ) : (
          active.map((r) => <RunCard key={r.id} run={r} lessons={lessons} onPatch={(b) => patchRun(r.id, b)} onRemove={async () => {
            if (!confirm(`Gỡ giáo trình khỏi ${r.targetLabel}? Nháp chưa giao sẽ bị xoá, BTVN đã giao giữ nguyên.`)) return;
            await fetch(`/api/admin/hw-runs/${r.id}`, { method: "DELETE" });
            load();
          }} />)
        )}
      </section>

      {/* Các buổi */}
      <section className="space-y-2">
        {lessons.map((l, i) => {
          const n = itemCount(l.content);
          const m = totalMinutes(l.content);
          const titles = HW_CATS.flatMap((c) => (l.content[c.key] ?? []).map((it) => ({ c, t: it.text.replace(/<[^>]+>/g, "") })));
          return (
            <div key={l.id} className="rounded-xl border p-3 flex flex-col sm:flex-row gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
              <div className="sm:w-16 shrink-0 text-sm font-bold" style={{ color: "var(--accent-primary)" }}>Buổi {i + 1}</div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  defaultValue={l.topic}
                  placeholder="Chủ đề buổi học (VD: Part 5 – Thì HTHT)"
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== l.topic) persist(lessons.map((x, j) => (j === i ? { ...x, topic: v } : x)));
                  }}
                  className="w-full px-2 py-1.5 text-sm font-medium rounded-lg border outline-none"
                  style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                {n === 0 ? (
                  <span className="inline-block text-[11px] px-2 py-0.5 rounded" style={{ background: "rgba(176,122,26,.12)", color: "#9A6A12" }}>
                    Chưa gắn bài — nháp buổi này sẽ trống
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {titles.slice(0, 4).map(({ c, t }, k) => (
                      <span key={k} className="text-[11px] px-2 py-0.5 rounded-full truncate max-w-[260px]" style={{ background: `${c.color}14`, color: c.color }}>
                        {t}
                      </span>
                    ))}
                    {titles.length > 4 && <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>+{titles.length - 4}</span>}
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>· {n} bài{m ? ` · ${m}′` : ""}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 items-start shrink-0">
                <button onClick={() => setEditing(i)} className={btn} style={btnStyle}>✏️ Soạn bài</button>
                <button onClick={() => setTplFor(i)} className={btn} style={btnStyle}>📋 Mẫu</button>
                <button
                  disabled={i === 0}
                  onClick={() => {
                    const x = [...lessons];
                    [x[i - 1], x[i]] = [x[i], x[i - 1]];
                    persist(x);
                  }}
                  className={`${btn} disabled:opacity-40`}
                  style={btnStyle}
                  aria-label="Lên"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  disabled={i === lessons.length - 1}
                  onClick={() => {
                    const x = [...lessons];
                    [x[i + 1], x[i]] = [x[i], x[i + 1]];
                    persist(x);
                  }}
                  className={`${btn} disabled:opacity-40`}
                  style={btnStyle}
                  aria-label="Xuống"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  onClick={() => {
                    if (n > 0 && !confirm(`Xoá Buổi ${i + 1}? Các buổi sau tự dồn lên.`)) return;
                    persist(lessons.filter((_, j) => j !== i));
                  }}
                  className={btn}
                  style={{ ...btnStyle, color: "rgb(220,38,38)" }}
                  aria-label="Xoá buổi"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
        <button
          onClick={() => persist([...lessons, { id: crypto.randomUUID(), topic: "", content: {} }])}
          className="w-full text-sm py-2.5 rounded-xl border border-dashed"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          ＋ Thêm buổi
        </button>
      </section>

      {editing !== null && lessons[editing] && (
        <HomeworkEditor
          contentOnly
          heading={`Buổi ${editing + 1}${lessons[editing].topic ? ` — ${lessons[editing].topic}` : ""}`}
          targetLabel={title}
          initial={{ id: "lesson", date: "", ...lessons[editing].content }}
          saveLabel="💾 Lưu buổi"
          onSave={(hw) => persist(lessons.map((x, j) => (j === editing ? { ...x, content: contentOf(hw) } : x)))}
          onClose={() => setEditing(null)}
        />
      )}

      {tplFor !== null && (
        <TemplatePicker
          onClose={() => setTplFor(null)}
          onPick={(t) => {
            persist(
              lessons.map((x, j) =>
                j === tplFor ? { ...x, topic: x.topic || t.title, content: mergeContent(x.content, t.content) } : x,
              ),
            );
            fetch(`/api/admin/hw-templates/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ used: true }),
            }).catch(() => {});
            setTplFor(null);
          }}
        />
      )}

      {picking && (
        <TargetPicker
          single
          title="Gắn giáo trình cho"
          onClose={() => setPicking(false)}
          onDone={(t) => {
            setPicking(false);
            setAttach(t[0] ?? null);
          }}
        />
      )}

      {attach && (
        <AttachDialog
          target={attach}
          lessonCount={lessons.length}
          onClose={() => setAttach(null)}
          onDone={async (body) => {
            const r = await fetch(`/api/admin/hw-curricula/${id}/runs`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetType: attach.type, targetId: attach.id, targetLabel: attach.label, ...body }),
            });
            if (!r.ok) return alert(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Gắn thất bại");
            setAttach(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/** Lịch tuần (thứ) của lớp / HV — HV thuộc lớp thì theo lịch lớp. */
function useWeekdays(type: "class" | "student", targetId: string): string[] | null {
  const { classes, loading: l1 } = useClasses();
  const { students, loading: l2 } = useAllStudents();
  return useMemo(() => {
    if (l1 || l2) return null;
    if (type === "class") return (classes.find((c) => c.id === targetId)?.weeklySchedule ?? []).map((s) => s.day);
    const own = classes.find((c) => c.members?.includes(targetId));
    const st = students.find((s) => s.id === targetId);
    return (own?.weeklySchedule ?? st?.weeklySchedule ?? []).map((s) => s.day);
  }, [type, targetId, classes, students, l1, l2]);
}

function RunCard({
  run,
  lessons,
  onPatch,
  onRemove,
}: {
  run: Run;
  lessons: Lesson[];
  onPatch: (body: object) => void;
  onRemove: () => void;
}) {
  const weekdays = useWeekdays(run.targetType, run.targetId);
  const today = vnTodayKey();
  const dates = weekdays
    ? lessonDates({ lessonCount: lessons.length, startDate: run.startDate, startLesson: run.startLesson, weekdays, skipDates: run.skipDates })
    : [];
  const nextIdx = dates.findIndex((d) => d && d.date >= today);
  const lastIdx = dates.length ? dates.length - 1 : -1;
  const [skip, setSkip] = useState("");

  return (
    <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {run.targetType === "class" ? "👥" : "👤"} {run.targetLabel}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={run.autoAssign}
              onChange={(e) => onPatch({ autoAssign: e.target.checked })}
              style={{ accentColor: "var(--accent-primary)" }}
            />
            Tự giao nháp đã duyệt (20:30 ngày học)
          </label>
          <button onClick={onRemove} className={btn} style={{ ...btnStyle, color: "rgb(220,38,38)" }}>Gỡ</button>
        </div>
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Buổi {run.startLesson} = {fmtDayShort(run.startDate)}
        {weekdays && weekdays.length === 0 && " · ⚠ chưa có lịch học tuần — tạm tính mỗi tuần 1 buổi"}
        {nextIdx >= 0 && dates[nextIdx] && <> · Buổi tới: <b>Buổi {nextIdx + 1}</b> ({fmtDayShort(dates[nextIdx]!.date)})</>}
        {nextIdx === -1 && dates[lastIdx] && " · Đã qua hết các buổi"}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Ngày nghỉ:</span>
        {run.skipDates.length === 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>không có</span>}
        {run.skipDates.map((d) => (
          <span key={d} className="text-xs px-2 py-0.5 rounded-full border inline-flex gap-1" style={{ borderColor: "var(--border)" }}>
            {fmtDayShort(d)}
            <button onClick={() => onPatch({ removeSkip: d })} style={{ color: "var(--text-muted)" }} aria-label="Bỏ ngày nghỉ">✕</button>
          </span>
        ))}
        <input
          type="date"
          value={skip}
          onChange={(e) => setSkip(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg border"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <button
          disabled={!skip}
          onClick={() => {
            onPatch({ addSkip: skip });
            setSkip("");
          }}
          className={`${btn} disabled:opacity-40`}
          style={btnStyle}
        >
          ＋ Nghỉ (các buổi sau lùi lại)
        </button>
      </div>
    </div>
  );
}

function AttachDialog({
  target,
  lessonCount,
  onClose,
  onDone,
}: {
  target: PickedTarget;
  lessonCount: number;
  onClose: () => void;
  onDone: (b: { startDate: string; startLesson: number; autoAssign: boolean }) => Promise<void>;
}) {
  const [startDate, setStartDate] = useState(vnTodayKey());
  const [startLesson, setStartLesson] = useState(1);
  const [autoAssign, setAutoAssign] = useState(false);
  const [busy, setBusy] = useState(false);
  const field = "w-full px-3 py-2 rounded-lg text-sm border outline-none";
  const fieldStyle = { background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" };
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="w-full max-w-md my-16 rounded-2xl border shadow-xl p-5 space-y-4" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Gắn giáo trình cho {target.label}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
            <span>Bắt đầu từ buổi số</span>
            <input type="number" min={1} max={Math.max(1, lessonCount)} value={startLesson} onChange={(e) => setStartLesson(Math.max(1, Number(e.target.value) || 1))} className={field} style={fieldStyle} />
          </label>
          <label className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
            <span>Ngày học buổi đó</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} style={fieldStyle} />
          </label>
        </div>
        <label className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} style={{ accentColor: "var(--accent-primary)" }} className="mt-0.5" />
          Tự giao nháp đã duyệt vào 20:30 ngày học (nháp chưa duyệt thì không giao)
        </label>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Các buổi sau tính theo lịch học tuần của lớp/HV. Lớp/HV đang chạy giáo trình khác sẽ chuyển sang giáo trình này.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Huỷ</button>
          <button
            disabled={busy || !startDate}
            onClick={async () => {
              setBusy(true);
              await onDone({ startDate, startLesson, autoAssign });
              setBusy(false);
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            {busy ? "Đang gắn…" : "Gắn & tạo nháp"}
          </button>
        </div>
      </div>
    </div>
  );
}
