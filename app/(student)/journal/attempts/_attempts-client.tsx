"use client";

/**
 * Trang Kết quả luyện đề — phần tương tác.
 *
 * Bộ lọc điều khiển CẢ biểu đồ lẫn danh sách. Nhờ vậy biểu đồ luôn chỉ có một
 * chuỗi dữ liệu: không cần chú giải, không cần bảng màu phân loại, không bao
 * giờ sa vào hai trục. Muốn so Part 1 với Part 2 thì đổi bộ lọc, không phải
 * đọc hai đường chồng nhau.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/journal/paper/Sheet";

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
  total: number | null;
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

type SortKey = "recent" | "best";
const ALL = "__all__";

function pct(correct: number | null, gradable: number | null): number | null {
  if (correct === null || !gradable) return null;
  return Math.round((correct / gradable) * 100);
}

/** Màu theo tỷ lệ đúng: đỏ dưới 50%, vàng 50-79%, xanh từ 80%. */
function toneOf(p: number | null): string {
  if (p === null) return "var(--text-muted)";
  if (p >= 80) return "var(--accent-green, #15803d)";
  if (p >= 50) return "#a16207";
  return "var(--accent-red, #b91c1c)";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/** "PRACTICE TEST EST 2026" → "EST 2026" — nhãn trong thanh ngang rất hẹp. */
function shortGroup(label: string): string {
  return label.replace(/^PRACTICE TEST\s+/i, "");
}

// ── Biểu đồ xu hướng ────────────────────────────────────────────────────────

interface Point { x: number; y: number; p: number; iso: string; title: string; mode: string }

/**
 * Một chuỗi: tỷ lệ đúng theo thời gian của đúng tập đang lọc.
 * Theo mẫu biểu đồ sẵn có ở /journal/scores — SVG nội tuyến, màu lấy từ biến
 * CSS nên tự đổi theo 18 theme.
 */
function TrendChart({ attempts }: { attempts: ClientAttempt[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const pts = useMemo<Point[]>(() => {
    const rows = attempts
      .filter((a) => pct(a.correct, a.gradable) !== null)
      .sort((a, b) => a.atISO.localeCompare(b.atISO));
    if (rows.length < 2) return [];
    const W = 560, H = 148, PL = 8, PR = 8, PT = 14, PB = 26;
    const cW = W - PL - PR, cH = H - PT - PB;
    return rows.map((a, i) => {
      const p = pct(a.correct, a.gradable)!;
      return {
        x: PL + (i / (rows.length - 1)) * cW,
        y: PT + (1 - p / 100) * cH,
        p,
        iso: a.atISO,
        title: `${a.groupLabel} · ${a.testTitle}`,
        mode: a.modeLabel,
      };
    });
  }, [attempts]);

  if (pts.length < 2) {
    return (
      <p className="text-xs m-0 py-6 text-center" style={{ color: "var(--text-muted)" }}>
        Cần ít nhất 2 lượt đã nộp để vẽ xu hướng.
      </p>
    );
  }

  const W = 560, H = 148, PL = 8, PR = 8, PT = 14, PB = 26;
  const cW = W - PL - PR, cH = H - PT - PB;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + cH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + cH).toFixed(1)} Z`;
  const hp = hover === null ? null : pts[hover];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible", display: "block" }}
           role="img" aria-label="Xu hướng tỷ lệ đúng theo thời gian">
        <defs>
          <linearGradient id="attemptGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--accent-primary)", stopOpacity: 0.26 }} />
            <stop offset="100%" style={{ stopColor: "var(--accent-primary)", stopOpacity: 0.02 }} />
          </linearGradient>
        </defs>

        {/* lưới mờ ở 50% và 80% — hai mốc màu của điểm số */}
        {[50, 80].map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={PT + (1 - v / 100) * cH} y2={PT + (1 - v / 100) * cH}
                  style={{ stroke: "var(--border)" }} strokeWidth="1" strokeDasharray="3 4" />
            <text x={W - PR} y={PT + (1 - v / 100) * cH - 3} textAnchor="end" fontSize={9}
                  style={{ fill: "var(--text-muted)" }}>{v}%</text>
          </g>
        ))}

        <path d={area} fill="url(#attemptGrad)" />
        <path d={line} fill="none" style={{ stroke: "var(--accent-primary)" }}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hp && (
          <line x1={hp.x} x2={hp.x} y1={PT} y2={PT + cH}
                style={{ stroke: "var(--accent-primary)", opacity: 0.4 }} strokeWidth="1" />
        )}

        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 5.5 : 4}
                  style={{ fill: toneOf(p.p), stroke: "var(--bg-elevated)" }} strokeWidth="2" />
        ))}

        {/* vùng bắt chuột rộng hơn điểm, chia đều theo cột */}
        {pts.map((p, i) => (
          <rect key={`h${i}`} x={p.x - cW / (pts.length - 1) / 2} y={PT}
                width={cW / (pts.length - 1)} height={cH} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}

        {/* chỉ ghi nhãn đầu và cuối — không ghi số lên mọi điểm */}
        <text x={pts[0].x} y={H - 6} textAnchor="start" fontSize={10} style={{ fill: "var(--text-muted)" }}>
          {fmtDate(pts[0].iso)}
        </text>
        <text x={pts[pts.length - 1].x} y={H - 6} textAnchor="end" fontSize={10} style={{ fill: "var(--text-muted)" }}>
          {fmtDate(pts[pts.length - 1].iso)}
        </text>
      </svg>

      {hp && (
        <div className="absolute pointer-events-none text-xs rounded px-2 py-1 shadow-sm"
             style={{
               left: `${(hp.x / W) * 100}%`, top: 0, transform: "translate(-50%, -110%)",
               background: "var(--bg-elevated)", border: "1px solid var(--border)",
               color: "var(--text-primary)", whiteSpace: "nowrap",
             }}>
          <span className="font-bold tabular-nums" style={{ color: toneOf(hp.p) }}>{hp.p}%</span>
          <span style={{ color: "var(--text-muted)" }}> · {hp.mode} · {fmtDate(hp.iso)}</span>
          <div style={{ color: "var(--text-muted)" }}>{hp.title}</div>
        </div>
      )}
    </div>
  );
}

// ── Mảnh giao diện nhỏ ──────────────────────────────────────────────────────

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs px-2.5 py-1 rounded-full transition-colors"
      style={{
        border: `1px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
        background: active ? "color-mix(in srgb, var(--accent-primary) 14%, transparent)" : "transparent",
        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
        fontWeight: active ? 700 : 500,
      }}
    >
      {children}
    </button>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const real = mode === "Thi thử";
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap"
      style={{
        border: `1px solid ${real ? "color-mix(in srgb, var(--accent-red, #b91c1c) 40%, transparent)" : "var(--border)"}`,
        color: real ? "var(--accent-red, #b91c1c)" : "var(--text-muted)",
      }}
    >
      {mode}
    </span>
  );
}

