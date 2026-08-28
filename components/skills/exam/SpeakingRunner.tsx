"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExamShell, ExamDirHeading } from "./ExamShell";
import { FAMILY, EXAM } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { SubmissionPanel } from "@/components/skills/SubmissionPanel";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import type { SubmissionItem } from "@/lib/submissions";

export type SpeakingMode = "practice" | "exam";

export interface SpeakingItem {
  /** Số câu trong đề thi thật (1, 5, 11…) */
  n: number;
  /** Audio đề, phát lần lượt trước phần chuẩn bị. Q1-2 không có audio. */
  audioUrls?: string[];
  /** Chữ hiện trên màn hình suốt bài — Q1-2 là đoạn văn phải đọc, Q11 là đề bài. */
  screenText?: string;
  /** Ảnh của câu — Q3-4 là bức ảnh phải tả, Q8-10 là bảng thông tin. */
  imageUrl?: string;
  imageAlt?: string;
  /** Q8-10: số giây đọc bảng thông tin trước khi câu hỏi bắt đầu. */
  readSeconds?: number;
  /** Màn Directions riêng chèn trước câu này — dùng ở bài thi thử trọn bộ. */
  directionsBefore?: { headline: string; text: string; tips?: string[] };
  /** Dòng tiêu đề riêng của câu, đè lên tiêu đề chung. */
  headline?: string;
  /** Lời câu hỏi. Thi thật chỉ được nghe nên chế độ Thi thử giấu đi tới màn xem lại. */
  transcript?: string;
  transcriptVi?: string;
  prepSeconds: number;
  responseSeconds: number;
  /** Nhãn nhỏ cạnh số câu (thể loại văn bản, dạng đề…) */
  badge?: string;
}

type Phase = "directions" | "groupdir" | "read" | "listen" | "prep" | "respond" | "review";
type Rec = { url: string; blob: Blob };

/**
 * Khung làm bài Speaking dùng chung cho Q1-2, Q5-7 và Q11.
 *
 * Thi thử  — đúng nhịp ETS: audio phát một lần, hết giờ tự chuyển, không hiện chữ câu hỏi.
 * Luyện tập — nghe lại tuỳ ý, hết giờ chuẩn bị không tự chuyển, hiện chữ và bản dịch,
 *             thu âm lại được bao nhiêu lần tuỳ ý.
 */
