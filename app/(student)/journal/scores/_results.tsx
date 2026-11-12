"use client";

/**
 * Phần "Kết quả" của trang Điểm số: gộp điểm thi thật (nhập tay, Firebase) với
 * các lượt làm bài trong khu Luyện đề (Postgres) thành một trang.
 *
 * File này giữ mọi thứ thuần về lượt làm bài + mảnh giao diện dùng chung cho
 * dòng lịch sử. Dòng điểm thi thật (sửa/xoá/chữa bài) vẫn nằm ở
 * _scores-client.tsx vì cần form nhập điểm ở đó — truyền vào qua `renderReal`.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/journal/paper/Sheet";
import { useLocale } from "@/hooks/useLocale";
import type { ToeicScore } from "@/lib/firebase/types";

// ─── Kiểu dữ liệu từ server ──────────────────────────────────────────────────

export interface ClientAttempt {
  id: string;
  kind: "part" | "full";
  status: "in_progress" | "done";
  groupKey: string;
  groupLabel: string;
  testTitle: string;
  testHref: string;
  /** "Thi thử" | "Luyện tập" */
  modeLabel: string;
  correct: number | null;
  gradable: number | null;
  /** Điểm quy đổi 10–990 — chỉ lượt trọn đề làm đủ 7 part mới có */
  total: number | null;
  listening: number | null;
  reading: number | null;
  answered: number;
  /** ISO — Date không qua được ranh giới server/client an toàn */
  atISO: string;
}

/** Lối vào và tổng số đề của một dạng bài — server suy ra từ catalog. */
export interface GroupMeta {
  groupKey: string;
  href: string;
  totalTests: number;
}

const REAL_MODE = "Thi thử";
const TZ = "Asia/Ho_Chi_Minh";

// ─── Tiện ích ────────────────────────────────────────────────────────────────

export function pct(correct: number | null, gradable: number | null): number | null {
  if (correct === null || !gradable) return null;
  return Math.round((correct / gradable) * 100);
}

/** Màu theo tỷ lệ đúng: đỏ dưới 50%, vàng 50-79%, xanh từ 80%. */
export function toneOf(p: number | null): string {
  if (p === null) return "var(--text-muted)";
  if (p >= 80) return "var(--accent-green, #15803d)";
  if (p >= 50) return "#a16207";
  return "var(--accent-red, #b91c1c)";
}

const VN_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

/**
 * Thời điểm ISO → "YYYY-MM-DDTHH:mm:ss" theo giờ Việt Nam.
 * Cùng dạng với ngày thi nhập tay ("YYYY-MM-DD") nên so chuỗi là đủ để sắp xếp,
 * và ra cùng kết quả ở server lẫn trình duyệt (không lệch hydration).
 */