function ScoreCell({ a }: { a: ClientAttempt }) {
  const p = pct(a.correct, a.gradable);
  return (
    <span className="tabular-nums font-bold text-sm whitespace-nowrap" style={{ color: toneOf(p) }}>
      {a.correct ?? "–"}
      <span className="font-normal" style={{ color: "var(--text-muted)" }}>/{a.gradable ?? "–"}</span>
      {p !== null && <span className="ml-1.5 text-xs font-semibold">{p}%</span>}
    </span>
  );
}

/** Chênh lệch so với lượt liền trước của CÙNG đề và CÙNG chế độ. */
function Delta({ d }: { d: number | null }) {
  if (d === null || d === 0) return null;
  const up = d > 0;
  return (
    <span className="text-[11px] font-bold tabular-nums whitespace-nowrap"
          style={{ color: up ? "var(--accent-green, #15803d)" : "var(--text-muted)" }}
          title="So với lượt trước cùng đề, cùng chế độ">
      {up ? "▲" : "▼"}{Math.abs(d)}
    </span>
  );
}

// ── Nên luyện gì tiếp ───────────────────────────────────────────────────────

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
 * việc cụ thể. Cố tình nằm TRƯỚC bộ lọc và không chịu lọc — câu hỏi này phải
 * nhìn toàn cảnh, lọc còn một dạng thì chẳng còn gì để so.
 *
 * Thanh ngang, một chuỗi, sắp theo tỷ lệ tăng dần: dạng yếu nhất nằm trên.
 */
