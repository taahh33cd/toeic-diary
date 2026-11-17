"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeProsody, splitDisplayWords } from "@/lib/shadow/prosody";
import { pickStarred, STAR_COUNT } from "@/lib/shadow/stars";
import { IntonationText } from "@/components/practice/shadow/IntonationText";

export interface AdminSentence {
  id: string;
  content: string;
  optionLabel: string | null;
  speaker: string | null;
  stressOverride: number[] | null;
  isStarred: boolean | null;
}

export interface AdminLesson {
  id: string;
  title: string;
  correctOption: string | null;
  sentences: AdminSentence[];
}

type Change = { stressOverride?: number[] | null; isStarred?: boolean | null };

const STAR_STATES: { v: boolean | null; label: string; title: string }[] = [
  { v: null, label: "Tự", title: "Tự chọn theo luật (câu HV sai nhiều → câu chứa đáp án → câu dài)" },
  { v: true, label: "⭐", title: "Luôn là câu ⭐" },
  { v: false, label: "✕", title: "Không bao giờ là câu ⭐" },
];

const muted = { color: "var(--text-muted)" };

export function ShadowAdmin({
  testSets, test, part, lessons, overriddenTotal,
}: {
  testSets: { name: string; slug: string }[];
  test: string;
  part: number;
  lessons: AdminLesson[];
  overriddenTotal: number;
}) {
  const router = useRouter();
  const [changes, setChanges] = useState<Record<string, Change>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = Object.keys(changes).length;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const eff = (s: AdminSentence): AdminSentence => ({ ...s, ...changes[s.id] });

  const patch = (ids: string[], c: Change) => {
    setChanges((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        const base = lessons.flatMap((l) => l.sentences).find((s) => s.id === id);
        if (!base) continue;
        const merged = { ...next[id], ...c };
        // Bỏ trường trùng giá trị gốc để đếm đúng số thay đổi thật.
        if ("isStarred" in merged && merged.isStarred === base.isStarred) delete merged.isStarred;
        if ("stressOverride" in merged && same(merged.stressOverride ?? null, base.stressOverride)) delete merged.stressOverride;
        if (Object.keys(merged).length) next[id] = merged; else delete next[id];
      }
      return next;
    });
    setMsg(null);
  };

  const go = (q: { test?: string; part?: number }) => {
    if (dirty && !confirm(`Còn ${dirty} thay đổi chưa lưu. Bỏ và chuyển trang?`)) return;
    const t = q.test ?? test;
    const p = q.part ?? part;
    router.push(`/admin/shadow?test=${encodeURIComponent(t)}&part=${p}`);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/shadow", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: Object.entries(changes).map(([id, c]) => ({ id, ...c })) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Lỗi ${res.status}`);
      setChanges({});
      setSelected(new Set());
      setMsg({ ok: true, text: `Đã lưu ${body.updated} câu.` });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Lưu thất bại" });
    } finally {
      setSaving(false);
    }
  };

  const sel = [...selected];
  const allIds = lessons.flatMap((l) => l.sentences.map((s) => s.id));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold m-0">Shadow · từ nhấn &amp; câu ⭐</h1>
        <p className="text-sm m-0" style={muted}>
          Bấm vào một từ để đặt/bỏ đỉnh nhấn — đường ngữ điệu cập nhật ngay. Câu ⭐: Tự / Luôn ⭐ / Không ⭐.
          Đã ghi đè {overriddenTotal} câu trên toàn bộ đề.
        </p>
      </header>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={test}
          onChange={(e) => go({ test: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          aria-label="Bộ đề"
        >
          {testSets.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </select>
        <div className="flex rounded-lg border p-1 gap-1" style={{ borderColor: "var(--border)" }} role="group" aria-label="Part">
          {[1, 2, 3, 4].map((p) => (
            <button key={p} onClick={() => go({ part: p })}
              className="px-3 py-1 rounded-md text-sm font-semibold"
              style={p === part ? { background: "var(--accent-primary)", color: "#fff" } : { color: "var(--text-secondary)" }}>
              Part {p}
            </button>
          ))}
        </div>
        <button onClick={() => setSelected(selected.size === allIds.length ? new Set() : new Set(allIds))}
          className="ml-auto text-sm underline" style={{ color: "var(--text-secondary)" }}>
          {selected.size === allIds.length && allIds.length ? "Bỏ chọn tất cả" : "Chọn tất cả câu"}
        </button>
      </div>

      {/* Thanh hành động — dính trên cùng khi có câu được chọn hoặc có thay đổi */}
      {(sel.length > 0 || dirty > 0 || msg) && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {sel.length > 0 && (
            <>
              <span className="text-sm font-semibold">{sel.length} câu đã chọn:</span>
              <button className="adm-chip" onClick={() => patch(sel, { isStarred: true })}>⭐ Luôn chọn</button>
              <button className="adm-chip" onClick={() => patch(sel, { isStarred: false })}>✕ Không chọn</button>
              <button className="adm-chip" onClick={() => patch(sel, { isStarred: null })}>Tự chọn ⭐</button>
              <button className="adm-chip" onClick={() => patch(sel, { stressOverride: null })}>↺ Nhấn tự động</button>
            </>
          )}
          <span className="ml-auto flex items-center gap-2">
            {msg && <span className="text-sm" style={{ color: msg.ok ? "#15803d" : "#b91c1c" }}>{msg.text}</span>}
            {dirty > 0 && (
              <>
                <button className="adm-chip" onClick={() => { setChanges({}); setMsg(null); }} disabled={saving}>Huỷ</button>
                <button onClick={save} disabled={saving}
                  className="rounded-lg px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "var(--accent-primary)" }}>
                  {saving ? "Đang lưu…" : `Lưu ${dirty} thay đổi`}
                </button>
              </>
            )}
          </span>
        </div>
      )}

      {lessons.length === 0 && (
        <p className="text-sm" style={muted}>Bộ đề này chưa có bài Part {part}.</p>
      )}

      {lessons.map((l) => (
        <LessonCard key={l.id} lesson={l} part={part} eff={eff} changes={changes} patch={patch}
          selected={selected}
          toggle={(id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })} />
      ))}

      <style>{`.adm-chip{border:1px solid var(--border);border-radius:8px;padding:4px 10px;font-size:13px;font-weight:600;color:var(--text-secondary);background:var(--bg-primary)}
.adm-chip:hover{color:var(--text-primary)}`}</style>
    </div>
  );
}

