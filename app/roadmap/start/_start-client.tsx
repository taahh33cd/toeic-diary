"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import {
  BASELINE_EXAM_SLUG,
  BASELINE_TEST_SLUG,
  DAYS_PER_WEEK_OPTIONS,
  MINUTES_PER_DAY_OPTIONS,
} from "@/lib/roadmap/config";
import { INTAKE_STORAGE_KEY, type StoredIntake } from "@/lib/roadmap/intake-storage";

const TARGET_OPTIONS = [450, 550, 650, 750, 850] as const;

const PART_OPTIONS = [
  { part: 1, label: "Part 1 · Mô tả tranh" },
  { part: 2, label: "Part 2 · Hỏi – đáp" },
  { part: 3, label: "Part 3 · Hội thoại" },
  { part: 4, label: "Part 4 · Bài nói" },
  { part: 5, label: "Part 5 · Hoàn thành câu" },
  { part: 6, label: "Part 6 · Hoàn thành đoạn văn" },
  { part: 7, label: "Part 7 · Đọc hiểu" },
] as const;

type Props = {
  /** Lượt thi gần đây dùng luôn được làm baseline, nếu có. */
  baseline: { attemptId: string; total: number; completedAt: string | null } | null;
};

/**
 * localStorage là nguồn dữ liệu NGOÀI React, nên đọc nó bằng useSyncExternalStore
 * chứ không bằng useState + useEffect.
 *
 * Hai cách kia đều sai một kiểu: đọc trong initializer của useState thì bản
 * render ở máy chủ (không có localStorage) khác bản ở trình duyệt và React báo
 * lệch hydrate; còn setState trong effect thì render hai lượt và bị chính lint
 * của React chặn. useSyncExternalStore có sẵn đường cho trường hợp này:
 * `getServerSnapshot` trả null lúc dựng HTML, rồi React tự đọc lại ở trình duyệt.
 */