function NextUp({ rows, tips, onPick }: { rows: GroupStat[]; tips: Tip[]; onPick: (key: string) => void }) {
  return (
    <Sheet className="mb-5 p-4">
      <h2 className="text-sm font-bold m-0" style={{ color: "var(--text-secondary)" }}>
        Nên luyện gì tiếp
      </h2>
      <p className="text-xs m-0 mt-0.5 mb-3" style={{ color: "var(--text-muted)" }}>
        Tính trên tất cả lượt đã nộp, không theo bộ lọc bên dưới. Lượt nộp khi chưa
        làm được nửa đề không tính vào tỷ lệ.
      </p>

      {rows.length > 0 && (
        <ul className="list-none p-0 m-0 grid gap-1.5 mb-3">
          {rows.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => onPick(r.key)}
                title={r.p === null
                  ? `${r.label} — chưa có lượt nào làm đủ nửa đề. Bấm để chỉ xem dạng này.`
                  : `Chỉ xem ${r.label}`}
                className="w-full flex items-center gap-2 text-left bg-transparent border-0 p-0 cursor-pointer"
              >
                <span className="text-xs truncate" style={{ width: 132, flexShrink: 0, color: "var(--text-secondary)" }}>
                  {shortGroup(r.label)}
                </span>
                {/* Thanh rỗng trông như lỗi — chưa đo được thì nói thẳng ra. */}
                {r.p === null ? (
                  <span className="flex-1 text-xs italic" style={{ color: "var(--text-muted)" }}>
                    chưa có lượt nào làm đủ nửa đề
                  </span>
                ) : (
                  <span className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "var(--border)" }}>
                    <span className="block h-full rounded-full"
                          style={{ width: `${r.p}%`, background: toneOf(r.p) }} />
                  </span>
                )}
                {r.p !== null && (
                  <span className="text-xs font-bold tabular-nums text-right" style={{ width: 34, color: toneOf(r.p) }}>
                    {r.p}%
                  </span>
                )}
                <span className="text-xs tabular-nums text-right hidden sm:block"
                      style={{ width: 62, color: "var(--text-muted)" }}>
                  {r.totalTests > 0 ? `${r.doneTests}/${r.totalTests} đề` : `${r.doneTests} đề`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {tips.length > 0 && (
        <ul className="list-none p-0 m-0 grid gap-1.5" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          {tips.map((t) => (
            <li key={t.key} className="flex items-baseline gap-2 text-sm flex-wrap">
              <span style={{ color: "var(--text-primary)" }}>{t.text}</span>
              <Link href={t.href} className="text-xs font-bold no-underline whitespace-nowrap"
                    style={{ color: "var(--accent-primary)" }}>
                {t.cta} →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

/** Một đề trong danh sách lịch sử, đã gom sẵn các lượt. */
interface TestRow {
  testTitle: string;
  testHref: string;
  attempts: ClientAttempt[];
  deltas: Map<string, number | null>;
  bestByMode: [string, { correct: number; gradable: number | null }][];
  latestISO: string;
}

/** Số lượt hiện sẵn; đề làm nhiều lần thì phần còn lại nằm sau một nút. */
const MAX_ROWS = 4;

function TestCard({ t }: { t: TestRow }) {
  const [all, setAll] = useState(false);
  const shown = all ? t.attempts : t.attempts.slice(0, MAX_ROWS);

  return (
    <Sheet className="p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Link href={t.testHref}
              className="flex-1 min-w-0 text-sm font-bold no-underline truncate"
              style={{ color: "var(--text-primary)" }}>
          {t.testTitle}
        </Link>
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
          {t.attempts.length} lượt
        </span>
      </div>

      {/* Kết quả tốt nhất tách theo chế độ — hai chế độ không so với nhau được */}
      {t.bestByMode.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs"
             style={{ color: "var(--text-muted)" }}>
          {t.bestByMode.map(([m, b]) => (
            <span key={m} className="whitespace-nowrap">
              cao nhất {m.toLowerCase()}{" "}
              <b className="tabular-nums" style={{ color: toneOf(pct(b.correct, b.gradable)) }}>
                {b.correct}/{b.gradable ?? "–"}
              </b>
            </span>
          ))}
        </div>
      )}

      <ul className="list-none p-0 m-0" style={{ borderTop: "1px solid var(--border)" }}>
        {shown.map((a) => (
          <li key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
            <Link
              href={`/journal/attempts/${a.id}`}
              className="flex items-center gap-2 px-1 py-2 no-underline transition-colors hover:brightness-95"
              style={{ color: "var(--text-primary)" }}
            >
              <ScoreCell a={a} />
              <Delta d={t.deltas.get(a.id) ?? null} />
              <ModeBadge mode={a.modeLabel} />
              {a.total !== null && (
                <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {a.total} điểm
                </span>
              )}
              <span className="flex-1" />
              <span className="text-xs tabular-nums whitespace-nowrap"
                    style={{ color: "var(--text-muted)" }}>
                {fmtDate(a.atISO)}
              </span>
              <span aria-hidden className="text-xs font-bold"
                    style={{ color: "var(--accent-primary)" }}>→</span>
            </Link>
          </li>
        ))}
      </ul>

      {t.attempts.length > MAX_ROWS && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-1.5 text-xs font-semibold bg-transparent border-0 p-0 cursor-pointer"
          style={{ color: "var(--accent-primary)" }}
        >
          {all ? "Thu gọn" : `Xem thêm ${t.attempts.length - MAX_ROWS} lượt`}
        </button>
      )}
    </Sheet>
  );
}

// ── Trang ───────────────────────────────────────────────────────────────────

export function AttemptsClient({ items, groupMeta }: { items: ClientAttempt[]; groupMeta: GroupMeta[] }) {
  const [group, setGroup] = useState<string>(ALL);
  const [mode, setMode] = useState<string>(ALL);
  const [sort, setSort] = useState<SortKey>("recent");

  const done = useMemo(() => items.filter((i) => i.status === "done"), [items]);
  const unfinished = useMemo(
    () => items.filter((i) => i.status === "in_progress" && i.answered > 0),
    [items]
  );

  /** Các dạng bài có mặt, giữ thứ tự xuất hiện. */
  const groupOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of done) if (!seen.has(a.groupKey)) seen.set(a.groupKey, a.groupLabel);
    return [...seen.entries()];
  }, [done]);

  const filtered = useMemo(
    () => done.filter((a) => (group === ALL || a.groupKey === group) && (mode === ALL || a.modeLabel === mode)),
    [done, group, mode]
  );

  // ── ba con số ──
  const stats = useMemo(() => {
    const ps = filtered.map((a) => pct(a.correct, a.gradable)).filter((p): p is number => p !== null);
    const best = ps.length ? Math.max(...ps) : null;
    const bestAttempt = best === null ? null
      : filtered.find((a) => pct(a.correct, a.gradable) === best) ?? null;
    const tests = new Set(filtered.map((a) => a.groupKey + "|" + a.testTitle)).size;
    return { best, bestAttempt, tests, count: filtered.length };
  }, [filtered]);

  /**
   * Lượt đủ tư cách đo năng lực. Có những lượt nộp khi mới trả lời vài câu —
   * dữ liệu thật có cả lượt 0/199 — mà một lượt như vậy không nói gì về trình
   * độ, chỉ kéo cả dạng bài về 0% và biến gợi ý thành câu làm nản.
   */
  const attempted = useMemo(
    () => done.filter((a) => a.correct !== null && !!a.gradable && a.answered >= a.gradable * 0.5),
    [done]
  );

  /**
   * Sức mạnh từng dạng bài.
   * Tỷ lệ = tổng câu đúng / tổng câu chấm được, không phải trung bình các phần
   * trăm: một lượt Part 1 (6 câu) không được nặng bằng một lượt Part 2 (25 câu).
   * Số đề đã làm thì đếm trên mọi lượt đã nộp — đề mở ra rồi vẫn là đã mở.
   */
  const groupStats = useMemo<GroupStat[]>(() => {
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
    const scored = groupStats.filter((g): g is GroupStat & { p: number } => g.p !== null);

    // Dạng yếu nhất — chỉ có nghĩa khi có từ hai dạng để so và chúng khác nhau.
    if (scored.length >= 2 && scored[0].p < scored[scored.length - 1].p) {
      const w = scored[0];
      out.push({
        key: "weak",
        text: `${shortGroup(w.label)} đang thấp nhất, ${w.p}%.`,
        href: w.href,
        cta: "Luyện dạng này",
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
    const redo = [...bestPerTest.values()].filter((t) => t.p < 80).sort((a, b) => a.p - b.p)[0];
    if (redo) {
      out.push({
        key: "redo",
        text: `${shortGroup(redo.label)} · ${redo.title} cao nhất mới ${redo.p}%.`,
        href: redo.href,
        cta: "Làm lại",
      });
    }

    // Còn đề chưa làm — groupStats đã xếp yếu trước nên ưu tiên đúng dạng cần.
    const fresh = groupStats.find((g) => g.totalTests > g.doneTests);
    if (fresh) {
      out.push({
        key: "new",
        text: `Còn ${fresh.totalTests - fresh.doneTests} đề chưa làm ở ${shortGroup(fresh.label)}.`,
        href: fresh.href,
        cta: "Chọn đề",
      });
    }

    return out;
  }, [groupStats, attempted]);

  /**
   * Gom đề → lượt. Chênh lệch tính trong cùng đề VÀ cùng chế độ: điểm Thi thử
   * và Luyện tập không so với nhau được.
   */
  const groups = useMemo(() => {
    const byGroup = new Map<string, { key: string; label: string; tests: Map<string, ClientAttempt[]> }>();
    for (const a of filtered) {
      let g = byGroup.get(a.groupKey);
      if (!g) { g = { key: a.groupKey, label: a.groupLabel, tests: new Map() }; byGroup.set(a.groupKey, g); }
      const list = g.tests.get(a.testTitle) ?? [];
      list.push(a);
      g.tests.set(a.testTitle, list);
    }

    return [...byGroup.values()].map((g) => ({
      key: g.key,
      label: g.label,
      attemptCount: [...g.tests.values()].reduce((s, l) => s + l.length, 0),
      tests: [...g.tests.entries()].map(([testTitle, list]) => {
        const byTime = [...list].sort((a, b) => a.atISO.localeCompare(b.atISO));
        const deltas = new Map<string, number | null>();
        const prevByMode = new Map<string, number>();
        for (const a of byTime) {
          const c = a.correct;
          if (c === null) { deltas.set(a.id, null); continue; }
          const prev = prevByMode.get(a.modeLabel);
          deltas.set(a.id, prev === undefined ? null : c - prev);
          prevByMode.set(a.modeLabel, c);
        }
        // kết quả tốt nhất tách theo chế độ
        const bestByMode = new Map<string, { correct: number; gradable: number | null }>();
        for (const a of list) {
          if (a.correct === null) continue;
          const cur = bestByMode.get(a.modeLabel);
          if (!cur || a.correct > cur.correct) bestByMode.set(a.modeLabel, { correct: a.correct, gradable: a.gradable });
        }
        const sorted = sort === "best"
          ? [...list].sort((a, b) => (b.correct ?? -1) - (a.correct ?? -1))
          : [...list].sort((a, b) => b.atISO.localeCompare(a.atISO));
        return {
          testTitle,
          testHref: list[0].testHref,
          attempts: sorted,
          deltas,
          bestByMode: [...bestByMode.entries()],
          latestISO: byTime[byTime.length - 1].atISO,
        };
      }).sort((a, b) =>
        sort === "best"
          ? (b.attempts[0]?.correct ?? -1) - (a.attempts[0]?.correct ?? -1)
          : b.latestISO.localeCompare(a.latestISO)
      ),
    }));
  }, [filtered, sort]);

  if (done.length === 0 && unfinished.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>Chưa có lượt làm bài nào được lưu.</p>
        <div className="flex gap-4 justify-center mt-2 text-sm font-semibold">
          <Link href="/skills/listening" style={{ color: "var(--accent-primary)" }}>Luyện Listening →</Link>
          <Link href="/skills/full-tests" style={{ color: "var(--accent-primary)" }}>Thi thử trọn đề →</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Đang làm dở — việc dang dở đứng trước mọi thứ khác */}
      {unfinished.length > 0 && (
        <Sheet className="mb-5 p-4">
          <h2 className="text-sm font-bold m-0 mb-2" style={{ color: "var(--text-secondary)" }}>
            Đang làm dở
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              {unfinished.length} bài
            </span>
          </h2>
          <ul className="list-none p-0 m-0 grid gap-2 sm:grid-cols-2">
            {unfinished.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.testHref}
                  className="flex items-center gap-3 px-3 py-2.5 no-underline rounded-lg transition-colors"
                  style={{ color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">{a.groupLabel} · {a.testTitle}</span>
                    <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Đã trả lời {a.answered} câu · lưu lúc {fmtDateTime(a.atISO)}
                    </span>
                  </span>
                  <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--accent-primary)" }}>
                    Làm tiếp →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      {done.length > 0 && (
        <>
          {(groupStats.length >= 2 || tips.length > 0) && (
            <NextUp rows={groupStats} tips={tips} onPick={(k) => setGroup(k)} />
          )}

          {/* Bộ lọc — một hàng, điều khiển cả biểu đồ lẫn danh sách */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip active={group === ALL} onClick={() => setGroup(ALL)}>Tất cả</Chip>
              {groupOptions.map(([k, label]) => (
                <Chip key={k} active={group === k} onClick={() => setGroup(k)}>{label}</Chip>
              ))}
            </div>
            <span className="hidden sm:block" style={{ width: 1, height: 18, background: "var(--border)" }} />
            <div className="flex items-center gap-1.5">
              <Chip active={mode === ALL} onClick={() => setMode(ALL)}>Cả hai</Chip>
              <Chip active={mode === "Thi thử"} onClick={() => setMode("Thi thử")}>Thi thử</Chip>
              <Chip active={mode === "Luyện tập"} onClick={() => setMode("Luyện tập")}>Luyện tập</Chip>
            </div>
            <span className="flex-1" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sắp xếp</span>
              <Chip active={sort === "recent"} onClick={() => setSort("recent")}>Mới nhất</Chip>
              <Chip active={sort === "best"} onClick={() => setSort("best")}>Điểm cao</Chip>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Sheet className="p-8 text-center">
              <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>
                Không có lượt nào khớp bộ lọc này.
              </p>
            </Sheet>
          ) : (
            <>
              {/* Số liệu + xu hướng, chung một tờ */}
              <Sheet stack className="mb-6 p-4 md:p-5">
                {/* Dùng flex + lớp có sẵn thay vì grid-cols arbitrary: arbitrary
                    value kèm biến thể md: không được sinh ra ở dev, lưới sập 1 cột. */}
                <div className="flex flex-col md:flex-row gap-5 md:gap-7 md:items-center">
                  <div className="md:w-56 md:shrink-0">
                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Kết quả tốt nhất</div>
                    <div className="hand leading-none tabular-nums"
                         style={{ fontSize: "clamp(2.4rem,1.6rem+2.4vw,3.2rem)", color: toneOf(stats.best) }}>
                      {stats.best === null ? "–" : `${stats.best}%`}
                    </div>
                    {stats.bestAttempt && (
                      <div className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                        {stats.bestAttempt.testTitle} · {stats.bestAttempt.modeLabel}
                      </div>
                    )}
                    <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <div>
                        <div className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                          {stats.count}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>lượt đã nộp</div>
                      </div>
                      <div>
                        <div className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                          {stats.tests}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>đề đã làm</div>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 md:flex-1">
                    <TrendChart attempts={filtered} />
                  </div>
                </div>
              </Sheet>

              {/* Lịch sử: dạng bài → đề → từng lượt */}
              {groups.map((g) => (
                <section key={g.key} className="mb-6">
                  <h2 className="flex items-baseline gap-2 text-sm font-bold m-0 mb-2"
                      style={{ color: "var(--text-secondary)" }}>
                    {g.label}
                    <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                      {g.attemptCount} lượt
                    </span>
                  </h2>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {g.tests.map((t) => (
                      <TestCard key={t.testTitle} t={t} />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
