"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { AnnotatedText, tint, type ViewMode } from "@/components/submissions/AnnotatedText";
import { DocumentSheet, type RailCard } from "@/components/submissions/DocumentSheet";
import { overlaps, selectionRange } from "@/lib/submissions/selection";
import {
  ANNOTATION_LABELS,
  countByLabel,
  estimateBand,
  labelMeta,
  scaleFor,
  type Annotation,
  type AnnotationLabel,
  type FeedbackItem,
  type SubmissionFeedback,
  type SubmissionItem,
} from "@/lib/submissions";

type Submission = {
  id: string;
  skill: string;
  unit: string;
  title: string;
  status: string;
  items: SubmissionItem[];
  feedback: SubmissionFeedback | null;
  submittedAt: string | null;
  profile: { displayName: string | null; studentCode: string | null } | null;
};

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`HTTP ${res.status} — ${text.slice(0, 300) || "(body rỗng)"}`);
  }
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-primary)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
};

const MODES: { id: ViewMode; label: string }[] = [
  { id: "compare", label: "Đối chiếu" },
  { id: "edited", label: "Bản đã sửa" },
  { id: "original", label: "Bài gốc" },
];

// ─── Ghi âm nhận xét ──────────────────────────────────────────────────────────

function AudioRecorder({ url, onChange }: { url?: string; onChange: (v: { url: string; publicId: string } | null) => void }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    try { if (mediaRef.current?.state === "recording") mediaRef.current.stop(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!blob.size) return;
        setUploading(true);
        try {
          const file = new File([blob], `feedback-${blob.size}.webm`, { type: "audio/webm" });
          onChange(await uploadToCloudinary(file));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload thất bại");
        } finally {
          setUploading(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setError("Không truy cập được micro");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={uploading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            border: "1px solid var(--border)",
            background: recording ? "rgba(239,68,68,0.12)" : "var(--bg-primary)",
            color: recording ? "rgb(220,38,38)" : "var(--text-primary)",
            cursor: uploading ? "default" : "pointer",
          }}
        >
          {uploading ? "Đang tải lên…" : recording ? "■ Dừng ghi âm" : "🎙️ Ghi âm nhận xét"}
        </button>
        {url && !recording && (
          <button type="button" onClick={() => onChange(null)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            Xoá
          </button>
        )}
      </div>
      {url && <audio controls src={url} className="w-full" />}
      {error && <p className="text-xs m-0" style={{ color: "rgb(220,38,38)" }}>{error}</p>}
    </div>
  );
}

// ─── Thẻ comment sửa được ─────────────────────────────────────────────────────

function EditableCard({
  a, active, onFocus, onChange, onRemove,
}: {
  a: Annotation;
  active: boolean;
  onFocus: () => void;
  onChange: (patch: Partial<Annotation>) => void;
  onRemove: () => void;
}) {
  const meta = labelMeta(a.label);
  return (
    <div
      onClick={onFocus}
      className="rounded-lg px-3 py-2.5"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${active ? meta.color : "var(--border)"}`,
        boxShadow: active ? `0 2px 10px ${tint(meta.color, 0.22)}` : "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <select
          value={a.label}
          onChange={(e) => onChange({ label: e.target.value as AnnotationLabel })}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold border outline-none"
          style={{ background: tint(meta.color, 0.12), borderColor: meta.color, color: meta.color }}
        >
          {ANNOTATION_LABELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-auto text-[11px] px-1.5 py-0.5 rounded"
          style={{ color: "rgb(220,38,38)", background: "none", border: "none", cursor: "pointer" }}
        >
          Xoá
        </button>
      </div>

      <p className="text-xs italic m-0 mb-1.5" style={{ color: "var(--text-muted)" }}>“{a.quote}”</p>

      <input
        value={a.suggestion ?? ""}
        onChange={(e) => onChange({ suggestion: e.target.value })}
        placeholder="Sửa thành…"
        className="w-full px-2 py-1 rounded text-[13px] border outline-none mb-1.5"
        style={inputStyle}
      />
      <textarea
        value={a.comment ?? ""}
        onChange={(e) => onChange({ comment: e.target.value })}
        rows={2}
        placeholder="Giải thích cho học viên…"
        className="w-full px-2 py-1 rounded text-[13px] border outline-none"
        style={inputStyle}
      />
    </div>
  );
}

// ─── Trang chấm ───────────────────────────────────────────────────────────────

export default function GradeSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("compare");
  const [overall, setOverall] = useState("");
  const [audio, setAudio] = useState<{ url: string; publicId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Nút "thêm nhận xét" nổi cạnh vùng vừa bôi đen */
  const [pop, setPop] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await readJson(await fetch(`/api/admin/submissions/${id}`));
        if (!alive) return;
        const s = data.submission as Submission | undefined;
        if (!s) { setError(String(data?.error ?? "Không tìm thấy bài")); return; }
        setSub(s);
        setOverall(s.feedback?.overall ?? "");
        setAnnotations(s.feedback?.annotations ?? []);
        setAudio(s.feedback?.audioUrl ? { url: s.feedback.audioUrl, publicId: s.feedback.audioPublicId ?? "" } : null);
        setItems(s.items.map((it) => {
          const prev = s.feedback?.items?.find((f) => f.idx === it.idx);
          return { idx: it.idx, score: prev?.score, comment: prev?.comment ?? "", corrected: prev?.corrected };
        }));
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Không tải được bài");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const max = sub ? scaleFor(sub.skill, sub.unit) : 5;
  const band = useMemo(() => estimateBand({ items, annotations }, max), [items, annotations, max]);
  const stats = useMemo(() => countByLabel(annotations), [annotations]);

  function patchItem(idx: number, p: Partial<FeedbackItem>) {
    setItems((prev) => prev.map((f) => (f.idx === idx ? { ...f, ...p } : f)));
  }

  function focus(aid: string) {
    setActiveId(aid);
    document.querySelector(`[data-annotation-id="${CSS.escape(aid)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  /** Bôi đen xong thì hiện nút nổi ngay cuối vùng chọn. */
  function onMouseUp(e: React.MouseEvent) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setPop(null); return; }
    const node = sel.anchorNode;
    const host = (node?.nodeType === 1 ? (node as Element) : node?.parentElement)?.closest("[data-item-idx]");
    if (!host) { setPop(null); return; }
    setPop({ x: e.clientX, y: e.clientY });
  }

  function addAnnotation() {
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const host = (node?.nodeType === 1 ? (node as Element) : node?.parentElement)?.closest("[data-item-idx]") as HTMLElement | null;
    if (!host || !sub) return;

    const itemIdx = Number(host.dataset.itemIdx);
    const item = sub.items.find((i) => i.idx === itemIdx);
    const range = selectionRange(host);
    if (!item?.text || !range) { setPop(null); return; }

    const mine = annotations.filter((a) => a.itemIdx === itemIdx);
    if (overlaps(mine, range.start, range.end)) {
      setError("Đoạn này đã có nhận xét — sửa nhận xét cũ thay vì tạo mới.");
      setPop(null);
      return;
    }

    const quote = item.text.slice(range.start, range.end);
    if (!quote.trim()) { setPop(null); return; }

    const a: Annotation = {
      id: `a${itemIdx}-${range.start}-${range.end}`,
      itemIdx, start: range.start, end: range.end, quote, label: "grammar",
    };
    setAnnotations((prev) => [...prev, a]);
    setActiveId(a.id);
    setError(null);
    setPop(null);
    window.getSelection()?.removeAllRanges();
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: { items, annotations, overall, audioUrl: audio?.url, audioPublicId: audio?.publicId } }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(String(data?.error ?? `Lỗi ${res.status}`));
      router.push("/admin/grading");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-40 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />;
  if (!sub) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error ?? "Không tìm thấy bài"}</p>;

  const cards: RailCard[] = annotations
    .slice()
    .sort((a, b) => (a.itemIdx - b.itemIdx) || (a.start - b.start))
    .map((a) => ({
      id: a.id,
      node: (
        <EditableCard
          a={a}
          active={activeId === a.id}
          onFocus={() => focus(a.id)}
          onChange={(patch) => setAnnotations((prev) => prev.map((x) => (x.id === a.id ? { ...x, ...patch } : x)))}
          onRemove={() => setAnnotations((prev) => prev.filter((x) => x.id !== a.id))}
        />
      ),
    }));

  const toolbar = (
    <div className="flex items-center gap-3 flex-wrap px-3 md:px-6 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <Link href="/admin/grading" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>← Hàng chờ</Link>

      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {MODES.map((m) => (
          <button key={m.id} type="button" onClick={() => setMode(m.id)}
            className="px-3 py-1.5 text-xs font-semibold"
            style={{
              background: mode === m.id ? "var(--accent-primary)" : "transparent",
              color: mode === m.id ? "#fff" : "var(--text-muted)",
              border: "none", cursor: "pointer",
            }}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {stats.map((s) => (
          <span key={s.id} className="text-[11px] font-semibold px-2 py-1 rounded-md"
            style={{ background: tint(s.color, 0.12), color: s.color }}>
            {s.label} {s.count}
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {band === null ? "— /200" : `~${band}/200`}
        </span>
        <button type="button" onClick={save} disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white"
          style={{ background: saving ? "var(--border)" : "var(--accent-primary)", border: "none", cursor: saving ? "default" : "pointer" }}>
          {saving ? "Đang lưu…" : sub.status === "graded" ? "Lưu lại" : "Gửi nhận xét"}
        </button>
      </div>
    </div>
  );

  return (
    <div onMouseUp={onMouseUp}>
      <DocumentSheet toolbar={toolbar} cards={cards} activeId={activeId}>
        <header className="mb-7">
          <h1 className="text-[1.6rem] font-bold m-0" style={{ color: "var(--text-primary)", fontFamily: "var(--font-admin-serif, Georgia, serif)" }}>
            {sub.title}
          </h1>
          <p className="text-xs mt-1.5 m-0" style={{ color: "var(--text-muted)" }}>
            {sub.profile?.studentCode ?? sub.profile?.displayName ?? "—"}
            {sub.submittedAt && ` · gửi ${new Date(sub.submittedAt).toLocaleString("vi-VN")}`}
          </p>
        </header>

        {sub.items.map((it, i) => {
          const fb = items.find((f) => f.idx === it.idx);
          const anns = annotations.filter((a) => a.itemIdx === it.idx);
          return (
            <section key={it.idx} className={i > 0 ? "mt-7 pt-7" : ""} style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
              <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                <h2 className="text-[11px] font-bold uppercase tracking-widest m-0" style={{ color: "var(--text-muted)" }}>
                  Câu {it.idx + 1}
                </h2>
                {it.prompt && <span className="text-xs italic" style={{ color: "var(--text-secondary)" }}>{it.prompt}</span>}
                <select
                  value={fb?.score ?? ""}
                  onChange={(e) => patchItem(it.idx, { score: e.target.value === "" ? undefined : Number(e.target.value) })}
                  className="ml-auto px-2 py-0.5 rounded text-xs border outline-none"
                  style={inputStyle}
                >
                  <option value="">— /{max}</option>
                  {Array.from({ length: max + 1 }, (_, n) => <option key={n} value={n}>{n}/{max}</option>)}
                </select>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full rounded-md my-3" />}

              {it.text ? (
                <p data-item-idx={it.idx} className="text-[15px] whitespace-pre-wrap m-0"
                  style={{ color: "var(--text-primary)", lineHeight: 2 }}>
                  <AnnotatedText text={it.text} annotations={anns} activeId={activeId} onSelectAnnotation={focus} mode={mode} />
                </p>
              ) : (
                <p className="text-sm italic m-0" style={{ color: "var(--text-muted)" }}>Câu này không có bài viết.</p>
              )}
              {it.audioUrl && <audio controls src={it.audioUrl} className="w-full mt-2" />}

              <textarea
                value={fb?.comment ?? ""}
                onChange={(e) => patchItem(it.idx, { comment: e.target.value })}
                rows={2}
                placeholder="Nhận xét chung cho câu này…"
                className="w-full mt-3 px-3 py-2 rounded-lg text-sm border outline-none"
                style={inputStyle}
              />
            </section>
          );
        })}

        <section className="mt-7 pt-7" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest m-0 mb-2" style={{ color: "var(--text-muted)" }}>
            Nhận xét chung cả bài
          </h2>
          <textarea
            value={overall}
            onChange={(e) => setOverall(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none mb-3"
            style={inputStyle}
          />
          <AudioRecorder url={audio?.url} onChange={setAudio} />
          {error && <p className="text-sm mt-3 mb-0" style={{ color: "rgb(220,38,38)" }}>{error}</p>}
        </section>
      </DocumentSheet>

      {/* Nút nổi cạnh vùng bôi đen */}
      {pop && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addAnnotation}
          className="fixed z-50 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg"
          style={{ left: pop.x + 8, top: pop.y + 8, background: "var(--accent-primary)", border: "none", cursor: "pointer" }}
        >
          💬 Nhận xét
        </button>
      )}
    </div>
  );
}
