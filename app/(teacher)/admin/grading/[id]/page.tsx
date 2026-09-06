"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { AnnotatedText, tint, type ViewMode } from "@/components/submissions/AnnotatedText";
import { DocumentSheet, type RailCard } from "@/components/submissions/DocumentSheet";
import { caretOffset, insideAny, overlaps, selectionRange } from "@/lib/submissions/selection";
import {
  ANNOTATION_LABELS,
  annotationKind,
  countByLabel,
  estimateBand,
  labelMeta,
  scaleFor,
  type Annotation,
  type AnnotationKind,
  type AnnotationLabel,
  type AnnotationReply,
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
  draftFeedback: SubmissionFeedback | null;
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

/** Nút trong menu nổi — giữ một kiểu dáng để menu trông liền mạch. */
function PopButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="px-3 py-2 text-xs font-semibold"
      style={{
        background: "transparent",
        color: "var(--text-primary)",
        border: "none",
        borderRight: "1px solid var(--border)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ─── Mẫu nhận xét bấm nhanh ──────────────────────────────────────────────────

/** Câu hay dùng nhất theo từng nhóm lỗi — bấm là điền, đỡ gõ lại mỗi bài. */
const COMMENT_TEMPLATES: Record<AnnotationLabel, string[]> = {
  grammar: ["Sai thì của động từ", "Thiếu mạo từ", "Sai dạng số ít/số nhiều", "Chủ ngữ và động từ không hợp"],
  vocab: ["Dùng sai từ trong ngữ cảnh này", "Lặp từ, thử từ đồng nghĩa", "Từ này quá thân mật cho văn viết"],
  cohesion: ["Thiếu từ nối giữa hai ý", "Ý này chưa liên kết với câu trước", "Nên tách thành hai câu"],
  task: ["Chưa trả lời đúng yêu cầu đề", "Thiếu một trong các ý đề yêu cầu", "Lạc đề ở đoạn này"],
  style: ["Câu quá dài, nên rút gọn", "Diễn đạt vòng vo", "Nên dùng thể chủ động"],
};

const KIND_META: Record<AnnotationKind, { label: string; color: string }> = {
  replace: { label: "Sửa thành", color: "#15803d" },
  insert: { label: "Chèn thêm", color: "#15803d" },
  delete: { label: "Xoá đoạn", color: "#b91c1c" },
};

// ─── Thẻ comment sửa được ─────────────────────────────────────────────────────

function EditableCard({
  a, active, onFocus, onHover, onChange, onRemove, onReply,
}: {
  a: Annotation;
  active: boolean;
  onFocus: () => void;
  onHover: (id: string | null) => void;
  onChange: (patch: Partial<Annotation>) => void;
  onRemove: () => void;
  onReply: (text: string) => void;
}) {
  const meta = labelMeta(a.label);
  const kind = annotationKind(a);
  const kindMeta = KIND_META[kind];
  const [reply, setReply] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const replies = a.replies ?? [];

  function sendReply() {
    const t = reply.trim();
    if (!t) return;
    onReply(t);
    setReply("");
  }

  return (
    <div
      onClick={onFocus}
      onMouseEnter={() => onHover(a.id)}
      onMouseLeave={() => onHover(null)}
      className="rounded-lg px-3 py-2.5"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${active ? meta.color : "var(--border)"}`,
        boxShadow: active ? `0 2px 10px ${tint(meta.color, 0.22)}` : "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <select
          value={a.label}
          onChange={(e) => onChange({ label: e.target.value as AnnotationLabel })}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold border outline-none"
          style={{ background: tint(meta.color, 0.12), borderColor: meta.color, color: meta.color }}
        >
          {ANNOTATION_LABELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>

        {/* Đổi loại thao tác ngay trên thẻ — chèn thì cố định vì nó không phủ chữ nào */}
        {kind === "insert" ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: tint(kindMeta.color, 0.12), color: kindMeta.color }}>
            {kindMeta.label}
          </span>
        ) : (
          <select
            value={kind}
            onChange={(e) => onChange({ kind: e.target.value as AnnotationKind })}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold border outline-none"
            style={{ background: tint(kindMeta.color, 0.1), borderColor: kindMeta.color, color: kindMeta.color }}
          >
            <option value="replace">Sửa thành</option>
            <option value="delete">Xoá đoạn</option>
          </select>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-auto text-[11px] px-1.5 py-0.5 rounded"
          style={{ color: "rgb(220,38,38)", background: "none", border: "none", cursor: "pointer" }}
        >
          Xoá thẻ
        </button>
      </div>

      {kind === "insert" ? (
        <p className="text-xs italic m-0 mb-1.5" style={{ color: "var(--text-muted)" }}>
          Chèn vào giữa “…{a.quote}”
        </p>
      ) : (
        <p className="text-xs italic m-0 mb-1.5"
          style={{ color: "var(--text-muted)", textDecoration: kind === "delete" ? "line-through" : "none" }}>
          “{a.quote}”
        </p>
      )}

      {kind !== "delete" && (
        <input
          value={a.suggestion ?? ""}
          onChange={(e) => onChange({ suggestion: e.target.value })}
          placeholder={kind === "insert" ? "Chữ cần thêm…" : "Sửa thành…"}
          className="w-full px-2 py-1 rounded text-[13px] border outline-none mb-1.5"
          style={inputStyle}
        />
      )}

      <textarea
        value={a.comment ?? ""}
        onChange={(e) => onChange({ comment: e.target.value })}
        rows={2}
        placeholder="Giải thích cho học viên…"
        className="w-full px-2 py-1 rounded text-[13px] border outline-none"
        style={inputStyle}
      />

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowTemplates((v) => !v); }}
        className="mt-1 text-[10px] font-semibold"
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
      >
        {showTemplates ? "Ẩn mẫu" : "＋ Mẫu nhận xét"}
      </button>
      {showTemplates && (
        <div className="flex flex-wrap gap-1 mt-1">
          {COMMENT_TEMPLATES[a.label].map((t) => (
            <button
              key={t}
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange({ comment: t }); setShowTemplates(false); }}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: tint(meta.color, 0.1), color: meta.color, border: "none", cursor: "pointer" }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Hội thoại quanh chỗ này */}
      {replies.length > 0 && (
        <div className="mt-2 pt-2 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
          {replies.map((r) => (
            <div key={r.id} className="text-[11px]">
              <span className="font-bold" style={{ color: r.role === "teacher" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                {r.authorName || (r.role === "teacher" ? "Thầy Hiếu" : "Học viên")}
              </span>
              <span className="ml-1.5" style={{ color: "var(--text-muted)" }}>
                {new Date(r.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
              <p className="m-0 mt-0.5" style={{ color: "var(--text-primary)" }}>{r.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 mt-1.5">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendReply(); } }}
          placeholder="Trả lời…"
          className="flex-1 px-2 py-1 rounded text-[12px] border outline-none"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); sendReply(); }}
          disabled={!reply.trim()}
          className="px-2 py-1 rounded text-[11px] font-bold"
          style={{
            background: reply.trim() ? "var(--accent-primary)" : "var(--border)",
            color: "#fff", border: "none", cursor: reply.trim() ? "pointer" : "default",
          }}
        >
          Gửi
        </button>
      </div>
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
  const [autoState, setAutoState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  /** Bỏ qua lần đổi state ngay sau khi tải bài — đó là dữ liệu vừa đọc về, không phải thầy sửa. */
  const loadedRef = useRef(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  /**
   * Menu nổi cạnh chỗ vừa thao tác. `range` = đang bôi đen (thay thế/xoá),
   * `caret` = chỉ đặt con trỏ (chèn thêm) — hai trường hợp cho hai bộ nút khác nhau.
   */
  const [pop, setPop] = useState<{ x: number; y: number; mode: "range" | "caret" } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await readJson(await fetch(`/api/admin/submissions/${id}`));
        if (!alive) return;
        const s = data.submission as Submission | undefined;
        if (!s) { setError(String(data?.error ?? "Không tìm thấy bài")); return; }
        setSub(s);
        // Nháp mới hơn bản đã công bố nên ưu tiên, để thầy chấm tiếp đúng chỗ bỏ dở.
        const fb = s.draftFeedback ?? s.feedback;
        setOverall(fb?.overall ?? "");
        setAnnotations(fb?.annotations ?? []);
        setAudio(fb?.audioUrl ? { url: fb.audioUrl, publicId: fb.audioPublicId ?? "" } : null);
        setItems(s.items.map((it) => {
          const prev = fb?.items?.find((f) => f.idx === it.idx);
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

  /** Bôi đen (hoặc chỉ đặt con trỏ) trong bài thì hiện menu thao tác ngay đó. */
  function onMouseUp(e: React.MouseEvent) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { setPop(null); return; }
    const node = sel.anchorNode;
    const host = (node?.nodeType === 1 ? (node as Element) : node?.parentElement)?.closest("[data-item-idx]");
    if (!host) { setPop(null); return; }
    setPop({ x: e.clientX, y: e.clientY, mode: sel.isCollapsed ? "caret" : "range" });
  }

  /** Phần tử bài viết chứa vùng chọn hiện tại, kèm câu tương ứng. */
  function selectionHost(): { host: HTMLElement; itemIdx: number; text: string } | null {
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const host = (node?.nodeType === 1 ? (node as Element) : node?.parentElement)?.closest("[data-item-idx]") as HTMLElement | null;
    if (!host || !sub) return null;
    const itemIdx = Number(host.dataset.itemIdx);
    const text = sub.items.find((i) => i.idx === itemIdx)?.text;
    if (!text) return null;
    return { host, itemIdx, text };
  }

  function pushAnnotation(a: Annotation) {
    setAnnotations((prev) => [...prev, a]);
    setActiveId(a.id);
    setError(null);
    setPop(null);
    window.getSelection()?.removeAllRanges();
  }

  /** Chèn thêm chữ tại vị trí con trỏ — neo zero-width, không phủ chữ gốc nào. */
  function addInsertion() {
    const ctx = selectionHost();
    if (!ctx) { setPop(null); return; }
    const at = caretOffset(ctx.host);
    if (at === null) { setPop(null); return; }

    const mine = annotations.filter((a) => a.itemIdx === ctx.itemIdx);
    if (insideAny(mine, at)) {
      setError("Chỗ này nằm giữa một nhận xét đã có — chèn ra ngoài đoạn đó.");
      setPop(null);
      return;
    }

    pushAnnotation({
      id: `a${ctx.itemIdx}-ins-${at}-${Date.now().toString(36)}`,
      itemIdx: ctx.itemIdx,
      start: at,
      end: at,
      // Giữ ít chữ hai bên để còn nhận ra vị trí nếu offset lệch về sau.
      quote: ctx.text.slice(Math.max(0, at - 12), at + 12),
      label: "grammar",
      kind: "insert",
      suggestion: "",
    });
  }

  /** Chỉ đánh dấu + ghi chú, không kèm đề xuất chữ mới. */
  function addComment() {
    const ctx = selectionHost();
    if (!ctx) { setPop(null); return; }
    const range = selectionRange(ctx.host);
    if (!range) { setPop(null); return; }
    const mine = annotations.filter((a) => a.itemIdx === ctx.itemIdx);
    if (overlaps(mine, range.start, range.end)) {
      setError("Đoạn này đã có nhận xét — sửa nhận xét cũ thay vì tạo mới.");
      setPop(null);
      return;
    }
    const quote = ctx.text.slice(range.start, range.end);
    if (!quote.trim()) { setPop(null); return; }
    pushAnnotation({
      id: `a${ctx.itemIdx}-${range.start}-${range.end}`,
      itemIdx: ctx.itemIdx,
      start: range.start,
      end: range.end,
      quote,
      label: "grammar",
      kind: "replace",
    });
  }

  function addReply(annotationId: string, text: string) {
    const reply: AnnotationReply = {
      id: `r${Date.now().toString(36)}`,
      role: "teacher",
      authorName: "Thầy Hiếu",
      text,
      createdAt: new Date().toISOString(),
    };
    setAnnotations((prev) =>
      prev.map((x) => (x.id === annotationId ? { ...x, replies: [...(x.replies ?? []), reply] } : x))
    );
  }

  function addAnnotation(kind: AnnotationKind = "replace") {
    const ctx = selectionHost();
    if (!ctx) { setPop(null); return; }
    const range = selectionRange(ctx.host);
    if (!range) { setPop(null); return; }

    const mine = annotations.filter((a) => a.itemIdx === ctx.itemIdx);
    if (overlaps(mine, range.start, range.end)) {
      setError("Đoạn này đã có nhận xét — sửa nhận xét cũ thay vì tạo mới.");
      setPop(null);
      return;
    }

    const quote = ctx.text.slice(range.start, range.end);
    if (!quote.trim()) { setPop(null); return; }

    pushAnnotation({
      id: `a${ctx.itemIdx}-${range.start}-${range.end}`,
      itemIdx: ctx.itemIdx,
      start: range.start,
      end: range.end,
      quote,
      label: "grammar",
      kind,
      // "Sửa thành" mở sẵn ô gợi ý bằng chính chữ cũ để thầy chỉnh, nhanh hơn gõ lại.
      suggestion: kind === "replace" ? quote : undefined,
    });
  }

  /** Khối feedback hiện tại — dùng chung cho tự lưu và cho lúc gửi. */
  const draftPayload = useMemo(
    () => ({ items, annotations, overall, audioUrl: audio?.url, audioPublicId: audio?.publicId }),
    [items, annotations, overall, audio]
  );

  /**
   * Tự lưu nháp sau khi ngừng thao tác 2 giây. Ghi vào `draft_feedback` nên
   * học viên chưa thấy gì; bấm "Gửi nhận xét" mới công bố.
   */
  useEffect(() => {
    if (loading || !sub) return;
    // Lần chạy đầu chỉ đánh dấu đã nạp xong, không lưu lại chính thứ vừa đọc về.
    if (!loadedRef.current) { loadedRef.current = true; return; }

    const timer = setTimeout(async () => {
      setAutoState("saving");
      try {
        const res = await fetch(`/api/admin/submissions/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: draftPayload, publish: false }),
        });
        if (!res.ok) throw new Error(String((await readJson(res))?.error ?? `Lỗi ${res.status}`));
        setSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        setAutoState("saved");
      } catch {
        setAutoState("error");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [draftPayload, id, loading, sub]);

  /**
   * Rời trang khi chưa tới nhịp 2 giây thì phần vừa gõ sẽ mất — sendBeacon gửi
   * được cả khi tab đang đóng, fetch thường thì không.
   */
  useEffect(() => {
    function flush() {
      if (document.visibilityState !== "hidden" || !loadedRef.current) return;
      const blob = new Blob([JSON.stringify({ feedback: draftPayload, publish: false })], {
        type: "application/json",
      });
      navigator.sendBeacon?.(`/api/admin/submissions/${id}`, blob);
    }
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [draftPayload, id]);

  // Ctrl+Alt+M: thêm đề xuất sửa cho đoạn đang bôi đen, giống Google Docs.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey && e.altKey && e.key.toLowerCase() === "m")) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      e.preventDefault();
      if (sel.isCollapsed) addInsertion();
      else addAnnotation("replace");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: draftPayload, publish: true }),
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
          onHover={setHoverId}
          onChange={(patch) => setAnnotations((prev) => prev.map((x) => (x.id === a.id ? { ...x, ...patch } : x)))}
          onRemove={() => setAnnotations((prev) => prev.filter((x) => x.id !== a.id))}
          onReply={(text) => addReply(a.id, text)}
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
        {/* Trạng thái tự lưu — kín đáo, kiểu Google Docs */}
        <span className="text-[11px]" style={{ color: autoState === "error" ? "rgb(220,38,38)" : "var(--text-muted)" }}>
          {autoState === "saving" && "Đang lưu…"}
          {autoState === "saved" && `Đã lưu nháp lúc ${savedAt}`}
          {autoState === "error" && "Lưu nháp lỗi — sẽ thử lại khi bạn gõ tiếp"}
        </span>

        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {band === null ? "— /200" : `~${band}/200`}
        </span>
        <button type="button" onClick={save} disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white"
          style={{ background: saving ? "var(--border)" : "var(--accent-primary)", border: "none", cursor: saving ? "default" : "pointer" }}>
          {saving ? "Đang gửi…" : sub.status === "graded" ? "Cập nhật cho học viên" : "Gửi nhận xét"}
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
                  <AnnotatedText
                    text={it.text}
                    annotations={anns}
                    activeId={activeId}
                    hoverId={hoverId}
                    onSelectAnnotation={focus}
                    onHoverAnnotation={setHoverId}
                    mode={mode}
                  />
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

      {/* Menu thao tác nổi cạnh chỗ vừa chọn — kiểu Google Docs */}
      {pop && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-50 flex rounded-lg overflow-hidden shadow-lg"
          style={{ left: pop.x + 8, top: pop.y + 8, border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
        >
          {pop.mode === "range" ? (
            <>
              <PopButton onClick={() => addAnnotation("replace")} title="Đề xuất chữ thay thế (Ctrl+Alt+M)">✎ Sửa thành</PopButton>
              <PopButton onClick={() => addAnnotation("delete")} title="Đề xuất bỏ đoạn này">⌫ Xoá đoạn</PopButton>
              <PopButton onClick={() => addComment()} title="Chỉ ghi chú, không đề xuất sửa">💬 Nhận xét</PopButton>
            </>
          ) : (
            <PopButton onClick={addInsertion} title="Thêm chữ vào vị trí con trỏ">＋ Chèn tại đây</PopButton>
          )}
        </div>
      )}
    </div>
  );
}
