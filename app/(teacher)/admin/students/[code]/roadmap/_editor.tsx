"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Task = {
  id: string;
  date: string;
  title: string;
  href: string;
  estMinutes: number;
  priority: string;
  status: string;
};

type Week = {
  id: string;
  weekIndex: number;
  startDate: string;
  endDate: string;
  theme: string;
  goalText: string;
  status: string;
  teacherNote: string;
  tasks: Task[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "chưa làm",
  done: "đã xong",
  skipped: "bỏ qua",
  missed: "lỡ",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--text-secondary)",
  done: "#4A7C59",
  skipped: "#9A8672",
  missed: "#B03A2A",
};

export function RoadmapEditor({
  code,
  weeks,
  today,
}: {
  code: string;
  weeks: Week[];
  today: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(body: unknown, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/admin/roadmap/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(
          b?.error === "already_done"
            ? "Việc này học viên đã làm xong — không xoá được."
            : b?.error === "date_outside_plan"
              ? "Ngày đó nằm ngoài các tuần đã xếp."
              : b?.error === "unknown_catalog_id"
                ? "Mã bài không có trong catalog."
                : "Không lưu được thay đổi.",
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Không gọi được máy chủ.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm" style={{ color: "#B03A2A" }} role="alert">
          {error}
        </p>
      )}

      {weeks.map((w) => (
        <section
          key={w.id}
          className="rounded-lg border p-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <header className="mb-3">
            <h2 className="font-bold">
              Tuần {w.weekIndex}: {w.theme}
              <span
                className="ml-2 text-xs font-normal"
                style={{ color: "var(--text-secondary)" }}
              >
                {w.startDate} → {w.endDate} · {w.status}
              </span>
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {w.goalText}
            </p>
          </header>

          <ul className="space-y-1 mb-3">
            {w.tasks.map((t) => (
              <li key={t.id} className="flex items-baseline gap-2 text-sm">
                <span style={{ color: "var(--text-secondary)", minWidth: 52 }}>
                  {t.date.slice(5)}
                </span>
                <a
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t.title}
                </a>
                <span style={{ color: "var(--text-secondary)" }}>{t.estMinutes}′</span>
                <span style={{ color: STATUS_COLOR[t.status] ?? "var(--text-secondary)" }}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
                {t.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => send({ action: "remove", taskId: t.id }, t.id)}
                    disabled={busy === t.id}
                    className="underline"
                    style={{ color: "#B03A2A", fontSize: ".75rem" }}
                  >
                    xoá
                  </button>
                )}
              </li>
            ))}
            {w.tasks.length === 0 && (
              <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Tuần này chưa có việc nào.
              </li>
            )}
          </ul>

          <AddTask
            defaultDate={
              today >= w.startDate && today <= w.endDate ? today : w.startDate
            }
            busy={busy === `add-${w.id}`}
            onAdd={(catalogId, date) => send({ action: "add", catalogId, date }, `add-${w.id}`)}
          />

          <TeacherNote
            initial={w.teacherNote}
            busy={busy === `note-${w.id}`}
            onSave={(note) => send({ action: "note", weekId: w.id, note }, `note-${w.id}`)}
          />
        </section>
      ))}
    </div>
  );
}

function AddTask({
  defaultDate,
  busy,
  onAdd,
}: {
  defaultDate: string;
  busy: boolean;
  onAdd: (catalogId: string, date: string) => void;
}) {
  const [catalogId, setCatalogId] = useState("");
  const [date, setDate] = useState(defaultDate);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
      <input
        value={catalogId}
        onChange={(e) => setCatalogId(e.target.value)}
        placeholder="mã bài, vd sub.part5.hien-tai-don.l2"
        className="px-2 py-1 rounded border flex-1 min-w-[220px]"
        style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="px-2 py-1 rounded border"
        style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
      />
      <button
        type="button"
        onClick={() => catalogId && onAdd(catalogId.trim(), date)}
        disabled={busy || !catalogId.trim()}
        className="px-3 py-1 rounded font-medium text-white disabled:opacity-60"
        style={{ background: "var(--accent-primary)" }}
      >
        {busy ? "Đang thêm…" : "Thêm việc"}
      </button>
    </div>
  );
}

function TeacherNote({
  initial,
  busy,
  onSave,
}: {
  initial: string;
  busy: boolean;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initial);
  const dirty = note !== initial;

  return (
    <div className="flex flex-wrap items-start gap-2 text-sm">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Ghi chú của thầy cho tuần này (chỉ thầy thấy)"
        className="px-2 py-1 rounded border flex-1 min-w-[260px]"
        style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
      />
      <button
        type="button"
        onClick={() => onSave(note)}
        disabled={busy || !dirty}
        className="px-3 py-1 rounded border font-medium disabled:opacity-60"
        style={{ borderColor: "var(--border)" }}
      >
        {busy ? "Đang lưu…" : "Lưu ghi chú"}
      </button>
    </div>
  );
}