const noopSubscribe = () => () => {};
const readRaw = () => {
  try {
    return localStorage.getItem(INTAKE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export function StartClient({ baseline }: Props) {
  const raw = useSyncExternalStore(noopSubscribe, readRaw, () => null);
  // `key` đổi khi đọc xong câu trả lời cũ → form dựng lại với giá trị đã lưu,
  // không cần setState nào cả.
  return <StartForm key={raw ?? "default"} baseline={baseline} initial={parseIntake(raw)} />;
}

function parseIntake(raw: string | null): StoredIntake | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<StoredIntake>;
    if (typeof v.minutesPerDay !== "number" || typeof v.daysPerWeek !== "number") return null;
    return {
      minutesPerDay: v.minutesPerDay,
      daysPerWeek: v.daysPerWeek,
      targetScore: typeof v.targetScore === "number" ? v.targetScore : null,
      deadline: typeof v.deadline === "string" ? v.deadline : null,
      preferredParts: Array.isArray(v.preferredParts) ? v.preferredParts : [],
    };
  } catch {
    return null;
  }
}

function StartForm({
  baseline,
  initial,
}: Props & { initial: StoredIntake | null }) {
  const router = useRouter();

  const [minutesPerDay, setMinutesPerDay] = useState(initial?.minutesPerDay ?? 30);
  const [daysPerWeek, setDaysPerWeek] = useState(initial?.daysPerWeek ?? 4);
  const [targetScore, setTargetScore] = useState<number | null>(initial?.targetScore ?? 650);
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [preferredParts, setPreferredParts] = useState<number[]>(initial?.preferredParts ?? []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intake: StoredIntake = {
    minutesPerDay,
    daysPerWeek,
    targetScore,
    deadline: deadline || null,
    preferredParts,
  };

  function save() {
    try {
      localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(intake));
    } catch {
      // Chế độ riêng tư hoặc hết dung lượng — không chặn học viên đi tiếp,
      // trang kết quả sẽ hỏi lại hai câu này nếu không đọc được.
    }
  }

  function goToTest() {
    save();
    router.push(`/skills/full-tests/${BASELINE_EXAM_SLUG}/${BASELINE_TEST_SLUG}`);
  }

  async function generateFromBaseline() {
    if (!baseline) return;
    save();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutesPerDay,
          daysPerWeek,
          targetScore,
          deadline: deadline || null,
          preferredParts,
          attemptId: baseline.attemptId,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(messageFor(body?.error));
        setBusy(false);
        return;
      }
      router.push("/roadmap/result");
    } catch {
      setError("Không gọi được máy chủ. Kiểm tra mạng rồi thử lại.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Tạo lộ trình học của bạn
        </h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          Năm câu hỏi ngắn, rồi một bài test đầu vào. Từ kết quả test, hệ thống sẽ
          chỉ ra bạn đang mất điểm ở đâu và xếp sẵn việc cần làm từng ngày.
        </p>
      </header>

      <Field
        label="Mỗi ngày bạn học được bao nhiêu lâu?"
        hint="Cứ chọn mức bạn giữ được đều đặn, không phải mức lý tưởng."
      >
        <Chips
          options={MINUTES_PER_DAY_OPTIONS.map((m) => ({ value: m, label: `${m} phút` }))}
          value={minutesPerDay}
          onChange={setMinutesPerDay}
        />
      </Field>

      <Field label="Mỗi tuần bạn học được mấy ngày?">
        <Chips
          options={DAYS_PER_WEEK_OPTIONS.map((d) => ({ value: d, label: `${d} ngày` }))}
          value={daysPerWeek}
          onChange={setDaysPerWeek}
        />
      </Field>

      <Field label="Mục tiêu điểm TOEIC">
        <Chips
          options={[
            ...TARGET_OPTIONS.map((t) => ({ value: t as number, label: `${t}` })),
            { value: 0, label: "Chưa rõ" },
          ]}
          value={targetScore ?? 0}
          onChange={(v) => setTargetScore(v === 0 ? null : v)}
        />
      </Field>

      <Field
        label="Dự kiến thi ngày nào?"
        hint="Bỏ trống cũng được — khi đó lộ trình mặc định dài 3 tháng."
      >
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          style={{ borderColor: "var(--border)" }}
        />
      </Field>

      <Field
        label="Có phần nào bạn muốn ưu tiên không?"
        hint="Không chọn cũng được. Hệ thống vẫn tự tìm phần bạn yếu nhất từ kết quả test."
      >
        <div className="flex flex-wrap gap-2">
          {PART_OPTIONS.map((p) => {
            const on = preferredParts.includes(p.part);
            return (
              <button
                key={p.part}
                type="button"
                onClick={() =>
                  setPreferredParts((prev) =>
                    on ? prev.filter((x) => x !== p.part) : [...prev, p.part].slice(-3),
                  )
                }
                className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                style={{
                  borderColor: on ? "#0f766e" : "var(--border)",
                  background: on ? "#0f766e" : "var(--bg-elevated)",
                  color: on ? "#fff" : "var(--text-primary)",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>

      {error && (
        <p className="text-sm text-[var(--accent-red)]" role="alert">
          {error}
        </p>
      )}

      <div className="border-t pt-6 space-y-4" style={{ borderColor: "var(--border)" }}>
        {baseline ? (
          <>
            <p className="text-[var(--text-secondary)]">
              Bạn đã thi thử trọn đề gần đây —{" "}
              <strong className="text-[var(--text-primary)]">{baseline.total} điểm</strong>
              {baseline.completedAt ? ` ngày ${formatDate(baseline.completedAt)}` : ""}. Dùng luôn
              kết quả đó thì không phải làm lại hai tiếng.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateFromBaseline}
                disabled={busy}
                className="px-5 py-2.5 rounded-lg font-semibold text-white disabled:opacity-60"
                style={{ background: "#0f766e" }}
              >
                {busy ? "Đang dựng lộ trình…" : "Dùng kết quả đó, tạo lộ trình"}
              </button>
              <button
                type="button"
                onClick={goToTest}
                disabled={busy}
                className="px-5 py-2.5 rounded-lg font-medium border disabled:opacity-60"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Làm đề mới
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[var(--text-secondary)]">
              Bước tiếp theo là bài test đầu vào — một đề TOEIC trọn bộ, khoảng 2 tiếng.
              Làm một mạch thì kết quả mới phản ánh đúng sức bạn.
            </p>
            <button
              type="button"
              onClick={goToTest}
              className="px-5 py-2.5 rounded-lg font-semibold text-white"
              style={{ background: "#0f766e" }}
            >
              Bắt đầu bài test đầu vào
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Mảnh giao diện dùng lại trong trang ─────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-[var(--text-primary)]">{label}</h2>
      {hint && <p className="text-sm text-[var(--text-secondary)]">{hint}</p>}
      {children}
    </section>
  );
}

function Chips<T extends number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className="px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{
              borderColor: on ? "#0f766e" : "var(--border)",
              background: on ? "#0f766e" : "var(--bg-elevated)",
              color: on ? "#fff" : "var(--text-primary)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function messageFor(code?: string): string {
  if (code === "no_baseline") return "Chưa tìm thấy bài test đầu vào. Làm đề rồi quay lại nhé.";
  if (code === "incomplete_baseline")
    return "Bài test chưa làm đủ 7 part nên chưa chẩn đoán được. Cần làm trọn đề.";
  if (code === "Forbidden") return "Lộ trình đang chạy thử với một nhóm học viên.";
  return "Có lỗi khi dựng lộ trình. Thử lại sau ít phút.";
}