export function vnStamp(iso: string): string {
  const parts = Object.fromEntries(
    VN_PARTS.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/** "YYYY-MM-DD" → "12/11/2026" */
export function fmtDay(day: string): string {
  const [y, m, d] = day.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function fmtDateTime(iso: string): string {
  const s = vnStamp(iso);
  return `${s.slice(11, 16)} ${fmtDay(s)}`;
}

/** "PRACTICE TEST EST 2026" → "EST 2026" — nhãn trong thanh ngang rất hẹp. */
function shortGroup(label: string): string {
  return label.replace(/^PRACTICE TEST\s+/i, "");
}

/** Lượt trọn đề được lên biểu đồ + tính ước tính: chế độ thi thử, có điểm 990. */
export function isChartMock(a: ClientAttempt): boolean {
  return a.status === "done" && a.kind === "full" && a.total !== null && a.modeLabel === REAL_MODE;
}

/**
 * Điểm ước tính = trung bình tối đa 3 bài thi thử gần nhất, làm tròn bội 5
 * như thang TOEIC. Bài ở chế độ Luyện tập không tính: có thể đã xem đáp án.
 */
export function estimateFromMocks(attempts: ClientAttempt[]): { value: number; n: number } | null {
  const recent = attempts
    .filter(isChartMock)
    .sort((a, b) => b.atISO.localeCompare(a.atISO))
    .slice(0, 3);
  if (recent.length === 0) return null;
  const avg = recent.reduce((s, a) => s + a.total!, 0) / recent.length;
  return { value: Math.round(avg / 5) * 5, n: recent.length };
}

// ─── Biểu đồ điểm: thi thật (chấm đặc) + thi thử trong app (chấm rỗng) ───────

export interface ChartPoint {
  score: number;
  /** "YYYY-MM-DD" hoặc "YYYY-MM-DDTHH:mm:ss" (giờ VN) */
  date: string;
  kind: "real" | "mock";
  label?: string;
}

/** Tối đa bấy nhiêu nhãn ngày dưới trục — nhiều hơn là chồng lên nhau. */
const MAX_X_LABELS = 6;

export function ScoreChart({ points, noDataLabel, maxFloor = 500 }: {
  points: ChartPoint[]; noDataLabel: string; maxFloor?: number;
}) {
  const { t } = useLocale();

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[140px]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{noDataLabel}</p>
      </div>
    );
  }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((s) => s.score);
  const maxV = Math.max(...values, maxFloor);
  const minV = Math.max(0, Math.min(...values) - 50);
  const range = maxV - minV || 100;

  const W = 560, H = 150, PL = 10, PR = 10, PT = 16, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;

  const pts = sorted.map((s, i) => ({
    ...s,
    x: PL + (sorted.length > 1 ? (i / (sorted.length - 1)) * cW : cW / 2),
    y: PT + (1 - (s.score - minV) / range) * cH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + cH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + cH).toFixed(1)} Z`;

  // Nhãn ngày: luôn có điểm đầu + cuối, giữa rải đều.
  const step = Math.max(1, Math.ceil((pts.length - 1) / (MAX_X_LABELS - 1)));
  const labelled = new Set<number>([0, pts.length - 1]);
  for (let i = step; i < pts.length - 1; i += step) {
    if (pts.length - 1 - i >= step / 2) labelled.add(i);
  }

  const hasMock = pts.some((p) => p.kind === "mock");
  const hasReal = pts.some((p) => p.kind === "real");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}
        role="img" aria-label={t("Biểu đồ điểm theo thời gian", "Score over time")}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--accent-primary)", stopOpacity: 0.28 }} />
            <stop offset="100%" style={{ stopColor: "var(--accent-primary)", stopOpacity: 0.03 }} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#scoreGrad)" />
        <path d={linePath} fill="none" style={{ stroke: "var(--accent-primary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.kind === "real" ? 4.5 : 4}
            style={p.kind === "real"
              ? { fill: "var(--accent-primary)", stroke: "var(--bg-elevated)" }
              : { fill: "var(--bg-elevated)", stroke: "var(--accent-primary)" }}
            strokeWidth={p.kind === "real" ? 1.5 : 2}>
            <title>
              {`${p.score} · ${p.kind === "real" ? t("Thi thật", "Real test") : t("Thi thử", "Mock test")} · ${fmtDay(p.date)}${p.label ? ` · ${p.label}` : ""}`}
            </title>
          </circle>
        ))}
        {pts.map((p, i) => {
          if (!labelled.has(i)) return null;
          const [, m, d] = p.date.slice(0, 10).split("-");
          return (
            <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={10} style={{ fill: "var(--text-muted)" }}>
              {`${Number(d)}/${Number(m)}`}
            </text>
          );
        })}
      </svg>
      {hasMock && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {hasReal && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: "var(--accent-primary)" }} />
              {t("Thi thật", "Real test")}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block rounded-full" style={{ width: 8, height: 8, border: "2px solid var(--accent-primary)" }} />
            {t("Thi thử trong app", "In-app mock test")}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Mảnh giao diện nhỏ ──────────────────────────────────────────────────────

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="text-xs px-2.5 py-1 rounded-full transition-colors"
      style={{
        border: `1px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
        background: active ? "color-mix(in srgb, var(--accent-primary) 14%, transparent)" : "transparent",
        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export type EntryKind = "real" | "mock" | "part";

/** Nhãn loại kết quả, đặt đầu mỗi dòng lịch sử. */
export function KindBadge({ kind }: { kind: EntryKind }) {
  const { t } = useLocale();
  const spec = {
    real: { label: t("Thi thật", "Real test"), style: { background: "var(--text-primary)", color: "var(--bg-elevated)", border: "1px solid var(--text-primary)" } },
    mock: { label: t("Thi thử", "Mock test"), style: { background: "transparent", color: "var(--orange, var(--accent-primary))", border: "1px solid var(--orange, var(--accent-primary))" } },
    part: { label: t("Luyện Part", "Part practice"), style: { background: "rgba(30,111,168,0.1)", color: "#1E6FA8", border: "1px solid rgba(30,111,168,0.22)" } },
  }[kind];
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap shrink-0" style={spec.style}>
      {spec.label}
    </span>
  );
}

/** Khung chung của một dòng lịch sử — ngày · nhãn + tên · điểm · phần bên phải. */
export function RowShell({
  day, badge, title, sub, score, scoreColor, right, highlight,
}: {
  day: string;
  badge: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  score: React.ReactNode;
  scoreColor?: string;
  right?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3"
      style={{ background: highlight ? "var(--accent-faint)" : "transparent" }}>
      {/* Điện thoại: ngày một dòng riêng để tên bài đủ chỗ; từ sm là cột cố định. */}
      <span className="w-full sm:w-20 text-xs tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>{day}</span>
      <span className="block flex-1 min-w-0">
        <span className="flex items-center gap-2 min-w-0">
          {badge}
          <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{title}</span>
        </span>
        {sub && <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</span>}
      </span>
      <span className="text-sm font-bold tabular-nums whitespace-nowrap"
        style={{ fontFamily: "'Lora', serif", color: scoreColor ?? "var(--text-primary)" }}>
        {score}
      </span>
      {right}
    </span>
  );
}

// ─── Đang làm dở ─────────────────────────────────────────────────────────────

export function UnfinishedList({ attempts }: { attempts: ClientAttempt[] }) {
  const { t } = useLocale();
  const list = useMemo(
    () => attempts
      .filter((a) => a.status === "in_progress" && a.answered > 0)
      .sort((a, b) => b.atISO.localeCompare(a.atISO)),
    [attempts],
  );
  if (list.length === 0) return null;

  return (
    <Sheet className="p-4">
      <h2 className="text-sm font-bold m-0 mb-2" style={{ color: "var(--text-secondary)" }}>
        {t("Đang làm dở", "In progress")}
        <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
          {list.length} {t("bài", list.length === 1 ? "test" : "tests")}
        </span>
      </h2>
      <ul className="list-none p-0 m-0 grid gap-2 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a.id}>
            <Link
              href={a.testHref}
              className="flex items-center gap-3 px-3 py-2.5 no-underline rounded-lg transition-colors"
              style={{ color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate">{a.groupLabel} · {a.testTitle}</span>
                <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {t("Đã trả lời", "Answered")} {a.answered} {t("câu", "questions")} · {t("lưu lúc", "saved")} {fmtDateTime(a.atISO)}
                </span>
              </span>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--accent-primary)" }}>
                {t("Làm tiếp", "Continue")} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

// ─── Nên luyện gì tiếp ───────────────────────────────────────────────────────

interface GroupStat {
  key: string;
  label: string;
  /** Tổng câu đúng / tổng câu chấm được của cả dạng bài */
  p: number | null;
  doneTests: number;
  totalTests: number;
  href: string;
}

interface Tip {
  key: string;
  text: string;
  href: string;
  cta: string;
}

/**
 * Trả lời câu "nên luyện gì tiếp": so sức mạnh giữa các dạng bài rồi nêu vài
 * việc cụ thể. Tính trên mọi lượt đã nộp, không chịu bộ lọc lịch sử.
 * Thanh ngang sắp theo tỷ lệ tăng dần: dạng yếu nhất nằm trên.
 */
export function NextUp({ attempts, groupMeta, onPick }: {
  attempts: ClientAttempt[];
  groupMeta: GroupMeta[];
  onPick: (groupKey: string) => void;
}) {
  const { t } = useLocale();
  const done = useMemo(() => attempts.filter((a) => a.status === "done"), [attempts]);

  /**
   * Lượt đủ tư cách đo năng lực. Có những lượt nộp khi mới trả lời vài câu —
   * dữ liệu thật có cả lượt 0/199 — mà một lượt như vậy không nói gì về trình
   * độ, chỉ kéo cả dạng bài về 0% và biến gợi ý thành câu làm nản.
   */
  const attempted = useMemo(
    () => done.filter((a) => a.correct !== null && !!a.gradable && a.answered >= a.gradable * 0.5),
    [done],
  );

  /**
   * Tỷ lệ = tổng câu đúng / tổng câu chấm được, không phải trung bình các phần
   * trăm: một lượt Part 1 (6 câu) không được nặng bằng một lượt Part 2 (25 câu).
   */
  const rows = useMemo<GroupStat[]>(() => {
    const meta = new Map(groupMeta.map((m) => [m.groupKey, m]));
    const acc = new Map<string, { key: string; label: string; correct: number; gradable: number; tests: Set<string> }>();
    const ok = new Set(attempted.map((a) => a.id));
    for (const a of done) {
      let g = acc.get(a.groupKey);
      if (!g) {
        g = { key: a.groupKey, label: a.groupLabel, correct: 0, gradable: 0, tests: new Set() };
        acc.set(a.groupKey, g);
      }
      g.tests.add(a.testTitle);
      if (ok.has(a.id)) { g.correct += a.correct!; g.gradable += a.gradable!; }
    }
    return [...acc.values()]
      .map((g) => ({
        key: g.key,
        label: g.label,
        p: g.gradable ? Math.round((g.correct / g.gradable) * 100) : null,
        doneTests: g.tests.size,
        totalTests: meta.get(g.key)?.totalTests ?? 0,
        href: meta.get(g.key)?.href ?? "/skills",
      }))
      .sort((x, y) => (x.p ?? 101) - (y.p ?? 101));
  }, [done, attempted, groupMeta]);

  /** Tối đa ba việc cụ thể, xếp theo mức đáng làm trước. */
  const tips = useMemo<Tip[]>(() => {
    const out: Tip[] = [];
    const scored = rows.filter((g): g is GroupStat & { p: number } => g.p !== null);

    // Dạng yếu nhất — chỉ có nghĩa khi có từ hai dạng để so và chúng khác nhau.
    if (scored.length >= 2 && scored[0].p < scored[scored.length - 1].p) {
      const w = scored[0];
      out.push({
        key: "weak",
        text: t(`${shortGroup(w.label)} đang thấp nhất, ${w.p}%.`, `${shortGroup(w.label)} is your weakest, ${w.p}%.`),
        href: w.href,
        cta: t("Luyện dạng này", "Practice this"),
      });
    }

    // Đề mà kết quả TỐT NHẤT vẫn dưới 80%: làm lại đáng giá hơn mở đề mới.
    const bestPerTest = new Map<string, { title: string; label: string; href: string; p: number }>();
    for (const a of attempted) {
      const p = pct(a.correct, a.gradable);
      if (p === null) continue;
      const k = `${a.groupKey}|${a.testTitle}`;
      const cur = bestPerTest.get(k);
      if (!cur || p > cur.p) bestPerTest.set(k, { title: a.testTitle, label: a.groupLabel, href: a.testHref, p });
    }
    const redo = [...bestPerTest.values()].filter((x) => x.p < 80).sort((a, b) => a.p - b.p)[0];
    if (redo) {
      out.push({
        key: "redo",
        text: t(`${shortGroup(redo.label)} · ${redo.title} cao nhất mới ${redo.p}%.`, `${shortGroup(redo.label)} · ${redo.title}: best so far ${redo.p}%.`),
        href: redo.href,
        cta: t("Làm lại", "Retry"),
      });
    }

    // Còn đề chưa làm — rows đã xếp yếu trước nên ưu tiên đúng dạng cần.
    const fresh = rows.find((g) => g.totalTests > g.doneTests);
    if (fresh) {
      const left = fresh.totalTests - fresh.doneTests;
      out.push({
        key: "new",
        text: t(`Còn ${left} đề chưa làm ở ${shortGroup(fresh.label)}.`, `${left} untried tests left in ${shortGroup(fresh.label)}.`),
        href: fresh.href,
        cta: t("Chọn đề", "Pick a test"),
      });
    }

    return out;
  }, [rows, attempted, t]);

  if (rows.length < 2 && tips.length === 0) return null;

  return (
    <Sheet className="p-4">
      <h2 className="text-sm font-bold m-0" style={{ color: "var(--text-secondary)" }}>
        {t("Nên luyện gì tiếp", "What to practice next")}
      </h2>
      <p className="text-xs m-0 mt-0.5 mb-3" style={{ color: "var(--text-muted)" }}>
        {t(
          "Tính trên mọi lượt đã nộp. Lượt nộp khi chưa làm được nửa đề không tính vào tỷ lệ. Bấm một dòng để lọc lịch sử bên dưới.",
          "Based on all submitted attempts. Attempts under half answered are ignored. Click a row to filter the history below.",
        )}
      </p>

      {rows.length > 0 && (
        <ul className="list-none p-0 m-0 grid gap-1.5 mb-3">
          {rows.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => onPick(r.key)}
                title={t(`Chỉ xem ${r.label}`, `Show only ${r.label}`)}
                className="w-full flex items-center gap-2 text-left bg-transparent border-0 p-0 cursor-pointer"
              >
                <span className="text-xs truncate" style={{ width: 132, flexShrink: 0, color: "var(--text-secondary)" }}>
                  {shortGroup(r.label)}
                </span>
                {/* Thanh rỗng trông như lỗi — chưa đo được thì nói thẳng ra. */}
                {r.p === null ? (
                  <span className="flex-1 text-xs italic" style={{ color: "var(--text-muted)" }}>
                    {t("chưa có lượt nào làm đủ nửa đề", "no attempt with half the test answered yet")}
                  </span>
                ) : (
                  <span className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "var(--border)" }}>
                    <span className="block h-full rounded-full" style={{ width: `${r.p}%`, background: toneOf(r.p) }} />
                  </span>
                )}
                {r.p !== null && (
                  <span className="text-xs font-bold tabular-nums text-right" style={{ width: 34, color: toneOf(r.p) }}>
                    {r.p}%
                  </span>
                )}
                <span className="text-xs tabular-nums text-right hidden sm:block" style={{ width: 62, color: "var(--text-muted)" }}>
                  {r.totalTests > 0 ? `${r.doneTests}/${r.totalTests} ${t("đề", "tests")}` : `${r.doneTests} ${t("đề", "tests")}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {tips.length > 0 && (
        <ul className="list-none p-0 m-0 grid gap-1.5" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          {tips.map((tip) => (
            <li key={tip.key} className="flex items-baseline gap-2 text-sm flex-wrap">
              <span style={{ color: "var(--text-primary)" }}>{tip.text}</span>
              <Link href={tip.href} className="text-xs font-bold no-underline whitespace-nowrap" style={{ color: "var(--accent-primary)" }}>
                {tip.cta} →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

// ─── Lịch sử chung ───────────────────────────────────────────────────────────

export type KindFilter = "all" | EntryKind;

export interface HistoryFilter {
  kind: KindFilter;
  /** groupKey của một dạng bài, chọn từ "Nên luyện gì tiếp"; null = mọi dạng */
  group: string | null;
}

type Entry =
  | { type: "real"; key: string; sortKey: string; score: ToeicScore; idx: number }
  | { type: "mock"; key: string; sortKey: string; a: ClientAttempt }
  | { type: "partDay"; key: string; sortKey: string; day: string; items: ClientAttempt[] };

/** Gom thành các dòng theo bộ lọc, mới nhất trước. */
function buildEntries(scores: ToeicScore[], done: ClientAttempt[], f: HistoryFilter): Entry[] {
  const out: Entry[] = [];
  if ((f.kind === "all" || f.kind === "real") && !f.group) {
    scores.forEach((s, idx) => {
      out.push({ type: "real", key: `real-${idx}-${s.date}-${s.score}`, sortKey: `${s.date}T00:00:00`, score: s, idx });
    });
  }
  const byDay = new Map<string, ClientAttempt[]>();
  for (const a of done) {
    if (f.group && a.groupKey !== f.group) continue;
    if (a.kind === "full") {
      if (f.kind !== "all" && f.kind !== "mock") continue;
      out.push({ type: "mock", key: `mock-${a.id}`, sortKey: vnStamp(a.atISO), a });
    } else {
      if (f.kind !== "all" && f.kind !== "part") continue;
      const day = vnStamp(a.atISO).slice(0, 10);
      const list = byDay.get(day) ?? [];
      list.push(a);
      byDay.set(day, list);
    }
  }
  for (const [day, list] of byDay) {
    list.sort((a, b) => b.atISO.localeCompare(a.atISO));
    out.push({ type: "partDay", key: `part-${day}`, sortKey: vnStamp(list[0].atISO), day, items: list });
  }
  return out.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

const PAGE = 20;

/** "Xem lại →" — trên điện thoại chỉ còn mũi tên cho gọn dòng. */
function ReviewArrow() {
  const { t } = useLocale();
  return (
    <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--accent-primary)" }}>
      <span className="hidden sm:inline">{t("Xem lại", "Review")} </span>
      <span className="sm:hidden sr-only">{t("Xem lại", "Review")}</span>
      <span aria-hidden>→</span>
    </span>
  );
}

function MockRow({ a, highlight }: { a: ClientAttempt; highlight: boolean }) {
  const { t } = useLocale();
  const p = pct(a.correct, a.gradable);
  const practice = a.modeLabel !== REAL_MODE;
  const sub = a.total !== null
    ? `Listening ${a.listening ?? "–"} · Reading ${a.reading ?? "–"}${practice ? ` · ${t("chế độ luyện tập, không tính vào ước tính", "practice mode, not counted in estimate")}` : ""}`
    : `${t("Đúng", "Correct")} ${a.correct ?? "–"}/${a.gradable ?? "–"} · ${t("chưa làm đủ 7 part nên chưa quy đổi điểm", "not all 7 parts, no scaled score")}`;
  return (
    <Link href={`/journal/attempts/${a.id}`} className="block no-underline transition-colors hover:brightness-95">
      <RowShell
        day={fmtDay(vnStamp(a.atISO))}
        badge={<KindBadge kind="mock" />}
        title={`${shortGroup(a.groupLabel)} · ${a.testTitle}`}
        sub={sub}
        score={a.total !== null ? a.total : (p === null ? "–" : `${p}%`)}
        scoreColor={a.total !== null ? undefined : toneOf(p)}
        highlight={highlight}
        right={<ReviewArrow />}
      />
    </Link>
  );
}

function PartLine({ a }: { a: ClientAttempt }) {
  const { t } = useLocale();
  const p = pct(a.correct, a.gradable);
  return (
    <Link href={`/journal/attempts/${a.id}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 no-underline transition-colors hover:brightness-95"
      style={{ color: "var(--text-primary)", borderTop: "1px solid var(--border)" }}>
      <span className="flex-1 min-w-0 text-sm truncate" style={{ minWidth: 140 }}>
        {a.groupLabel} · {a.testTitle}
        {a.modeLabel === REAL_MODE && (
          <span className="ml-2 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{a.modeLabel}</span>
        )}
      </span>
      <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
        {a.correct ?? "–"}/{a.gradable ?? "–"}
      </span>
      <span className="text-sm font-bold tabular-nums whitespace-nowrap" style={{ width: 40, textAlign: "right", color: toneOf(p) }}>
        {p === null ? "–" : `${p}%`}
      </span>
      <span aria-hidden className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>→</span>
      <span className="sr-only">{t("Xem lại", "Review")}</span>
    </Link>
  );
}

function PartDayRow({ day, items, highlight }: { day: string; items: ClientAttempt[]; highlight: boolean }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  // Một lượt trong ngày thì hiện thẳng, không cần gộp.
  if (items.length === 1) {
    const a = items[0];
    const p = pct(a.correct, a.gradable);
    return (
      <Link href={`/journal/attempts/${a.id}`} className="block no-underline transition-colors hover:brightness-95">
        <RowShell
          day={fmtDay(day)}
          badge={<KindBadge kind="part" />}
          title={`${a.groupLabel} · ${a.testTitle}`}
          sub={`${t("Đúng", "Correct")} ${a.correct ?? "–"}/${a.gradable ?? "–"} · ${a.modeLabel}`}
          score={p === null ? "–" : `${p}%`}
          scoreColor={toneOf(p)}
          highlight={highlight}
          right={<ReviewArrow />}
        />
      </Link>
    );
  }

  // Trung bình có trọng số theo số câu, như phần "Nên luyện gì tiếp".
  const graded = items.filter((a) => a.correct !== null && !!a.gradable);
  const sumC = graded.reduce((s, a) => s + a.correct!, 0);
  const sumG = graded.reduce((s, a) => s + a.gradable!, 0);
  const avg = sumG ? Math.round((sumC / sumG) * 100) : null;
  const parts = [...new Set(items.map((a) => shortGroup(a.groupLabel)))];

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full block text-left bg-transparent border-0 p-0 cursor-pointer">
        <RowShell
          day={fmtDay(day)}
          badge={<KindBadge kind="part" />}
          title={t(`${items.length} bài luyện Part`, `${items.length} part practices`)}
          sub={parts.join(" · ")}
          score={avg === null ? "–" : `${t("TB", "Avg")} ${avg}%`}
          scoreColor={toneOf(avg)}
          highlight={highlight}
          right={<span aria-hidden className="text-xs" style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>}
        />
      </button>
      {open && (
        <div className="px-4 sm:pl-28 pb-2">
          {items.map((a) => <PartLine key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}

/**
 * Một dòng thời gian cho cả ba loại kết quả. Lượt luyện Part nhiều và nhỏ nên
 * gộp theo ngày; thi thật và thi thử luôn đứng riêng một dòng.
 */
export function LrHistory({
  scores, attempts, attemptsError, filter, onFilter, renderReal, onAddScore,
}: {
  /** Điểm thi thật, đã sắp mới nhất trước — `idx` truyền lại cho renderReal */
  scores: ToeicScore[];
  attempts: ClientAttempt[];
  attemptsError: boolean;
  filter: HistoryFilter;
  onFilter: (f: HistoryFilter) => void;
  renderReal: (score: ToeicScore, idx: number, highlight: boolean) => React.ReactNode;
  onAddScore: () => void;
}) {
  const { t } = useLocale();
  const [limit, setLimit] = useState(PAGE);

  const done = useMemo(() => attempts.filter((a) => a.status === "done"), [attempts]);

  const counts = useMemo(() => ({
    real: scores.length,
    mock: done.filter((a) => a.kind === "full").length,
    part: done.filter((a) => a.kind === "part").length,
  }), [scores, done]);

  const groupLabel = useMemo(
    () => (filter.group ? attempts.find((a) => a.groupKey === filter.group)?.groupLabel ?? null : null),
    [attempts, filter.group],
  );

  const entries = useMemo(() => buildEntries(scores, done, filter), [scores, done, filter]);
  // Dòng mới nhất trên toàn bộ lịch sử (không theo bộ lọc) được tô sáng.
  const newestKey = useMemo(
    () => buildEntries(scores, done, { kind: "all", group: null })[0]?.key ?? null,
    [scores, done],
  );

  const setFilter = (f: HistoryFilter) => { setLimit(PAGE); onFilter(f); };

  const kindsPresent = [counts.real, counts.mock, counts.part].filter((n) => n > 0).length;
  const total = counts.real + counts.mock + counts.part;
  const shown = entries.slice(0, limit);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}>
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="font-semibold text-base m-0" style={{ color: "var(--text-primary)" }}>
          {t("Lịch sử", "History")}
        </h2>
        {(kindsPresent >= 2 || filter.kind !== "all" || filter.group) && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={filter.kind === "all" && !filter.group} onClick={() => setFilter({ kind: "all", group: null })}>
              {t("Tất cả", "All")}
            </Chip>
            {counts.real > 0 && (
              <Chip active={filter.kind === "real"} onClick={() => setFilter({ kind: "real", group: null })}>
                {t("Thi thật", "Real")} · {counts.real}
              </Chip>
            )}
            {counts.mock > 0 && (
              <Chip active={filter.kind === "mock" && !filter.group} onClick={() => setFilter({ kind: "mock", group: null })}>
                {t("Thi thử", "Mock")} · {counts.mock}
              </Chip>
            )}
            {counts.part > 0 && (
              <Chip active={filter.kind === "part" && !filter.group} onClick={() => setFilter({ kind: "part", group: null })}>
                {t("Luyện Part", "Part practice")} · {counts.part}
              </Chip>
            )}
            {filter.group && (
              <Chip active onClick={() => setFilter({ kind: filter.kind, group: null })}>
                {shortGroup(groupLabel ?? filter.group)} ✕
              </Chip>
            )}
          </div>
        )}
      </div>

      {attemptsError && (
        <p className="text-xs px-5 py-2 m-0" style={{ color: "var(--accent-red, #b91c1c)", borderBottom: "1px solid var(--border)" }}>
          {t("Không tải được lịch sử luyện đề. Tải lại trang để thử lại.", "Couldn't load your practice history. Reload the page to try again.")}
        </p>
      )}

      {total === 0 ? (
        <div className="text-center py-10 px-5">
          <p className="text-sm font-semibold m-0" style={{ color: "var(--text-primary)" }}>
            {t("Chưa có kết quả nào", "No results yet")}
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
            {t("Nhập điểm kỳ thi thật bạn đã thi, hoặc làm một bài thi thử trong app.", "Add a real test score, or take a mock test in the app.")}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={onAddScore}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: "var(--orange)", border: "none", cursor: "pointer" }}>
              + {t("Thêm điểm thi thật", "Add a real score")}
            </button>
            <Link href="/skills/full-tests"
              className="px-4 py-2 rounded-lg text-sm font-semibold no-underline"
              style={{ border: "1px solid var(--border-focus)", color: "var(--orange)" }}>
              {t("Làm bài thi thử", "Take a mock test")} →
            </Link>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-center py-8 m-0" style={{ color: "var(--text-muted)" }}>
          {t("Không có kết quả nào khớp bộ lọc này.", "Nothing matches this filter.")}
        </p>
      ) : (
        <>
          <ul className="list-none p-0 m-0">
            {shown.map((e) => (
              <li key={e.key} style={{ borderBottom: "1px solid var(--border)" }}>
                {e.type === "real"
                  ? renderReal(e.score, e.idx, e.key === newestKey)
                  : e.type === "mock"
                    ? <MockRow a={e.a} highlight={e.key === newestKey} />
                    : <PartDayRow day={e.day} items={e.items} highlight={e.key === newestKey} />}
              </li>
            ))}
          </ul>
          {entries.length > limit && (
            <div className="px-5 py-3 text-center">
              <button type="button" onClick={() => setLimit((n) => n + PAGE)}
                className="text-xs font-semibold bg-transparent border-0 p-0 cursor-pointer"
                style={{ color: "var(--accent-primary)" }}>
                {t(`Xem thêm (còn ${entries.length - limit})`, `Show more (${entries.length - limit} left)`)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
