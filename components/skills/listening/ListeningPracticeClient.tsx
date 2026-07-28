"use client";

import { useEffect, useRef, useState } from "react";
import { ExamShell, ExamDirHeading } from "@/components/skills/exam/ExamShell";
import { FAMILY, EXAM } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import type { ListeningPart, PracticeQuestion } from "@/lib/listening-practice/types";

type Props = {
  skill: Skill;
  unit: SkillUnit;
  part: ListeningPart;
  testTitle: string;
  questions: PracticeQuestion[];
};

const color = FAMILY.lr;

/** Ảnh nguồn nhỏ (175–790px): cho phóng tối đa 1.6× để không vỡ hạt */
function imgMaxWidth(q: PracticeQuestion, cap: number) {
  return q.imageWidth ? Math.min(cap, Math.round(q.imageWidth * 1.6)) : cap;
}

export function ListeningPracticeClient({ skill, unit, part, testTitle, questions }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const q = questions[idx];
  const total = questions.length;
  const listHref = `/skills/${skill.slug}/${unit.slug}`;

  // Đổi câu → nạp audio mới và tự phát (trình duyệt có thể chặn tới khi user bấm)
  useEffect(() => {
    if (done) return;
    const el = audioRef.current;
    if (!el) return;
    el.load();
    el.play().catch(() => {});
  }, [idx, done]);

  function replay() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  function pick(id: string) {
    setAnswers((a) => ({ ...a, [q.number]: id }));
  }

  // ── Kết quả ────────────────────────────────────────────────────────────────
  if (done) {
    const scored = questions.filter((x) => x.audio);
    const correct = scored.filter((x) => answers[x.number] === x.answer).length;
    const score = scored.length ? Math.round((correct / scored.length) * 100) : 0;

    return (
      <ExamShell
        family="lr"
        testName={`${skill.label} · ${unit.label} · ${testTitle}`}
        exitHref={listHref}
        nav={[
          { label: "Làm lại", icon: "↻", onClick: () => { setAnswers({}); setIdx(0); setDone(false); } },
          { label: "Về danh sách đề", href: listHref, variant: "primary" },
        ]}
      >
        <div style={{ textAlign: "center", padding: "1.2rem 0.5rem 1.6rem" }}>
          <div style={{ fontSize: "2.5rem" }}>{score >= 60 ? "🎉" : "📋"}</div>
          <p style={{ fontSize: "1.05rem", fontWeight: 800, color: EXAM.ink, margin: "0.3rem 0" }}>Hoàn thành</p>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: score >= 60 ? EXAM.ok : color.primary, margin: 0 }}>{score}%</p>
          <p style={{ fontSize: "0.9rem", color: EXAM.inkSoft, marginTop: 6 }}>
            {correct}/{scored.length} câu đúng
            {scored.length < total ? ` · ${total - scored.length} câu bỏ qua (thiếu audio)` : ""}
          </p>
        </div>

        <ExamDirHeading family="lr">Xem lại &amp; nghe lại</ExamDirHeading>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((item) => {
            const picked = answers[item.number];
            const ok = picked === item.answer;
            const skipped = !item.audio;
            return (
              <div key={item.number} style={{ border: `1px solid ${EXAM.border}`, borderRadius: 9, padding: "12px 14px", background: EXAM.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, color: EXAM.ink }}>Câu {item.number}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: skipped ? EXAM.warn : ok ? EXAM.ok : EXAM.bad }}>
                    {skipped ? "— thiếu audio" : ok ? "✓ Đúng" : picked ? `✗ Chọn ${picked} · đúng là ${item.answer}` : `Chưa chọn · đúng là ${item.answer}`}
                  </span>
                  {item.audio && (
                     
                    <audio src={item.audio} controls preload="none" style={{ height: 32, marginLeft: "auto", maxWidth: "100%" }} />
                  )}
                </div>

                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={`Ảnh câu ${item.number}`} style={{ display: "block", width: "100%", maxWidth: imgMaxWidth(item, 420), borderRadius: 7, border: `1px solid ${EXAM.border}`, marginBottom: 9 }} />
                )}

                {part === 2 && (
                  <p style={{ margin: "0 0 7px", fontSize: "0.96rem", color: EXAM.ink, fontWeight: 600, lineHeight: 1.5 }}>
                    {item.prompt}
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {item.options.map((o) => {
                    const isAnswer = o.id === item.answer;
                    const isPicked = o.id === picked;
                    return (
                      <div
                        key={o.id}
                        style={{
                          display: "flex",
                          gap: 9,
                          padding: "8px 11px",
                          borderRadius: 7,
                          border: `1px solid ${isAnswer ? EXAM.ok : isPicked ? EXAM.bad : EXAM.border}`,
                          background: isAnswer ? "rgba(31,157,87,0.08)" : isPicked ? "rgba(209,67,91,0.07)" : "#fff",
                          fontSize: "0.94rem",
                          color: EXAM.ink,
                          lineHeight: 1.45,
                        }}
                      >
                        <span style={{ fontWeight: 800, minWidth: 16 }}>{o.id}.</span>
                        <span>{o.text}</span>
                        {isAnswer && <span style={{ marginLeft: "auto", color: EXAM.ok }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ExamShell>
    );
  }

  // ── Làm bài ────────────────────────────────────────────────────────────────
  const picked = answers[q.number];
  const answered = Object.keys(answers).length;
  const last = idx === total - 1;

  return (
    <ExamShell
      family="lr"
      testName={`${skill.label} · ${unit.label} · ${testTitle}`}
      questionLabel={`Câu ${q.number} · ${idx + 1}/${total}`}
      exitHref={listHref}
      nav={[
        { label: "Nghe lại", icon: "🔊", onClick: replay, disabled: !q.audio },
        { label: "◀ Trước", onClick: () => setIdx((i) => Math.max(0, i - 1)), disabled: idx === 0 },
        last
          ? { label: `Nộp bài ✓ (${answered}/${total})`, variant: "primary" as const, onClick: () => setDone(true) }
          : { label: "Sau ▶", variant: "primary" as const, onClick: () => setIdx((i) => Math.min(total - 1, i + 1)) },
      ]}
    >
      <ExamDirHeading family="lr">
        {part === 1 ? "Part 1 — Photographs" : "Part 2 — Question-Response"}
      </ExamDirHeading>

      {q.audio ? (
         
        <audio ref={audioRef} src={q.audio} style={{ display: "none" }} />
      ) : (
        <div style={{ background: "rgba(200,135,26,0.09)", border: `1px solid ${EXAM.warn}`, borderRadius: 8, padding: "10px 13px", marginBottom: 14, fontSize: "0.9rem", color: EXAM.inkSoft }}>
          ⚠ Câu này thiếu file audio gốc nên tạm khoá — không tính vào điểm.
        </div>
      )}

      {part === 1 && q.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={q.image}
          alt={`Ảnh câu ${q.number}`}
          style={{ display: "block", width: "100%", maxWidth: imgMaxWidth(q, 560), margin: "0 auto 14px", borderRadius: 8, border: `1px solid ${EXAM.border}` }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 9, padding: "12px 14px", marginBottom: 14 }}>
        <button
          type="button"
          onClick={replay}
          disabled={!q.audio}
          style={{ width: 34, height: 34, borderRadius: "50%", background: q.audio ? color.primary : EXAM.muted, color: "#fff", border: "none", cursor: q.audio ? "pointer" : "not-allowed", fontSize: "0.9rem", flexShrink: 0 }}
        >
          ▶
        </button>
        <div style={{ fontSize: "0.92rem", color: EXAM.inkSoft }}>
          {part === 1
            ? "Nghe 4 câu mô tả (A–D) và chọn câu đúng nhất với bức ảnh."
            : "Nghe câu hỏi và 3 phản hồi (A–C), chọn phản hồi phù hợp nhất."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {q.options.map((o) => {
          const isSel = picked === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o.id)}
              disabled={!q.audio}
              style={{
                flex: "1 1 0",
                minWidth: 64,
                padding: "14px 0",
                borderRadius: 8,
                border: `1.5px solid ${isSel ? color.primary : EXAM.border}`,
                background: isSel ? color.soft : "#fff",
                color: isSel ? color.primary : EXAM.ink,
                fontFamily: EXAM.sans,
                fontSize: "1.05rem",
                fontWeight: 800,
                cursor: q.audio ? "pointer" : "not-allowed",
                opacity: q.audio ? 1 : 0.5,
              }}
            >
              {o.id}
            </button>
          );
        })}
      </div>

      {/* Bảng câu — nhảy nhanh, hiện câu đã chọn */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 18, paddingTop: 13, borderTop: `1px solid ${EXAM.border}` }}>
        {questions.map((x, i) => {
          const cur = i === idx;
          const has = answers[x.number];
          return (
            <button
              key={x.number}
              type="button"
              onClick={() => setIdx(i)}
              style={{
                width: 32,
                height: 30,
                borderRadius: 6,
                border: `1px solid ${cur ? color.primary : EXAM.border}`,
                background: cur ? color.primary : has ? color.soft : "#fff",
                color: cur ? "#fff" : EXAM.inkSoft,
                fontFamily: EXAM.sans,
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {x.number}
            </button>
          );
        })}
      </div>

      {!last && (
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button
            type="button"
            onClick={() => setDone(true)}
            style={{ background: "none", border: "none", color: EXAM.muted, fontFamily: EXAM.sans, fontSize: "0.84rem", cursor: "pointer", textDecoration: "underline" }}
          >
            Nộp bài sớm ({answered}/{total})
          </button>
        </div>
      )}
    </ExamShell>
  );
}
