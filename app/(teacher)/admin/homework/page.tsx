"use client";

import { useState } from "react";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useHomework } from "@/hooks/firebase/useHomework";
import { pushHomework, setHomework } from "@/lib/firebase/helpers";
import type { Homework, HwItem } from "@/lib/firebase/types";

const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;
const SECTION_LABELS: Record<string, string> = {
  vocab: "Từ vựng", listening: "Nghe", reading: "Đọc", practice: "Luyện tập", other: "Khác",
};

function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: HwItem;
  onChange: (val: HwItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-start">
      <input
        type="text"
        placeholder="Tên bài tập *"
        value={item.text}
        onChange={(e) => onChange({ ...item, text: e.target.value })}
        className="flex-1 px-2 py-1.5 rounded-lg text-xs border outline-none"
        style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
      <input
        type="url"
        placeholder="Link"
        value={item.link ?? ""}
        onChange={(e) => onChange({ ...item, link: e.target.value || undefined })}
        className="w-36 px-2 py-1.5 rounded-lg text-xs border outline-none"
        style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-xs px-2 py-1.5 min-h-[44px] rounded-lg"
        style={{ color: "rgb(220,38,38)", background: "rgba(239,68,68,0.08)" }}
      >
        ✕
      </button>
    </div>
  );
}

type SectionKey = typeof SECTIONS[number];

type FormSections = { [K in SectionKey]: HwItem[] };

function HomeworkForm({ code, onSaved }: { code: string; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<FormSections>({
    vocab: [], listening: [], reading: [], practice: [], other: [],
  });
  const [saving, setSaving] = useState(false);

  function addItem(section: SectionKey) {
    setSections((s) => ({ ...s, [section]: [...s[section], { text: "" }] }));
  }

  function updateItem(section: SectionKey, i: number, val: HwItem) {
    setSections((s) => {
      const arr = [...s[section]];
      arr[i] = val;
      return { ...s, [section]: arr };
    });
  }

  function removeItem(section: SectionKey, i: number) {
    setSections((s) => {
      const arr = [...s[section]];
      arr.splice(i, 1);
      return { ...s, [section]: arr };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;

    const hw: Homework = {
      id: `hw${Date.now()}`,
      date,
      endDate: endDate || undefined,
      ...Object.fromEntries(
        SECTIONS.map((s) => [s, sections[s].filter((i) => i.text.trim()).length > 0
          ? sections[s].filter((i) => i.text.trim())
          : undefined
        ])
      ) as Partial<Homework>,
    };

    setSaving(true);
    await pushHomework(code, hw);
    setSaving(false);

    // Reset
    setSections({ vocab: [], listening: [], reading: [], practice: [], other: [] });
    setDate(today);
    setEndDate("");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Ngày bắt đầu *</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Ngày kết thúc</label>
          <input type="date" value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              {SECTION_LABELS[section]}
            </span>
            <button
              type="button"
              onClick={() => addItem(section)}
              className="text-[11px] px-2 py-1 min-h-[44px] rounded"
              style={{ color: "var(--accent-primary)", background: "rgba(196,98,45,0.08)" }}
            >
              + Thêm
            </button>
          </div>
          {sections[section].map((item, i) => (
            <ItemRow
              key={i}
              item={item}
              onChange={(v) => updateItem(section, i, v)}
              onRemove={() => removeItem(section, i)}
            />
          ))}
        </div>
      ))}

      <button
        type="submit"
        disabled={saving || !date}
        className="text-sm font-semibold px-4 py-2 rounded-lg"
        style={{ background: "var(--accent-primary)", color: "#fff", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Đang lưu..." : "💾 Lưu bài tập"}
      </button>
    </form>
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
  const [tab, setTab] = useState<"new" | "existing">("new");
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
            {(["new", "existing"] as const).map((t) => (
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
                {t === "new" ? "➕ Giao bài mới" : "📋 Bài đã giao"}
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
            ) : (
              <ExistingHomework key={`${selectedCode}-${savedKey}`} code={selectedCode} />
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
