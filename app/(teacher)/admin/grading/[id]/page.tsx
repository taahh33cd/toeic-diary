"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import type { FeedbackItem, SubmissionFeedback, SubmissionItem } from "@/lib/submissions";

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

const inputStyle: React.CSSProperties = {
  background: "var(--bg-primary)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
};

/** Ghi âm nhận xét bằng giọng nói rồi upload Cloudinary. */
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
          const file = new File([blob], `feedback-${Date.now()}.webm`, { type: "audio/webm" });
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

export default function GradeSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [overall, setOverall] = useState("");
  const [audio, setAudio] = useState<{ url: string; publicId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/submissions/${id}`);
        const data = await res.json();
        if (!alive) return;
        const s = data.submission as Submission | undefined;
        if (!s) { setError(data?.error ?? "Không tìm thấy bài"); return; }
        setSub(s);
        setOverall(s.feedback?.overall ?? "");
        setAudio(s.feedback?.audioUrl ? { url: s.feedback.audioUrl, publicId: s.feedback.audioPublicId ?? "" } : null);
        // Bản sửa mặc định là chính bài viết của học viên để sửa trực tiếp lên đó.
        setItems(
          s.items.map((it) => {
            const prev = s.feedback?.items?.find((f) => f.idx === it.idx);
            return {
              idx: it.idx,
              score: prev?.score,
              comment: prev?.comment ?? "",
              corrected: prev?.corrected ?? it.text ?? "",
            };
          })
        );
      } catch {
        if (alive) setError("Không tải được bài");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  function patch(idx: number, p: Partial<FeedbackItem>) {
    setItems((prev) => prev.map((f) => (f.idx === idx ? { ...f, ...p } : f)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: {
            items,
            overall,
            audioUrl: audio?.url,
            audioPublicId: audio?.publicId,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Lỗi ${res.status}`);
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
    <div className="space-y-4 max-w-3xl">
      <Link href="/admin/grading" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>
        ← Hàng chờ chấm
      </Link>

      <div>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{sub.title}</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {sub.profile?.studentCode ?? sub.profile?.displayName ?? "—"}
          {sub.submittedAt && ` · gửi ${new Date(sub.submittedAt).toLocaleString("vi-VN")}`}
        </p>
      </div>

      {sub.items.map((it) => {
        const fb = items.find((f) => f.idx === it.idx);
        return (
          <section
            key={it.idx}
            className="rounded-xl p-4 space-y-3"
            style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Câu {it.idx + 1}
              </span>
              <label className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                Điểm rubric
                <select
                  value={fb?.score ?? ""}
                  onChange={(e) => patch(it.idx, { score: e.target.value === "" ? undefined : Number(e.target.value) })}
                  className="px-2 py-1 rounded-lg text-xs border outline-none"
                  style={inputStyle}
                >
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
                </select>
              </label>
            </div>

            {it.prompt && <p className="text-xs italic m-0" style={{ color: "var(--text-secondary)" }}>{it.prompt}</p>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full rounded-lg" />}

            {it.text && (
              <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider m-0 mb-1" style={{ color: "var(--text-muted)" }}>
                  Bài của học viên
                </p>
                <p className="text-sm whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)", lineHeight: 1.7 }}>
                  {it.text}
                </p>
              </div>
            )}
            {it.audioUrl && <audio controls src={it.audioUrl} className="w-full" />}

            {it.text && (
              <label className="block">
                <span className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Bản sửa (học viên xem được cạnh bài gốc)
                </span>
                <textarea
                  value={fb?.corrected ?? ""}
                  onChange={(e) => patch(it.idx, { corrected: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={inputStyle}
                />
              </label>
            )}

            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Nhận xét câu này
              </span>
              <textarea
                value={fb?.comment ?? ""}
                onChange={(e) => patch(it.idx, { comment: e.target.value })}
                rows={3}
                placeholder="Lỗi cần sửa, điểm mạnh, gợi ý cụ thể…"
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={inputStyle}
              />
            </label>
          </section>
        );
      })}

      <section
        className="rounded-xl p-4 space-y-3"
        style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
      >
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Nhận xét chung
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

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-5 py-2.5 rounded-lg text-sm font-bold text-white"
        style={{ background: saving ? "var(--border)" : "var(--accent-primary)", border: "none", cursor: saving ? "default" : "pointer" }}
      >
        {saving ? "Đang lưu…" : sub.status === "graded" ? "Lưu lại nhận xét" : "Gửi nhận xét cho học viên"}
      </button>
    </div>
  );
}
