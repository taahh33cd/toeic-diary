"use client";

import { X, BookOpen, FileText, Loader2 } from "lucide-react";

export interface VocabItem {
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

interface Props {
  transcript: string;
  vocabItems: VocabItem[] | null; // null = loading
  onClose: () => void;
}

export function TranscriptVocabModal({ transcript, vocabItems, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)]">
          <h2 className="font-bold text-base text-[var(--text-primary)]">
            Transcript &amp; Từ vựng
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-muted)]"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Transcript */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-[var(--practice-accent)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Transcript</span>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
              {transcript}
            </div>
          </section>

          {/* Vocabulary */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-[var(--practice-accent)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Từ vựng trọng điểm</span>
            </div>

            {vocabItems === null ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[var(--text-muted)]">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Đang phân tích từ vựng...</span>
              </div>
            ) : vocabItems.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">Không trích xuất được từ vựng.</p>
            ) : (
              <div className="space-y-2.5">
                {vocabItems.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-baseline gap-2.5 flex-wrap mb-1.5">
                      <span className="font-bold text-[var(--text-primary)] text-base">{item.word}</span>
                      {item.ipa && (
                        <span className="text-xs text-[var(--text-muted)] font-mono">{item.ipa}</span>
                      )}
                      {item.partOfSpeech && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--practice-accent)] font-semibold uppercase tracking-wide">
                          {item.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--practice-accent)] mb-1">{item.meaning}</p>
                    {item.example && (
                      <p className="text-xs text-[var(--text-secondary)] italic">&ldquo;{item.example}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