export function SpeakingRunner({
  skill,
  unit,
  mode,
  items,
  testTitle,
  testKey,
  headline,
  directions,
  context,
  tips,
  sampleVoice,
  totalQuestions,
  signedIn = false,
  canSubmit = false,
  backHref,
}: {
  skill: Skill;
  unit: SkillUnit;
  mode: SpeakingMode;
  items: SpeakingItem[];
  testTitle: string;
  testKey: string;
  /** Dòng tiêu đề kiểu ETS, vd "Questions 5-7: Respond to questions" */
  headline: string;
  /** Directions nguyên văn của ETS */
  directions: string;
  /** Bối cảnh hiện suốt bài — Q5-7 là lời dẫn tình huống */
  context?: { label: string; text: string; textVi?: string };
  tips?: string[];
  /** Cho nghe bản đọc mẫu bằng giọng trình duyệt (Q1-2, chỉ ở chế độ luyện tập) */
  sampleVoice?: boolean;
  /** Tổng số câu của bài thi thật — Speaking là 11, để thanh trên đọc "Question 5 / 11" */
  totalQuestions?: number;
  signedIn?: boolean;
  canSubmit?: boolean;
  backHref: string;
}) {
  const fam = skill.family;
  const color = FAMILY[fam];
  const practice = mode === "practice";

  const [phase, setPhase] = useState<Phase>("directions");
  const [qIdx, setQIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [recs, setRecs] = useState<Record<number, Rec>>({});
  const [recording, setRecording] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const item = items[qIdx];

  // ── Phát audio đề ─────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);

  const goPrep = useCallback(() => {
    queueRef.current = [];
    setPhase("prep");
    setLeft(items[qIdx]?.prepSeconds ?? 0);
  }, [items, qIdx]);

  const playNextInQueue = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) return goPrep();
    const el = audioRef.current;
    if (!el) return goPrep();
    el.src = next;
    // Trình duyệt chặn autoplay → vào thẳng phần chuẩn bị cho khỏi kẹt màn hình
    el.play().catch(() => {
      setAudioBlocked(true);
      goPrep();
    });
  }, [goPrep]);

  /** Phát audio của câu i; câu không có audio thì vào thẳng phần chuẩn bị. */
  const startAudio = useCallback(
    (i: number) => {
      setQIdx(i);
      const urls = items[i].audioUrls ?? [];
      if (!urls.length) {
        queueRef.current = [];
        setPhase("prep");
        setLeft(items[i].prepSeconds);
        return;
      }
      queueRef.current = [...urls];
      setPhase("listen");
      const next = queueRef.current.shift()!;
      const el = audioRef.current;
      if (!el) {
        setPhase("prep");
        setLeft(items[i].prepSeconds);
        return;
      }
      el.src = next;
      el.play().catch(() => {
        setAudioBlocked(true);
        setPhase("prep");
        setLeft(items[i].prepSeconds);
      });
    },
    [items],
  );

  /** Sau màn Directions của nhóm: Q8-10 có 45 giây đọc bảng, các câu khác vào thẳng audio. */
  const afterGroupDir = useCallback(
    (i: number) => {
      const read = items[i].readSeconds;
      if (read) {
        setQIdx(i);
        setPhase("read");
        setLeft(read);
        return;
      }
      startAudio(i);
    },
    [items, startAudio],
  );

  /** Vào một câu: hiện Directions riêng nếu có, rồi tới phần đọc/audio. */
  const beginQuestion = useCallback(
    (i: number) => {
      setQIdx(i);
      if (items[i].directionsBefore) {
        setPhase("groupdir");
        setLeft(0);
        return;
      }
      afterGroupDir(i);
    },
    [items, afterGroupDir],
  );

  /** Luyện tập: nghe lại câu hỏi bao nhiêu lần tuỳ ý. */
  const replay = useCallback(() => {
    const urls = items[qIdx].audioUrls ?? [];
    if (!urls.length) return;
    queueRef.current = urls.slice(1);
    const el = audioRef.current;
    if (!el) return;
    setPhase("listen");
    el.src = urls[0];
    el.play().catch(() => setPhase("prep"));
  }, [items, qIdx]);

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
        // Thu lại thì bản ghi cũ trên Cloudinary không còn đúng nữa
        delete uploadedRef.current[at];
        setRecs((prev) => {
          if (prev[at]) URL.revokeObjectURL(prev[at].url);
          return { ...prev, [at]: { url: URL.createObjectURL(blob), blob } };
        });
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      // Mic bị từ chối → vẫn chạy đúng nhịp thời gian, chỉ không ghi được
      setRecording(false);
    }
  }, [qIdx]);

  // ── Chuyển giai đoạn ──────────────────────────────────────────────
  const goRespond = useCallback(() => {
    setPhase("respond");
    setLeft(items[qIdx].responseSeconds);
    startRec();
  }, [items, qIdx, startRec]);

  const nextQuestion = useCallback(() => {
    stopRec();
    const next = qIdx + 1;
    if (next < items.length) beginQuestion(next);
    else setPhase("review");
  }, [qIdx, items.length, stopRec, beginQuestion]);

  /** Hết giờ nói: thi thử chuyển câu luôn, luyện tập chỉ dừng ghi để học viên tự quyết. */
  const responseTimeUp = useCallback(() => {
    if (practice) {
      stopRec();
      return;
    }
    nextQuestion();
  }, [practice, stopRec, nextQuestion]);

  // Đồng hồ đếm ngược — giây cuối trôi qua mới chuyển, nên đủ đúng số giây của ETS.
  useEffect(() => {
    if (phase !== "prep" && phase !== "respond" && phase !== "read") return;
    if (left <= 0) return;
    const t = setTimeout(() => {
      if (left > 1) {
        setLeft(left - 1);
        return;
      }
      setLeft(0);
      if (phase === "read") {
        startAudio(qIdx);
      } else if (phase === "prep") {
        // Luyện tập: hết giờ chuẩn bị KHÔNG tự chuyển, chờ học viên bấm
        if (!practice) goRespond();
      } else {
        responseTimeUp();
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [left, phase, practice, qIdx, startAudio, goRespond, responseTimeUp]);

  useEffect(() => () => stopRec(), [stopRec]);

  // ── Bản đọc mẫu bằng giọng trình duyệt (Q1-2) ─────────────────────
  const [speaking, setSpeaking] = useState(false);
  const speakSample = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const text = items[qIdx].screenText;
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [items, qIdx]);

  const stopSpeak = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => () => { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); }, []);

  function start() {
    beginQuestion(0);
  }

  function restart() {
    stopRec();
    stopSpeak();
    setRecs((prev) => {
      Object.values(prev).forEach((r) => URL.revokeObjectURL(r.url));
      return {};
    });
    uploadedRef.current = {};
    setQIdx(0);
    setPhase("directions");
    setLeft(0);
  }

  /** Upload ghi âm lên Cloudinary rồi trả về item để lưu vào sổ tay. */
  async function buildItems(): Promise<SubmissionItem[]> {
    const out: SubmissionItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const rec = recs[i];
      let up = uploadedRef.current[i];
      if (rec && !up) {
        const file = new File([rec.blob], `${skill.slug}-${unit.slug}-${testKey}-q${items[i].n}.webm`, { type: "audio/webm" });
        up = await uploadToCloudinary(file);
        uploadedRef.current[i] = up;
      }
      const prompt = items[i].screenText ?? items[i].transcript ?? `Question ${items[i].n}`;
      out.push({
        idx: i,
        prompt: `Question ${items[i].n} — ${prompt}`,
        imageUrl: items[i].imageUrl,
        audioUrl: rec ? up?.url : undefined,
        audioPublicId: rec ? up?.publicId : undefined,
      });
    }
    return out;
  }

  const testName = `${testTitle} · ${practice ? "Luyện tập" : "Thi thử"}`;
  const mmss = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

  // Chế độ luyện tập mới hiện chữ câu hỏi lúc đang làm bài
  const showText = practice;

  const nav: React.ComponentProps<typeof ExamShell>["nav"] =
    phase === "directions"
      ? [{ label: "Bắt đầu ▶", variant: "primary", onClick: start }]
      : phase === "groupdir"
      ? [{ label: "Tiếp tục ▶", variant: "primary", onClick: () => afterGroupDir(qIdx) }]
      : phase === "read"
      ? [{ label: "Đọc xong — vào câu hỏi ▶", variant: "primary", onClick: () => startAudio(qIdx) }]
      : phase === "listen"
      ? practice
        ? [
            { label: "Bỏ qua ⏭", variant: "ghost", onClick: goPrep },
            { label: "Đang phát câu hỏi…", variant: "primary", disabled: true },
          ]
        : [{ label: "Đang phát câu hỏi…", variant: "primary", disabled: true }]
      : phase === "prep"
      ? [
          ...(practice && (items[qIdx].audioUrls?.length ?? 0) > 0
            ? [{ label: "🔊 Nghe lại", variant: "ghost" as const, onClick: replay }]
            : []),
          ...(practice && sampleVoice
            ? [{ label: speaking ? "⏹ Dừng bản mẫu" : "🔈 Nghe bản đọc mẫu", variant: "ghost" as const, onClick: speaking ? stopSpeak : speakSample }]
            : []),
          { label: "Trả lời ngay ▶", variant: "primary", onClick: () => { stopSpeak(); goRespond(); } },
        ]
      : phase === "respond"
      ? practice
        ? [
            { label: "⟳ Thu lại", variant: "ghost", onClick: () => { stopRec(); goRespond(); } },
            { label: left > 0 ? "Kết thúc trả lời ✓" : "Câu tiếp ▶", variant: "primary", onClick: nextQuestion },
          ]
        : [{ label: "Kết thúc trả lời ✓", variant: "primary", onClick: nextQuestion }]
      : [
          { label: "Làm lại", variant: "ghost", onClick: restart },
          { label: "Xong — chọn bộ đề khác ▶", variant: "primary", href: backHref },
        ];

  const questionLabel =
    phase === "directions" ? undefined : `Question ${item.n} / ${totalQuestions ?? items[items.length - 1].n}`;
  const timer = phase === "prep" || phase === "respond" || phase === "read" ? mmss(left) : undefined;
  const shownHeadline = phase === "directions" ? headline : item.headline ?? headline;

  return (
    <ExamShell family={fam} testName={testName} questionLabel={questionLabel} timer={timer} exitHref={backHref} nav={nav}>
      <ExamDirHeading family={fam}>{shownHeadline}</ExamDirHeading>

      <audio ref={audioRef} onEnded={playNextInQueue} onError={playNextInQueue} style={{ display: "none" }} />

      {phase === "groupdir" && item.directionsBefore ? (
        <div>
          <div style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "16px 18px", marginBottom: 14 }}>
            <p style={{ fontSize: "0.97rem", color: EXAM.ink, lineHeight: 1.7, margin: 0 }}>{item.directionsBefore.text}</p>
          </div>
          {item.directionsBefore.tips && (
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {item.directionsBefore.tips.map((t, i) => (
                <li key={i} style={{ fontSize: "0.88rem", color: EXAM.inkSoft, lineHeight: 1.6, marginBottom: 4 }}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      ) : phase === "directions" ? (
        <Directions
          directions={directions}
          tips={tips}
          mode={mode}
          context={context}
          showContextVi={practice}
        />
      ) : phase === "review" ? (
        <Review
          items={items}
          recs={recs}
          color={color.primary}
          signedIn={signedIn}
          canSubmit={canSubmit}
          skill={skill}
          unit={unit}
          testKey={testKey}
          testName={testName}
          buildItems={buildItems}
        />
      ) : (
        <>
          {context && (
            <div style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "10px 13px", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: EXAM.muted }}>
                {context.label}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.92rem", lineHeight: 1.6, color: EXAM.ink }}>{context.text}</p>
              {practice && context.textVi && (
                <p style={{ margin: "5px 0 0", fontSize: "0.83rem", lineHeight: 1.55, color: EXAM.muted, fontStyle: "italic" }}>{context.textVi}</p>
              )}
            </div>
          )}

          {/* Ảnh của câu — Q3-4 (ảnh tả) và Q8-10 (bảng thông tin) */}
          {item.imageUrl && (
            <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, overflow: "hidden", background: "#fff", marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.imageAlt ?? ""} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          )}

          {/* Đoạn văn / đề bài hiện suốt bài — Q1-2 và Q11 */}
          {item.screenText && (
            <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, background: "#fff", padding: "16px 18px", marginBottom: 12 }}>
              {item.badge && (
                <p style={{ margin: "0 0 8px", fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: color.primary }}>
                  {item.badge}
                </p>
              )}
              <p style={{ margin: 0, fontSize: "1.06rem", lineHeight: 1.85, color: EXAM.ink }}>{item.screenText}</p>
              {practice && item.transcriptVi && (
                <p style={{ margin: "8px 0 0", fontSize: "0.85rem", lineHeight: 1.6, color: EXAM.muted, fontStyle: "italic" }}>{item.transcriptVi}</p>
              )}
            </div>
          )}

          {/* Lời câu hỏi — chỉ hiện ở chế độ luyện tập */}
          {showText && !item.screenText && item.transcript && (
            <div style={{ border: `1px solid ${color.primary}33`, borderRadius: 8, background: color.soft, padding: "12px 14px", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: EXAM.ink, fontWeight: 600 }}>
                Question {item.n}: {item.transcript}
              </p>
              {item.transcriptVi && (
                <p style={{ margin: "5px 0 0", fontSize: "0.85rem", lineHeight: 1.55, color: EXAM.inkSoft, fontStyle: "italic" }}>{item.transcriptVi}</p>
              )}
            </div>
          )}

          {phase === "read" ? (
            <div style={{ marginBottom: 12 }}>
              <TimerCard label="Reading time" value={mmss(left)} active color={color.primary} />
            </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <TimerCard
              label="Preparation time"
              value={mmss(phase === "prep" ? left : item.prepSeconds)}
              active={phase === "prep"}
              color={color.primary}
            />
            <TimerCard
              label="Response time"
              value={mmss(phase === "respond" ? left : item.responseSeconds)}
              active={phase === "respond"}
              color={EXAM.bad}
              live={phase === "respond" && left > 0}
            />
          </div>
          )}

          {phase === "read" && (
            <p style={{ fontSize: "0.9rem", color: EXAM.inkSoft, textAlign: "center", margin: 0 }}>
              Đọc kỹ bảng thông tin. Hết giờ, phần câu hỏi sẽ tự bắt đầu.
            </p>
          )}

          {phase === "listen" && (
            <p style={{ fontSize: "0.92rem", color: EXAM.inkSoft, textAlign: "center", margin: 0, fontWeight: 600 }}>
              🔊 Đang phát câu hỏi {item.n}…
              {audioBlocked && " (trình duyệt chặn tự phát — bấm Nghe lại)"}
            </p>
          )}

          {phase === "prep" && (
            <p style={{ fontSize: "0.9rem", color: EXAM.inkSoft, textAlign: "center", margin: 0 }}>
              {left > 0
                ? `Chuẩn bị ${item.prepSeconds} giây.`
                : practice
                ? "Hết giờ chuẩn bị — thi thật sẽ tự chuyển. Bấm Trả lời khi bạn sẵn sàng."
                : "Chuyển sang phần trả lời…"}
            </p>
          )}

          {phase === "respond" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontSize: "0.84rem", color: left > 0 ? EXAM.bad : EXAM.muted, fontWeight: 700 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: recording ? EXAM.bad : EXAM.muted }} />
              {recording
                ? "Đang ghi âm…"
                : left > 0
                ? "Đang trả lời (mic không bật)"
                : "Hết giờ nói — bấm Thu lại để nói lại, hoặc Câu tiếp."}
            </div>
          )}
        </>
      )}
    </ExamShell>
  );
}

