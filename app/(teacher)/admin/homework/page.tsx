"use client";

import { useState } from "react";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useClasses } from "@/hooks/firebase/useClasses";
import { pushHomework, setHomework } from "@/lib/firebase/helpers";
import AssignmentTracker from "@/components/vocab/AssignmentTracker";
import HomeworkEditor from "@/components/admin/homework/HomeworkEditor";
import { assignHomeworkDecks } from "@/lib/homework/client";

const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

/**
 * Giao bài cho một học viên — dùng chung khung soạn với trang lớp và trang HV.
 * Chờ dữ liệu lớp tải xong rồi mới mở để hạn nộp tự điền đúng theo lịch học.
 */
function HomeworkForm({ code, onSaved }: { code: string; onSaved: () => void }) {
  const { homework } = useHomework(code);
  const { students } = useAllStudents();
  const { classes, loading } = useClasses();
  const student = students.find((s) => s.id === code);
  const schedule = classes.find((c) => c.members?.includes(code))?.weeklySchedule ?? student?.weeklySchedule;

  if (loading) return <div className="h-40 animate-pulse rounded-xl" style={{ background: "var(--border)" }} />;

  return (
    <HomeworkEditor
      inline
      heading="Giao bài mới"
      targetLabel={student ? `${student.name} (${code})` : code}
      schedule={schedule}
      history={homework}
      saveLabel="💾 Lưu bài tập"
      onSave={async (hw) => {
        await pushHomework(code, hw);
        await assignHomeworkDecks(hw, [code]);
        // Web push chạy nền — không chặn giao diện chờ gửi xong.
        fetch("/api/push/homework-new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentCode: code, hwTitle: hw.title }),
        }).catch(() => {});
      }}
      onClose={onSaved}
    />
  );
}

function ExistingHomework({ code }: { code: string }) {
  const { homework, loading } = useHomework(code);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(index: number, hwId: string) {
    if (!confirm("Xóa bài tập này?")) return;
    setDeleting(hwId);
    const updated = homework.filter((_, i) => i !== index);
    await setHomework(code, updated);
    setDeleting(null);
  }

  if (loading) return <div className="h-10 animate-pulse rounded-xl" style={{ background: "var(--border)" }} />;
  if (homework.length === 0) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có bài tập.</p>;

  return (
    <div className="space-y-2">
      {homework.map((hw, i) => {
        const itemCount = SECTIONS.reduce((acc, s) => acc + (hw[s]?.length ?? 0), 0);
        return (
          <div
            key={`${hw.date}-${i}`}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {new Date(hw.date).toLocaleDateString("vi-VN")}
                {hw.endDate && ` → ${new Date(hw.endDate).toLocaleDateString("vi-VN")}`}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {itemCount} mục
              </p>
            </div>
            <button
              onClick={() => handleDelete(i, hw.id)}
              disabled={deleting === hw.id}
              className="text-xs px-2.5 py-1.5 min-h-[44px] rounded-lg border"
              style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgb(220,38,38)", background: "rgba(239,68,68,0.06)" }}
            >
              {deleting === hw.id ? "..." : "Xóa"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function HomeworkAdminPage() {
  const { students, loading } = useAllStudents();
  const [selectedCode, setSelectedCode] = useState("");
  const [tab, setTab] = useState<"new" | "existing" | "decks">("new");
  const [savedKey, setSavedKey] = useState(0);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        📝 Bài tập
      </h1>

      {/* Student picker */}
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>
          Chọn học viên
        </label>
        {loading ? (
          <div className="h-10 w-64 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
        ) : (
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border outline-none w-full max-w-xs"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <option value="">-- Chọn học viên --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </select>
        )}
      </div>

      {selectedCode ? (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {(["new", "existing", "decks"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={
                  tab === t
                    ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)" }
                    : { borderColor: "transparent", color: "var(--text-secondary)" }
                }
              >
                {t === "new" ? "➕ Giao bài mới" : t === "existing" ? "📋 Bài đã giao" : "🗂️ Bộ thẻ đã giao"}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab === "new" ? (
              <HomeworkForm
                key={`${selectedCode}-${savedKey}`}
                code={selectedCode}
                onSaved={() => { setSavedKey((k) => k + 1); setTab("existing"); }}
              />
            ) : tab === "existing" ? (
              <ExistingHomework key={`${selectedCode}-${savedKey}`} code={selectedCode} />
            ) : (
              <AssignmentTracker key={`${selectedCode}-${savedKey}`} studentCode={selectedCode} />
            )}
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">📝</div>
          <p style={{ color: "var(--text-secondary)" }}>Chọn học viên để giao bài.</p>
        </div>
      )}
    </div>
  );
}
