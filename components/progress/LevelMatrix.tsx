"use client";

interface CellData {
  completed: number;
  total: number;
}

interface Props {
  // matrix[partNumber][level] = { completed, total }
  matrix: Record<number, Record<number, CellData>>;
}

const PARTS = [1, 2, 3, 4];
const LEVELS_BY_PART: Record<number, number[]> = {
  1: [1, 2],
  2: [1, 2],
  3: [1, 2, 3, 4],
  4: [1, 2, 3, 4],
};
const LEVEL_LABELS: Record<number, string> = {
  1: "L1 Fill-blank",
  2: "L2 More blanks / Dictation",
  3: "L3 Dictation",
  4: "L4 AI Summary",
};
const PART_LABELS: Record<number, string> = {
  1: "Part 1 🖼️",
  2: "Part 2 💬",
  3: "Part 3 🗣️",
  4: "Part 4 📢",
};

function cellColor(pct: number): string {
  if (pct === 0) return "bg-[var(--bg-tertiary)] text-[var(--text-muted)]";
  if (pct < 40)  return "bg-orange-500/15 text-orange-400";
  if (pct < 75)  return "bg-yellow-500/15 text-yellow-400";
  return "bg-emerald-500/15 text-emerald-400";
}

export function LevelMatrix({ matrix }: Props) {
  // Collect all unique levels shown
  const allLevels = [1, 2, 3, 4];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs text-[var(--text-muted)] font-medium pb-3 pr-4 whitespace-nowrap">Part</th>
            {allLevels.map((lvl) => (
              <th key={lvl} className="text-center text-xs text-[var(--text-muted)] font-medium pb-3 px-2 whitespace-nowrap">
                {LEVEL_LABELS[lvl]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="space-y-2">
          {PARTS.map((part) => (
            <tr key={part}>
              <td className="pr-4 py-1.5 font-medium text-sm text-[var(--text-primary)] whitespace-nowrap">
                {PART_LABELS[part]}
              </td>
              {allLevels.map((lvl) => {
                const validLevels = LEVELS_BY_PART[part];
                if (!validLevels.includes(lvl)) {
                  return (
                    <td key={lvl} className="px-2 py-1.5 text-center">
                      <div className="mx-auto w-20 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                        <span className="text-[var(--text-muted)] text-xs">—</span>
                      </div>
                    </td>
                  );
                }
                const cell = matrix[part]?.[lvl] ?? { completed: 0, total: 0 };
                const pct = cell.total > 0 ? Math.round((cell.completed / cell.total) * 100) : 0;
                return (
                  <td key={lvl} className="px-2 py-1.5 text-center">
                    <div className={`mx-auto w-20 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 ${cellColor(pct)}`}>
                      <span className="text-xs font-bold font-mono">{pct}%</span>
                      <span className="text-[10px] opacity-70">{cell.completed}/{cell.total}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
