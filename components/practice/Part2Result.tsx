"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface Sentence {
  id: string;
  content: string;
  optionLabel?: string | null;
}

interface Props {
  sentences: Sentence[];
  answerRevealed: boolean;
  selectedOption: string | null;
  correctOption: string | null;
  explanation: string | null;
  onSelect: (opt: string) => void;
}

export function Part2Result({ sentences, answerRevealed, selectedOption, correctOption, explanation, onSelect }: Props) {
  const optionSentences = sentences.filter((s) => s.optionLabel);
  const isCorrect = selectedOption === correctOption;

  if (!answerRevealed) {
    return (
      <div className="flex flex-col gap-4 py-6">
        {/* Transcript */}
        <div className="card p-4 flex flex-col gap-2">
          {sentences.map((s) => (
            <div key={s.id} className="flex items-start gap-2 text-sm">
              {s.optionLabel ? (
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                  {s.optionLabel}
                </span>
              ) : (
                <span className="flex-shrink-0 w-6 h-6" />
              )}
              <span className="text-[var(--text-primary)] leading-relaxed">{s.content}</span>
            </div>
          ))}
        </div>

        {/* Answer buttons */}
        <div className="card p-5">
          <p className="text-sm font-bold text-[var(--text-primary)] mb-4">Chọn đáp án đúng:</p>
          <div className="flex gap-3">
            {optionSentences.map((s) => (
              <button
                key={s.optionLabel}
                onClick={() => onSelect(s.optionLabel!)}
                className="w-12 h-12 rounded-xl border-2 border-[var(--border-primary)] font-bold text-lg hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                {s.optionLabel}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Result view
  return (
    <div className="flex flex-col gap-4 py-6">
      {/* Status header */}
      <div className={`flex items-center gap-4 p-4 rounded-2xl ${isCorrect ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
        {isCorrect
          ? <CheckCircle2 size={32} className="text-emerald-400 flex-shrink-0" />
          : <XCircle size={32} className="text-red-400 flex-shrink-0" />}
        <div>
          <p className={`font-bold text-xl ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
            {isCorrect ? "Chính xác!" : "Chưa đúng"}
          </p>
          {correctOption && (
            <p className="text-sm text-[var(--text-muted)]">
              Đáp án đúng: <span className="font-bold text-[var(--text-primary)]">{correctOption}</span>
            </p>
          )}
        </div>
      </div>

      {/* Transcript with highlights */}
      <div className="flex flex-col gap-1.5">
        {sentences.map((s) => {
          const isCorrectOpt = s.optionLabel === correctOption;
          const isWrongSelected = s.optionLabel === selectedOption && !isCorrectOpt;
          return (
            <div
              key={s.id}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${
                isCorrectOpt ? "bg-emerald-500/10" : isWrongSelected ? "bg-red-500/10" : ""
              }`}
            >
              {s.optionLabel ? (
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCorrectOpt ? "bg-emerald-500 text-white"
                  : isWrongSelected ? "bg-red-500 text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                }`}>
                  {s.optionLabel}
                </span>
              ) : (
                <span className="flex-shrink-0 w-6" />
              )}
              <span className={`text-sm leading-relaxed ${
                isCorrectOpt ? "text-emerald-400 font-medium"
                : isWrongSelected ? "text-red-400"
                : "text-[var(--text-secondary)]"
              }`}>
                {s.content}
              </span>
              {isCorrectOpt && (
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5 ml-auto" />
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="flex flex-col gap-2 pt-3 border-t border-[var(--border-primary)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Giải thích</p>
          {explanation.split(/(?<=\.)\s+/).filter(Boolean).map((line, i) => (
            <p key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