function LessonCard({
  lesson, part, eff, changes, patch, selected, toggle,
}: {
  lesson: AdminLesson;
  part: number;
  eff: (s: AdminSentence) => AdminSentence;
  changes: Record<string, Change>;
  patch: (ids: string[], c: Change) => void;
  selected: Set<string>;
  toggle: (id: string) => void;
}) {
  const sentences = lesson.sentences.map(eff);
  // Câu ⭐ khi HV chép đúng hết — có lỗi thì luật đổi theo lỗi, riêng câu ⭐ ghi đè luôn giữ.
  const stars = new Set(pickStarred(sentences, { correctOption: lesson.correctOption }));

  return (
    <section className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="text-base font-bold m-0">{lesson.title}</h2>
        <span className="text-xs" style={muted}>
          ⭐ mặc định: {stars.size}/{STAR_COUNT}{lesson.correctOption ? ` · đáp án ${lesson.correctOption}` : ""}
        </span>
      </div>
      {sentences.map((s, i) => (
        <SentenceRow key={s.id} s={s} index={i} part={part} starred={stars.has(s.id)}
          changed={!!changes[s.id]} checked={selected.has(s.id)} toggle={() => toggle(s.id)} patch={patch} />
      ))}
    </section>
  );
}

function SentenceRow({
  s, index, part, starred, changed, checked, toggle, patch,
}: {
  s: AdminSentence;
  index: number;
  part: number;
  starred: boolean;
  changed: boolean;
  checked: boolean;
  toggle: () => void;
  patch: (ids: string[], c: Change) => void;
}) {
  const words = useMemo(() => splitDisplayWords(s.content), [s.content]);
  const prosody = useMemo(() => analyzeProsody(s.content, s.stressOverride), [s.content, s.stressOverride]);
  const auto = useMemo(() => analyzeProsody(s.content), [s.content]);

  const toggleWord = (k: number) => {
    const current = prosody.words.map((w, j) => (w.stress === "nucleus" ? j : -1)).filter((j) => j >= 0);
    const next = current.includes(k) ? current.filter((j) => j !== k) : [...current, k].sort((a, b) => a - b);
    const autoNuclei = auto.words.map((w, j) => (w.stress === "nucleus" ? j : -1)).filter((j) => j >= 0);
    // Trùng luật tự động (hoặc bỏ hết đỉnh) thì lưu null cho gọn.
    patch([s.id], { stressOverride: next.length === 0 || same(next, autoNuclei) ? null : next });
  };

  const tag = part === 2 ? (index === 0 ? "Câu hỏi" : s.optionLabel ? `(${s.optionLabel})` : null)
    : part === 1 ? (s.optionLabel ? `(${s.optionLabel})` : null)
    : s.speaker && s.speaker.toUpperCase() !== "NARRATOR" ? s.speaker : null;

  return (
    <div className="rounded-lg border p-3 flex flex-col gap-2"
      style={{ borderColor: changed ? "var(--accent-primary)" : "var(--border)", background: "var(--bg-primary)" }}>
      <div className="flex items-center gap-2 flex-wrap">
        <input type="checkbox" checked={checked} onChange={toggle} aria-label={`Chọn câu ${index + 1}`} />
        <span className="text-xs font-bold tabular-nums" style={muted}>{index + 1}</span>
        {tag && <span className="text-xs font-semibold px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{tag}</span>}
        {starred && <span className="text-xs font-semibold" style={{ color: "#b45309" }}>⭐ đang được chọn</span>}
        {s.stressOverride && <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>nhấn sửa tay</span>}
        <span className="ml-auto flex items-center gap-1">
          <div className="flex rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }} role="group" aria-label="Câu ⭐">
            {STAR_STATES.map((st) => (
              <button key={String(st.v)} title={st.title} onClick={() => patch([s.id], { isStarred: st.v })}
                className="px-2 py-0.5 text-xs font-semibold"
                style={s.isStarred === st.v ? { background: "var(--accent-primary)", color: "#fff" } : { color: "var(--text-secondary)" }}>
                {st.label}
              </button>
            ))}
          </div>
          {s.stressOverride && (
            <button className="text-xs underline ml-2" style={{ color: "var(--text-secondary)" }}
              onClick={() => patch([s.id], { stressOverride: null })} title="Trả về luật nhấn tự động">↺ Tự động</button>
          )}
        </span>
      </div>

      <div className="mt-5">
        <IntonationText prosody={prosody} activeIndex={-1} showCurve size="md" />
      </div>

      <div className="flex flex-wrap gap-1" aria-label="Bấm để đặt/bỏ đỉnh nhấn">
        {words.map((w, k) => {
          const nucleus = prosody.words[k]?.stress === "nucleus";
          return (
            <button key={k} onClick={() => toggleWord(k)} aria-pressed={nucleus}
              className="px-1.5 py-0.5 rounded text-xs border"
              style={nucleus
                ? { borderColor: "#dc2626", color: "#dc2626", fontWeight: 700, background: "rgba(220,38,38,0.08)" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              {w}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function same(a: number[] | null, b: number[] | null): boolean {
  if (!a || !b) return a === b;
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
