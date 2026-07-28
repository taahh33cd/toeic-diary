"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { partMeta } from "@/lib/full-tests/parts";
import { scoreAttempt } from "@/lib/full-tests/scoring";
import type {
  FullTest, FullTestGroup, FullTestQuestion, GlossaryTerm, PartNumber,
} from "@/lib/full-tests/types";
import { PALETTE, type Palette, type Skin } from "./theme";
import type { RunConfig } from "./SetupPanel";

type Filter = "wrong" | "marked" | "blank" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "wrong", label: "Câu sai" },
  { key: "blank", label: "Chưa làm" },
  { key: "marked", label: "Đã đánh dấu" },
  { key: "all", label: "Tất cả" },
];

/** Dưới ngưỡng này thì gợi ý luyện thêm part đó. */
const WEAK_THRESHOLD = 0.6;

function practiceHref(part: PartNumber) {
  const skill = partMeta(part).section === "listening" ? "listening" : "reading";
  return `/skills/${skill}/part${part}`;
}

export function ReviewPanel({
  test, config, answers, marked, skin, onToggleSkin, onRetry, canSaveVocab,
}: {
  test: FullTest;
  config: RunConfig;
  answers: Record<number, string>;
  marked: number[];
  skin: Skin;
  onToggleSkin: () => void;
  onRetry: () => void;
  canSaveVocab: boolean;
}) {
  const P = PALETTE[skin];
  const [filter, setFilter] = useState<Filter>("wrong");
  const markedSet = useMemo(() => new Set(marked), [marked]);

  const result = useMemo(
    () => scoreAttempt(test, answers, config.parts as PartNumber[]),
    [test, answers, config.parts],
  );

  const chosen = useMemo(() => new Set(config.parts), [config.parts]);

  function matches(q: FullTestQuestion) {
    if (q.broken || !q.answer) return false;
    const picked = answers[q.number];
    switch (filter) {
      case "wrong": return Boolean(picked) && picked !== q.answer;
      case "blank": return !picked;
      case "marked": return markedSet.has(q.number);
      case "all": return true;
    }
  }

  const groups = useMemo(
    () =>
      test.groups
        .filter((g) => chosen.has(g.part))
        .map((g) => ({ group: g, questions: g.questions.filter(matches) }))
        .filter((x) => x.questions.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [test.groups, chosen, filter, answers, markedSet],
  );

  const counts = useMemo(() => {
    let wrong = 0, blank = 0, all = 0;
    for (const g of test.groups) {
      if (!chosen.has(g.part)) continue;
      for (const q of g.questions) {
        if (q.broken || !q.answer) continue;
        all++;
        const p = answers[q.number];
        if (!p) blank++;
        else if (p !== q.answer) wrong++;
      }
    }
    return { wrong, blank, all, marked: marked.length };
  }, [test.groups, chosen, answers, marked.length]);

  const weakParts = result.parts.filter((s) => s.gradable > 0 && s.accuracy < WEAK_THRESHOLD);

  const card: React.CSSProperties = {
    background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, padding: "1.2rem 1.3rem",
  };
  const h2: React.CSSProperties = {
    fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em",
    textTransform: "uppercase", color: P.muted, margin: "0 0 0.9rem",
  };

  return (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.ink, fontFamily: P.sans, padding: "clamp(1.2rem, 3vw, 2.2rem) clamp(0.9rem, 3vw, 2rem)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: "1rem" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/skills/full-tests" style={{ fontSize: "0.86rem", color: P.muted, textDecoration: "none" }}>
            ← Danh sách đề
          </Link>
          <button type="button" onClick={onToggleSkin} style={{ background: "transparent", border: `1px solid ${P.border}`, borderRadius: 999, padding: "5px 12px", color: P.inkSoft, fontSize: "0.8rem", cursor: "pointer", fontFamily: P.sans }}>
            {skin === "light" ? "🌙 Tối" : "☀️ Sáng"}
          </button>
        </div>

        {/* Điểm */}
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: P.muted, margin: "0 0 0.5rem" }}>
            {test.title}
          </p>
          {result.scaled ? (
            <>
              <p style={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1, margin: "0 0 0.3rem", color: P.primary }}>
                {result.scaled.total}
              </p>
              <p style={{ fontSize: "0.95rem", color: P.inkSoft, margin: 0 }}>
                Listening {result.scaled.ls} · Reading {result.scaled.rd}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1, margin: "0 0 0.3rem", color: P.primary }}>
                {Math.round(result.accuracy * 100)}%
              </p>
              <p style={{ fontSize: "0.9rem", color: P.muted, margin: 0, lineHeight: 1.5 }}>
                Chỉ quy đổi điểm 10–990 khi làm đủ cả 7 part
              </p>
            </>
          )}
          <p style={{ fontSize: "0.88rem", color: P.inkSoft, margin: "0.7rem 0 0" }}>
            Đúng <strong>{result.correct}</strong> · Sai <strong>{counts.wrong}</strong> ·
            {" "}Chưa làm <strong>{counts.blank}</strong> / {result.gradable} câu
          </p>
        </div>

        {/* Theo part + gợi ý luyện thêm */}
        <div style={card}>
          <h2 style={h2}>Theo từng part</h2>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {result.parts.map((s) => {
              const meta = partMeta(s.part);
              const pct = Math.round(s.accuracy * 100);
              const color = pct >= 75 ? P.ok : pct >= 50 ? P.warn : P.bad;
              return (
                <div key={s.part}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.88rem", marginBottom: 4, gap: 10 }}>
                    <span><strong>{meta.label}</strong> <span style={{ color: P.muted }}>{meta.labelVi}</span></span>
                    <span style={{ fontVariantNumeric: "tabular-nums", color, fontWeight: 700, flexShrink: 0 }}>
                      {s.correct}/{s.gradable} · {pct}%
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: P.panelAlt, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {weakParts.length > 0 && (
            <div style={{ marginTop: "1.1rem", paddingTop: "0.9rem", borderTop: `1px solid ${P.borderSoft}` }}>
              <p style={{ fontSize: "0.88rem", margin: "0 0 0.6rem", color: P.inkSoft }}>
                Dưới 60% ở {weakParts.length} part — luyện riêng phần đó trước khi làm đề tiếp:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {weakParts.map((s) => (
                  <Link
                    key={s.part}
                    href={practiceHref(s.part)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999, border: `1px solid ${P.primary}`, background: P.primarySoft, color: P.primary, fontSize: "0.84rem", fontWeight: 700, textDecoration: "none" }}
                  >
                    Luyện {partMeta(s.part).label} →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bộ lọc */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const n = f.key === "wrong" ? counts.wrong
              : f.key === "blank" ? counts.blank
              : f.key === "marked" ? counts.marked
              : counts.all;
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "7px 14px", borderRadius: 999, fontFamily: P.sans,
                  fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                  background: on ? P.primary : P.panel,
                  color: on ? P.onPrimary : P.inkSoft,
                  border: `1px solid ${on ? P.primary : P.border}`,
                }}
              >
                {f.label} <span style={{ opacity: 0.8, fontVariantNumeric: "tabular-nums" }}>{n}</span>
              </button>
            );
          })}
        </div>

        {groups.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: P.muted }}>
            {filter === "wrong" ? "Không có câu nào sai. 🎉" : "Không có câu nào trong mục này."}
          </div>
        ) : (
          groups.map(({ group, questions }) => (
            <ReviewGroup
              key={`${group.part}-${group.questionStart}`}
              P={P}
              group={group}
              questions={questions}
              answers={answers}
              audioBase={test.audioBase}
              canSaveVocab={canSaveVocab}
            />
          ))
        )}

        <button
          type="button"
          onClick={onRetry}
          style={{ padding: "0.9rem", borderRadius: 11, border: "none", background: P.primary, color: P.onPrimary, fontFamily: P.sans, fontSize: "0.95rem", fontWeight: 800, cursor: "pointer" }}
        >
          Làm lại đề này
        </button>
      </div>
    </div>
  );
}

