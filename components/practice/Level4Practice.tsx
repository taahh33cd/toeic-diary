"use client";

import { useState } from "react";
import { getAiFeedback } from "@/app/actions/getAiFeedback";
import { Level3Feedback } from "@/lib/ai/gemini";
import { getTimeSpent } from "@/stores/practiceStore";
import { CheckCircle2, XCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface Sentence {
  id: string;
  content: string;
  speaker: string | null;
}

interface Props {
  lessonId: string;
  sentences: Sentence[];
  transcriptFull: string;
  startTime: number | null;
  onScored: (score: number) => void;
}

export function Level4Practice({ lessonId, sentences, transcriptFull, startTime, onScored }: Props) {
  const [userSummary, setUserSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Level3Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const result = await getAiFeedback({
        level: 3,
        dbLevel: 4,
        lessonId,
        transcript: transcriptFull,
        userSummary,
        timeSpentSeconds: getTimeSpent(startTime),
      }) as Level3Feedback;
      setFeedback(result);
      onScored(result.accuracyScore);
    } catch (e: any) {
      const msg: string = e?.message ?? String(e);
      if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
        setError("AI server đang quá tải. Vui lòng thử lại sau 30 giây.");
      } else if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        setError("Hết quota API hôm nay. Thử lại vào ngày mai hoặc tạo API key mới.");
      } else {
        setError(`Lỗi AI: ${msg.substring(0, 120)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    setUserSummary("");
    setFeedback(null);
    setError(null);
    setShowTranscript(false);
  }

  const score = feedback?.accuracyScore ?? null;

  return (
    <div className="space-y-5">
      {/* Instruction box — dashed border with icon */}
      <div className="flex items-start gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border)]">
        <Sparkles size={18} className="text-[var(--practice-accent)] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Nghe xong, viết tóm tắt những gì bạn nghe được bằng tiếng Anh. AI sẽ đánh giá mức độ hiểu.
        </p>
      </div>

      <div>
        <textarea
          value={userSummary}
          onChange={(e) => setUserSummary(e.target.value)}
          disabled={!!feedback || loading}
          placeholder="Write a summary of what you heard..."
          className="w-full min-h-[320px] p-6 rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-base resize-none outline-none focus:border-[var(--practice-accent)] transition-colors disabled:opacity-60 shadow-sm"
        />
        {!feedback && (
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center select-none">
            ⌨ Viết tóm tắt bằng tiếng Anh · bấm "Nhận AI Feedback" để gửi
          </p>
        )}
      </div>

      {error && (
        <div className="card p-3 mb-4 border-red-400 text-red-400 text-sm" style={{ borderWidth: "1px" }}>
          {error}
        </div>
      )}

      {feedback && score !== null && (
        <div className="card p-4 mb-4 flex items-center gap-4" style={{ borderWidth: "1.5px", borderColor: score >= 70 ? "var(--accent-green)" : "rgb(251 146 60)" }}>
          {score >= 70 ? <CheckCircle2 size={28} className="text-[var(--accent-green)] flex-shrink-0" /> : <XCircle size={28} className="text-orange-400 flex-shrink-0" />}
          <div className="flex-1">
            <div className="font-display font-bold text-xl text-[var(--text-primary)]">
              {score}/100
              <span className={`ml-2 text-sm font-normal ${score >= 70 ? "text-[var(--accent-green)]" : "text-orange-400"}`}>
                {score >= 70 ? "✓ Đạt" : "Cần luyện thêm"}
              </span>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">AI accuracy score</div>
          </div>
          <button onClick={handleRetry} className="btn-secondary text-sm px-4 py-2 rounded-lg">Thử lại</button>
        </div>
      )}

      {feedback && (
        <div className="space-y-3 mb-4">
          {feedback.captured.length > 0 && (
            <div className="card p-4">
              <div className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wide mb-2">✓ Nắm được</div>
              <ul className="space-y-1">
                {feedback.captured.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                    <span className="text-[var(--accent-green)] mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.missed.length > 0 && (
            <div className="card p-4">
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-2">✗ Bỏ sót</div>
              <ul className="space-y-1">
                {feedback.missed.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.vocabulary.length > 0 && (
            <div className="card p-4">
              <div className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wide mb-2">📚 Từ vựng</div>
              <ul className="space-y-1.5">
                {feedback.vocabulary.map((v, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)]">
                    <span className="font-mono font-bold text-[var(--text-primary)]">{v.word}</span>
                    <span className="text-[var(--text-muted)] ml-2">— {v.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.suggestion && (
            <div className="card p-4 bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30" style={{ borderWidth: "1px" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-[var(--accent-primary)]" />
                <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wide">AI Feedback</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feedback.suggestion}</p>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
        >
          {showTranscript ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showTranscript ? "Ẩn transcript" : "Xem transcript đầy đủ"}
        </button>
      )}

      {showTranscript && (
        <div className="card p-4 mb-6 bg-[var(--bg-secondary)]">
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-3">Transcript</div>
          {sentences.map((s) => (
            <p key={s.id} className="text-sm text-[var(--text-secondary)] mb-2 leading-relaxed">
              {s.speaker && (
                <span className={`font-bold mr-2 ${s.speaker === "W" ? "text-pink-400" : s.speaker === "M" ? "text-blue-400" : "text-[var(--text-muted)]"}`}>
                  [{s.speaker}]
                </span>
              )}
              {s.content}
            </p>
          ))}
        </div>
      )}

      {!feedback && (
        <button
          onClick={handleSubmit}
          disabled={loading || userSummary.trim().length < 10}
          className="w-full h-14 bg-[var(--practice-accent)] text-white rounded-xl flex items-center justify-center gap-2 text-base font-semibold shadow-lg shadow-[var(--practice-accent)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />AI đang phân tích...</>
          ) : (
            <><Sparkles size={18} />Nhận AI Feedback</>
          )}
        </button>
      )}
    </div>
  );
}
