"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExamShell, ExamDirHeading } from "./ExamShell";
import { FAMILY, EXAM } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import type { SpeakingItem } from "@/lib/skills/sample";

type Phase = "prep" | "respond" | "review";

export function SpeakingExamClient({
  skill,
  unit,
  items,
  testTitle,
}: {
  skill: Skill;
  unit: SkillUnit;
  items: SpeakingItem[];
  /** Có giá trị khi vào từ một bộ đề cụ thể → thoát về danh sách bộ đề. */
  testTitle?: string;
}) {
  const fam = skill.family;
  const color = FAMILY[fam];
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("prep");
  const [left, setLeft] = useState(items[0].prepSeconds);
  const [imgError, setImgError] = useState(false);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const item = items[idx];
  const total = items.length;
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRec = useCallback(() => {
    try { mediaRef.current?.state === "recording" && mediaRef.current.stop(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }, []);

  const startRec = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecUrl(URL.createObjectURL(blob));
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      // mic bị từ chối/không có → vẫn chạy timer, chỉ không ghi âm
      setRecording(false);
    }
  }, []);

  // phase timer
  useEffect(() => {
    if (phase === "review") return;
    if (left <= 0) {
      if (phase === "prep") goRespond();
      else if (phase === "respond") goReview();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  function goRespond() {
    setPhase("respond");
    setLeft(item.responseSeconds);
    startRec();
  }
  function goReview() {
    stopRec();
    setPhase("review");
  }
  function nextItem() {
    stopRec();
    if (recUrl) URL.revokeObjectURL(recUrl);
    setRecUrl(null);
    if (idx < total - 1) {
      const n = idx + 1;
      setIdx(n);
      setPhase("prep");
      setLeft(items[n].prepSeconds);
      setImgError(false);
    } else {
      // quay lại đầu
      setIdx(0); setPhase("prep"); setLeft(items[0].prepSeconds); setImgError(false);
    }
  }

  useEffect(() => () => stopRec(), [stopRec]);

  const listHref = `/skills/${skill.slug}/${unit.slug}`;
  const testName = testTitle ? `${skill.label} · ${unit.label} · ${testTitle}` : `${skill.label} · ${unit.label}`;
  const exitHref = testTitle ? listHref : `/skills/${skill.slug}`;
  const mmss = (s: number) => `00:${String(Math.max(0, s)).padStart(2, "0")}`;

  const nav =
    phase === "prep"
      ? [{ label: "Trả lời ngay ▶", variant: "primary" as const, onClick: goRespond }]
      : phase === "respond"
      ? [{ label: "Kết thúc trả lời ✓", variant: "primary" as const, onClick: goReview }]
      : idx < total - 1
      ? [{ label: "Câu tiếp ▶", variant: "primary" as const, onClick: nextItem }]
      : testTitle
      ? [
          { label: "Làm lại bộ đề", variant: "ghost" as const, onClick: nextItem },
          { label: "Xong — chọn bộ đề khác ▶", variant: "primary" as const, href: listHref },
        ]
      : [{ label: "Làm lại từ đầu", variant: "primary" as const, onClick: nextItem }];

  return (
    <ExamShell family={fam} testName={testName} questionLabel={`${idx + 1} / ${total}`} exitHref={exitHref} nav={nav}>
      <ExamDirHeading family={fam}>Describe a picture</ExamDirHeading>

      {/* image */}
      <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, overflow: "hidden", background: EXAM.panel, marginBottom: 6 }}>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.imageAlt} onError={() => setImgError(true)} style={{ width: "100%", height: "auto", display: "block" }} />
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: EXAM.muted, fontSize: "0.85rem" }}>Không tải được ảnh 🖼️</div>
        )}
      </div>
      <p style={{ fontSize: "0.66rem", color: EXAM.muted, textAlign: "right", margin: "0 0 14px" }}>Ảnh: {item.credit}</p>

      {/* prep / response timers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <TimerCard label="Preparation time" value={mmss(phase === "prep" ? left : 0)} active={phase === "prep"} color={color.primary} />
        <TimerCard label="Response time" value={mmss(phase === "respond" ? left : item.responseSeconds)} active={phase === "respond"} color={EXAM.bad} live={phase === "respond"} />
      </div>

      {phase === "respond" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontSize: "0.84rem", color: EXAM.bad, fontWeight: 700, marginBottom: 8 }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: recording ? EXAM.bad : EXAM.muted }} />
          {recording ? "Đang ghi âm…" : "Đang trả lời (mic không bật)"}
        </div>
      )}

      {phase === "review" && (
        <div>
          {recUrl && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: EXAM.inkSoft, margin: "0 0 5px" }}>Nghe lại bài nói của bạn:</p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={recUrl} style={{ width: "100%" }} />
            </div>
          )}
          <div style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "12px 14px" }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: EXAM.inkSoft, textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 6px" }}>Bài nói mẫu</p>
            <p style={{ fontSize: "1rem", color: EXAM.ink, lineHeight: 1.65, margin: "0 0 10px" }}>{item.sampleResponse}</p>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {item.tips.map((t, i) => <li key={i} style={{ fontSize: "0.88rem", color: EXAM.inkSoft, lineHeight: 1.55, marginBottom: 4 }}>{t}</li>)}
            </ul>
          </div>
        </div>
      )}

      {phase === "prep" && (
        <p style={{ fontSize: "0.92rem", color: EXAM.inkSoft, textAlign: "center", margin: 0 }}>
          Chuẩn bị mô tả bức ảnh. Khi hết giờ chuẩn bị, phần trả lời sẽ tự bắt đầu.
        </p>
      )}
    </ExamShell>
  );
}

function TimerCard({ label, value, active, color, live }: { label: string; value: string; active: boolean; color: string; live?: boolean }) {
  return (
    <div style={{ border: `1px solid ${live ? "#f3c6cc" : EXAM.border}`, borderRadius: 9, padding: "10px 12px", textAlign: "center", background: live ? "#fdeff0" : active ? "#fff" : EXAM.panel, opacity: active ? 1 : 0.6 }}>
      <div style={{ fontSize: "0.64rem", letterSpacing: "0.09em", fontWeight: 800, color: EXAM.muted, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", color, marginTop: 2 }}>{value}</div>
    </div>
  );
}
