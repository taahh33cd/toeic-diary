"use client";

import { useState } from "react";
import { FS } from "@/lib/ui/scale";
import {
  THEORY,
  FORMALITY_LADDER,
  PAIR_RULES,
  COMMON_TOPICS,
  buildQuiz,
  type QuizQ,
} from "@/lib/subskills/writing-part2/theory";

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";
const AMBER = "rgb(234,179,8)";

type Mode = "read" | "quiz";

// ─────────────────────────────────────
// Phần đọc
// ─────────────────────────────────────

function PhraseRow({ en, vi, eg }: { en: string; vi?: string; eg?: string }) {
  return (
    <div style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <p style={{ margin: 0, fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5 }}>{en}</p>
      {vi && <p style={{ margin: "2px 0 0", fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.5 }}>{vi}</p>}
      {eg && (
        <p style={{ margin: "5px 0 0", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.55, fontStyle: "italic", borderLeft: "2px solid var(--accent-primary)", paddingLeft: 9 }}>
          {eg}
        </p>
      )}
    </div>
  );
}

function Section({ sec, open, onToggle }: { sec: (typeof THEORY)[number]; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "0.9rem", boxShadow: "var(--shadow-sm)" }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "0.95rem 1.2rem", background: "var(--bg-secondary)", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
      >
        <span style={{ fontSize: FS.xs, fontWeight: 800, color: "var(--accent-primary)", letterSpacing: "0.06em", flexShrink: 0 }}>{sec.num}</span>
        <span style={{ flex: 1, fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{sec.title}</span>
        <span style={{ fontSize: FS.sm, color: "var(--text-muted)", flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div style={{ padding: "1rem 1.2rem", background: "var(--bg-primary)" }}>
          <p style={{ margin: "0 0 1rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.7 }}>{sec.intro}</p>
          {sec.groups.map((g, gi) => (
            <div key={gi} style={{ marginBottom: gi < sec.groups.length - 1 ? "1.3rem" : 0 }}>
              <h3 style={{ margin: "0 0 2px", fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)" }}>{g.title}</h3>
              {g.hint && <p style={{ margin: "0 0 6px", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.55, fontStyle: "italic" }}>{g.hint}</p>}
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {g.phrases.map((p, pi) => <PhraseRow key={pi} {...p} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReadMode() {
  const [openIds, setOpenIds] = useState<string[]>([THEORY[0].id]);
  const allOpen = openIds.length === THEORY.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.7rem" }}>
        <button
          onClick={() => setOpenIds(allOpen ? [] : THEORY.map((s) => s.id))}
          style={{ padding: "5px 12px", fontSize: FS.xs, fontWeight: 600, borderRadius: 6, border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}
        >
          {allOpen ? "Thu gọn tất cả" : "Mở tất cả"}
        </button>
      </div>

      {THEORY.map((sec) => (
        <Section
          key={sec.id}
          sec={sec}
          open={openIds.includes(sec.id)}
          onToggle={() => setOpenIds((prev) => (prev.includes(sec.id) ? prev.filter((x) => x !== sec.id) : [...prev, sec.id]))}
        />
      ))}

      {/* Thang mức trang trọng */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "0.9rem", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ padding: "0.95rem 1.2rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>Thang mức trang trọng của lời chào cuối thư</span>
        </div>
        <div style={{ padding: "0.9rem 1.2rem" }}>
          {FORMALITY_LADDER.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < FORMALITY_LADDER.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ width: 20, flexShrink: 0, textAlign: "center", fontSize: FS.sm }}>{f.safe ? "✓" : "✕"}</span>
              <span style={{ flex: 1, fontSize: FS.sm, fontWeight: 600, color: f.safe ? "var(--text-primary)" : RED, textDecoration: f.safe ? "none" : "line-through" }}>{f.text}</span>
              <span style={{ fontSize: FS.xs, color: "var(--text-muted)", flexShrink: 0 }}>{f.level}</span>
            </div>
          ))}
          <p style={{ margin: "0.8rem 0 0", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Càng xuống dưới càng trang trọng. Trong bài thi TOEIC chỉ dùng những dòng có dấu ✓.
          </p>
        </div>
      </div>

      {/* Quy tắc ghép mở ↔ kết */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "0.9rem", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ padding: "0.95rem 1.2rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>Ghép cặp mở đầu ↔ chào kết</span>
        </div>
        <div style={{ padding: "0.9rem 1.2rem" }}>
          {PAIR_RULES.map((r, i) => (
            <div key={i} style={{ padding: "9px 0", borderBottom: i < PAIR_RULES.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)" }}>
                <span>{r.open}</span>
                <span style={{ color: "var(--accent-primary)" }}>→</span>
                <span>{r.close}</span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: FS.xs, color: "var(--text-muted)" }}>{r.when}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chủ đề thường gặp */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ padding: "0.95rem 1.2rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>Chủ đề thường gặp — doanh nghiệp ↔ khách hàng</span>
        </div>
        <ul style={{ margin: 0, padding: "0.9rem 1.2rem 0.9rem 2.2rem" }}>
          {COMMON_TOPICS.map((t, i) => (
            <li key={i} style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.75 }}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Phần quiz
// ─────────────────────────────────────

const KIND_LABEL: Record<QuizQ["kind"], string> = {
  function: "Nhận diện chức năng",
  blank: "Điền từ còn thiếu",
  pair: "Ghép mở ↔ kết",
  formality: "Mức trang trọng",
};

function QuizMode() {
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrong, setWrong] = useState<QuizQ[]>([]);

  function start(n: number) {
    setQuiz(buildQuiz(n));
    setIdx(0);
    setPicked(null);
    setCorrectCount(0);
    setWrong([]);
  }

  // ── Màn chọn số câu ──
  if (!quiz) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
        <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 1.6rem" }}>
          Quiz được bốc ngẫu nhiên từ chính bảng mẫu câu ở tab bên cạnh. Bốn dạng câu hỏi: nhận diện chức năng,
          điền từ còn thiếu, ghép cặp mở ↔ kết, và nhận biết mức trang trọng.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {[10, 20, 30].map((n) => (
            <button
              key={n}
              onClick={() => start(n)}
              style={{ padding: "10px 24px", border: "1.5px solid var(--accent-primary)", background: n === 20 ? "var(--accent-primary)" : "transparent", color: n === 20 ? "#fff" : "var(--accent-primary)", borderRadius: 8, fontSize: FS.sm, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {n} câu
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Màn kết quả ──
  if (idx >= quiz.length) {
    const score = Math.round((correctCount / quiz.length) * 100);
    const color = score >= 80 ? GREEN : score >= 60 ? AMBER : RED;
    return (
      <div style={{ padding: "2rem 0" }}>
        <div style={{ textAlign: "center", marginBottom: wrong.length ? "2rem" : 0 }}>
          <span style={{ display: "inline-block", fontSize: FS.lg, fontWeight: 800, color, background: color.replace("rgb", "rgba").replace(")", ",0.12)"), border: `2px solid ${color.replace("rgb", "rgba").replace(")", ",0.4)")}`, borderRadius: 12, padding: "8px 22px" }}>
            {score}%
          </span>
          <p style={{ marginTop: "0.8rem", fontSize: FS.sm, color: "var(--text-secondary)" }}>
            {correctCount}/{quiz.length} câu đúng
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: "1.3rem", flexWrap: "wrap" }}>
            <button onClick={() => start(quiz.length)} style={{ padding: "8px 20px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: FS.sm, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Bộ câu hỏi mới</button>
            <button onClick={() => setQuiz(null)} style={{ padding: "8px 20px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: FS.sm, cursor: "pointer", fontFamily: "inherit" }}>Đổi số câu</button>
          </div>
        </div>

        {wrong.length > 0 && (
          <div>
            <h3 style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.7rem" }}>
              {wrong.length} mẫu câu cần xem lại
            </h3>
            {wrong.map((q, i) => (
              <div key={i} style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${RED}`, borderRadius: 8, padding: "0.8rem 1rem", marginBottom: "0.6rem", background: "var(--bg-secondary)" }}>
                {q.stem && <p style={{ margin: "0 0 4px", fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)" }}>{q.stem}</p>}
                <p style={{ margin: 0, fontSize: FS.sm, color: GREEN, fontWeight: 600 }}>→ {q.answer}</p>
                <p style={{ margin: "4px 0 0", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.6 }}>{q.explain}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Đang làm quiz ──
  const q = quiz[idx];
  const answered = picked !== null;

  function pick(opt: string) {
    if (answered) return;
    setPicked(opt);
    if (opt === q.answer) setCorrectCount((c) => c + 1);
    else setWrong((w) => [...w, q]);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
          {KIND_LABEL[q.kind]} · {idx + 1}/{quiz.length}
        </span>
        <button onClick={() => setQuiz(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: FS.xs, cursor: "pointer", padding: 0 }}>← Thoát</button>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 999, marginBottom: "1.4rem" }}>
        <div style={{ height: "100%", width: `${Math.round((idx / quiz.length) * 100)}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.2s" }} />
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.4rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}>
        <p style={{ margin: "0 0 0.7rem", fontSize: FS.sm, color: "var(--text-secondary)", fontWeight: 600 }}>{q.prompt}</p>
        {q.stem && (
          <p style={{ margin: "0 0 1rem", fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.55, padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border)" }}>
            {q.stem}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {q.options.map((opt) => {
            const isPicked = picked === opt;
            const isAns = opt === q.answer;
            let bg = "var(--bg-secondary)";
            let border = "1.5px solid var(--border)";
            let color = "var(--text-primary)";
            if (answered) {
              if (isAns) { bg = "rgba(34,197,94,0.1)"; border = `1.5px solid rgba(34,197,94,0.4)`; color = GREEN; }
              else if (isPicked) { bg = "rgba(239,68,68,0.1)"; border = `1.5px solid rgba(239,68,68,0.4)`; color = RED; }
            }
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                disabled={answered}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: bg, border, borderRadius: 8, cursor: answered ? "default" : "pointer", textAlign: "left", color, fontFamily: "inherit", fontSize: FS.sm, lineHeight: 1.5 }}
              >
                <span style={{ flex: 1 }}>{opt}</span>
                {answered && isAns && <span style={{ flexShrink: 0 }}>✓</span>}
                {answered && isPicked && !isAns && <span style={{ flexShrink: 0 }}>✗</span>}
              </button>
            );
          })}
        </div>

        {answered && <p style={{ margin: "0.9rem 0 0", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.65 }}>{q.explain}</p>}
      </div>

      {answered && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button
            onClick={() => { setPicked(null); setIdx((i) => i + 1); }}
            style={{ padding: "8px 24px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: FS.sm, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {idx < quiz.length - 1 ? "Câu tiếp →" : "Xem kết quả ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Main
// ─────────────────────────────────────

export default function WritingP2Theory() {
  const [mode, setMode] = useState<Mode>("read");

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: "1.4rem", borderBottom: "1px solid var(--border)" }}>
        {([["read", "Đọc lý thuyết"], ["quiz", "Làm quiz"]] as [Mode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{ padding: "9px 18px", border: "none", background: "none", borderBottom: `2px solid ${mode === m ? "var(--accent-primary)" : "transparent"}`, color: mode === m ? "var(--accent-primary)" : "var(--text-muted)", fontSize: FS.sm, fontWeight: mode === m ? 700 : 500, cursor: "pointer", fontFamily: "inherit", marginBottom: -1 }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "read" ? <ReadMode /> : <QuizMode />}
    </div>
  );
}
