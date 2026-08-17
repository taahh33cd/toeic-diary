"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExamShell, ExamDirHeading } from "./ExamShell";
import { FAMILY, EXAM } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { Q810_PREP_SECONDS, Q810_READ_SECONDS, type Q810Test } from "@/lib/skills/speaking-q8-10";
import { SubmissionPanel } from "@/components/skills/SubmissionPanel";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import type { SubmissionItem } from "@/lib/submissions";

/**
 * Đúng trình tự thi thật:
 * directions → 45 giây đọc bảng thông tin → lời dẫn tình huống →
 * (nghe câu hỏi → 3 giây chuẩn bị → 15/30 giây trả lời) × 3 → xem lại.
 */
type Phase = "directions" | "read" | "listen" | "prep" | "respond" | "review";

type Rec = { url: string; blob: Blob };

export function SpeakingQ810Client({
  skill,
  unit,
  test,
  signedIn = false,
  canSubmit = false,
}: {
  skill: Skill;
  unit: SkillUnit;
  test: Q810Test;
  signedIn?: boolean;
  canSubmit?: boolean;
}) {
  const fam = skill.family;
  const color = FAMILY[fam];
  const questions = test.questions;

  const [phase, setPhase] = useState<Phase>("directions");
  const [qIdx, setQIdx] = useState(0);
  const [left, setLeft] = useState(Q810_READ_SECONDS);
  const [recs, setRecs] = useState<Record<number, Rec>>({});
  const [recording, setRecording] = useState(false);
  const [imgError, setImgError] = useState(false);

  const q = questions[qIdx];

  // ── Phát audio đề (lời dẫn + câu hỏi) ──────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);

  /** Hết hàng đợi audio → vào 3 giây chuẩn bị (mọi câu đều 3 giây). */
  const goPrep = useCallback(() => {
    queueRef.current = [];
    setPhase("prep");
    setLeft(Q810_PREP_SECONDS);
  }, []);

  const playNextInQueue = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) return goPrep();
    const el = audioRef.current;
    if (!el) return goPrep();
    el.src = next;
    // Trình duyệt chặn phát → vào thẳng phần chuẩn bị cho khỏi kẹt màn hình
    el.play().catch(goPrep);
  }, [goPrep]);

  /** Vào một câu: xếp hàng audio cần phát rồi bật. Câu 8 nghe lời dẫn trước. */
  const beginQuestion = useCallback(
    (i: number) => {
      setQIdx(i);
      queueRef.current = i === 0 ? [test.introAudioUrl, questions[i].audioUrl] : [questions[i].audioUrl];
      setPhase("listen");
      playNextInQueue();
    },
    [test.introAudioUrl, questions, playNextInQueue],
  );

  // ── Ghi âm ────────────────────────────────────────────────────────
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadedRef = useRef<Record<number, { url: string; publicId: string }>>({});

  const stopRec = useCallback(() => {
    try { if (mediaRef.current?.state === "recording") mediaRef.current.stop(); } catch { /* noop */ }
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
      const at = qIdx;
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!blob.size) return;
        setRecs((prev) => {
          if (prev[at]) URL.revokeObjectURL(prev[at].url);
          return { ...prev, [at]: { url: URL.createObjectURL(blob), blob } };
        });
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      // mic bị từ chối → vẫn chạy đúng nhịp thời gian, chỉ không ghi được
      setRecording(false);
    }
  }, [qIdx]);

  // ── Chuyển giai đoạn ──────────────────────────────────────────────
  const goRespond = useCallback(() => {
    setPhase("respond");
    setLeft(questions[qIdx].responseSeconds);
    startRec();
  }, [questions, qIdx, startRec]);

  const finishAnswer = useCallback(() => {
    stopRec();
    const next = qIdx + 1;
    if (next < questions.length) beginQuestion(next);
    else setPhase("review");
  }, [qIdx, questions.length, stopRec, beginQuestion]);

  // Đồng hồ đếm ngược cho giai đoạn có giới hạn thời gian —
  // giây cuối cùng trôi qua mới chuyển giai đoạn, nên đủ đúng số giây của ETS.
  useEffect(() => {
    if (phase !== "read" && phase !== "prep" && phase !== "respond") return;
    const t = setTimeout(() => {
      if (left > 1) {
        setLeft(left - 1);
        return;
      }
      setLeft(0);
      if (phase === "read") beginQuestion(0);
      else if (phase === "prep") goRespond();
      else finishAnswer();
    }, 1000);
    return () => clearTimeout(t);
  }, [left, phase, beginQuestion, goRespond, finishAnswer]);

  useEffect(() => () => stopRec(), [stopRec]);

  function start() {
    setPhase("read");
    setLeft(Q810_READ_SECONDS);
  }

  function restart() {
    stopRec();
    setRecs((prev) => {
      Object.values(prev).forEach((r) => URL.revokeObjectURL(r.url));
      return {};
    });
    uploadedRef.current = {};
    setQIdx(0);
    setPhase("directions");
    setLeft(Q810_READ_SECONDS);
  }

  /** Upload ghi âm lên Cloudinary rồi trả về item để lưu vào sổ tay. */
  async function buildItems(): Promise<SubmissionItem[]> {
    const out: SubmissionItem[] = [];
    for (let i = 0; i < questions.length; i++) {
      const rec = recs[i];
      let up = uploadedRef.current[i];
      if (rec && !up) {
        const file = new File([rec.blob], `speaking-q8-10-${test.slug}-q${questions[i].n}.webm`, { type: "audio/webm" });
        up = await uploadToCloudinary(file);
        uploadedRef.current[i] = up;
      }
      out.push({
        idx: i,
        prompt: `Question ${questions[i].n}${questions[i].transcript ? ` — ${questions[i].transcript}` : ""}`,
        imageUrl: test.imageUrl,
        audioUrl: rec ? up?.url : undefined,
        audioPublicId: rec ? up?.publicId : undefined,
      });
    }
    return out;
  }

  const listHref = `/skills/${skill.slug}/${unit.slug}`;
  const testName = `${skill.label} · ${unit.label} · ${test.title}`;
  const mmss = (s: number) => `00:${String(Math.max(0, s)).padStart(2, "0")}`;

  const nav =
    phase === "directions"
      ? [{ label: "Bắt đầu ▶", variant: "primary" as const, onClick: start }]
      : phase === "read"
      ? [{ label: "Đọc xong — vào câu hỏi ▶", variant: "primary" as const, onClick: () => beginQuestion(0) }]
      : phase === "listen"
      ? [{ label: "Đang phát câu hỏi…", variant: "primary" as const, disabled: true }]
      : phase === "prep"
      ? [{ label: "Trả lời ngay ▶", variant: "primary" as const, onClick: goRespond }]
      : phase === "respond"
      ? [{ label: "Kết thúc trả lời ✓", variant: "primary" as const, onClick: finishAnswer }]
      : [
          { label: "Làm lại bộ đề", variant: "ghost" as const, onClick: restart },
          { label: "Xong — chọn bộ đề khác ▶", variant: "primary" as const, href: listHref },
        ];

  const questionLabel = phase === "directions" || phase === "read" ? undefined : `Question ${q.n} / 10`;

  return (
    <ExamShell family={fam} testName={testName} questionLabel={questionLabel} exitHref={listHref} nav={nav}>
      <ExamDirHeading family={fam}>Questions 8-10: Respond to questions using information provided</ExamDirHeading>

      <audio ref={audioRef} onEnded={playNextInQueue} onError={playNextInQueue} style={{ display: "none" }} />

      {phase === "directions" ? (
        <Directions onStart={start} color={color.primary} />
      ) : (
        <>
          {/* Bảng thông tin — luôn hiện như thi thật */}
          <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, overflow: "hidden", background: "#fff", marginBottom: 12 }}>
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={test.imageUrl} alt={test.title} onError={() => setImgError(true)} style={{ width: "100%", height: "auto", display: "block" }} />
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: EXAM.muted, fontSize: "0.85rem" }}>Không tải được bảng thông tin 🖼️</div>
            )}
          </div>

          {phase === "read" && (
            <>
              <div style={{ marginBottom: 12 }}>
                <TimerCard label="Reading time" value={mmss(left)} active color={color.primary} />
              </div>
              <p style={{ fontSize: "0.92rem", color: EXAM.inkSoft, textAlign: "center", margin: 0 }}>
                Đọc kỹ bảng thông tin trong 45 giây. Hết giờ, phần câu hỏi sẽ tự bắt đầu.
              </p>
            </>
          )}

          {(phase === "listen" || phase === "prep" || phase === "respond") && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <TimerCard label="Preparation time" value={mmss(phase === "prep" ? left : q.prepSeconds)} active={phase === "prep"} color={color.primary} />
                <TimerCard label="Response time" value={mmss(phase === "respond" ? left : q.responseSeconds)} active={phase === "respond"} color={EXAM.bad} live={phase === "respond"} />
              </div>

              {phase === "listen" && (
                <p style={{ fontSize: "0.92rem", color: EXAM.inkSoft, textAlign: "center", margin: 0, fontWeight: 600 }}>
                  🔊 {qIdx === 0 ? "Nghe lời dẫn và câu hỏi 8…" : `Nghe câu hỏi ${q.n}…`}
                  {q.n === 10 && " (câu 10 được đọc 2 lần)"}
                </p>
              )}
              {phase === "prep" && (
                <p style={{ fontSize: "0.92rem", color: EXAM.inkSoft, textAlign: "center", margin: 0 }}>
                  Chuẩn bị 3 giây — tìm nhanh dòng thông tin cần dùng.
                </p>
              )}
              {phase === "respond" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontSize: "0.84rem", color: EXAM.bad, fontWeight: 700 }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: recording ? EXAM.bad : EXAM.muted }} />
                  {recording ? "Đang ghi âm…" : "Đang trả lời (mic không bật)"}
                </div>
              )}
            </>
          )}

          {phase === "review" && (
            <div>
              {questions.map((item, i) => (
                <div key={item.n} style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 800, color: EXAM.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                    Question {item.n} · {item.responseSeconds} giây
                  </p>
                  {item.transcript ? (
                    <p style={{ fontSize: "0.98rem", color: EXAM.ink, lineHeight: 1.6, margin: "0 0 8px" }}>{item.transcript}</p>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: EXAM.muted, margin: "0 0 8px" }}>(chưa có lời câu hỏi — nghe lại bên dưới)</p>
                  )}
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontSize: "0.72rem", color: EXAM.muted, fontWeight: 700 }}>Câu hỏi</label>
                    <audio controls src={item.audioUrl} style={{ width: "100%" }} />
                    {recs[i] && (
                      <>
                        <label style={{ fontSize: "0.72rem", color: EXAM.muted, fontWeight: 700, marginTop: 4 }}>Bài nói của bạn</label>
                        <audio controls src={recs[i].url} style={{ width: "100%" }} />
                      </>
                    )}
                  </div>
                </div>
              ))}

              {signedIn && Object.keys(recs).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <SubmissionPanel
                    variant="exam"
                    skill={skill.slug}
                    unit={unit.slug}
                    testKey={test.slug}
                    title={testName}
                    canSubmit={canSubmit}
                    buildItems={buildItems}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </ExamShell>
  );
}