// ─────────────────────────────────────────────────────────────────────

function Directions({
  directions,
  tips,
  mode,
  context,
  showContextVi,
}: {
  directions: string;
  tips?: string[];
  mode: SpeakingMode;
  context?: { label: string; text: string; textVi?: string };
  showContextVi: boolean;
}) {
  return (
    <div>
      <div style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "16px 18px", marginBottom: 14 }}>
        <p style={{ fontSize: "0.97rem", color: EXAM.ink, lineHeight: 1.7, margin: 0 }}>{directions}</p>
      </div>

      {context && (
        <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: EXAM.muted }}>
            {context.label}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.94rem", lineHeight: 1.6, color: EXAM.ink }}>{context.text}</p>
          {showContextVi && context.textVi && (
            <p style={{ margin: "5px 0 0", fontSize: "0.84rem", lineHeight: 1.55, color: EXAM.muted, fontStyle: "italic" }}>{context.textVi}</p>
          )}
        </div>
      )}

      <div
        style={{
          border: `1px solid ${mode === "exam" ? "#f0c9cf" : "#cfe0f5"}`,
          background: mode === "exam" ? "#fdf2f3" : "#eff5fd",
          borderRadius: 8,
          padding: "10px 13px",
          marginBottom: 14,
        }}
      >
        <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: EXAM.inkSoft }}>
          {mode === "exam" ? (
            <>
              <strong>Chế độ Thi thử:</strong> audio chỉ phát một lần, hết giờ tự chuyển câu,
              không hiện chữ câu hỏi. Đúng nhịp phòng thi.
            </>
          ) : (
            <>
              <strong>Chế độ Luyện tập:</strong> nghe lại tuỳ ý, hết giờ chuẩn bị không bị đẩy đi,
              có chữ và bản dịch, thu âm lại được nhiều lần.
            </>
          )}
        </p>
      </div>

      {tips && tips.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          {tips.map((t, i) => (
            <li key={i} style={{ fontSize: "0.88rem", color: EXAM.inkSoft, lineHeight: 1.6, marginBottom: 4 }}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Review({
  items,
  recs,
  color,
  signedIn,
  canSubmit,
  skill,
  unit,
  testKey,
  testName,
  buildItems,
}: {
  items: SpeakingItem[];
  recs: Record<number, Rec>;
  color: string;
  signedIn: boolean;
  canSubmit: boolean;
  skill: Skill;
  unit: SkillUnit;
  testKey: string;
  testName: string;
  buildItems: () => Promise<SubmissionItem[]>;
}) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
          <p style={{ fontSize: "0.78rem", fontWeight: 800, color: EXAM.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
            Question {item.n} · {item.responseSeconds} giây
            {item.badge ? ` · ${item.badge}` : ""}
          </p>

          {item.imageUrl && (
            <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 6, overflow: "hidden", background: "#fff", margin: "0 0 8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.imageAlt ?? ""} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          )}

          {(item.screenText || item.transcript) && (
            <p style={{ fontSize: "0.96rem", color: EXAM.ink, lineHeight: 1.65, margin: "0 0 6px" }}>
              {item.screenText ?? item.transcript}
            </p>
          )}
          {item.transcriptVi && (
            <p style={{ fontSize: "0.84rem", color: EXAM.muted, lineHeight: 1.55, margin: "0 0 8px", fontStyle: "italic" }}>{item.transcriptVi}</p>
          )}

          <div style={{ display: "grid", gap: 6 }}>
            {item.audioUrls?.map((u, k) => (
              <div key={u} style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: "0.72rem", color: EXAM.muted, fontWeight: 700 }}>
                  {item.audioUrls!.length > 1 && k === 0 ? "Lời dẫn tình huống" : "Câu hỏi"}
                </label>
                <audio controls src={u} style={{ width: "100%" }} />
              </div>
            ))}
            {recs[i] ? (
              <>
                <label style={{ fontSize: "0.72rem", color: EXAM.muted, fontWeight: 700, marginTop: 4 }}>Bài nói của bạn</label>
                <audio controls src={recs[i].url} style={{ width: "100%" }} />
              </>
            ) : (
              <p style={{ fontSize: "0.8rem", color: EXAM.muted, margin: "4px 0 0" }}>Chưa ghi được bài nói của câu này.</p>
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
            testKey={testKey}
            title={testName}
            canSubmit={canSubmit}
            buildItems={buildItems}
          />
        </div>
      )}

      {!signedIn && (
        <p style={{ fontSize: "0.84rem", color: EXAM.muted, textAlign: "center", margin: "12px 0 0" }}>
          Đăng nhập để lưu bài nói và gửi giáo viên chấm.
        </p>
      )}

      <div style={{ height: 4, background: color, opacity: 0, marginTop: 0 }} />
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
