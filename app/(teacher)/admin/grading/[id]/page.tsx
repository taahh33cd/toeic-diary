"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { AnnotatedText } from "@/components/submissions/AnnotatedText";
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

/**
 * Đọc body JSON, nhưng nếu server trả HTML/text (500 chưa bắt được, redirect...)
 * thì ném kèm status + đoạn đầu body để còn biết hỏng ở đâu.
 */
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

function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            Xoá
          </button>
        )}
      </div>
      {url && <audio controls src={url} className="w-full" />}
      {error && <p className="text-xs m-0" style={{ color: "rgb(220,38,38)" }}>{error}</p>}
    </div>
  );
}

// ─── Thẻ comment ở cột phải ───────────────────────────────────────────────────

function CommentCard({
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
      className="rounded-xl p-3"
      style={{
        border: `1px solid ${active ? meta.color : "var(--border)"}`,
        background: active ? tint(meta.color, 0.06) : "var(--bg-elevated)",
        boxShadow: active ? `0 0 0 2px ${tint(meta.color, 0.18)}` : "none",
      }}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <select
          value={a.label}
          onChange={(e) => onChange({ label: e.target.value as AnnotationLabel })}
          className="px-2 py-1 rounded-md text-[11px] font-bold border outline-none"
          style={{ background: tint(meta.color, 0.12), borderColor: meta.color, color: meta.color }}
        >
          {ANNOTATION_LABELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-auto text-xs px-2 py-1 rounded"
          style={{ color: "rgb(220,38,38)", background: "rgba(239,68,68,0.08)", border: "none", cursor: "pointer" }}
        >
          Xoá
        </button>
      </div>

      <p
        className="text-xs italic m-0 mb-2 line-clamp-2"
        style={{ color: "var(--text-muted)", borderLeft: `3px solid ${meta.color}`, paddingLeft: 8 }}
      >
        “{a.quote}”
      </p>

      <input
        value={a.suggestion ?? ""}
        onChange={(e) => onChange({ suggestion: e.target.value })}
        placeholder="Sửa thành… (để trống nếu chỉ nhận xét)"
        className="w-full px-2 py-1.5 rounded-lg text-sm border outline-none mb-2"
        style={inputStyle}
      />
      <textarea
        value={a.comment ?? ""}
        onChange={(e) => onChange({ comment: e.target.value })}
        rows={2}
        placeholder="Giải thích lỗi cho học viên…"
        className="w-full px-2 py-1.5 rounded-lg text-sm border outline-none"
        style={inputStyle}
      />
    </div>
  );
}

// ─── Một câu: bài viết bên trái, comment bên phải ─────────────────────────────

function ItemBlock({
  item, max, fb, annotations, activeId,
  onScore, onItemComment, onAddAnnotation, onPatchAnnotation, onRemoveAnnotation, onFocusAnnotation,
}: {
  item: SubmissionItem;
  max: number;
  fb?: FeedbackItem;
  annotations: Annotation[];
  activeId: string | null;
  onScore: (v: number | undefined) => void;
  onItemComment: (v: string) => void;
  onAddAnnotation: (a: Annotation) => void;
  onPatchAnnotation: (id: string, patch: Partial<Annotation>) => void;
  onRemoveAnnotation: (id: string) => void;
  onFocusAnnotation: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState<string | null>(null);

  function addFromSelection() {
    const el = bodyRef.current;
    if (!el || !item.text) return;
    const range = selectionRange(el);
    if (!range) { setHint("Hãy bôi đen một đoạn chữ trong bài trước."); return; }
    if (overlaps(annotations, range.start, range.end)) {
      setHint("Đoạn này đã có nhận xét — chọn đoạn khác hoặc sửa nhận xét cũ.");
      return;
    }
    const quote = item.text.slice(range.start, range.end);
    if (!quote.trim()) { setHint("Vùng chọn rỗng."); return; }

    const a: Annotation = {
      id: `a${item.idx}-${range.start}-${range.end}`,
      itemIdx: item.idx,
      start: range.start,
      end: range.end,
      quote,
      label: "grammar",
    };
    onAddAnnotation(a);
    setHint(null);
    window.getSelection()?.removeAllRanges();
  }

  return (
    <section className="rounded-xl p-4" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Câu {item.idx + 1}
        </span>
        <label className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          Điểm rubric ETS
          <select
            value={fb?.score ?? ""}
            onChange={(e) => onScore(e.target.value === "" ? undefined : Number(e.target.value))}
            className="px-2 py-1 rounded-lg text-xs border outline-none"
            style={inputStyle}
          >
            <option value="">—</option>
            {Array.from({ length: max + 1 }, (_, n) => (
              <option key={n} value={n}>{n}/{max}</option>
            ))}
          </select>
        </label>
      </div>

      {item.prompt && <p className="text-xs italic m-0 mb-2" style={{ color: "var(--text-secondary)" }}>{item.prompt}</p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full rounded-lg mb-3" />}

      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>
        {/* Bài viết */}
        <div>
          {item.text ? (
            <>
              <div
                ref={bodyRef}
                onMouseUp={() => setHint(null)}
                className="rounded-lg px-3 py-3 text-sm whitespace-pre-wrap"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)", lineHeight: 1.9 }}
              >
                <AnnotatedText
                  text={item.text}
                  annotations={annotations}
                  activeId={activeId}
                  onSelectAnnotation={onFocusAnnotation}
                />
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={addFromSelection}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ border: "1px solid var(--accent-primary)", background: "none", color: "var(--accent-primary)", cursor: "pointer" }}
                >
                  💬 Thêm nhận xét vào đoạn đã bôi đen
                </button>
                {hint && <span className="text-xs" style={{ color: "rgb(220,38,38)" }}>{hint}</span>}
              </div>
            </>
          ) : (
            <p className="text-sm italic m-0" style={{ color: "var(--text-muted)" }}>Câu này không có bài viết.</p>
          )}

          {item.audioUrl && <audio controls src={item.audioUrl} className="w-full mt-3" />}

          <label className="block mt-3">
            <span className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Nhận xét chung cho câu này
            </span>
            <textarea
              value={fb?.comment ?? ""}
              onChange={(e) => onItemComment(e.target.value)}
              rows={2}
              placeholder="Điểm mạnh, lỗi lặp lại, hướng cải thiện…"
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={inputStyle}
            />
          </label>
        </div>

        {/* Cột comment */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Nhận xét theo đoạn ({annotations.length})
          </span>
          {annotations.length === 0 ? (
            <p className="text-xs italic m-0" style={{ color: "var(--text-muted)" }}>
              Bôi đen một đoạn trong bài rồi bấm “Thêm nhận xét”.
            </p>
          ) : (
            [...annotations]
              .sort((a, b) => a.start - b.start)
              .map((a) => (
                <CommentCard
                  key={a.id}
                  a={a}
                  active={activeId === a.id}
                  onFocus={() => onFocusAnnotation(a.id)}
                  onChange={(patch) => onPatchAnnotation(a.id, patch)}
                  onRemove={() => onRemoveAnnotation(a.id)}
                />
              ))
          )}
        </div>
      </div>
    </section>
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
  const [overall, setOverall] = useState("");
  const [audio, setAudio] = useState<{ url: string; publicId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setItems(
          s.items.map((it) => {
            const prev = s.feedback?.items?.find((f) => f.idx === it.idx);
            return { idx: it.idx, score: prev?.score, comment: prev?.comment ?? "", corrected: prev?.corrected };
          })
        );
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Không tải được bài");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const max = sub ? scaleFor(sub.skill, sub.unit) : 5;
  const band = useMemo(
    () => estimateBand({ items, annotations }, max),
    [items, annotations, max]
  );
  const stats = useMemo(() => countByLabel(annotations), [annotations]);

  function patchItem(idx: number, p: Partial<FeedbackItem>) {
    setItems((prev) => prev.map((f) => (f.idx === idx ? { ...f, ...p } : f)));
  }

  function focusAnnotation(aid: string) {
    setActiveId(aid);
    document.querySelector(`[data-annotation-id="${aid}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: { items, annotations, overall, audioUrl: audio?.url, audioPublicId: audio?.publicId },
        }),
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

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />;
  }
  if (!sub) {
    return <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error ?? "Không tìm thấy bài"}</p>;
  }

  return (
    <div className="space-y-4">
      <Link href="/admin/grading" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>
        ← Hàng chờ chấm
      </Link>

      {/* Thanh tiêu đề dính trên cùng — luôn thấy điểm và nút lưu */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 flex-wrap py-3"
        style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="min-w-0">
          <h1 className="text-lg font-bold m-0 truncate" style={{ color: "var(--text-primary)" }}>{sub.title}</h1>
          <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>
            {sub.profile?.studentCode ?? sub.profile?.displayName ?? "—"}
            {sub.submittedAt && ` · gửi ${new Date(sub.submittedAt).toLocaleString("vi-VN")}`}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {stats.map((s) => (
            <span key={s.id} className="text-[11px] font-semibold px-2 py-1 rounded-md"
              style={{ background: tint(s.color, 0.12), color: s.color }}>
              {s.label} {s.count}
            </span>
          ))}
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {band === null ? "— /200" : `~${band}/200`}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: saving ? "var(--border)" : "var(--accent-primary)", border: "none", cursor: saving ? "default" : "pointer" }}
          >
            {saving ? "Đang lưu…" : sub.status === "graded" ? "Lưu lại" : "Gửi nhận xét"}
          </button>
        </div>
      </div>

      {sub.items.map((it) => (
        <ItemBlock
          key={it.idx}
          item={it}
          max={max}
          fb={items.find((f) => f.idx === it.idx)}
          annotations={annotations.filter((a) => a.itemIdx === it.idx)}
          activeId={activeId}
          onScore={(v) => patchItem(it.idx, { score: v })}
          onItemComment={(v) => patchItem(it.idx, { comment: v })}
          onAddAnnotation={(a) => { setAnnotations((prev) => [...prev, a]); setActiveId(a.id); }}
          onPatchAnnotation={(aid, patch) => setAnnotations((prev) => prev.map((x) => (x.id === aid ? { ...x, ...patch } : x)))}
          onRemoveAnnotation={(aid) => setAnnotations((prev) => prev.filter((x) => x.id !== aid))}
          onFocusAnnotation={focusAnnotation}
        />
      ))}

      <section className="rounded-xl p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Nhận xét chung cả bài
          </span>
          <textarea
            value={overall}
            onChange={(e) => setOverall(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={inputStyle}
          />
        </label>
        <AudioRecorder url={audio?.url} onChange={setAudio} />
      </section>

      {error && <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{error}</p>}
    </div>
  );
}
