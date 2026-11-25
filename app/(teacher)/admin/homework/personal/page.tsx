"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import LibraryDrawer from "@/components/admin/homework/LibraryDrawer";
import type { NewDraft } from "@/components/admin/homework/draft";
import { useClasses } from "@/hooks/firebase/useClasses";
import type { Homework, HwItem } from "@/lib/firebase/types";
import type { HwContent } from "@/lib/homework/content";
import { fmtDayShort, sectionForLib, type HwCatKey } from "@/lib/homework/library";
import { loadLibrary } from "@/lib/homework/client";

type Sug = { catalogId: string; title: string; href: string; minutes: number; section: HwCatKey; why: string };
type Row = { code: string; name: string; score: number | null; reasons: string[]; suggestions: Sug[]; inactive: boolean };
/** Một bài đã chọn cho một HV (gợi ý hoặc tự chọn thêm). */
type Pick = { key: string; section: HwCatKey; item: HwItem; why?: string; on: boolean };

const sel = "text-sm px-3 py-2 rounded-lg border outline-none";
const selStyle = { background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" };

function asList(v: unknown): Homework[] {
  if (Array.isArray(v)) return v.filter(Boolean) as Homework[];
  if (v && typeof v === "object") return Object.values(v) as Homework[];
  return [];
}

export default function PersonalPage() {
  return (
    <Suspense fallback={<div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />}>
      <Personal />
    </Suspense>
  );
}

/**
 * Bài riêng từng HV: gợi ý dựa trên dữ liệu làm bài thật của từng người, giáo
 * viên tick chọn rồi giao một lần. Bài riêng gắn vào bản BTVN của lớp ở từng HV.
 */
function Personal() {
  const params = useSearchParams();
  const { classes, loading } = useClasses();
  const [classId, setClassId] = useState(params.get("classId") ?? "");
  const [hwId, setHwId] = useState(params.get("hwId") ?? "");
  const [budget, setBudget] = useState(30);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [picks, setPicks] = useState<Record<string, Pick[]>>({});
  const [busy, setBusy] = useState<"load" | "send" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [drawerFor, setDrawerFor] = useState<string | null>(null);

  const cls = classes.find((c) => c.id === classId);
  const hwList = useMemo(() => asList(cls?.homework).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15), [cls]);
  const hw = hwList.find((h) => h.id === hwId) ?? null;

  // Chọn lớp mà chưa chọn BTVN → lấy BTVN mới nhất của lớp.
  const effectiveHwId = hw ? hwId : hwList[0]?.id ?? "";

  async function load() {
    if (!classId || !effectiveHwId) return;
    setBusy("load");
    setErr(null);
    setDone(null);
    try {
      const r = await fetch("/api/admin/homework/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, hwId: effectiveHwId, budget }),
      });
      const d = (await r.json()) as { students?: Row[]; error?: string };
      if (!r.ok || !d.students) throw new Error(d.error ?? "Không lấy được gợi ý");
      setRows(d.students);
      setPicks(
        Object.fromEntries(
          d.students.map((s) => [
            s.code,
            s.suggestions.map((g) => ({
              key: `c:${g.catalogId}`,
              section: g.section,
              item: { text: g.title, link: g.href, catalogId: g.catalogId, minutes: g.minutes },
              why: g.why,
              on: true,
            })),
          ]),
        ),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setBusy(null);
    }
  }


  const chosen = Object.entries(picks)
    .map(([code, list]) => ({ code, list: list.filter((p) => p.on) }))
    .filter((x) => x.list.length > 0);

  async function send() {
    if (!chosen.length) return;
    if (!confirm(`Giao bài riêng cho ${chosen.length} HV vào “${hw?.title ?? fmtDayShort(hw?.date ?? "")}”?`)) return;
    setBusy("send");
    try {
      const r = await fetch("/api/admin/homework/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hwId: effectiveHwId,
          picks: chosen.map(({ code, list }) => {
            const content: HwContent = {};
            for (const p of list) (content[p.section] ??= []).push(p.item);
            return { code, content };
          }),
        }),
      });
      const d = (await r.json()) as { results?: { code: string; ok: boolean; added: number; error?: string }[]; error?: string };
      if (!r.ok || !d.results) throw new Error(d.error ?? "Giao thất bại");
      const ok = d.results.filter((x) => x.ok);
      const bad = d.results.filter((x) => !x.ok);
      setDone(
        `Đã giao ${ok.reduce((a, x) => a + x.added, 0)} bài riêng cho ${ok.length} HV.` +
          (bad.length ? ` Lỗi ở ${bad.map((b) => `${b.code} (${b.error})`).join(", ")}.` : ""),
      );
      setRows(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setBusy(null);
    }
  }

  const togglePick = (code: string, key: string) =>
    setPicks((p) => ({ ...p, [code]: (p[code] ?? []).map((x) => (x.key === key ? { ...x, on: !x.on } : x)) }));

  return (
    <div className="space-y-4">
      <p className="text-sm max-w-3xl" style={{ color: "var(--text-muted)" }}>
        Gợi ý dựa trên dữ liệu làm bài 30 ngày của từng HV (ngữ pháp theo chủ đề, kỹ năng con, điểm từng part, sổ lỗi sai).
        Chỉ chọn bài trong kho, bỏ bài đã giao hoặc HV đã làm đạt. Bài riêng được gắn vào BTVN của lớp ở từng HV và vẫn
        giữ khi bạn sửa / đồng bộ BTVN lớp.
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={classId} onChange={(e) => { setClassId(e.target.value); setHwId(""); setRows(null); }} className={sel} style={selStyle} disabled={loading}>
          <option value="">— Chọn lớp —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.members?.length ?? 0} HV)</option>
          ))}
        </select>
        <select value={effectiveHwId} onChange={(e) => { setHwId(e.target.value); setRows(null); }} className={sel} style={selStyle} disabled={!hwList.length}>
          {hwList.length === 0 && <option value="">Lớp chưa có BTVN</option>}
          {hwList.map((h) => (
            <option key={h.id} value={h.id}>Gắn vào: {h.title ?? "BTVN"} ({fmtDayShort(h.date)})</option>
          ))}
        </select>
        <select value={budget} onChange={(e) => { setBudget(Number(e.target.value)); setRows(null); }} className={sel} style={selStyle}>
          {[15, 30, 45, 60].map((m) => <option key={m} value={m}>Tối đa {m}′ thêm / HV</option>)}
        </select>
        <button
          onClick={() => void load()}
          disabled={!classId || !effectiveHwId || busy !== null}
          className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          {busy === "load" ? "Đang phân tích…" : "Lấy gợi ý"}
        </button>
      </div>

      {err && <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{err}</p>}
      {done && <p className="text-sm" style={{ color: "#4A7C59" }}>✓ {done}</p>}

      {rows && (
        <>
          <div className="space-y-2">
            {rows.map((r) => {
              const list = picks[r.code] ?? [];
              const mins = list.filter((p) => p.on).reduce((a, p) => a + (p.item.minutes ?? 0), 0);
              return (
                <div key={r.code} className="rounded-xl border p-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1.3fr)_70px]" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {r.code}{r.score ? ` · thi thử ${r.score}` : ""}
                    </p>
                  </div>
                  <div className="text-xs space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                    {r.inactive ? (
                      <p style={{ color: "#9A6A12" }}>Chưa làm bài nào 30 ngày qua — chưa đủ dữ liệu, ưu tiên nhắc làm phần chung.</p>
                    ) : r.reasons.length === 0 ? (
                      <p>Không thấy điểm yếu rõ — không cần thêm bài.</p>
                    ) : (
                      r.reasons.map((x) => <p key={x}>• {x}</p>)
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {list.length === 0 && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Không gợi ý thêm</p>}
                    {list.map((p) => (
                      <label key={p.key} className="flex gap-2 items-start text-xs cursor-pointer">
                        <input type="checkbox" checked={p.on} onChange={() => togglePick(r.code, p.key)} className="mt-0.5" style={{ accentColor: "var(--accent-primary)" }} />
                        <span style={{ color: "var(--text-primary)" }}>
                          {p.item.text}
                          <span style={{ color: "var(--text-muted)" }}>{p.item.minutes ? ` · ${p.item.minutes}′` : ""}{p.why ? ` — ${p.why}` : ""}</span>
                        </span>
                      </label>
                    ))}
                    <button
                      onClick={() => setDrawerFor(r.code)}
                      className="text-[11px] px-2 py-1 rounded-lg border border-dashed"
                      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      ＋ Chọn bài khác
                    </button>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold px-1.5 py-px rounded" style={mins ? { background: "rgba(176,122,26,.12)", color: "#9A6A12" } : { background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                      +{mins}′
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => void send()}
              disabled={chosen.length === 0 || busy !== null}
              className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              {busy === "send" ? "Đang giao…" : `Giao phần riêng cho ${chosen.length} HV`}
            </button>
          </div>
        </>
      )}

      {drawerFor && (
        <LibraryDrawer
          section="reading"
          used={new Map()}
          onClose={() => setDrawerFor(null)}
          onAdd={async (drafts: NewDraft[]) => {
            const code = drawerFor;
            setDrawerFor(null);
            const lib = new Map((await loadLibrary().catch(() => [])).map((i) => [i.id, i]));
            const secOf = (d: NewDraft): HwCatKey => {
              const it = d.catalogId ? lib.get(d.catalogId) : undefined;
              return it ? sectionForLib(it) : d.deckId ? "vocab" : "other";
            };
            setPicks((p) => ({
              ...p,
              [code]: [
                ...(p[code] ?? []),
                ...drafts.map((d) => ({
                  key: d.catalogId ? `c:${d.catalogId}` : d.deckId ? `d:${d.deckId}` : `l:${d.link}`,
                  section: secOf(d),
                  item: {
                    text: d.text,
                    ...(d.link ? { link: d.link } : {}),
                    ...(d.catalogId ? { catalogId: d.catalogId } : {}),
                    ...(d.deckId ? { deckId: d.deckId } : {}),
                    ...(d.minutes ? { minutes: d.minutes } : {}),
                  },
                  on: true,
                })),
              ],
            }));
          }}
        />
      )}
    </div>
  );
}
