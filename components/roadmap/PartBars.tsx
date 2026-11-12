import { explainPriority } from "@/lib/roadmap/diagnose";
import type { PartDiagnosis, PartNumber } from "@/lib/roadmap/types";

const PART_LABEL: Record<PartNumber, string> = {
  1: "Part 1 · Mô tả tranh",
  2: "Part 2 · Hỏi – đáp",
  3: "Part 3 · Hội thoại",
  4: "Part 4 · Bài nói",
  5: "Part 5 · Hoàn thành câu",
  6: "Part 6 · Hoàn thành đoạn văn",
  7: "Part 7 · Đọc hiểu",
};

/**
 * Biểu đồ độ chính xác 7 part.
 *
 * Xếp theo SỐ PART chứ không theo thứ hạng ưu tiên: học viên đọc theo thứ tự
 * quen thuộc của đề thi thì dễ đối chiếu với bài mình vừa làm. Phần ưu tiên
 * được đánh dấu bằng màu và nhãn, không bằng cách xáo thứ tự.
 */
export function PartBars({
  parts,
  focusParts,
}: {
  parts: PartDiagnosis[];
  focusParts: PartNumber[];
}) {
  const ordered = [...parts].sort((a, b) => a.part - b.part);

  return (
    <ul className="space-y-3">
      {ordered.map((p) => {
        const pct = Math.round(p.accuracy * 100);
        const isFocus = focusParts.includes(p.part);
        return (
          <li key={p.part}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span
                className="text-sm font-medium"
                style={{ color: isFocus ? "#b91c1c" : "var(--text-primary)" }}
              >
                {PART_LABEL[p.part]}
                {isFocus && (
                  <span
                    className="ml-2 text-[11px] px-1.5 py-0.5 rounded"
                    style={{ background: "#fee2e2", color: "#b91c1c" }}
                  >
                    ưu tiên chữa
                  </span>
                )}
              </span>
              <span className="text-sm tabular-nums text-[var(--text-secondary)]">
                {/* `weight` chính là số câu chấm được của part; số câu đúng suy
                    ngược từ độ chính xác để khỏi phải truyền thêm trường. */}
                {Math.round(p.accuracy * p.weight)}/{p.weight} · {pct}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--bg-secondary)" }}
              role="img"
              aria-label={`${PART_LABEL[p.part]}: đúng ${pct} phần trăm`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: isFocus ? "#dc2626" : "#0f766e",
                }}
              />
            </div>
            {isFocus && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {explainPriority(p)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { PART_LABEL };