function ReviewGroup({
  P, group, questions, answers, audioBase, canSaveVocab,
}: {
  P: Palette;
  group: FullTestGroup;
  questions: FullTestQuestion[];
  answers: Record<number, string>;
  audioBase: string;
  canSaveVocab: boolean;
}) {
  const meta = partMeta(group.part);
  const [openMedia, setOpenMedia] = useState(false);
  const hasMedia = Boolean(group.audio || group.transcript || group.image || group.passages?.length);

  return (
    <section style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, padding: "1.1rem 1.2rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>
          {meta.label}
          <span style={{ color: P.muted, fontWeight: 600 }}>
            {" "}· {group.questionEnd > group.questionStart
              ? `Câu ${group.questionStart}–${group.questionEnd}`
              : `Câu ${group.questionStart}`}
          </span>
        </span>
        {hasMedia && (
          <button
            type="button"
            onClick={() => setOpenMedia((v) => !v)}
            style={{ background: "transparent", border: `1px solid ${P.border}`, borderRadius: 7, padding: "4px 11px", color: P.inkSoft, fontFamily: P.sans, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
          >
            {openMedia ? "Ẩn" : meta.hasAudio ? "Nghe lại & transcript" : "Xem lại bài đọc"}
          </button>
        )}
      </div>

      {openMedia && (
        <div style={{ marginBottom: "1rem", padding: "0.9rem 1rem", background: P.bg, border: `1px solid ${P.borderSoft}`, borderRadius: 10 }}>
          {group.audio && (
            <audio src={`${audioBase}/${group.audio}`} controls preload="none" style={{ width: "100%", height: 36, marginBottom: "0.7rem" }} />
          )}
          {group.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image} alt="" style={{ width: "100%", maxWidth: 460, borderRadius: 8, border: `1px solid ${P.border}`, background: "#fff", marginBottom: "0.7rem" }} />
          )}
          {group.transcript && (
            <div style={{ fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap", color: P.inkSoft }}>
              {group.transcript}
            </div>
          )}
          {group.passages?.map((ps, i) => (
            <div key={i} style={{ marginBottom: "0.8rem" }}>
              {(group.passages?.length ?? 0) > 1 && (
                <p style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: P.primary, margin: "0 0 0.4rem" }}>
                  {ps.label}
                </p>
              )}
              <div style={{ fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ps.text}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {questions.map((q) => (
          <ReviewQuestion
            key={q.number}
            P={P}
            q={q}
            picked={answers[q.number]}
            part={group.part}
            canSaveVocab={canSaveVocab}
          />
        ))}
      </div>
    </section>
  );
}

function ReviewQuestion({
  P, q, picked, part, canSaveVocab,
}: {
  P: Palette;
  q: FullTestQuestion;
  picked?: string;
  part: PartNumber;
  canSaveVocab: boolean;
}) {
  const exp = q.explanation;
  const letters = q.options ? Object.keys(q.options).sort() : [];
  const right = picked === q.answer;

  return (
    <div style={{ borderTop: `1px solid ${P.borderSoft}`, paddingTop: "0.9rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>Câu {q.number}</span>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: !picked ? P.panelAlt : right ? P.primarySoft : P.panelAlt, color: !picked ? P.muted : right ? P.ok : P.bad, border: `1px solid ${!picked ? P.border : right ? P.ok : P.bad}` }}>
          {!picked ? "Chưa làm" : right ? "Đúng" : `Bạn chọn ${picked} · đáp án ${q.answer}`}
        </span>
      </div>

      {q.prompt && (
        <p style={{ margin: "0 0 0.6rem", fontSize: "0.95rem", lineHeight: 1.55 }}>{q.prompt}</p>
      )}

      <div style={{ display: "grid", gap: 5, marginBottom: exp ? "0.8rem" : 0 }}>
        {letters.map((L) => {
          const isAnswer = q.answer === L;
          const isPicked = picked === L;
          const border = isAnswer ? P.ok : isPicked ? P.bad : P.borderSoft;
          return (
            <div
              key={L}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "0.5rem 0.7rem", borderRadius: 8,
                border: `${isAnswer || isPicked ? 2 : 1}px solid ${border}`,
                background: isAnswer ? P.primarySoft : "transparent",
                fontSize: "0.9rem", lineHeight: 1.45,
              }}
            >
              <span style={{ width: 23, height: 23, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 800, fontSize: "0.76rem", border: `1px solid ${border}`, color: isAnswer ? P.ok : isPicked ? P.bad : P.muted }}>
                {L}
              </span>
              <span>{q.options?.[L]}</span>
              <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: "0.75rem", fontWeight: 700 }}>
                {isAnswer && <span style={{ color: P.ok }}>✓ đáp án</span>}
                {isPicked && !isAnswer && <span style={{ color: P.bad }}>✗ bạn chọn</span>}
              </span>
            </div>
          );
        })}
      </div>

      {exp && (
        <div style={{ display: "grid", gap: "0.6rem", fontSize: "0.89rem", lineHeight: 1.65 }}>
          {exp.reasoning && (
            <p style={{ margin: 0, color: P.inkSoft, whiteSpace: "pre-wrap" }}>{exp.reasoning}</p>
          )}
          {exp.translation && (
            <p style={{ margin: 0, color: P.muted, whiteSpace: "pre-wrap" }}>{exp.translation}</p>
          )}
          {exp.raw && !exp.reasoning && !exp.translation && (
            <p style={{ margin: 0, color: P.inkSoft, whiteSpace: "pre-wrap" }}>{exp.raw}</p>
          )}
          {exp.glossary && exp.glossary.length > 0 && (
            <Glossary P={P} terms={exp.glossary} part={part} canSave={canSaveVocab} />
          )}
        </div>
      )}
    </div>
  );
}

function Glossary({
  P, terms, part, canSave,
}: { P: Palette; terms: GlossaryTerm[]; part: PartNumber; canSave: boolean }) {
  const [saved, setSaved] = useState<Record<string, "saving" | "ok" | "err">>({});

  async function save(t: GlossaryTerm) {
    setSaved((s) => ({ ...s, [t.term]: "saving" }));
    try {
      const r = await fetch("/api/vocab/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: t.term,
          vi: t.meaning,
          ipa: t.ipa,
          pos: t.pos,
          part,
          addedDate: new Date().toISOString().slice(0, 10),
          repCount: 0,
        }),
      });
      setSaved((s) => ({ ...s, [t.term]: r.ok ? "ok" : "err" }));
    } catch {
      setSaved((s) => ({ ...s, [t.term]: "err" }));
    }
  }

  return (
    <ul style={{ margin: 0, padding: "0.7rem 0.85rem", listStyle: "none", display: "grid", gap: 5, background: P.bg, border: `1px solid ${P.borderSoft}`, borderRadius: 9 }}>
      {terms.map((t, i) => {
        const st = saved[t.term];
        return (
          <li key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, color: P.inkSoft }}>
            <span style={{ flex: 1 }}>
              <strong>{t.term}</strong>
              {t.pos && <span style={{ color: P.muted }}> ({t.pos})</span>}
              {t.ipa && <span style={{ color: P.muted }}> /{t.ipa}/</span>}
              {": "}{t.meaning}
            </span>
            {canSave && (
              <button
                type="button"
                onClick={() => save(t)}
                disabled={st === "saving" || st === "ok"}
                title={st === "err" ? "Lưu không được, thử lại" : "Lưu vào sổ từ vựng"}
                style={{
                  flexShrink: 0, background: "transparent", border: "none", padding: 0,
                  cursor: st === "ok" ? "default" : "pointer", fontFamily: P.sans,
                  fontSize: "0.78rem", fontWeight: 700,
                  color: st === "ok" ? P.ok : st === "err" ? P.bad : P.primary,
                }}
              >
                {st === "ok" ? "✓ đã lưu" : st === "saving" ? "…" : st === "err" ? "thử lại" : "+ lưu"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