function Directions({ onStart, color }: { onStart: () => void; color: string }) {
  return (
    <div>
      <div style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "16px 18px", marginBottom: 14 }}>
        <p style={{ fontSize: "0.97rem", color: EXAM.ink, lineHeight: 1.7, margin: 0 }}>
          In this part, you will answer three questions based on the information provided.
          You will have 45 seconds to read the information before the questions begin.
          For each question, you will have 3 seconds to prepare.
          You will have 15 seconds to respond to Questions 8 and 9, and 30 seconds to respond to Question 10.
        </p>
      </div>
      <ul style={{ margin: "0 0 16px", paddingLeft: "1.1rem" }}>
        <li style={{ fontSize: "0.88rem", color: EXAM.inkSoft, lineHeight: 1.6, marginBottom: 4 }}>
          Câu hỏi <strong>chỉ được nghe</strong>, không hiện chữ — hãy tập bắt từ khoá (What time / Who / How much…).
        </li>
        <li style={{ fontSize: "0.88rem", color: EXAM.inkSoft, lineHeight: 1.6, marginBottom: 4 }}>
          Câu 10 được đọc <strong>2 lần</strong> và thường yêu cầu kể lại nhiều dòng thông tin liền nhau.
        </li>
        <li style={{ fontSize: "0.88rem", color: EXAM.inkSoft, lineHeight: 1.6 }}>
          Bấm Bắt đầu để bật tiếng và ghi âm — bài nói của bạn được giữ lại để nghe lại ở cuối.
        </li>
      </ul>
      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={onStart}
          style={{ padding: "11px 30px", border: "none", background: color, color: "#fff", borderRadius: 8, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Bắt đầu ▶
        </button>
      </div>
    </div>
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
